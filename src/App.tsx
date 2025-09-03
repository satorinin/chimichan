import React, { useEffect, useRef, useState } from 'react'

declare const kuromoji: any

export default function App() {
  const [status, setStatus] = useState('Loading tokenizer…')
  const [tokens, setTokens] = useState<any[] | null>(null)
  const [format, setFormat] = useState<'json' | 'table'>('json')
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    // ensure vendored kuromoji is loaded via index.html or via public files
    const dicPath = '/web/vendor/dict/'

    const waitForKuromoji = (timeout = 5000, interval = 100) => {
      return new Promise<typeof kuromoji | null>((resolve) => {
        const start = Date.now()
        const tick = () => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          if (typeof window !== 'undefined' && (window as any).kuromoji && (window as any).kuromoji.builder) {
            resolve((window as any).kuromoji)
            return
          }
          if (Date.now() - start > timeout) {
            resolve(null)
            return
          }
          setTimeout(tick, interval)
        }
        tick()
      })
    }

    let cancelled = false
    ;(async () => {
      setStatus('Waiting for kuromoji global…')
      const globalKuromoji = await waitForKuromoji(8000, 100)
      if (cancelled) return
      if (!globalKuromoji) {
        setStatus('kuromoji global not found (check /web/vendor/kuromoji.js)')
        return
      }

      setStatus('Initializing kuromoji…')
      globalKuromoji.builder({ dicPath }).build((err: any, tokenizer: any) => {
        if (err) {
          setStatus('Failed to build tokenizer: ' + String(err))
          return
        }
        setStatus('Tokenizer ready')
        // attach tokenizer to ref for use on parse
        ;(inputRef as any).currentTokenizer = tokenizer
      })
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const handleParse = () => {
    const text = inputRef.current?.value || ''
    if (!text.trim()) return setTokens([])
    try {
      const tokenizer = (inputRef as any).currentTokenizer
      const out = tokenizer ? tokenizer.tokenize(text) : []
      setTokens(out)
      setStatus(`Done — ${out.length} tokens`)
    } catch (e) {
      setStatus('Tokenization failed')
      setTokens(null)
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, -apple-system, "Noto Sans JP", sans-serif' }}>
      <h1>Kuromoji tokenizer — React demo</h1>
      <p>Paste Japanese text and click Parse.</p>
      <textarea ref={inputRef} defaultValue={'すもももももももものうち'} style={{ width: '100%', height: 120, fontSize: 16 }} />
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12 }}>
        <button onClick={handleParse}>Parse</button>
        <span>{status}</span>
        <select value={format} onChange={e => setFormat(e.target.value as any)}>
          <option value="json">JSON (pretty)</option>
          <option value="table">Table (simple)</option>
        </select>
      </div>

      <h3>Result</h3>
      <pre style={{ background: '#111', color: '#eee', padding: 12, overflow: 'auto', maxHeight: '50vh' }}>
        {tokens == null ? '(no result)' : format === 'json' ? JSON.stringify(tokens, null, 2) : tokens.map(t => [t.surface_form, t.pos, t.pos_detail_1 || '-', t.basic_form || '-', t.reading || '-'].join('\t')).join('\n')}
      </pre>
    </div>
  )
}
