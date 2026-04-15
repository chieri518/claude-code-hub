# .drafts/

Staging area for ingestion and distillation output. **Everything in this directory is gitignored** except this README — the directory itself exists so agents have a predictable place to write before a human promotes content into `hub/`.

## Subdirectories (created on first use)

- `ingest/{run-id}/` — snapshots of upstream sources that changed, plus a `summary.json` for the Phase 3b LLM step to consume. Produced by `bun run ingest:detect`.
- `distill/` — lesson drafts extracted from local Claude Code sessions (Phase 4, not yet built).

## Promotion workflow

Drafts never enter `hub/` automatically. A human reviews, edits, and promotes by:

1. Reading the draft.
2. Copying the relevant parts into a new or existing file under `hub/claude-code/{category}/`.
3. Running `bun run compile && bun test`.
4. Opening a PR.

## Cleanup

Old `ingest/{run-id}/` folders are safe to delete at any time — they're disposable by design.
