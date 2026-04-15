import type { Fetcher } from './fetch';
import { defaultFetcher, hashContent } from './fetch';
import type { Source, SourcesFile } from './sources';

export type SourceChange = {
  source: Source;
  previousHash: string;
  newHash: string;
  body: string;
  firstSeen: boolean;
};

export type DetectResult = {
  changed: SourceChange[];
  unchanged: Source[];
  errors: { source: Source; message: string }[];
  updatedFile: SourcesFile;
};

export const MAX_CHANGED_SOURCES = 5;

export class RunawayIngestionError extends Error {
  constructor(public changedCount: number) {
    super(
      `ingestion detected ${changedCount} changed sources (cap: ${MAX_CHANGED_SOURCES}). ` +
        `This usually indicates a large upstream reorganization or a bug. ` +
        `Aborting to protect rate-limit quota. Re-run manually after review.`,
    );
  }
}

export async function detectChanges(
  file: SourcesFile,
  fetcher: Fetcher = defaultFetcher,
): Promise<DetectResult> {
  const changed: SourceChange[] = [];
  const unchanged: Source[] = [];
  const errors: DetectResult['errors'] = [];
  const updatedSources: Source[] = [];

  for (const source of file.sources) {
    try {
      const { body, status } = await fetcher(source.url);
      if (status < 200 || status >= 300) {
        errors.push({ source, message: `HTTP ${status}` });
        updatedSources.push(source);
        continue;
      }
      const newHash = hashContent(body);
      if (newHash === source.last_hash) {
        unchanged.push(source);
        updatedSources.push(source);
      } else {
        const firstSeen = source.last_hash === 'sha256:seed';
        changed.push({
          source,
          previousHash: source.last_hash,
          newHash,
          body,
          firstSeen,
        });
        updatedSources.push({ ...source, last_hash: newHash });
      }
    } catch (e) {
      errors.push({ source, message: (e as Error).message });
      updatedSources.push(source);
    }
  }

  if (changed.length > MAX_CHANGED_SOURCES) {
    throw new RunawayIngestionError(changed.length);
  }

  return {
    changed,
    unchanged,
    errors,
    updatedFile: { sources: updatedSources },
  };
}
