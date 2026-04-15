<!-- Thanks for contributing. Keep the PR scoped to one logical change. -->

## Summary

<!-- One or two sentences on *why* this change exists. The diff shows the *what*. -->

## Change type

- [ ] New rule
- [ ] Edit to existing rule (clarification, source refresh, `fetched` bump)
- [ ] Retirement (`status: deprecated` or `superseded`)
- [ ] `agents/` or tooling change
- [ ] Docs only

## Pre-flight checklist

- [ ] `bun run typecheck` passes
- [ ] `bun run compile` passes and regenerated `dist/CLAUDE.md` + `hub/README.md` are committed
- [ ] `bun test` passes
- [ ] If schema changed: `hub/FORMAT.md`, `agents/compile/schema.ts`, `agents/compile/lint.ts` all updated in this PR
- [ ] If agent or pipeline changed: matching `README.md` / `ARCHITECTURE.md` / `MEMORY.md` updates included
- [ ] Source URLs are Anthropic-official and deep-linked to the relevant anchor
- [ ] No secrets, absolute local paths, or user names in the diff

## Notes for reviewer

<!-- Anything non-obvious: scope decisions, trade-offs, follow-up work intentionally deferred. -->
