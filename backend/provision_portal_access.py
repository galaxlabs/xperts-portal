import frappe
from frappe.utils.password import update_password


ACTIVE_COMPANIES = {
	"Athena": "admin@vyntrix.com",
	"Bit Stop": "admin@bitstop.com",
	"ByteFederal": "admin@vyntrix.com",
	"Coin Works": "admin@coinworks.com",
	"Crypto Base": "admin@cryptobase.com",
	"Insta Bit": "admin@instabit.com",
	"Rocket Coin": "admin@rocketcoin.com",
	"Un Bank": "admin@unbank.com",
	"CoinConnections": "admin@coinconnections.com",
	"CoinFlip ATM": "admin@coinflipatm.com",
	"CoinFlip BTM": "admin@coinflipbtm.com",
}


def run(password):
	"""Seed missing operator companies and consolidate portal-only access."""
	for operator in frappe.get_all("Operator", fields=["name", "operator_name"]):
		company = operator.operator_name or operator.name
		if not frappe.db.exists("Operator Companies", company):
			frappe.get_doc({"doctype": "Operator Companies", "operator_name": company, "active": 0}).insert(ignore_permissions=True)

	frappe.db.set_value("Operator Companies", {}, "active", 0, update_modified=False)
	for company in ACTIVE_COMPANIES:
		frappe.db.set_value("Operator Companies", company, "active", 1, update_modified=False)

	if not frappe.db.exists("User", "admin@vyntrix.com"):
		user = frappe.get_doc({
			"doctype": "User",
			"email": "admin@vyntrix.com",
			"first_name": "Vyntrix",
			"full_name": "Admin Vyntrix",
			"enabled": 1,
			"user_type": "System User",
			"send_welcome_email": 0,
			"roles": [{"role": "Portal User"}],
		})
		user.insert(ignore_permissions=True)
	update_password("admin@vyntrix.com", password)

	retained_users = set(ACTIVE_COMPANIES.values())
	for profile in frappe.get_all("Portal Profile", fields=["name", "user"]):
		frappe.db.set_value("Portal Profile", profile.name, "enabled", int(profile.user in retained_users), update_modified=False)
		if profile.user not in retained_users:
			frappe.db.set_value("User", profile.user, "enabled", 0, update_modified=False)

	for user, companies in {
		"admin@vyntrix.com": ["Athena", "ByteFederal"],
		"admin@bitstop.com": ["Bit Stop"],
		"admin@coinworks.com": ["Coin Works"],
		"admin@cryptobase.com": ["Crypto Base"],
		"admin@instabit.com": ["Insta Bit"],
		"admin@rocketcoin.com": ["Rocket Coin"],
		"admin@unbank.com": ["Un Bank"],
		"admin@coinconnections.com": ["CoinConnections"],
		"admin@coinflipatm.com": ["CoinFlip ATM"],
		"admin@coinflipbtm.com": ["CoinFlip BTM"],
	}.items():
		if not frappe.db.exists("User", user):
			user_doc = frappe.get_doc({
				"doctype": "User",
				"email": user,
				"first_name": companies[0],
				"full_name": f"Admin {companies[0]}",
				"enabled": 1,
				"user_type": "System User",
				"send_welcome_email": 0,
				"roles": [{"role": "Portal User"}],
			})
			user_doc.insert(ignore_permissions=True)
			update_password(user, password)
		frappe.db.set_value("User", user, "enabled", 1, update_modified=False)
		profile_name = frappe.db.get_value("Portal Profile", {"user": user}, "name")
		if profile_name:
			profile = frappe.get_doc("Portal Profile", profile_name)
			profile.company = companies[0]
			profile.enabled = 1
			profile.role_type = "Company Admin"
			profile.set("companies", [{"company": company} for company in companies])
			profile.save(ignore_permissions=True)
		else:
			frappe.get_doc({
				"doctype": "Portal Profile",
				"user": user,
				"company": companies[0],
				"companies": [{"company": company} for company in companies],
				"role_type": "Company Admin",
				"enabled": 1,
			}).insert(ignore_permissions=True)

	frappe.db.commit()
	return {"active_companies": list(ACTIVE_COMPANIES), "active_users": sorted(retained_users)}
