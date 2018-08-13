"use strict";

const Chai = require("chai");
const {expect} = Chai;
Chai.should();

describe("PromptView", () => {
	const {delay, cancel, confirm} = require("./utils.js");
	const PromptView = require("../prompt-view.js");
	
	let paneEditor = null;
	before("Setting up workspace", async () => {
		attachToDOM(atom.workspace.getElement());
		paneEditor = await atom.workspace.open();
		paneEditor.element.focus();
	});
	
	when("constructed", () => {
		it("keeps the view hidden", () => {
			const prompt = new PromptView();
			expect(prompt.element).to.exist.and.not.be.drawn;
		});
		
		it("creates a wrapper element", () => {
			const prompt = new PromptView();
			expect(prompt.element).to.exist;
			prompt.element.should.be.an.instanceOf(HTMLElement);
			prompt.element.should.have.class("prompt");
			prompt.element.tagName.should.equal("DIV");
		});
		
		it("creates header and footer elements", () => {
			const prompt = new PromptView({
				headerHTML: "<b>Header</b>",
				footerHTML: "<i>Footer</i>",
			});
			expect(prompt.headerElement).to.exist;
			prompt.headerElement.should.be.an.instanceOf(HTMLElement);
			prompt.headerElement.should.have.class("prompt-header");
			prompt.headerElement.tagName.should.equal("HEADER");
			prompt.headerElement.textContent.should.equal("Header");
			prompt.headerElement.innerHTML.should.equal("<b>Header</b>");
			
			expect(prompt.footerElement).to.exist;
			prompt.footerElement.should.be.an.instanceOf(HTMLElement);
			prompt.footerElement.should.have.class("prompt-footer");
			prompt.footerElement.tagName.should.equal("FOOTER");
			prompt.footerElement.textContent.should.equal("Footer");
			prompt.footerElement.innerHTML.should.equal("<i>Footer</i>");
		});
		
		it("sets initial element classes", () => {
			const prompt = new PromptView({
				elementClass: "popup",
				headerClass:  "popup-head",
				footerClass:  "popup-foot",
			});
			prompt.element.should.have.class("popup").and.not.have.class("prompt");
			prompt.headerElement.should.have.class("popup-head").and.not.have.class("prompt-header");
			prompt.footerElement.should.have.class("popup-foot").and.not.have.class("prompt-footer");
		});
		
		it("lets element tag-types be overridden", () => {
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
		
		it("stores unrecognised options as instance properties", () => {
			const bar = {};
			const prompt = new PromptView({foo: bar});
			prompt.should.have.property("foo").that.equals(bar);
		});
		
		it("lets properties be modified after construction", () => {
			const prompt = new PromptView();
			prompt.headerText = "Header";
			prompt.footerText = "Footer";
			prompt.headerClass = "header-thing";
			prompt.footerClass = "footer-thing";
			prompt.headerElement.textContent.should.equal("Header");
			prompt.footerElement.textContent.should.equal("Footer");
			prompt.headerElement.should.have.class("header-thing");
			prompt.footerElement.should.have.class("footer-thing");
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
			}).then(value => answer = value);
			prompt.element.should.be.drawn;
		});
		
		it("shifts focus to the input field", () =>
			prompt.element.contains(document.activeElement).should.be.true);
		
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
});
