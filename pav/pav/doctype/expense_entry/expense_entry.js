// Copyright (c) 2020, Ahmed Mohammed Alkuhlani and contributors
// For license information, please see license.txt


frappe.provide("pav.pav");

pav.pav.ExpenseEntryController = frappe.ui.form.Controller.extend({
	amount: function(doc, cdt, cdn) {
		var child = locals[cdt][cdn];
		frappe.model.set_value(cdt, cdn, 'base_amount', child.amount * doc.conversion_rate);
	},

	expense_type: function(doc, cdt, cdn) {
		var d = locals[cdt][cdn];
		if(!doc.company) {
			d.expense_type = "";
			frappe.msgprint(__("Please set the Company"));
			this.frm.refresh_fields();
			return;
		}

		if(!d.expense_type) {
			return;
		}
		/*if(doc.account_currency != doc.currency) {
			d.expense_type = "";
			frappe.msgprint(__("Not Same Currency"));
			this.frm.refresh_fields();
			return;
		}*/

		return frappe.call({
			method: "erpnext.hr.doctype.expense_claim.expense_claim.get_expense_claim_account",
			args: {
				"expense_claim_type": d.expense_type,
				"company": doc.company
			},
			callback: function(r) {
				if (r.message) {
					d.default_account = r.message.account;
				}
			}
		});
	}
});

$.extend(cur_frm.cscript, new pav.pav.ExpenseEntryController({frm: cur_frm}));

cur_frm.add_fetch('expense_type','description','description');

cur_frm.cscript.onload = function(doc) {
	if (doc.__islocal) {
		cur_frm.set_value("posting_date", frappe.datetime.get_today());
		//cur_frm.cscript.clear_sanctioned(doc);
	}

};

cur_frm.cscript.set_help = function(doc) {
	cur_frm.set_intro("");
	if(doc.__islocal && !in_list(frappe.user_roles, "HR User")) {
		cur_frm.set_intro(__("Fill the form and save it"));
	}
};

cur_frm.cscript.validate = function(doc) {
	$.each(doc.expenses || [], function(i, d) {
		if(doc.default_currency!=d.account_currency){
			frappe.msgprint(__("Not Same Currency"));
		}
		d.base_amount= d.amount * doc.conversion_rate
		if (!d.cost_center){
			d.cost_center=doc.cost_center
		}

	});
	cur_frm.cscript.calculate_total(doc);
};

cur_frm.cscript.calculate_total = function(doc){
	doc.total_amount = 0;
	doc.base_total_amount=0;
	$.each((doc.expenses || []), function(i, d) {
		doc.total_amount += d.amount;
		doc.base_total_amount += d.base_amount;
	});
};

cur_frm.cscript.calculate_total_amount = function(doc,cdt,cdn){
	cur_frm.cscript.calculate_total(doc,cdt,cdn);
};

erpnext.expense_claim = {
	set_title :function(frm) {
		if (!frm.doc.task) {
			frm.set_value("title", "Test Title");
		}
		else {
			frm.set_value("title", "Test Title" + " for "+ frm.doc.task);
		}
	}
};

cur_frm.fields_dict['task'].get_query = function(doc) {
	return {
		filters:{
			'project': doc.project
		}
	};
};

frappe.ui.form.on("Expense Entry", {




		
	set_conversion_rate_label: function() {
		if(cur_frm.doc.currency && cur_frm.doc.default_currency) {
			var default_label = __(frappe.meta.docfield_map[cur_frm.doctype]["conversion_rate"].label);
			cur_frm.fields_dict.conversion_rate.set_label(default_label + 
				repl(" (1 %(currency)s = [?] %(default_currency)s)", cur_frm.doc));
		}
	},
	set_amount_conversion_rate_label: function() {
		if(cur_frm.doc.amount_currency && cur_frm.doc.currency) {
			var default_label = __(frappe.meta.docfield_map[cur_frm.doctype]["amount_conversion_rate"].label);
			cur_frm.fields_dict.amount_conversion_rate.set_label(default_label + 
				repl(" (1 %(amount_currency)s = [?] %(currency)s)", cur_frm.doc));
		}
	},

	currency: function(frm) {
		console.log("hh")
		if (frm.doc.currency == frm.doc.default_currency) {
			frm.set_value("conversion_rate", 1);
		} else if(frm.doc.conversion_rate==1 && frm.doc.currency && frm.doc.default_currency){
			frappe.call({
				method: "erpnext.setup.utils.get_exchange_rate",
				args: {
					from_currency: frm.doc.currency,
					to_currency: frm.doc.default_currency,
					transaction_date: frm.doc.posting_date
				},
				callback: function(r, rt) {
					frm.set_value("conversion_rate", r.message);
				}
			})			
		}
		if(frm.doc.amount_conversion_rate == 1 && frm.doc.amount_currency && frm.doc.currency){
			frappe.call({
				method: "erpnext.setup.utils.get_exchange_rate",
				args: {
					from_currency: frm.doc.amount_currency,
					to_currency: frm.doc.currency,
					transaction_date: frm.doc.posting_date
				},
				callback: function(r, rt) {
					frm.set_value("amount_conversion_rate", r.message);
				}
			})			
		}

		frm.trigger("set_conversion_rate_label");
		frm.trigger("set_amount_conversion_rate_label");

		//frm.trigger("amount_currency");

	},
	amount_currency :function(frm) {
		if (frm.doc.amount_currency == frm.doc.currency) {
			frm.set_value("amount_conversion_rate", 1);
		} else if(frm.doc.amount_conversion_rate == 1 && frm.doc.amount_currency && frm.doc.currency){
			frappe.call({
				method: "erpnext.setup.utils.get_exchange_rate",
				args: {
					from_currency: frm.doc.amount_currency,
					to_currency: frm.doc.currency,
					transaction_date: frm.doc.posting_date
				},
				callback: function(r, rt) {
					frm.set_value("amount_conversion_rate", r.message);
				}
			})			
		}
		if(frm.doc.conversion_rate==1 && frm.doc.currency && frm.doc.default_currency){
			frappe.call({
				method: "erpnext.setup.utils.get_exchange_rate",
				args: {
					from_currency: frm.doc.currency,
					to_currency: frm.doc.default_currency,
					transaction_date: frm.doc.posting_date
				},
				callback: function(r, rt) {
					frm.set_value("conversion_rate", r.message);
				}
			})			
		}
		frm.trigger("set_conversion_rate_label");

		frm.trigger("set_amount_conversion_rate_label");
		//frm.trigger("currency");
	},
	setup: function(frm) {
		frm.trigger("set_query_for_cost_center");
		frm.trigger("set_query_for_payable_account");
		frm.add_fetch("company", "cost_center", "cost_center");
	},

	onload: function(frm) {
	},

	refresh: function(frm) {
		//frm.trigger("toggle_fields");

		if(frm.doc.docstatus === 1) {
			frm.add_custom_button(__('Accounting Ledger'), function() {
				frappe.route_options = {
					voucher_no: frm.doc.name,
					company: frm.doc.company,
					group_by_voucher: false
				};
				frappe.set_route("query-report", "General Ledger");
			}, __("View"));
		}
	},

	calculate_grand_total: function(frm) {
		var grand_total = flt(frm.doc.total_sanctioned_amount) ;
		frm.set_value("grand_total", grand_total);
		frm.refresh_fields();
	},

	set_query_for_cost_center: function(frm) {
		frm.fields_dict["cost_center"].get_query = function() {
			return {
				filters: {
					"company": frm.doc.company,
					"is_group": 0
				}
			};
		};
	},

	set_query_for_payable_account: function(frm) {
		/*frm.fields_dict["payment_account"].get_query = function() {
			return {
				filters: {
					"report_type": "Balance Sheet",
					"account_type": "Cash",
					"company": frm.doc.company,
					"is_group": 0
				}
			};
		};*/
	},

	mode_of_payment: function(frm) {
		if (!frm.doc.currency){
			cur_frm.set_value("payment_account", "");
			frappe.msgprint(__("Please set Currency First"));
			this.frm.refresh_fields();
			return;

		}
		frappe.call({
		    method: "pav.pav.doctype.expense_entry.expense_entry.get_payment_account",
		    args: {
		        "mode_of_payment": frm.doc.mode_of_payment,
		        "company": frm.doc.company
		    },
		    callback: function (r) {
		        if (r.message) {
		            cur_frm.set_value("payment_account", r.message.account);
		            frm.refresh_fields();

		        } else {
		            console.log("yyyyyyyy")
		            frm.set_value("payment_account", "");
		            frm.set_value("mode_of_payment", "");
		            frm.refresh_fields();
		            return;
		        }
		    }
		});
			console.log(frm.doc.payment_account)
		},



});
