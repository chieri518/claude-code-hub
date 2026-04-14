#!/usr/bin/env bun
import { parseHub } from './parse';
import { lint } from './lint';
import { emitClaudeMd } from './emit-claude-md';
import { emitReadme } from './emit-readme';

const HUB_ROOT = 'hub/claude-code';
const DIST_CLAUDE_MD = 'dist/CLAUDE.md';
const HUB_README = 'hub/README.md';

async function main() {
  let entries;
  try {
    entries = await parseHub(HUB_ROOT);
  } catch (e) {
    console.error(`[parse] ${(e as Error).message}`);
    process.exit(1);
  }

  const issues = lint(entries);
  if (issues.length > 0) {
    console.error(`[lint] ${issues.length} issue(s):`);
    for (const i of issues) console.error(`  ${i.filepath}: ${i.message}`);
    process.exit(1);
  }

  let claudeMd: string;
  try {
    claudeMd = emitClaudeMd(entries);
  } catch (e) {
    console.error(`[emit] ${(e as Error).message}`);
    process.exit(1);
  }

  const readme = emitReadme(entries);

  await Bun.write(DIST_CLAUDE_MD, claudeMd);
  await Bun.write(HUB_README, readme);

  console.log(
    `compiled ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} → ` +
      `${DIST_CLAUDE_MD} (${claudeMd.split('\n').length} lines), ${HUB_README}`,
  );
}

await main();
