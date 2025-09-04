```markdown
# Comprehension Calculator — Design

Purpose
- Compute page- and sentence-level comprehension metrics from parsed tokens and the WordDB, and surface n+1 sentences for mining.

Status (repo snapshot)
- Algorithm and pseudocode exist in previous docs; no reference implementation in this snapshot. This doc formalizes requirements and success criteria.

Success criteria
- SC1: Reference implementation `computeComprehension(sentences, wordDB)` returns the documented `ComprehensionReport` and reproduces the example calculation in tests.
- SC2: n+1 detection works on synthetic tests and identifies the unknown token reliably.

Requirements
- R1: Implement deterministic scoring using configurable `posWeights` and `statusScores`.
- R2: Support incremental computation (viewport-first) and cached WordDB lookups.
- R3: Provide clear category thresholds configurable via settings.

Interfaces
- `computeComprehension(sentences, wordDB, options) -> ComprehensionReport`
- `ComprehensionReport` shape documented in this repo; keep backwards-compatible changes.

Timeline
- Week 0–1: Implement core scoring function and unit tests with example sentences.
- Week 1–2: Add incremental/viewport-first API and performance tests.

Alternatives
- A: Sentence-level scoring only — simpler but less stable for mixed-length pages.
- B: Token-level scoring (preferred) — more stable; already described in pseudocode.

Testing & validation
- Unit tests for scoring math and category thresholds.
- Integration test using harness: compute comprehension for sample HTML and verify decorator highlights.

Performance targets
- Compute comprehension for 1k tokens in < 500ms with in-memory cache on a dev machine.

Implementation hints
- Cache WordDB lookups in a Map during a page run.
- Expose configuration for POS-to-weight mapping to allow tuning later.

Open questions
- Should the ComprehensionReport include token-level explanations for UX (e.g., top unknown tokens per sentence)? Recommended: yes, include a `highlights` section.

```
# Comprehension Calculator

## Purpose
The Comprehension Calculator provides users with insights into how much of a webpage they understand based on their known words and sentences. It highlights areas of the page that are fully understood, partially understood, or unknown and surfaces n+1 sentences for mining.

## Status (repo snapshot)
- The scoring algorithm and pseudocode are documented. There is no reference implementation in the repository snapshot. Add a reference `src/ref/comprehension.js` and unit tests to lock down the contract and defaults.

## Responsibilities
- Analyze tokenized webpage content to calculate the percentage of known words and sentences.
- Highlight sentences that are fully understood, mostly understood, n+1, or unknown.
- Provide a summary of comprehension statistics (e.g., percentage of known words, number of fully understood sentences).
- Run entirely client-side and use local WordDB (IndexedDB/SQLite) and parser output.

## Inputs & outputs (contract)
- Input: array of sentences, where each sentence is an array of tokens. Token shape (from parser pipeline):

  {
    surface: string,
    reading?: string, // kana
    lemma?: string,
    pos?: string,
    start: number,
    end: number
  }

- Word status lookup: from the WordDB (synchronous or cached async): {status: "known" | "learning" | "new" | "unknown"}

- Output: a ComprehensionReport object:

  {
    pageScore: number,           // 0..1 weighted token comprehension
    knownWordPercent: number,    // 0..100
    sentenceReports: [
      { sentenceIndex, score: number, category: string, unknownCount: number }
    ],
    fullyKnownSentenceCount: number,
    nPlusOneSentences: [ { sentenceIndex, unknownToken, sentenceText } ]
  }


## Scoring algorithm (draft)
The goal is a simple, tunable metric that reflects how much of the page the user understands while accounting for token importance (particles vs content words) and Anki learning state.

1. Token weight (w)
   - Determine token importance from POS.
   - Heuristic defaults:
     - Content words (NOUN, VERB, ADJ, ADV, NUM, PROPN): w = 1.0
     - Auxiliary/Function words (PART, AUX, ADP, DET, PRON, CONJ, PUNCT): w = 0.2
     - Unknown/others: w = 0.6 (fallback)

2. Token status score (s)
   - Map Anki status -> score: defaults are tunable in settings.
     - known -> 1.0
     - learning -> 0.6
     - new -> 0.0
     - unknown -> 0.0

3. Token contribution = w * s

4. Sentence score = sum(token_contributions) / sum(token_weights)
   - Normalized to 0..1.

5. Page / paragraph score = weighted average across sentences or across tokens (prefer token-level average for stability):
   - pageScore = sum(all token contributions) / sum(all token weights)

6. Fully-known sentence
   - Default rule: all content tokens (w >= 0.8) have status == known.
   - Alternate relaxed rule (configurable): sentence_score >= 0.95.

7. n+1 sentence detection
   - A sentence is n+1 if the count of content tokens with status in {new, unknown} equals 1 and remaining content tokens have status in {known, learning}.
   - When detected, include the unknown token as a mining candidate.


## Example calculation
Sentence tokens with POS-based weights and statuses:
- Token A (NOUN, known): w=1.0, s=1.0 => 1.0
- Token B (PART, known): w=0.2, s=1.0 => 0.2
- Token C (VERB, learning): w=1.0, s=0.6 => 0.6
- Token D (ADP, new): w=0.2, s=0.0 => 0.0

Sentence score = (1.0 + 0.2 + 0.6 + 0.0) / (1.0 + 0.2 + 1.0 + 0.2) = 1.8 / 2.4 = 0.75

If this is the only sentence on the page, pageScore = 0.75 -> 75% comprehension.

## UX mapping & thresholds (defaults)
- pageScore >= 0.90 -> "Excellent" (green)
- 0.70 <= pageScore < 0.90 -> "Good" (lime)
- 0.40 <= pageScore < 0.70 -> "Partial" (amber)
- pageScore < 0.40 -> "Low" (red)

Sentence categories (visuals)
- Fully-known sentence: highlight with a subtle green background and optionally collapse as "known".
- n+1 sentence: mark with an underline and an icon offering "Mine this sentence".
- Mostly-known: faint highlight and suggestion to learn the top unknown words.

Settings: allow users to tweak token weights, learning score, and thresholds in the UI.

## Pseudocode

```text
function computeComprehension(sentences, wordDB, posWeights, statusScores) -> ComprehensionReport:
  totalWeightedScore = 0
  totalWeights = 0
  sentenceReports = []

  for i, sentence in enumerate(sentences):
    sentWeightedScore = 0
    sentWeights = 0
    contentUnknowns = []
    contentTokens = 0

    for token in sentence:
      pos = token.pos or 'UNKNOWN'
      w = posWeights.get(pos_category(pos), default=0.6)
      status = wordDB.lookup(token.lemma || token.surface) // returns known|learning|new|unknown
      s = statusScores[status]
      sentWeightedScore += w * s
      sentWeights += w

      if is_content_pos(pos) and status in ('new', 'unknown'):
        contentUnknowns.append(token)
      if is_content_pos(pos):
        contentTokens += 1

    sentenceScore = (sentWeightedScore / sentWeights) if sentWeights>0 else 0
    category = categorizeSentence(sentenceScore, contentUnknowns, contentTokens)
    sentenceReports.append({ sentenceIndex: i, score: sentenceScore, category: category, unknownCount: len(contentUnknowns) })

    totalWeightedScore += sentWeightedScore
    totalWeights += sentWeights

  pageScore = (totalWeightedScore / totalWeights) if totalWeights>0 else 0

  fullyKnownCount = count sentences where category == 'fully-known'
  nPlusOneList = sentences where len(contentUnknowns) == 1 and other content tokens are known/learning

  return ComprehensionReport(pageScore, pageScore*100, sentenceReports, fullyKnownCount, nPlusOneList)
```

## Performance & incremental updates
- Compute scores incrementally as new content or Anki updates arrive.
- Cache word status lookups in memory for the current page load to avoid repeated DB hits.
- For large pages, compute per-visible-viewport first, then background-process remaining sentences.

## Edge cases & heuristics
- Punctuation and non-Japanese segments: ignore or low-weight.
- Multiword expressions: attempt to detect via kuromoji compound tags; fallback to per-token scoring if uncertain.
- Tokens without POS/lemma: use fallback weight and lookup by surface form.
- Languages without morphological info: use Intl.Segmenter tokens and default weights.

## Integration points
- Consumes token stream from `docs/language_parser_pipeline.md` / `src/lexor/parser.ts` output.
- Uses WordDB from `docs/word_database.md` for status lookups.
- Emits ComprehensionReport to `docs/user_view.md` UI and `docs/language_decorator.md` for sentence highlighting.

## Mermaid: where the calculator sits

```mermaid
flowchart LR
  Parser[Parser Pipeline]
  WordDB[WordDB (IndexedDB)]
  Comprehension[Comprehension Calculator]
  Decorator[Language Decorator]
  UI[User View]

  Parser --> Comprehension
  WordDB --> Comprehension
  Comprehension --> Decorator
  Comprehension --> UI
```

## Next steps
- Implement a reference JS/TS module that computes the `ComprehensionReport` for a page and unit-test it with a few synthetic sentences.
- Add UI mockups in `docs/user_view.md` showing where comprehension stats and n+1 suggestions appear.
- Tune defaults and thresholds after user testing.
