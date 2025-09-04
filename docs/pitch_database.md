```markdown
# Pitch database (format + update guidance)

Purpose: describe the local JSON format used to store pitch accent patterns and how components should reference it.

Format (example)

```json
{
  "うま": { "reading": "うま", "patterns": ["HHLL", "HLLH"], "notes": "common verbs" },
  "学校": { "reading": "がっこう", "patterns": ["LHH"], "notes": "noun" }
}
```

Contract
- Keys: lemma or reading.
- Value: { reading: string, patterns: string[], notes?: string }
- Consumer: the decorator should map tokens by lemma or reading to a pattern id and compute `pitchColor` from the pattern.

Update strategy
- Pitch DB is bundled with the extension or user-provided via extension storage.
- To update: provide a small CLI/tool that validates JSON and re-generates a compact version for bundling.

Security
- Validate user-provided JSON before accepting it into extension storage. Treat pattern files as untrusted input for UI rendering but do not execute any code from them.

```
