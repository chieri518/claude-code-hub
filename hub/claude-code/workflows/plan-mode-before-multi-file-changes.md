---
id: plan-mode-before-multi-file-changes
title: Use Plan Mode before multi-file changes
kind: rule
category: workflows
tags: [planning]
applies_to:
  scope: project
  paths: []
summary: >
  Enter Plan Mode for any change that spans multiple files or unfamiliar code;
  skip it when the diff fits in one sentence.
source:
  url: https://code.claude.com/docs/en/best-practices#explore-first-then-plan-then-code
  title: Best Practices for Claude Code — Explore first, then plan, then code
  publisher: Anthropic
  fetched: 2026-04-16
  source_hash: sha256:02e8d8905721e81aaa41c80eed73f0d47b987ae0ab45bd7e106e3b4c8621f531
status: current
supersedes: []
---

# Use Plan Mode before multi-file changes

## Rule
Enter Plan Mode before any change that spans multiple files, touches unfamiliar code, or uses an approach you are uncertain about. Skip it when the diff fits in one sentence.

## Why
- Plan Mode separates research from execution. A plan surfaces the wrong problem *before* code gets written against it.
- Mid-implementation rewrites cost more context than an up-front plan.
- The plan is editable (Ctrl+G), so you can correct direction before any files change.

## How to apply
If you cannot describe the intended diff in a single sentence, enter Plan Mode. Ask Claude to read the relevant code and produce a plan. Edit the plan, then switch to Normal Mode to implement against it.

## Example
```txt
(Plan Mode) read /src/auth and understand how we handle sessions.
I want to add Google OAuth. What files need to change? Create a plan.
```

## Anti-pattern
Asking "implement Google OAuth" in Normal Mode. Claude dives in; halfway through, the session model turns out to need changes too. The plan now lives only inside a growing, half-broken diff.

## See also
- [scope-tasks-with-specific-context](../prompting/scope-tasks-with-specific-context.md)
- [verify-with-tests-or-screenshots](./verify-with-tests-or-screenshots.md)
