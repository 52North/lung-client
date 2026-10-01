#!/usr/bin/env node
/**
 * Stellt den Prüfzustand für den NVDA-Durchgang her und schreibt ihn als
 * Konsolen-Snippet heraus.
 *
 * Hintergrund: die Schritte mit geladenen Zeitreihen brauchen den Klickweg aus
 * `scenarios.mjs` (Station -> Phänomen -> Datensätze, ~18 s Wartezeiten). Mit
 * einem Screenreader ist das jedes Mal eine Viertelstunde. Zeitreihen und
 * Favoriten liegen aber in `localStorage` (`storage-service.service.ts:15`,
 * `timeseries-service.service.ts:337`) - also einmal hier seeden, auslesen und
 * im Prüfbrowser einfügen.
 *
 *   node a11y/nvda/seed-localstorage.mjs                      # gegen localhost:4200
 *   node a11y/nvda/seed-localstorage.mjs --base http://…      # anderer Server
 *   node a11y/nvda/seed-localstorage.mjs --count 4            # mehr Zeitreihen
 *   node a11y/nvda/seed-localstorage.mjs --headed             # zum Zusehen
 *
 * Braucht einen laufenden Dev-Server mit Netzzugang zur FROST-API - die
 * gespeicherten Ids verweisen auf deren Url, ohne Backend bleibt der Zustand
 * leer.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

import { seedDatasets } from '../scenarios.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const option = (name, fallback) => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 && argv[index + 1] ? argv[index + 1] : fallback;
};
const flag = (name) => argv.includes(`--${name}`);

const base = option('base', 'http://localhost:4200').replace(/\/$/, '');
const count = Number(option('count', '3'));
// Zwei Favoriten, damit Schritt 24 nach dem Löschen den Fokus auf dem nächsten
// Löschen-Knopf prüfen kann und für Schritt 19 noch einer übrig bleibt. Die
// letzte Zeitreihe bleibt ohne Stern: Schritt 25 braucht einen Knopf, der mit
// „Zu Favoriten hinzufügen" beginnt.
const favoriteCount = Math.min(2, count - 1);
const today = new Date().toISOString().slice(0, 10);

const browser = await chromium.launch({ headless: !flag('headed') });
const ctx = await browser.newContext({
  viewport: { width: 1500, height: 950 },
});
const page = await ctx.newPage();

console.log(`Seeding gegen ${base} …`);
await seedDatasets(page, base, count);

// Die Diagrammansicht ist der Zustand, aus dem heraus sich ein Favorit anlegen
// lässt - der Knopf sitzt in der rechten Sidebar, nicht in der Auswahl.
await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(8000);

// Der Name wechselt beim Klick auf „Aus Favoriten entfernen", also trifft
// `.first()` jedes Mal den nächsten Eintrag ohne Stern.
const favoriteButton = page
  .locator('button[aria-label="Zu Favoriten hinzufügen"]')
  .first();
let favorites = 0;
while (favorites < favoriteCount && (await favoriteButton.count())) {
  await favoriteButton.click();
  await page.waitForTimeout(2000);
  favorites++;
}
if (favorites < favoriteCount) {
  console.warn(
    `Nur ${favorites} von ${favoriteCount} Favoriten angelegt - Schritt 24 ` +
      'braucht zwei, Schritt 19 einen; die fehlenden von Hand anlegen.',
  );
}
const unstarred = await favoriteButton.count();
if (!unstarred) {
  console.warn(
    'Keine Zeitreihe ohne Stern übrig - Schritt 25 beginnt dann mit ' +
      '„Aus Favoriten entfernen". Mit --count 3 oder mehr seeden.',
  );
}

const state = await page.evaluate(() =>
  Object.fromEntries(Object.entries(window.localStorage)),
);
await browser.close();

const keys = Object.keys(state);
if (!keys.length) {
  console.error('localStorage ist leer - lief der Server ohne Zugang zur API?');
  process.exit(1);
}

const header = [
  '// Prüfzustand für den NVDA-Durchgang.',
  `// erzeugt am ${today} gegen ${base}: ${count} Zeitreihen, ` +
    `davon ${favorites} als Favorit.`,
  '//',
  '// In die Konsole des Prüfbrowsers einfügen, während die Anwendung offen ist.',
  '// Firefox und Chrome verlangen dafür einmalig die getippte Eingabe:',
  '//   allow pasting',
  '// Die Seite lädt danach selbst neu. localStorage wird vorher geleert.',
].join('\n');

const snippet = `${header}
(() => {
  const state = ${JSON.stringify(state, null, 2)};
  localStorage.clear();
  for (const [key, value] of Object.entries(state)) {
    localStorage.setItem(key, value);
  }
  location.reload();
})();
`;

// Schritt 17 braucht zusätzlich einen Zeitraum, der älter ist als
// `daysForOldTimespanCheck` - siehe `graph-datasets.service.ts:265`. Getrennt,
// weil die Anwendung den Zeitraum daraufhin selbst verschiebt: der Wert ist
// nach einem Ladevorgang verbraucht und muss vor jedem Versuch neu gesetzt
// werden.
const from = Date.UTC(2019, 0, 1);
const oldTimespan = `// Schritt 17: alten Zeitraum setzen, damit die wichtige Meldung erscheint.
// Wirkt nur, wenn \`daysForOldTimespanCheck\` gesetzt ist:
//   node a11y/nvda/set-timespan-check.mjs --days 1
// Vor jedem Versuch neu einfügen - die Anwendung verschiebt den Zeitraum selbst.
(() => {
  localStorage.setItem(
    'timeseriesTime',
    JSON.stringify({ from: ${from}, to: ${from + 86400000} }),
  );
  location.reload();
})();
`;

fs.writeFileSync(
  path.join(HERE, 'zustand.json'),
  JSON.stringify(state, null, 2) + '\n',
);
fs.writeFileSync(path.join(HERE, 'zustand-snippet.js'), snippet);
fs.writeFileSync(path.join(HERE, 'zustand-alter-zeitraum.js'), oldTimespan);

console.log(`\n${keys.length} Schlüssel gesichert: ${keys.join(', ')}`);
console.log('geschrieben:');
console.log('  a11y/nvda/zustand.json                 (zum Nachsehen)');
console.log('  a11y/nvda/zustand-snippet.js           (in die Konsole der VM)');
console.log('  a11y/nvda/zustand-alter-zeitraum.js    (für Schritt 17)');
