"use strict";

module.exports = {
	delay(ms){
		return new Promise(done => {
			setTimeout(done, ms);
		});
	},

	confirm(el){
		if("object" === typeof atom)
			return atom.commands.dispatch(el, "core:confirm");
		el.dispatchEvent(new KeyboardEvent("keydown", {keyCode: 13}));
	},

	cancel(el){
		if("object" === typeof atom)
			return atom.commands.dispatch(el, "core:cancel");
		el.value = "";
		el.dispatchEvent(new KeyboardEvent("keydown", {keyCode: 27}));
	},
};
