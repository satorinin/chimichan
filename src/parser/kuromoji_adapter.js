// Kuromoji adapter for morphology
// Tries to initialize kuromoji if available (Node environment with kuromoji package installed).

let tokenizer = null;

function initNodeKuromoji() {
  return new Promise((resolve, reject) => {
    let kuromoji;
    try {
      kuromoji = require('kuromoji');
    } catch (err) {
      return reject(new Error('kuromoji not installed'));
    }
    // Build tokenizer using local dictionary (kuromoji package includes dict)
    kuromoji.builder({ dicPath: null }).build((err, t) => {
      if (err) return reject(err);
      tokenizer = t;
      resolve(adapter);
    });
  });
}

const adapter = {
  // Tokenize a surface. Returns {reading, lemma, pos}
  tokenize: function(surface) {
    if (tokenizer) {
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
        // fallthrough to stub
      }
    }
    // Fallback stub
    return {
      reading: surface,
      lemma: surface,
      pos: 'UNK'
    };
  }
};

module.exports = {
  init: function() {
    // Try to init kuromoji in Node; returns a Promise resolving to the adapter or rejecting if not available
    return initNodeKuromoji();
  },
  adapter
};