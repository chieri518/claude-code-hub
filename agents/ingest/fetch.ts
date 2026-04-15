import { createHash } from 'node:crypto';

export type FetchResult = { body: string; status: number };
export type Fetcher = (url: string) => Promise<FetchResult>;

export const defaultFetcher: Fetcher = async (url) => {
  const res = await fetch(url, {
    headers: { 'user-agent': 'claude-code-hub-ingest/0.1 (+github.com/anthropics/claude-code)' },
    redirect: 'follow',
  });
  return { body: await res.text(), status: res.status };
};

export function hashContent(body: string): string {
  return 'sha256:' + createHash('sha256').update(body).digest('hex');
}
