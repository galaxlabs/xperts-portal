import frappe

@frappe.whitelist(allow_guest=True)
def get_current_user():
	if frappe.session.user == "Guest":
		return {"is_authenticated": False, "user": None}

	user = frappe.session.user
	full_name = frappe.db.get_value("User", user, "full_name")
	roles = frappe.get_roles(user)
	is_manager = "System Manager" in roles

	profile = frappe.db.get_value("Portal Profile", {"user": user, "enabled": 1},
		["company", "role_type"], as_dict=True)
	company = profile.get("company") if profile else None
	role_type = profile.get("role_type") if profile else ("Admin" if is_manager else "Portal User")

	return {
		"is_authenticated": True,
		"user": user,
		"full_name": full_name,
		"roles": roles,
		"role_type": role_type,
		"company": company,
		"is_manager": is_manager,
	}
