# claude-code-hub

A local-first, markdown-based knowledge base of Claude Code best practices — plus a small set of agents that keep it up to date from official Anthropic sources.

## What you get

The product of this repo is **[`dist/CLAUDE.md`](./dist/CLAUDE.md)** — a compiled bundle of best-practice rules, deep-linked to their Anthropic source, designed to drop straight into your own project as a `CLAUDE.md` file that Claude Code reads at the start of every session.

## Three ways to use this repo

### 1. Use it in your own project (2 minutes)

```bash
curl -o CLAUDE.md https://raw.githubusercontent.com/<your-fork-or-upstream>/claude-code-hub/main/dist/CLAUDE.md
```

Claude Code picks it up automatically.

### 2. Contribute an entry

Each rule is one markdown file under `hub/claude-code/{category}/`. Follow [`hub/FORMAT.md`](./hub/FORMAT.md) and [`CONTRIBUTING.md`](./CONTRIBUTING.md), then open a PR.

### 3. Fork and run your own ingestion

The repo includes (Phase 3) a GitHub Action that monitors official Anthropic docs and release notes for changes and proposes hub updates as PRs. Forkers curate their own knowledge base without depending on upstream.

## Directory map

```
hub/              Source-of-truth markdown — one rule per file
  FORMAT.md         Entry schema (read before authoring)
  README.md         Generated index (do not hand-edit)
  claude-code/      Rules, grouped by category
agents/
  compile/          hub/ → dist/  (deterministic, no LLM, no network)
  ingest/           Upstream → PRs  (LLM, planned — Phase 3)
  distill/          Session → .drafts/  (LLM, planned — Phase 4)
sources/          URLs tracked by the ingestion agent
dist/             Generated artifacts (committed — copy into your project)
tools/            User-facing tooling (post-V1)
test/             Snapshot + unit tests for agents/compile
```

## Quick start (contributors)

```bash
# install runtime
curl -fsSL https://bun.sh/install | bash

# install deps
bun install

# verify
bun run typecheck
bun run compile
bun test
```

Commit the regenerated `dist/CLAUDE.md` and `hub/README.md` alongside any change to `hub/`.

## Where to read next

- **[`ARCHITECTURE.md`](./ARCHITECTURE.md)** — how the pieces fit together, data flow, and invariants
- **[`hub/FORMAT.md`](./hub/FORMAT.md)** — the schema every hub entry must follow
- **[`CONTRIBUTING.md`](./CONTRIBUTING.md)** — how to author a rule and open a PR
- **[`MEMORY.md`](./MEMORY.md)** — locked decisions, roadmap, and phase status

## Status

V1 in active development. Phases 0–2a complete (scaffolding, seed content, compile step with snapshot tests). Phase 3 (ingestion agent) is next.

## License

MIT. See [`LICENSE`](./LICENSE).
