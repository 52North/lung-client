#!/usr/bin/env node
/**
 * Accessibility regression check.
 *
 * Runs axe-core against the states listed in `scenarios.mjs` - including the
 * ones no url can reach on its own (open dialogs, loaded timeseries). Findings
 * that are known and accepted are listed in `baseline.json`; everything else
 * makes the run fail.
 *
 *   node a11y/run.mjs                     # boots its own dev server
 *   node a11y/run.mjs --base http://…     # uses a server that already runs
 *   node a11y/run.mjs --no-data           # only states that need no timeseries
 *   node a11y/run.mjs --only diagram-view,table-view
 *   node a11y/run.mjs --update-baseline   # writes the current findings as baseline
 */
import AxeBuilder from '@axe-core/playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { SCENARIOS, seedDatasets } from './scenarios.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22aa',
  'best-practice',
];
const VIEWPORT = { width: 1500, height: 950 };

const argv = process.argv.slice(2);
const option = (name, fallback = null) => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 && argv[index + 1] ? argv[index + 1] : fallback;
};
const flag = (name) => argv.includes(`--${name}`);

const baseUrl = option('base');
const port = Number(option('port', '4400'));
const only = option('only');
const noData = flag('no-data');
const updateBaseline = flag('update-baseline');

const baselinePath = path.join(HERE, 'baseline.json');
const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));

async function waitForServer(url, timeoutMs = 180000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (res.ok) return true;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  return false;
}

async function startDevServer() {
  const bin = path.join(HERE, '..', 'node_modules', '.bin', 'ng');
  const child = spawn(bin, ['serve', '--port', String(port)], {
    cwd: path.join(HERE, '..'),
    stdio: ['ignore', 'pipe', 'pipe'],
    // own process group, so the whole server tree can be shut down at the end
    detached: true,
  });
  child.stdout.on('data', () => {});
  child.stderr.on('data', (data) => process.stderr.write(data));
  const url = `http://localhost:${port}`;
  process.stdout.write(`Dev-Server wird gestartet (${url}) …\n`);
  if (!(await waitForServer(url))) {
    child.kill('SIGTERM');
    throw new Error('Dev-Server ist nicht hochgekommen');
  }
  const stop = () => {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      child.kill('SIGTERM');
    }
  };
  return { url, stop };
}

function summarize(violations) {
  return violations.map((violation) => ({
    rule: violation.id,
    impact: violation.impact,
    help: violation.help,
    nodes: violation.nodes.length,
    targets: violation.nodes.slice(0, 5).map((node) => node.target.join(' ')),
  }));
}

const server = baseUrl
  ? { url: baseUrl, stop: () => {} }
  : await startDevServer();
let browser;
try {
  browser = await chromium.launch();
} catch (error) {
  server.stop();
  process.stderr.write(
    'Chromium konnte nicht gestartet werden. Fehlt der Browser, hilft:\n' +
      `  npx playwright install chromium\n\n${error.message || error}\n`,
  );
  process.exit(2);
}
const context = await browser.newContext({
  viewport: VIEWPORT,
  locale: 'de-DE',
});
const page = await context.newPage();

const wanted = SCENARIOS.filter((scenario) => {
  if (only && !only.split(',').includes(scenario.name)) return false;
  if (noData && scenario.needsData) return false;
  return true;
});
const needsSeed = wanted.some((scenario) => scenario.needsData);

const results = [];
let failures = 0;

try {
  if (needsSeed) {
    process.stdout.write(
      'Zwei Zeitreihen werden über die Oberfläche geladen …\n',
    );
    await seedDatasets(page, server.url);
  }

  for (const scenario of wanted) {
    process.stdout.write(`\n▸ ${scenario.name} — ${scenario.title}\n`);
    try {
      // set every time, so a scenario with its own size does not leak into the next
      await page.setViewportSize(scenario.viewport ?? VIEWPORT);
      await page.goto(server.url + scenario.path, {
        waitUntil: 'domcontentloaded',
      });
      await page.waitForTimeout(scenario.wait ?? 6000);
      if (scenario.setup) await scenario.setup(page);
      let axe = new AxeBuilder({ page }).withTags(TAGS);
      if (scenario.disableRules) axe = axe.disableRules(scenario.disableRules);
      const axeResult = await axe.analyze();
      const found = summarize(axeResult.violations);
      results.push({
        scenario: scenario.name,
        url: page.url(),
        violations: found,
      });

      for (const violation of found) {
        const accepted = baseline.accepted[violation.rule];
        if (accepted && violation.nodes <= accepted.maxNodes) {
          process.stdout.write(
            `  · ${violation.rule} ×${violation.nodes} (bekannt: ${accepted.reason})\n`,
          );
          continue;
        }
        failures++;
        const limit = accepted
          ? ` — mehr als die erlaubten ${accepted.maxNodes} Knoten`
          : '';
        process.stdout.write(
          `  ✖ [${violation.impact}] ${violation.rule} ×${violation.nodes}${limit}\n` +
            `      ${violation.help}\n` +
            `      ${violation.targets.join('\n      ')}\n`,
        );
      }
      if (!found.length) process.stdout.write('  ✓ keine Verstöße\n');
    } catch (error) {
      failures++;
      results.push({
        scenario: scenario.name,
        error: String(error.message || error),
      });
      process.stdout.write(
        `  ✖ Szenario nicht prüfbar: ${error.message || error}\n`,
      );
    }
  }
} finally {
  await browser.close();
  server.stop();
}

fs.writeFileSync(
  path.join(HERE, 'report.json'),
  JSON.stringify({ ranAt: new Date().toISOString(), noData, results }, null, 2),
);

if (updateBaseline) {
  const accepted = {};
  for (const result of results) {
    for (const violation of result.violations ?? []) {
      const current = accepted[violation.rule];
      accepted[violation.rule] = {
        reason:
          baseline.accepted[violation.rule]?.reason ??
          'TODO: begründen oder beheben',
        maxNodes: Math.max(current?.maxNodes ?? 0, violation.nodes),
      };
    }
  }
  fs.writeFileSync(baselinePath, JSON.stringify({ accepted }, null, 2) + '\n');
  process.stdout.write('\nbaseline.json aktualisiert\n');
  process.exit(0);
}

process.stdout.write(
  `\n${wanted.length} Szenarien geprüft, ${failures} neue Befunde. Bericht: a11y/report.json\n`,
);
process.exit(failures ? 1 : 0);
