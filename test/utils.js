"use strict";

module.exports = {
	delay(ms){
		return new Promise(done => {
			setTimeout(done, ms);
		});
	},

	confirm(el){
		return "object" === typeof atom
			? atom.commands.dispatch(el, "core:confirm")
			: forceFormSubmission(el);
	},

	cancel(el){
		if("object" === typeof atom)
			return atom.commands.dispatch(el, "core:cancel");
		el.value = "";
		forceFormSubmission(el);
	},
};

function forceFormSubmission(el){
	let form;
	if(el instanceof HTMLFormElement)
		el.submit();
	if((form = el.form) && (form instanceof HTMLFormElement))
		form.submit();
	else if(form = el.closest("form"))
		form.submit();
	else console.error("Could not locate nearest form to submit!");
}
