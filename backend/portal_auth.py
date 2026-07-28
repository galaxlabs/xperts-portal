import frappe
from frappe.auth import LoginManager


@frappe.whitelist(allow_guest=True)
def login():
	"""Authenticate enabled portal users without the site-wide OTP challenge."""
	login_manager = LoginManager()
	login_manager.authenticate()

	if not frappe.db.exists("Portal Profile", {"user": login_manager.user, "enabled": 1}):
		login_manager.fail("Portal access is not enabled for this user", user=login_manager.user)

	if login_manager.force_user_to_reset_password():
		doc = frappe.get_doc("User", login_manager.user)
		frappe.local.response["redirect_to"] = doc.reset_password(send_email=False, password_expired=True)
		frappe.local.response["message"] = "Password Reset"
		return

	frappe.form_dict.pop("pwd", None)
	login_manager.post_login()
