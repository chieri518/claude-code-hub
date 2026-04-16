# Hub Entry Format

This is the authoritative schema for every file under `hub/claude-code/`. The ingestion agent reads this file at runtime to know what to produce; the compile step reads it to know how to route entries into CLAUDE.md / `.claude/rules/` bundles.

If you change this schema, update `agents/compile` and run a full re-lint of `hub/` in the same PR.

---

## File placement

```
hub/claude-code/{category}/{id}.md
```

- `category` is one of: `prompting`, `cli`, `workflows`, `memory-management`. New categories emerge from content — open a PR adding the directory + updating `agents/compile/schema.ts` + this list in the same change.
- `id` matches the `id` field in frontmatter exactly. The filename carries no other meaning.
- One atomic rule per file. If an entry wants to split, split it.

---

## Frontmatter (required)

```yaml
---
id: kebab-case-unique-stable-id
title: Human-readable title, sentence case
kind: rule                        # V1: rule only. skill/reference reserved.
category: workflows               # prompting | cli | workflows | memory-management
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
- `tags`: 1–2 tags per entry from the controlled vocabulary below.
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

## Tag vocabulary (controlled, V1)

Tags give an orthogonal topic-axis to `category`. Each entry gets **1–2 tags max**. Tags are lowercase, hyphenated, singular when possible.

| Tag | Covers |
|---|---|
| `context` | Managing the context window (`/clear`, session splitting, token budget) |
| `memory` | `CLAUDE.md`, `.claude/rules/`, path-scoped rules, imports |
| `planning` | Plan Mode, exploration-before-edit, scoping |
| `verification` | Tests, linters, screenshots, self-check loops |
| `tools` | Bash/file tools, tool allow/deny lists, tool design |
| `subagents` | Agent delegation, parallelism, the `Agent` tool |
| `hooks` | Lifecycle hooks (`UserPromptSubmit`, `SessionStart`, etc.) |
| `mcp` | MCP servers, external integrations |
| `slash-commands` | Built-in and custom `/commands` |
| `permissions` | Permission modes, `--allowed-tools`, auto-accept |
| `cost` | Token usage, model selection, caching |
| `git` | Commit, PR, branch workflows with Claude |

### Evolving the vocabulary

- New tags require a one-line PR to this file with rationale.
- A tag that applies to <3 entries after 3 months gets merged or dropped.
- Free-text tags outside this list fail lint.

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

## Lint invariants (enforced by the compile step)

**Schema / structural (Phase 2):**

1. `id` equals the filename basename.
2. `source.url` host is in the Anthropic allowlist.
3. `summary` is ≤200 chars and non-empty (hard cap).
4. `kind` is `rule`.
5. If `status` is `superseded`, `supersedes` references at least one live entry.
6. All `See also` paths resolve.
7. No two entries share the same `id`.
8. `tags` has 1–2 entries, each from the controlled vocabulary above.

**Content density (Phase 7):**

9. `summary` ≤180 chars (soft cap — tighter than the 200-char hard cap so the line stays usable in `dist/CLAUDE.md`).
10. Body is 15–150 lines. Stubs and sprawl both fail.
11. Body contains every required H2: `## Rule`, `## Why`, `## How to apply`, `## Example`, `## Anti-pattern`. `## See also` is optional.
12. The `Example` section is non-empty and contains no `TODO` placeholder.
13. The body (outside fenced code blocks) contains no system-level personality phrases (`think step by step`, `be thorough`, `be careful`, `carefully`, `make sure to`) — Claude Code already has these at the system level, so repeating them wastes downstream context.

A PR that fails any invariant blocks merge.
