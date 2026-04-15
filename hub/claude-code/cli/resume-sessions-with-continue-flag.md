---
id: resume-sessions-with-continue-flag
title: Resume prior conversations with --continue and --resume
kind: rule
category: cli
tags: [context]
applies_to:
  scope: user
  paths: []
summary: >
  Use `claude --continue` to pick up the latest session or `claude --resume` to
  pick from recent ones; name sessions with `/rename` so you can find them.
source:
  url: https://code.claude.com/docs/en/best-practices#resume-conversations
  title: Best Practices for Claude Code — Resume conversations
  publisher: Anthropic
  fetched: 2026-04-13
  source_hash: sha256:seed
status: current
supersedes: []
---

# Resume prior conversations with --continue and --resume

## Rule
When a task spans multiple sittings, resume with `claude --continue` or `claude --resume`. Do not re-explain context in a fresh session unless you intend to start over.

## Why
- Claude Code persists conversations locally; `--continue` restores the full context window so prior plans, decisions, and file reads are still loaded.
- `--resume` shows a picker of recent sessions, which is faster than re-orienting from scratch.
- Treat sessions like branches: separate workstreams keep separate, persistent contexts.

## How to apply
End a session naturally — no cleanup required. Next time, run `claude --continue` to reopen the latest, or `claude --resume` to choose one. Inside a session, run `/rename oauth-migration` (or similar) so the picker is scannable later.

## Example
```bash
claude --continue       # pick up the most recent conversation
claude --resume         # choose from a list of recent conversations
```

## Anti-pattern
Closing yesterday's OAuth session and starting today with *"so we were working on OAuth, and we decided..."* — that summary is a lossy reconstruction of the context that already exists on disk. Just `--continue`.

## See also
- [clear-context-between-unrelated-tasks](./clear-context-between-unrelated-tasks.md)
