"use strict";

const Chai = require("chai");
const {expect} = Chai;
Chai.should();

describe("PromptView", () => {
	const PromptView = require("../prompt-view.js");
	
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
	});
});
