"use strict";

module.exports = {
	slow: 1000,
	specPattern: /atom-specs\.js/i,
	require: [
		"chai/register-expect",
		"chai/register-should",
	],
};
