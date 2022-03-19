SRC = prompt-view.js test/atom-specs.js test/utils.js

all: install lint browser-specs test

# Install project dependencies
install: node_modules
node_modules:
	npm install --quiet --no-save --no-package-lock

# Run linters for various filetypes
lint: install
	npx eslint .
	mandoc -Tlint -Wwarning man/man?/*

# Run unit tests
test: install
	atom -t test

# Nuke untracked or generated junk
clean:
	rm -f *.tgz *.tar *.tar.gz

# Browserify Atom's specs for browser testing
browser-specs: test/browser-specs.js
test/browser-specs.js: $(SRC)
	printf 'window.atom = "object" === typeof atom;\n' > $@
	npx browserify \
		--ignore chai \
		--ignore mocha \
		node_modules/atom-mocha/lib/extensions.js \
		test/atom-specs.js >> $@
	sed -i.bak -e '\
		s/require("mocha");$$/window.mocha;/; \
		s/require("chai");$$/window.chai;/; \
	' $@ && rm -f $@.bak


# Fake targets, don't check timestamps
.PHONY: install lint test clean
