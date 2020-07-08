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
				},
				{
					"type": "doctype",
					"name": "Project Dimension",
					"description":_("Project Dimension"),
					"onboard": 1,
					"dependencies": ["Project"],
				},
				{
					"type": "doctype",
					"name": "Project Activities",
					"description":_("Project Activities"),
					"onboard": 1,
					"dependencies": ["Project Dimension"],
				},
			]
		},
	]