# Accessibility-Prüflauf

Automatisierter Regressionsschutz für die Barrierefreiheit: axe-core läuft über die in
`scenarios.mjs` beschriebenen Zustände der Anwendung — auch über die, die keine eigene URL
haben (offene Dialoge, geladene Zeitreihen, aufgeklappte Sidebar-Overlays).

Was der Lauf **nicht** kann: Tastaturbedienung, Vorlesbarkeit, Kontraste in SVG und Canvas,
Zoom-Verhalten. Automatische Prüfung deckt etwa 30–40 % der Barrieren ab — der Rest bleibt
Handarbeit und ist mit diesem Lauf nicht abgedeckt.

## Voraussetzungen

```bash
npm install
npx playwright install chromium   # einmalig, lädt den Browser (~100 MB)
```

## Aufrufe

```bash
npm run a11y                        # startet selbst einen Dev-Server und prüft alle Szenarien
npm run a11y -- --no-data           # nur Zustände, die keine geladenen Zeitreihen brauchen
npm run a11y -- --base http://localhost:4200   # gegen einen schon laufenden Server
npm run a11y -- --only diagram-view,table-view
npm run a11y -- --update-baseline   # aktuelle Befunde als neue Baseline schreiben
```

Der Lauf endet mit Exit-Code 1, sobald ein Befund auftritt, der nicht in `baseline.json`
steht. Der ausführliche Bericht landet in `report.json` (nicht versioniert).

`--no-data` ist die Variante für CI: die Szenarien mit Zeitreihen laden Daten über die echte
FROST-API, was auf einem Runner ohne Netzzugang nicht funktioniert.

## Verhaltensprüfung des Notifiers

`check-notifier.mjs` steht neben dem axe-Lauf und prüft etwas, das axe nicht sehen kann: dass
Meldungen, die Information tragen, nicht von selbst verschwinden (WCAG 2.2.1, Entscheidung E7).

```bash
npm start                                                  # Server in einem zweiten Terminal
node a11y/check-notifier.mjs --base http://localhost:4200
```

Nicht in `npm run a11y` eingehängt und nicht in CI: der Lauf braucht geladene Zeitreihen über
die echte FROST-API und wartet zwischen den Prüfungen bewusst Sekunden ab, um Ausblendzeiten zu
messen. Er ist das Werkzeug, mit dem sich E7 nachprüfen lässt, kein Gate.

Die wichtige Meldung wird über `daysForOldTimespanCheck` ausgelöst, das der Lauf per
Route-Interception in `app-config.json` einschaltet — im ausgelieferten Stand ist die Option
nicht gesetzt und die Meldung damit unerreichbar.

## Baseline

`baseline.json` listet bekannte, bewusst nicht behobene Befunde mit Begründung und der
Höchstzahl betroffener Knoten je Szenario:

```json
{
  "accepted": {
    "nested-interactive": { "reason": "…", "maxNodes": 6 }
  }
}
```

Ein Eintrag hier ist eine Entscheidung, kein Ablageort: jede Zeile braucht eine Begründung,
die erklärt, warum der Befund offen bleibt.

Der Block oben ist ein Syntaxbeispiel. **Die Baseline ist derzeit leer** (`{ "accepted": {} }`)
— der letzte Eintrag, `nested-interactive` an den Legendeneinträgen, ist mit Entscheidung E5
behoben. Neue Einträge nicht mit `--update-baseline` erzeugen: das Flag akzeptiert
stillschweigend alles, was es gerade findet.

## Szenarien ergänzen

`scenarios.mjs` erweitern:

```js
{
  name: 'mein-zustand',
  title: 'Was man hier sieht',
  path: '/table',
  needsData: true,          // braucht geladene Zeitreihen
  wait: 8000,               // Wartezeit nach dem Laden (Standard 6000)
  disableRules: ['region'], // einzelne axe-Regeln aussetzen, mit Kommentar warum
  setup: async (page) => {  // Klickweg zum Zustand
    await page.locator('…').click();
  },
}
```
