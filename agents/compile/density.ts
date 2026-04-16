import type { Entry } from './schema';
import type { Issue } from './lint';

/** Content-quality checks beyond schema/id/url invariants.
 *  Every check here exists to protect signal-per-token in dist/CLAUDE.md. */

const SUMMARY_SOFT_CAP = 180;
const BODY_MAX_LINES = 150;
const BODY_MIN_LINES = 15;

const REQUIRED_SECTIONS = [
  'Rule',
  'Why',
  'How to apply',
  'Example',
  'Anti-pattern',
] as const;

/** Phrases Claude Code already has at the system level — repeating them in
 *  a hub rule wastes downstream context. Matched case-insensitively on body
 *  text with fenced code blocks stripped. */
const PERSONALITY_PHRASES = [
  'think step by step',
  'be thorough',
  'be careful',
  'carefully',
  'make sure to',
];

const FENCED_BLOCK_RE = /```[\s\S]*?```/g;
const H2_RE = /^##\s+(.+?)\s*$/gm;

export function densityCheck(e: Entry): Issue[] {
  const issues: Issue[] = [];

  if (e.summary.length > SUMMARY_SOFT_CAP) {
    issues.push({
      filepath: e.filepath,
      message: `summary is ${e.summary.length} chars (soft cap ${SUMMARY_SOFT_CAP}); tighten it — summary is the line that survives the CLAUDE.md budget`,
    });
  }

  const bodyLines = e.body.split('\n').length;
  if (bodyLines > BODY_MAX_LINES) {
    issues.push({
      filepath: e.filepath,
      message: `body is ${bodyLines} lines (max ${BODY_MAX_LINES}); split into two entries or trim`,
    });
  }
  if (bodyLines < BODY_MIN_LINES) {
    issues.push({
      filepath: e.filepath,
      message: `body is ${bodyLines} lines (min ${BODY_MIN_LINES}); too thin to be a standalone rule`,
    });
  }

  const sections = sectionMap(e.body);
  for (const required of REQUIRED_SECTIONS) {
    if (!sections.has(required)) {
      issues.push({
        filepath: e.filepath,
        message: `missing required section: "## ${required}"`,
      });
    }
  }

  const example = sections.get('Example');
  if (example !== undefined) {
    const trimmed = example.trim();
    if (trimmed === '' || /\bTODO\b/.test(trimmed)) {
      issues.push({
        filepath: e.filepath,
        message: `Example section is empty or contains a TODO placeholder`,
      });
    }
  }

  const bodyNoCode = e.body.replace(FENCED_BLOCK_RE, '');
  for (const phrase of PERSONALITY_PHRASES) {
    const re = new RegExp(`\\b${escapeRegex(phrase)}\\b`, 'i');
    if (re.test(bodyNoCode)) {
      issues.push({
        filepath: e.filepath,
        message: `body contains "${phrase}" — Claude Code already has this at the system level; cut it`,
      });
    }
  }

  return issues;
}

function sectionMap(body: string): Map<string, string> {
  const map = new Map<string, string>();
  const headers: { name: string; start: number; end: number }[] = [];
  for (const m of body.matchAll(H2_RE)) {
    headers.push({ name: m[1], start: m.index! + m[0].length, end: body.length });
  }
  for (let i = 0; i < headers.length; i++) {
    if (i + 1 < headers.length) {
      const next = headers[i + 1]!;
      const nextHeaderStart = body.lastIndexOf('##', next.start);
      headers[i]!.end = nextHeaderStart === -1 ? next.start : nextHeaderStart;
    }
  }
  for (const h of headers) {
    map.set(h.name, body.slice(h.start, h.end));
  }
  return map;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
