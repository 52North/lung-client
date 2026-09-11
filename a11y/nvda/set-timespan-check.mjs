#!/usr/bin/env node
/**
 * Schaltet `daysForOldTimespanCheck` in `src/assets/app-config.json` ein und
 * wieder aus.
 *
 * Schritt 17 des Durchgangs prüft die einzige Meldung der Art „wichtig": sie
 * muss einmal vorgelesen werden und stehen bleiben (E7). Ausgeliefert ist die
 * Option nicht gesetzt, die Meldung also unerreichbar. `check-notifier.mjs`
 * schiebt sie per Route-Interception unter - im echten Browser der Prüf-VM
 * geht das nicht, dort muss sie in der Datei stehen.
 *
 *   node a11y/nvda/set-timespan-check.mjs --days 1   # einschalten
 *   node a11y/nvda/set-timespan-check.mjs --off      # wieder entfernen
 *   node a11y/nvda/set-timespan-check.mjs            # Stand anzeigen
 *
 * Die Datei ist versioniert: `git diff src/assets/app-config.json` zeigt, ob
 * die Änderung noch drin steht, `git checkout` nimmt sie zurück.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(HERE, '../../src/assets/app-config.json');
const KEY = 'daysForOldTimespanCheck';

const argv = process.argv.slice(2);
const index = argv.indexOf('--days');
const days = index >= 0 && argv[index + 1] ? Number(argv[index + 1]) : null;
const off = argv.includes('--off');

const raw = fs.readFileSync(FILE, 'utf8');
const config = JSON.parse(raw);

if (!off && days === null) {
  console.log(
    KEY in config
      ? `${KEY} steht auf ${config[KEY]} - die wichtige Meldung ist erreichbar.`
      : `${KEY} ist nicht gesetzt - die wichtige Meldung ist unerreichbar.`,
  );
  process.exit(0);
}

if (!off && !Number.isFinite(days)) {
  console.error('--days braucht eine Zahl.');
  process.exit(1);
}

// Als Text bearbeitet statt neu serialisiert: die Datei hat an einer Stelle
// eine abweichende Einrückung, die ein `JSON.stringify` stillschweigend
// glattziehen würde. Der Diff soll die eine Zeile zeigen, sonst nichts.
const present = new RegExp(`,?\\n[ \\t]*"${KEY}"[^,\\n}]*`);
const indent = raw.match(/\n([ \t]+)"/)?.[1] ?? '    ';
const line = `,\n${indent}"${KEY}": ${days}`;

let next;
if (off) {
  next = raw.replace(present, '');
} else if (present.test(raw)) {
  next = raw.replace(present, line);
} else {
  const close = raw.lastIndexOf('\n}');
  next = raw.slice(0, close) + line + raw.slice(close);
}

// Lieber hier scheitern als mit kaputter Konfiguration in die VM gehen.
JSON.parse(next);
fs.writeFileSync(FILE, next);

console.log(
  off
    ? `${KEY} entfernt - Auslieferungsstand wiederhergestellt.`
    : `${KEY} auf ${days} gesetzt. Nach dem Durchgang mit --off zurücknehmen.`,
);
