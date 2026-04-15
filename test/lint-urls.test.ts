import { describe, expect, test } from 'bun:test';
import { checkUrls, formatIssueBody, type HeadFn } from '../agents/lint-urls/check';

const mockHead = (map: Record<string, { status: number; ok: boolean; error?: string }>): HeadFn =>
  async (url) => {
    const r = map[url];
    if (!r) throw new Error(`unexpected url: ${url}`);
    return r;
  };

describe('checkUrls', () => {
  test('deduplicates shared URLs across entries', async () => {
    const head = mockHead({ 'https://a': { status: 200, ok: true } });
    const r = await checkUrls(
      [
        { id: 'e1', sourceUrl: 'https://a' },
        { id: 'e2', sourceUrl: 'https://a' },
      ],
      head,
    );
    expect(r).toHaveLength(1);
    expect(r[0].entries).toEqual(['e1', 'e2']);
  });

  test('flags 404s as broken', async () => {
    const head = mockHead({
      'https://ok': { status: 200, ok: true },
      'https://dead': { status: 404, ok: false },
    });
    const r = await checkUrls(
      [
        { id: 'a', sourceUrl: 'https://ok' },
        { id: 'b', sourceUrl: 'https://dead' },
      ],
      head,
    );
    expect(r.filter((x) => !x.ok)).toHaveLength(1);
    expect(r.find((x) => x.url === 'https://dead')?.status).toBe(404);
  });

  test('flags network errors as broken', async () => {
    const head = mockHead({ 'https://x': { status: 0, ok: false, error: 'ENOTFOUND' } });
    const r = await checkUrls([{ id: 'a', sourceUrl: 'https://x' }], head);
    expect(r[0].ok).toBe(false);
    expect(r[0].error).toBe('ENOTFOUND');
  });
});

describe('formatIssueBody', () => {
  test('emits healthy message when nothing broken', () => {
    const body = formatIssueBody([], '2026-04-15');
    expect(body).toContain('healthy');
  });

  test('lists broken urls with status + entry refs', () => {
    const body = formatIssueBody(
      [{ url: 'https://dead', ok: false, status: 404, entries: ['rule-a'] }],
      '2026-04-15',
    );
    expect(body).toContain('https://dead');
    expect(body).toContain('HTTP 404');
    expect(body).toContain('rule-a');
    expect(body).toContain('- [ ]');
  });

  test('shows error message when connection failed', () => {
    const body = formatIssueBody(
      [{ url: 'https://x', ok: false, status: 0, error: 'ENOTFOUND', entries: ['a'] }],
      '2026-04-15',
    );
    expect(body).toContain('error: ENOTFOUND');
  });
});
