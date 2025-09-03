// main.js — small glue for kuromoji demo
// main.js — ESM modern glue for kuromoji demo
const status = document.getElementById('status');
const parseBtn = document.getElementById('parse');
const input = document.getElementById('input');
const result = document.getElementById('result');
const format = document.getElementById('format');

// Default dictionary path — vendored locally under web/vendor/dict for offline/extension usage
const dicPath = './vendor/dict/';

const setStatus = (s) => {
  status.textContent = s;
};

// AnkiConnect helper (browser UI wrapper)
const ankiAddressEl = document.getElementById('ankiAddress');
const ankiFetchBtn = document.getElementById('ankiFetch');
const ankiStatus = document.getElementById('ankiStatus');
const ankiDecks = document.getElementById('ankiDecks');

const ANKI_KEY = 'chimichan:anki';
const defaultAnkiUrl = 'http://127.0.0.1:8765';

function loadSavedAnki() {
  try {
    const v = localStorage.getItem(ANKI_KEY);
    if (v) ankiAddressEl.value = v;
    else ankiAddressEl.value = defaultAnkiUrl;
  } catch (e) {
    ankiAddressEl.value = defaultAnkiUrl;
  }
}

function saveAnkiAddress() {
  try {
    localStorage.setItem(ANKI_KEY, ankiAddressEl.value);
  } catch (e) {}
}

async function ankiRequest(url, action, params = {}) {
  const body = { action, version: 6, params };
  ankiStatus.textContent = 'Anki: requesting…';
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error('network ' + res.status);
    const json = await res.json();
    if (json.error) throw new Error(String(json.error));
    ankiStatus.textContent = 'Anki: ok';
    return json.result;
  } catch (e) {
    ankiStatus.textContent = 'Anki: error';
    throw e;
  }
}

async function fetchDecks() {
  const url = (ankiAddressEl.value && ankiAddressEl.value.trim()) || defaultAnkiUrl;
  saveAnkiAddress();
  try {
    const decks = await ankiRequest(url, 'deckNames', {});
    // clear and populate
    ankiDecks.innerHTML = '';
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = '(choose a deck)';
    ankiDecks.appendChild(empty);
    for (const d of decks) {
      const o = document.createElement('option');
      o.value = d;
      o.textContent = d;
      ankiDecks.appendChild(o);
    }
    ankiStatus.textContent = 'Anki: decks loaded';
  } catch (e) {
    ankiStatus.textContent = 'Anki: failed to load decks';
    console.error('Anki error', e);
  }
}

loadSavedAnki();
ankiFetchBtn.addEventListener('click', fetchDecks);

// Theme handling removed — single neutral theme in CSS

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
      // remember last tokens so we can re-render when format changes
      render.lastTokens = tokens;
      // also keep a top-level reference for other handlers
      lastTokens = tokens;

      if (format.value === 'json') {
        // pretty JSON in a monospace block
        result.innerHTML = '';
        const pre = document.createElement('pre');
        pre.className = 'json-output';
        pre.textContent = JSON.stringify(tokens, null, 2);
        result.appendChild(pre);
      } else {
        if (!tokens || tokens.length === 0) {
          result.textContent = '(no tokens)';
          return;
        }

        // Use the keys of the first token as column labels
        const headers = Object.keys(tokens[0]);

        // Compose rows: first a header row, then one row per token
        const rows = [];
        rows.push(headers.join('\t'));
        for (const t of tokens) {
          const cols = headers.map((k) => {
            const v = t[k];
            if (v === null || v === undefined) return '-';
            if (typeof v === 'object') return JSON.stringify(v);
            return String(v);
          });
          rows.push(cols.join('\t'));
        }

        // render HTML table
        const container = document.createElement('div');
        container.className = 'tokens-table-container';
        const table = document.createElement('table');
        table.className = 'tokens-table';
        const thead = document.createElement('thead');
        const trh = document.createElement('tr');
        for (const h of headers) {
          const th = document.createElement('th');
          th.textContent = h;
          trh.appendChild(th);
        }
        thead.appendChild(trh);
        table.appendChild(thead);
        const tbody = document.createElement('tbody');
        for (const t of tokens) {
          const tr = document.createElement('tr');
          for (const k of headers) {
            const td = document.createElement('td');
            const v = t[k];
            if (v === null || v === undefined) td.textContent = '-';
            else if (typeof v === 'object') td.textContent = JSON.stringify(v);
            else td.textContent = String(v);
            tr.appendChild(td);
          }
          tbody.appendChild(tr);
        }
        table.appendChild(tbody);
        container.appendChild(table);
        result.innerHTML = '';
        result.appendChild(container);
      }
    };

    // store last tokens in closure scope
    let lastTokens = null;

    // when the user changes the output format, re-render the most recent tokens
    format.addEventListener('change', () => {
      if (lastTokens) render(lastTokens);
    });

    parseBtn.addEventListener('click', () => {
      const text = input.value || '';
      if (!text.trim()) {
        result.textContent = '(no input)';
        return;
      }

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

    // Debounce helper
    const debounce = (fn, wait = 300) => {
      let t = null;
      return (...args) => {
        if (t) clearTimeout(t);
        t = setTimeout(() => fn(...args), wait);
      };
    };

    // Auto-parse input on change (debounced)
    const autoParse = debounce(() => {
      const text = input.value || '';
      if (!text.trim()) {
        result.textContent = '(no input)';
        return;
      }
      try {
        setStatus('Auto-tokenizing…');
        const tokens = tokenizer.tokenize(text);
        render(tokens);
        setStatus('Done — ' + tokens.length + ' tokens');
      } catch (e) {
        setStatus('Auto-tokenization failed');
      }
    }, 300);

    input.addEventListener('input', autoParse);

    // Optional: auto-parse window selection when checkbox enabled
    const autoSelBox = document.getElementById('autoSelection');
    let lastSelection = '';

    // Helper: determine whether given node is inside our app UI
    function isInsideApp(node) {
      try {
        const app = document.getElementById('app');
        return app && app.contains(node);
      } catch (e) {
        return false;
      }
    }

    const checkSelection = debounce(() => {
      if (!autoSelBox || !autoSelBox.checked) return;
      const selObj = window.getSelection && window.getSelection();
      const sel = selObj && selObj.toString && selObj.toString().trim();
      if (!sel) return;

      // ignore selection if it's entirely inside our app UI (prevents loops)
      const anchor = selObj.anchorNode;
      if (anchor && isInsideApp(anchor)) return;

      if (sel && sel !== lastSelection) {
        lastSelection = sel;
        input.value = sel;
        autoParse();
      }
    }, 200);

    document.addEventListener('selectionchange', checkSelection);

    // Auto-parse initial textarea content so page shows tokens once ready
    if (input && input.value && input.value.trim()) {
      autoParse();
    }
  });
}
