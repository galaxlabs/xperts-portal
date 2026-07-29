import importlib

import frappe
from cclms.api import portal


@frappe.whitelist()
def list_locations(page: int = 1, page_size: int = 25, status: str = None, search: str = None):
	return importlib.reload(portal).list_locations(page, page_size, status, search)
