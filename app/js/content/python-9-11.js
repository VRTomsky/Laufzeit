// Python Abschnitt 9 bis 11: Objektorientierung, Projekte und Algorithmen, Spiele

import { concept, mc, predict, fill, order, fix, write } from './helpers.js';

export const pythonUnits9to11 = [
  /* ------------------------------------------------------------ 9 */
  {
    id: 'py9',
    title: 'Objektorientierung',
    summary: 'Eigene Datentypen mit Klassen: Spieler, Gegner und Items als Objekte mit Werten und Fähigkeiten.',
    lessons: [
      {
        id: 'py9-1',
        title: 'Klassen und Objekte',
        goal: 'Eine Klasse als Bauplan anlegen und Objekte daraus bauen.',
        steps: [
          concept('Bauplan und Objekt',
            'Eine **Klasse** ist ein Bauplan, z. B. für Spieler. Ein **Objekt** ist ein konkretes Exemplar nach diesem Bauplan.\n\n`__init__` ist der **Konstruktor**: Er läuft beim Erzeugen und setzt die Startwerte. `self` ist das Objekt selbst. `self.hp` heißt also: die Lebenspunkte **dieses** Spielers.',
            { code: 'class Spieler:\n    def __init__(self, name):\n        self.name = name\n        self.hp = 100\n\ntom = Spieler("Alex")\nada = Spieler("Ada")\nada.hp = 70\nprint(tom.name, tom.hp)\nprint(ada.name, ada.hp)', console: 'Alex 100\nAda 70' }),
          mc('Was ist `self`?', ['Das Objekt, für das die Methode gerade läuft', 'Der Name der Klasse', 'Eine globale Variable', 'Ein Python-Modul'], 0),
          predict('Was gibt dieses Programm aus?', 'class Item:\n    def __init__(self, name, wert):\n        self.name = name\n        self.wert = wert\n\nx = Item("Trank", 5)\nprint(x.wert * 3)', '15'),
          fill('Ergänze den Konstruktor.', 'class Gegner:\n    def ⟦0⟧(self, hp):\n        ⟦1⟧.hp = hp', ['__init__', 'self'], ['__init__', 'self', 'init', 'this']),
          write('Schreib eine Klasse `Spieler` mit `name` (Parameter) und `hp = 100`. Erzeuge `Spieler("Alex")` und gib `Alex: 100 HP` aus, über die Attribute.',
            '',
            { expect: 'Alex: 100 HP', must: [[/class\s+Spieler/, 'Lege `class Spieler:` an.'], [/def\s+__init__\s*\(\s*self/, 'Der Konstruktor heißt `__init__(self, ...)`.'], [/\.name/, 'Greif über das Objekt auf `name` zu.']], solution: 'class Spieler:\n    def __init__(self, name):\n        self.name = name\n        self.hp = 100\n\ns = Spieler("Alex")\nprint(f"{s.name}: {s.hp} HP")' }),
        ],
      },
      {
        id: 'py9-2',
        title: 'Methoden',
        goal: 'Objekten Fähigkeiten geben.',
        steps: [
          concept('Fähigkeiten',
            'Eine **Methode** ist eine Funktion in einer Klasse. Sie bekommt immer zuerst `self` und kann damit die Werte des Objekts lesen und ändern.',
            { code: 'class Spieler:\n    def __init__(self, name):\n        self.name = name\n        self.hp = 100\n\n    def heilen(self, menge):\n        self.hp = min(100, self.hp + menge)\n\ns = Spieler("Alex")\ns.hp = 60\ns.heilen(30)\nprint(s.hp)', console: '90' }),
          predict('Was gibt dieses Programm aus?', 'class Zaehler:\n    def __init__(self):\n        self.wert = 0\n    def plus(self):\n        self.wert += 1\n\nz = Zaehler()\nz.plus()\nz.plus()\nprint(z.wert)', '2'),
          mc('Warum braucht jede Methode `self` als ersten Parameter?', ['Damit sie weiß, welches Objekt gemeint ist', 'Weil Python sonst langsam ist', 'Für den Rückgabewert', 'Das ist nur ein Kommentar'], 0),
          write('Ergänze die Klasse `Spieler` um `schaden(menge)`, die `hp` senkt, aber nie unter 0, und um `ist_besiegt()`, die `True` liefert, wenn `hp` 0 ist. Der Testcode steht schon unten.',
            'class Spieler:\n    def __init__(self, name):\n        self.name = name\n        self.hp = 100\n\n\ns = Spieler("Alex")\ns.schaden(30)\nprint(s.hp)\ns.schaden(90)\nprint(s.hp, s.ist_besiegt())\n',
            { expect: '70\n0 True', must: [[/def\s+schaden\s*\(\s*self/, 'Lege `def schaden(self, menge):` in der Klasse an.'], [/def\s+ist_besiegt\s*\(\s*self/, 'Lege `def ist_besiegt(self):` an.']], solution: 'class Spieler:\n    def __init__(self, name):\n        self.name = name\n        self.hp = 100\n\n    def schaden(self, menge):\n        self.hp = max(0, self.hp - menge)\n\n    def ist_besiegt(self):\n        return self.hp == 0\n\n\ns = Spieler("Alex")\ns.schaden(30)\nprint(s.hp)\ns.schaden(90)\nprint(s.hp, s.ist_besiegt())\n' }),
        ],
      },
      {
        id: 'py9-3',
        title: 'Vererbung',
        goal: 'Klassen von anderen Klassen erben lassen.',
        steps: [
          concept('Erben und überschreiben',
            'Mit `class Boss(Gegner):` **erbt** Boss alles von Gegner. Du ergänzt nur, was anders ist. Eine geerbte Methode kannst du **überschreiben**, also neu schreiben.\n\n`super().__init__(...)` ruft den Konstruktor der Elternklasse auf.',
            { code: 'class Gegner:\n    def __init__(self, hp):\n        self.hp = hp\n    def angriff(self):\n        return 5\n\nclass Boss(Gegner):\n    def __init__(self):\n        super().__init__(500)\n    def angriff(self):\n        return 40\n\nb = Boss()\nprint(b.hp, b.angriff())', console: '500 40' }),
          predict('Was gibt dieses Programm aus?', 'class A:\n    def hallo(self):\n        return "A"\n\nclass B(A):\n    pass\n\nprint(B().hallo())', 'A', 'B hat keine eigene Methode hallo, also wird die von A genommen.'),
          mc('Was macht `super().__init__(500)` im Beispiel?', ['Ruft den Konstruktor von Gegner auf', 'Erzeugt einen zweiten Boss', 'Löscht das Objekt', 'Setzt hp auf super'], 0),
          write('Lege `Tier` mit der Methode `laut()` an, die `"..."` zurückgibt. Leite `Hund` und `Katze` davon ab und überschreibe `laut()` mit `"Wuff"` und `"Miau"`. Gib in einer Schleife über `[Hund(), Katze()]` jeweils `laut()` aus.',
            '',
            { expect: 'Wuff\nMiau', must: [[/class\s+Hund\s*\(\s*Tier\s*\)/, 'Leite ab mit `class Hund(Tier):`.'], [/class\s+Katze\s*\(\s*Tier\s*\)/, 'Leite ab mit `class Katze(Tier):`.'], [/\bfor\b/, 'Nutze eine Schleife über die Liste.']], solution: 'class Tier:\n    def laut(self):\n        return "..."\n\nclass Hund(Tier):\n    def laut(self):\n        return "Wuff"\n\nclass Katze(Tier):\n    def laut(self):\n        return "Miau"\n\nfor t in [Hund(), Katze()]:\n    print(t.laut())', explain: 'Dieselbe Schleife ruft für jedes Objekt die passende Methode auf. Das heißt **Polymorphie** und ist in C++ und Unreal genauso wichtig.' }),
        ],
      },
    ],
  },

  /* ------------------------------------------------------------ 10 */
  {
    id: 'py10',
    title: 'Projekte und Algorithmen',
    summary: 'Module nutzen, Suchen und Sortieren selbst bauen: das Handwerkszeug für eigene Programme.',
    lessons: [
      {
        id: 'py10-1',
        title: 'Module',
        goal: 'Fertige Werkzeuge mit import nutzen.',
        steps: [
          concept('Nicht alles selbst bauen',
            'Python bringt viele **Module** mit: Sammlungen fertiger Funktionen. Mit `import` holst du sie ins Programm.\n\n- `math`: Wurzel, Runden, Pi\n- `random`: Zufall, z. B. Würfel\n- `time`: Zeit und Pausen\n\n`from math import sqrt` holt nur eine Funktion, dann schreibst du `sqrt(9)` statt `math.sqrt(9)`.',
            { code: 'import math\nimport random\n\nprint(math.sqrt(16))\nwuerfel = random.randint(1, 6)\nprint(1 <= wuerfel <= 6)', console: '4.0\nTrue' }),
          predict('Was gibt dieses Programm aus?', 'import math\nprint(math.floor(7.8))', '7'),
          mc('Welche Werte kann `random.randint(1, 6)` liefern?', ['1 bis 6, beide eingeschlossen', '1 bis 5', '0 bis 6', 'nur 1 oder 6'], 0,
            'Anders als bei range ist bei randint das Ende dabei.'),
          fill('Hol dir nur die Funktion `choice`.', '⟦0⟧ random ⟦1⟧ choice\nprint(choice(["Stein", "Schere", "Papier"]))', ['from', 'import'], ['from', 'import', 'get', 'use']),
          write('Importiere `math`. Gib `math.floor(9.99)` aus und darunter Pi auf zwei Stellen gerundet mit `round()`.',
            '',
            { expect: '9\n3.14', must: [[/import\s+math/, 'Beginne mit `import math`.'], [/round\s*\(/, 'Runde mit `round(wert, 2)`.']], solution: 'import math\nprint(math.floor(9.99))\nprint(round(math.pi, 2))' }),
        ],
      },
      {
        id: 'py10-2',
        title: 'Suchen',
        goal: 'Ein Element in einer Liste selbst finden.',
        steps: [
          concept('Lineare Suche',
            'Ein **Algorithmus** ist ein genaues Rezept zum Lösen eines Problems. Der einfachste Suchalgorithmus prüft jedes Element nacheinander: die **lineare Suche**.\n\nIst die Liste sortiert, geht es viel schneller: Die **binäre Suche** schaut in die Mitte und halbiert den Bereich bei jedem Schritt. Bei einer Million Einträgen braucht sie nur etwa 20 Schritte.',
            { code: 'def finde(liste, ziel):\n    for i in range(len(liste)):\n        if liste[i] == ziel:\n            return i\n    return -1\n\nprint(finde([4, 8, 15], 8))', console: '1' }),
          mc('Wie viele Schritte braucht die lineare Suche im schlimmsten Fall bei 1000 Elementen?', ['1000', '10', '1', '500'], 0, 'Steht das Ziel ganz hinten oder fehlt es, muss jedes Element geprüft werden.'),
          predict('Was gibt dieses Programm aus?', 'def finde(liste, ziel):\n    for i in range(len(liste)):\n        if liste[i] == ziel:\n            return i\n    return -1\n\nprint(finde(["a", "b"], "z"))', '-1'),
          order('Bau die lineare Suche zusammen.',
            ['def finde(liste, ziel):', '    for i in range(len(liste)):', '        if liste[i] == ziel:', '            return i', '    return -1'],
            'return -1 steht nach der Schleife, sonst würde schon beim ersten falschen Element aufgegeben.'),
          write('Schreib `finde(liste, ziel)` selbst, ohne `.index()`. Sie gibt die Position zurück oder -1. Teste mit `finde([3, 9, 27, 81], 27)` und `finde([3, 9, 27, 81], 5)`.',
            '',
            { expect: '2\n-1', must: [[/def\s+finde\s*\(/, 'Lege `def finde(liste, ziel):` an.']], mustNot: [[/\.index\s*\(/, 'Bau die Suche selbst, ohne `.index()`.']], solution: 'def finde(liste, ziel):\n    for i in range(len(liste)):\n        if liste[i] == ziel:\n            return i\n    return -1\n\nprint(finde([3, 9, 27, 81], 27))\nprint(finde([3, 9, 27, 81], 5))' }),
        ],
      },
      {
        id: 'py10-3',
        title: 'Sortieren',
        goal: 'Sortieren mit sorted() und einen eigenen Sortieralgorithmus.',
        steps: [
          concept('Ordnung schaffen',
            '`sorted(liste)` gibt eine sortierte Kopie zurück, `liste.sort()` sortiert die Liste selbst. Mit `key=` bestimmst du, wonach sortiert wird, mit `reverse=True` andersherum.\n\nIm Inneren steckt ein Sortieralgorithmus. Der einfachste ist **Bubble Sort**: Vergleiche immer zwei Nachbarn und tausche sie, wenn sie falsch herum stehen. Wiederhole das, bis nichts mehr getauscht wird.',
            { code: 'woerter = ["Kiwi", "Ei", "Banane"]\nprint(sorted(woerter, key=len))\nprint(sorted([3, 1, 2], reverse=True))', console: "['Ei', 'Kiwi', 'Banane']\n[3, 2, 1]" }),
          predict('Was gibt diese Zeile aus?', 'print(sorted([5, 2, 9, 1]))', '[1, 2, 5, 9]'),
          mc('Wie tauschst du in Python `a` und `b` in einer Zeile?', ['a, b = b, a', 'a = b = a', 'swap(a, b)', 'a <-> b'], 0, null, { codeOptions: true }),
          write('Schreib Bubble Sort selbst, ohne `sorted()` und `.sort()`. Sortiere `zahlen = [9, 2, 5, 1]` und gib die Liste aus.',
            'zahlen = [9, 2, 5, 1]\n',
            { expect: '[1, 2, 5, 9]', mustNot: [[/sorted\s*\(|\.sort\s*\(/, 'Bau das Sortieren selbst, ohne `sorted()` oder `.sort()`.']], must: [[/\bfor\b[\s\S]*\bfor\b|\bwhile\b[\s\S]*\bfor\b/, 'Bubble Sort braucht zwei Schleifen: eine für die Durchgänge, eine für die Nachbarn.']], solution: 'zahlen = [9, 2, 5, 1]\nfor durchgang in range(len(zahlen)):\n    for i in range(len(zahlen) - 1):\n        if zahlen[i] > zahlen[i + 1]:\n            zahlen[i], zahlen[i + 1] = zahlen[i + 1], zahlen[i]\nprint(zahlen)' }),
        ],
      },
    ],
  },

  /* ------------------------------------------------------------ 11 */
  {
    id: 'py11',
    title: 'Spiele mit Python',
    summary: 'Spiel-Logik in der Konsole, Fenster mit pygame und die Brücke zur Godot-Engine.',
    lessons: [
      {
        id: 'py11-1',
        title: 'Rundenkampf',
        goal: 'Eine Spielschleife mit Zuständen in der Konsole bauen.',
        steps: [
          concept('Spiel-Logik ohne Grafik',
            'Jedes Spiel ist im Kern eine **Schleife**, die den Zustand der Welt Schritt für Schritt verändert. Grafik ist nur die Anzeige dieses Zustands.\n\nEin rundenbasierter Kampf: Solange beide leben, schlägt erst der Held zu, dann der Gegner, falls er noch lebt.',
            { code: 'held, gegner = 20, 12\nrunde = 0\nwhile held > 0 and gegner > 0:\n    runde += 1\n    gegner = max(0, gegner - 7)\n    if gegner > 0:\n        held -= 4\n    print(f"Runde {runde}: Held {held}, Gegner {gegner}")', console: 'Runde 1: Held 16, Gegner 5\nRunde 2: Held 16, Gegner 0' }),
          mc('Warum steht im Beispiel `if gegner > 0:` vor dem Gegenangriff?', ['Ein besiegter Gegner darf nicht mehr zuschlagen', 'Damit die Schleife schneller ist', 'Sonst gibt es einen Syntaxfehler', 'Das ist überflüssig'], 0),
          write('Held: 30 HP, schlägt 8 zu. Gegner: 25 HP, schlägt 5 zu. Held zuerst, Gegner kontert nur, wenn er noch lebt, HP nie unter 0. Gib pro Runde `Runde N: Held X, Gegner Y` aus und am Ende `Sieg!`, wenn der Gegner bei 0 ist, sonst `Niederlage`.',
            'held = 30\ngegner = 25\n',
            { expect: 'Runde 1: Held 25, Gegner 17\nRunde 2: Held 20, Gegner 9\nRunde 3: Held 15, Gegner 1\nRunde 4: Held 15, Gegner 0\nSieg!', must: [[/\bwhile\b/, 'Nutze eine `while`-Schleife als Spielschleife.']], solution: 'held = 30\ngegner = 25\nrunde = 0\nwhile held > 0 and gegner > 0:\n    runde += 1\n    gegner = max(0, gegner - 8)\n    if gegner > 0:\n        held = max(0, held - 5)\n    print(f"Runde {runde}: Held {held}, Gegner {gegner}")\nif gegner == 0:\n    print("Sieg!")\nelse:\n    print("Niederlage")' }),
          predict('Was gibt dieses Programm aus?', 'zustand = "menue"\nfor taste in ["start", "pause", "start"]:\n    if taste == "start":\n        zustand = "spiel"\n    elif taste == "pause":\n        zustand = "pause"\n    print(zustand)', 'spiel\npause\nspiel', 'So arbeiten Zustandsautomaten: Eine Variable merkt sich, in welchem Zustand das Spiel gerade ist.'),
        ],
      },
      {
        id: 'py11-2',
        title: 'Fenster mit pygame',
        goal: 'Den Aufbau eines pygame-Spiels verstehen.',
        steps: [
          concept('pygame',
            '**pygame** ist eine Bibliothek für 2D-Spiele in Python. Installieren im Terminal: `pip install pygame`. Danach läuft der Code in VS Code, nicht hier in Laufzeit, weil er ein echtes Fenster öffnet.\n\nDer Aufbau ist immer der Game-Loop: Ereignisse lesen, Welt aktualisieren, zeichnen, Bild anzeigen.',
            { code: 'import pygame\n\npygame.init()\nfenster = pygame.display.set_mode((640, 480))\nuhr = pygame.time.Clock()\nx = 50\nlaeuft = True\n\nwhile laeuft:\n    for event in pygame.event.get():\n        if event.type == pygame.QUIT:\n            laeuft = False\n    x += 2\n    fenster.fill((30, 30, 40))\n    pygame.draw.circle(fenster, (255, 200, 0), (x, 240), 20)\n    pygame.display.flip()\n    uhr.tick(60)\n\npygame.quit()' }),
          order('Bring einen Frame des pygame-Loops in die richtige Reihenfolge.',
            ['for event in pygame.event.get():', '    if event.type == pygame.QUIT:', '        laeuft = False', 'x += 2', 'fenster.fill((30, 30, 40))', 'pygame.display.flip()'],
            'Erst Ereignisse, dann Update, dann zeichnen, ganz am Ende das fertige Bild anzeigen.'),
          mc('Was macht `uhr.tick(60)`?', ['Begrenzt das Spiel auf 60 Bilder pro Sekunde', 'Wartet 60 Sekunden', 'Zählt bis 60', 'Spielt einen Ton'], 0),
          fill('Zeig das fertig gezeichnete Bild an.', 'pygame.display.⟦0⟧()', ['flip'], ['flip', 'show', 'print', 'draw']),
          write('Schreib das Gerüst eines pygame-Programms: `pygame.init()`, ein Fenster mit `set_mode`, eine `while`-Schleife mit Ereignis-Abfrage auf `pygame.QUIT` und `pygame.display.flip()`.\n\nDieser Code wird nur auf die Bausteine geprüft, nicht gestartet.',
            'import pygame\n\n',
            { run: false, must: [[/pygame\.init\s*\(/, 'Starte mit `pygame.init()`.'], [/set_mode\s*\(/, 'Öffne ein Fenster mit `pygame.display.set_mode((640, 480))`.'], [/\bwhile\b/, 'Der Game-Loop ist eine `while`-Schleife.'], [/pygame\.event\.get\s*\(/, 'Lies die Ereignisse mit `pygame.event.get()`.'], [/pygame\.QUIT/, 'Prüfe auf `pygame.QUIT`, damit das Fenster sich schließen lässt.'], [/display\.flip\s*\(/, 'Zeig das Bild mit `pygame.display.flip()` an.']], solution: 'import pygame\n\npygame.init()\nfenster = pygame.display.set_mode((640, 480))\nlaeuft = True\nwhile laeuft:\n    for event in pygame.event.get():\n        if event.type == pygame.QUIT:\n            laeuft = False\n    fenster.fill((0, 0, 0))\n    pygame.display.flip()\npygame.quit()', explain: 'Probier es in VS Code aus: `pip install pygame`, Datei speichern, starten.' }),
        ],
      },
      {
        id: 'py11-3',
        title: 'Delta-Time und Godot',
        goal: 'Bewegung unabhängig von der Bildrate und der Weg zu GDScript.',
        steps: [
          concept('Delta-Time',
            'Läuft ein Spiel auf einem PC mit 30, auf einem anderen mit 144 Bildern pro Sekunde, wäre eine Figur mit `x += 2` unterschiedlich schnell. Die Lösung: **Delta-Time**, die Zeit seit dem letzten Frame in Sekunden.\n\n`x += tempo * dt` bewegt die Figur um `tempo` Einheiten **pro Sekunde**, egal wie schnell der PC ist.',
            { code: 'tempo = 100      # Einheiten pro Sekunde\nx = 0.0\nfor dt in [0.5, 0.25, 0.25]:\n    x += tempo * dt\n    print(x)', console: '50.0\n75.0\n100.0' }),
          concept('GDScript in Godot',
            'Die Engine **Godot** nutzt GDScript, das fast wie Python aussieht. Die Funktion `_process(delta)` ruft Godot in jedem Frame auf, `delta` ist genau die Delta-Time von eben.',
            { code: 'extends Sprite2D\n\nvar tempo = 200\n\nfunc _process(delta):\n    if Input.is_action_pressed("ui_right"):\n        position.x += tempo * delta' }),
          mc('Was ist `delta` in `_process(delta)`?', ['Die Zeit seit dem letzten Frame in Sekunden', 'Die Anzahl der Frames', 'Die Geschwindigkeit', 'Die Position'], 0),
          mc('Ein Gegner soll 300 Einheiten pro Sekunde fliegen. Welche Zeile ist richtig?', ['x += 300 * dt', 'x += 300', 'x += dt', 'x = 300 / dt'], 0, null, { codeOptions: true }),
          write('Simuliere eine Rakete mit `tempo = 80`, die bei `y = 0.0` startet. Die Frames dauerten `[0.5, 0.5, 0.25]` Sekunden. Gib nach jedem Frame `y` aus.',
            'tempo = 80\ny = 0.0\n',
            { expect: '40.0\n80.0\n100.0', must: [[/\*\s*dt|dt\s*\*/, 'Rechne mit `tempo * dt`.'], [/\bfor\b/, 'Lauf mit `for dt in [...]` über die Frames.']], solution: 'tempo = 80\ny = 0.0\nfor dt in [0.5, 0.5, 0.25]:\n    y += tempo * dt\n    print(y)', explain: 'Genau dieses Prinzip steckt in Godot, Unity und Unreal. Damit hast du den Python-Pfad komplett.' }),
        ],
      },
    ],
  },
];
