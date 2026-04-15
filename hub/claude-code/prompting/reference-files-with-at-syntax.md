---
id: reference-files-with-at-syntax
title: Reference files with @ syntax instead of describing their contents
kind: rule
category: prompting
tags: [context]
applies_to:
  scope: project
  paths: []
summary: >
  Use `@path/to/file` in prompts and CLAUDE.md so Claude reads the file directly;
  do not paraphrase or inline file contents.
source:
  url: https://code.claude.com/docs/en/best-practices#provide-rich-content
  title: Best Practices for Claude Code — Provide rich content
  publisher: Anthropic
  fetched: 2026-04-13
  source_hash: sha256:seed
status: current
supersedes: []
---

# Reference files with @ syntax instead of describing their contents

## Rule
When a prompt or CLAUDE.md needs to point at a file, use `@path/to/file`. Do not summarize the file in prose and do not paste its contents unless it is needed in full.

## Why
- `@` resolves the file at read-time, so the context reflects the current state, not a stale paraphrase.
- Paraphrases silently drift from the source; a `@` reference stays correct as the file changes.
- In CLAUDE.md, `@` imports are expanded at launch with recursion up to five hops, giving clean modular instructions.

## How to apply
In interactive prompts: type `@` and select or complete the path. In CLAUDE.md: write `@README.md` or `@docs/git-instructions.md`. For personal imports across worktrees, reference `~/.claude/...` absolute paths.

## Example
```markdown
See @README for project overview and @package.json for available npm commands.

# Additional Instructions
- Git workflow: @docs/git-instructions.md
```

## Anti-pattern
*"Our API handlers live in src/api and use a pattern like ... (20 lines of paraphrased structure)."* The paraphrase decays the moment someone edits the real files. Write `@src/api/handlers/example.ts` instead.

## See also
- [keep-claude-md-under-200-lines](../best-practices/keep-claude-md-under-200-lines.md)
