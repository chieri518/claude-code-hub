import { describe, expect, test } from 'bun:test';
import { parseEntry } from '../agents/compile/parse';
import { lint } from '../agents/compile/lint';
import { emitClaudeMd, BudgetError } from '../agents/compile/emit-claude-md';
import { emitReadme } from '../agents/compile/emit-readme';
import type { Entry } from '../agents/compile/schema';

function fixture(
  overrides: Partial<Entry> & { id: string; category: Entry['category'] },
): Entry {
  const {
    id,
    category,
    title = `Title for ${id}`,
    summary = `Summary for ${id}`,
    status = 'current',
    supersedes = [],
    body = '',
    ...rest
  } = overrides;
  return {
    id,
    title,
    kind: 'rule',
    category,
    tags: [],
    applies_to: { scope: 'project', paths: [] },
    summary,
    source: {
      url: 'https://code.claude.com/docs/en/best-practices',
      title: 'Best Practices',
      publisher: 'Anthropic',
      fetched: '2026-04-13',
      source_hash: 'sha256:seed',
    },
    status,
    supersedes,
    body,
    filepath: `hub/claude-code/${category}/${id}.md`,
    ...rest,
  };
}

describe('parseEntry', () => {
  test('parses a valid entry', () => {
    const text = `---
id: sample-rule
title: Sample rule
kind: rule
category: workflows
tags: [a]
applies_to:
  scope: project
  paths: []
summary: A short summary.
source:
  url: https://code.claude.com/docs/en/best-practices
  title: Best Practices
  publisher: Anthropic
  fetched: 2026-04-13
  source_hash: sha256:seed
status: current
supersedes: []
---

# Sample rule
body
`;
    const e = parseEntry('hub/claude-code/workflows/sample-rule.md', text, 'hub/claude-code');
    expect(e.id).toBe('sample-rule');
    expect(e.category).toBe('workflows');
    expect(e.body).toContain('body');
  });

  test('rejects mismatched id/filename', () => {
    const text = `---
id: wrong-id
title: t
kind: rule
category: workflows
tags: []
applies_to: { scope: project, paths: [] }
summary: s
source:
  url: https://code.claude.com/x
  title: t
  publisher: Anthropic
  fetched: 2026-04-13
  source_hash: sha256:seed
status: current
supersedes: []
---
body
`;
    expect(() =>
      parseEntry('hub/claude-code/workflows/sample.md', text, 'hub/claude-code'),
    ).toThrow(/id.*must equal filename basename/);
  });
});

describe('lint', () => {
  test('flags non-Anthropic source hosts', () => {
    const e = fixture({ id: 'x', category: 'workflows' });
    e.source.url = 'https://example.com/blog';
    expect(lint([e])[0]?.message).toMatch(/not in the Anthropic allowlist/);
  });

  test('accepts github.com/anthropics/ URLs', () => {
    const e = fixture({ id: 'x', category: 'workflows' });
    e.source.url = 'https://github.com/anthropics/claude-code/releases';
    expect(lint([e])).toEqual([]);
  });

  test('flags duplicate ids', () => {
    const a = fixture({ id: 'dup', category: 'workflows' });
    const b = fixture({ id: 'dup', category: 'prompting' });
    const issues = lint([a, b]);
    expect(issues.some((i) => /duplicate id/.test(i.message))).toBe(true);
  });

  test('flags superseded without supersedes[]', () => {
    const e = fixture({ id: 'x', category: 'workflows', status: 'superseded' });
    expect(lint([e])[0]?.message).toMatch(/supersedes/);
  });

  test('flags unknown See also links', () => {
    const e = fixture({
      id: 'x',
      category: 'workflows',
      body: 'See [ghost](../prompting/ghost.md).',
    });
    expect(lint([e])[0]?.message).toMatch(/unknown entry/);
  });
});

describe('emitClaudeMd', () => {
  test('produces a bundle under the 200-line cap', () => {
    const entries = [
      fixture({ id: 'a', category: 'workflows' }),
      fixture({ id: 'b', category: 'prompting' }),
    ];
    const out = emitClaudeMd(entries);
    expect(out.split('\n').length).toBeLessThanOrEqual(200);
    expect(out).toContain('## Workflows');
    expect(out).toContain('Title for a');
  });

  test('throws when bundle exceeds cap', () => {
    const many = Array.from({ length: 500 }, (_, i) =>
      fixture({ id: `e${i}`, category: 'workflows' }),
    );
    expect(() => emitClaudeMd(many)).toThrow(BudgetError);
  });

  test('emits deprecated entries as warnings', () => {
    const e = fixture({
      id: 'old',
      category: 'workflows',
      status: 'deprecated',
      supersedes: ['new-thing'],
    });
    const out = emitClaudeMd([e]);
    expect(out).toContain('**Deprecated:**');
    expect(out).toContain('new-thing');
  });

  test('skips superseded entries silently', () => {
    const live = fixture({ id: 'live', category: 'workflows' });
    const dead = fixture({
      id: 'dead',
      category: 'workflows',
      status: 'superseded',
      supersedes: ['live'],
    });
    const out = emitClaudeMd([live, dead]);
    expect(out).toContain('live');
    expect(out).not.toContain('Title for dead');
  });
});

describe('emitReadme', () => {
  test('produces an index table', () => {
    const e = fixture({ id: 'a', category: 'workflows' });
    const out = emitReadme([e]);
    expect(out).toContain('# Hub Index');
    expect(out).toContain('## Workflows');
    expect(out).toContain('`a`');
    expect(out).toContain('./claude-code/workflows/a.md');
  });

  test('marks non-current entries with a status tag', () => {
    const e = fixture({
      id: 'old',
      category: 'workflows',
      status: 'deprecated',
      supersedes: ['new'],
    });
    const out = emitReadme([e]);
    expect(out).toContain('_(deprecated)_');
  });
});
