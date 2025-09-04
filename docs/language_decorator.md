```markdown
# Language Decorator — Design

Purpose
- Render annotations (furigana, pitch coloring, underlines) into HTML in a way that is accessible, reversible, and minimally invasive to page layout and behavior.

Status (repo snapshot)
- The doc captures rendering rules and open questions. No reference harness exists; use `scripts/harness.html` and `scripts/harness.js` to iterate rapidly.

Success criteria
- SC1: Rendering function can produce semantic `<ruby>` markup for furigana and fallback CSS markup where `<ruby>` is not feasible.
- SC2: Applying and removing decorations is idempotent and does not leak or duplicate DOM nodes.
- SC3: Pitch coloring is applied using CSS variables and is visually testable in the harness.

Requirements
- R1: API `renderToken(token, options) -> HTMLElement` that returns an element representing the token with decorations applied.
- R2: Support user settings: furiganaMode {none, all, unknown, hover}, pitchMode {none, hover, always}.
- R3: Decorator must attach minimal, namespaced data-attributes (e.g., `data-chimichan-token`) to allow future lookups and updates.
- R4: Provide undo/remove API `removeDecorations(rootElement)` that reverts DOM to original state.
- R5: Ensure accessibility: `<ruby>` uses `<rt>` for readings; fallback adds `aria-label` where needed.

Interfaces
- `renderToken(token, opts) -> HTMLElement`
- `decorateRange(range, tokens, opts) -> { appliedNodes: HTMLElement[] }`
- `removeDecorations(root) -> void`

Timeline
- Week 0–1: Implement basic `renderToken` that outputs `<ruby>` for tokens with readings; add harness to visualize.
- Week 1–2: Implement pitch-color mapping and tests demonstrating color application.
- Week 2–3: Implement `decorateRange` over DOM ranges and `removeDecorations` with idempotence tests.

Alternatives and tradeoffs
- A: Mutate page DOM in-place with semantic markup — best for accessibility but may break page CSS.
- B: Use overlay spans positioned above text — safer for layout but harder to keep in sync with dynamic content.

Testing & validation
- Unit tests: `renderToken` output contains expected HTML structure for sample tokens.
- Integration: harness loads a sample paragraph, decorates it, and verifies removal returns original HTML.
- Accessibility audit: ensure screen readers can access readings via `aria-label` when `<ruby>` unsupported.

Implementation hints
- Namespace all CSS / attributes to avoid collisions (e.g., `.chimichan-ruby`).
- Use `DocumentFragment` for batch DOM updates to reduce reflows.

Open questions
- How to handle overlapping decorations (pitch + furigana) without nesting conflicts? (Strategy: combine into a single wrapper element per token.)

```
# Language Decorator

## Purpose
The Language Decorator applies annotations (furigana, pitch coloring, unknown words) to tokens processed by the parser pipeline.

## Status (repo snapshot)
- Specified rendering rules and open questions are in this doc. No reference decorator harness exists in the repository snapshot — add `scripts/harness.html` and `scripts/harness.js` as described in `docs/dev-setup.md` to iterate quickly.

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
