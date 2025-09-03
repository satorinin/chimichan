.PHONY: all format format-check lint lint-fix test test-ci test-tokenizer ci

all: test

format:
	npm run format

format-check:
	npm run format:check

lint:
	npm run lint

lint-fix:
	npm run lint:fix

test:
	npm test

test-ci:
	npm run test:ci

test-tokenizer:
	npm run test-tokenizer

ci: format-check lint test-ci test-tokenizer
