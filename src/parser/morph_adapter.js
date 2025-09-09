// Simple pluggable morphology adapter interface and a stub implementation

// Public API: register(adapter) and tokenize(surface)
let adapter = null;

// Try to auto-initialize kuromoji adapter in Node
try {
  const kuromojiAdapterModule = require('./kuromoji_adapter');
  // Attempt to initialize; if it succeeds, register the adapter
  if (kuromojiAdapterModule && typeof kuromojiAdapterModule.init === 'function') {
    kuromojiAdapterModule.init().then(() => {
      adapter = kuromojiAdapterModule.adapter;
      console.info('kuromoji adapter registered (node)');
    }).catch(() => {
      // ignore if kuromoji isn't available in this environment
    });
  }
} catch (e) {
  // ignore require errors in environments without CommonJS or kuromoji
}

// If running in a browser, try to load kuromoji from unpkg and register a browser adapter
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  (function loadKuromojiBrowser(version = '0.1.2') {
    // Avoid re-initializing
    if (adapter && adapter._isBrowserKuromoji) return;
    const script = document.createElement('script');
    script.src = `https://unpkg.com/kuromoji@${version}/dist/kuromoji.js`;
    script.async = true;
    script.onload = () => {
      if (!window.kuromoji) {
        console.warn('kuromoji script loaded but global kuromoji not found');
        return;
      }
      try {
        window.kuromoji.builder({ dicPath: `https://unpkg.com/kuromoji@${version}/dict/` }).build((err, tokenizer) => {
          if (err) {
            console.warn('Failed to build kuromoji tokenizer in browser', err);
            return;
          }
          // browser adapter
          adapter = {
            _isBrowserKuromoji: true,
            tokenize: function(surface) {
              try {
                const toks = tokenizer.tokenize(surface);
                if (toks && toks.length > 0) {
                  const t = toks[0];
                  return {
                    reading: t.reading || t.surface_form,
                    lemma: (t.basic_form && t.basic_form !== '*') ? t.basic_form : t.surface_form,
                    pos: t.pos || 'UNK'
                  };
                }
              } catch (e) {
                // fallthrough
              }
              return { reading: surface, lemma: surface, pos: 'UNK' };
            }
          };
          console.info('kuromoji adapter registered (browser)');
        });
      } catch (e) {
        console.warn('Error initializing kuromoji in browser', e);
      }
    };
    script.onerror = () => {
      console.warn('Failed to load kuromoji script from CDN');
    };
    document.head.appendChild(script);
  })();
}

module.exports = {
  register: function(a) {
    adapter = a;
  },
  tokenize: function(surface) {
    if (adapter && typeof adapter.tokenize === 'function') {
      return adapter.tokenize(surface);
    }
    // Stub: return minimal metadata
    return {
      reading: surface,
      lemma: surface,
      pos: 'UNK'
    };
  }
};
