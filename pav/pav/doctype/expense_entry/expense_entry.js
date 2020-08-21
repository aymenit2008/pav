// Copyright (c) 2020, Ahmed Mohammed Alkuhlani and contributors
// For license information, please see license.txt


frappe.provide("pav.pav");

pav.pav.ExpenseEntryController = frappe.ui.form.Controller.extend({
    amount: function (doc, cdt, cdn) {
        var child = locals[cdt][cdn];
        frappe.model.set_value(cdt, cdn, 'base_amount', child.amount * doc.conversion_rate);
    },

    expense_type: function (doc, cdt, cdn) {
        var d = locals[cdt][cdn];
        if (!doc.company) {
            frappe.msgprint(__("Please set the Company"));
            this.frm.refresh_fields();
            return;
        }

        if (!d.expense_type) {
            return;
        }
        /*if(doc.account_currency != doc.currency) {
        d.expense_type = "";
        frappe.msgprint(__("Not Same Currency"));
        this.frm.refresh_fields();
        return;
        }*/

        return frappe.call({
            method: "pav.pav.doctype.expense_entry.expense_entry.get_expense_entry_account",
            args: {
                "expense_claim_type": d.expense_type,
                "company": doc.company
            },
            callback: function (r) {
                if (r.message) {
                    d.default_account = r.message.account;
                    d.account_currency = r.message.account_currency;
                    if (doc.payment_currency != r.message.account_currency) {
                        frappe.msgprint(__("Expense Currency Same Payment Currency Must to be same"));
                    }
                }
            }
        });
    }
});

$.extend(cur_frm.cscript, new pav.pav.ExpenseEntryController({
        frm: cur_frm
    }));

cur_frm.add_fetch('expense_type', 'description', 'description');

cur_frm.cscript.onload = function (doc) {
    if (doc.__islocal) {
        cur_frm.set_value("posting_date", frappe.datetime.get_today());
        //cur_frm.cscript.clear_sanctioned(doc);
    }
};

cur_frm.cscript.set_help = function (doc) {
    cur_frm.set_intro("");
    if (doc.__islocal && !in_list(frappe.user_roles, "HR User")) {
        cur_frm.set_intro(__("Fill the form and save it"));
    }
};

cur_frm.cscript.validate = function (doc) {
    $.each(doc.expenses || [], function (i, d) {
        if (doc.payment_currency != d.account_currency) {
		frappe.throw(__("Not Same Currency in Row "+(i+1)));
	}

        /*if (doc.default_currency != d.account_currency) {
            frappe.throw(__("Not Same Currency"));
        }*/
        d.base_amount = d.amount * doc.conversion_rate
            if (!d.cost_center) {
		if (doc.cost_center){
	                d.cost_center = doc.cost_center
		}
		else{
			frappe.throw(__("Please set Cost Center"));
		}

            }
            if (!d.project) {
		if (doc.project){
	                d.project = doc.project
		}
            }

    });
    cur_frm.cscript.calculate_total(doc);
};

cur_frm.cscript.calculate_total = function (doc) {
    doc.total_amount = 0;
    doc.base_total_amount = 0;
    $.each((doc.expenses || []), function (i, d) {
        doc.total_amount += d.amount;
        doc.base_total_amount += d.base_amount;
    });
};

cur_frm.cscript.calculate_total_amount = function (doc, cdt, cdn) {
    cur_frm.cscript.calculate_total(doc, cdt, cdn);
};

erpnext.expense_claim = {
    set_title: function (frm) {
        if (!frm.doc.task) {
            frm.set_value("title", "Test Title");
        } else {
            frm.set_value("title", "Test Title" + " for " + frm.doc.task);
        }
    }
};

cur_frm.fields_dict['task'].get_query = function (doc) {
    return {
        filters: {
            'project': doc.project
        }
    };
};

frappe.ui.form.on("Expense Entry", {
    setup: function (frm) {
        frm.trigger("set_query_for_cost_center");
        frm.add_fetch("company", "cost_center", "cost_center");
    },

    onload: function (frm) {},

    refresh: function (frm) {
        //frm.trigger("toggle_fields");

        if (frm.doc.docstatus === 1) {
            frm.add_custom_button(__('Accounting Ledger'), function () {
                frappe.route_options = {
                    voucher_no: frm.doc.name,
                    company: frm.doc.company,
                    group_by_voucher: false
                };
                frappe.set_route("query-report", "General Ledger");
            }, __("View"));
        }
    },

    calculate_grand_total: function (frm) {
        var grand_total = flt(frm.doc.total_sanctioned_amount);
        frm.set_value("grand_total", grand_total);
        frm.refresh_fields();
    },

    set_query_for_cost_center: function (frm) {
        frm.fields_dict["cost_center"].get_query = function () {
            return {
                filters: {
                    "company": frm.doc.company,
                    "is_group": 0
                }
            };
        };
    },

    mode_of_payment: function (frm) {
        if (!frm.doc.default_currency) {
            frm.set_value("mode_of_payment", "");
            frm.set_value("payment_account", "");
            frm.set_value("payment_currency", "");
            frappe.msgprint(__("Please set Currency Company First"));
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
                    cur_frm.refresh_field('payment_currency');
                    //frm.trigger("currency");

                    //

                    console.log("hh")
                    console.log(r.message.account_currency)
                    if (r.message.account_currency == frm.doc.default_currency) {
                        frm.set_value("conversion_rate", 1);
                    } else if (frm.doc.conversion_rate == 1 && r.message.account_currency && frm.doc.default_currency) {
                        frappe.call({
                            method: "erpnext.setup.utils.get_exchange_rate",
                            args: {
                                from_currency: r.message.account_currency,
                                to_currency: frm.doc.default_currency,
                                transaction_date: frm.doc.posting_date
                            },
                            callback: function (r, rt) {
                                frm.set_value("conversion_rate", r.message);
                            }
                        })
                    }
                    if (r.message.account_currency_currency && cur_frm.doc.default_currency) {
                        var default_label = __(frappe.meta.docfield_map[cur_frm.doctype]["conversion_rate"].label);
                        cur_frm.fields_dict.conversion_rate.set_label(default_label +
                            repl(" (1 %(r.message.account_currency)s = [?] %(default_currency)s)", cur_frm.doc));
                    }

                } else {
                    console.log("yyyyyyyy")
                    frm.set_value("payment_account", "");
                    frm.set_value("mode_of_payment", "");
                    frm.refresh_fields();
                    return;
                }
                    frm.refresh_fields();

            }
        });
        console.log(frm.doc.payment_account)
    },

});