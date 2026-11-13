# Bitweg

Python und C++ lernen, Lektion für Lektion, im Stil einer Sprachlern-App: kurze Aufgaben, XP, Serien, Abzeichen, Gold-Lektionen, Projekte und freie Aufgaben. Dazu Konten, Freunde, Nachrichten und Anfeuern.

**Online ausprobieren:** https://bitweg.de/

Am Handy: Link in Chrome öffnen, Menü (⋮) → **App installieren** bzw. **Zum Startbildschirm hinzufügen**. Dann startet Bitweg wie eine App. Chatten, Gruppen und Python gehen auch dort, C++ nur am PC.

## Zwei Versionen

| | Online (Browser) | Auf dem eigenen PC |
|---|---|---|
| Starten | Link öffnen | `start.bat` doppelklicken |
| Python | läuft im Browser (Pyodide) | dein installiertes Python |
| C++ | nur Regel-Prüfung, kein Kompilieren | echter Compiler (MSVC oder g++) |
| Konto, Freunde, Gruppen | ja | ja, gleiches Konto |

Für echtes C++ und eigene Programme: Laufzeit herunterladen (grüner Knopf **Code → Download ZIP**), entpacken, Python von python.org installieren (Haken bei „Add python.exe to PATH“), dann `start.bat`. Laufzeit öffnet sich unter `http://127.0.0.1:5741`. Mit dem Konto einloggen, der Fortschritt kommt mit.

Wie C++ und VS Code eingerichtet werden, steht in der App unter **Werkstatt**.

## Aufbau

- `app/` die Webseite (reines HTML, CSS und JavaScript, kein Build-Schritt)
- `server.py` kleiner lokaler Server: liefert `app/` aus und führt Code auf dem PC aus (nur `127.0.0.1`)
- `supabase/schema.sql`, `02-anhaenge.sql`, `03-gruppen.sql`, `04-gruppen-profil.sql` Datenbank für Konten, Freunde, Nachrichten, Anhänge und Gruppen, mit Zugriffsregeln
- `ANLEITUNG.md` Bedienung und Technik, `LEHRPLAN.md` Inhalte, `EINRICHTEN.md` Konten einrichten

## Datenschutz

- Ohne Konto bleibt alles im Browser.
- Mit Konto speichert Supabase E-Mail (nur zum Einloggen), Profil, Lernstand, Freundschaften und Nachrichten. Passwörter speichert nur Supabase, verschlüsselt.
- Nachrichten können nur Freunde schicken und nur die beiden lesen. Gruppen lesen nur ihre Mitglieder, hinzufügen darf man nur eigene Freunde. Das prüft die Datenbank selbst.
- Konto löschen geht im Profil unter „Konto“. Dabei wird alles gelöscht.
