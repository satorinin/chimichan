```markdown
# Anki Syncer — Design

Purpose
- Provide a thin, testable client that queries AnkiConnect (JSON-RPC) and emits normalized word lists for the WordDB import.

Status (repo snapshot)
- Contract and methods are documented. The CLI utilities are not guaranteed to be present in the current snapshot. This doc defines the required behavior.

Success criteria
- SC1: CLI `src/cli_download_srs.py --host 127.0.0.1 --port 8765` returns JSON with `known`, `learning`, and `new` word arrays when AnkiConnect is available.
- SC2: Unit tests that mock AnkiConnect verify parsing logic for deck responses and sentence card extraction.

Requirements
- R1: Configurable host/port with sensible defaults (127.0.0.1:8765).
- R2: Retry/backoff and clear error messages when AnkiConnect is unreachable.
- R3: Efficient handling for large decks: streaming/iterator-based parsing instead of loading entire decks into memory where possible.
- R4: Provide a dry-run mode (`--validate`) that checks AnkiConnect responses and outputs statistics without writing to WordDB.

Interfaces
- `fetchDeckWords(deckId) -> AsyncIterator<WordEntry>`
- `parseSentenceCard(card) -> [words]`
- `exportToWordDB(wordList, options) -> Promise<Result>`

Timeline
- Week 0–1: Implement a minimal client and CLI that fetches note ids and basic fields; return structured JSON.
- Week 1–2: Add streaming parsing for large decks, robust error handling, and tests.

Alternatives
- A: Read all notes at once — simpler but may OOM on large decks.
- B: Use AnkiConnect `findNotes` + `notesInfo` paginated approach — recommended for scalability.

Testing & validation
- Mock AnkiConnect responses to test parsing logic.
- Integration test with a small AnkiConnect instance or recorded fixture.

Implementation hints
- Keep network client separate from parsing logic to ease testing.
- Log useful metrics: notes fetched, parse errors, time taken.

Open questions
- Should the syncer attempt to reconcile card-level metadata (interval, ease) into learning status heuristics, or should status be derived solely from deck membership/field tags?

```
# Anki Syncer

## Purpose
The Anki Syncer integrates with AnkiConnect to fetch known, learning, and new words from selected Anki decks.

## Status (repo snapshot)
- The AnkiSyncer contract and methods are documented. The repository snapshot may or may not include `src/cli_download_srs.py` — check `src/` for CLI utilities. Use `docs/dev-setup.md` to add or exercise a small Anki CLI test.

## Responsibilities
- Query AnkiConnect for word lists and sentence cards.
- Parse sentence cards to extract words and update known/learning/new lists.
- Provide a thin client module for other components to access Anki data.

## Architecture
- Communicates with AnkiConnect JSON-RPC at http://127.0.0.1:8765.
- Supports `--host` and `--port` overrides for custom AnkiConnect setups.
- Methods: getKnownWords, getLearningWords, getNewWords, parseSentenceCards.

## Open Questions
1. How will the syncer handle large Anki decks efficiently?
2. Should the syncer cache results locally to reduce AnkiConnect calls?
3. What error handling is needed for AnkiConnect unavailability?
