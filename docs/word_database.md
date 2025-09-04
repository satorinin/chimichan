```markdown
# Word Database (WordDB) — Design

Purpose
- Store and serve user's vocabulary status (known, learning, new) with efficient lookups for runtime annotation and comprehension scoring.

Status (repo snapshot)
- Schema and interfaces are documented. No canonical implementation is present; recommended to implement `src/ref/worddb.js` and an IndexedDB-backed browser harness.

Success criteria
- SC1: WordDB supports fast in-memory lookups (O(1) avg) for 10k entries after initial load.
- SC2: Batch import from Anki JSON completes within 2s for 10k entries on a dev machine.

Requirements
- R1: Provide CRUD API and batch import/export.
- R2: Use IndexedDB for extension persistence and SQLite for CLI contexts; provide a small in-memory adapter for fast lookups.
- R3: Track provenance and lastUpdated timestamps for each entry.
- R4: Provide migration helpers for schema updates.

Interfaces
- `openDB(options) -> db`
- `db.lookup(word) -> {status, metadata} | null`
- `db.batchImport(entries, options) -> {added, updated, skipped}`
- `db.iterate(callback)` for bulk operations

Timeline
- Week 0–1: Implement in-memory adapter with test fixtures.
- Week 1–2: Add IndexedDB adapter and batch import tests.

Alternatives
- A: Keep full dataset in-memory (fast, memory-heavy).
- B: IndexedDB + in-memory LRU cache (balanced). Preferred for extension.

Testing & validation
- Unit tests for CRUD and batch import semantics.
- Integration test: import sample Anki-derived JSON and assert known/learning/new counts.

Implementation hints
- Normalize keys (lemma/reading/surface) before indexing.
- Provide explicit `compact()` method to remove stale entries.

Open questions
- How to merge conflicting statuses between local edits and Anki sync? (Prefer lastUpdated or user-confirmed changes.)

```
# Known/Learning/New Word Database

## Purpose
The word database stores and manages the user's known, learning, and new words, enabling efficient lookups and updates during annotation.

## Status (repo snapshot)
- Schema and interfaces are defined in this doc. There is no canonical implementation in the workspace snapshot. Implement a small `src/ref/worddb.js` or use IndexedDB in the browser harness for testing.

## Responsibilities
- Maintain a local database of words categorized as known, learning, or new.
- Support efficient queries for word status during annotation.
- Sync with Anki data via the Anki Syncer.

## Architecture
- Local storage: SQLite or IndexedDB for persistence.
- Schema: {word: string, status: "known"|"learning"|"new", metadata: {deck, lastUpdated}}.
- Interfaces: CRUD operations for words and batch updates from Anki.

## Open Questions
1. Should the database support versioning for schema changes?
2. How will the database handle conflicts between local and Anki data?
3. What performance optimizations are needed for large word lists?
