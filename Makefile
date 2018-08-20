SRC = prompt-view.js test/atom-specs.js test/utils.js

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
