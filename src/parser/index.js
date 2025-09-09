// Entry point for the parser module
// Responsible for tokenizing input text and enriching tokens with metadata

const morph = require('./morph_adapter');

function isWhitespace(str) {
  return /^\s+$/.test(str);
}

function fallbackTokenize(text) {
  // Simple fallback: split on runs of non-whitespace and include punctuation as tokens
  const tokens = [];
  const re = /\S+/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const surface = m[0];
    const start = m.index;
    const end = start + surface.length;
    const meta = morph.tokenize(surface) || {};
    tokens.push(Object.assign({ surface, start, end }, meta));
  }
  return tokens;
}

function segmenterTokenize(text) {
  const tokens = [];
  const seg = new Intl.Segmenter('ja', { granularity: 'word' });
  for (const s of seg.segment(text)) {
    const surface = s.segment;
    const start = s.index;
    const end = start + surface.length;
    if (surface.length === 0) continue;
    if (isWhitespace(surface)) continue; // skip pure whitespace
    const meta = morph.tokenize(surface) || {};
    tokens.push(Object.assign({ surface, start, end }, meta));
  }
  return tokens;
}

module.exports = {
  // parse(text): returns array of tokens with shape {surface, reading?, lemma?, pos?, start, end}
  parse: function(inputText) {
    const text = (inputText || '').normalize('NFC');
    if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
      return segmenterTokenize(text);
    }
    return fallbackTokenize(text);
  },

  // kept for backwards compatibility with earlier scaffolding
  tokenize: function(inputText) {
    return module.exports.parse(inputText);
  }
};
