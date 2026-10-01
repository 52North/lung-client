# Zwischenstand NVDA-Durchgang

Stand **2026-10-01**, Branch `feature/nex-gen`. Zweck dieser Datei: nach einer Unterbrechung
ohne erneutes Einlesen weiterarbeiten können.

**Kurz: vorbereitet, nicht durchgeführt.** Der Durchgang selbst braucht Windows und hat noch
nicht stattgefunden. Was fehlt, ist keine Entscheidung mehr, sondern eine Maschine und zwei bis
drei Stunden.

## Warum der Punkt überhaupt offen ist

Am 2026-09-08 (Phase 3, Block 4) wurde der **berechnete Accessibility-Tree** geprüft — über
`ariaSnapshot()`, also über die berechneten Namen, nicht über `textContent`. Das deckt Rollen,
Namen, Zustände, Überschriften, Landmarks und Live-Regionen ab, also das, was ein Screenreader
*bekommt*. Nicht abgedeckt ist, was er daraus *macht*: Ansagereihenfolge, Lesemodus, Redundanz,
Tempo, Doppelansagen.

NVDA und VoiceOver laufen auf dieser Maschine nicht (Linux). Orca ist installiert und es gibt
eine echte X11-Sitzung (`DISPLAY=:1`) mit Firefox — im Protokoll vom 2026-09-08 war Orca
verworfen worden, weil dort nur ein headless-Chromium zur Verfügung stand. Gegen einen echten
Firefox ist Orca ein brauchbarer **Vorlauf**, kein Ersatz: er findet die Klasse von Befunden,
die hier am wahrscheinlichsten noch steckt (Doppelansagen von Live-Regionen in den Schritten 16
und 17, Redundanz in Schritt 8), spricht aber anders als NVDA und taugt nicht als Beleg.

## Was der Durchgang entscheidet

- Die vier Kriterien, die heute unter Vorbehalt stehen: **1.1.1, 1.3.1, 4.1.2, 4.1.3**
  (Hauptdokument, „Was diese Bewertung nicht leistet"). Sie sind über den
  Accessibility-Tree belegt, nicht über die Ansage.
- **Punkt 1 der Freigabeliste** — nach der Umsetzung vom 2026-09-10 der einzige verbliebene
  Punkt, der echte Arbeit bedeutet.

Nicht Teil davon, davon unabhängig offen: der Menüpunkt **„Hilfe"** mit `href="#"` (2.4.4, bewusst zurückgestellt).

Nachtrag 2026-10-01: mit der Teilen-Funktion sind die Schritte 22 und 23 dazugekommen
(`checkliste.md`, Blöcke B und C), am selben Tag die Schritte 24 und 25 (Blöcke G und D).
Dafür seedet `seed-localstorage.mjs` jetzt drei Zeitreihen mit zwei Favoriten: Schritt 24
braucht einen zweiten Favoriten, um den Fokus auf dem nächsten Löschen-Knopf zu prüfen, und
Schritt 25 eine Zeitreihe ohne Stern — mit nur einem, schon gesetzten Favoriten hätte der
Knopf mit „Aus Favoriten entfernen" begonnen und die Erwartung umgedreht.

## Orca-Vorlauf (2026-10-01)

Gelaufen für die Schritte 8, 16, 17 und 22 gegen Playwrights Firefox auf `DISPLAY=:1`, Orca 46.1,
gesteuert über Playwright statt über Tasten. Ergebnis: 16, 17 und 22 je **eine** Ansage, die
wichtige Meldung bleibt stehen. Drei Befunde, eingetragen unter „Zurückgestellt" im
Hauptdokument: Fokusverlust nach „Zeitreihe entfernen" (behoben), doppelte „keine
Daten"-Warnung in Schritt 8 und die Ansage „Zeitraum geändert" bei jedem Laden (behoben). Offen
für NVDA bleibt davon allein die doppelte Warnung.

Zwei Fallen, falls jemand das wiederholt — beide ergeben scheinbar „keine Ansage", die nichts mit
der App zu tun hat:

- **Orca stumm schalten, nicht Sprache aus.** Mit `enableSpeech: false` gibt Orca Live-Regionen
  gar nicht aus (`presentMessage` prüft die Einstellung), Fokuswechsel aber schon. Stumm wird es,
  wenn die Sprache an bleibt und nur der Sprachserver fehlt: `orca.speech._initSpeechServer`
  vor dem Start durch eine leere Funktion ersetzen. Jede Ansage steht dann als
  `SPEECH OUTPUT` im Debug-Log (`--debug-file`).
- **Das Testfenster muss das aktive sein.** Orca verwirft Ereignisse anderer Anwendungen („not
  from active app"). Playwrights `bringToFront()` wechselt nur den Tab; das Fenster selbst ließ
  sich über libwnck aktivieren (`Wnck.Window.activate`), im Lauf jede Sekunde neu.

Das Debug-Log enthält alles, was auf dem Desktop passiert, also auch fremde Fenster — nach der
Auswertung löschen.

## Entscheidung: manuell, nicht automatisiert

Erwogen war `guidepup` (+ `@guidepup/playwright`), das NVDA fernsteuert und Ansagen als Strings
zurückgibt — technisch anschlussfähig an die vorhandene Playwright-Basis in `a11y/`. Dagegen:
es braucht trotzdem Windows, dazu einen Windows-Runner und ein NVDA-Add-on, und es prüft
Textgleichheit, nicht Lesefluss und Redundanz — also genau das nicht, wofür dieser Punkt steht.

Sinnvoll wird es erst als **zweiter Schritt**, wenn die Ansagen dauerhaft gegen Regressionen
abgesichert werden sollen. Dann sind die im Durchgang protokollierten Wortlaute die Soll-Werte.
Solange das nicht ansteht, ist der manuelle Durchgang mit Sprachbetrachter das Mittel.

Ersatz, falls keine Windows-Maschine beschaffbar ist: Assistiv Labs (NVDA auf Windows im
Browser, kostenpflichtig, tageweise) — spart das VM-Aufsetzen, kostet die Kontrolle über
Synthesizer und Log.

## Bei der Vorbereitung geprüft

- **Der Zustand ist transportabel.** Zeitreihen und Favoriten liegen in `localStorage`:
  `dataset-order` (`storage-service.service.ts:4`), `timeseries-state` und
  `timeseries-favorites` (`timeseries-service.service.ts:38` und `:39`), `timeseriesTime`
  (`graph-datasets.service.ts:20`), `client-language` (`main.ts:97`). Deshalb kann der Klickweg
  auf dem Host laufen und nur das Ergebnis in die VM wandern. Am 2026-09-11 hin und zurück
  geprüft: aus einem frischen Browserprofil stellt das Snippet zwei Legendeneinträge und einen
  Favoriten wieder her.
- **Der `DummyDatasetsService` taugt nicht als Datenersatz.** Er liefert eine Zufallsreihe
  („Zahlen zwischne 0 und 10", `dummy-datasets.service.ts:82`); die Erwartungen der Checkliste
  sind wörtlich (BSB5, Fauler Graben). Der Durchgang braucht die echte FROST-API, also
  Netzzugang aus der VM.
- **Schritt 17 ist ohne Eingriff unerreichbar.** `daysForOldTimespanCheck` steht nicht in
  `app-config.json`; `validateTimespan` (`graph-datasets.service.ts:265`) prüft nur, wenn der
  Wert gesetzt ist. `check-notifier.mjs` schiebt ihn per Route-Interception unter — im echten
  Browser geht das nicht, dafür gibt es jetzt `set-timespan-check.mjs`.
- **`app-config.json` verträgt keine Neuserialisierung.** Die Datei endet ohne Zeilenumbruch und
  hat im `keycloak.config`-Block eine abweichende Einrückung (drei statt vier Leerzeichen). Ein
  `JSON.stringify` zieht das glatt und bläht den Diff auf. Das Skript bearbeitet den Text und
  hält den Diff einzeilig; Hin- und Rückweg sind geprüft.
- **Konsolen-Einfügeschutz.** Firefox und Chrome nehmen eingefügten Code erst an, wenn einmal
  `allow pasting` getippt wurde. Ohne das Wissen wirkt das Snippet kaputt.

## Vorbehalte gegen die Checkliste selbst

Die Erwartungen in den Schritten 9, 10, 11 und 12 nennen konkrete Zahlen und Ids (Station
`0111071404`, „52 Messstationen", „563 Stationen gefunden", „17 Stationen entsprechen der
Suche"). Die stammen aus dem Datenstand, an dem sie notiert wurden. Beim Durchgang zählt die
**Form** der Ansage, nicht die Zahl — abweichende Zahlen sind kein Befund.

## Wiedereinstieg

1. `README.md` in diesem Ordner, Abschnitt 1 bis 4: VM, Server, Zustand, Schritt 17.
2. Optional vorab auf dieser Maschine: Orca gegen Firefox, nur Schritte 8, 16, 17. Was dort
   auffällt, vor der VM beheben.
3. `checkliste.md` von A nach H, Ergebnisse wörtlich aus dem Sprachbetrachter.
4. Rücktragen ins Hauptdokument — die fünf Stellen stehen in `README.md`, Abschnitt 5.
5. `node a11y/nvda/set-timespan-check.mjs --off` nicht vergessen.

## Noch zu entscheiden

- Wer stellt die Windows-Maschine, und wird sie einmalig gebraucht oder dauerhaft gehalten
  (letzteres nur sinnvoll, wenn die Automatisierung später doch kommt).
- Ob die Chrome-Stichprobe für die Live-Regionen wirklich gefahren wird oder Firefox allein
  reicht. Für die Erklärung reicht Firefox; für die Nutzenden nicht unbedingt.
- Ob der Durchgang ein eigener Protokolleintrag wird oder die bestehende Tabelle nur eine
  Ergebnisspalte bekommt. Vorschlag: beides — Tabelle für den Befundstand, Protokolleintrag für
  Umstände und Versionen.
