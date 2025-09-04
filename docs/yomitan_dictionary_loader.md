```markdown
# Yomitan Dictionary Loader — Design Document

Purpose
- Provide a robust, testable loader that ingests a Yomitan-formatted dictionary (or compatible word-bank files) and produces two artifacts used by the parser pipeline and decorator:
  1. A word-bank index for fast lookups (by surface, lemma, reading).
  2. A pitch-pattern map keyed by lemma or reading used by the pitch annotator.

Scope & assumptions
- Assumption A1: "Yomitan format" refers to the common Migaku/Yomitan-style dictionary exports — typically line-based entries with fields such as surface, reading, gloss, and optional pitch/meta. Exact formats vary between users and tools.
- Assumption A2: The loader must support multiple input variants: JSON, CSV/TSV, and the typical line-based Migaku/Yomitan export. If a strict spec is required later, the loader will add a specific parser module.
- If the incoming file is ambiguous, the loader will attempt to auto-detect format using file extension and simple heuristics (first-line JSON char, presence of tabs/commas, repeated '|' separators, etc.).

Design goals
- G1: Be permissive in accepted input formats but strict in the internal index shape.
- G2: Keep core loader pure and testable: parsing -> normalization -> validation -> indexing.
- G3: Provide an extensible plugin architecture for new dictionary formats.
- G4: Merge user-provided dictionaries with the packaged pitch DB using deterministic conflict rules.

Data model / contracts
- Input entry (loose): may contain fields like { surface, reading, lemma, pos, pitch, notes }
- Internal canonical TokenBankEntry (stable contract):

```json
{
  "surface": "学校",
  "reading": "がっこう",
  "lemma": "学校",
  "pos": "NOUN",
  "pitchPatterns": ["LHH"],
  "sources": ["yomitan-user-2025-09-04"],
  "metadata": { "raw": "..." }
}
```

- Pitch map entry: { key: lemma_or_reading, patterns: ["HLL"], preferredPatternIndex: 0 }

High-level components
- 1) Format detector
  - Reads head of file / blob and returns: json|csv|tsv|migaku-line|unknown.

- 2) Parser(s)
  - JSON parser: straightforward decode and map fields.
  - CSV/TSV parser: configurable header mapping; fallback column heuristics.
  - Migaku/Yomitan line parser: parse pipe/tab-delimited or known export patterns.

- 3) Normalizer
  - Unicode normalization (NFC/NFKC) of surface/reading.
  - Kana normalization for readings (convert fullwidth katakana to hiragana when useful).
  - Lemma fallback: if lemma missing, set lemma := normalized reading for kana-only entries or surface.

- 4) Validator
  - Enforce canonical contract: surface present, at least one of reading/lemma present.
  - Validate pitch pattern strings (only allow H/L characters and small set of expected tokens).

- 5) Indexer
  - Build maps:
    - surfaceIndex: Map<surface, TokenBankEntry[]>
    - lemmaIndex: Map<lemma, TokenBankEntry[]>
    - readingIndex: Map<reading, TokenBankEntry[]>
    - pitchMap: Map<key, patterns>
  - Store provenance (source filename, timestamp) in entries.

- 6) Merger / Conflict resolution
  - Merge strategy (deterministic):
    1. If same key and same patterns, merge sources.
    2. If same key and different patterns, prefer: user-supplied (if flagged as "primary") over bundled; else prefer most-recent by timestamp; else keep both patterns and mark both in metadata.

- 7) Export/Cache
  - Export compact JSON index (gzip optional) usable by extension and CLI.
  - Provide incremental update mode (apply delta file to existing index).

Public API (suggested JS interface)
- loadFile(filePathOrBlob, options) -> Promise<LoadResult>
  - options: { formatHint?: 'json'|'csv'|'migaku', primary?: boolean, validateOnly?: boolean }
  - LoadResult: { entriesLoaded: number, errors: Error[], warnings: Warning[], indexPath?: '/path/to/output.json' }

- lookupBySurface(surface) -> TokenBankEntry[]
- lookupByReading(reading) -> TokenBankEntry[]
- lookupByLemma(lemma) -> TokenBankEntry[]
- getPitchPatternsFor(token) -> string[] // token: {surface, reading?, lemma?}

CLI
- Provide a minimal CLI `scripts/load_yomitan.js` or `bin/load_yomitan.py` to:
  - validate a file
  - produce `dist/pitch_index.json` and `dist/wordbank.json`
  - show stats: entries loaded, duplicates, malformed lines

Testing strategy
- Unit tests per parser variant (JSON, CSV, Migaku-line), covering edge cases: missing fields, malformed pitch strings, multi-entry lines.
- Integration test: load a small sample Yomitan file and assert exported index contains expected entries and pitch mappings.
- Performance test: load a 100k-entry dictionary and ensure memory and time are reasonable. Target: load+index 100k entries in < 10s on a dev laptop (adjustable).

Success criteria
- SC1: Loader correctly loads and validates a representative Yomitan export (provided as test fixture) and produces an index that answers lookup queries (surface/reading/lemma) with correct pitch patterns.
- SC2: Pitch lookup returns a deterministic preferred pattern for >= 95% of test words in a supplied gold dataset.
- SC3: CLI produces a compact index file that can be loaded by the decorator with <50ms lookup time per token (in-memory map) on a developer machine.

Edge cases and heuristics
- Multiword expressions: support keys that contain spaces; when indexing, record both multiword key and component tokens to help matching.
- Ambiguous readings: if multiple entries share same surface but different readings, return all candidates and prefer lemma match where available.
- Non-Japanese entries: keep them but mark with pos/metadata and low-priority for lookup.

Security and privacy
- Treat uploaded user dictionary files as untrusted input. Never execute code from them.
- Validate JSON/CSV fields for length limits to avoid DoS via huge fields.

Migration & update strategy
- Keep `source` and `timestamp` metadata for each entry to allow safe merges and rollbacks.
- Provide a `merge` mode that does not overwrite the existing index unless `--force` is passed.

Implementation notes & incremental plan
1. Implement the format detector and a JSON parser mapping to canonical entries.
2. Implement normalization + validator + in-memory indexer.
3. Add CSV/TSV parser and Migaku-line parser.
4. Add CLI and export step; add tests and a sample fixture.

Open questions
- Q1: Do you have a canonical Yomitan export sample to pin the exact line format? If yes, add it to `test/fixtures/` and the loader will implement a targeted parser.
- Q2: Should pitch patterns support richer encodings (numeric high/low positions) or remain short H/L strings? Current plan: H/L pattern strings; extendable later.

If you'd like, I will scaffold the JSON loader (small `src/ref/yomitan_loader.js`), a CLI harness, and unit tests next. Confirm and I'll implement.

```
