from __future__ import unicode_literals
from frappe import _

def get_data():
	return [
		{
			"label": _("Accounting"),
			"items": [
				{
					"type": "doctype",
					"name": "Expense Entry",
					"description":_("Expense Entry"),
					"onboard": 1,
					"dependencies": ["Expense Claim Type"],
				}
			]
		},
	]