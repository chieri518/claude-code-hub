import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

export type SourceType = 'docs' | 'changelog' | 'release-notes';

export type Source = {
  id: string;
  url: string;
  type: SourceType;
  last_hash: string;
};

export type SourcesFile = { sources: Source[] };

const VALID_TYPES: ReadonlySet<SourceType> = new Set(['docs', 'changelog', 'release-notes']);

export function parseSources(yamlText: string): SourcesFile {
  const raw = parseYaml(yamlText) as unknown;
  if (!raw || typeof raw !== 'object' || !('sources' in raw)) {
    throw new Error('sources.yaml must have a top-level `sources:` list');
  }
  const list = (raw as { sources: unknown }).sources;
  if (!Array.isArray(list)) {
    throw new Error('`sources` must be a list');
  }

  const seen = new Set<string>();
  const out: Source[] = [];
  for (const [i, item] of list.entries()) {
    if (!item || typeof item !== 'object') {
      throw new Error(`sources[${i}] is not an object`);
    }
    const s = item as Record<string, unknown>;
    const id = s.id;
    const url = s.url;
    const type = s.type;
    const last_hash = s.last_hash;
    if (typeof id !== 'string' || !id) throw new Error(`sources[${i}].id missing`);
    if (typeof url !== 'string' || !url) throw new Error(`sources[${i}].url missing`);
    if (typeof type !== 'string' || !VALID_TYPES.has(type as SourceType)) {
      throw new Error(`sources[${i}].type must be one of docs|changelog|release-notes`);
    }
    if (typeof last_hash !== 'string' || !last_hash.startsWith('sha256:')) {
      throw new Error(`sources[${i}].last_hash must start with "sha256:"`);
    }
    if (seen.has(id)) throw new Error(`duplicate source id: ${id}`);
    seen.add(id);
    out.push({ id, url, type: type as SourceType, last_hash });
  }
  return { sources: out };
}

export function serializeSources(file: SourcesFile, originalHeader: string): string {
  const body = stringifyYaml(file, { lineWidth: 0 });
  return originalHeader.trimEnd() + '\n\n' + body.trimEnd() + '\n';
}

const HEADER_RE = /^(#.*\n)+/;

export function extractHeader(yamlText: string): string {
  const m = yamlText.match(HEADER_RE);
  return m ? m[0] : '';
}
