import { parse as parseYaml } from 'yaml';
import { basename, relative, sep } from 'node:path';
import { type Entry, ValidationError, validateFrontmatter } from './schema';

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export async function parseHub(hubRoot: string): Promise<Entry[]> {
  const glob = new Bun.Glob('**/*.md');
  const entries: Entry[] = [];

  for await (const rel of glob.scan({ cwd: hubRoot })) {
    const filepath = `${hubRoot}/${rel}`.replaceAll(sep, '/');
    const text = await Bun.file(filepath).text();
    entries.push(parseEntry(filepath, text, hubRoot));
  }

  entries.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.id.localeCompare(b.id);
  });
  return entries;
}

export function parseEntry(filepath: string, text: string, hubRoot?: string): Entry {
  const m = FRONTMATTER_RE.exec(text);
  if (!m) throw new ValidationError(filepath, 'missing YAML frontmatter block (--- ... ---)');

  let raw: unknown;
  try {
    raw = parseYaml(m[1]);
  } catch (e) {
    throw new ValidationError(filepath, `YAML parse error: ${(e as Error).message}`);
  }
  if (!raw || typeof raw !== 'object') {
    throw new ValidationError(filepath, 'frontmatter must be a YAML mapping');
  }

  const frontmatter = validateFrontmatter(raw as Record<string, unknown>, filepath);
  const body = m[2].trim();

  const base = basename(filepath, '.md');
  if (base !== frontmatter.id) {
    throw new ValidationError(
      filepath,
      `id (${frontmatter.id}) must equal filename basename (${base})`,
    );
  }

  const expectedCategoryDir = hubRoot
    ? relative(hubRoot, filepath).split(sep)[0]
    : frontmatter.category;
  if (expectedCategoryDir && expectedCategoryDir !== frontmatter.category) {
    throw new ValidationError(
      filepath,
      `category (${frontmatter.category}) must match parent directory (${expectedCategoryDir})`,
    );
  }

  return { ...frontmatter, body, filepath };
}
