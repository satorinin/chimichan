# User View (Single Page App)

## Purpose
The User View is the main interface for users to interact with the app. It provides controls for enabling/disabling features, viewing annotations, and managing settings.

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
