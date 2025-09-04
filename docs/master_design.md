```markdown
# Chimichan — Master Design and Requirements

Status (repo snapshot: 2025-09-04)
- The `docs/` folder contains component specifications and scoring drafts.
- The repository snapshot does not contain completed runtime implementations; a `src/` tree was removed. Prioritize small, reference implementations and tests before adding larger build scaffolding.

Purpose of this document
- Turn the existing high-level plans into explicit, testable component requirements and success criteria so contributors and automated agents can deliver minimal, verifiable pieces.

Non-functional goals
- Client-side first: all parsing, matching, and comprehension scoring run locally by default.
- Privacy-preserving: Anki data fetched locally (AnkiConnect) and cached locally; no user data is uploaded by default.
- Incremental: prefer small modules that can be unit-tested in isolation.

Top-level system overview
- Input: webpage text, subtitle streams, or pasted text.
- Processing pipeline: sentence splitter -> morphological analyzer -> token normalizer -> token enrichment (reading, lemma, pos) -> decorator + comprehension calculator.
- Storage: local WordDB (IndexedDB in extension, SQLite for CLI), local pitch JSON.
- Integrations: AnkiConnect (local JSON-RPC), optional Firebase tools (developer utilities only).

Core components and explicit requirements

1) Parser Pipeline
  - Purpose: Convert raw text into sentences and tokens with morphology metadata.
  - Inputs: UTF-8 string (page or excerpt).
  - Outputs: array of sentences; sentence is array of tokens. Token contract:
    { surface: string, reading?: string, lemma?: string, pos?: string, start: number, end: number }
  - Requirements:
    - R1.1: Use `Intl.Segmenter` for sentence and word segmentation when available.
    - R1.2: Provide a fallback tokenization that preserves basic token boundaries when `Intl.Segmenter` is unavailable.
    - R1.3: Provide a thin adaptor interface that allows swapping kuromoji or alternative morphology engines.
    - R1.4: Expose a pure function parse(text:string): Sentence[] with deterministic output for the same input.
  - Success criteria:
    - S1.1: Unit tests exist that validate token contract for 10 synthetic Japanese sentences (surface, reading/lemma optional).
    - S1.2: Fallback segmentation produces the same sentence count as `Intl.Segmenter` on sample pages lacking the API.

2) Token Normalizer / Enricher
  - Purpose: Normalize tokens (unicode normalization, lemma fallback) and enrich tokens with reading/lemma/pos where available.
  - Requirements:
    - R2.1: Provide deterministic normalization (NFKC/NFC as appropriate).
    - R2.2: When morphology engine lacks lemma/reading, attempt safe heuristics: use surface, map katakana/hiragana forms when possible.
  - Success criteria:
    - S2.1: Unit tests cover normalization of common edge cases (fullwidth punctuation, mixed scripts).

3) Language Decorator
  - Purpose: Render annotations (furigana, pitch, underlines) in the DOM without breaking page layout.
  - Inputs: token arrays with enrichment, user settings (furigana: none/all/unknown/hover, pitch: none/hover/always).
  - Requirements:
    - R3.1: Provide a rendering API that returns DOM nodes (or HTML strings) for a token or token span.
    - R3.2: Default to semantic `<ruby>` markup for furigana; provide a CSS-only fallback.
    - R3.3: Avoid altering page semantics or breaking event listeners when possible (prefer non-invasive overlays and data-attributes).
    - R3.4: Allow dynamic updates for tokens (e.g., when WordDB updates while page is open).
  - Success criteria:
    - S3.1: Decorator harness (`scripts/harness.html`) demonstrates `<ruby>` rendering for a sample sentence.
    - S3.2: Unit/integration test verifies that applying and removing decorations is idempotent and does not leak DOM nodes.

4) Word Database (WordDB)
  - Purpose: Store user's vocabulary status (known/learning/new) for lookups during annotation and scoring.
  - Requirements:
    - R4.1: Provide a simple CRUD API and batch import from Anki-derived lists.
    - R4.2: Default to browser IndexedDB for extension usage; allow SQLite for CLI contexts.
    - R4.3: Provide an in-memory cache for efficient per-page lookups.
  - Success criteria:
    - S4.1: WordDB unit tests validate CRUD and batch import behavior.
    - S4.2: Per-page lookup of 10k words should complete within 200ms on a typical dev machine when cached.

5) Anki Syncer
  - Purpose: Query AnkiConnect and produce lists of known, learning, and new words; parse sentence cards.
  - Requirements:
    - R5.1: Talk to AnkiConnect at a configurable host/port (defaults: 127.0.0.1:8765).
    - R5.2: Provide retry/backoff and clear error messages when AnkiConnect is unavailable.
    - R5.3: Emit normalized word lists consumable by WordDB (lemma/reading preferred).
  - Success criteria:
    - S5.1: CLI smoke command `python3 src/cli_download_srs.py --host 127.0.0.1 --port 8765` returns structured JSON or writes to a local SQLite file when AnkiConnect is available.
    - S5.2: Unit tests mock AnkiConnect responses and validate parsing logic.

6) Comprehension Calculator
  - Purpose: Compute page-level and sentence-level comprehension metrics and detect n+1 sentences.
  - Inputs: token arrays and WordDB lookup API.
  - Requirements:
    - R6.1: Implement the scoring algorithm described in `docs/comprehension_calculator.md` as a deterministic function that returns the `ComprehensionReport` shape.
    - R6.2: Provide configurable token weighting and status-to-score mapping.
    - R6.3: Support incremental updates (recompute for visible viewport first, then background compute rest).
  - Success criteria:
    - S6.1: Reference implementation `src/ref/comprehension.js` with unit tests that reproduce example calculations in the doc.
    - S6.2: Demo harness shows detection of n+1 sentences on sample text.

7) Pitch DB and Pitch Annotator
  - Purpose: Store pitch accent patterns and map tokens to pitch colors.
  - Requirements:
    - R7.1: Pitch DB is a compact JSON format keyed by lemma or reading. Document format in `docs/pitch_database.md`.
    - R7.2: Annotator maps token -> pitchPatternId and computes pitchColor.
  - Success criteria:
    - S7.1: `docs/pitch_database.md` documents schema and update procedure.
    - S7.2: Decorator harness can color tokens according to pitch pattern.

8) UI / Extension Integration
  - Purpose: Provide per-site toggles, global settings, and a small popup for quick actions.
  - Requirements:
    - R8.1: Settings stored in extension storage/localStorage.
    - R8.2: Per-site decoration opt-in toggles stored and honored by content script.
    - R8.3: Minimal permissions requested; document why each permission is needed.
  - Success criteria:
    - S8.1: A manual test that loading the harness and toggling settings changes decorator behavior as expected.

Interfaces between components
- Parser -> Decorator/Comprehension: Sentence[] of Token objects (stable contract). Keep this shape backward compatible.
- Anki Syncer -> WordDB: exports arrays of normalized words with status.
- Pitch DB -> Decorator: pattern lookup by lemma/reading.

Testing and verification
- Unit tests for core pure functions (parser normalization, comprehension scoring, DB importers).
- Small integration tests using the `scripts/harness.html` to validate decorator behavior in a browser.
- Performance targets: per-page token lookup + comprehension scoring for 1000 tokens should complete < 500ms on a developer laptop when using in-memory cache.

Roadmap and immediate tasks (prioritized)
1. Add `src/ref/parser.js` + `test/parser.test.js` (token contract tests).
2. Add `src/ref/comprehension.js` + tests matching the examples in `docs/comprehension_calculator.md`.
3. Add `scripts/harness.html` + `scripts/harness.js` to visualize decoration and pitch coloring.
4. Add `docs/dev-setup.md` (done) and `docs/pitch_database.md` (done).
5. Open issue: select build tooling (Bazel vs npm scripts) and document preferred CI.

Governance and change management
- Small breaking changes to token contract require updating `docs/language_parser_pipeline.md` and a migration test suite.
- Any change that requires user data migration (WordDB schema changes) must be documented and provide a migration path.

Acceptance and roll-forward criteria
- A PR that implements a reference parser and comprehension module with tests + the harness will be accepted as the minimal viable codebase to build on.

If you'd like, I will now scaffold items 1–3 (parser + comprehension + harness) in JS, add tests, and run the smoke tests. Confirm and I'll proceed.

```
```markdown
# Chimichan — Master Design (snapshot + next steps)

This document records the architecture, the current repo snapshot (2025-09-04), and prioritized, small tasks to make the project testable and maintainable.

High level
- Purpose: annotate Japanese text with furigana and pitch, surface unknown words, surface n+1 sentences, and compute per-page comprehension using a local Anki-derived word list.
- Data flow: input text -> sentence splitter (Intl.Segmenter) -> morphological analysis (kuromoji or equivalent) -> tokens -> decorator (furigana/pitch/underline) + Comprehension Calculator -> UI / Anki sync.

Current snapshot (repo state)
- `docs/` contains component specs and scoring drafts.
- Runtime code referenced by docs (e.g., `src/` parsing modules) is currently missing from the workspace snapshot or under development. Do not assume reference implementations exist.
- No CI, no Bazel `WORKSPACE`/`BUILD.bazel` files present. Bazel is a design intention, not yet implemented.

Design contracts (stable)
- Token shape: {surface, reading?, lemma?, pos?, start, end}
- WordDB record: {word, status: known|learning|new, metadata}
- ComprehensionReport: {pageScore, knownWordPercent, sentenceReports[], fullyKnownSentenceCount, nPlusOneSentences[]}

Key components (docs/ references)
- Parser pipeline: `docs/language_parser_pipeline.md`
- Decorator: `docs/language_decorator.md`
- Comprehension Calculator: `docs/comprehension_calculator.md`
- Anki syncer: `docs/anki_syncer.md`
- Word DB: `docs/word_database.md`
- Browser/extension UI: `docs/browser_extension_ui.md` and `docs/user_view.md`

Developer guidance & priorities (practical)
1) Small, verifiable reference implementations first
   - Implement a tiny parser `src/ref/parser.js` (or TS) that exposes parse(text) -> sentences[token[]]. Keep it dependency-free: use `Intl.Segmenter` and simple fallback token splitting.
   - Add unit tests (Node + a tiny test runner) in `test/` that assert the token contract.

2) Minimal decorator harness
   - Create `scripts/harness.html` + `scripts/harness.js` that load tokens and render `<ruby>`/spans so designers can iterate UI without a full extension.

3) Add `docs/dev-setup.md` (developer quickstart)
   - Steps: run smoke parser, run harness, run CLI Anki syncer (if available).

4) Do not scaffold Bazel yet
   - Open an issue to confirm build tooling with maintainers. After agreement, add Bazel `WORKSPACE` and minimal `BUILD.bazel` files.

Privacy & operations
- All processing is client-side by design. AnkiConnect calls are local to the user's machine (127.0.0.1:8765). Always document that Anki data is cached locally and never uploaded by default.

Next actionable checklist (prioritized)
- [ ] Add `src/ref/parser.js` + unit tests validating token shape.
- [ ] Add `scripts/harness.html` + `scripts/harness.js` to visualize `<ruby>` rendering.
- [ ] Create `docs/dev-setup.md` with smoke commands (node/python examples).
- [ ] Add `docs/pitch_database.md` describing pitch JSON schema and how to update it safely.
- [ ] Open issue: pick build tooling (Bazel vs npm scripts) and document maintainers' preference.

When to add larger scaffolding
- After reference implementations and tests exist and maintainers confirm the build tool, add Bazel/CI to automate tests and builds.

If you need help implementing the first reference parser and tests, tell me and I will scaffold them next.

```
# Chimichan — Master Design Document

This document captures the high-level plan and component breakdown for an app that reproduces key features from the Migaku Chrome extension (furigana, pitch coloring, Anki integration, n+1 mining, sentence difficulty), starting as a SPA and later packaged as a browser extension. Recent additions: component-level docs have been added under `docs/` (see list below) and the extension is explicitly client-side first and only decorates pages when the user enables it.

## Quick plan & checklist
- [ ] Keep the app fully client-side where possible (no external CDNs/databases by default).
- [ ] Extension decorates pages only when the user enables decorations for that page/site.
- [ ] Use local pitch DB (JSON) and IndexedDB/SQLite for local persistence.
- [ ] Implement the Comprehension Calculator in the content script pipeline.

## Goals
- Provide selectable furigana behavior: None / All / Unknown / On hover.
- Provide pitch-accent coloring: None / On hover / Always.
- Make webpage text and subtitles interactive (hover, click, annotations) only when the user enables decoration.
- Integrate with Anki (AnkiConnect) to read known/learning/new words and sentence cards.
- Underline unknown words, find n+1 sentences for mining, and compute per-sentence difficulty relative to a user's Anki knowledge.
- Use Yomitan (or external popup) for dictionary popups; the app is not a flashcard or dictionary app.
- Tokenize and parse Japanese sentences (Intl.Segmenter + kuromoji for morphology).
- Use Bazel for builds and tests.
- Ensure the app is client-side first, avoiding reliance on external CDNs or databases unless explicitly opted-in by the user.

## High-level architecture

```mermaid
flowchart LR
  subgraph Browser
    Page[Webpage / Video / Subtitles]
    ContentScript[Content Script / SPA Overlay]
    Popup[Popup UI (Yomitan integration)]
  end

  subgraph SPA
    Tokenizer[Sentence splitter: Intl.Segmenter]
    Morph[Tokenizer/morphology: kuromoji]
    Decorator[Language Decorator: furigana / pitch / unknown]
    Comprehend[Comprehension Calculator]
    UI[UI controls (settings panel)]
  end

  subgraph LocalData
    WordDB[Known/Learning/New Word DB (IndexedDB/SQLite)]
    PitchDB[Pitch data store (local JSON)]
  end

  subgraph Integrations
    Anki[AnkiConnect (127.0.0.1:8765)]
  end

  Page --> ContentScript
  ContentScript --> Tokenizer
  Tokenizer --> Morph
  Morph --> Decorator
  Decorator --> ContentScript
  ContentScript --> Comprehend
  Comprehend --> ContentScript
  ContentScript --> UI
  ContentScript <--> Anki
  Decorator <--> PitchDB
  ContentScript <--> WordDB
  ContentScript --> Popup
```

Notes on behavior:
- Decorations (furigana, pitch coloring, underlines) are applied only when the user toggles decoration for a page or site. This avoids surprising changes and respects user control.
- The Comprehension Calculator runs locally in the content script and summarizes page comprehension using locally stored Anki-derived word lists; no data is sent to remote services by default.

## Component index (documents under `docs/`)
- `docs/user_view.md` — Single Page App UI and controls.
- `docs/browser_extension_ui.md` — Extension packaging and how/when decorations are applied.
- `docs/language_parser_pipeline.md` — Sentence splitting and morphology (Intl.Segmenter + kuromoji).
- `docs/language_decorator.md` — Furigana, pitch, underline rendering rules.
- `docs/anki_syncer.md` — AnkiConnect client and syncing rules.
- `docs/word_database.md` — Local known/learning/new word DB (IndexedDB/SQLite).
- `docs/comprehension_calculator.md` — Comprehension scoring and fully-known sentence detection.

(Inspect these docs for component-level requirements and open questions.)

## Components and responsibilities (summary)

- Tokenization & Morphology (`docs/language_parser_pipeline.md`)
  - Sentence splitting with `Intl.Segmenter` (fallbacks noted in docs).
  - Morphological parsing with kuromoji to obtain reading/lemma/POS.
  - Emit tokens: `{surface, reading, lemma, pos, start, end}`.

- Language Decorator (`docs/language_decorator.md`)
  - Render furigana per user setting (None/All/Unknown/On hover).
  - Apply pitch accent coloring and underline unknown words.
  - Use semantic `<ruby>/<rt>` where possible; provide CSS-only fallback for environments that limit markup.

- Comprehension Calculator (`docs/comprehension_calculator.md`)
  - Compute metrics per page: percentage of known words, number of fully-known sentences, list of n+1 sentences.
  - Scoring inputs: token statuses from WordDB, sentence tokenization from parser pipeline.
  - Output: summary metrics and annotated highlights for fully-known sentences.

- Anki Syncer (`docs/anki_syncer.md`)
  - Talk to AnkiConnect (JSON-RPC) to fetch deck notes and derive known/learning/new word lists.
  - Support `--host`/`--port` overrides and local caching in WordDB.

- Word Database (`docs/word_database.md`)
  - Local persistence (IndexedDB in the extension, SQLite for CLI tools).
  - Schema: `{word, status: known|learning|new, metadata}` and batch update methods.

- Pitch DB
  - Local JSON shipped with the extension or loaded by the user into extension storage.
  - Annotator maps tokens to `pitchPatternId` and `pitchColor`.

- UI & Settings (`docs/user_view.md`)
  - Settings persisted to localStorage/extension storage.
  - Per-site decoration toggles and global defaults.

- Packaging & Build
  - SPA build artifact used as an extension content script (Manifest V3).
  - Bazel used for build/test orchestration (targets to be added).

## Data flows and privacy
- All text processing, matching against known words, and comprehension scoring occur on the client.
- Anki data is requested locally from AnkiConnect and may be cached locally in WordDB; user data is never uploaded by default.
- Pitch data and other static resources are bundled with the extension or stored locally; no external CDNs are required.

## Developer workflows (updated)
- Run the SPA locally and load the build as an unpacked extension for manual testing of decoration flows.
- Use `src/cli_download_srs.py` to exercise Anki-related utilities in the CLI context; CLI tools may use SQLite for local persistence.
- Debug content scripts with browser devtools and TypeScript/Python in VS Code.

Suggested local dev commands (examples to add to `docs/dev-setup.md` later):

```bash
# fetch Anki lists via CLI
python3 src/cli_download_srs.py --host 127.0.0.1 --port 8765

# build (Bazel targets will be scaffolded)
bazel build //src:web_app:bundle
bazel run //tools:firebase_viewer_server
```

## Bazel plan (updated)
- Priorities for initial Bazel targets:
  - `//src:web_app` — SPA bundle for extension content script.
  - `//src:unit_tests` — tokenization and decorator unit tests.
  - `//tools:cli_tools` — python binaries like `cli_download_srs.py`.

Scaffolding notes: add `WORKSPACE`, minimal `BUILD.bazel` files for the above targets; prefer small, testable units for rapid CI feedback.

## Project-specific conventions (reminder)
- Keep Anki network logic isolated behind a thin client API.
- Tokenization helpers return the agreed token shape.
- All persistent data default to local storage mechanisms; remote sync is opt-in and isolated.

## Open questions / decisions to resolve (updated)
1. How will pitch DB updates be handled for improvements (automatic updater vs user-installed updates)?
2. Furigana rendering: prefer semantic `<ruby>` by default; confirm fallback UX for sites that break layout.
3. Comprehension UX: what thresholds trigger "fully-known" sentence highlighting vs "mostly-known" suggestions?
4. Offline fallback: if AnkiConnect is unreachable, should the extension still run in read-only mode using cached WordDB?
5. Security: sign extension packages and document how to add user-provided pitch files safely.

## Files to inspect / update first
- `docs/` — read the per-component docs (listed above).
- `src/lexor/parser.ts` and `src/parser.ts` — tokenization examples.
- `src/cli_download_srs.py` — Anki CLI patterns.
- `tools/firebase_viewer_server.py` — optional backend utility.

## Next steps (short-term)
1. Finalize the Comprehension Calculator scoring formula and UX thresholds.
2. Scaffold `docs/dev-setup.md` with Bazel `WORKSPACE`/`BUILD.bazel` plan, AnkiConnect examples, and extension load steps.
3. Add Bazel `WORKSPACE` and minimal `BUILD.bazel` files for `//src:web_app`, `//src:unit_tests`, and `//tools:cli_tools`.
4. Implement small unit tests for token shapes and an Anki client JSON-RPC formatter.
5. Create packaging checklist for extension submission (manifest, icons, permissions) and privacy documentation.

## Requirements checklist (mapped to this doc)
- [x] Master design doc updated and placed in `docs/master_design.md`.
- [x] Client-side-first constraint emphasized.
- [x] Extension behavior clarified: decorations applied only when user enables them.
- [x] Comprehension Calculator included in the architecture and component index.
- [x] Component-level docs linked from this master doc.


If you'd like, I will now scaffold `docs/dev-setup.md` with example Bazel `WORKSPACE` and `BUILD.bazel` skeletons and an initial `.github/copilot-instructions.md` merge referencing this doc. Which one should I do next?
