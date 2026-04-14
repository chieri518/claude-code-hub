# Hub Entry Format

This is the authoritative schema for every file under `hub/claude-code/`. The ingestion agent reads this file at runtime to know what to produce; the compile step reads it to know how to route entries into CLAUDE.md / `.claude/rules/` bundles.

If you change this schema, update `agents/compile` and run a full re-lint of `hub/` in the same PR.

---

## File placement

```
hub/claude-code/{category}/{id}.md
```

- `category` is one of: `prompting`, `cli`, `workflows`, `best-practices`.
- `id` matches the `id` field in frontmatter exactly. The filename carries no other meaning.
- One atomic rule per file. If an entry wants to split, split it.

---

## Frontmatter (required)

```yaml
---
id: kebab-case-unique-stable-id
title: Human-readable title, sentence case
kind: rule                        # V1: rule only. skill/reference reserved.
category: workflows               # prompting | cli | workflows | best-practices
tags: [tag-one, tag-two]          # denormalized, searchable
applies_to:
  scope: project                  # project | user | managed
  paths: []                       # optional globs; maps to .claude/rules/ paths:
summary: >                        # ≤200 chars. Used in indexes and as CLAUDE.md
  One-sentence distillation,       # fallback when the full body won't fit budget.
  "what + when" form.
source:
  url: https://...                # canonical, deep-linked to section anchor
  title: Page title — Section
  publisher: Anthropic            # V1: Anthropic only
  fetched: 2026-04-13             # ISO date of last human or agent verification
  source_hash: sha256:seed        # whole-page content hash at fetch time
status: current                   # current | deprecated | superseded
supersedes: []                    # ids this entry replaces
---
```

### Field rules

- `id`: must equal the filename (minus `.md`). Kebab-case, lowercase, stable across rewrites. Never rename; use `supersedes` to retire.
- `kind`: V1 accepts only `rule`. `skill` and `reference` are reserved for post-V1.
- `applies_to.paths`: empty means the rule loads unconditionally. Non-empty maps directly to the `paths:` field in `.claude/rules/` output.
- `summary`: ≤200 chars. Must stand on its own — it is the only thing emitted when the full body would exceed the CLAUDE.md budget.
- `source.url`: must be an official Anthropic source (docs.claude.com, code.claude.com, platform.claude.com, github.com/anthropics/*). Community sources are not permitted in V1.
- `source.fetched`: ISO date. Updated every time the entry is re-verified (manually or by the ingestion agent).
- `source.source_hash`: whole-page SHA-256 at fetch time. `sha256:seed` is the sentinel for hand-authored entries awaiting first ingestion.
- `status`:
  - `current` — load normally.
  - `deprecated` — upstream feature renamed/removed; kept as a tombstone. Compile step emits a one-line warning entry pointing to `supersedes`.
  - `superseded` — replaced by another entry; do not emit at all.

---

## Body template

```markdown
# {title}

## Rule
Single imperative sentence. "Do X when Y."

## Why
1–3 bullets. The mechanism — why this rule produces better outcomes.
Load-bearing context only. Do not restate the rule.

## How to apply
Concrete trigger and action. Verifiable when possible.

## Example
\```txt
Minimal, real, runnable. One block. Two max.
\```

## Anti-pattern
One short counter-example showing the failure mode this rule prevents.

## See also
- [related-id](../other-category/related-id.md)
```

### Body rules

- Target body length: **40–120 lines**. Longer means the rule should split.
- No personality instructions ("be thorough", "think step by step"). Claude Code already has these at the system level.
- No things Claude can infer from code. If removing a line would not cause a mistake, cut it.
- Examples must be real and minimal. No aspirational code.
- `See also` links use relative paths from the entry's directory.

---

## Lint invariants (enforced by Phase 2 compile step)

1. `id` equals the filename basename.
2. `source.url` host is in the Anthropic allowlist.
3. `summary` is ≤200 chars and non-empty.
4. `kind` is `rule`.
5. If `status` is `superseded`, `supersedes` references at least one live entry.
6. All `See also` paths resolve.
7. No two entries share the same `id`.

A PR that fails any invariant blocks merge.
