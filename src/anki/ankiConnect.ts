// Lightweight AnkiConnect helper for the app (browser-side)
// This module provides a minimal wrapper around the AnkiConnect JSON-RPC API.

export type AnkiResult = any;

const STORAGE_KEY = 'chimichan:anki';

export function getSavedAddress(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    console.debug('localStorage unavailable', e);
    return null;
  }
}

export function saveAddress(url: string) {
  try {
    localStorage.setItem(STORAGE_KEY, url);
  } catch (e) {
    console.debug('failed to save address', e);
  }
}

export async function ankiRequest(
  url: string,
  action: string,
  params: Record<string, unknown> = {}
): Promise<AnkiResult> {
  const body = { action, version: 6, params };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Network error: ' + res.status);
  const json = await res.json();
  if (json.error) throw new Error(String(json.error));
  return json.result;
}

export const DEFAULT_ANKI_URL = 'http://127.0.0.1:8765';

export async function getDeckNames(url: string = DEFAULT_ANKI_URL): Promise<string[]> {
  const res = await ankiRequest(url, 'deckNames', {});
  // AnkiConnect returns an array of deck names on success
  return Array.isArray(res) ? res : [];
}
