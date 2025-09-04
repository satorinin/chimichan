```markdown
# User View (SPA) — Design

Purpose
- Provide users with controls for annotation behavior, settings, and to surface comprehension summaries and n+1 mining candidates.

Status (repo snapshot)
- The SPA is a documented concept but not implemented. Early work should favour a minimal, framework-agnostic harness.

Success criteria
- SC1: Settings panel allows toggling furigana/pitch modes and persists changes.
- SC2: UI displays ComprehensionReport with clear categories and actions for n+1 sentences.

Requirements
- R1: Provide settings UI: furiganaMode, pitchMode, deck selection, thresholds.
- R2: Display comprehension summary and per-sentence annotations (with links to "mine" sentences).
- R3: Store settings in extension storage/localStorage and respect per-site opt-in.

Interfaces
- UI <-> Content script via message bus (get/set settings, request decorate, request comprehension).

Timeline
- Week 0–1: Create minimal settings UI and wire to in-memory settings store.
- Week 1–2: Integrate with harness and display comprehension output.

Alternatives
- A: Build SPA in React/Vue — faster developer experience but heavier dependency set.
- B: Small vanilla JS UI for minimal surface area and easy embedding into content scripts (recommended until team decides on framework).

Testing & validation
- Manual UI tests for settings persistence and toggles.
- Integration test: harness + UI shows expected comprehension summaries for sample text.

Implementation hints
- Keep the UI stateless where possible; drive display from `ComprehensionReport` and token annotations.

Open questions
- Do we prefer a full SPA framework or lightweight vanilla JS for v1? Recommendation: start lightweight and upgrade if needed.

```
# User View (Single Page App)

## Purpose
The User View is the main interface for users to interact with the app. It provides controls for enabling/disabling features, viewing annotations, and managing settings.

## Status (repo snapshot)
- SPA UX and responsibilities are documented here; there is no SPA implementation in the repo snapshot. Prefer small UI fixtures (`scripts/harness.html`) and storybook-like examples instead of full framework choices early on.

## Responsibilities
- Render interactive text and subtitles with annotations (furigana, pitch, unknown words).
- Provide a settings panel for configuring furigana, pitch coloring, and Anki deck selection.
- Display n+1 sentences and difficulty ratings for content.

## Architecture
- Built as a single-page application (SPA) using modern JavaScript frameworks (e.g., React, Vue, or Svelte).
- Communicates with the language parser pipeline and decorator to render annotated content.
- Stores user preferences in localStorage or browser extension storage.

## Open Questions
1. Should the SPA include a preview mode for testing annotations?
2. How will the SPA handle large text inputs (e.g., entire webpages)?
3. What framework or library should be used for the SPA?
