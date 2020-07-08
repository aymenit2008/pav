## PAV

Partner Added Value

requirments for project activities
Custom field in Project
Is Program -> Check -> is_program
#Custom Script for project
this.frm.dashboard.add_transactions([
	{	    
		'items': [
			'Budget',
			'Project Activities'
		],
		'label': 'Budget & Project Activities'
	}	
]);

#Server Script for project - before insert
if doc.is_program==1:
    frappe.get_doc(dict(
            doctype = 'Project Dimension',
            project_code = doc.name,
            status = doc.status,
            project_code = doc.name
        )).insert()

#### License

MIT
