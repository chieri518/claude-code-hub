# agents/compile

Deterministic compile step. Turns `hub/**/*.md` into `dist/CLAUDE.md` and `hub/README.md`. **No LLM calls, no network access** — runs offline and produces byte-identical output for a given input.

## Status

**Built.** Phase 2a complete (parse + lint + emit-claude-md + emit-readme). Phase 2b will add `emit-rules.ts` for path-scoped entries when the first such entry lands in the hub.

## Run it

```bash
bun run compile
```

Exits non-zero on any parse error, lint failure, or budget overflow — nothing is written to disk in those cases.

## Pipeline

```
parse → lint → (emit-claude-md, emit-readme) → write
```

| Stage | File | Responsibility |
|---|---|---|
| parse | `parse.ts` | Walk `hub/claude-code/**/*.md`, split frontmatter + body, validate against `schema.ts`. |
| lint | `lint.ts` | Enforce invariants from [`hub/FORMAT.md`](../../hub/FORMAT.md) (id, URL, tags, supersedes, See also). Returns `Issue[]`; a non-empty list aborts the run. |
| lint | `density.ts` | Content-quality checks beyond schema: summary soft cap (180 chars), body length bounds (15–150 lines), required H2 sections, non-empty `Example`, no system-level personality phrases. |
| emit | `emit-claude-md.ts` | Produce `dist/CLAUDE.md`. Throws `BudgetError` if the bundle exceeds 200 lines. |
| emit | `emit-readme.ts` | Produce the generated `hub/README.md` index. |
| orchestrate | `index.ts` | Run stages in order; write to disk only if every stage succeeds. |
| types | `schema.ts` | `Entry` shape, host allowlist, frontmatter validator. |

## Invariants

The authoritative list lives in [`hub/FORMAT.md`](../../hub/FORMAT.md). A change to any invariant requires editing **`schema.ts`, `lint.ts`, and `hub/FORMAT.md` in the same PR**, plus a corresponding test in `test/compile.test.ts`.

## Status handling

- `current` → full emit into `dist/CLAUDE.md`.
- `deprecated` → emitted as a one-line warning pointing to `supersedes[0]`.
- `superseded` → skipped silently.
- Invalid frontmatter → the whole build fails; no partial output.

## Extending

| Change | Edit |
|---|---|
| New schema/structural invariant | `lint.ts` + `hub/FORMAT.md` + test |
| New content-quality check | `density.ts` + `hub/FORMAT.md` + test |
| New output target | new `emit-*.ts` module + wire in `index.ts` + test |
| Schema field | `schema.ts` + `hub/FORMAT.md` + migration note in `MEMORY.md` |
