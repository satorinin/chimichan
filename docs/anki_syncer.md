# Anki Syncer

## Purpose
The Anki Syncer integrates with AnkiConnect to fetch known, learning, and new words from selected Anki decks.

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
