# NVDA-Durchgang — Arbeitsprotokoll

Dieselben Prüfpunkte wie in `ACCESSIBILITY.md` („NVDA-Durchgang (offen)"), aber nach
**Zustand** sortiert statt nach Nummer: jeder Zustandswechsel kostet mit Screenreader Minuten,
die Nummernfolge springt sechsmal zwischen Karte, Liste und Diagramm hin und her. Die Spalte
„#" verweist auf die Nummer im Hauptdokument, damit das Ergebnis zurückgetragen werden kann.

Die Zeilen ohne Nummer sind die Erwartungen aus E2, E3, E5 und E6, die in der Tabelle des
Hauptdokuments noch nicht abgebildet sind.

**Ergebnis** wörtlich eintragen, so wie es im Sprachbetrachter steht — nicht „ok". Der Wortlaut
ist der Beleg, mit dem 1.1.1, 1.3.1, 4.1.2 und 4.1.3 aus dem Vorbehalt herauskommen.

**Modus** meint NVDAs Lesemodus: `B` = Browsemodus, `F` = Fokusmodus. In Eingabefeldern und in
der Karte schaltet NVDA selbsttätig um; das ist kein Befund, wird aber leicht als einer
protokolliert. Die Spalte hält fest, worin geprüft wurde.

## Kopf

| | |
| --- | --- |
| Datum | |
| Prüfer:in | |
| NVDA-Version | |
| Browser + Version | |
| Synthesizer | |
| Basis-URL | |
| Commit | |
| `daysForOldTimespanCheck` | ein / aus |

---

## A — Start und Seitenstruktur (ohne geladene Daten, `/`)

| # | Schritt | Erwartung | Modus | Ergebnis |
| - | ------- | --------- | ----- | -------- |
| 1 | Seite laden | Titel „Kartenauswahl – Messdatenportal Umwelt", Sprache deutsch (keine englische Aussprache) | B | |
| 2 | `D` (Landmarks durchgehen) | „Menü und Datenauswahl", „Hauptbereich", „Werkzeuge und Legende" | B | |
| 3 | `H` / `1` / `2` (Überschriften) | je Ansicht eine Ebene-1-Überschrift mit dem Ansichtsnamen, darunter „Kategorie 1–4" bzw. „Ausgewählte Zeitreihen" | B | |
| 4 | Erste `Tab`-Taste | „Zum Inhalt springen, Link"; `Enter` setzt den Lesecursor in den Hauptbereich | B | |
| 13 | Dialog öffnen (Allgemeine Einstellungen), `Esc` | Dialogname und Überschrift werden vorgelesen, `Esc` schließt, Fokus landet wieder auf dem auslösenden Button | F | |
| 21 | In „Allgemeine Einstellungen" den Knopf „Zurücksetzen und neu laden" auslösen | „Anwendung zurücksetzen?, Dialog", die Folge wird als Beschreibung vorgelesen, der Fokus steht auf „Abbrechen"; `Esc` schließt nur diesen Dialog und gibt den Fokus an den Zurücksetzen-Knopf zurück (E8) | F | |

Schritt 21 zuletzt in diesem Block: bestätigt man versehentlich, ist der geseedete Zustand weg
und muss neu eingespielt werden.

## B — Karte (`/map-selection`)

| # | Schritt | Erwartung | Modus | Ergebnis |
| - | ------- | --------- | ----- | -------- |
| 2 | `D` auf der Karte | zusätzlich zu Block A: „Karte der Messstationen" | B | |
| — | `Tab` bis unmittelbar vor die Karte (E3) | „Karte überspringen, Link" als eigener Tabstop; `Enter` setzt hinter die Karte. Von Schritt 4 nicht abgedeckt | B | |
| 9 | Einen Marker ansteuern und `Enter` | „Station 0111071404, Schalter"; der Dialog öffnet und wird vorgelesen | F | |
| 10 | Ein Cluster ansteuern | „52 Messstationen in diesem Bereich, mit der Eingabetaste vergrößern" | F | |
| 18 | Die Zoom-Buttons ansteuern | „Karte vergrößern, Schalter" und „Karte verkleinern, Schalter" | F | |

## C — Listenauswahl (`/list-selection`)

| # | Schritt | Erwartung | Modus | Ergebnis |
| - | ------- | --------- | ----- | -------- |
| — | Die Stationsliste betreten (E2) | „Liste mit N Einträgen", beim Wandern „Eintrag 3 von N"; **nicht** „nicht ausgewählt" an jeder Station | B | |
| — | In der Liste `Pfeil runter` / `Pos1` / `Ende` (Roving-Tabindex, E2) | Fokus wandert innerhalb der Liste, ein einziger Tabstop führt wieder heraus | F | |
| 11 | Eine Kategorie wählen | „Fließgewässer, Schalter, gedrückt", danach die Statusansage „563 Stationen gefunden" | F | |
| 12 | Ins Suchfeld tippen | Trefferzahl wird angesagt („17 Stationen entsprechen der Suche") | F | |

## D — Diagramm und Legende (geseedeter Zustand, `/`)

Vorher `zustand-snippet.js` einspielen (siehe README).

| # | Schritt | Erwartung | Modus | Ergebnis |
| - | ------- | --------- | ----- | -------- |
| 7 | Die Grafik erreichen | „Grafik: Liniendiagramm mit N Zeitreihen: … Die Messwerte selbst stehen in der Tabellenansicht." | B | |
| 8 | Legendeneintrag ansteuern | „BSB5 - mg/l Fauler Graben - ZALA-2600 - n1007, Schalter, erweitert" — **nicht** zusätzlich „Zeitreihe verbergen Zeitreihe entfernen" (E5) | F | |
| — | Sichtbarkeits-Button ansteuern (E5) | heißt je Zustand „Zeitreihe verbergen" bzw. „Zeitreihe anzeigen" | F | |
| — | Zeitreihe verbergen (E5) | das Panel klappt zu, der Fokus landet auf dessen Kopfzeile | F | |
| — | Zeitreihe ohne Daten im Zeitraum (E6) | der Name der Kopfzeile endet auf „… keine Daten im Zeitraum" | B | |
| 15 | Zeitreihe laden | „Daten werden geladen" wird angesagt | B | |
| 16 | Zeitreihe entfernen | „Zeitreihe entfernt: BSB5 @ Fauler Graben" wird **einmal** vorgelesen (nicht doppelt), Meldung verschwindet nach 5 s | B | |

## E — Tabellenansicht

| # | Schritt | Erwartung | Modus | Ergebnis |
| - | ------- | --------- | ----- | -------- |
| 5 | Zur Tabellenansicht wechseln | „Tabellenansicht" wird angesagt, ohne dass der Fokus springt | B | |
| 6 | Mit `Strg+Alt+Pfeiltasten` navigieren | Spaltenüberschriften werden mitgesprochen („Gewässername", „Datum" …) | B | |

## F — Meldungen

| # | Schritt | Erwartung | Modus | Ergebnis |
| - | ------- | --------- | ----- | -------- |
| 17 | Eine wichtige Meldung auslösen (`set-timespan-check.mjs --days 1`, dann `zustand-alter-zeitraum.js`) | Meldung wird **einmal** vorgelesen und **bleibt stehen**, bis sie geschlossen wird (E7) | B | |
| 20 | Im Zeitraumauswähler nur ein Datum wählen und schließen | „Bitte Anfang und Ende des Zeitraums auswählen — der Zeitraum wurde nicht geändert" wird vorgelesen und bleibt stehen | F | |

Bekannt und kein Befund dieses Durchgangs: der Schließen-Knopf einer stehenden Meldung liegt am
Ende der Tab-Reihenfolge (Protokoll 2026-09-10, „Was offen bleibt").

## G — Favoriten

| # | Schritt | Erwartung | Modus | Ergebnis |
| - | ------- | --------- | ----- | -------- |
| 19 | In der Favoritenliste den Stift und dann das Eingabefeld ansteuern | „Namen ändern, Schalter", dann „Bezeichnung, Eingabefeld"; die beiden Schalter daneben „Änderung verwerfen" und „Namen übernehmen" | F | |

## H — Sprache (zuletzt, stellt die ganze Oberfläche um)

| # | Schritt | Erwartung | Modus | Ergebnis |
| - | ------- | --------- | ----- | -------- |
| 14 | Sprache auf Englisch stellen | Titel wechselt auf „Map selection – …", NVDA schaltet auf englische Aussprache | B | |
| 18 | Zoom-Buttons auf Englisch | „Zoom in on the map" | F | |

Der Sprachwechsel steht auch im NVDA-Log (Protokollierungsstufe „Eingabe/Ausgabe") als
Sprachwechsel-Kommando in der Sprachsequenz — damit ist er ohne Audio belegbar. Taucht er dort
nicht auf, bleibt für diesen einen Schritt der Hörtest mit echtem Synthesizer.

---

## Befunde

Was hier landet, gehört anschließend als eigener Protokolleintrag ins Hauptdokument.

| # | Befund | Kriterium | Schwere | Ort im Code |
| - | ------ | --------- | ------- | ----------- |
| | | | | |
