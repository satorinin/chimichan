# Language Parser Pipeline

## Purpose
The Language Parser Pipeline processes text into tokens, providing the foundation for annotations like furigana, pitch coloring, and unknown word detection.

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
