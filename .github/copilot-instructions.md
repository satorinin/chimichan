# Copilot Instructions — Chimichan Repository

## Purpose
Provide AI coding agents with the essential knowledge to be productive in this codebase, including architecture, workflows, conventions, and integration points.

## Overview
- **Big Picture:** Chimichan is a project focused on parsing, CLI tools, and integration with Anki and Firebase. It aims to replicate features from the Migaku Chrome extension, such as furigana, pitch coloring, and interactive text.
- **Key Directories:**
  - `src/`: Main source code for parsing and CLI tools.
  - `tools/`: Utility scripts, including Firebase integration.
  - `docs/`: Documentation, including `master_design.md` for architecture and planning.

## Key Files
- `src/lexor/parser.ts`: Tokenization and parsing logic.
- `src/parser.ts`: High-level parsing utilities.
- `src/cli_download_srs.py`: CLI tool for Anki integration.
- `tools/firebase_viewer_server.py`: Firebase utility script.

## Developer Workflows
- **Building and Running:**
  - The project plans to use Bazel for builds and tests. Refer to `docs/master_design.md` for target names and setup.
- **Testing:**
  - Add unit tests for tokenization and Anki client logic.
- **Debugging:**
  - Use browser devtools for content scripts.
  - Use VS Code for debugging TypeScript and Python files.

## Project-Specific Conventions
- **Python CLI Scripts:**
  - Follow `main()` + `argparse` patterns.
  - Use SQLite cursors for database interactions (see `cli_download_srs.py`).
- **TypeScript Parsing Utilities:**
  - Keep functions small, pure, and testable.
  - Return token shapes: `{surface, reading, lemma, pos, start, end}`.
- **Anki Integration:**
  - Use AnkiConnect JSON-RPC at `http://127.0.0.1:8765`.
  - Provide `--host`/`--port` overrides in client modules.

## Integration Points
- **AnkiConnect:**
  - Methods: `findNotes`, `notesInfo`, `addNote`.
  - Return plain arrays of word keys with optional metadata.
- **Pitch Data:**
  - Use a local JSON database keyed by lemma/reading.
  - Annotate tokens with `pitchPatternId` and `pitchColor`.

## First Tasks for AI Agents
1. Read `docs/master_design.md` for architecture and workflows.
2. Inspect key files listed above to understand parsing and integration patterns.
3. Scaffold Bazel `WORKSPACE` and `BUILD.bazel` files for `//src:web_app` and `//tools:firebase_viewer_server`.
4. Add unit tests for tokenization helpers and Anki client logic.
5. Document AnkiConnect usage examples in `docs/dev-setup.md`.

## Notes
- Preserve privacy: Do not upload Anki deck contents or user data without explicit consent.
- Update this file as the project evolves to reflect new patterns and workflows.
