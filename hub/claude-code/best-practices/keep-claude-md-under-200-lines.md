---
id: keep-claude-md-under-200-lines
title: Keep CLAUDE.md under 200 lines
kind: rule
category: best-practices
tags: [claude-md, context-budget, memory]
applies_to:
  scope: project
  paths: []
summary: >
  Target under 200 lines per CLAUDE.md; longer files burn context and drop in
  adherence — split overflow into `.claude/rules/` or @-imported files.
source:
  url: https://code.claude.com/docs/en/memory#write-effective-instructions
  title: How Claude remembers your project — Write effective instructions
  publisher: Anthropic
  fetched: 2026-04-13
  source_hash: sha256:seed
status: current
supersedes: []
---

# Keep CLAUDE.md under 200 lines

## Rule
Each CLAUDE.md file must stay under 200 lines. When it grows past that, split content into `.claude/rules/` files or `@`-imported fragments rather than letting the root file bloat.

## Why
- CLAUDE.md loads in full every session; every line consumes context alongside your actual conversation.
- Beyond ~200 lines, adherence drops — important rules get lost among noise.
- A bloated file is the single most common cause of "Claude keeps ignoring my instruction."

## How to apply
For each line in CLAUDE.md, ask: "Would removing this cause Claude to make a mistake?" If not, cut it. Move path-scoped or topic-scoped guidance into `.claude/rules/{topic}.md` with a `paths:` frontmatter glob. Link long-form docs with `@path/to/file.md` so they load on demand.

## Example
```markdown
# Code style
- Use ES modules, not CommonJS.
- Destructure imports when possible.

# Workflow
- Typecheck after a series of edits.
- Prefer single-file test runs for speed.

See @docs/architecture.md for the service layout.
```

## Anti-pattern
A 400-line CLAUDE.md restating language conventions Claude already knows, plus file-by-file codebase descriptions. Claude silently ignores parts of it; you blame the model.

## See also
- [use-path-scoped-rules-for-large-projects](./use-path-scoped-rules-for-large-projects.md)
- [reference-files-with-at-syntax](../prompting/reference-files-with-at-syntax.md)
