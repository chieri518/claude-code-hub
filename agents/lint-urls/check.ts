export type HeadResult = { status: number; ok: boolean; error?: string };
export type HeadFn = (url: string) => Promise<HeadResult>;

export const defaultHead: HeadFn = async (url) => {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      headers: { 'user-agent': 'claude-code-hub-lint-urls/0.1' },
      redirect: 'follow',
    });
    return { status: res.status, ok: res.ok };
  } catch (e) {
    return { status: 0, ok: false, error: e instanceof Error ? e.message : String(e) };
  }
};

export type UrlCheck = {
  url: string;
  ok: boolean;
  status: number;
  error?: string;
  entries: string[];
};

export async function checkUrls(
  entries: { id: string; sourceUrl: string }[],
  head: HeadFn = defaultHead,
): Promise<UrlCheck[]> {
  const byUrl = new Map<string, string[]>();
  for (const e of entries) {
    const list = byUrl.get(e.sourceUrl) ?? [];
    list.push(e.id);
    byUrl.set(e.sourceUrl, list);
  }

  const results: UrlCheck[] = [];
  for (const [url, ids] of byUrl) {
    const r = await head(url);
    results.push({ url, ok: r.ok, status: r.status, error: r.error, entries: ids });
  }
  return results;
}

export function formatIssueBody(broken: UrlCheck[], runDate: string): string {
  if (broken.length === 0) {
    return `All source URLs healthy as of ${runDate}.`;
  }
  const lines = [
    `Weekly URL liveness check found ${broken.length} broken source link(s) as of ${runDate}.`,
    '',
    'Each bullet is a dead link. Fix by updating the `source.url` (and `source.fetched`) in the listed entries, or deprecating them.',
    '',
  ];
  for (const b of broken) {
    const status = b.error ? `error: ${b.error}` : `HTTP ${b.status}`;
    lines.push(`- [ ] ${b.url} — ${status}`);
    for (const id of b.entries) {
      lines.push(`  - \`hub/claude-code/**/${id}.md\``);
    }
  }
  return lines.join('\n');
}
