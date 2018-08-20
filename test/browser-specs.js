window.atom = "object" === typeof atom;
(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (process,global){
"use strict";

global.Mocha  = window.mocha;
global.Chai   = window.chai;
global.expect = Chai.expect;


/** Check if an element contains one or more CSS classes */
addToChai(["class", "classes"], function(...classNames){
	Chai.util.flag(this, "negate");
	let subjects  = Chai.util.flag(this, "object");
	subjects      = "length" in subjects ? Array.from(subjects) : [subjects];
	
	for(const subject of subjects){
		const classList = subject.classList;
		for(let names of classNames){
			if(!Array.isArray(names))
				names = names.split(/\s+/g);
			
			for(let name of names){
				const list = subject.classList.length
					? `classList "${subject.className}"`
					: "empty classList";
				
				this.assert(
					classList.contains(name),
					`expected ${list} to include "${name}"`,
					`expected ${list} not to include "${name}"`
				);
			}
		}
	}
});


/** Assert that two filesystem paths are the same */
Chai.Assertion.addMethod("equalPath", function(path){
	const normalise = require("path").normalize;
	const subject   = Chai.util.flag(this, "object");
	const expected  = normalise(path);
	const actual    = normalise(subject);
	
	this.assert(
		actual === expected,
		"expected path #{act} to equal #{exp}",
		"expected path #{act} not to equal #{exp}",
		expected,
		actual,
		false
	);
});


/** Assert that a file exists in the filesystem */
Chai.Assertion.addProperty("existOnDisk", function(){
	const path = Chai.util.flag(this, "object");
	let exists = false;
	
	try{
		require("fs").statSync(path);
		exists = true;
	} catch(e){}
	
	this.assert(
		exists,
		`expected "${path}" to exist in filesystem`,
		`expected "${path}" not to exist in filesystem`
	);
});


/** Assert that an HTML element has user focus */
Chai.Assertion.addProperty("focus", function(){
	const ae = document.activeElement;
	
	let subject = Chai.util.flag(this, "object");
	if(subject.jquery)
		subject = subject[0];
	
	this.assert(
		ae === subject || ae.contains(subject),
		"expected element to have focus",
		"expected element not to have focus"
	);
});


/** Assert that an HTML element is rendered in the DOM tree */
Chai.Assertion.addProperty("drawn", function(){
	let subject = Chai.util.flag(this, "object");
	if(subject.jquery)
		subject = subject[0];
	
	const bounds = subject.getBoundingClientRect();
	const {top, right, bottom, left} = bounds;
	
	this.assert(
		!(0 === top && 0 === right && 0 === bottom && 0 === left),
		"expected element to be drawn",
		"expected element not to be drawn"
	);
});


/** Attach one or more HTML elements to the spec-runner window */
global.attachToDOM = function(...elements){
	if(isHeadless()){
		const {body} = document;
		for(const el of elements)
			if(!body.contains(el))
				body.appendChild(el);
	}
	else{
		const mocha = document.querySelector("#mocha");
		const body  = mocha.parentElement;
		for(const el of elements)
			if(el !== mocha && !body.contains(el))
				body.insertBefore(el, mocha);
	}
};


/** Remove previously-added HTML elements */
global.resetDOM = function(){
	if(isHeadless()){
		while(document.body.firstChild)
			document.body.removeChild(document.body.firstChild);
	}
	else{
		const mocha = document.querySelector("#mocha");
		for(const el of Array.from(document.body.children))
			if(el !== mocha) document.body.removeChild(el);
	}
};


/**
 * @global - Predicate to skip POSIX-only tests.
 * This avoids marking skipped tests as "pending" if run on Windows.
 *
 * @example
 * unlessOnWindows.describe("Symlinks", …);
 * unlessOnWindows.it("tests hard-links", …);
 * unlessOnWindows(posixOnlyFunc => …);
 *
 * @property {Function} describe
 * @property {Function} specify
 * @property {Function} it
 * @type {Function}
 */
global.unlessOnWindows = (mochFn => {
	const noope = () => {};
	const isWin = "win32" === process.platform;
	const output = cb => (cb && !isWin) ? cb() : noope();
	for(const name of mochFn){
		const value = isWin ? noope : (...args) => global[name](...args);
		Object.defineProperty(output, name, {value});
	}
	return output;
})(["describe", "it", "specify"]);


/**
 * Call `describe()` with "When " prepended to its description.
 *
 * Complements the `autoIt` setting and helps specs read more naturally.
 * Only globalised if `when` doesn't exist in global scope.
 *
 * @example when("it loads the page", () => it("does this", fn)));
 * @param {String} text
 * @param {...*} args
 * @type {Function}
 */
function when(text, ...args){
	return describe("When " + text, ...args);
}

if(null == global.when)
	global.when = when;


/** Thin wrapper around Chai.Assertion.addMethod to permit plugin aliases */
function addToChai(names, fn){
	for(const name of names)
		Chai.Assertion.addMethod(name, fn);
}


/**
 * Determine whether specs are being run headlessly.
 *
 * @return {Boolean}
 * @internal
 */
function isHeadless(){
	return global.atom.getLoadSettings().headless;
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":4,"chai":2,"fs":2,"mocha":2,"path":3}],2:[function(require,module,exports){

},{}],3:[function(require,module,exports){
(function (process){
// .dirname, .basename, and .extname methods are extracted from Node.js v8.11.1,
// backported and transplited with Babel, with backwards-compat fixes

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function (path) {
  if (typeof path !== 'string') path = path + '';
  if (path.length === 0) return '.';
  var code = path.charCodeAt(0);
  var hasRoot = code === 47 /*/*/;
  var end = -1;
  var matchedSlash = true;
  for (var i = path.length - 1; i >= 1; --i) {
    code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        if (!matchedSlash) {
          end = i;
          break;
        }
      } else {
      // We saw the first non-path separator
      matchedSlash = false;
    }
  }

  if (end === -1) return hasRoot ? '/' : '.';
  if (hasRoot && end === 1) {
    // return '//';
    // Backwards-compat fix:
    return '/';
  }
  return path.slice(0, end);
};

function basename(path) {
  if (typeof path !== 'string') path = path + '';

  var start = 0;
  var end = -1;
  var matchedSlash = true;
  var i;

  for (i = path.length - 1; i >= 0; --i) {
    if (path.charCodeAt(i) === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          start = i + 1;
          break;
        }
      } else if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // path component
      matchedSlash = false;
      end = i + 1;
    }
  }

  if (end === -1) return '';
  return path.slice(start, end);
}

// Uses a mixed approach for backwards-compatibility, as ext behavior changed
// in new Node.js versions, so only basename() above is backported here
exports.basename = function (path, ext) {
  var f = basename(path);
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};

exports.extname = function (path) {
  if (typeof path !== 'string') path = path + '';
  var startDot = -1;
  var startPart = 0;
  var end = -1;
  var matchedSlash = true;
  // Track the state of characters (if any) we see before our first dot and
  // after any path separator we find
  var preDotState = 0;
  for (var i = path.length - 1; i >= 0; --i) {
    var code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          startPart = i + 1;
          break;
        }
        continue;
      }
    if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // extension
      matchedSlash = false;
      end = i + 1;
    }
    if (code === 46 /*.*/) {
        // If this is our first dot, mark it as the start of our extension
        if (startDot === -1)
          startDot = i;
        else if (preDotState !== 1)
          preDotState = 1;
    } else if (startDot !== -1) {
      // We saw a non-dot and non-path separator before our dot, so we should
      // have a good chance at having a non-empty extension
      preDotState = -1;
    }
  }

  if (startDot === -1 || end === -1 ||
      // We saw a non-dot character immediately before the dot
      preDotState === 0 ||
      // The (right-most) trimmed path component is exactly '..'
      preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
    return '';
  }
  return path.slice(startDot, end);
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":4}],4:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],5:[function(require,module,exports){
(function (global){
"use strict";

const atom = "object" === typeof global && global.atom;
const currentPrompts = new WeakMap();
const internalValues = new WeakMap();


/**
 * Modal dialogue for asynchronously prompting users for their input.
 * @class
 */
class PromptView{
	
	/**
	 * Instantiate a new {@link PromptView} instance.
	 * 
	 * @param {Object} [opts={}] - Initial property values
	 * @constructor
	 */
	constructor(opts = {}){
		internalValues.set(this, {
			autoFocus: true,
			autoHide: false,
			autoHideHandler: null,
		});
		
		// Setup DOM
		this.buildTree(opts = this.normaliseProps(opts));
		if(atom){
			this.panel = atom.workspace.addModalPanel({visible: false, item: this});
			atom.commands.add(this.inputField.element, {
				"core:confirm": () => this.confirm(this.input),
				"core:cancel":  () => this.confirm(null),
			});
		}
		else this.inputField.element.addEventListener("keydown", event => {
			switch(event.keyCode){
				case 13: this.confirm(this.input); break;
				case 27: this.confirm(null);       break;
			}
		});
		
		// Assign initial property values
		this.assignProps({
			autoHide:     true,
			elementClass: "prompt",
			headerClass:  "prompt-header",
			footerClass:  "prompt-footer",
		}, opts);
	}
	
	
	/**
	 * Construct the elements which compose the {@link PromptView}'s modal dialogue.
	 *
	 * @param {Object} [opts={}]
	 * @returns {PromptView} Reference to the calling instance
	 * @internal
	 */
	buildTree(opts = {}){
		const {
			elementTagName = "div",
			headerTagName  = "header",
			footerTagName  = "footer",
		} = opts;
		
		/**
		 * @property {HTMLElement} element
		 * @description Top-level wrapper representing {@link PromptView} in Atom's workspace.
		 *
		 * @property {HTMLElement} headerElement
		 * @description Content block displayed above {@link #inputField}, empty unless
		 * {@link headerText} or {@link headerHTML} has been assigned content.
		 *
		 * @property {TextEditor|HTMLFormElement} inputField
		 * @description Miniature editing bar where user types their input.
		 * 
		 * @property {HTMLElement} footerElement
		 * @description Content block displayed below {@link #inputField}, empty
		 * unless {@link headerText} or {@link headerHTML} have been assigned content.
		 */

		this.element       = document.createElement(elementTagName);
		this.headerElement = document.createElement(headerTagName);
		this.footerElement = document.createElement(footerTagName);
		this.element.append(this.headerElement, this.footerElement);
		
		if(atom){
			this.inputField = atom.workspace.buildTextEditor({mini: true, softTabs: false});
			this.element.insertBefore(this.inputField.element, this.footerElement);
		}
		else{
			this.inputField = this.buildFakeEditor();
			this.element.insertBefore(this.inputField, this.footerElement);
			this.element.hidden = "dialog" !== this.elementTagName;
			document.body.appendChild(this.element);
		}
		
		return this;
	}
	
	
	/**
	 * Construct a synthetic {@link TextEditor} component for browser environments.
	 *
	 * @param {Object} [opts={}]
	 * @return {HTMLFormElement}
	 * @internal
	 */
	buildFakeEditor(opts = {}){
		
		// Entry field
		const input = document.createElement("input");
		input.type = "text";
		
		// Surrogate editor component
		const form = document.createElement("form");
		Object.assign(form, {
			element: form.appendChild(input),
			getText: () => input.value,
			setText: to => input.value = to,
			getPlaceholderText: () => input.placeholder,
			setPlaceholderText: to => input.placeholder = to,
		});

		// Hidden submission button
		const submit = document.createElement("input");
		Object.assign(form.appendChild(submit), {
			type: "submit",
			value: "Confirm",
			hidden: true,
		});
		
		// Confirmation handlers
		for(const el of [input, form])
			el.addEventListener("submit", event => {
				this.confirm(input.value);
				event.preventDefault();
			});
		
		// Special handling for <dialog> tags if author's using one
		if("dialog" === opts.elementTagName){
			form.method = "dialog";
			this.panel = {
				show: () => form.show(),
				hide: () => form.close(),
			};
		}
		return form;
	}
	
	
	/**
	 * Update the instance's properties using values extracted from objects.
	 *
	 * @example view.assignProps({headerText: "Hello, world"});
	 * @param {...Object} opts
	 * @return {PromptView}
	 */
	assignProps(...opts){
		opts = Object.assign({}, ...opts);
		
		// Delete anything which isn't assigned normally
		delete opts.elementTagName;
		delete opts.headerTagName;
		delete opts.footerTagName;
		
		Object.assign(this, opts);
		return this;
	}
	
	
	/**
	 * Normalise a value expected to provide instance properties.
	 *
	 * Strings are treated as shorthand for setting `headerText`;
	 * objects are returned unmodified. Other types are invalid.
	 *
	 * @example view.normaliseProps("Title") == {headerText: "Title"};
	 * @throws {TypeError} If input isn't an object or string
	 * @param {*} input
	 * @return {Object}
	 */
	normaliseProps(input){
		switch(typeof input){
			case "string": return {headerText: input};
			case "object": return input;
		}
		const message = `Object or string expected when ${typeof input} given`;
		throw new TypeError(message);
	}
	
	
	/**
	 * Present the dialogue to the user, resolving once they confirm an answer.
	 *
	 * @async
	 * @param {Object} [opts={}]
	 *    Instance properties to update.
	 * @return {Promise}
	 *    Resolves to a {@link String} containing the user's input, or
	 *    the `null` value if the prompt was cancelled for any reason.
	 * @example
	 *    <caption>A user is prompted and responds with <code>dd(1)</code></caption>
	 *    new PromptView().promptUser({
	 *        headerText: "Enter the name of a manual-page",
	 *        footerHTML: "E.g., <code>perl</code>, <code>grep(5)</code>",
	 *    }).then(response => "dd(1)");
	 * @public
	 */
	promptUser(opts = {}){
		
		// Return existing prompt which hasn't been confirmed yet
		const prompt = currentPrompts.get(this);
		if(prompt)
			return prompt.promise;
		
		// Otherwise, start a new one
		else{
			this.input = "";
			this.assignProps(this, opts);
			this.show();
			
			let handler = null;
			const promise = new Promise(fn => handler = fn);
			currentPrompts.set(this, {promise, handler});
			return promise;
		}
	}
	
	
	/**
	 * Confirm user's response and invoke any unresolved prompt-handler.
	 * 
	 * @param {String|null} input - Null values indicate cancelled prompts.
	 * @internal
	 */
	confirm(input){
		const prompt = currentPrompts.get(this);
		if(!prompt) return;
		currentPrompts.delete(this);
		
		this.input = "";
		this.hide();
		
		if("function" === typeof prompt.handler)
			prompt.handler.call(null, input);
	}
	
	
	/**
	 * Reveal prompt-view and set focus without altering prompt state.
	 * @internal
	 */
	show(){
		this.autoFocus && this.saveFocus();
		if(atom && this.panel)
			this.panel.show();
		else ("dialog" === this.elementTagName)
			? this.element.show()
			: this.element.hidden = false;
		this.autoFocus && this.inputField.element.focus();
	}
	
	
	/**
	 * Hide prompt-view and restore focus without resolving current prompt.
	 * @internal
	 */
	hide(){
		if(atom && this.panel)
			this.panel.hide();
		else ("dialog" === this.elementTagName)
			? this.element.close()
			: this.element.hidden = true;
		this.autoFocus && this.restoreFocus();
	}
	
	
	/**
	 * Save whatever DOM element has user focus before displaying a dialogue.
	 * @internal
	 */
	saveFocus(){
		this.previouslyFocussedElement = document.activeElement || null;
	}
	
	
	/**
	 * Restore focus to whatever element was holding it at the time the PromptView
	 * has been open. If the original element no longer exists in the DOM, focus is
	 * shifted to {@link atom.workspace.element} as a last resort.
	 * @internal
	 */
	restoreFocus(){
		const el = this.previouslyFocussedElement;
		this.previouslyFocussedElement = null;
		if(el && document.documentElement.contains(el))
			el.focus()
		else atom
			? atom.workspace.element.focus()
			: document.body.focus();
	}
	
	
	/**
	 * @property {Boolean} [autoFocus=true]
	 * @description Set and restore focus when toggling prompt.
	 */
	get autoFocus(){
		return internalValues.get(this).autoFocus;
	}
	set autoFocus(to){
		const data = internalValues.get(this);
		if((to = !!to) === data.autoFocus) return;
		data.autoFocus = to;
		if(!to && this.previouslyFocussedElement)
			this.previouslyFocussedElement = null;
	}
	
	
	/**
	 * @property {Boolean} [autoHide=true]
	 * @description Hide the prompt upon losing focus.
	 */
	get autoHide(){
		return internalValues.get(this).autoHide;
	}
	set autoHide(to){
		const data = internalValues.get(this);
		if((to = !!to) === data.autoHide) return;
		switch(data.autoHide = to){
			case true:
				data.autoHideHandler = () => this.confirm(null);
				this.inputField.element.addEventListener("blur", data.autoHideHandler);
				break;
			case false:
				this.inputField.element.removeEventListener("blur", data.autoHideHandler);
				data.autoHideHandler = null;
				break;
		}
	}
	
	
	/**
	 * @readonly
	 * @property {String} [elementTagName="div"]
	 * @description Name of the HTML tag used to create {@link #headerElement}.
	 * This property can only be set during construction, using the original
	 * option-hash passed to the constructor function.
	 */
	get elementTagName(){
		return this.element
			? this.element.tagName.toLowerCase()
			: "";
	}


	/**
	 * @property {String} elementClass
	 * @description List of CSS classes assigned to instance's wrapper {@link #element}.
	 */
	get elementClass(){
		return this.element
			? this.element.className
			: "";
	}
	set elementClass(to){
		if(this.element)
			this.element.className = to;
	}


	/**
	 * @readonly
	 * @property {String} [headerTagName="header"]
	 * @description Name of the HTML tag used to create {@link #headerElement}.
	 * This property can only be set during construction, using the original
	 * option-hash passed to the constructor function.
	 */
	get headerTagName(){
		return this.headerElement
			? this.headerElement.tagName.toLowerCase()
			: "";
	}
	
	/**
	 * @property {String} headerClass
	 * @description List of CSS classes assigned to instance's {@link #headerElement}.
	 */
	get headerClass(){
		return this.headerElement
			? this.headerElement.className
			: "";
	}
	set headerClass(to){
		if(this.headerElement)
			this.headerElement.className = to;
	}
	
	
	/**
	 * @property {String} headerText
	 * @description A plain-text representation of the {@link #headerElement}'s content.
	 */
	get headerText(){
		return this.headerElement
			? this.headerElement.textContent
			: "";
	}
	set headerText(to){
		if(this.headerElement)
			this.headerElement.textContent = to;
	}
	
	
	/**
	 * @property {String} headerHTML
	 * @description HTML representation of the {@link #headerElement|header}'s contents.
	 */
	get headerHTML(){
		return this.headerElement
			? this.headerElement.innerHTML
			: "";
	}
	set headerHTML(to){
		if(this.headerElement)
			this.headerElement.innerHTML = to;
	}


	/**
	 * @readonly
	 * @property {String} [footerTagName="footer"]
	 * @description Name of the HTML tag used to create {@link #footerElement}.
	 * This property can only be set during construction, using the original
	 * option-hash passed to the constructor function.
	 */
	get footerTagName(){
		return this.footerElement
			? this.footerElement.tagName.toLowerCase()
			: "";
	}


	/**
	 * @property {String} footerClass
	 * @description List of CSS classes assigned to instance's {@link #footerElement}.
	 */
	get footerClass(){
		return this.footerElement
			? this.footerElement.className
			: "";
	}
	set footerClass(to){
		if(this.footerElement)
			this.footerElement.className = to;
	}
	
	
	/**
	 * @property {String} footerText
	 * @description A plain-text representation of the {@link #footerElement}'s content.
	 */
	get footerText(){
		return this.footerElement
			? this.footerElement.textContent
			: "";
	}
	set footerText(to){
		if(this.footerElement)
			this.footerElement.textContent = to;
	}
	
	
	/**
	 * @property {String} footerHTML
	 * @description HTML representation of the {@link #footerElement|footer}'s contents.
	 */
	get footerHTML(){
		return this.footerElement
			? this.footerElement.innerHTML
			: "";
	}
	set footerHTML(to){
		if(this.footerElement)
			this.footerElement.innerHTML = to;
	}
	
	
	/**
	 * @property {String} input
	 * @description Text currently entered into the instance's {@link #inputField}.
	 * Writing to this property will replace whatever text has been entered in the field.
	 */
	get input(){
		return this.inputField
			? this.inputField.getText()
			: "";
	}
	set input(to){
		if(this.inputField)
			this.inputField.setText(to);
	}
	
	
	/**
	 * @readonly
	 * @property {Boolean} [isPending=false]
	 * @description Whether the view is waiting for user to confirm their input.
	 */
	get isPending(){
		const prompt = currentPrompts.get(this);
		return !!(prompt && prompt.promise instanceof Promise);
	}
	
	
	/**
	 * @property {String} [placeholder=""]
	 * @description Placeholder text displayed by {@link #inputField} when empty.
	 */
	get placeholder(){
		return this.inputField
			? this.inputField.getPlaceholderText() || ""
			: "";
	}
	set placeholder(to){
		if(this.inputField)
			this.inputField.setPlaceholderText(to);
	}
}


// Node.js or another CommonJS-like system
if("object" === typeof module && "object" === typeof module.exports)
	module.exports = PromptView;

// Browser export
else if("object" === typeof window && window instanceof window.Window)
	window.PromptView = PromptView;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],6:[function(require,module,exports){
"use strict";

const Chai = window.chai;
const {expect} = Chai;
Chai.should();

describe("PromptView", () => {
	const {delay, cancel, confirm} = require("./utils.js");
	const PromptView = require("../prompt-view.js");
	
	let paneEditor = null;
	before("Setting up workspace", async () => {
		if(atom){
			attachToDOM(atom.workspace.getElement());
			paneEditor = await atom.workspace.open();
			paneEditor.element.focus();
		}
		else{
			// Make a bogus TextEditor/pane item
			const element = document.createElement("textarea");
			element.resize = false;
			Object.assign(element.style, {
				position: "fixed",
				opacity: 0,
				right:   0,
				bottom:  0,
				height: "10px",
				width:  "10px",
			});
			const component = {get focused(){ return document.activeElement === element; }};
			paneEditor = {element, component};
			document.body.appendChild(element);
		}
	});
	
	when("constructed", () => {
		let prompt = null;
		before(() => prompt = new PromptView());
		
		it("keeps the view hidden", () =>
			expect(prompt.element).to.exist.and.not.be.drawn);
		
		when("initialised with an object argument", () => {
			it("sets header and footer text", () => {
				const prompt = new PromptView({
					headerHTML: "<b>Header</b>",
					footerHTML: "<i>Footer</i>",
				});
				prompt.headerElement.textContent.should.equal("Header");
				prompt.headerElement.innerHTML.should.equal("<b>Header</b>");
				prompt.footerElement.textContent.should.equal("Footer");
				prompt.footerElement.innerHTML.should.equal("<i>Footer</i>");
			});

			it("sets element classes", () => {
				const prompt = new PromptView({
					elementClass: "popup",
					headerClass:  "popup-head",
					footerClass:  "popup-foot",
				});
				prompt.element.should.have.class("popup").and.not.have.class("prompt");
				prompt.headerElement.should.have.class("popup-head").and.not.have.class("prompt-header");
				prompt.footerElement.should.have.class("popup-foot").and.not.have.class("prompt-footer");
			});

			it("lets tag-types be specified", () => {
				const prompt = new PromptView({
					elementTagName: "details",
					headerTagName: "legend",
					footerTagName: "div",
				});
				prompt.element.should.be.an.instanceOf(HTMLDetailsElement);
				prompt.element.tagName.should.equal("DETAILS");
				prompt.headerElement.should.be.an.instanceOf(HTMLLegendElement);
				prompt.footerElement.should.be.an.instanceOf(HTMLDivElement);
				prompt.headerElement.tagName.should.equal("LEGEND");
				prompt.footerElement.tagName.should.equal("DIV");
			});
			
			it("sets placeholder text", () => {
				const prompt = new PromptView({placeholder: "ABC"});
				prompt.placeholder.should.equal("ABC");
			});

			it("stores unrecognised options as instance properties", () => {
				const bar = {};
				const prompt = new PromptView({foo: bar});
				prompt.should.have.property("foo").that.equals(bar);
			});
		});
		
		when("initialised when a string argument", () =>
			it("treats it as shorthand for setting headerText", () => {
				const prompt = new PromptView("Header");
				prompt.headerElement.textContent.should.equal("Header");
				prompt.headerElement.innerHTML.should.equal("Header");
				prompt.footerElement.textContent.should.equal("");
				prompt.footerElement.innerHTML.should.equal("");
				prompt.headerHTML = "<b>Foo</b>";
				prompt.headerElement.textContent.should.equal("Foo");
			}));

		when("initialised when no arguments", () => {
			it('defaults to <div class="prompt"> as its container', () => {
				prompt.element.should.be.an.instanceOf(HTMLElement);
				prompt.element.tagName.should.equal("DIV");
				prompt.element.className.should.equal("prompt");
			});
			
			it('defaults to <header class="prompt-header"> as its header', () => {
				expect(prompt.headerElement).to.exist;
				prompt.headerElement.should.be.an.instanceOf(HTMLElement);
				prompt.headerElement.tagName.should.equal("HEADER");
				prompt.headerElement.className.should.equal("prompt-header");
				prompt.element.contains(prompt.headerElement).should.be.true;
				prompt.element.firstChild.should.equal(prompt.headerElement);
			});
			
			it('defaults to <footer class="prompt-footer"> as its footer', () => {
				expect(prompt.footerElement).to.exist;
				prompt.footerElement.should.be.an.instanceOf(HTMLElement);
				prompt.footerElement.tagName.should.equal("FOOTER");
				prompt.footerElement.className.should.equal("prompt-footer");
				prompt.element.contains(prompt.footerElement).should.be.true;
				prompt.element.lastChild.should.equal(prompt.footerElement);
			});
			
			it("defaults to the empty string as its placeholder text", () =>
				prompt.placeholder.should.equal(""));
		});

		when("initialised with any other type of argument", () =>
			it("throws an error", () => {
				expect(() => new PromptView(true)).to.throw("Object or string expected when boolean given");
				expect(() => new PromptView(42.8)).to.throw("Object or string expected when number given");
			}));
		
		it("lets properties be modified after construction", () => {
			const prompt = new PromptView();
			prompt.headerText = "Header";
			prompt.footerText = "Footer";
			prompt.headerClass = "header-thing";
			prompt.footerClass = "footer-thing";
			prompt.placeholder = "Enter something";
			prompt.headerElement.textContent.should.equal("Header");
			prompt.footerElement.textContent.should.equal("Footer");
			prompt.headerElement.should.have.class("header-thing");
			prompt.footerElement.should.have.class("footer-thing");
			prompt.placeholder.should.equal("Enter something");
		});
		
		it("lets properties be cleared after construction", () => {
			const prompt = new PromptView({
				headerText: "Header",
				footerText: "Footer",
				headerClass: "header-thing",
				footerClass: "footer-thing",
				placeholder: "Enter something",
			});
			prompt.headerText = "";
			prompt.footerText = "";
			prompt.headerClass = "";
			prompt.footerClass = "";
			prompt.placeholder = "";
			prompt.headerElement.textContent.should.equal("");
			prompt.footerElement.textContent.should.equal("");
			prompt.headerElement.className.should.equal("");
			prompt.footerElement.className.should.equal("");
			prompt.placeholder.should.equal("");
		});
	});
	
	
	let answer = "";
	let prompt = null;
	let elements = null;
	
	when("the user is prompted", () => {
		before(() => {
			prompt = new PromptView();
			elements = [prompt.element, prompt.headerElement, prompt.footerElement];
		});
		
		it("displays the view", () => {
			prompt.element.contains(document.activeElement).should.be.false;
			prompt.element.should.not.be.drawn;
			prompt.promptUser({
				headerText: "Enter a number",
				footerHTML: "Just type <code>42</code>.",
				elementClass: "calc-prompt",
				headerClass: "calc-header",
				footerClass: "calc-footer",
				placeholder: "Any number.",
			}).then(value => answer = value);
			prompt.element.should.be.drawn;
		});
		
		it("shifts focus to the input field", () =>
			prompt.element.contains(document.activeElement).should.be.true);
		
		it("marks it as pending", () =>
			prompt.should.have.property("isPending").that.equals(true));
		
		it("updates header and footer text", () => {
			prompt.headerText.should.equal("Enter a number");
			prompt.footerText.should.equal("Just type 42.");
			prompt.footerHTML.should.equal("Just type <code>42</code>.");
		});
		
		it("updates element classes", () => {
			prompt.element.should.have.class("calc-prompt");
			prompt.headerElement.should.have.class("calc-header");
			prompt.footerElement.should.have.class("calc-footer");
		});
		
		it("updates placeholder text", () =>
			prompt.placeholder.should.equal("Any number."));
	});
	
	when("the user responds", () => {
		it("resolves the handler with their answer", async () => {
			prompt.input = "42, obviously.";
			confirm(prompt.inputField.element);
			await delay(50);
			answer.should.equal("42, obviously.");
		});
		
		it("hides the view", () =>
			prompt.element.should.not.be.drawn);
		
		it("clears the entry field", () =>
			prompt.input.should.equal(""));
		
		it("restores focus to the previously-active element", () =>
			prompt.element.contains(document.activeElement).should.be.false);
		
		it("retains its placeholder text", () =>
			prompt.placeholder.should.equal("Any number."));
	});
	
	when("rerunning the prompt", () => {
		const args = {
			headerText: "Enter another number",
			footerHTML: "<small>Uh, please.</small>",
		};
		
		when("already prompting", () => {
			let originalPromise;
			let callCount = 0;
			const handler = value => { ++callCount; answer += value; };
			before(() => answer = "");
			
			it("reuses the original Promise", () => {
				originalPromise = prompt.promptUser(args);
				originalPromise.then(handler);
				const secondPromise = prompt.promptUser(args);
				secondPromise.should.equal(originalPromise);
			});
			
			it("doesn't care if parameters differ", () => {
				prompt.promptUser({
					headerText: "This gets ignored",
					footerText: "At least it should.",
				}).should.equal(originalPromise);
				prompt.headerText.should.equal(args.headerText);
				prompt.footerHTML.should.equal(args.footerHTML);
				prompt.footerText.should.equal("Uh, please.");
			});
			
			it("calls the prompt-handler only once", async () => {
				prompt.input = "53";
				confirm(prompt.inputField.element);
				await delay(50);
				prompt.element.should.not.be.drawn;
				callCount.should.equal(1);
				answer.should.equal("53");
			});
		});
		
		when("already finished", () => {
			it("displays the view a second time", () => {
				prompt.element.should.not.be.drawn;
				prompt.promptUser(args).then(value => answer = value);
				prompt.element.should.be.drawn;
				const [element, header, footer] = elements;
				prompt.element.should.equal(element);
				prompt.headerElement.should.equal(header);
				prompt.footerElement.should.equal(footer);
			});

			it("shifts focus to the entry field", () =>
				prompt.element.contains(document.activeElement).should.be.true);

			it("updates headers and footers with new text", () => {
				prompt.headerElement.textContent.should.equal("Enter another number");
				prompt.footerElement.textContent.should.equal("Uh, please.");
				prompt.footerElement.innerHTML.should.equal("<small>Uh, please.</small>");
			});
		});
	});
	
	when("the user cancels", () => {
		it("resolves the handler with a null value", async () => {
			answer.should.equal("53");
			prompt.input = "53";
			cancel(prompt.inputField.element);
			await delay(50);
			expect(answer).to.be.null;
		});
		
		it("hides the view", () =>
			prompt.element.should.not.be.drawn);
		
		it("clears the entry field", () =>
			prompt.input.should.equal(""));
		
		it("restores focus to the previously-active element", () =>
			prompt.element.contains(document.activeElement).should.be.false);
	});
	
	when("losing input focus", () => {
		let prompt = null;
		before(() => {
			paneEditor.element.focus();
			paneEditor.component.focused.should.be.true;
			prompt = new PromptView({headerText: "Enter anything"});
		});
		
		when("autoHide is enabled", () =>
			it("aborts the current prompt", async () => {
				prompt.promptUser();
				prompt.element.should.be.drawn;
				prompt.element.contains(document.activeElement).should.be.true;
				prompt.input = "Anything";
				await delay(50);
				paneEditor.element.focus();
				prompt.element.should.not.be.drawn;
				prompt.element.contains(document.activeElement).should.be.false;
			}));
		
		when("autoHide is disabled", () => {
			it("keeps the view open", async () => {
				let result = null;
				prompt.promptUser({autoHide: false}).then(value => result = value);
				prompt.element.should.be.drawn;
				prompt.element.contains(document.activeElement).should.be.true;
				prompt.input.should.equal("");
				prompt.input = "Something";
				
				await delay(50);
				paneEditor.element.focus();
				prompt.element.should.be.drawn;
				prompt.element.contains(document.activeElement).should.be.false;
				prompt.input.should.equal("Something");
				
				prompt.inputField.element.focus();
				prompt.element.contains(document.activeElement).should.be.true;
				confirm(prompt.inputField.element);
				await delay(50);
				expect(result).to.equal("Something");
				prompt.element.should.not.be.drawn;
				prompt.element.contains(document.activeElement).should.be.false;
			});
			
			it("doesn't care if autoHide was set when opened", async () => {
				let result = null;
				prompt = new PromptView();
				prompt.promptUser({headerText: "Take 1"}).then(value => result = value);
				expect(prompt.previouslyFocussedElement).not.to.be.null;
				prompt.input = "Answer 1";
				prompt.autoHide.should.be.true;
				
				prompt.autoHide = false;
				prompt.autoHide.should.be.false;
				paneEditor.element.focus();
				paneEditor.component.focused.should.be.true;
				prompt.element.should.be.drawn;
				prompt.element.contains(document.activeElement).should.be.false;
				prompt.element.focus();
				confirm(prompt.inputField.element);
				await delay(50);
				expect(result).to.equal("Answer 1");
			});
		});
	});
	
	when("autoFocus is disabled", () => {
		let originallyActive = null;
		let tempInput = null;
		
		before(() => {
			tempInput = document.createElement("input");
			tempInput.type = "text";
			document.body.appendChild(tempInput);
			tempInput.focus();
		});
		
		after(() => document.body.removeChild(tempInput));
		
		when("displayed", () =>
			it("doesn't change focus", () => {
				prompt = new PromptView({autoFocus: false});
				prompt.autoFocus.should.be.false;
				prompt.promptUser();
				prompt.element.should.be.drawn;
				prompt.element.contains(document.activeElement).should.be.false;
				document.activeElement.should.equal(tempInput);
			}));
		
		when("confirmed", () =>
			it("doesn't restore focus", async () => {
				prompt.inputField.element.focus();
				prompt.element.contains(document.activeElement).should.be.true;
				prompt.input = "ABC XYZ";
				confirm(prompt.inputField.element);
				await delay(50);
				document.activeElement.should.not.equal(tempInput);
			}));
		
		when("autoFocus is disabled while prompting", () =>
			it("it doesn't restore focus", async () => {
				tempInput.focus();
				prompt = new PromptView();
				prompt.autoFocus.should.be.true;
				prompt.promptUser();
				prompt.should.have.property("previouslyFocussedElement").that.equals(tempInput);
				prompt.element.should.be.drawn;
				prompt.element.contains(document.activeElement).should.be.true;
				
				prompt.autoFocus = false;
				prompt.autoFocus.should.be.false;
				expect(prompt.previouslyFocussedElement).to.be.null;
				prompt.input = "ABC XYZ";
				confirm(prompt.inputField.element);
				await delay(50);
				prompt.element.should.not.be.drawn;
				prompt.element.contains(document.activeElement).should.be.false;
				document.activeElement.should.not.equal(tempInput);
			}));
	});
});

},{"../prompt-view.js":5,"./utils.js":7,"chai":2}],7:[function(require,module,exports){
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

},{}]},{},[1,6]);
