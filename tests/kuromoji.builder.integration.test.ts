import { describe, it, expect } from 'vitest';
import { initKuromoji, isKuromojiReady, tokenize } from '../src/lexor/parser';

// Integration test for kuromoji builder

describe('kuromoji integration', () => {
  it('should initialize kuromoji and tokenize Japanese text', async () => {
    await initKuromoji();
    expect(isKuromojiReady()).toBe(true);
    const tokens = tokenize('すもももももももものうち');
    expect(Array.isArray(tokens)).toBe(true);
    expect(tokens.length).toBeGreaterThan(0);
    // Check that at least one token has a surface_form
    expect(tokens.some((t) => t.surface_form === 'すもも')).toBe(true);
  });
});
