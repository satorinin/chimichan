# Browser Extension UI

## Purpose
The Browser Extension UI integrates the app into the browser, enabling users to decorate webpages with furigana and pitch coloring for supported languages. Users can enable these features for specific pages and interact with annotations directly.

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
