"use strict";

const Chai = require("chai");
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
