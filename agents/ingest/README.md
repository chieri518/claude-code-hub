# agents/ingest

Automated ingestion agent. Monitors official Anthropic sources for changes and proposes hub updates as pull requests.

## Status

**Not yet built.** Planned for **Phase 3**. See [`MEMORY.md`](../../MEMORY.md) for phase status.

## What it will do

1. Read `sources/sources.yaml`.
2. Fetch each tracked URL; compute a whole-page SHA-256.
3. If the hash differs from `last_hash`, hand the diff to a headless Claude Code invocation (`claude -p`) with a scoped prompt that includes `hub/FORMAT.md` and the current set of entries.
4. The agent writes proposed hub edits to a branch and opens a PR (mechanism TBD — leaning toward `peter-evans/create-pull-request`).
5. CI runs `bun run compile` and `bun test` on the PR. Lint-clean is a merge gate.
6. A human reviews and merges.

## What it will read

- `sources/sources.yaml` — tracked URLs and stored hashes
- [`hub/FORMAT.md`](../../hub/FORMAT.md) — the schema the agent must produce
- `hub/**/*.md` — existing entries (for deprecation scans and deduplication)

## What it will write

- `sources/sources.yaml` — updated `last_hash` values
- Existing `hub/**/*.md` entries — deprecation flags, `source_hash` backfills on seed entries
- Brand-new rules — initially staged in `.drafts/ingest/*.md` (not directly into `hub/`), pending human review and promotion

## Scope boundaries (locked)

- **Official Anthropic sources only** — no community scraping in V1.
- **No auto-merge.** Always a PR.
- **`workflow_dispatch` trigger only** for the first 3–5 runs; cron is enabled after output quality is proven.
- **No network calls from the compile step** — ingestion is the only phase that talks to the internet.

## Open questions (to resolve before Phase 3 start)

See [`MEMORY.md`](../../MEMORY.md) → *Open Questions*. Tracked: sanitization strategy, PR tool, and ingestion context-bounding.
