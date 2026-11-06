# Lehrplan Laufzeit

Zwei Pfade, ein Ziel: Python sicher für die Schule, C++ auf dem Weg zum Spieleentwickler.
Stand: November 2026. **Beide Kurse sind komplett.** 102 Lektionen in 34 Abschnitten (mit Abschnittstests), 8 Projekte, 28 freie Aufgaben.

## Didaktische Regeln

1. **Erst zeigen, dann tun.** Jede Lektion beginnt mit einer kurzen Erklärkarte und echtem Code. Danach nur noch Übungen.
2. **Steigende Schwierigkeit.** Erkennen (Multiple Choice), lesen (Ausgabe vorhersagen), ergänzen (Lückentext), ordnen (Zeilen sortieren), reparieren (Fehler finden), schreiben (eigener Code).
3. **Fehler sind Lernstoff.** Falsche Antworten kommen am Ende der Lektion nochmal. Das Training zeigt wackelige Aufgaben häufiger.
4. **Echter Code, echte Fehlermeldungen.** Schreib- und Reparatur-Aufgaben laufen mit echtem Python und echtem C++-Compiler. Meldungen werden ins Deutsche übersetzt, der Originaltext bleibt sichtbar.
5. **C++ baut auf Python auf.** Viele C++-Karten zeigen den Python-Code daneben. Speicheradressen kommen mit Bild, bevor Pointer drankommen.
6. **Spielbezug überall.** Leben, Munition, Level, Game-Loop statt abstrakter Beispiele.
7. **Abschnittstest am Ende jedes Abschnitts** mit gemischten Aufgaben, Leitfaden zum Nachlesen aller Erklärungen.

## Python (45 Lektionen)

| Nr. | Abschnitt | Lektionen |
|---|---|---|
| 01 | Erste Schritte | Hallo Welt · Rechnen und Kommentare · Fehler lesen |
| 02 | Variablen und Eingaben | Variablen · Datentypen und f-Strings · input() und Umwandeln |
| 03 | Entscheidungen | Vergleiche · if und else · elif und Logik |
| 04 | Schleifen | while · for und range · break und das erste Spiel |
| 05 | Listen und Strings | Listen · Listen durchlaufen · Strings und Slicing |
| 06 | Funktionen | Eigene Funktionen · return · Standardwerte und Gültigkeit |
| 07 | Datenstrukturen | Dictionaries · Dictionaries durchlaufen · Tupel, Mengen, Comprehensions |
| 08 | Fehler und Dateien | try und except · Dateien schreiben und lesen · Zeilen verarbeiten |
| 09 | Objektorientierung | Klassen und Objekte · Methoden · Vererbung |
| 10 | Projekte und Algorithmen | Module · Suchen · Sortieren (Bubble Sort selbst gebaut) |
| 11 | Spiele mit Python | Rundenkampf · Fenster mit pygame · Delta-Time und Godot |
| 12 | Rekursion und Algorithmen | Rekursion · Rekursiv denken · Binäre Suche und Big-O |
| 13 | Fortgeschrittene Funktionen | Lambda, map, filter · *args und Generatoren · Closures und Dekoratoren |
| 14 | Saubere Programme | Eigene Fehler werfen · JSON und Typ-Hinweise · Testen mit assert |
| 15 | Datenstrukturen und Effizienz | Stack und Queue · Graphen und Breitensuche · Dataclasses |

Die Reihenfolge 01 bis 09 folgt dem typischen Schulstoff der Oberstufe.

## C++ (57 Lektionen)

| Nr. | Abschnitt | Lektionen |
|---|---|---|
| 01 | Erste Schritte | Hallo C++ · Semikolons und Zeilen · Compiler-Fehler lesen |
| 02 | Variablen und Typen | Variablen mit Typ (Speicherbild) · Ganzzahl-Division · Eingaben mit cin |
| 03 | Entscheidungen | if und else · && und \|\| · switch für Spielzustände |
| 04 | Schleifen und Game-Loop | while und do-while · for-Schleifen · Der Game-Loop |
| 05 | Funktionen | Rückgabewerte · Deklaration und Definition · Überladen und Standardwerte |
| 06 | Arrays, vector, string | Arrays · std::vector · std::string |
| 07 | Referenzen und Pointer | Adressen und Referenzen · Pointer (Speicherbild mit Pfeil) · nullptr und Tauschen |
| 08 | Speicherverwaltung | Stack und Heap · new, delete und Lecks · Smart Pointer |
| 09 | Klassen und Objekte | struct und class · Konstruktoren und Methoden · Kapselung |
| 10 | Vererbung und Polymorphie | Vererbung · virtual und override · Abstrakte Klassen |
| 11 | Game-Dev-Mathe | Vektoren · Delta-Time · Kollision (AABB) |
| 12 | Raylib | Das erste Fenster · Tastatur und Bewegung · Ein kleines Spiel (Münzen sammeln) |
| 13 | Unreal-C++ | UCLASS und UPROPERTY · BeginPlay und Tick · Komponenten und Blueprints |
| 14 | Profi-Werkzeuge | Templates · STL-Algorithmen und Lambdas · Schnelles C++ |
| 15 | Rekursion und eigene Datenstrukturen | Rekursion · Verkettete Liste · Eigener Stack als Template |
| 16 | STL-Container | std::map · unordered_map und set · Iteratoren und erase |
| 17 | RAII und Move | Konstruktor, Destruktor, RAII · Regel der Fünf · Move-Semantik |
| 18 | Spielarchitektur | Zustandsautomat · Komponenten statt Vererbung · Ereignisse (Observer) |
| 19 | KI für Spiele | Wegfindung auf dem Gitter · Heuristiken und A* · Wellen und Balancing |

**Warum Raylib vor Unreal:** In Raylib schreibst du den Game-Loop selbst und siehst, was jede Zeile tut. Unreal nimmt dir den Loop ab. Mit Klassen, Pointern und Vererbung aus Abschnitt 07 bis 10 liest sich Unreal-C++ dann wie normales C++ mit ein paar Makros.

**Was nicht ausgeführt wird:** Raylib-, pygame- und Unreal-Code öffnet Fenster oder braucht ein Engine-Projekt. Diese Aufgaben (Python 11.2, C++ 12 und 13) prüft Laufzeit über Regeln. Ausprobieren in VS Code bzw. Unreal, Anleitungen in der Werkstatt.

**Andere Engines:** Godot (GDScript ähnelt Python, Lektion Python 11.3) und Unity (C#, sehr nah an C++) sind in der Werkstatt beschrieben.

## Projekte und freie Aufgaben (Bereich „Projekte“)

Hier wird aus Wissen Können. Projekte bauen in Etappen ein echtes Programm, der Code wächst von Etappe zu Etappe. Freie Aufgaben haben keine Vorlage: nur eine Beschreibung und mehrere versteckte Testfälle, wie bei Programmier-Wettbewerben.

| Sprache | Projekte | Freie Aufgaben |
|---|---|---|
| Python | Zahlenraten · Galgenmännchen · Text-Adventure · Rollenspiel-Kampf | 15, von FizzBuzz bis Labyrinth-Breitensuche |
| C++ | Tic-Tac-Toe · Kampf-System mit Vererbung · Inventar-System · Labyrinth-Löser | 13, von Sternen-Treppe bis Klammer-Prüfer |

Projekte und Aufgaben werden freigeschaltet, sobald der passende Abschnitt geschafft ist.

## Ehrlich: Was „100 %“ heißt

Wer alle Lektionen, Projekte und Aufgaben schafft, kann Python und C++ solide auf Fortgeschrittenen-Niveau und hat erste eigene Programme gebaut. Das entspricht grob dem, was eine gute Ausbildung oder die ersten Semester abdecken. Senior-Entwickler wird man danach durch eigene, größere Projekte über Jahre. Laufzeit bereitet genau darauf vor: Das Kursende zeigt den Profi-Fortschritt aus Lektionen, Projekten und Aufgaben.

## Nach dem Kurs

- **Training:** endlos, mischt alle Übungen fertiger Lektionen, Fehler kommen öfter dran.
- **Abschnittstests:** jederzeit wiederholbar.
- **Labor:** eigene Programme schreiben und ausführen.
- **Nächste echte Projekte:** Python: Text-Adventure mit Klassen und Speicherstand. C++: das Raylib-Münzspiel erweitern (Gegner, Leben, Level), dann `AMuenze` in Unreal nachbauen.
