```markdown
# Developer quickstart (minimal)

This file collects the minimal steps to get a working local dev loop from the current repository snapshot.

Assumptions: you have Node.js (>=16) and Python 3 installed locally. AnkiConnect (if used) should run on 127.0.0.1:8765.

1) Restore or create a tiny reference parser

- Create `src/ref/parser.js` with a function `parse(text)` that returns an array of sentences; each sentence is an array of tokens matching the token contract.
- Recommended test: create `test/parser.test.js` that imports the parser and checks token fields.

2) Visual harness for decorator

- Create `scripts/harness.html` and `scripts/harness.js` that load a sample Japanese sentence, call the parser, and render `<ruby>` elements to visualize furigana.

3) Anki CLI utilities (optional)

- If you plan to use AnkiConnect, ensure Anki is running locally and AnkiConnect is installed.
- Example: (only if `src/cli_download_srs.py` exists locally)

```bash
python3 src/cli_download_srs.py --host 127.0.0.1 --port 8765
```

4) Smoke run examples (after adding `src/ref/parser.js`)

```bash
# Node smoke parse
node scripts/smoke_parse.js "今日はいい天気ですね。"

# Open the decorator harness in a browser
open scripts/harness.html
```

5) Tests

- Use a lightweight test runner (node: mocha/jest or a tiny custom runner). Place tests in `test/` and run with `node test/run_tests.js` or `npm test` if you add `package.json`.

Notes
- This project currently prefers small, testable reference code over large scaffolding. Confirm build tooling on the issue tracker before adding Bazel.

```
