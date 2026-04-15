# Contributing

Thanks for considering a contribution. The Hub is maintained to be lightweight, high-signal, and strictly sourced. Please read this before opening a PR.

## What we accept

- **New rules** — entries under `hub/claude-code/{category}/` that pass lint.
- **Edits to existing rules** — clarifications, corrections, updated source URLs or `fetched` dates.
- **Retirements** — flipping rules to `status: deprecated` or `status: superseded` with a pointer to the replacement.
- **Bug fixes** in `agents/compile/`.
- **Documentation improvements** to `README.md`, `ARCHITECTURE.md`, or `hub/FORMAT.md`.

## What we don't accept (in V1)

- Rules sourced from anywhere other than official Anthropic documentation (`docs.claude.com`, `code.claude.com`, `platform.claude.com`) or the `anthropics/*` GitHub organization. See [`MEMORY.md`](./MEMORY.md) for the rationale.
- New entries targeting other AI tools (Cursor, Copilot, etc.). The `hub/{tool}/` namespace is reserved but not open for contribution yet.
- Runtime or framework changes (swapping Bun, adding web frameworks, etc.) without prior discussion in an issue.

## Before you open a PR

1. Read [`hub/FORMAT.md`](./hub/FORMAT.md) — it is the authoritative schema.
2. Read [`ARCHITECTURE.md`](./ARCHITECTURE.md) if you're touching anything under `agents/`.
3. Run locally:
   ```bash
   bun install
   bun run typecheck
   bun run compile
   bun test
   ```
   All four must succeed. `bun run compile` regenerates `dist/CLAUDE.md` and `hub/README.md` — commit those changes alongside your source change. CI will fail the PR if they drift from source.

## Authoring a rule

Fastest path — scaffold the file, then fill in the TODOs:

```bash
bun run new-rule <kebab-case-id> --category <prompting|cli|workflows|memory-management> --tag <tag>
```

The scaffolder writes `hub/claude-code/<category>/<id>.md` with FORMAT-compliant frontmatter and a body skeleton. It refuses existing ids and non-kebab-case ids.

- One atomic rule per file. If a file wants to cover two topics, split it.
- `id` equals the filename basename. Kebab-case. Never rename — use `supersedes` to retire.
- `source.url` must be an official Anthropic page, deep-linked to the relevant section anchor.
- `summary` is ≤200 characters and must stand alone — it is the line that appears in `dist/CLAUDE.md`.
- Body follows the template in [`hub/FORMAT.md`](./hub/FORMAT.md): **Rule / Why / How to apply / Example / Anti-pattern / See also**.
- Target 40–120 lines per body. Split or trim if longer.
- Examples must be real and minimal — no aspirational code.
- Don't write things Claude already knows. If removing a line wouldn't cause a mistake, cut it.

## Deprecating a rule

Never delete. Set `status: deprecated`, populate `supersedes: [replacement-id]`, and open the PR. The compile step emits a one-line warning in the bundle pointing users to the replacement. When you then add the replacement, reference the deprecated id in its own `supersedes`.

If a feature is removed entirely with no replacement, set `status: deprecated` and leave `supersedes: []` — the bundle will warn users without suggesting an alternative.

## Keeping docs in sync

Any change to the codebase should also update the relevant docs in the same PR:

- Schema changes → `hub/FORMAT.md` **and** `agents/compile/schema.ts` **and** `agents/compile/lint.ts`.
- New compile stages → `agents/compile/README.md` **and** `ARCHITECTURE.md`.
- New phases or locked decisions → `MEMORY.md`.
- Changes to the product surface → root `README.md` and `dist/README.md`.

## Commit and PR style

- One logical change per PR.
- Commit messages describe the *why* more than the *what*.
- Add a test (`test/compile.test.ts`) for any new lint invariant or compile behavior.

## Questions and larger proposals

Open an issue. For new agents, format changes, or anything that would alter locked decisions, open the issue before writing code so we can align on scope.
