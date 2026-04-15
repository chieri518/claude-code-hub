#!/usr/bin/env bun
import { resolve } from "node:path";
import { parseHub } from "../compile/parse";
import { checkUrls, formatIssueBody } from "./check";

const HUB_ROOT = resolve(import.meta.dir, "..", "..", "hub", "claude-code");

async function main() {
  const ci = process.argv.includes("--ci");
  const entries = await parseHub(HUB_ROOT);
  const inputs = entries
    .filter((e) => e.status !== "superseded")
    .map((e) => ({ id: e.id, sourceUrl: e.source.url }));

  const results = await checkUrls(inputs);
  const broken = results.filter((r) => !r.ok);

  const today = new Date().toISOString().slice(0, 10);

  if (!ci) {
    console.log(
      `Checked ${results.length} URL(s) across ${entries.length} entries.`,
    );
    if (broken.length === 0) {
      console.log("All links healthy.");
      return;
    }
    console.log(`${broken.length} broken:`);
    for (const b of broken) {
      const status = b.error ? `error: ${b.error}` : `HTTP ${b.status}`;
      console.log(`  ${status} — ${b.url} (entries: ${b.entries.join(", ")})`);
    }
    process.exit(1);
  }

  // CI mode: emit the issue body to stdout; the workflow consumes it.
  const body = formatIssueBody(broken, today);
  console.log(body);
  if (broken.length > 0) {
    process.exit(1);
  }
}

main();
