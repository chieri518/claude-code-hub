# Architecture

How `claude-code-hub` is organized, what each piece does, and the rules that hold the system together. Read this once before contributing.

For runtime decisions and project status, see [`MEMORY.md`](./MEMORY.md). For the entry schema, see [`hub/FORMAT.md`](./hub/FORMAT.md).

---

## One-paragraph summary

`claude-code-hub` is a markdown knowledge base of Claude Code best practices plus a small set of agents that maintain and distribute it. Knowledge lives in `hub/` as one rule per file. A deterministic compile step turns those files into the artifacts users actually consume (`dist/CLAUDE.md`, `dist/.claude/rules/`, and a generated `hub/README.md`). Two LLM-driven agents feed the system: an *ingestion* agent that watches official Anthropic sources for changes and proposes hub edits as PRs, and a *distillation* agent that extracts lessons from local Claude Code sessions into a private drafts folder for human review.

---

## Directory layout

```
claude-code-hub/
├── hub/                        # Source of truth — the knowledge itself
│   ├── FORMAT.md               #   Authoritative entry schema (hand-edited)
│   ├── README.md               #   Generated index (do not hand-edit)
│   └── claude-code/
│       ├── prompting/          #   How to write prompts
│       ├── cli/                #   Command-line workflow
│       ├── workflows/          #   Multi-step development patterns
│       └── memory-management/  #   CLAUDE.md, .claude/rules/, imports
├── sources/
│   └── sources.yaml            # Tracked upstream URLs + content hashes
├── agents/
│   ├── compile/                # Pure function: hub/ → dist/ + hub/README.md
│   ├── ingest/                 # LLM agent: upstream changes → PRs
│   └── distill/                # LLM agent: session logs → .drafts/
├── tools/                      # User-facing tooling (post-V1)
│   └── critique/               #   Future: "Grammarly for prompts"
├── dist/                       # Generated artifacts (committed)
│   ├── CLAUDE.md               #   Unconditional rules bundle
│   └── .claude/rules/*.md      #   Path-scoped rules (Phase 2b)
├── .drafts/                    # Local, gitignored — distillation output
├── .github/workflows/          # CI: ingest cron, compile-sync check
└── MEMORY.md / ARCHITECTURE.md / FORMAT.md  (human-curated specs)
```

---

## The three agents

| Agent | When it runs | Reads | Writes | LLM? |
|---|---|---|---|---|
| **compile** | On demand (`bun run compile`) and in CI | `hub/**/*.md`, `hub/FORMAT.md` | `dist/`, `hub/README.md` | No |
| **ingest** | GitHub Action, manual then cron | `sources/sources.yaml`, upstream URLs, `hub/FORMAT.md`, `hub/**/*.md` | `sources/sources.yaml` (hashes), `.drafts/ingest/{run-id}/` (Phase 3a); PR modifying `hub/**/*.md` (Phase 3b) | Yes, Phase 3b only (headless `claude -p` via `CLAUDE_CODE_OAUTH_TOKEN`) |
| **distill** | User-invoked (`bun run distill` or `/distill`) | Local Claude Code session transcript (`~/.claude/projects/*/*.jsonl`), `hub/FORMAT.md`, existing entries | `.drafts/distill/*.md` (never `hub/` directly), max 3 per run | Yes (headless `claude -p`, single-pass sanitize + extract) |

`compile` is the only mandatory agent. `ingest` and `distill` are optional augmentations — the hub works as a pure markdown repo without them.

---

## Data flow

```
┌──────────────────────┐    ┌──────────────────────┐
│ Anthropic docs /     │    │ Local Claude Code    │
│ release notes        │    │ session              │
└──────────┬───────────┘    └───────────┬──────────┘
           │ (fetch + diff)             │ (sanitize)
           ▼                            ▼
       ┌─────────┐                 ┌─────────┐
       │ ingest  │                 │ distill │
       └────┬────┘                 └────┬────┘
            │ (PR)                      │ (write)
            ▼                           ▼
        ┌───────┐                  ┌─────────┐
        │ hub/  │ ◄─── human ──── │.drafts/ │
        └───┬───┘     review      └─────────┘
            │
            ▼  (compile)
        ┌────────────────────────┐
        │ dist/CLAUDE.md         │
        │ dist/.claude/rules/    │
        │ hub/README.md          │
        └───────────┬────────────┘
                    ▼
        ┌────────────────────────┐
        │ End user / fork        │
        │ drops dist/CLAUDE.md   │
        │ into their project     │
        └────────────────────────┘
```

Two privacy boundaries are non-negotiable:

1. **Distillation never touches `hub/` directly.** Lessons land in `.drafts/` (gitignored). The human commits them — sanitized and reviewed — into `hub/`.
2. **Ingestion never auto-merges.** It opens a PR. A human approves before knowledge enters the canonical store.

---

## Compile pipeline (Phase 2)

```
parse → lint → (emit-claude-md, emit-readme, emit-rules) → write
```

Pure functions throughout. The pipeline is deterministic, offline-capable, and produces no partial output: if any stage fails, nothing is written.

| Stage | Input | Output | Failure |
|---|---|---|---|
| **parse** | `hub/claude-code/**/*.md` | `Entry[]` | Throws on malformed YAML or markdown structure |
| **lint** | `Entry[]` | `Issue[]` | Returns issue list; non-empty list aborts the run |
| **emit-claude-md** | `Entry[]` | `string` (≤200 lines) | Throws if the bundle exceeds the 200-line cap |
| **emit-readme** | `Entry[]` | `string` | — |
| **emit-rules** (Phase 2b) | `Entry[]` | `Map<filename, string>` | — |
| **write** | strings | files on disk | Atomic per file; ordering is parse → lint → emit → write |

### Why it must stay LLM-free

The compile step is in the hot path for every contributor and every CI run. Determinism is the property that makes the rest of the system trustworthy: a rule that compiles today will compile identically tomorrow, on every fork, in every CI environment. Any LLM call here would erode that guarantee and introduce cost + flake.

### Why it must stay network-free

Same reasoning. URL liveness checks belong in a separate async linter that the ingestion agent runs on its own cadence. The compile must work on a plane.

---

## Lint invariants (enforced by `agents/compile/lint.ts`)

Source: `hub/FORMAT.md`. Any change to invariants requires updating both files in the same PR.

1. `id` equals the filename basename (without `.md`).
2. `source.url` host is in the Anthropic allowlist (`docs.claude.com`, `code.claude.com`, `platform.claude.com`, `github.com/anthropics/*`).
3. `summary` is non-empty and ≤200 characters.
4. `kind` is `rule` (V1 only).
5. `status: superseded` requires a non-empty `supersedes` array.
6. All `See also` links resolve to existing entries.
7. No two entries share an `id`.
8. (Phase 2 adds): the rendered `dist/CLAUDE.md` is ≤200 lines.

---

## Entry lifecycle

```
draft   →   merged   →   compiled   →   distributed   →   deprecated   →   superseded
(.drafts)   (hub/)        (dist/)        (downstream)      (status flag)    (replaced)
```

- **draft** — distillation output or human authoring; not yet in `hub/`.
- **merged** — passed lint, lives in `hub/` with `status: current`.
- **compiled** — included in `dist/CLAUDE.md` or `dist/.claude/rules/`.
- **distributed** — copied into a downstream project.
- **deprecated** — upstream feature renamed/removed. Entry stays as a tombstone with a one-line warning in the bundle, pointing to its replacement via `supersedes`.
- **superseded** — replaced by another entry; skipped silently by emit.

Entries are *never deleted*. Retirement is a status change. This makes upstream changes auditable and lets downstream forks understand why a rule disappeared from their bundle.

---

## Distribution model

- **The repo is the product.** `dist/CLAUDE.md` is committed so anyone can grab it from the GitHub web UI without running a build.
- **Forkers are first-class.** They run their own ingestion agent, maintain their own `hub/`, and commit their own `dist/`. No automatic upstream contributions in V1; manual PRs only.
- **No published package** in V1. If someone wants programmatic access, they clone or fork.

---

## What lives where — quick decision guide

| If you're adding... | Put it in... |
|---|---|
| A new best-practice rule | `hub/claude-code/{category}/{id}.md` |
| A change to the entry schema | `hub/FORMAT.md` + `agents/compile/schema.ts` (same PR) |
| A new compile invariant | `agents/compile/lint.ts` + `hub/FORMAT.md` (same PR) |
| Logic for the ingestion agent | `agents/ingest/` |
| Logic for distillation | `agents/distill/` |
| A user-facing CLI tool (e.g. critique) | `tools/{tool-name}/` |
| An upstream URL to track | `sources/sources.yaml` |
| Project status / decision history | `MEMORY.md` |
| Architectural change | this file |

---

## Non-goals

Calling these out so they stop coming up:

- Not a server. No runtime, no API.
- Not a database. Git is the source of truth; PRs are the audit log.
- Not a Vercel / Next.js / web app. The CI runs in GitHub Actions; nothing deploys.
- Not a published library. No npm package in V1.
- Not multi-tool yet. Reserved namespaces exist (`hub/cursor/`, etc.) but Claude Code is the only first-class target.
