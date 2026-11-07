// C++ Abschnitt 9 bis 11: Klassen, Vererbung und Polymorphie, Game-Dev-Mathe

import { concept, mc, predict, fill, order, fix, write, cppFile } from './helpers.js';

export const cppUnits9to11 = [
  /* ------------------------------------------------------------ 9 */
  {
    id: 'cpp9',
    title: 'Klassen und Objekte',
    summary: 'Eigene Typen mit struct und class, Konstruktoren, Methoden und Kapselung.',
    lessons: [
      {
        id: 'cpp9-1',
        title: 'struct und class',
        goal: 'Zusammengehörige Daten in einem eigenen Typ bündeln.',
        steps: [
          concept('Eigene Typen',
            'Mit `struct` fasst du Daten zu einem eigenen Typ zusammen, z. B. einen Spieler mit Name und HP. Auf die Mitglieder greifst du mit `.` zu.\n\n`class` ist fast dasselbe. Einziger Unterschied: Bei `struct` ist alles standardmäßig `public` (von außen sichtbar), bei `class` `private`. Merke: `struct` für einfache Daten, `class` für Objekte mit Verhalten.\n\nWichtig: Nach der schließenden Klammer kommt ein **Semikolon**.',
            {
              code: 'struct Spieler {\n    std::string name;\n    int hp;\n};\n\nSpieler s;\ns.name = "Alex";\ns.hp = 100;',
              compare: { python: 'class Spieler:\n    def __init__(self):\n        self.name = ""\n        self.hp = 0\n\ns = Spieler()\ns.name = "Alex"\ns.hp = 100' },
            }),
          mc('Was ist der Unterschied zwischen `struct` und `class`?', ['Bei struct ist alles standardmäßig public, bei class private', 'class ist schneller', 'struct kann keine Funktionen haben', 'Es gibt keinen'], 0),
          fix('Der Compiler meckert über die struct. Repariere sie.',
            cppFile('struct Item {\n    std::string name;\n    int wert;\n}', 'Item i;\ni.name = "Trank";\ni.wert = 5;\nstd::cout << i.name << ": " << i.wert << std::endl;', ['iostream', 'string']),
            { expect: 'Trank: 5', solution: cppFile('struct Item {\n    std::string name;\n    int wert;\n};', 'Item i;\ni.name = "Trank";\ni.wert = 5;\nstd::cout << i.name << ": " << i.wert << std::endl;', ['iostream', 'string']), explain: 'Das Semikolon nach der struct wird am häufigsten vergessen.' }),
          write('Lege `struct Spieler` mit `std::string name` und `int hp` an. Erzeuge einen Spieler Alex mit 100 HP und gib `Alex: 100` aus.',
            cppFile('', '', ['iostream', 'string']),
            { expect: 'Alex: 100', must: [[/struct\s+Spieler/, 'Lege `struct Spieler { ... };` an.'], [/\.\s*hp/, 'Greif mit `.hp` auf die Lebenspunkte zu.']], solution: cppFile('struct Spieler {\n    std::string name;\n    int hp;\n};', 'Spieler s;\ns.name = "Alex";\ns.hp = 100;\nstd::cout << s.name << ": " << s.hp << std::endl;', ['iostream', 'string']) }),
        ],
      },
      {
        id: 'cpp9-2',
        title: 'Konstruktoren und Methoden',
        goal: 'Objekte sauber starten und ihnen Verhalten geben.',
        steps: [
          concept('Startwerte und Fähigkeiten',
            'Der **Konstruktor** heißt wie die Klasse und hat keinen Rückgabetyp. Mit der **Initialisierungsliste** `: hp(start)` setzt du Startwerte direkt.\n\n**Methoden** sind Funktionen in der Klasse. Sie greifen direkt auf die Mitglieder zu, ohne `self`. Methoden, die nichts ändern, markierst du mit `const`.',
            { code: 'class Gegner {\npublic:\n    Gegner(int start) : hp(start) {}\n\n    void treffer(int schaden) {\n        hp -= schaden;\n        if (hp < 0) hp = 0;\n    }\n\n    int getHp() const { return hp; }\n\nprivate:\n    int hp;\n};' }),
          predict('Was gibt dieser Code aus?', cppFile('class Zaehler {\npublic:\n    Zaehler() : wert(10) {}\n    void plus() { wert++; }\n    int get() const { return wert; }\nprivate:\n    int wert;\n};', 'Zaehler z;\nz.plus();\nz.plus();\nstd::cout << z.get() << std::endl;'), '12'),
          mc('Welchen Rückgabetyp hat ein Konstruktor?', ['Keinen, nicht einmal void', 'void', 'int', 'Den Typ der Klasse'], 0),
          write('Schreib `class Gegner` mit privatem `int hp`, einem Konstruktor `Gegner(int start)`, der Methode `void treffer(int schaden)` (hp nie unter 0) und `int getHp() const`. In main: Gegner mit 40 HP, Treffer 15, hp ausgeben, Treffer 50, hp ausgeben.',
            cppFile('', ''),
            { expect: '25\n0', must: [[/class\s+Gegner/, 'Lege `class Gegner` an.'], [/Gegner\s*\(\s*int\s+\w+\s*\)/, 'Der Konstruktor heißt `Gegner(int start)`.'], [/void\s+treffer\s*\(/, 'Lege `void treffer(int schaden)` an.'], [/private\s*:/, 'hp gehört in den `private:`-Bereich.']], solution: cppFile('class Gegner {\npublic:\n    Gegner(int start) : hp(start) {}\n\n    void treffer(int schaden) {\n        hp -= schaden;\n        if (hp < 0) hp = 0;\n    }\n\n    int getHp() const { return hp; }\n\nprivate:\n    int hp;\n};', 'Gegner g(40);\ng.treffer(15);\nstd::cout << g.getHp() << std::endl;\ng.treffer(50);\nstd::cout << g.getHp() << std::endl;') }),
        ],
      },
      {
        id: 'cpp9-3',
        title: 'Kapselung',
        goal: 'Verstehen, warum Daten private sind.',
        steps: [
          concept('Schutz vor Unsinn',
            '**Kapselung** heißt: Die Daten sind `private`, von außen kommt man nur über Methoden heran. So kann niemand aus Versehen `hp = -5000` setzen. Die Methode prüft und bleibt die einzige Tür.\n\nZugriffe auf private Mitglieder von außen verbietet der Compiler.',
            { code: 'class Konto {\npublic:\n    void einzahlen(int betrag) {\n        if (betrag > 0) stand += betrag;\n    }\n    int getStand() const { return stand; }\nprivate:\n    int stand = 0;\n};' }),
          mc('Was passiert bei `konto.stand = 100;`, wenn `stand` private ist?', ['Compiler-Fehler', 'stand wird 100', 'stand bleibt unverändert, ohne Meldung', 'Absturz beim Start'], 0),
          fix('main greift direkt auf ein privates Mitglied zu. Nutze stattdessen die Methode der Klasse.',
            cppFile('class Held {\npublic:\n    int getLevel() const { return level; }\nprivate:\n    int level = 3;\n};', 'Held h;\nstd::cout << "Level " << h.level << std::endl;'),
            { expect: 'Level 3', must: [[/getLevel\s*\(\s*\)/, 'Nutze `h.getLevel()`.']], solution: cppFile('class Held {\npublic:\n    int getLevel() const { return level; }\nprivate:\n    int level = 3;\n};', 'Held h;\nstd::cout << "Level " << h.getLevel() << std::endl;') }),
          mc('Was bedeutet `const` hinter `int getLevel() const`?', ['Die Methode ändert das Objekt nicht', 'Das Ergebnis ist immer gleich', 'Die Methode ist privat', 'Sie darf nur einmal laufen'], 0),
        ],
      },
    ],
  },

  /* ------------------------------------------------------------ 10 */
  {
    id: 'cpp10',
    title: 'Vererbung und Polymorphie',
    summary: 'Basisklassen, virtual und override: das Prinzip hinter Actor, Pawn und Character in Unreal.',
    lessons: [
      {
        id: 'cpp10-1',
        title: 'Vererbung',
        goal: 'Eine Klasse von einer anderen ableiten.',
        steps: [
          concept('Erben',
            '`class Boss : public Gegner` heißt: Boss erbt alles Öffentliche von Gegner. `protected` Mitglieder sind für abgeleitete Klassen sichtbar, aber nicht von außen.\n\nIn Unreal erbt dein Gegner zum Beispiel von `ACharacter`, der von `APawn` erbt, der von `AActor` erbt.',
            { code: 'class Figur {\npublic:\n    void vorstellen() const {\n        std::cout << "Ich bin " << name << std::endl;\n    }\nprotected:\n    std::string name = "Figur";\n};\n\nclass Ritter : public Figur {\npublic:\n    Ritter() { name = "Ritter"; }\n};' }),
          predict('Was gibt dieser Code aus?', cppFile('class A {\npublic:\n    int wert() const { return 1; }\n};\n\nclass B : public A {};', 'B b;\nstd::cout << b.wert() << std::endl;'), '1'),
          mc('Wer darf auf `protected`-Mitglieder zugreifen?', ['Die Klasse selbst und abgeleitete Klassen', 'Jeder', 'Nur main', 'Niemand'], 0),
          write('Lege `class Figur` mit `protected: std::string name;` und der Methode `void vorstellen() const` an, die `Ich bin NAME` ausgibt. Leite `class Ritter : public Figur` ab, deren Konstruktor `name = "Ritter"` setzt. Erzeuge einen Ritter und ruf `vorstellen()` auf.',
            cppFile('', '', ['iostream', 'string']),
            { expect: 'Ich bin Ritter', must: [[/class\s+Ritter\s*:\s*public\s+Figur/, 'Leite ab mit `class Ritter : public Figur`.'], [/protected\s*:/, 'name gehört in `protected:`.']], solution: cppFile('class Figur {\npublic:\n    void vorstellen() const {\n        std::cout << "Ich bin " << name << std::endl;\n    }\nprotected:\n    std::string name;\n};\n\nclass Ritter : public Figur {\npublic:\n    Ritter() { name = "Ritter"; }\n};', 'Ritter r;\nr.vorstellen();', ['iostream', 'string']) }),
        ],
      },
      {
        id: 'cpp10-2',
        title: 'virtual und override',
        goal: 'Über eine Basisklasse die richtige Methode aufrufen.',
        steps: [
          concept('Polymorphie',
            'Du willst alle Gegner in **einer** Liste haben und jedem sagen "greif an". Jeder soll aber auf seine Art angreifen. Dafür:\n\n- In der Basisklasse: `virtual`\n- In der abgeleiteten Klasse: `override`\n- Die Liste speichert Pointer auf die Basisklasse, z. B. `std::vector<std::unique_ptr<Gegner>>`\n\nOhne `virtual` würde immer die Methode der Basisklasse laufen.',
            { code: 'class Gegner {\npublic:\n    virtual ~Gegner() = default;\n    virtual std::string geraeusch() const { return "..."; }\n};\n\nclass Ork : public Gegner {\npublic:\n    std::string geraeusch() const override { return "Grrr"; }\n};' }),
          mc('Wozu dient `override`?', ['Der Compiler prüft, dass wirklich eine virtuelle Methode überschrieben wird', 'Es macht die Methode schneller', 'Es löscht die Basismethode', 'Es ist Pflicht für jede Methode'], 0,
            'Vertippst du dich im Namen, meldet der Compiler dank override einen Fehler, statt still eine neue Methode anzulegen.'),
          mc('Warum hat die Basisklasse `virtual ~Gegner() = default;`?', ['Damit beim Löschen über einen Basis-Pointer auch der richtige Destruktor läuft', 'Damit man keine Gegner erzeugen kann', 'Für schnellere Kompilierung', 'Das ist nur Stil'], 0),
          write('Basisklasse `Gegner` mit `virtual std::string geraeusch() const`, abgeleitet `Ork` (`"Grrr"`) und `Geist` (`"Huuu"`). Speichere je einen in einem `std::vector<std::unique_ptr<Gegner>>` und gib in einer Schleife alle Geräusche aus.',
            cppFile('', '', ['iostream', 'memory', 'string', 'vector']),
            { expect: 'Grrr\nHuuu', must: [[/virtual/, 'Die Basismethode braucht `virtual`.'], [/override/, 'Markiere die überschriebenen Methoden mit `override`.'], [/vector\s*<\s*std::unique_ptr\s*<\s*Gegner\s*>\s*>/, 'Nutze `std::vector<std::unique_ptr<Gegner>>`.']], solution: cppFile('class Gegner {\npublic:\n    virtual ~Gegner() = default;\n    virtual std::string geraeusch() const { return "..."; }\n};\n\nclass Ork : public Gegner {\npublic:\n    std::string geraeusch() const override { return "Grrr"; }\n};\n\nclass Geist : public Gegner {\npublic:\n    std::string geraeusch() const override { return "Huuu"; }\n};', 'std::vector<std::unique_ptr<Gegner>> horde;\nhorde.push_back(std::make_unique<Ork>());\nhorde.push_back(std::make_unique<Geist>());\nfor (const auto& g : horde) {\n    std::cout << g->geraeusch() << std::endl;\n}', ['iostream', 'memory', 'string', 'vector']) }),
        ],
      },
      {
        id: 'cpp10-3',
        title: 'Abstrakte Klassen',
        goal: 'Schnittstellen mit rein virtuellen Methoden festlegen.',
        steps: [
          concept('Nur ein Versprechen',
            'Eine **rein virtuelle** Methode `virtual double flaeche() const = 0;` hat keinen Rumpf. Eine Klasse damit ist **abstrakt**: Man kann keine Objekte von ihr erzeugen, nur von abgeleiteten Klassen, die die Methode umsetzen.\n\nSo legt man fest: "Jede Form **muss** ihre Fläche berechnen können."',
            { code: 'class Form {\npublic:\n    virtual ~Form() = default;\n    virtual int flaeche() const = 0;\n};' }),
          mc('Was passiert bei `Form f;`, wenn Form abstrakt ist?', ['Compiler-Fehler', 'Ein leeres Objekt entsteht', 'flaeche gibt 0 zurück', 'Absturz'], 0),
          fill('Mach die Methode rein virtuell.', 'class Waffe {\npublic:\n    ⟦0⟧ int schaden() const ⟦1⟧;\n};', ['virtual', '= 0'], ['virtual', '= 0', 'override', 'static']),
          write('Abstrakte Klasse `Form` mit `virtual int flaeche() const = 0;`. Leite `Rechteck(int b, int h)` und `Quadrat(int s)` ab. Gib die Fläche von Rechteck(3, 4) und Quadrat(5) über einen `const Form&` aus, mit einer Funktion `void zeige(const Form& f)`.',
            cppFile('', ''),
            { expect: '12\n25', must: [[/=\s*0\s*;/, 'Die Methode in Form ist rein virtuell: `= 0;`.'], [/void\s+zeige\s*\(\s*const\s+Form\s*&/, 'Lege `void zeige(const Form& f)` an.']], solution: cppFile('class Form {\npublic:\n    virtual ~Form() = default;\n    virtual int flaeche() const = 0;\n};\n\nclass Rechteck : public Form {\npublic:\n    Rechteck(int b, int h) : b(b), h(h) {}\n    int flaeche() const override { return b * h; }\nprivate:\n    int b, h;\n};\n\nclass Quadrat : public Form {\npublic:\n    Quadrat(int s) : s(s) {}\n    int flaeche() const override { return s * s; }\nprivate:\n    int s;\n};\n\nvoid zeige(const Form& f) {\n    std::cout << f.flaeche() << std::endl;\n}', 'zeige(Rechteck(3, 4));\nzeige(Quadrat(5));') }),
        ],
      },
    ],
  },

  /* ------------------------------------------------------------ 11 */
  {
    id: 'cpp11',
    title: 'Game-Dev-Mathe',
    summary: 'Vektoren, Delta-Time und Kollision: die Mathematik, die in jedem Spiel steckt.',
    lessons: [
      {
        id: 'cpp11-1',
        title: 'Vektoren',
        goal: 'Positionen und Richtungen als 2D-Vektor rechnen.',
        steps: [
          concept('Pfeile im Raum',
            'Ein **Vektor** besteht aus x und y (in 3D noch z). Er beschreibt eine Position oder eine Richtung mit Länge. Unreal nennt ihn `FVector`.\n\n- Addieren: `(1, 2) + (3, 4) = (4, 6)`, z. B. Position plus Bewegung\n- Länge: `sqrt(x*x + y*y)`, z. B. Abstand zum Gegner\n\nMit **Operator-Überladung** kannst du `+` für eigene Typen definieren.',
            { code: 'struct Vec2 {\n    double x, y;\n};\n\nVec2 operator+(Vec2 a, Vec2 b) {\n    return {a.x + b.x, a.y + b.y};\n}\n\ndouble laenge(Vec2 v) {\n    return std::sqrt(v.x * v.x + v.y * v.y);\n}' }),
          predict('Ein Vektor (3, 4). Wie lang ist er?', 'Vec2 v{3, 4};\nstd::cout << laenge(v) << std::endl;', '5', 'sqrt(9 + 16) = sqrt(25) = 5. Das berühmte 3-4-5-Dreieck.'),
          mc('Die Figur steht bei (2, 5) und läuft um (1, -2). Wo steht sie danach?', ['(3, 3)', '(1, 7)', '(2, -10)', '(3, 7)'], 0),
          write('Lege `struct Vec2 { double x, y; };` an, dazu `operator+` und `double laenge(Vec2 v)` (mit `std::sqrt` aus `<cmath>`). Gib `(1, 2) + (3, 4)` als `(4, 6)` aus und in der nächsten Zeile die Länge von `(3, 4)`.',
            cppFile('', '', ['iostream', 'cmath']),
            { expect: '(4, 6)\n5', must: [[/operator\s*\+/, 'Überlade `operator+`.'], [/sqrt/, 'Die Länge braucht `std::sqrt`.']], solution: cppFile('struct Vec2 {\n    double x, y;\n};\n\nVec2 operator+(Vec2 a, Vec2 b) {\n    return {a.x + b.x, a.y + b.y};\n}\n\ndouble laenge(Vec2 v) {\n    return std::sqrt(v.x * v.x + v.y * v.y);\n}', 'Vec2 s = Vec2{1, 2} + Vec2{3, 4};\nstd::cout << "(" << s.x << ", " << s.y << ")" << std::endl;\nstd::cout << laenge(Vec2{3, 4}) << std::endl;', ['iostream', 'cmath']) }),
        ],
      },
      {
        id: 'cpp11-2',
        title: 'Delta-Time',
        goal: 'Bewegung unabhängig von der Bildrate berechnen.',
        steps: [
          concept('Gleich schnell auf jedem PC',
            'Ohne Delta-Time läuft dein Spiel auf schnellen PCs schneller. Mit `position += tempo * dt` bewegt sich alles **pro Sekunde** gleich weit. `dt` ist die Zeit seit dem letzten Frame, bei 60 FPS also etwa 0.0167 Sekunden.\n\nIn Unreal heißt dt `DeltaTime`, in Raylib liefert es `GetFrameTime()`.',
            { code: 'double x = 0;\ndouble tempo = 100;   // Einheiten pro Sekunde\ndouble frames[] = {0.5, 0.25, 0.25};\nfor (double dt : frames) {\n    x += tempo * dt;\n    std::cout << x << std::endl;\n}', console: '50\n75\n100' }),
          mc('Ein PC läuft mit 30 FPS, ein anderer mit 120. Wie weit kommt die Figur mit `x += 200 * dt` in einer Sekunde?', ['Auf beiden 200 Einheiten', 'Auf dem schnellen 4-mal weiter', 'Auf dem langsamen weiter', 'Das kommt auf die Grafikkarte an'], 0),
          predict('Was gibt dieser Code aus?', 'double y = 10;\ndouble fall = 20;\ny -= fall * 0.25;\nstd::cout << y << std::endl;', '5'),
          write('Ein Projektil fliegt mit `tempo = 300`. Die Frames dauerten 0.1, 0.2 und 0.1 Sekunden. Starte bei `x = 0` und gib nach jedem Frame x aus.',
            cppFile('', 'double x = 0;\ndouble tempo = 300;\n'),
            { expect: '30\n90\n120', must: [[/\*\s*dt|dt\s*\*/, 'Rechne mit `tempo * dt`.'], [/for\s*\(/, 'Lauf mit einer Schleife über die Frame-Zeiten.']], solution: cppFile('', 'double x = 0;\ndouble tempo = 300;\ndouble frames[] = {0.1, 0.2, 0.1};\nfor (double dt : frames) {\n    x += tempo * dt;\n    std::cout << x << std::endl;\n}') }),
        ],
      },
      {
        id: 'cpp11-3',
        title: 'Kollision',
        goal: 'Prüfen, ob sich zwei Rechtecke überschneiden.',
        steps: [
          concept('AABB',
            'Die einfachste Kollision: zwei achsenparallele Rechtecke (**AABB**, Axis-Aligned Bounding Box). Sie überschneiden sich genau dann, wenn sie sich auf der x-Achse **und** auf der y-Achse überlappen.',
            { code: 'struct Rect {\n    double x, y, w, h;\n};\n\nbool kollidiert(Rect a, Rect b) {\n    return a.x < b.x + b.w && a.x + a.w > b.x &&\n           a.y < b.y + b.h && a.y + a.h > b.y;\n}' }),
          mc('Rechteck A: x von 0 bis 10. Rechteck B: x von 12 bis 20. Kann es eine Kollision geben?', ['Nein, auf der x-Achse überlappen sie nicht', 'Ja, immer', 'Nur wenn sie gleich hoch sind', 'Das hängt von y ab'], 0),
          order('Bau die Kollisionsprüfung zusammen.',
            ['bool kollidiert(Rect a, Rect b) {', '    bool xUeber = a.x < b.x + b.w && a.x + a.w > b.x;', '    bool yUeber = a.y < b.y + b.h && a.y + a.h > b.y;', '    return xUeber && yUeber;', '}']),
          write('Schreib `struct Rect` und `bool kollidiert(Rect a, Rect b)`. Teste `{0, 0, 10, 10}` gegen `{5, 5, 10, 10}` und `{0, 0, 10, 10}` gegen `{20, 0, 5, 5}` und gib beide Ergebnisse aus.',
            cppFile('', ''),
            { expect: '1\n0', must: [[/bool\s+kollidiert\s*\(/, 'Lege `bool kollidiert(Rect a, Rect b)` an.'], [/&&/, 'Beide Achsen müssen überlappen: `&&`.']], solution: cppFile('struct Rect {\n    double x, y, w, h;\n};\n\nbool kollidiert(Rect a, Rect b) {\n    return a.x < b.x + b.w && a.x + a.w > b.x &&\n           a.y < b.y + b.h && a.y + a.h > b.y;\n}', 'std::cout << kollidiert({0, 0, 10, 10}, {5, 5, 10, 10}) << std::endl;\nstd::cout << kollidiert({0, 0, 10, 10}, {20, 0, 5, 5}) << std::endl;') }),
        ],
      },
    ],
  },
];
