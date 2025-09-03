import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ankiRequest, getDeckNames, DEFAULT_ANKI_URL } from '../src/anki/ankiConnect';

const sampleDecks = ['Default', 'Japanese::Vocab'];

describe('AnkiConnect helper', () => {
  let originalFetch: any;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('ankiRequest resolves on valid response', async () => {
  global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ error: null, result: sampleDecks }) } as unknown as Response));
    const res = await ankiRequest(DEFAULT_ANKI_URL, 'deckNames', {});
    expect(res).toEqual(sampleDecks);
  });

  it('ankiRequest throws on network error', async () => {
  global.fetch = vi.fn(() => Promise.resolve({ ok: false, status: 502 } as unknown as Response));
    await expect(ankiRequest(DEFAULT_ANKI_URL, 'deckNames', {})).rejects.toThrow(/Network error/);
  });

  it('getDeckNames returns array on success', async () => {
  global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ error: null, result: sampleDecks }) } as unknown as Response));
    const decks = await getDeckNames();
    expect(decks).toEqual(sampleDecks);
  });

  it('getDeckNames returns empty array if response malformed', async () => {
  global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ error: null, result: { not: 'an array' } }) } as unknown as Response));
    const decks = await getDeckNames();
    expect(decks).toEqual([]);
  });
});
