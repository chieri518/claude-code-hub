#!/usr/bin/env bun
/**
 * Scaffold a new hub entry with FORMAT-compliant frontmatter pre-filled.
 *
 * Usage:
 *   bun run new-rule <id> --category <cat> [--title "..."] [--tag <tag> ...]
 *
 * Writes hub/claude-code/<category>/<id>.md. Refuses to overwrite and refuses
 * ids that already exist in any category. Does not run compile — the author
 * fills in the body, then runs `bun run compile && bun test`.
 */
import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { CATEGORIES, type Category } from '../agents/compile/schema';

const HUB_ROOT = resolve(import.meta.dir, '..', 'hub', 'claude-code');

const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

type Args = {
  id: string;
  category: Category;
  title: string;
  tags: string[];
};

function die(msg: string): never {
  console.error(`new-rule: ${msg}`);
  process.exit(1);
}

function parseArgs(argv: string[]): Args {
  const positional: string[] = [];
  let category: string | undefined;
  let title: string | undefined;
  const tags: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--category' || a === '-c') category = argv[++i];
    else if (a === '--title' || a === '-t') title = argv[++i];
    else if (a === '--tag') tags.push(argv[++i]!);
    else if (a === '--help' || a === '-h') {
      console.log(
        'Usage: bun run new-rule <id> --category <cat> [--title "..."] [--tag <tag> ...]',
      );
      process.exit(0);
    } else if (a?.startsWith('--')) die(`unknown flag: ${a}`);
    else if (a) positional.push(a);
  }

  const id = positional[0];
  if (!id) die('missing <id>. Example: bun run new-rule use-path-scoped-rules --category memory-management');
  if (!KEBAB.test(id)) die(`id "${id}" must be kebab-case (lowercase, hyphen-separated)`);
  if (!category) die('missing --category. Options: ' + CATEGORIES.join(', '));
  if (!CATEGORIES.includes(category as Category)) {
    die(`unknown category "${category}". Options: ${CATEGORIES.join(', ')}`);
  }

  return {
    id,
    category: category as Category,
    title: title ?? idToTitle(id),
    tags,
  };
}

function idToTitle(id: string): string {
  const words = id.split('-');
  return words
    .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

async function existingIds(): Promise<Map<string, string>> {
  const found = new Map<string, string>();
  for (const cat of CATEGORIES) {
    const dir = resolve(HUB_ROOT, cat);
    let files: string[];
    try {
      files = await readdir(dir);
    } catch {
      continue;
    }
    for (const f of files) {
      if (f.endsWith('.md')) found.set(f.slice(0, -3), `${cat}/${f}`);
    }
  }
  return found;
}

function template(args: Args, today: string): string {
  const tags = args.tags.length > 0 ? `[${args.tags.join(', ')}]` : '[TODO-tag]';
  return `---
id: ${args.id}
title: ${args.title}
kind: rule
category: ${args.category}
tags: ${tags}
applies_to:
  scope: project
  paths: []
summary: >
  TODO: one-sentence "what + when" distillation, ≤200 chars. This line appears
  in dist/CLAUDE.md when the body will not fit.
source:
  url: https://code.claude.com/docs/en/TODO
  title: TODO — Page title — Section
  publisher: Anthropic
  fetched: ${today}
  source_hash: sha256:seed
status: current
supersedes: []
---

# ${args.title}

## Rule
TODO: single imperative sentence. "Do X when Y."

## Why
- TODO: one to three bullets on the mechanism — why this rule produces better outcomes.

## How to apply
TODO: concrete trigger and action. Verifiable when possible.

## Example
\`\`\`txt
TODO: minimal, real, runnable. One block. Two max.
\`\`\`

## Anti-pattern
TODO: one short counter-example showing the failure mode this rule prevents.

## See also
- [TODO](../${args.category}/TODO.md)
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const existing = await existingIds();
  const collision = existing.get(args.id);
  if (collision) die(`id "${args.id}" already exists at hub/claude-code/${collision}`);

  const outPath = resolve(HUB_ROOT, args.category, `${args.id}.md`);
  const today = new Date().toISOString().slice(0, 10);
  const content = template(args, today);

  const file = Bun.file(outPath);
  if (await file.exists()) die(`file already exists: ${outPath}`);
  await Bun.write(outPath, content);

  const rel = `hub/claude-code/${args.category}/${args.id}.md`;
  console.log(`created ${rel}`);
  console.log('next:');
  console.log('  1. fill in TODOs (source URL, summary, body)');
  console.log('  2. bun run compile && bun test');
  console.log('  3. commit the new entry + regenerated dist/ + hub/README.md');
}

main();
