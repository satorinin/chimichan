Project structure (short)

- `web/` — lightweight browser demo (static HTML/JS) for kuromoji and AnkiConnect experiments.
- `src/` — planned TypeScript/React source for the project
  - `src/anki/` — AnkiConnect helpers
  - `src/components/` — React UI components
  - `src/utils/` — small utilities
- `tests/` — unit and integration tests

This layout follows the Copilot instructions: keep parsing/lexor logic in `src/lexor`, UI in `src/components`, and integration in `src/anki`.
