import { describe, it, expect } from 'vitest';
import { escapeHtml } from '../src/utils/index';

describe('escapeHtml', () => {
  it('escapes basic HTML characters', () => {
    const input = 'a & b <c> "quote"';
    const out = escapeHtml(input);
    expect(out).toBe('a &amp; b &lt;c&gt; &quot;quote&quot;');
  });
});
