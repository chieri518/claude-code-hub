# agents/ingest

Automated ingestion agent. Monitors official Anthropic sources for changes and proposes hub updates as pull requests.

## Status

**Phase 3a: Built — deterministic detection layer.**
**Phase 3b: Not yet built — LLM drafting + GitHub workflow.**

See [`MEMORY.md`](../../MEMORY.md) for phase status and locked decisions.

## Run detection locally

```bash
bun run ingest:detect
```

For each source in `sources/sources.yaml`, this fetches the URL, computes a whole-page SHA-256, and compares against the stored `last_hash`. If any source has changed:

1. Updates `sources.yaml` with the new hashes.
2. Creates `.drafts/ingest/{run-id}/` containing:
   - `summary.json` — list of changed sources with URLs, old/new hashes, and a `firstSeen` flag.
   - `{source-id}.body.txt` — the full fetched body of each changed source.
3. Exits 0. No `hub/` writes, no LLM calls.

Exits **2** if more than **5 sources changed** in one run (runaway guardrail — usually signals a large upstream reorg or a fetch bug).

## Pipeline (Phase 3a)

| Stage | File | Responsibility |
|---|---|---|
| load | `sources.ts` | Parse and validate `sources/sources.yaml`. |
| fetch | `fetch.ts` | HTTP GET + SHA-256 of the whole page. Fetcher is injectable (used by tests). |
| detect | `detect.ts` | Compare hashes, collect changes, enforce the runaway cap. |
| orchestrate | `index.ts` | Wire it together, update `sources.yaml`, write drafts. |

## Pipeline (Phase 3b — planned)

A GitHub Actions workflow will run `ingest:detect` on a schedule, then hand each `.drafts/ingest/{run-id}/` to a headless `claude -p` invocation authenticated with `CLAUDE_CODE_OAUTH_TOKEN`. The LLM reads the run summary, `hub/FORMAT.md`, and existing entries, then proposes edits. `bun run compile && bun test` gates the PR. `peter-evans/create-pull-request` opens it. No auto-merge.

## What it reads

- `sources/sources.yaml` — tracked URLs and stored hashes
- Upstream URLs (HTTPS)
- (Phase 3b) `hub/FORMAT.md` and `hub/**/*.md`

## What it writes

- `sources/sources.yaml` — updated `last_hash` values after successful fetches
- `.drafts/ingest/{run-id}/` — snapshots and summary for the LLM stage
- (Phase 3b) a branch + PR modifying `hub/**/*.md`, `sources/sources.yaml`, and staging brand-new rules under `.drafts/ingest/` for human promotion

## Scope boundaries (locked)

- **Official Anthropic sources only** — no community scraping in V1.
- **No auto-merge.** Always a PR.
- **`workflow_dispatch` only** for the first 3–5 runs; cron only after quality is proven.
- **5-source cap per run** — aborts hard on overflow to protect Max-plan quota.
- **Agent never writes to `hub/` directly for new rules.** New rules stage in `.drafts/ingest/` for human authoring. Existing-entry edits (deprecation, hash backfill) may go directly to `hub/` because they are small and mechanical.
