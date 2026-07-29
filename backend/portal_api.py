import importlib

import frappe
from cclms.api import portal

# Existing Frappe workers may have cached portal.py before deployment. Loading this
# fresh endpoint reloads the canonical module once without requiring a supervisor restart.
portal = importlib.reload(portal)


@frappe.whitelist(allow_guest=True)
def get_portal_config():
	return portal.get_portal_config()


@frappe.whitelist()
def get_dashboard():
	return portal.get_dashboard()


@frappe.whitelist()
def list_locations(limit: int = 50, status: str = None):
	return portal.list_locations(limit, status)


@frappe.whitelist()
def get_location(name: str):
	return portal.get_location(name)


@frappe.whitelist()
def update_location(name: str, data: dict):
	return portal.update_location(name, data)


@frappe.whitelist()
def execute_action(doctype: str, name: str, action: str, install_date: str = None):
	return portal.execute_action(doctype, name, action, install_date)
