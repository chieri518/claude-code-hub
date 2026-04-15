# agents/distill

Local lesson-extraction agent. Reads a Claude Code session transcript and writes up to 3 generalizable lesson drafts, behind a hard privacy gate.

## Status

**Phase 4: Built.** See [`MEMORY.md`](../../MEMORY.md) for phase status.

## Run it

```bash
bun run distill              # uses the most recent session for this repo
bun run distill <path.jsonl> # or point it at a specific transcript
```

Or, from inside a Claude Code session in this repo: `/distill`.

Output lands in `.drafts/distill/{slug}.md`. Nothing else is written.

## Pipeline

| Stage | File | Responsibility |
|---|---|---|
| locate | `index.ts` | Find the newest `~/.claude/projects/*/*.jsonl` for this repo (or take a CLI arg). |
| prompt | `prompt.md` | Scope, sanitization rules, draft shape, lesson bar. |
| distill | `claude -p` | Single headless invocation — sanitizes + extracts in one pass. |
| write | (via Claude) | Up to 3 files under `.drafts/distill/`. |

## Privacy gate (non-negotiable)

- Sanitization happens in the same local `claude -p` pass — no network beyond that call.
- `.drafts/` is gitignored; nothing leaves the machine unless a human opens a PR.
- The agent **never** writes to `hub/` directly. A human promotes drafts manually after review.
- This boundary is architectural, not conventional — see [`ARCHITECTURE.md`](../../ARCHITECTURE.md).

## What counts as a lesson

A draft is only written if the lesson is generalizable, non-obvious, actionable, and not already covered by an existing `hub/` entry. See [`prompt.md`](./prompt.md) for the full bar. When in doubt, the agent skips.

## What it reads

- Local Claude Code session transcripts (`~/.claude/projects/{slug}/*.jsonl`)
- [`hub/FORMAT.md`](../../hub/FORMAT.md)
- [`hub/claude-code/**/*.md`](../../hub/claude-code/) (for deduplication)

## What it writes

- `.drafts/distill/*.md` — up to 3 per run. Source frontmatter uses a `local-session` sentinel that the human promoter replaces with a real Anthropic URL before merging.
