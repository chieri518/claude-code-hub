import { ANTHROPIC_HOSTS, type Entry } from './schema';
import { densityCheck } from './density';

export type Issue = { filepath: string; message: string };

const SEE_ALSO_LINK_RE = /\[[^\]]+\]\((\.\.?\/[^)]+\.md)\)/g;

export const ALLOWED_TAGS = new Set([
  'context',
  'memory',
  'planning',
  'verification',
  'tools',
  'subagents',
  'hooks',
  'mcp',
  'slash-commands',
  'permissions',
  'cost',
  'git',
]);

export function lint(entries: Entry[]): Issue[] {
  const issues: Issue[] = [];
  const ids = new Set<string>();
  const idToEntry = new Map<string, Entry>();

  for (const e of entries) {
    if (ids.has(e.id)) {
      issues.push({ filepath: e.filepath, message: `duplicate id: ${e.id}` });
    }
    ids.add(e.id);
    idToEntry.set(e.id, e);
  }

  for (const e of entries) {
    let host: string;
    try {
      host = new URL(e.source.url).hostname;
    } catch {
      issues.push({ filepath: e.filepath, message: `source.url is not a valid URL` });
      continue;
    }
    const githubOk = host === 'github.com' && /\/anthropics\//.test(e.source.url);
    if (!ANTHROPIC_HOSTS.has(host) && !githubOk) {
      issues.push({
        filepath: e.filepath,
        message: `source.url host "${host}" is not in the Anthropic allowlist`,
      });
    }

    if (e.tags.length === 0 || e.tags.length > 2) {
      issues.push({
        filepath: e.filepath,
        message: `tags must have 1–2 entries (got ${e.tags.length})`,
      });
    }
    for (const t of e.tags) {
      if (!ALLOWED_TAGS.has(t)) {
        issues.push({
          filepath: e.filepath,
          message: `tag "${t}" is not in the controlled vocabulary (hub/FORMAT.md)`,
        });
      }
    }

    if (e.status === 'superseded' && e.supersedes.length === 0) {
      issues.push({
        filepath: e.filepath,
        message: `status=superseded requires a non-empty supersedes[]`,
      });
    }

    for (const ref of e.supersedes) {
      if (!ids.has(ref)) {
        issues.push({
          filepath: e.filepath,
          message: `supersedes references unknown id: ${ref}`,
        });
      }
    }

    for (const match of e.body.matchAll(SEE_ALSO_LINK_RE)) {
      const target = match[1];
      const targetId = target.replace(/^.*\//, '').replace(/\.md$/, '');
      if (!ids.has(targetId)) {
        issues.push({
          filepath: e.filepath,
          message: `See also link to unknown entry: ${target}`,
        });
      }
    }

    issues.push(...densityCheck(e));
  }

  return issues;
}
