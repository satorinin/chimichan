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
