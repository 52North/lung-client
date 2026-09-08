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
