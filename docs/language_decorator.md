# Language Decorator

## Purpose
The Language Decorator applies annotations (furigana, pitch coloring, unknown words) to tokens processed by the parser pipeline.

## Responsibilities
- Annotate tokens with furigana based on user settings (None, All, Unknown, On hover).
- Apply pitch accent coloring to tokens.
- Underline unknown words and highlight n+1 sentences.

## Architecture
- Input: Token data from the parser pipeline.
- Output: Annotated HTML elements (e.g., <ruby>, <span> with data attributes).
- Settings: Controlled via the User View or browser extension UI.

## Open Questions
1. How will the decorator handle overlapping annotations (e.g., furigana + pitch)?
2. What CSS/HTML structures are best for accessibility and performance?
3. Should the decorator support dynamic updates (e.g., live editing)?
