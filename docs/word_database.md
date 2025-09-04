# Known/Learning/New Word Database

## Purpose
The word database stores and manages the user's known, learning, and new words, enabling efficient lookups and updates during annotation.

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
