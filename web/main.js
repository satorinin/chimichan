// main.js — small glue for kuromoji demo
// main.js — ESM modern glue for kuromoji demo
const status = document.getElementById('status');
const parseBtn = document.getElementById('parse');
const input = document.getElementById('input');
const result = document.getElementById('result');
const format = document.getElementById('format');

// Default dictionary path — vendored locally under web/vendor/dict for offline/extension usage
const dicPath = './vendor/dict/';

const setStatus = (s) => { status.textContent = s; };

setStatus('Initializing kuromoji builder (offline vendor mode)…');

if (!window.kuromoji || !kuromoji.builder) {
  setStatus('kuromoji.js not found on page. Check the script include.');
  result.textContent = 'Error: kuromoji.js not loaded.';
} else {
  kuromoji.builder({ dicPath }).build((err, tokenizer) => {
    if (err) {
      setStatus('Failed to build tokenizer: ' + (err && err.message ? err.message : String(err)));
      result.textContent = 'Error building tokenizer: ' + String(err);
      return;
    }

    setStatus('Tokenizer ready');
    parseBtn.disabled = false;

    const render = (tokens) => {
      if (format.value === 'json') {
        result.textContent = JSON.stringify(tokens, null, 2);
      } else {
        const lines = tokens.map(t => [t.surface_form, t.pos, t.pos_detail_1 || '-', t.basic_form || '-', t.reading || '-'].join('\t'));
        result.textContent = lines.join('\n');
      }
    };

    parseBtn.addEventListener('click', () => {
      const text = input.value || '';
      if (!text.trim()) { result.textContent = '(no input)'; return; }

      try {
        setStatus('Tokenizing…');
        const tokens = tokenizer.tokenize(text);
        render(tokens);
        setStatus('Done — ' + tokens.length + ' tokens');
      } catch (e) {
        setStatus('Tokenization failed');
        result.textContent = 'Error: ' + String(e);
      }
    });

    // allow pressing cmd/ctrl+Enter in textarea to parse
    input.addEventListener('keydown', (ev) => {
      if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter') parseBtn.click();
    });
  });
}

