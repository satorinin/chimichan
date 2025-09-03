export function escapeHtml(s: string) {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  };
  return s.replace(/[&<>"]/g, (c) => map[c] ?? c);
}
