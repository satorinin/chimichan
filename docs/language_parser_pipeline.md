```markdown
# Language Parser Pipeline — Design

Purpose
- Convert arbitrary text (webpage, subtitles, pasted text) to a stable token stream used by downstream components (decorator, comprehension, Anki sync).

Status (repo snapshot)
- Design and token contract are documented here. A reference parser implementation is not present in this workspace snapshot; see `docs/dev-setup.md` for adding `src/ref/parser.js` and tests.

Success criteria
- SC1: `parse(text)` returns `Sentence[]` where each token matches the token contract: `{surface, reading?, lemma?, pos?, start, end}`.
- SC2: Unit tests for 10 representative Japanese sentences pass, including multiword expressions and mixed-script cases.

Requirements
- R1: Provide `parse(text:string): Promise<Sentence[]>` (or synchronous variant) with deterministic output.
- R2: Use `Intl.Segmenter` for sentence/word boundaries when available; include a fallback hypertokenizer for environments without it.
- R3: Provide a pluggable morphology adapter interface to swap kuromoji or other tokenizers.
- R4: Preserve token offsets (start/end) relative to input text for accurate DOM mapping.
- R5: Normalize unicode (NFC/NFKC) and emit canonical token fields early.

Interfaces
- `parse(text) -> Sentence[]`
- `morphAdapter.register(adapter)` — adapter implements `tokenize(surface) -> {reading, lemma, pos}`
- Token contract: `{ surface, reading?, lemma?, pos?, start, end }`

Timeline
- Week 0–1: Implement `parse` using `Intl.Segmenter` + fallback. Add baseline tests for token contract.
- Week 1–2: Add morphology adapter interface and a stub adapter; add tests.
- Week 3: Add multiword expression support and additional normalization tests.

Alternatives and tradeoffs
- A: Use kuromoji in all environments — better morphological accuracy but heavier payload and harder to run in-browser.
- B: Use only `Intl.Segmenter` + heuristics — faster and lightweight, but less accurate on lemma/reading extraction.

Testing & validation
- Unit tests for segmentation and token offsets.
- Property test: idempotence — parsing identical text twice returns structurally equal results.
- Integration test: mapping tokens back to DOM ranges in `scripts/harness.html`.

Implementation hints
- Keep parsing pure. Normalize text early. Provide adapters for morphology to keep core parser small.

Open questions
- How should multiword expressions be surfaced to downstream components? (emit as single token or as meta on adjacent tokens?)
- What languages beyond Japanese should be considered in v1?

```
# Language Parser Pipeline

## Purpose
The Language Parser Pipeline processes text into tokens, providing the foundation for annotations like furigana, pitch coloring, and unknown word detection.

## Status (repo snapshot)
- Design and token contract are documented here. A reference parser implementation is not present in the current workspace snapshot. See `docs/dev-setup.md` for steps to add `src/ref/parser.js` and tests.

## Responsibilities
- Split text into sentences and tokens.
- Perform morphological analysis to extract lemma, reading, and part-of-speech (POS) information.
- Output token data for use by the language decorator.

## Architecture
- Sentence splitting: Use Intl.Segmenter for sentence and word boundaries.
- Morphological analysis: Use kuromoji or similar tokenizer for Japanese.
- Token shape: {surface, reading, lemma, pos, start, end}.

## Open Questions
1. How will the pipeline handle multiword expressions?
2. Should the pipeline support additional languages beyond Japanese?
3. What fallback mechanisms are needed for environments without Intl.Segmenter?
