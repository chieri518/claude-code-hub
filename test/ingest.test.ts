import { describe, expect, test } from 'bun:test';
import { parseSources, serializeSources, extractHeader } from '../agents/ingest/sources';
import { hashContent } from '../agents/ingest/fetch';
import {
  detectChanges,
  MAX_CHANGED_SOURCES,
  RunawayIngestionError,
} from '../agents/ingest/detect';
import type { Fetcher } from '../agents/ingest/fetch';

const SAMPLE_YAML = `# header
# more header

sources:
  - id: a
    url: https://code.claude.com/a
    type: docs
    last_hash: sha256:seed
  - id: b
    url: https://code.claude.com/b
    type: docs
    last_hash: sha256:deadbeef
`;

describe('parseSources', () => {
  test('parses a valid file', () => {
    const f = parseSources(SAMPLE_YAML);
    expect(f.sources.length).toBe(2);
    expect(f.sources[0].id).toBe('a');
  });

  test('rejects duplicates', () => {
    const bad = SAMPLE_YAML.replace('id: b', 'id: a');
    expect(() => parseSources(bad)).toThrow(/duplicate/);
  });

  test('rejects invalid type', () => {
    const bad = SAMPLE_YAML.replace('type: docs', 'type: blog');
    expect(() => parseSources(bad)).toThrow(/type must be/);
  });

  test('rejects non-sha256 hash', () => {
    const bad = SAMPLE_YAML.replace('sha256:seed', 'md5:abc');
    expect(() => parseSources(bad)).toThrow(/sha256/);
  });
});

describe('extractHeader / serializeSources', () => {
  test('round-trips header and content', () => {
    const header = extractHeader(SAMPLE_YAML);
    const file = parseSources(SAMPLE_YAML);
    const out = serializeSources(file, header);
    expect(out).toContain('# header');
    const reparsed = parseSources(out);
    expect(reparsed.sources.length).toBe(2);
  });
});

describe('hashContent', () => {
  test('is deterministic and prefixed', () => {
    const h = hashContent('hello');
    expect(h).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(h).toBe(hashContent('hello'));
  });

  test('differs for different inputs', () => {
    expect(hashContent('a')).not.toBe(hashContent('b'));
  });
});

function fakeFetcher(map: Record<string, string>, status = 200): Fetcher {
  return async (url) => ({ body: map[url] ?? '', status });
}

describe('detectChanges', () => {
  test('no changes when hashes match', async () => {
    const firstHash = hashContent('content-a');
    const file = parseSources(
      `sources:
  - id: a
    url: https://x/a
    type: docs
    last_hash: ${firstHash}
`,
    );
    const fetcher = fakeFetcher({ 'https://x/a': 'content-a' });
    const result = await detectChanges(file, fetcher);
    expect(result.changed.length).toBe(0);
    expect(result.unchanged.length).toBe(1);
  });

  test('detects changes and marks firstSeen for seed hashes', async () => {
    const file = parseSources(SAMPLE_YAML);
    const fetcher = fakeFetcher({
      'https://code.claude.com/a': 'new-a',
      'https://code.claude.com/b': 'new-b',
    });
    const result = await detectChanges(file, fetcher);
    expect(result.changed.length).toBe(2);
    expect(result.changed.find((c) => c.source.id === 'a')?.firstSeen).toBe(true);
    expect(result.changed.find((c) => c.source.id === 'b')?.firstSeen).toBe(false);
    expect(result.updatedFile.sources[0].last_hash).toBe(hashContent('new-a'));
  });

  test('records HTTP errors without aborting', async () => {
    const file = parseSources(SAMPLE_YAML);
    const fetcher: Fetcher = async (url) => {
      if (url.endsWith('/a')) return { body: '', status: 500 };
      return { body: 'new-b', status: 200 };
    };
    const result = await detectChanges(file, fetcher);
    expect(result.errors.length).toBe(1);
    expect(result.changed.length).toBe(1);
  });

  test('aborts when change count exceeds cap', async () => {
    const sources = Array.from({ length: MAX_CHANGED_SOURCES + 1 }, (_, i) => ({
      id: `s${i}`,
      url: `https://code.claude.com/s${i}`,
      type: 'docs' as const,
      last_hash: 'sha256:seed',
    }));
    const map: Record<string, string> = {};
    for (const s of sources) map[s.url] = `content-${s.id}`;
    const fetcher = fakeFetcher(map);
    await expect(detectChanges({ sources }, fetcher)).rejects.toBeInstanceOf(
      RunawayIngestionError,
    );
  });
});
