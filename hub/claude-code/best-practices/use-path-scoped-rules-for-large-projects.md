---
id: use-path-scoped-rules-for-large-projects
title: Use path-scoped .claude/rules/ files in large projects
kind: rule
category: best-practices
tags: [rules, claude-md, monorepo, scoping]
applies_to:
  scope: project
  paths: []
summary: >
  For rules that only apply to certain files, put them in `.claude/rules/*.md`
  with a `paths:` glob frontmatter — they load only when relevant.
source:
  url: https://code.claude.com/docs/en/memory#organize-rules-with-claude/rules/
  title: How Claude remembers your project — Organize rules with .claude/rules/
  publisher: Anthropic
  fetched: 2026-04-13
  source_hash: sha256:seed
status: current
supersedes: []
---

# Use path-scoped .claude/rules/ files in large projects

## Rule
Rules that only matter for certain files go in `.claude/rules/{topic}.md` with a `paths:` frontmatter glob. Keep CLAUDE.md for rules that apply everywhere.

## Why
- Path-scoped rules load into context *only* when Claude reads a matching file, so the context budget is spent on relevant guidance.
- Splitting by topic keeps each file short and reviewable; teams can own their own rule files.
- Rules without `paths` load unconditionally — same priority as `.claude/CLAUDE.md` — so the scoping is the whole point.

## How to apply
Identify the directory or file type the rule applies to. Create `.claude/rules/{topic}.md` with `paths:` listing glob patterns. Keep each file focused on one topic.

## Example
```markdown
---
paths:
  - "src/api/**/*.ts"
---

# API Development Rules

- All endpoints must validate inputs before dispatch.
- Use the standard error response envelope.
- Include OpenAPI comments on public handlers.
```

## Anti-pattern
Putting API rules, frontend rules, and database rules all in the root CLAUDE.md. The frontend engineer loads the API section every session for no reason, and the file crosses 200 lines and starts getting ignored.

## See also
- [keep-claude-md-under-200-lines](./keep-claude-md-under-200-lines.md)
