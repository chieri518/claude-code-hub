export type Category = 'prompting' | 'cli' | 'workflows' | 'memory-management';
export type Scope = 'project' | 'user' | 'managed';
export type Kind = 'rule';
export type Status = 'current' | 'deprecated' | 'superseded';

export type Entry = {
  id: string;
  title: string;
  kind: Kind;
  category: Category;
  tags: string[];
  applies_to: { scope: Scope; paths: string[] };
  summary: string;
  source: {
    url: string;
    title: string;
    publisher: string;
    fetched: string;
    source_hash: string;
  };
  status: Status;
  supersedes: string[];
  body: string;
  filepath: string;
};

export const CATEGORIES: readonly Category[] = [
  'prompting',
  'cli',
  'workflows',
  'memory-management',
] as const;

export const ANTHROPIC_HOSTS = new Set([
  'docs.claude.com',
  'code.claude.com',
  'platform.claude.com',
]);

const SCOPES = new Set<Scope>(['project', 'user', 'managed']);
const STATUSES = new Set<Status>(['current', 'deprecated', 'superseded']);

export class ValidationError extends Error {
  constructor(public filepath: string, message: string) {
    super(`${filepath}: ${message}`);
  }
}

type RawFrontmatter = Record<string, unknown>;

export function validateFrontmatter(
  raw: RawFrontmatter,
  filepath: string,
): Omit<Entry, 'body' | 'filepath'> {
  const err = (msg: string) => {
    throw new ValidationError(filepath, msg);
  };

  const str = (k: string): string => {
    const v = raw[k];
    if (typeof v !== 'string' || v.trim() === '') err(`${k} must be a non-empty string`);
    return v as string;
  };

  const strArr = (k: string): string[] => {
    const v = raw[k];
    if (!Array.isArray(v) || !v.every((x) => typeof x === 'string')) {
      err(`${k} must be a string array`);
    }
    return v as string[];
  };

  const id = str('id');
  const title = str('title');
  const kind = str('kind');
  if (kind !== 'rule') err(`kind must be "rule" (V1); got "${kind}"`);

  const category = str('category');
  if (!CATEGORIES.includes(category as Category)) {
    err(`category must be one of ${CATEGORIES.join(', ')}; got "${category}"`);
  }

  const tags = strArr('tags');
  const summary = str('summary').trim();
  if (summary.length > 200) err(`summary exceeds 200 chars (got ${summary.length})`);

  const applies_to_raw = raw.applies_to as Record<string, unknown> | undefined;
  if (!applies_to_raw || typeof applies_to_raw !== 'object') err('applies_to is required');
  const scope = (applies_to_raw as Record<string, unknown>).scope;
  if (typeof scope !== 'string' || !SCOPES.has(scope as Scope)) {
    err(`applies_to.scope must be one of project|user|managed`);
  }
  const pathsRaw = (applies_to_raw as Record<string, unknown>).paths;
  if (!Array.isArray(pathsRaw) || !pathsRaw.every((x) => typeof x === 'string')) {
    err('applies_to.paths must be a string array');
  }

  const source = raw.source as Record<string, unknown> | undefined;
  if (!source || typeof source !== 'object') err('source block is required');
  const sourceStr = (k: string): string => {
    const v = (source as Record<string, unknown>)[k];
    if (typeof v !== 'string' || v.trim() === '') {
      err(`source.${k} must be a non-empty string`);
    }
    return v as string;
  };
  const sUrl = sourceStr('url');
  const sTitle = sourceStr('title');
  const sPublisher = sourceStr('publisher');
  const sFetched = sourceStr('fetched');
  const sHash = sourceStr('source_hash');

  const status = str('status');
  if (!STATUSES.has(status as Status)) err(`status must be one of current|deprecated|superseded`);

  const supersedes = strArr('supersedes');

  return {
    id,
    title,
    kind: 'rule',
    category: category as Category,
    tags,
    applies_to: { scope: scope as Scope, paths: pathsRaw as string[] },
    summary,
    source: {
      url: sUrl,
      title: sTitle,
      publisher: sPublisher,
      fetched: sFetched,
      source_hash: sHash,
    },
    status: status as Status,
    supersedes,
  };
}
