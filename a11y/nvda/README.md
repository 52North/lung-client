# NVDA-Durchgang

Der Teil der Barrierefreiheitsprüfung, den kein Werkzeug ersetzt: das tatsächliche Vorlesen —
Ansageverhalten, Lesemodus, Redundanz, Tempo. Der strukturelle Teil (Rollen, Namen, Zustände,
Landmarks, Live-Regionen) ist am 2026-09-08 über den berechneten Accessibility-Tree geprüft;
was ein Screenreader damit *macht*, steht noch aus. Siehe im Hauptdokument den Abschnitt
„NVDA-Durchgang (offen)".

Dieser Ordner enthält die Vorbereitung, damit der Durchgang selbst nicht an Einrichtung und
Zustandsherstellung verbraucht wird.

| Datei | wozu |
| ----- | ---- |
| `STAND.md` | Zwischenstand: was gilt, was entschieden ist, wo weiterzumachen ist |
| `checkliste.md` | die 25 Prüfpunkte plus die Zusätze aus E2/E3/E5/E6, nach Zustand sortiert, mit Ergebnisspalte |
| `seed-localstorage.mjs` | stellt den Prüfzustand her und schreibt ihn als Konsolen-Snippet heraus |
| `set-timespan-check.mjs` | schaltet `daysForOldTimespanCheck` ein und aus (Schritt 17) |

## 1. Prüfumgebung

NVDA läuft nur unter Windows; diese Maschine ist Linux. Also eine Windows-VM (KVM/virt-manager,
90-Tage-Evaluierungs-ISO reicht) oder eine Windows-Maschine. Dort:

1. **NVDA** von NV Access installieren, dazu **Firefox**. NVDA+Firefox ist die
   Referenzkombination; Chrome danach als Stichprobe für die Schritte mit Live-Regionen
   (5, 16, 17), deren Ansageverhalten sich zwischen den Browsern unterscheidet.
2. **Werkzeuge → Sprachbetrachter** einschalten. Zeigt jede Ansage als kopierbaren Text — das
   ist die Quelle für die Ergebnisspalte der Checkliste. Ohne ihn wird der Durchgang ein
   Gedächtnisprotokoll.
3. **Einstellungen → Allgemein → Protokollierungsstufe: „Eingabe/Ausgabe"**. Das Log
   (`%TEMP%\nvda.log`, erreichbar über Werkzeuge → Log anzeigen) enthält danach die vollständigen
   Sprachsequenzen einschließlich der Sprachwechsel-Kommandos — damit ist Schritt 14 auch ohne
   Audio belegbar.
4. Wenn die VM keinen Ton hat: **Synthesizer auf „Keine Sprache"** stellen und nur über
   Sprachbetrachter und Log arbeiten. Betroffen ist davon allein die Aussprache in Schritt 1
   und 14; alles andere ist Text.

## 2. Server

Der Dev-Server läuft auf dem Linux-Host, die VM greift über dessen IP zu:

```bash
npm start -- --host 0.0.0.0
```

Blockt der Dev-Server die Anfrage aus der VM („Blocked request"), `--allowed-hosts` mit der
Host-IP nachziehen. Netzzugang zur FROST-API ist nötig — die Erwartungen der Checkliste sind
wörtlich (BSB5, Fauler Graben), der `DummyDatasetsService` liefert nur eine Zufallsreihe und
taugt nicht als Ersatz.

## 3. Prüfzustand einspielen

Die Schritte mit geladenen Zeitreihen (Block D bis G der Checkliste) hängen am Klickweg
Station → Phänomen → Datensätze, rund 18 Sekunden Wartezeit pro Durchlauf. Einmal auf dem Host
herstellen und mitnehmen:

```bash
node a11y/nvda/seed-localstorage.mjs --base http://localhost:4200
```

Schreibt `zustand-snippet.js` (3 Zeitreihen, die ersten beiden als Favorit, die letzte ohne — siehe Block D und G der Checkliste). Den Inhalt in der Konsole des
Prüfbrowsers einfügen, während die Anwendung offen ist — Firefox und Chrome verlangen dafür
einmalig die **getippte** Eingabe `allow pasting`. Die Seite lädt danach selbst neu.

Die Anwendung startet danach auf der Kartenauswahl — die Diagrammansicht mit Legende liegt auf
`/`. Der Zustand lässt sich jederzeit neu einspielen; nach Schritt 21 („Zurücksetzen und neu
laden") ist das nötig.

## 4. Schritt 17 scharf stellen

Die einzige Meldung der Art „wichtig" hängt an einer Option, die im Auslieferungsstand nicht
gesetzt ist:

```bash
node a11y/nvda/set-timespan-check.mjs --days 1   # vor dem Durchgang
node a11y/nvda/set-timespan-check.mjs --off      # danach, zwingend
```

Dazu in der VM `zustand-alter-zeitraum.js` einfügen. Das muss vor jedem Versuch neu geschehen:
die Anwendung verschiebt den zu alten Zeitraum selbst und verbraucht ihn damit
(`graph-datasets.service.ts:265`).

## 5. Durchgang und Protokoll

`checkliste.md` von A nach H abarbeiten, Ergebnisse wörtlich eintragen. Erwartung: rund zwei
Stunden für die Schritte, eine weitere fürs Protokoll.

Danach zurück ins Hauptdokument:

- die Ergebnisspalte in die Tabelle „NVDA-Durchgang" übernehmen und den Abschnitt von „(offen)"
  auf das Durchgangsdatum umstellen,
- einen Protokolleintrag anlegen (Datum, NVDA- und Browserversion, Synthesizer),
- den Vorbehalt über 1.1.1, 1.3.1, 4.1.2 und 4.1.3 auflösen oder durch die gefundenen Befunde
  ersetzen (Abschnitt „Was diese Bewertung nicht leistet"),
- Punkt 1 der Freigabeliste streichen,
- die Erklärung zur Barrierefreiheit nachziehen, falls Befunde dazukommen.

## Generierte Dateien

`zustand.json`, `zustand-snippet.js` und `zustand-alter-zeitraum.js` entstehen beim Seeden und
sind nicht versioniert — sie enthalten Ids einer konkreten Datenlage und veralten mit ihr.
