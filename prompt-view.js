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
			el.focus();
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
