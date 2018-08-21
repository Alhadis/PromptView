SRC := prompt-view.js test/atom-specs.js test/utils.js
MAN := man/man?/*

all: lint browser-specs test

# Run linters for various filetypes
lint:
	eslint .
	mandoc -Tlint -Wwarning $(MAN)

# Run unit tests
test:
	atom -t test

# Nuke untracked or generated junk
clean:
	rm -f *.tgz *.tar *.tar.gz

# Browserify Atom's specs for browser testing
browser-specs: test/browser-specs.js
test/browser-specs.js: $(SRC)
	printf 'window.atom = "object" === typeof atom;\n' > $@
	node_modules/.bin/browserify \
		--ignore chai \
		--ignore mocha \
		node_modules/atom-mocha/lib/extensions.js \
		test/atom-specs.js >> $@
	sed -i.bak -e '\
		s/require("mocha");$$/window.mocha;/; \
		s/require("chai");$$/window.chai;/; \
	' $@ && rm -f $@.bak


# Fake targets, don't check timestamps
.PHONY: lint test clean
