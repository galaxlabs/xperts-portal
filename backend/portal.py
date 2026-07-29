import frappe

TRANSITIONS = {
	"Pending Review": {
		"actions": {
			"approve": {"to": "Approved"},
			"reject": {"to": "Rejected"},
		},
	},
	"Approved": {
		"actions": {
			"send_agreement": {"to": "Agreement Sent"},
			"reject": {"to": "Rejected"},
		},
	},
	"Agreement Sent": {
		"actions": {
			"request_signature": {"to": "Pending Sign"},
			"reject": {"to": "Rejected"},
		},
	},
	"Pending Sign": {
		"actions": {
			"sign": {"to": "Signed"},
			"reject": {"to": "Rejected"},
		},
	},
	"Signed": {
		"actions": {
			"install": {"to": "Installed"},
			"cancel": {"to": "Cancelled"},
		},
	},
	"Installed": {
		"actions": {
			"go_live": {"to": "Live"},
		},
	},
	"Rejected": {
		"actions": {
			"reopen": {"to": "Pending"},
		},
	},
}

WORKFLOW_TO_PORTAL = {
	"Pending": "Pending Review",
	"Approved": "Approved",
	"Rejected": "Rejected",
	"Agreement Sent": "Agreement Sent",
	"Pending Sign": "Pending Sign",
	"Signed": "Signed",
	"Installed": "Installed",
	"Live": "Live",
	"Cancelled": "Cancelled",
}
PORTAL_TO_WORKFLOW = {portal: workflow for workflow, portal in WORKFLOW_TO_PORTAL.items()}


def _get_user_companies():
	if frappe.session.user == "Guest":
		frappe.throw("Authentication required", frappe.PermissionError)
	profile = frappe.db.get_value(
		"Portal Profile", {"user": frappe.session.user, "enabled": 1}, ["name", "company"], as_dict=True
	)
	if not profile:
		frappe.throw("Portal access is not enabled for this user", frappe.PermissionError)
	companies = [profile.company] if profile.company else []
	companies.extend(
		frappe.get_all("Portal Profile Company", filters={"parent": profile.name}, pluck="company")
	)
	active_companies = frappe.get_all(
		"Operator Companies", filters={"name": ["in", list(set(companies))], "active": 1}, pluck="name"
	)
	if not active_companies:
		frappe.throw("No active operator company is assigned to this portal user", frappe.PermissionError)
	return active_companies


def _get_user_company():
	return _get_user_companies()[0]


def _location_filters(companies, status=None):
	filters = [["company", "in", companies], ["workflow_state", "in", list(WORKFLOW_TO_PORTAL)]]
	if status:
		workflow_state = PORTAL_TO_WORKFLOW.get(status)
		if not workflow_state:
			frappe.throw("Unsupported location status.")
		filters.append(["workflow_state", "=", workflow_state])
	return filters


def _state_matches(rule, state, state_code):
	return (
		str(rule.get("state") or "").strip().casefold() == str(state or "").strip().casefold()
		or str(rule.get("state_code") or "").strip().casefold() == str(state_code or "").strip().casefold()
	)


def _company_allows_state(company, state, state_code):
	company_doc = frappe.get_cached_doc("Operator Companies", company)
	permitted = company_doc.get("state_name") or []
	if permitted:
		return any(_state_matches(rule, state, state_code) for rule in permitted)
	restricted = company_doc.get("restricted_states") or []
	return not any(_state_matches(rule, state, state_code) for rule in restricted)


def _company_allows_business_type(company, business_type):
	company_doc = frappe.get_cached_doc("Operator Companies", company)
	restricted_types = {row.restricted_business for row in company_doc.get("restricted_type") or []}
	return business_type not in restricted_types


def _can_access_location(doc, companies):
	return (
		doc.company in companies
		and _company_allows_state(doc.company, doc.state, doc.state_code)
		and _company_allows_business_type(doc.company, doc.business_type)
	)


def _portal_location(row):
	row["status"] = WORKFLOW_TO_PORTAL.get(row.pop("workflow_state", None))
	return row


@frappe.whitelist(allow_guest=True)
def get_portal_config():
	user = frappe.session.user
	if user == "Guest":
		return {
			"branding": {
				"brand_name": "Xperts Global CRM",
				"brand_subtitle": "Location Intelligence",
				"logo": None,
				"primary_color": "#1F1F25",
				"secondary_color": "#0D0D0D",
			},
			"available_pages": [],
		}

	companies = _get_user_companies()
	company = companies[0]
	is_manager = "System Manager" in frappe.get_roles(user)
	profile = frappe.db.get_value("Portal Profile", {"user": user, "enabled": 1},
		["company", "role_type"], as_dict=True)

	branding = _get_branding(company)
	available_pages = ["dashboard", "locations", "settings", "profile"]
	if is_manager:
		available_pages.append("users")

	return {
		"branding": branding,
		"available_pages": available_pages,
		"company": company,
		"companies": companies,
		"role_type": profile.get("role_type") if profile else "Portal User",
		"is_manager": is_manager,
		"dashboard_method": "cclms.api.portal.get_dashboard",
	}


def _get_branding(company_name):
	if company_name and frappe.db.exists("Operator Companies", company_name):
		doc = frappe.get_doc("Operator Companies", company_name)
		return {
			"brand_name": doc.get("operator_name") or "Xperts Global CRM",
			"brand_subtitle": "Location Intelligence",
			"logo": None,
			"primary_color": "#1F1F25",
			"secondary_color": "#0D0D0D",
		}
	return {
		"brand_name": "Xperts Global CRM",
		"brand_subtitle": "Location Intelligence",
		"logo": doc.get("logo"),
		"primary_color": "#1F1F25",
		"secondary_color": "#0D0D0D",
	}


@frappe.whitelist()
def get_dashboard():
	companies = _get_user_companies()
	filters = _location_filters(companies)

	all_leads = frappe.get_all("ATM Leads", fields=["workflow_state", "company", "state", "state_code", "business_type"], filters=filters)
	status_counts = {}
	for l in all_leads:
		if not _can_access_location(l, companies):
			continue
		status = WORKFLOW_TO_PORTAL[l["workflow_state"]]
		status_counts[status] = status_counts.get(status, 0) + 1

	recent = frappe.get_all("ATM Leads",
		fields=["name", "business_name", "business_type", "owner_name", "full_address", "city", "state", "state_code", "company", "workflow_state", "creation", "modified"],
		filters=filters,
		order_by="modified desc",
		limit=100,
	)

	return {
		"counts": {
		"total": sum(status_counts.values()),
			"by_status": status_counts,
		},
		"recent": [_portal_location(row) for row in recent if _can_access_location(row, companies)][:10],
	}


@frappe.whitelist()
def list_locations(limit: int = 50, status: str = None):
	companies = _get_user_companies()
	filters = _location_filters(companies, status)

	rows = frappe.get_all("ATM Leads",
		fields=["name", "business_name", "business_type", "owner_name", "full_address", "city", "state", "state_code", "zip_code", "company", "workflow_state", "creation", "modified"],
		filters=filters,
		order_by="modified desc",
		limit_page_length=1000,
	)
	rows = [row for row in rows if _can_access_location(row, companies)]
	return {"rows": [_portal_location(row) for row in rows[:min(int(limit), 200)]]}


@frappe.whitelist()
def get_location(name: str):
	companies = _get_user_companies()
	doc = frappe.get_doc("ATM Leads", name)
	if not _can_access_location(doc, companies):
		frappe.throw("Not permitted", frappe.PermissionError)
	return _portal_location(doc.as_dict())


@frappe.whitelist()
def update_location(name: str, data: dict):
	companies = _get_user_companies()
	doc = frappe.get_doc("ATM Leads", name)
	if not _can_access_location(doc, companies):
		frappe.throw("Not permitted", frappe.PermissionError)
	allowed = {"business_name", "owner_name", "full_address", "city", "state", "zip_code", "notes"}
	changed = False
	for key, value in data.items():
		if key in allowed and value is not None:
			setattr(doc, key, value)
			changed = True
	if not changed:
		frappe.throw("No valid fields provided.")
	doc.save(ignore_permissions=True)
	frappe.db.commit()
	return doc.as_dict()


@frappe.whitelist()
def create_location(data: dict):
	companies = _get_user_companies()
	company = data.get("company") or companies[0]
	if company not in companies:
		frappe.throw("Not permitted", frappe.PermissionError)
	if not _company_allows_state(company, data.get("state"), data.get("state_code")):
		frappe.throw("This state is not available for the selected operator company", frappe.PermissionError)
	if not _company_allows_business_type(company, data.get("business_type")):
		frappe.throw("This business type is restricted for the selected operator company", frappe.PermissionError)
	allowed = {"business_name", "business_type", "owner_name", "full_address", "city", "state", "state_code", "zip_code", "notes"}
	doc = frappe.get_doc({"doctype": "ATM Leads", "company": company, **{key: value for key, value in data.items() if key in allowed}})
	doc.insert(ignore_permissions=True)
	return _portal_location(doc.as_dict())


@frappe.whitelist()
def execute_action(doctype: str, name: str, action: str, install_date: str = None):
	if doctype not in {"ATM Lead", "ATM Leads"}:
		frappe.throw("Unsupported doctype.")
	companies = _get_user_companies()
	doc = frappe.get_doc("ATM Leads", name)
	if not _can_access_location(doc, companies):
		frappe.throw("Not permitted", frappe.PermissionError)

	current = WORKFLOW_TO_PORTAL.get(doc.workflow_state)
	config = TRANSITIONS.get(current)
	if not config or action not in config.get("actions", {}):
		frappe.throw(f"Action '{action}' not available from status '{current}'")

	action_def = config["actions"][action]
	updates = {"workflow_state": action_def["to"]}
	if action == "install":
		if not install_date:
			frappe.throw("An installation date is required.")
		updates["install_date"] = install_date
	# Desk permissions do not grant Portal User access to ATM Leads. The company
	# check above is the authorization boundary for this purpose-built portal API.
	frappe.db.set_value("ATM Leads", doc.name, updates, update_modified=True)
	frappe.db.commit()
	return {"name": doc.name, "status": WORKFLOW_TO_PORTAL[action_def["to"]], "message": "Installation scheduled" if action == "install" else "Location updated"}
