# claude-code-hub

[![ci](https://github.com/chieri518/claude-code-hub/actions/workflows/ci.yml/badge.svg)](https://github.com/chieri518/claude-code-hub/actions/workflows/ci.yml)
[![url-liveness](https://github.com/chieri518/claude-code-hub/actions/workflows/url-liveness.yml/badge.svg)](https://github.com/chieri518/claude-code-hub/actions/workflows/url-liveness.yml)

A local-first, markdown-based knowledge base of Claude Code best practices — plus a small set of agents that keep it up to date from official Anthropic sources.

**What + why in 30 seconds.** Claude Code reads a `CLAUDE.md` at the start of every session. The content of that file shapes every response you get. This repo compiles a curated, deep-linked bundle of Anthropic-official best practices into a single `dist/CLAUDE.md` you can drop into any project — so your next session starts with the right defaults instead of the generic ones.

## What you get

The product of this repo is **[`dist/CLAUDE.md`](./dist/CLAUDE.md)** — a compiled bundle of best-practice rules, deep-linked to their Anthropic source, designed to drop straight into your own project as a `CLAUDE.md` file that Claude Code reads at the start of every session.

## Three ways to use this repo

### 1. Use it in your own project (2 minutes)

```bash
curl -o CLAUDE.md https://raw.githubusercontent.com/<your-fork-or-upstream>/claude-code-hub/main/dist/CLAUDE.md
```

Claude Code picks it up automatically.

### 2. Contribute an entry

Each rule is one markdown file under `hub/claude-code/{category}/`. Fastest path:

```bash
bun run new-rule my-rule-id --category workflows --tag planning
# fill in the TODOs, then:
bun run compile && bun test
```

Full schema in [`hub/FORMAT.md`](./hub/FORMAT.md); PR checklist in [`CONTRIBUTING.md`](./CONTRIBUTING.md). Issue and PR templates pre-fill the required fields.

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
  lint-urls/        Weekly URL liveness check (Phase 5)
scripts/          Developer utilities (new-rule scaffolder)
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

V1 complete. Phases 0–6 shipped: scaffolding, seed content, compile step, ingestion detection + LLM drafting workflow, local session distillation, CI quality gates (dist-sync + weekly URL liveness), and contributor ergonomics (issue/PR templates, `bun run new-rule` scaffolder, README polish). Phase 7 (content growth) next.

## License

MIT. See [`LICENSE`](./LICENSE).
