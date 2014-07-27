REPORTER = spec
TESTFILES = $(shell find test/ -name '*.test.js')

build: lint
	@NODE_ENV=test mocha --reporter dot $(TESTFILES)

test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		$(TESTFILES)

lint:
	@echo "Linting..."
	@./node_modules/jshint/bin/jshint \
		--config .jshintrc \
		index.js src/**/*.js test/*.js

coverage:
	@echo "Generating coverage report.."
	@istanbul cover _mocha
	@echo "Done: ./coverage/lcov-report/index.html"

docs:
	@jsdoc index.js Readme.md

.PHONY: lint test coverage docs
