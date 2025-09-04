```markdown
# Browser Extension UI — Design

Purpose
- Integrate the SPA into browser extension form (Manifest V3) and provide per-site toggles, quick actions, and permissions management while preserving client-side processing.

Status (repo snapshot)
- Packaging is not present in this snapshot. Use the harness to iterate UI prior to packaging.

Success criteria
- SC1: Unpacked extension (manual test) applies decorations on opt-in pages and respects per-site toggles.
- SC2: Required permissions are minimized and documented in `docs/permissions.md` (create if missing).

Requirements
- R1: Content script injects or loads decorator code only after user opts-in for a site.
- R2: Settings UI accessible via browser action popup and persistent across sessions.
- R3: Background script limited to managing state and messaging; heavy processing occurs in content script/SPA.
- R4: Manifest V3 compliant — document required permissions clearly.

Interfaces
- Messages: `{type: 'decorate', payload}`, `{type: 'getSettings'}`, `{type: 'setSiteOptIn'}`

Timeline
- Week 0–1: Implement popup UI and basic messaging between popup and content script via `chrome.runtime.sendMessage`.
- Week 1–2: Add per-site opt-in toggles and persistence; manual test with unpacked extension.

Alternatives
- A: Inline the SPA in content script for simplicity (larger payload).
- B: Lazy-load SPA from extension asset when user opens popup — reduces initial injection overhead.

Testing & validation
- Manual test: load unpacked extension, opt-in to a site, verify decorations applied.
- Automated linting for `manifest.json` and permissions.

Implementation hints
- Avoid injecting global CSS that could break pages; scope styles under `.chimichan-extension`.

Open questions
- Cross-origin AnkiConnect access: prefer user-run local AnkiConnect; no cross-origin remote Anki should be attempted by default.

```
# Browser Extension UI

## Purpose
The Browser Extension UI integrates the app into the browser, enabling users to decorate webpages with furigana and pitch coloring for supported languages. Users can enable these features for specific pages and interact with annotations directly.

## Status (repo snapshot)
- The document lists packaging intentions (Manifest V3) and UX notes. There is no packaged extension in the repository snapshot. Use the harness workflow in `docs/dev-setup.md` to iterate before packaging.

## Responsibilities
- Inject the User View (SPA) as a content script into webpages.
- Decorate webpage text with furigana and pitch coloring based on user settings.
- Provide a browser action popup for enabling/disabling features and accessing quick settings.
- Manage permissions for accessing webpage content and AnkiConnect.

## Architecture
- Built using Chrome/Firefox Extension Manifest V3.
- Includes a background script for managing extension state and permissions.
- Content script communicates with the SPA and browser action popup.
- Furigana and pitch decorations are applied dynamically to webpage content.

## Open Questions
1. How will the extension handle cross-origin requests for AnkiConnect?
2. What permissions are required for full functionality?
3. Should the extension include a debugging mode for developers?
4. How will the extension handle dynamic content (e.g., AJAX-loaded pages)?
