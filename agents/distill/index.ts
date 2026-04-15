#!/usr/bin/env bun
import { existsSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const REPO_ROOT = resolve(import.meta.dir, '..', '..');
const DRAFTS_DIR = join(REPO_ROOT, '.drafts', 'distill');
const PROMPT_PATH = join(REPO_ROOT, 'agents', 'distill', 'prompt.md');

function findCurrentSessionJsonl(): string | null {
  const projectsDir = join(homedir(), '.claude', 'projects');
  if (!existsSync(projectsDir)) return null;
  const cwdSlug = REPO_ROOT.replace(/\//g, '-');
  const candidates = readdirSync(projectsDir)
    .filter((d) => d.endsWith(cwdSlug) || d === cwdSlug.replace(/^-/, ''))
    .map((d) => join(projectsDir, d));
  if (candidates.length === 0) return null;
  const jsonls: { path: string; mtime: number }[] = [];
  for (const dir of candidates) {
    for (const f of readdirSync(dir)) {
      if (!f.endsWith('.jsonl')) continue;
      const p = join(dir, f);
      jsonls.push({ path: p, mtime: statSync(p).mtimeMs });
    }
  }
  if (jsonls.length === 0) return null;
  jsonls.sort((a, b) => b.mtime - a.mtime);
  return jsonls[0].path;
}

async function main() {
  const arg = process.argv[2];
  const transcriptPath = arg ? resolve(arg) : findCurrentSessionJsonl();

  if (!transcriptPath || !existsSync(transcriptPath)) {
    console.error('No transcript found. Pass a path or run from a project with a Claude Code session.');
    process.exit(1);
  }

  mkdirSync(DRAFTS_DIR, { recursive: true });
  const prompt = await readFile(PROMPT_PATH, 'utf8');
  const transcript = await readFile(transcriptPath, 'utf8');

  const fullPrompt = `${prompt}\n\n---\n\nTranscript to distill (JSONL, most recent session):\n\n${transcript}`;

  console.log(`Distilling: ${transcriptPath}`);
  console.log(`Output dir: ${DRAFTS_DIR}`);

  const res = spawnSync(
    'claude',
    ['-p', fullPrompt, '--permission-mode', 'acceptEdits', '--allowed-tools', 'Read,Write,Glob,Grep'],
    { stdio: 'inherit', cwd: REPO_ROOT },
  );
  process.exit(res.status ?? 1);
}

main();
