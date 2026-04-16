---
id: verify-with-tests-or-screenshots
title: Give Claude a way to verify its own work
kind: rule
category: workflows
tags: [verification]
applies_to:
  scope: project
  paths: []
summary: >
  Always provide an automated check (tests, linter, expected output, screenshot
  compare) so Claude can confirm its work without relying on you as the sole loop.
source:
  url: https://code.claude.com/docs/en/best-practices#give-claude-a-way-to-verify-its-work
  title: Best Practices for Claude Code — Give Claude a way to verify its work
  publisher: Anthropic
  fetched: 2026-04-16
  source_hash: sha256:02e8d8905721e81aaa41c80eed73f0d47b987ae0ab45bd7e106e3b4c8621f531
status: current
supersedes: []
---

# Give Claude a way to verify its own work

## Rule
Every non-trivial task must ship with a machine-checkable verification path: tests, a linter run, an expected-output comparison, or a screenshot diff. Claude runs the check itself and iterates until it passes.

## Why
- Without a check, Claude produces plausible code that may not actually work, and you become the only feedback loop.
- Self-verification turns one-shot prompts into autonomous iteration — Claude can try, fail, and fix without waiting on you.
- Verification criteria double as unambiguous task specifications.

## How to apply
When you write a prompt, include: (a) concrete test cases or acceptance criteria, (b) the command Claude should run to check itself, and (c) instruction to iterate until the check passes. For UI work, include a screenshot and ask for a visual compare.

## Example
```txt
write a validateEmail function. cases: user@example.com → true,
"invalid" → false, user@.com → false. run `bun test` after implementing
and iterate until all pass.
```

## Anti-pattern
*"Make the dashboard look better."* No success criterion, no check to run. Claude ships something that looks "better-ish" and you review every pixel by hand.

## See also
- [scope-tasks-with-specific-context](../prompting/scope-tasks-with-specific-context.md)
