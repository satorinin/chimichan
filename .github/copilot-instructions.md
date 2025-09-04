# Copilot Instructions — Chimichan (concise guide)

Purpose: help an AI coding agent become productive quickly by highlighting the project's architecture, key files, developer workflows, conventions, and integration points.

Quick pointers (what to open first):
- `docs/master_design.md` — overall architecture & planned build
- `docs/language_parser_pipeline.md` — the parsing responsibilities and token shape
- `src/` — parser logic (entry points include `src/parser_pipeline.js` and other parser modules)
- `docs/anki_syncer.md` and `src/cli_download_srs.py` — Anki-related workflows

Key concepts and architecture:
- Chimichan centers on a language parsing pipeline that tokenizes text, performs morphological analysis, and emits tokens used by a language decorator (furigana, pitch coloring, unknown-word detection).
- Data flow: input text -> sentence/word segmentation -> morphological analysis (kuromoji or similar) -> token enrichment (reading, lemma, POS, pitch) -> downstream consumers (CLI, Anki sync, UI).
- Token contract (used across the codebase): {surface, reading, lemma, pos, start, end} — keep this shape when adding helpers or tests.

Developer workflows and how to run things (discoverable patterns):
- There is no enforced build system checked into the repo; docs mention Bazel as the planned build/test tool. Before adding Bazel scaffolding, confirm with the maintainers. For small changes:
  - Run JS/Node scripts directly with `node` (e.g., `node src/parser_pipeline.js`).
  - Run Python CLI scripts with `python3` (they follow a `main()` + `argparse` pattern).
- Tests: the repo currently lacks a unified test harness. When adding tests, prefer small, focused unit tests next to the module under test and use a lightweight runner (Node: Jest/Mocha; Python: pytest). Add a `README` test snippet.

Project-specific conventions and examples:
- Parser utilities: keep functions small and pure; prefer returning normalized token objects rather than mutating input.
- CLI scripts: use `if __name__ == '__main__': main()` and `argparse` flags. Example: `src/cli_download_srs.py` (look for `--host`/`--port` overrides for AnkiConnect).
- Anki integration: uses AnkiConnect JSON-RPC at `http://127.0.0.1:8765`. Client modules should allow `--host`/`--port` overrides and interact with methods like `findNotes`, `notesInfo`, and `addNote`.
- Pitch data: stored as a local JSON keyed by lemma/reading and referenced by tokens via fields such as `pitchPatternId` and `pitchColor` (see `docs/word_database.md`).

Integration points and external deps to be aware of:
- AnkiConnect (local HTTP JSON-RPC)
- kuromoji or equivalent for Japanese morphological analysis (the docs reference it; search `package.json` or `requirements.txt` before adding it)
- Firebase utilities live under `tools/` (e.g. `tools/firebase_viewer_server.py`) — inspect before changing.

Practical first tasks for an AI agent:
1. Read `docs/master_design.md` and `docs/language_parser_pipeline.md` to confirm architecture assumptions.
2. Run a parser script (e.g., `node src/parser_pipeline.js`) with a small sample to observe token output shape.
3. Add a unit test for a tokenization helper that asserts the token contract.
4. If adding CI or build scaffolding, open an issue first — the project plans Bazel but currently has no enforced configuration.

Hints and constraints:
- Preserve user privacy: never include or upload real Anki deck data.
- When editing parser code, keep the token shape stable and add backward-compatible enrichment fields.
- Prefer small, verifiable changes: run a minimal smoke test (node/python run) and add one unit test.

Where to update this file: keep it short and focused — expand only with concrete, discoverable patterns and commands.

Questions for maintainers / next steps:
- Confirm intended build tool (Bazel vs simple scripts).
- Point to any existing test runner preferences (Jest/pytest) if available.

If anything here is unclear or you want the file to be more prescriptive (example commands, exact test framework, or added CI scaffolding), tell me which section to expand.
