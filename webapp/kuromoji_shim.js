// In-browser kuromoji shim: loads kuromoji from unpkg and exposes window.morphTokenize(surface)
(function(){
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (typeof window.morphTokenize === 'function') return; // already registered

  const version = '0.1.2';
  const script = document.createElement('script');
  script.src = `https://unpkg.com/kuromoji@${version}/dist/kuromoji.js`;
  script.async = true;
  script.onload = () => {
    if (!window.kuromoji) {
      console.warn('kuromoji loaded but not available on window');
      return;
    }
    try {
      window.kuromoji.builder({ dicPath: `https://unpkg.com/kuromoji@${version}/dict/` }).build((err, tokenizer) => {
        if (err) {
          console.warn('kuromoji builder error', err);
          return;
        }
        window.morphTokenize = function(surface) {
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
            console.warn('kuromoji tokenize error', e);
          }
          return { reading: surface, lemma: surface, pos: 'UNK' };
        };
        console.info('window.morphTokenize registered via kuromoji shim');
        // Trigger an event so app can re-render if needed
        window.dispatchEvent(new Event('kuromoji-ready'));
      });
    } catch (e) {
      console.warn('Error initializing kuromoji', e);
    }
  };
  script.onerror = () => console.warn('Failed to load kuromoji from CDN');
  document.head.appendChild(script);
})();
