# agents/distill

Local lesson-extraction agent. Captures a Claude Code session and proposes generalizable lessons for the hub, behind a hard privacy gate.

## Status

**Not yet built.** Planned for **Phase 4**. See [`MEMORY.md`](../../MEMORY.md) for phase status.

## What it will do

1. Capture a Claude Code session transcript (via a `/distill` slash command or a CLI invocation).
2. Run a local sanitization pass to strip proprietary code, credentials, and PII **before** anything touches disk.
3. Extract one or more candidate lessons as draft hub entries conforming to [`hub/FORMAT.md`](../../hub/FORMAT.md).
4. Write drafts to `.drafts/distill/{slug}.md`.

## Privacy gate (non-negotiable)

- Sanitization runs locally before any disk write.
- `.drafts/` is gitignored; nothing leaves the machine without a human opening a PR.
- The agent **never** writes directly to `hub/`. A human promotes drafts manually after review.
- This boundary is architectural, not conventional — see [`ARCHITECTURE.md`](../../ARCHITECTURE.md).

## What it will read

- Local Claude Code session transcripts (from your `~/.claude/projects/` tree)
- [`hub/FORMAT.md`](../../hub/FORMAT.md)

## What it will write

- `.drafts/distill/*.md` — nothing else.

## Open questions

See [`MEMORY.md`](../../MEMORY.md) → *Open Questions*. Notably: regex redaction vs. LLM sanitization pass. Leaning LLM pass because regex misses semantic PII.
