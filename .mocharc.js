"use strict";

module.exports = {
	slow: 1000,
	specPattern: /atom-specs\.js/i,
	require: [
		"./node_modules/chai/register-expect.js",
		"./node_modules/chai/register-should.js",
	],
};
