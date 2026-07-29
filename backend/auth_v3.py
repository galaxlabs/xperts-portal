import frappe


def get_active_companies(user):
	profile = frappe.db.get_value(
		"Portal Profile", {"user": user, "enabled": 1}, ["name", "company", "role_type"], as_dict=True
	)
	if not profile:
		return [], None
	companies = [profile.company] if profile.company else []
	companies.extend(frappe.get_all("Portal Profile Company", filters={"parent": profile.name}, pluck="company"))
	active = frappe.get_all("Operator Companies", filters={"name": ["in", list(set(companies))], "active": 1}, pluck="name")
	return active, profile


@frappe.whitelist(allow_guest=True)
def get_current_user():
	if frappe.session.user == "Guest":
		return {"is_authenticated": False, "user": None}

	companies, profile = get_active_companies(frappe.session.user)
	if not companies:
		return {"is_authenticated": False, "user": None}

	roles = frappe.get_roles(frappe.session.user)
	return {
		"is_authenticated": True,
		"user": frappe.session.user,
		"full_name": frappe.db.get_value("User", frappe.session.user, "full_name"),
		"user_image": frappe.db.get_value("User", frappe.session.user, "user_image"),
		"roles": roles,
		"role_type": profile.role_type,
		"company": companies[0],
		"companies": companies,
		"is_manager": "System Manager" in roles,
	}
