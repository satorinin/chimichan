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
