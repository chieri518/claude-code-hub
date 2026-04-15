# agents/lint-urls

URL liveness linter. Weekly cron check that every entry's `source.url` still resolves. On failures, opens (or updates) a single rolling issue titled **Broken source URLs** labeled `broken-link`. Closes the issue when all links recover.

## Status

**Phase 5: Built.**

## Run it locally

```bash
bun run lint:urls
```

Prints a table and exits non-zero on any broken link.

## Pipeline

| Stage | File | Responsibility |
|---|---|---|
| load | (reuses `agents/compile/parse.ts`) | Parse hub entries, skip `superseded`. |
| dedupe + check | `check.ts` | HEAD-request each unique URL; aggregate by entry. Fetcher is injectable (used by tests). |
| format | `check.ts` | `formatIssueBody()` — checklist suitable for a GitHub issue body. |
| orchestrate | `index.ts` | CLI. `--ci` flag switches stdout to issue-body format for the workflow. |

## CI

`.github/workflows/url-liveness.yml` runs every Monday at 08:00 UTC (and on manual dispatch). Uses the built-in `GITHUB_TOKEN`; no secrets required beyond that.

## What it reads / writes

- Reads: `hub/claude-code/**/*.md` (entries).
- Writes: nothing to disk. Only GitHub issue state via `gh issue` in CI.
