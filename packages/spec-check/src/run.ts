/**
 * Runs the Spec Matrix and writes a Markdown report to spec-report/spec-check.md
 */
import { SPEC_ITEMS } from './specMatrix';
import fs from 'node:fs/promises';
import path from 'node:path';

async function main() {
  const started = new Date();
  const results: any[] = [];
  let failures = 0;
  for (const item of SPEC_ITEMS) {
    try {
      const res = await item.check();
      results.push({ ...item, ...res });
      if (!res.pass && item.critical) failures++;
    } catch (e: any) {
      results.push({ ...item, pass: false, notes: `error: ${e?.message || e}` });
      if (item.critical) failures++;
    }
  }

  const dir = path.join(process.cwd(), 'spec-report');
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, 'spec-check.md');

  const okIcon = '✅';
  const noIcon = '❌';

  const lines = [
    `# Velox Spec Check (Localhost)`,
    ``,
    `**Base URL:** ${process.env.SPEC_BASE_URL || 'http://localhost:3000'}`,
    `**Run at:** ${started.toISOString()}`,
    ``,
    `| ID | Title | Critical | Result | Notes |`,
    `| --- | --- | :--: | :--: | --- |`,
    ...results.map(r =>
      `| \`${r.id}\` | ${r.title} | ${r.critical ? 'YES' : 'no'} | ${r.pass ? okIcon : noIcon} | ${r.notes || ''} |`
    ),
    ``,
    failures === 0
      ? `All critical checks passed ${okIcon}`
      : `${failures} critical check(s) failed ${noIcon}. See notes above.`,
    ``
  ];

  await fs.writeFile(file, lines.join('\n'), 'utf-8');
  console.log(`Spec report written to: ${file}`);
  if (failures > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});


