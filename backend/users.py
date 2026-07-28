import frappe
from frappe.utils.password import update_password


@frappe.whitelist()
def list_portal_users():
	company = frappe.db.get_value("Portal Profile", {"user": frappe.session.user, "enabled": 1}, "company")
	profiles = frappe.get_all("Portal Profile",
		filters={"company": company} if company else {},
		fields=["name", "user", "role_type", "enabled", "modified"],
		order_by="modified desc",
	)
	return {"users": profiles}


@frappe.whitelist()
def create_company_user(email: str, full_name: str, password: str = None):
	company = frappe.db.get_value("Portal Profile", {"user": frappe.session.user, "enabled": 1}, "company")
	if not company:
		frappe.throw("No company linked to your account.", frappe.PermissionError)
	if frappe.db.exists("User", email):
		frappe.throw("User already exists.")

	user_doc = frappe.get_doc({
		"doctype": "User",
		"email": email,
		"first_name": full_name.split(" ")[0],
		"full_name": full_name,
		"enabled": 1,
		"user_type": "System User",
		"send_welcome_email": 0,
		"roles": [{"role": "Portal User"}],
	})
	user_doc.insert(ignore_permissions=True)
	if password:
		update_password(email, password)

	profile = frappe.get_doc({
		"doctype": "Portal Profile",
		"user": email,
		"company": company,
		"role_type": "Portal User",
		"enabled": 1,
	})
	profile.insert(ignore_permissions=True)
	frappe.db.commit()
	return {"user": email, "profile": profile.name}


@frappe.whitelist()
def change_password(current_password: str, new_password: str):
	if frappe.session.user == "Guest":
		frappe.throw("Authentication required.", frappe.PermissionError)
	from frappe.utils.password import check_password
	try:
		check_password(frappe.session.user, current_password)
	except Exception:
		frappe.throw("Current password is incorrect.")
	update_password(frappe.session.user, new_password)
	return {"status": "password_changed"}
