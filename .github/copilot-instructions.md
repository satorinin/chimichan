# Copilot Instructions for chimichan

## Project Overview
- **chimichan** is a multiplatform browser extension (Chrome/Firefox) for parsing Japanese text, inspired by Migaku Reader.
- The extension integrates with Anki via AnkiConnect, allowing import/sync of known, learning, and new words/particles.
- Users can select decks and fields, add sentences, and manage a local known words database that syncs with Anki.

## Architecture & Key Components
- **Client-side only**: All parsing and annotation is performed in-browser for privacy and performance.
- **Major components** (planned):
  - `anki/`: AnkiConnect integration, deck/field management, known words sync, only to app
  - `lexor/`: Japanese text parsing, sentence mining, n+1 detection
  - `components/`: UI elements (deck picker, field picker, furigana, pitch accent, settings, dictionary picker)
  - `utils/`: Dictionary loaders (kanji, pitch, frequency), parsing helpers
- **Data flow**: User actions (deck/field selection, sentence addition) update local state and trigger Anki sync. Page parsing annotates DOM with furigana, pitch, and word status.

## Developer Workflows
- **Build**: Use Vite/Next.js for fast development and extension packaging. Example: `npm run dev` for local web preview.
- **Test**: Use Vitest/Jest for unit/integration tests. Example: `npm run test`.
- **Extension packaging**: Follow browser extension build steps (see future `/docs/extension-build.md`).

## Conventions & Patterns
- **TypeScript + React**: All UI and logic should use modern TypeScript and React patterns.
- **State management**: Use Zustand or Redux Toolkit for predictable state updates.
- **Dictionary formats**: Support JSON, CSV, and common dictionary types for uploads.
- **Component structure**: Keep UI logic in `components/`, parsing in `lexor/`, and integration in `anki/`.
- **Testing**: Place tests in `/tests`, mock Anki and dictionary data for integration tests.

## Integration Points
- **AnkiConnect**: Communicate via HTTP API to fetch/update known words and sync sentences.
- **Kuromoji.js**: Use for Japanese morphological analysis.
- **Pitch/frequency dictionaries**: Load from user-uploaded files, apply to parsed text.

## Examples
- To annotate a page, parse DOM nodes with `lexor/parser.ts`, then decorate with furigana and pitch accent using `components/FuriganaText.tsx` and `components/PitchColorizer.tsx`.
- To sync known words, use `anki/ankiConnect.ts` to fetch from Anki, then update local state.

---

For questions or unclear patterns, review `README.md` and future docs, or ask for clarification.
