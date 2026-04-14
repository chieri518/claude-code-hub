# dist/

Generated artifacts produced by `bun run compile`. **Do not hand-edit any file in this directory.**

## `CLAUDE.md`

The product of this repo. Drop it into the root of your own project and Claude Code will load it at the start of every session.

```bash
cp dist/CLAUDE.md /path/to/your-project/CLAUDE.md
```

Or fetch the latest directly from the GitHub web UI — no local checkout or build needed:

```bash
curl -o CLAUDE.md https://raw.githubusercontent.com/<owner>/claude-code-hub/main/dist/CLAUDE.md
```

## Why it's committed

Forkers and consumers need to be able to grab `CLAUDE.md` without installing Bun or running a build. A future CI check will enforce that the committed `dist/` matches what `bun run compile` would produce from the current `hub/` — any drift fails the PR.

## Regenerate

```bash
bun run compile
```

Produces this file and [`hub/README.md`](../hub/README.md) from the entries under `hub/claude-code/`.
