# Erklärung zur Barrierefreiheit — Entwurf

> **Dies ist ein Entwurf, keine veröffentlichte Erklärung.**
>
> Die Erklärung gehört nicht in dieses Repository. Die Anwendung verlinkt sie auf dem Portal
> (`left-sidebar-content.component.html:158` →
> `https://umweltportal.mv-regierung.de/portale/impressum.html#barrierefrei`). Dieser Text ist
> das, was dort einzuarbeiten ist.
>
> **Vor der Veröffentlichung zu klären** — zwei Punkte, die hier nicht entschieden werden
> können:
>
> 1. **Die vorhandene Erklärung gilt fürs ganze Portal, dieser Entwurf nur für diese
>    Anwendung.** Auf `impressum.html#barrierefrei` steht, abgerufen am 02.10.2026: „Diese
>    Webseiten sind mit den Vorgaben der harmonisierten europäischen Norm EN 301 549 V2.1.2
>    (08-2018) nicht vereinbar", erstellt am 23.09.2020, letzte Überprüfung am 29.09.2020, als
>    nicht barrierefreier Inhalt ist „Komplette Webseite" genannt. Wer diesen Entwurf
>    einarbeitet, muss entscheiden, ob die Anwendung einen eigenen Abschnitt bekommt oder eine
>    eigene Erklärungsseite. Der Portal-Befund von 2020 wird durch die Arbeit an dieser
>    Anwendung **nicht** ausgeräumt.
> 2. **Die öffentliche Adresse der Anwendung** ist unten als `[URL DER ANWENDUNG]` markiert.
>    Aus der Konfiguration lässt sich nur der API-Pfad `.../mdpu/FROST-Server/v1.1/` ableiten,
>    nicht die Adresse der Oberfläche.
>
> Grundlage ist eine Selbstbewertung über alle 50 Erfolgskriterien der Stufen A und AA der
> WCAG 2.1: 39 erfüllt, 10 nicht anwendbar, 1 nicht erfüllt (2.4.4). Die Kriterien, die von der
> Ansage abhängen (1.1.1, 1.3.1, 4.1.2, 4.1.3), sind zusätzlich mit dem Screenreader NVDA
> geprüft. Der automatisierte Prüflauf liegt in `a11y/`.

---

## Erklärung zur Barrierefreiheit

Das Landesamt für Umwelt, Naturschutz und Geologie Mecklenburg-Vorpommern ist bemüht, seine
Webanwendungen barrierefrei zugänglich zu machen. Maßgeblich ist die harmonisierte europäische
Norm EN 301 549 — [RECHTSGRUNDLAGE DES LANDES ERGÄNZEN].

Diese Erklärung zur Barrierefreiheit gilt für das **Messdatenportal Umwelt** unter
`[URL DER ANWENDUNG]`.

### Stand der Vereinbarkeit mit den Anforderungen

Diese Anwendung ist mit der harmonisierten europäischen Norm EN 301 549 **teilweise
vereinbar**. Die Unvereinbarkeiten sind unten aufgeführt.

Der Prüfumfang war die Stufe AA der WCAG 2.1. Geprüft wurden die vier Ansichten
(Diagrammansicht, Tabellenansicht, Kartenauswahl, Listenauswahl), elf Dialoge und Overlays
sowie beide Seitenleisten, jeweils in deutscher und englischer Sprache.

### Nicht barrierefreie Inhalte

**1. Karte und Diagramm sind für Screenreader nicht vollständig bedienbar.**

Die Kartenauswahl stellt die Messstationen in einer interaktiven Karte dar, die Diagrammansicht
die Messwerte als Liniendiagramm. Beide Darstellungen sind visuell und lassen sich mit einem
Screenreader nicht sinnvoll erfassen. Die Karte ist mit der Tastatur bedienbar, der Weg über
mehr als tausend Marker ist aber nicht zumutbar; ein Sprunglink „Karte überspringen" führt
daran vorbei.

*Begründung:* Eine gleichwertige Screenreader-Bedienbarkeit von Kartendarstellung und
Liniendiagramm ist mit vertretbarem Aufwand nicht erreichbar.

*Gleichwertiger Zugang:* Dieselben Inhalte stehen ohne Karte und Diagramm zur Verfügung:

- Die **Listenauswahl** enthält alle Messstationen als Liste und führt über Suche und
  Kategoriefilter zu derselben Stationsauswahl wie die Karte — technisch derselbe Dialog.
- Die **Tabellenansicht** enthält die Messwerte in einer Tabelle mit Spaltenüberschriften.
- Der **Datendownload** liefert die Messwerte als CSV- oder XLSX-Datei.

Das Diagramm nennt Screenreadern die Anzahl und Bezeichnung der dargestellten Zeitreihen und
verweist auf die Tabellenansicht.

**2. Der Menüpunkt „Hilfe" führt zu keinem Ziel.**

In der linken Seitenleiste steht ein Menüpunkt „Hilfe", der auf keine Seite verweist. Der Zweck
des Verweises ist damit nicht erkennbar (WCAG 2.4.4).

*Begründung:* Eine Hilfeseite besteht derzeit nicht. Ob der Menüpunkt ein Ziel erhält oder
entfällt, ist redaktionell zu entscheiden.

*Gleichwertiger Zugang:* Alle übrigen Menüpunkte tragen sprechenden Text und führen zu ihrem
Ziel. Die Angaben zu Impressum, Datenschutz und Barrierefreiheit sind zusätzlich über das
Overlay „Information & Kontakt" erreichbar.

**3. Fokussierte Spaltenüberschriften der Datentabelle können angeschnitten werden.**

Am rechten Rand des waagerecht scrollbaren Tabellenbereichs kann eine mit der Tastatur
angesteuerte Spaltenüberschrift um bis zu 48 Pixel verdeckt bleiben.

*Begründung:* Das betrifft WCAG 2.4.11, ein Kriterium der WCAG 2.2. Der Prüfumfang war die
Stufe AA der WCAG 2.1; das Kriterium lag damit außerhalb. Der Befund ist dokumentiert.

### Nicht in den Anwendungsbereich fallende Inhalte

- **Hintergrundkarten** werden von Dritten bereitgestellt (Kartenbild der Hanse- und
  Universitätsstadt Rostock, Kartendaten von OpenStreetMap und LkKfS-MV, Luftbilder des Landes
  Mecklenburg-Vorpommern). Sie sind reine Bilddaten und werden nicht von dieser Stelle
  erstellt.
- **Über den Datendownload verlinkte Ressourcen** Dritter.
- Die **Anmeldung** erfolgt über einen eigenständigen Dienst außerhalb dieser Anwendung.

### Erstellung dieser Erklärung

Diese Erklärung wurde am **[DATUM]** erstellt.

Die Bewertung beruht auf einer **Selbstbewertung** durch die entwickelnde Stelle. Geprüft wurde
in mehreren Durchgängen zwischen dem 7. September und dem 2. Oktober 2026:

- automatisiert mit axe-core über 21 Zustände der Anwendung, einschließlich geöffneter Dialoge,
  ausgeklappter Overlays und geladener Zeitreihen; der Prüflauf ist als Regressionsprüfung
  eingerichtet, die 13 Zustände, die ohne Messdaten auskommen, laufen bei jeder Änderung
  automatisch mit,
- Tastaturbedienung, Fokusreihenfolge und Fokussichtbarkeit von Hand,
- Vergrößerung bis 400 Prozent, veränderte Textabstände und reduzierte Bewegung,
- Farb- und Kontrastmessung einschließlich einer Simulation von Farbfehlsichtigkeiten,
- Prüfung der Namen, Rollen und Zustände über den Accessibility-Tree des Browsers,
- Prüfung der Ansagen mit dem Screenreader NVDA unter Windows und Firefox.

Eine Prüfung durch Nutzende, die selbst auf einen Screenreader angewiesen sind, ist noch nicht
erfolgt. Ebenso steht eine Prüfung nach dem BITV-Test noch aus.

### Feedback und Kontaktangaben

Ihnen sind Barrieren aufgefallen oder Sie benötigen eine Information in barrierefreier Form?
Wenden Sie sich an:

Landesamt für Umwelt, Naturschutz und Geologie Mecklenburg-Vorpommern
Goldberger Straße 12b, 18273 Güstrow
Telefon: +49 385 588-64600
E-Mail: barrierefreiheit@lung.mv-regierung.de

### Durchsetzungsverfahren

Haben Sie auf Ihre Anfrage keine oder keine zufriedenstellende Antwort erhalten, können Sie sich
an die Überwachungsstelle für digitale Barrierefreiheit öffentlicher Stellen des Landes
Mecklenburg-Vorpommern wenden:

Ministerium für Soziales, Gesundheit und Sport Mecklenburg-Vorpommern
Überwachungsstelle für digitale Barrierefreiheit öffentlicher Stellen M-V
Werderstraße 124, 19055 Schwerin
Telefon: +49 385 588-19346
E-Mail: ueberwachungsstelle@sm.mv-regierung.de

---

## Was noch fehlt, bevor dieser Text veröffentlicht werden kann

Nicht Teil der Erklärung — Arbeitsliste für die Freigabe.

| # | Punkt | Warum es die Erklärung berührt |
| - | ----- | ------------------------------ |
| 1 | 2.4.4 Linkzweck im Kontext | Das einzige nicht erfüllte Kriterium, steht unter „Nicht barrierefreie Inhalte", Punkt 2. Eine Entscheidung: ob der Menüpunkt „Hilfe" ein Ziel bekommt oder entfällt. Fällt sie vor der Veröffentlichung, entfällt der Punkt |
| 2 | Drei Overlays ohne Prüfszenario: der Metadaten-Dialog „MetaVer" aus dem Legendeneintrag, das Zeitraum-Menü samt Kalender und der Farbwähler in „Zeitreihendarstellung ändern" | Keines der 21 Szenarien öffnet sie, axe hat sie also nie gesehen. Der Metadaten-Dialog ist bei jeder Zeitreihe erreichbar — alle 1120 aktiven Messstellen tragen eine MetaVer-Kennung. Deshalb nennt der Prüfumfang oben elf Dialoge und Overlays statt „alle" |
| 3 | `[URL DER ANWENDUNG]`, `[DATUM]` und `[RECHTSGRUNDLAGE DES LANDES ERGÄNZEN]` | Pflichtangaben. Die Rechtsgrundlage ist bewusst offen gelassen: für Landesbehörden gilt Landesrecht, nicht die BITV 2.0 des Bundes, und den genauen Wortlaut sollte die Stelle setzen, die die Erklärung verantwortet. Die Überwachungsstelle selbst beruft sich auf das LBGG M-V und die BITVO M-V |
| 4 | Abgrenzung zur Portal-Erklärung von 2020 | Solange dort „Komplette Webseite" als nicht barrierefrei steht, widerspricht ein „teilweise vereinbar" für diese Anwendung dem Rest der Seite. Das ist redaktionell zu lösen, nicht technisch. Die Angaben zur Überwachungsstelle nicht von dort übernehmen: Ministerium und Telefonnummer sind dort veraltet. Die in diesem Entwurf sind am 02.10.2026 mit regierung-mv.de abgeglichen — vor der Veröffentlichung noch einmal prüfen |

Auch wenn alle Punkte abgearbeitet sind, bleibt der Stand **„teilweise vereinbar"**: die
Einschränkung bei Karte und Diagramm ist eine bewusste Entscheidung (siehe „Nicht barrierefreie
Inhalte", Punkt 1) und wird nicht entfallen.
