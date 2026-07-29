import importlib

import frappe
from cclms.api import portal


def _portal():
	return importlib.reload(portal)


@frappe.whitelist()
def get_company_profile():
	return _portal().get_company_profile()


@frappe.whitelist()
def update_company_profile(data: dict):
	return _portal().update_company_profile(data)
