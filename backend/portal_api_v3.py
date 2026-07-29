import importlib

import frappe
from cclms.api import portal


def _portal():
	return importlib.reload(portal)


@frappe.whitelist(allow_guest=True)
def get_portal_config():
	return _portal().get_portal_config()


@frappe.whitelist()
def get_dashboard():
	return _portal().get_dashboard()


@frappe.whitelist()
def list_locations(limit: int = 50, status: str = None):
	return _portal().list_locations(limit, status)


@frappe.whitelist()
def get_location(name: str):
	return _portal().get_location(name)


@frappe.whitelist()
def update_location(name: str, data: dict):
	return _portal().update_location(name, data)


@frappe.whitelist()
def execute_action(doctype: str, name: str, action: str, install_date: str = None):
	return _portal().execute_action(doctype, name, action, install_date)
