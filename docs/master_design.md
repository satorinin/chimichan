# Chimichan — Master Design Document

This document captures the high-level plan and component breakdown for an app that reproduces key features from the Migaku Chrome extension (furigana, pitch coloring, Anki integration, n+1 mining, sentence difficulty), starting as a SPA and later packaged as a browser extension.

## Goals
- Provide selectable furigana behavior: None / All / Unknown / On hover.
- Provide pitch-accent coloring: None / On hover / Always.
- Make webpage text and subtitles interactive (hover, click, annotations).
- Integrate with Anki (AnkiConnect) to read known/learning/new words and sentence cards.
- Underline unknown words, find n+1 sentences for mining, and compute per-sentence difficulty relative to a user's Anki knowledge.
- Use Yomitan (or external popup) for dictionary popups; the app is not a flashcard or dictionary app.
- Tokenize and parse Japanese sentences (Intl.Segmenter + kuromoji for morphology).
- Use Bazel for builds and tests.
- **Ensure the app is fully client-side, avoiding reliance on external CDNs or databases.**

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
    Annotator[Annotator: furigana/pitch/underline]
    UI[UI controls (settings panel)]
  end

  subgraph Integrations
    Anki[AnkiConnect (127.0.0.1:8765)]
    PitchDB[Pitch data store (local JSON)]
  end

  Page --> ContentScript
  ContentScript --> Tokenizer
  Tokenizer --> Morph
  Morph --> Annotator
  Annotator --> ContentScript
  ContentScript --> UI
  ContentScript <--> Anki
  Annotator <--> PitchDB
  ContentScript --> Popup
```

## Components and responsibilities

- Tokenization & Morphology
  - Sentence splitting: use Intl.Segmenter where available for sentence and word boundaries.
  - Morphological parsing: kuromoji (or other J/K tokenizer) to obtain lemma, reading (kana), POS, and base form.
  - Output: tokens with {surface, reading, lemma, pos, start, end}.
  - Files to reference: `src/lexor/parser.ts`, `src/parser.ts`.

- Annotator (content script)
  - Wrap tokens in spans with data attributes: data-surface, data-reading, data-pitch, data-status.
  - Provide CSS hooks to render furigana (via <rt>/<ruby> or visually via CSS), pitch coloring, and underline unknown words.
  - Support hover and click interactions that show Yomitan popup or Anki actions.

- Anki Integration
  - Use AnkiConnect JSON-RPC (default http://127.0.0.1:8765) with overrides for host/port.
  - Provide methods:
    - getKnownWords(deckFilter?)
    - getLearningWords(deckFilter?)
    - getNewWords(deckFilter?)
    - parseSentenceCards(deck?) -> extract words from sentence cards and mark them as known/learning.
  - Reference: `src/cli_download_srs.py` for existing CLI patterns.

- Pitch accent data
  - **Store pitch data locally** as a JSON database keyed by lemma/reading.
  - Schema: {wordKey: {patternId, color, description}}. Annotator maps tokens to pitch patterns.

- N+1 mining & difficulty ranking
  - For each sentence: compute known, learning, unknown counts using Anki lists.
  - n+1 sentences are those with unknown count == 1.
  - Difficulty score heuristic: ratio of unknown tokens, presence of low-frequency words, sentence length.

- UI & Settings
  - Settings panel exposes Furigana mode, Pitch mode, Anki deck selection, Mining thresholds.
  - Persist settings in localStorage / extension storage.

- Backend (optional)
  - **Avoid reliance on external backends.** If absolutely necessary, provide optional Firebase-compatible sync for advanced users.

- Packaging
  - Start as SPA (local dev) and produce a build artifact that can be used as a content-script+UI bundle for Extension Manifest V3.

## Developer workflows

- Local dev (quick iter): run SPA in a static dev server and load the built content script into the browser as an unpacked extension.
- Anki access: ensure AnkiDesktop running with AnkiConnect add-on enabled (default port 8765).
- Debugging: use browser devtools for content script, and VS Code for TypeScript and Python debugging.

Suggested local dev commands (examples to add to `docs/dev-setup.md` later):

```bash
# run AnkiConnect-dependent utilities (example)
python3 src/cli_download_srs.py --host 127.0.0.1 --port 8765

# build with Bazel (once targets are defined)
bazel build //src:web_app:bundle
bazel run //tools:firebase_viewer_server
```

## Bazel plan (scaffold ideas)
- Create targets:
  - `//src:web_app` — webapp build pipeline (npm toolchain rule that invokes rollup/webpack)
  - `//tools:firebase_viewer_server` — python_binary for the firebase tool
  - `//tests:unit` — node and python unit tests

Notes: Bazel setup will require adding `WORKSPACE` and minimal `BUILD.bazel` files; we will scaffold these later if you want.

## Project-specific conventions (discoverable from code)
- Python CLI scripts use sqlite cursors in `src/cli_download_srs.py` and `tools/firebase_viewer_server.py` (pattern: `conn.cursor()` exists). Use `argparse` and `main()`.
- Token parsing utilities are located under `src/lexor/` (see `parser.ts`) — prefer small, testable functions for token boundaries.
- Keep Anki network code separate from UI code; use a thin client module that exposes pure functions returning lists/sets.

## Open questions / design decisions to resolve
1. Pitch data source: **Ensure all pitch data is stored locally**. Avoid external APIs unless absolutely necessary.
2. Furigana rendering strategy: semantic <ruby>/<rt> elements vs visually positioned overlays—accessibility concerns?
3. Exact heuristic for "known" vs "learning" vs "new" from Anki data (use note/field names? tags?).
4. How to handle multiword expressions and token alignment between kuromoji and Intl.Segmenter.
5. Offline behavior: what features must work when Anki is unreachable?
6. Privacy: will any content, words, or user data be uploaded to a backend? Default: no.

## Data contracts / shapes (proposed)
- Token
  - {
    surface: string,
    reading: string, // kana
    lemma: string,
    pos: string,
    start: number,
    end: number
  }

- Pitch record
  - {
    patternId: string,
    pitchColor: string,
    examples: [string]
  }

- Anki word list response: array of strings (kanji or kana key) and optional metadata {status: "known"|"learning"|"new"}

## Security & privacy notes
- **Ensure all functionality is client-side.** Avoid external CDNs or databases.
- Do not upload user-specific Anki decks or contents to external servers without explicit consent.
- Keep defaults local-only; add opt-in remote sync in a separate component.

## Files to inspect / update first
- `src/lexor/parser.ts`
- `src/parser.ts`
- `src/cli_download_srs.py`
- `tools/firebase_viewer_server.py`

## Next steps (short-term)
1. Review and answer the Open Questions above.
2. Scaffold `docs/dev-setup.md` with Bazel `WORKSPACE`/`BUILD` plan and AnkiConnect usage examples.
3. Create a minimal Bazel `WORKSPACE` and `BUILD.bazel` skeleton for `//tools:firebase_viewer_server` and `//src:web_app`.
4. Produce a concise `.github/copilot-instructions.md` update that references this doc.

## Requirements checklist (mapped to this doc)
- [x] Master design doc created and placed in `docs/master_design.md`.
- [x] Components and responsibilities listed (Tokenizer, Annotator, Anki, Pitch DB, UI, Backend).
- [x] Open questions enumerated for design decisions.
- [x] Mermaid diagram of high-level architecture included.
- [x] Developer workflows and Bazel plan sketched.

If you'd like, I will now scaffold `docs/dev-setup.md` with example Bazel `WORKSPACE` and `BUILD.bazel` skeletons and an initial `.github/copilot-instructions.md` merge referencing this doc. Which one should I do next?
