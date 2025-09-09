// Chimichan MVP App Logic (browser-friendly)

const inputElement = document.getElementById('input');
const outputElement = document.getElementById('output');
const intermediateElement = document.getElementById('intermediate');

function isWhitespace(str) { return /^\s+$/.test(str); }

function localParse(text) {
  const t = (text || '').normalize('NFC');
  const tokens = [];
  if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
    const seg = new Intl.Segmenter('ja', { granularity: 'word' });
    for (const s of seg.segment(t)) {
      const surface = s.segment;
      const start = s.index;
      const end = start + surface.length;
      if (surface.length === 0) continue;
      if (isWhitespace(surface)) continue;
      const meta = (typeof window !== 'undefined' && typeof window.morphTokenize === 'function') ? window.morphTokenize(surface) : { reading: surface, lemma: surface, pos: 'UNK' };
      tokens.push(Object.assign({ surface, start, end }, meta));
    }
    return tokens;
  }
  const re = /\S+/g; let m;
  while ((m = re.exec(t)) !== null) {
    const surface = m[0]; const start = m.index; const end = start + surface.length;
    const meta = (typeof window !== 'undefined' && typeof window.morphTokenize === 'function') ? window.morphTokenize(surface) : { reading: surface, lemma: surface, pos: 'UNK' };
    tokens.push(Object.assign({ surface, start, end }, meta));
  }
  return tokens;
}

function decorateText(tokens) {
  return tokens.map(token => {
    const color = token.pos === 'UNK' ? '#d9534f' : '#5cb85c';
    return `<span title="${token.reading}" style="color:${color}; padding:0 2px">${token.surface}</span>`;
  }).join('');
}

function renderForText(text) {
  const tokens = localParse(text);
  intermediateElement.textContent = JSON.stringify(tokens, null, 2);
  outputElement.innerHTML = decorateText(tokens);
}

inputElement.addEventListener('input', () => renderForText(inputElement.value));

// Re-render when kuromoji becomes available
if (typeof window !== 'undefined') {
  window.addEventListener('kuromoji-ready', () => {
    renderForText(inputElement.value);
  });
}

// Initialize with sample text
inputElement.value = 'これはテストです。';
renderForText(inputElement.value);
