#!/usr/bin/env bun
import { mkdir } from 'node:fs/promises';
import { extractHeader, parseSources, serializeSources } from './sources';
import { detectChanges, RunawayIngestionError } from './detect';

const SOURCES_PATH = 'sources/sources.yaml';
const DRAFTS_ROOT = '.drafts/ingest';

function runId(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').replace(/Z$/, 'Z');
}

async function main() {
  const yamlText = await Bun.file(SOURCES_PATH).text();
  const header = extractHeader(yamlText);
  const file = parseSources(yamlText);

  let result;
  try {
    result = await detectChanges(file);
  } catch (e) {
    if (e instanceof RunawayIngestionError) {
      console.error(`[ingest] ${e.message}`);
      process.exit(2);
    }
    throw e;
  }

  for (const err of result.errors) {
    console.error(`[ingest] ${err.source.id}: ${err.message}`);
  }

  if (result.changed.length === 0) {
    console.log(`[ingest] no changes across ${file.sources.length} source(s)`);
    return;
  }

  await Bun.write(SOURCES_PATH, serializeSources(result.updatedFile, header));

  const runDir = `${DRAFTS_ROOT}/${runId()}`;
  await mkdir(runDir, { recursive: true });

  const summary = {
    run: runDir,
    changed: result.changed.map((c) => ({
      id: c.source.id,
      url: c.source.url,
      type: c.source.type,
      previousHash: c.previousHash,
      newHash: c.newHash,
      firstSeen: c.firstSeen,
      bodyFile: `${c.source.id}.body.txt`,
    })),
  };

  await Bun.write(`${runDir}/summary.json`, JSON.stringify(summary, null, 2) + '\n');

  for (const change of result.changed) {
    await Bun.write(`${runDir}/${change.source.id}.body.txt`, change.body);
  }

  console.log(
    `[ingest] ${result.changed.length} source(s) changed; ` +
      `drafts staged at ${runDir}; sources.yaml updated.`,
  );
}

await main();
