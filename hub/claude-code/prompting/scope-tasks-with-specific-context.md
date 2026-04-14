---
id: scope-tasks-with-specific-context
title: Scope tasks with specific files, patterns, and symptoms
kind: rule
category: prompting
tags: [prompting, specificity, context]
applies_to:
  scope: project
  paths: []
summary: >
  Replace vague prompts with ones that name files, point to reference patterns,
  and describe symptoms — precision shrinks the correction loop.
source:
  url: https://code.claude.com/docs/en/best-practices#provide-specific-context-in-your-prompts
  title: Best Practices for Claude Code — Provide specific context in your prompts
  publisher: Anthropic
  fetched: 2026-04-13
  source_hash: sha256:seed
status: current
supersedes: []
---

# Scope tasks with specific files, patterns, and symptoms

## Rule
Name the file, the scenario, the pattern to mimic, and the symptom you observed. Avoid prompts whose subject is a verb with no object.

## Why
- Vague prompts force Claude to guess intent; each wrong guess costs context and a correction.
- Pointing at an existing pattern ("follow `HotDogWidget.php`") gives Claude a concrete template instead of inventing structure.
- Symptom-first bug reports let Claude reproduce before fixing, which filters out cosmetic patches.

## How to apply
Before sending a prompt, check it has (a) a file or directory reference, (b) the scenario or edge case in scope, and (c) a pointer to a similar pattern in the codebase or the observable symptom you want resolved.

## Example
```txt
users report login fails after session timeout. check the auth flow in
src/auth/, especially token refresh. write a failing test that reproduces
the issue, then fix it.
```

## Anti-pattern
*"Fix the login bug."* Claude does not know which bug, which file, or what "fixed" looks like — and will ask three clarifying questions or guess wrong.

## See also
- [reference-files-with-at-syntax](./reference-files-with-at-syntax.md)
- [verify-with-tests-or-screenshots](../workflows/verify-with-tests-or-screenshots.md)
