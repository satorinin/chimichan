// Lightweight wrapper around kuromoji.js with a fallback tokenizer
import kuromoji from 'kuromoji';

// Full kuromoji token shape (partial) — include common fields and allow extras.
export type KuromojiToken = {
  word_id?: number;
  word_type?: string;
  word_position?: number;
  surface_form: string;
  pos?: string;
  pos_detail_1?: string;
  pos_detail_2?: string;
  pos_detail_3?: string;
  conjugated_type?: string;
  conjugated_form?: string;
  basic_form?: string;
  reading?: string;
  pronunciation?: string;
  [k: string]: any;
};

export type Token = KuromojiToken;

let tokenizer: kuromoji.Tokenizer<kuromoji.IpadicFeatures> | null = null;
let kuromojiReady = false;
let lastTriedCandidates: string[] = [];
let lastFailedDicPath: string | null = null;
let lastBuildError: string | null = null;
let lastBuildErrorDetail: string | null = null;

/** Return the canonical candidate dictionary paths for this runtime. */
export function getCandidateDicPaths(): string[] {
  const candidates: string[] = [];
  // In test / Node, prefer relative kuromoji-dict created by test setup
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') {
    candidates.push('./kuromoji-dict/');
    candidates.push(process.cwd() + '/kuromoji-dict/');
  }
  // Browser-first candidates
  if (typeof window !== 'undefined' && typeof location !== 'undefined') {
    // absolute root
    candidates.push('/kuromoji-dict/');
    // relative to current path
    candidates.push('./kuromoji-dict/');
    // origin-prefixed
    try {
      candidates.push(location.origin + '/kuromoji-dict/');
    } catch (e) {
      /* ignore */
    }
  }
  // Fallback Node/npm locations
  if (typeof window === 'undefined') {
    candidates.push(process.cwd() + '/public/kuromoji-dict/');
    candidates.push(process.cwd() + '/node_modules/kuromoji/dict/');
  }
  return candidates;
}

export async function initKuromoji(): Promise<void> {
  if (tokenizer) return;

  // reset diagnostics for this init attempt
  lastTriedCandidates = [];
  lastFailedDicPath = null;
  lastBuildError = null;
  lastBuildErrorDetail = null;

  // Decide candidate dicPaths so kuromoji works in browser and Node/test.
  const candidates: string[] = getCandidateDicPaths();

  for (const dicPath of candidates) {
    // attempt to build using this dicPath
    lastTriedCandidates = candidates.slice();

    // Only perform HTTP probes in a real browser environment (not jsdom or test).
    const isRealBrowser =
      typeof fetch !== 'undefined' &&
      typeof location !== 'undefined' &&
      (location.protocol === 'http:' || location.protocol === 'https:') &&
      !(typeof navigator !== 'undefined' && /jsdom/.test(navigator.userAgent)) &&
      !(typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test');

    if (isRealBrowser) {
      try {
        const probeUrl = dicPath.endsWith('/') ? dicPath + 'base.dat' : dicPath + '/base.dat';
        // eslint-disable-next-line no-await-in-loop
        const resp = await fetch(probeUrl);
        if (!resp.ok) {
          console.debug('[initKuromoji] HTTP probe failed for', probeUrl, 'status', resp.status);
          // skip builder attempt for this dicPath
          continue;
        }
        const buf = await resp.arrayBuffer();
        if (!buf || buf.byteLength < 64) {
          console.debug('[initKuromoji] HTTP probe returned small body for', probeUrl);
          continue;
        }
      } catch (e) {
        console.debug('[initKuromoji] HTTP probe exception for', dicPath, e);
        continue;
      }
    }

    // If running under Node (tests), probe the filesystem for the expected .dat.gz
    if (typeof window === 'undefined') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const fs = require('fs');
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const path = require('path');
        const probeFs = dicPath.endsWith('/')
          ? path.join(dicPath, 'base.dat.gz')
          : path.join(dicPath, 'base.dat.gz');
        if (!fs.existsSync(probeFs)) {
          console.debug('[initKuromoji] fs probe missing for', probeFs);
          continue;
        }
      } catch (e) {
        console.debug('[initKuromoji] fs probe exception for', dicPath, e);
        // fall through and try builder anyway
      }
    }

    // eslint-disable-next-line no-await-in-loop
    const ok = await new Promise<boolean>((resolve) => {
      try {
        kuromoji.builder({ dicPath }).build((err: Error | null, tk: any) => {
          if (err) {
            // record diagnostic info for consumers/UI
            lastFailedDicPath = dicPath;
            // err may be non-Error in some runtimes; coerce safely
            const eAny: any = err;
            lastBuildError = eAny && (eAny.message || String(eAny));
            try {
              lastBuildErrorDetail = JSON.stringify(eAny);
            } catch (_) {
              lastBuildErrorDetail = String(eAny);
            }
            console.debug('[initKuromoji] builder error for', dicPath, lastBuildError);
            resolve(false);
            return;
          }
          tokenizer = tk;
          // instrument: run a sample tokenization to validate the tokenizer and surface output
          try {
            const sampleText = 'すもももももももものうち';
            // use the local tk which is the tokenizer provided in the callback
            const tkAny: any = tk;
            const sample = tkAny.tokenize(sampleText) as KuromojiToken[];
            console.info('[initKuromoji] sample tokenization for', sampleText, sample);
          } catch (sampleErr) {
            console.debug('[initKuromoji] sample tokenization failed', sampleErr);
          }
          resolve(true);
        });
      } catch (e) {
        lastFailedDicPath = dicPath;
        const eAny: any = e;
        lastBuildError = eAny && (eAny.message || String(eAny));
        try {
          lastBuildErrorDetail = JSON.stringify(eAny);
        } catch (_) {
          lastBuildErrorDetail = String(eAny);
        }
        console.debug('[initKuromoji] exception building for', dicPath, eAny);
        resolve(false);
      }
    });
    if (ok) {
      kuromojiReady = true;
      console.info('[initKuromoji] ready via', dicPath);
      return;
    }
  }

  // If we get here, no dictionary was found; fall back to simple tokenizer
  console.warn(
    'kuromoji build failed for all candidate dicPaths, falling back to simple tokenizer',
    candidates
  );
  tokenizer = null;
}

/** Return structured diagnostics about the last init attempt. */
export function getKuromojiDiagnostics(): {
  lastTriedCandidates: string[];
  lastFailedDicPath: string | null;
  lastBuildError: string | null;
  lastBuildErrorDetail: string | null;
} {
  return {
    lastTriedCandidates,
    lastFailedDicPath,
    lastBuildError,
    lastBuildErrorDetail,
  };
}

/** Returns true when kuromoji was successfully initialized and is available. */
export function isKuromojiReady(): boolean {
  return kuromojiReady && tokenizer !== null;
}

export function tokenize(text: string): Token[] {
  if (tokenizer) {
    try {
      // kuromoji tokenizer returns feature-rich tokens
      const toks = tokenizer.tokenize(text) as KuromojiToken[];
      // return raw kuromoji tokens (preserve full API output)
      return toks.map((t) => ({ ...t }));
    } catch (e) {
      console.warn('kuromoji tokenize failed, using fallback', e);
    }
  }

  // fallback simple tokenizer: preserve original characters (including spaces/newlines)
  const chars = Array.from(text);
  return chars.map((c) => ({ surface_form: c }));
}
