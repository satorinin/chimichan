Kuromoji.js browser demo

This is a tiny single-page demo that loads kuromoji.js from unpkg and uses the package's dictionary hosted on unpkg as well.

How to use

- Open `web/index.html` in a browser that allows loading resources from unpkg (modern browsers do).
- Wait for the "Tokenizer ready" status, paste Japanese text, and click Parse. You can also press Cmd/Ctrl+Enter.

Notes

- The page loads `kuromoji.js` and dictionary files from unpkg (CDN). If you need an offline copy, download the `build/kuromoji.js` and the `dict/` folder from the kuromoji repository and serve them from a local HTTP server; update `main.js`'s `dicPath` accordingly.
- This demo is intentionally minimal — it returns the raw kuromoji token objects so you can experiment or wire into your app.
