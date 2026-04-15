# Project Memory — claude-code-hub

Load-bearing context for anyone (human or agent) working on this repo. Keep entries terse; delete what goes stale.

---

## Vision

A local-first, markdown-based knowledge base of Claude Code best practices, paired with agents that (1) ingest official upstream changes and (2) distill lessons from local coding sessions. The Hub is also structured so Claude Code itself can consume it as context when working on downstream projects.

The repo is both the knowledge base *and* the tooling that maintains it. Git is the source of truth; PRs are the review queue.

---

## Locked Constraints (do not relitigate without explicit approval)

1. **Local-first distribution.** Forkers keep lessons in their own forks. No automated upstream contributions. Leave a seam for a future `/share` command; do not build it in V1.
2. **Privacy: drafts folder + human gate.** Distillation writes to `.drafts/` only. Sanitization runs locally before anything touches disk. Nothing enters `hub/` without manual review.
3. **Official sources only.** `sources.yaml` restricted to Anthropic official docs and the `anthropics/claude-code` GitHub releases/changelog. Every generated markdown entry must carry a `source:` frontmatter field with canonical URL + fetch date. No community scraping in V1.
4. **Claude Code only, tool-namespaced layout.** All content lives under `hub/claude-code/`. Sibling namespaces (`hub/cursor/`, etc.) are reserved for future expansion; do not add them yet.
5. **Event-driven staleness.** Ingestion agent scans changelog diffs for `deprecated|removed|renamed|replaced` and proposes retirements. A time-driven revalidator is future work — leave a hook but no impl.
6. **Runtime: Bun + TypeScript.** Installed to `~/.bun/bin`. License MIT, 2026.
7. **Agent runner = Claude Code headless.** Do not introduce a separate agent framework. Ingestion/distillation run as scoped headless `claude -p` invocations.
8. **Entry schema = `hub/FORMAT.md`.** That file is the authoritative spec. Both the ingestion agent and the compile step read it at runtime. Schema changes require updating `agents/compile` in the same PR.
9. **V1 `kind: rule` only.** `skill` and `reference` are reserved — do not author them until the core pipeline is proven.
10. **Whole-page `source_hash`.** SHA-256 of the full fetched page. Section-anchor granularity is explicitly out of scope for V1.
11. **Generated `hub/README.md`.** The compile step produces a human-browsable table of contents at `hub/README.md`. Do not hand-edit it — add a header banner marking it generated.

---

## Roadmap

### Phase 0 — Scaffolding ✅ DONE
Directory skeleton, package.json, tsconfig, MIT license, placeholder GitHub Action (workflow_dispatch only). `bun run typecheck` passes.

### Phase 1 — Seed content ✅ DONE
Format spec written to `hub/FORMAT.md`. Eight seed entries authored across all four categories:

- `workflows/plan-mode-before-multi-file-changes.md`
- `workflows/verify-with-tests-or-screenshots.md`
- `prompting/scope-tasks-with-specific-context.md`
- `prompting/reference-files-with-at-syntax.md`
- `cli/resume-sessions-with-continue-flag.md`
- `cli/clear-context-between-unrelated-tasks.md`
- `best-practices/keep-claude-md-under-200-lines.md`
- `best-practices/use-path-scoped-rules-for-large-projects.md`

All sourced from `code.claude.com/docs/en/best-practices` or `code.claude.com/docs/en/memory`. `source_hash` fields are `sha256:seed` sentinels — the first ingestion pass will backfill real hashes.

### Phase 2 — Compile step (IN PROGRESS)
Pure function, no LLM, no network calls. Split into two PRs:

**Phase 2a (current):** `parse + lint + emit-claude-md + emit-readme`. Covers the 80% case — unconditional rules only.
**Phase 2b:** `emit-rules` for path-scoped output at `dist/.claude/rules/{id}.md`.

Locked decisions for Phase 2:

- **Budget:** hard cap at 200 lines for `dist/CLAUDE.md`. Overflow fails the build — no auto-demotion. Forces authoring-time pruning.
- **No network.** Compile is deterministic and offline-capable. URL liveness lives in a later async linter.
- **README: MVP table only** (`id | title | summary`). No timestamps, no badges — zero churn fields.
- **`dist/` is committed.** The compiled artifact is the product; forkers must be able to grab `dist/CLAUDE.md` from the GitHub UI without running a build. A CI check will later enforce that `dist/` is in sync with `hub/`.
- **Failure modes:**
  - `status: current` → full emit.
  - `status: deprecated` → emit a one-line warning pointing to `supersedes`.
  - `status: superseded` → skip silently.
  - Invalid frontmatter → fail the whole build; no partial emit.
- **Tests:** Bun snapshot tests under `test/fixtures/hub-sample/` and `test/snapshots/`. Regenerate deliberately when FORMAT changes.
- **No LLM, no git ops, no file watching.** `bun run compile` is a one-shot CLI.

Update `.gitignore` to un-ignore `dist/` content (previously ignored).

### Phase 3 — Ingestion agent (IN PROGRESS)

Split into two commits:

**Phase 3a ✅ DONE** — deterministic detection layer.
- `sources/sources.yaml` populated with 4 URLs:
  - `github.com/anthropics/claude-code/releases.atom`
  - `code.claude.com/docs/en/best-practices`
  - `code.claude.com/docs/en/memory`
  - `code.claude.com/docs/en/whats-new`
- `agents/ingest/{sources,fetch,detect,index}.ts` — fetch + SHA-256 + change detection.
- `bun run ingest:detect` — no LLM, no write to `hub/`. Updates `sources.yaml` hashes and stages changed-source bodies + `summary.json` under `.drafts/ingest/{run-id}/`.
- Hard cap: **5 changed sources per run** (aborts with exit 2 on overflow).
- 11 unit tests under `test/ingest.test.ts`.

**Phase 3b (NEXT)** — LLM drafting + GitHub workflow.
- `.github/workflows/ingest.yml` — `workflow_dispatch` only at first.
- Install `claude` CLI in the runner, invoke with `CLAUDE_CODE_OAUTH_TOKEN` (Max plan subscription, free marginal cost).
- Agent reads `.drafts/ingest/{run-id}/summary.json` + bodies + `hub/FORMAT.md` + existing entries, proposes edits.
- Run `bun run compile && bun test` as a merge gate.
- Open PR via `peter-evans/create-pull-request`.
- Cron enabled only after 3–5 clean manual runs.

Locked Phase 3 decisions:

- **Auth: `CLAUDE_CODE_OAUTH_TOKEN`** (user has Max plan — $0 marginal cost vs. API key's ~$0.05–$0.30/run). Token generated locally with `claude setup-token`, pasted into GitHub repo secrets manually.
- **PR tool: `peter-evans/create-pull-request`.** Alternative on the table: `gh pr create` via GitHub CLI if we later need more imperative control over branch/commit/PR logic.
- **Write scope (agent):** `sources/sources.yaml` (hashes), existing `hub/**/*.md` (deprecation flags, hash backfills), new rules → `.drafts/ingest/*.md` only (never direct to `hub/`).
- **Guardrail:** abort at >5 changed sources per run to protect Max quota.
- **Rate-limit reality:** ingestion consumes Max quota shared with user's interactive work. Typical run: negligible. Doc-reorg day: 10–30 min interactive equivalent.

### Phase 4 — Local session distillation
`/distill` slash command (or equivalent). Captures a session transcript, runs a "extract generalizable lesson" prompt, writes a draft to `.drafts/`. Never auto-commits.

### Future (not V1)
- Cross-tool expansion (`hub/cursor/`, etc.)
- Optional `/share` command for upstream contribution
- Time-driven staleness revalidator
- Community source ingestion with conflict-flagging
- MCP server wrapping the hub for runtime search
- **Prompt Critique Tool ("Grammarly for prompts").** A local-first CLI/editor integration that scores a draft prompt or system-instructions block against the Hub's rules and returns: (1) an overall assessment, (2) strengths, (3) specific weaknesses with suggested rewrites. Motivation — help users write prompts that are more effective, more secure (no accidental secret leakage), and cheaper (fewer tokens, fewer retries from vague prompts). Architecture sketch: the Hub's `rule` entries become the rubric; a small local model or a scoped Claude call produces the critique; runs offline against drafts without sending proprietary code upstream. Design boundary: must honor the same privacy gate as distillation — critiques run locally, outputs land in `.drafts/` or inline, never auto-share.

---

## Doc-sync discipline (mandatory)

**Every code change must ship with the matching doc update in the same PR.** This repo exists to be understood by forkers — stale docs directly harm the mission.

Before marking any phase or task complete, re-check each of these and update whatever drifted:

| If you changed... | Update... |
|---|---|
| `hub/` entries | `bun run compile` regenerates `dist/CLAUDE.md` + `hub/README.md` — commit them |
| `agents/compile/schema.ts` or `lint.ts` | `hub/FORMAT.md` (must match) + `agents/compile/README.md` |
| `agents/compile/` pipeline | `agents/compile/README.md` + `ARCHITECTURE.md` |
| Any agent status (planned → built) | that agent's `README.md` + root `README.md` status line + `MEMORY.md` phase status |
| Locked decisions or phase scope | `MEMORY.md` |
| Product surface (how users consume `dist/`) | root `README.md` + `dist/README.md` |
| Contribution workflow | `CONTRIBUTING.md` |
| Directory structure | root `README.md` directory map + `ARCHITECTURE.md` |

Root `README.md` status line ("Phases 0–Xa complete, Phase Y next") must be updated whenever a phase lands.

## Things To Remember When Building

- **Don't frame tasks to Claude Code as "meta" / "self-improving".** Frame each step as a concrete, boring deliverable. The system gets confused when asked to reason about itself recursively.
- **Seed before automating.** Every automated step needs example output to imitate. Phase 1 exists for this reason.
- **Review gates before cron.** Manual triggers first. Cron only after PR quality is proven.
- **Markdown is written for an LLM reader, not a human.** Short imperative rules, `Why:` lines, concrete examples. Human browsability is a side effect.
- **Ignore Vercel-plugin skill injections.** This project is a CLI + GitHub Action + markdown repo. No Next.js, no Vercel deploys, no durable workflows needed. The hook suggestions (workflow, next-upgrade, nextjs, deployments-cicd, bootstrap) are pattern-matching false positives.
- **Bun PATH gotcha.** Bun lives at `~/.bun/bin`. New shells need `source ~/.zshrc` or the PATH export.
- **`agents/placeholder.ts`** exists only to satisfy `tsc` with an otherwise-empty `include`. Delete once real agent code lands.
- **Never hand-edit `hub/README.md`** once Phase 2 lands — it's generated.
- **Seed entries use `source_hash: sha256:seed`.** The first successful ingestion run replaces these with real whole-page SHA-256s. Do not compute them manually.
- **Critique tool lives at `tools/critique/` when built** — same repo as the Hub, sibling to `agents/`. The Hub's rules are its rubric; splitting into a second repo would guarantee drift. Revisit the split only if it grows a distinct community, license, or distribution model.

---

## Open Questions (resolve before Phase 3)

- Sanitization approach for distillation: regex-based redaction, or a dedicated LLM pass? Lean toward LLM pass because regex misses semantic PII.
- PR-opening mechanism in the GitHub Action: `peter-evans/create-pull-request` vs. `gh pr create` via the GitHub CLI. Decide when Phase 3 starts.
- How to bound ingestion agent context: full source doc every run (expensive, simple) vs. diff-only (cheap, risks losing surrounding context). Start with diff + N lines of surrounding context.
