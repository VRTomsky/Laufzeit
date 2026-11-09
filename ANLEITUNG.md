# Bitweg

Lokale Lern-App für Python und C++ im Stil von Duolingo. Läuft komplett auf deinem PC, ohne Konto und ohne Cloud.

## Starten

**Normalfall: nichts tun.** Laufzeit startet beim Anmelden an Windows automatisch und unsichtbar im Hintergrund. Du öffnest einfach im Browser **`http://127.0.0.1:5741`**, am schnellsten über die Verknüpfung **`Laufzeit`** auf dem Desktop.

- Autostart: Verknüpfung `Laufzeit.lnk` im Windows-Autostart-Ordner (`Win+R`, `shell:startup`). Sie startet `pythonw.exe server.py --no-browser`, also ohne Fenster. Löschst du die Verknüpfung, ist der Autostart aus.
- **`beenden.bat`** stoppt den Hintergrund-Server (nur Laufzeit auf Port 5741, sonst nichts).
- **`start.bat`** startet ihn von Hand mit sichtbarem Fenster, z. B. nach `beenden.bat`. Läuft er schon, öffnet `start.bat` nur den Browser.
- Meldungen des Hintergrund-Servers landen in `server.log` (wird bei jedem Start neu angelegt).
- Wichtig: Dein Fortschritt hängt am Browser **und** an der Adresse. Nutz immer dieselbe, also `127.0.0.1:5741`. Unter `localhost:5741` sieht der Browser einen leeren Stand (dann über Profil → Sicherung wiederherstellen).

Beim allerersten Öffnen startet die **Einführung**: Bit fragt, welche Sprache du lernen willst, warum, wie alt du bist, ob du schon programmiert hast, wie viel du kannst, wie viel Zeit du pro Tag hast und ob alles installiert ist. Bei Sprachen, Zielen und Vorkenntnissen sind mehrere Antworten möglich. Wählst du beide Sprachen, fragt Bit für jede einzeln nach Wissensstand und Startpunkt. Deine Ziele markieren später passende Abschnitte im Lernpfad („Wichtig für: …“), zeigen oben deinen nächsten Meilenstein und klappen in der Werkstatt die passenden Anleitungen auf. Ändern kannst du sie im Profil unter „Über dich“. Danach wählst du: von vorne anfangen oder **Einstufungstest** (bis zu 10 Fragen, nach zwei Fehlern ist Schluss, bestandene Abschnitte werden übersprungen).

Kurs wechseln oder den zweiten Kurs hinzufügen: oben rechts auf das Kurs-Symbol (Py oder C++) klicken. Am Handy und in schmalen Fenstern sitzt es oben links.

Beim ersten Start sucht der Server einige Sekunden nach dem C++-Compiler. In der **Werkstatt** siehst du, was gefunden wurde.

## Was wo ist

| Bereich | Wofür |
|---|---|
| Lernen | Lernpfad mit Abschnitten, Lektionen und Abschnittstest (Pokal). Kurs wechseln über das Kurs-Menü. „Leitfaden“ im Banner zeigt alle Erklärungen eines Abschnitts |
| Training | Wiederholt Übungen aus fertigen Lektionen. Fehler kommen öfter dran |
| Projekte | Echte Programme in Etappen und freie Aufgaben ohne Vorlage, geprüft mit mehreren Testfällen |
| Labor | Freier Editor, führt beliebigen Code aus, mit Eingaben |
| Werkstatt | Systemcheck und Anleitungen: VS Code, Python, Compiler, Raylib, Unreal |
| Profil | Stufe, Verlauf, Abzeichen, Hell/Dunkel, Tagesziel, Sicherung |

Rechts (bzw. oben am Handy): Serie, XP, drei Tagesaufgaben, Stufe und nächstes Abzeichen.

Tastatur in Lektionen: `Enter` prüft und geht weiter, `1` bis `4` wählt bei Multiple Choice, `Strg+Enter` führt im Editor den Code aus, `Tab` rückt ein.

## Wie dein Code geprüft wird

- **Python** läuft mit deinem installierten Python (3.13).
- **C++** wird mit einem echten Compiler übersetzt und als `.exe` gestartet. Laufzeit nimmt `g++`, falls vorhanden, sonst den Visual-Studio-Compiler `cl.exe`. Auf deinem PC ist das MSVC 19.51.
- Jede Aufgabe prüft erst Regeln (z. B. „nutze eine Schleife“), dann die echte Ausgabe.
- **Kleine Tippfehler im Ausgabetext zählen als richtig** (z. B. `ZieL` statt `Ziel`, `Gegnr` statt `Gegner`, ein Leerzeichen zu viel). Die App sagt dann „Richtig, mit kleinem Tippfehler“ und zeigt, was abweicht. Streng bleibt sie bei Zahlen, Satzzeichen, Zeilen, bei `True`/`False`/`None`, Typnamen wie `int` und in Aufgaben, in denen Groß-/Kleinschreibung das Thema ist (`upper()`, `lower()`, `toupper`). Pro Wort ist ein Buchstabe Abweichung erlaubt (Wörter ab 4 Buchstaben), insgesamt höchstens zwei. Logik in `app/js/tolerance.js`.
- Fehlermeldungen werden in deutsche Hinweise übersetzt, die Fehlerzeile wird im Editor markiert.
- Programme werden nach 5 Sekunden gestoppt. So hängt nichts bei Endlosschleifen.

Raylib-, pygame- und Unreal-Code öffnet Fenster oder braucht ein Unreal-Projekt. Diese Aufgaben werden über Regeln geprüft, nicht ausgeführt. Ausprobieren kannst du sie in VS Code bzw. Unreal, siehe Werkstatt.

## Sicherheit

Der Server ist nur über `127.0.0.1` erreichbar, also nur von deinem PC. Andere Webseiten im Browser können keinen Code ausführen lassen: Der Server verlangt einen eigenen Header und prüft Herkunft und Host. Er führt aber den Code aus, den **du** eintippst, mit deinen Rechten. Lass das Fenster also nicht laufen, wenn jemand anderes an deinem PC Code einfügt, den du nicht kennst.

## Abwechslung und Gold

- **Wiederholen** einer Lektion: keine Erklärkarten mehr, gut die Hälfte der Aufgaben ist neu erzeugt (andere Zahlen, Namen, Grenzen). Dazu kommen Wiederholungs-Aufgaben aus früheren Abschnitten.
- **Gold holen** (im Popover einer geschafften Lektion): schwere neue Aufgaben, höchstens 1 Fehler. Die Lektion bekommt eine Krone.
- **Abschnittstest**: überwiegend neue Aufgaben, die so in den Lektionen nicht vorkamen.
- **Gold-Prüfung** (am Pokal, sobald alle Lektionen des Abschnitts Gold sind): 12 schwere Aufgaben, höchstens 2 Fehler. Danach wird der ganze Abschnitt golden.
- Das **Training** mischt Fehler von früher mit neuen Varianten.

Der Generator steckt in `app/js/content/generators.js`. Jede Variante wurde automatisch mit echtem Python und C++ gegengeprüft.

## Fortschritt und Sicherung

Alles liegt im `localStorage` des Browsers. Zusätzlich sichert Laufzeit **automatisch auf deinen Desktop**, in den Ordner `Laufzeit-Sicherungen`:

- nach dem Lernen (frühestens 20 Sekunden nach der letzten Änderung, höchstens alle 5 Minuten)
- beim Schließen oder Minimieren der Seite
- einmal am Tag beim Start

Pro Tag gibt es eine Datei, die letzten 14 bleiben erhalten. Wäre die neue Sicherung kleiner als die heutige (z. B. nach „Alles zurücksetzen“), bleibt die alte als `...-vorher-...` erhalten. Unter **Profil, Sicherung auf dem Desktop** siehst du alle Sicherungen, kannst jede laden oder das automatische Sichern abschalten. Ist der Browser-Speicher einmal leer, bietet die Einführung direkt „Fortschritt vom Desktop laden“ an.

## Profil

Unter **Profil, Profil bearbeiten** stellst du Name, Benutzername, „Über mich“, Profilbild und Titelbild ein. Nach dem Hochladen öffnet sich ein Zuschneide-Fenster: Bild ziehen, mit Regler oder Mausrad zoomen (Tastatur: Pfeiltasten und Plus/Minus), „Übernehmen“.

## Online-Version, Konten und Freunde

- **Online:** https://vrtomsky.github.io/Laufzeit/ (GitHub-Repo `VRTomsky/Laufzeit`). Jeder Push auf `main` veröffentlicht `app/` neu, über `.github/workflows/pages.yml`.
- **Name:** Seit November 2026 heißt die App **Bitweg** (laufzeit.de war vergeben, bitweg.de und bitweg.com waren frei). Ordner, Repo, Server-Kopfzeile `X-Laufzeit` und die Speicher-Schlüssel `laufzeit.*` heißen absichtlich weiter so, damit kein Fortschritt verloren geht.
- **Handy:** Die Seite ist eine PWA (`manifest.webmanifest`, `sw.js`, Icons in `img/`). In Chrome: Menü → „App installieren“. Unten erscheint eine Leiste mit allen Bereichen.
- **Gruppenchats:** `views/groups.js`, Datenbank `supabase/03-gruppen.sql`. Chat-Fenster für Freunde und Gruppen teilen sich `views/chatbox.js` (Scrollen, Anhänge, Bildvorschau mit Zoom: Mausrad zur Mausposition, ziehen, Doppelklick, auf dem Handy zwei Finger).
- Woran die App merkt, dass sie online läuft: Adresse ist nicht `127.0.0.1`/`localhost` (`app/js/env.js`). Zum Testen lokal `?web` an die Adresse hängen.
- **Python online:** Pyodide (echtes CPython 3.12 als WebAssembly) in einem Web Worker (`pyworker.js`, `webpython.js`). Endlosschleifen: Worker wird nach 5 Sekunden beendet und neu gestartet. Beim ersten Mal lädt es etwa 10 MB.
- **C++ online:** kein Compiler. Aufgaben werden über die Regeln geprüft („Angenommen, aber ungeprüft“). In der Werkstatt steht, wie man Laufzeit herunterlädt.
- **Konten:** Supabase, eingerichtet laut `EINRICHTEN.md`. Zugangsdaten in `app/js/config.js`. Sind sie leer, bleibt alles lokal wie vorher.
  - `cloud.js`: Login, Speichern im Konto, Freunde, Nachrichten, Anfeuern.
  - `views/account.js`: Seiten Login, Registrieren, Passwort.
  - `views/friends.js`: Freunde, fremde Profile, Chat.
  - `supabase/schema.sql`: Tabellen und Zugriffsregeln.
- **Speichern im Konto:** 4 Sekunden nach jeder Änderung und beim Schließen. Beim Einloggen gewinnt der Stand mit mehr XP. Wenn beide Fortschritt haben, fragt die App nach. Der Stand eines anderen Kontos auf demselben Gerät wird nie übernommen. Beim Ausloggen wird der Browser geleert.
- **Was Freunde sehen:** Name, Benutzername, Bilder, Bio, XP, Serie, Kurs, Abschnitt, Lektionen, Gold und die Lerntage der letzten 60 Tage. Daraus berechnet die App die gemeinsame Serie.
- **Schutz:**
  - Nachrichten und Anfeuern gehen nur unter Freunden.
  - Maximal 20 Nachrichten pro Minute, dieselbe Anfeuer-Art einmal pro Stunde.
  - Blockieren beendet die Freundschaft und macht sich gegenseitig unsichtbar.
  - Meldungen landen in der Tabelle `reports`.
- **Testen ohne Supabase:** `?web&mock` an die Adresse hängen. Dann läuft eine Attrappe mit erfundenen Test-Nutzern (`cloud-mock.js`) nur im Browser.

## Neue Lektionen hinzufügen

Inhalte stehen in `app/js/content/`: Abschnitt 1 bis 4 in `python.js` und `cpp.js`, die übrigen in `python-5-8.js`, `python-9-11.js`, `cpp-5-8.js`, `cpp-9-11.js` und `cpp-12-14.js`. Eine Lektion ist ein Objekt mit `id`, `title`, `goal` und `steps`. Die Übungstypen sind in `app/js/content/helpers.js` beschrieben. Beispiel:

```js
{
  id: 'py5-1',
  title: 'Listen',
  goal: 'Mehrere Werte in einer Variable speichern.',
  steps: [
    concept('Eine Liste', 'Eine **Liste** speichert mehrere Werte ...', { code: 'items = ["Schwert", "Schild"]' }),
    predict('Was wird ausgegeben?', 'items = ["a", "b"]\nprint(items[0])', 'a'),
    write('Gib das letzte Element aus.', 'items = [1, 2, 3]\n', { expect: '3', solution: 'items = [1, 2, 3]\nprint(items[-1])' }),
  ],
},
```

Neuer Abschnitt: ein weiteres Objekt in `units`. Der Lernpfad, das Freischalten, XP und das Training passen sich automatisch an.

## Aufbau

```
Laufzeit/
  start.bat              Startet den Server und öffnet den Browser
  server.py              Liefert die App aus, führt Python- und C++-Code aus (nur Python-Bordmittel)
  app/
    index.html
    css/tokens.css       Farben, Schriften, Abstände (Designsystem)
    css/app.css          Rahmen, Lernpfad, Seiten
    css/lesson.css       Lektionen, Übungen, Editor
    js/main.js           Router
    js/store.js          Speichern im Browser
    js/gamification.js   XP, Stufen, Streak, Abzeichen
    js/runner.js         Code ausführen und prüfen
    js/hints.js          Fehlermeldungen auf Deutsch
    js/editor.js         Code-Editor
    js/highlight.js      Syntax-Farben
    js/mascot.js         Die Figur Bit (SVG)
    js/content/          Kurse und Lektionen (75 Lektionen)
    js/views/            Seiten und Übungstypen
```
