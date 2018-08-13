"use strict";

module.exports = {
	delay(ms){
		return new Promise(done => {
			setTimeout(done, ms);
		});
	},

	confirm(el){
		return atom.commands.dispatch(el, "core:confirm");
	},

	cancel(el){
		return atom.commands.dispatch(el, "core:cancel");
	},
};
