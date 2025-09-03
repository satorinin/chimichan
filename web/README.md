Kuromoji.js browser demo

This is a tiny single-page demo that loads kuromoji.js from unpkg and uses the package's dictionary hosted on unpkg as well.

How to use

- Open `web/index.html` in a browser that allows loading resources from unpkg (modern browsers do).
- Wait for the "Tokenizer ready" status, paste Japanese text, and click Parse. You can also press Cmd/Ctrl+Enter.

Notes

- The page loads `kuromoji.js` and dictionary files from unpkg (CDN). If you need an offline copy, download the `build/kuromoji.js` and the `dict/` folder from the kuromoji repository and serve them from a local HTTP server; update `main.js`'s `dicPath` accordingly.
- This demo is intentionally minimal — it returns the raw kuromoji token objects so you can experiment or wire into your app.

AnkiConnect CORS proxy (development)

If you run into cross-origin restrictions when calling AnkiConnect from the browser (Same Origin Policy), launch the small proxy provided at `scripts/anki-proxy.js` and point your UI to it.

Example:

```bash
# forward local port 3000 to your AnkiConnect instance (default http://127.0.0.1:8765)
node scripts/anki-proxy.js 3000 http://127.0.0.1:8765

# then point the Anki address input in the demo to http://127.0.0.1:3000
```

This proxy is for local development only and is not intended for production use. It simply forwards POST requests and adds permissive CORS headers.
