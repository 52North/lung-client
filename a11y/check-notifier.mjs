/**
 * Behavioural check of the notifier (WCAG 2.2.1) against a running client.
 *   node a11y/check-notifier.mjs --base http://localhost:4400
 */
import { chromium } from 'playwright';
import { seedDatasets } from './scenarios.mjs';

const base = process.argv[process.argv.indexOf('--base') + 1];
const results = [];
const ok = (name, pass, detail = '') => results.push({ name, pass, detail });

const snack = (page) => page.locator('helgoland-notification');
const messages = (page) => snack(page).locator('.message-container .message');

/**
 * Contrast of the dismiss icon against the snack bar surface. axe does not find
 * this: its `color-contrast` rule only covers text, and the icon is a ligature
 * glyph under `aria-hidden` - so it is skipped. Hence measured here.
 */
const iconContrast = (page) =>
  page.evaluate(() => {
    const lum = (c) => {
      const [r, g, b] = c.map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const parse = (v) => (v.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
    const icon = document.querySelector(
      'helgoland-notification .small-clear-button mat-icon',
    );
    const surface = document.querySelector('.mat-mdc-snackbar-surface');
    if (!icon || !surface) return null;
    const [a, b] = [
      lum(parse(getComputedStyle(icon).color)),
      lum(parse(getComputedStyle(surface).backgroundColor)),
    ].sort((x, y) => y - x);
    return +((a + 0.05) / (b + 0.05)).toFixed(2);
  });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1500, height: 950 },
  // section 4 reads back what the share button copied
  permissions: ['clipboard-read', 'clipboard-write'],
});
const page = await ctx.newPage();
// Without an auth server the dev setup produces constant keycloak noise - not our concern.
const IRRELEVANT = /keycloak|403|Failed to load resource|net::ERR/i;
const errors = [];
const collect = (text) => {
  if (!IRRELEVANT.test(text)) errors.push(text);
};
page.on('pageerror', (e) => collect(String(e)));
page.on('console', (m) => {
  if (m.type() === 'error') collect(m.text());
});

// ---------- 1. "important": stays put ----------
// The timespan check is not set in app-config.json, so it is inactive. Turn it
// on for the test and hand it an old timespan.
await page.route('**/app-config.json*', async (route) => {
  const res = await route.fetch();
  const cfg = await res.json();
  cfg.daysForOldTimespanCheck = 1;
  await route.fulfill({ json: cfg });
});
await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
// The cdk LiveAnnouncer reuses one element; without a transcript you only see
// the last announcement (on the first run that was the route title).
await page.addInitScript(() => {
  window.__announced = [];
  // Polled rather than observed: the init script runs before there is a
  // documentElement for a MutationObserver to watch.
  setInterval(() => {
    document.querySelectorAll('.cdk-live-announcer-element').forEach((el) => {
      const text = el.textContent?.trim();
      if (text && !window.__announced.includes(text)) {
        window.__announced.push(text);
      }
    });
  }, 100);
});
const from = Date.UTC(2019, 0, 1);
await page.evaluate((f) => {
  localStorage.setItem(
    'timeseriesTime',
    JSON.stringify({ from: f, to: f + 86400000 }),
  );
}, from);
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(5000);

const importantText = await messages(page)
  .first()
  .textContent()
  .catch(() => null);
ok(
  'wichtige Meldung erscheint',
  !!importantText && /Zeitraum|Daten/i.test(importantText),
  (importantText ?? 'keine Meldung').trim().slice(0, 70),
);
ok(
  'wichtige Meldung hat Warn-Icon',
  (await snack(page).locator('.important-icon').count()) === 1,
);

// WCAG 1.4.11 asks for 3:1. The button originally inherited the
// on-surface-variant color of the light surface and stood at 1.39:1 on the dark one.
const contrast = await iconContrast(page);
ok(
  'Schließen-Icon erreicht 3:1 gegen die Snackbar-Fläche',
  contrast !== null && contrast >= 3,
  `${contrast}:1`,
);

// The text has to sit in the snack bar live region and must no longer hang
// under aria-hidden - otherwise no screen reader gets it.
const region = await page.evaluate(() => {
  const el = [...document.querySelectorAll('helgoland-notification .message')].find(
    (m) => /Zeitraum|keine Daten/i.test(m.textContent ?? ''),
  );
  if (!el) return { found: false };
  return {
    found: true,
    live: el.closest('[aria-live]')?.getAttribute('aria-live') ?? null,
    hidden: !!el.closest('[aria-hidden="true"]'),
  };
});
ok(
  'wichtige Meldung liegt in der Live-Region',
  region.found && region.live === 'polite' && !region.hidden,
  `aria-live="${region.live}", aria-hidden=${region.hidden}`,
);

// The cdk LiveAnnouncer must NOT carry the message as well, or it doubles up.
const announced = await page.evaluate(() => window.__announced ?? []);
ok(
  'keine zweite Ansage über den CDK-LiveAnnouncer',
  announced.filter((t) => /Zeitraum|keine Daten/i.test(t)).length === 0,
  `Mitschrift: ${announced.map((t) => t.slice(0, 24)).join(' | ') || '(leer)'}`,
);

// 12 s - well past the old 8 s timeout this message used to have
await page.waitForTimeout(12000);
const stillThere = await messages(page).count();
ok(
  'wichtige Meldung bleibt nach 17 s stehen',
  stillThere === 1,
  `${stillThere} Meldung(en)`,
);

await snack(page).locator('button').first().click();
await page.waitForTimeout(1500);
ok('Schließen-Button schließt die Snackbar', (await snack(page).count()) === 0);

// ---------- 2. "confirmation": fades out ----------
await page.unroute('**/app-config.json*');
await page.evaluate(() => localStorage.clear());
await seedDatasets(page, base, 2);
await page.waitForTimeout(3000);

const remove = page.locator('button.remove-entry');
await remove.first().waitFor({ state: 'attached', timeout: 20000 });
await remove.first().click();
await page.waitForTimeout(800);
ok(
  'Bestätigung erscheint',
  (await messages(page).count()) >= 1,
  (await messages(page).first().textContent().catch(() => '')).trim().slice(0, 70),
);
ok(
  'Bestätigung ohne Warn-Icon',
  (await snack(page).locator('.important-icon').count()) === 0,
);
const shownText = (
  await messages(page).first().textContent().catch(() => '')
).trim();
ok(
  'Bestätigung nennt Label statt interner URL',
  shownText.length > 0 && !/https?:\/\//.test(shownText),
  shownText.slice(0, 70),
);
const confirmRegion = await page.evaluate(() => {
  const el = document.querySelector('helgoland-notification .message');
  if (!el) return { found: false };
  return {
    found: true,
    live: el.closest('[aria-live]')?.getAttribute('aria-live') ?? null,
    hidden: !!el.closest('[aria-hidden="true"]'),
  };
});
ok(
  'Bestätigung liegt in der Live-Region',
  confirmRegion.found && confirmRegion.live === 'polite' && !confirmRegion.hidden,
  `aria-live="${confirmRegion.live}", aria-hidden=${confirmRegion.hidden}`,
);
const confirmAnnounced = (
  await page.evaluate(() => window.__announced ?? [])
).filter((t) => /entfernt/i.test(t));
ok(
  'keine zweite Ansage der Bestätigung',
  confirmAnnounced.length === 0,
  `${confirmAnnounced.length}× über LiveAnnouncer`,
);
await page.waitForTimeout(2200);
ok(
  'Bestätigung nach 3 s noch sichtbar (alte Dauer war 2 s)',
  (await messages(page).count()) >= 1,
);
await page.waitForTimeout(4000);
ok(
  'Bestätigung nach 7 s ausgeblendet',
  (await snack(page).count()) === 0,
  `${await messages(page).count()} Meldung(en)`,
);

// ---------- 3. identical messages ----------
// The same message twice in quick succession: with `track message` that would
// have produced duplicate keys.
const remaining = await page.locator('button.remove-entry').count();
if (remaining > 0) {
  await page.locator('button.remove-entry').first().click();
  await page.waitForTimeout(200);
}
await page.waitForTimeout(1500);

// ---------- 4. share button ----------
// It ran its own snack bar for 2 s plus a LiveAnnouncer call - the pattern E7
// removed everywhere else, missed there because it never called notify().
await page.goto(base + '/list-selection', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(7000);
await snack(page).waitFor({ state: 'detached' }).catch(() => {});
const share = page.getByRole('button', {
  name: /Listenauswahl teilen|Share list selection/,
});
await share.click();
await page.waitForTimeout(800);
const shareText = (
  await messages(page).first().textContent().catch(() => '')
).trim();
ok(
  'Teilen-Bestätigung läuft über den Notifier',
  /Zwischenablage|clipboard/i.test(shareText),
  shareText.slice(0, 70),
);
const copied = await page.evaluate(() => navigator.clipboard.readText());
ok(
  'Teilen kopiert den Link',
  copied.includes('/list-selection'),
  copied.slice(0, 70),
);
const shareAnnounced = (
  await page.evaluate(() => window.__announced ?? [])
).filter((t) => /Zwischenablage|clipboard|Sharelink/i.test(t));
ok(
  'keine zweite Ansage der Teilen-Meldung',
  shareAnnounced.length === 0,
  `${shareAnnounced.length}× über LiveAnnouncer`,
);
await page.waitForTimeout(2200);
ok(
  'Teilen-Bestätigung nach 3 s noch sichtbar (alte Dauer war 2 s)',
  (await messages(page).count()) >= 1,
);
await page.waitForTimeout(4000);
ok(
  'Teilen-Bestätigung nach 7 s ausgeblendet',
  (await snack(page).count()) === 0,
);

// The failure is the message that carries information: without it nobody
// learns that the clipboard still holds something else.
await page.evaluate(() => {
  document.execCommand = () => false;
});
await share.click();
await page.waitForTimeout(800);
ok(
  'Teilen-Fehler erscheint als wichtige Meldung',
  (await snack(page).locator('.important-icon').count()) === 1,
  (await messages(page).first().textContent().catch(() => '')).trim().slice(0, 70),
);
await page.waitForTimeout(7000);
ok(
  'Teilen-Fehler bleibt nach 8 s stehen',
  (await messages(page).count()) === 1,
);
// conditional, so a missing message shows up as failed checks, not a timeout
const leftover = snack(page).locator('button');
if (await leftover.count()) {
  await leftover.first().click();
  await page.waitForTimeout(1000);
}

ok(
  'keine Konsolenfehler (u. a. doppelte @for-Keys)',
  errors.length === 0,
  errors.slice(0, 2).join(' | ').slice(0, 160),
);

await browser.close();

let failed = 0;
for (const r of results) {
  if (!r.pass) failed++;
  console.log(`${r.pass ? '✓' : '✗'} ${r.name}${r.detail ? `  — ${r.detail}` : ''}`);
}
console.log(`\n${results.length - failed}/${results.length} Prüfungen bestanden`);
process.exit(failed ? 1 : 0);
