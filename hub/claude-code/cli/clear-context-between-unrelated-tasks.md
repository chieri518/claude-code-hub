---
id: clear-context-between-unrelated-tasks
title: Run /clear between unrelated tasks
kind: rule
category: cli
tags: [cli, context-management, performance]
applies_to:
  scope: project
  paths: []
summary: >
  Reset the context window with `/clear` when switching tasks and after two
  failed corrections on the same issue — a fresh prompt beats a cluttered one.
source:
  url: https://code.claude.com/docs/en/best-practices#manage-context-aggressively
  title: Best Practices for Claude Code — Manage context aggressively
  publisher: Anthropic
  fetched: 2026-04-15
  source_hash: sha256:0b0a5d2b1d1478e49cb8476ef4780a921c14c4531a619bfbc53ceb18218088a6
status: current
supersedes: []
---

# Run /clear between unrelated tasks

## Rule
Run `/clear` when switching to an unrelated task, and whenever you have corrected Claude more than twice on the same issue in one session.

## Why
- LLM performance degrades as the context window fills; irrelevant history actively hurts quality.
- Repeated corrections pollute the context with failed approaches, biasing Claude toward them.
- A fresh session with a better-written prompt almost always outperforms a long session with accumulated corrections.

## How to apply
Notice the trigger — a new subject, or the third "no, not like that." Run `/clear`, then rewrite the prompt incorporating what the failed attempts taught you. For partial resets, use `/rewind` or `Esc+Esc` to jump to a specific checkpoint.

## Example
```txt
/clear
now, the failing test is tests/auth.test.ts::expiresToken. the refresh path
in src/auth/refresh.ts writes the new token before invalidating the old
one, causing a race. write a failing test that reproduces it, then fix.
```

## Anti-pattern
Correcting the same mistake four times in a row inside a 2-hour session. By correction three, Claude is fitting to *your corrections* more than to the task; the fix is a reset, not a fifth correction.

## See also
- [resume-sessions-with-continue-flag](./resume-sessions-with-continue-flag.md)
- [scope-tasks-with-specific-context](../prompting/scope-tasks-with-specific-context.md)
