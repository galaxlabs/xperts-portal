import importlib

import frappe
from cclms.api import portal


@frappe.whitelist()
def sync_locations(since: str = None):
	return importlib.reload(portal).sync_locations(since)
