// C++ Abschnitt 15 bis 19 (Profi): Rekursion und eigene Datenstrukturen, STL-Container,
// RAII und Move, Spielarchitektur, KI fuer Spiele

import { concept, mc, predict, fill, order, write, cppFile } from './helpers.js';

export const cppUnits15to19 = [
  /* ------------------------------------------------------------ 15 */
  {
    id: 'cpp15',
    title: 'Rekursion und eigene Datenstrukturen',
    summary: 'Rekursive Funktionen, eine verkettete Liste mit Pointern und ein eigener Stack als Template.',
    lessons: [
      {
        id: 'cpp15-1',
        title: 'Rekursion in C++',
        goal: 'Rekursive Funktionen schreiben und den Aufrufstapel verstehen.',
        steps: [
          concept('Der Aufrufstapel',
            'Jeder Funktionsaufruf bekommt ein eigenes Fach auf dem **Stack** mit seinen lokalen Variablen. Bei Rekursion stapeln sich diese Fächer, bis der Basisfall erreicht ist, dann werden sie von oben wieder abgebaut.\n\nZu tiefe Rekursion sprengt den Stack: **Stack Overflow**. Der Name der bekannten Webseite kommt genau daher.',
            { code: 'int fakultaet(int n) {\n    if (n <= 1) return 1;        // Basisfall\n    return n * fakultaet(n - 1); // Rekursionsschritt\n}', flow: ['fakultaet(3)', 'fakultaet(2)', 'fakultaet(1) = 1', '2 * 1 = 2', '3 * 2 = 6'] }),
          predict('Was gibt dieser Code aus?', cppFile('int potenz(int b, int e) {\n    if (e == 0) return 1;\n    return b * potenz(b, e - 1);\n}', 'std::cout << potenz(2, 5) << std::endl;'), '32'),
          mc('Was ist ein Stack Overflow?', ['Zu viele verschachtelte Aufrufe, der Stack-Speicher ist voll', 'Ein zu großes Array im Heap', 'Ein Fehler beim Kompilieren', 'Eine Webseite, sonst nichts'], 0),
          write('Schreib `int fib(int n)` rekursiv und gib `fib(10)` aus.',
            cppFile('', ''),
            { expect: '55', must: [[/int\s+fib\s*\(\s*int/, 'Lege `int fib(int n)` an.'], [/fib\s*\(\s*n\s*-\s*1\s*\)/, 'Ruf `fib(n - 1)` rekursiv auf.']], solution: cppFile('int fib(int n) {\n    if (n < 2) return n;\n    return fib(n - 1) + fib(n - 2);\n}', 'std::cout << fib(10) << std::endl;') }),
        ],
      },
      {
        id: 'cpp15-2',
        title: 'Verkettete Liste',
        goal: 'Eine Datenstruktur aus Knoten und Pointern selbst bauen.',
        steps: [
          concept('Knoten, die aufeinander zeigen',
            'Eine **verkettete Liste** besteht aus Knoten. Jeder speichert einen Wert und einen Pointer auf den nächsten. Der letzte zeigt auf `nullptr`.\n\nVorteil: Einfügen am Anfang ist O(1). Nachteil: Die Knoten liegen verstreut im Speicher, darum ist sie für den Prozessor meist langsamer als `std::vector`. Du baust sie trotzdem einmal selbst, weil sie Pointer perfekt trainiert und in Vorstellungsgesprächen gern gefragt wird.',
            {
              code: 'struct Knoten {\n    int wert;\n    std::unique_ptr<Knoten> next;\n};',
              memory: [
                { name: 'kopf', type: 'Knoten', value: '1 | next', kind: 'heap' }, { arrow: '->' },
                { name: '', type: 'Knoten', value: '2 | next', kind: 'heap' }, { arrow: '->' },
                { name: '', type: 'Knoten', value: '3 | nullptr', kind: 'heap' },
              ],
              memoryCaption: 'Mit unique_ptr räumt jeder Knoten seinen Nachfolger automatisch mit auf.',
            }),
          mc('Wie erkennst du das Ende einer verketteten Liste?', ['next ist nullptr', 'Der Wert ist 0', 'Es gibt kein Ende', 'An der Größe'], 0),
          order('Lauf über die Liste und gib jeden Wert aus.',
            ['Knoten* aktuell = kopf.get();', 'while (aktuell != nullptr) {', '    std::cout << aktuell->wert << std::endl;', '    aktuell = aktuell->next.get();', '}']),
          write('Baue mit `struct Knoten { int wert; std::unique_ptr<Knoten> next; };` eine Liste 1 -> 2 -> 3 und gib die Werte in einer while-Schleife aus, jeden in einer eigenen Zeile.',
            cppFile('struct Knoten {\n    int wert;\n    std::unique_ptr<Knoten> next;\n};', '', ['iostream', 'memory']),
            { expect: '1\n2\n3', must: [[/while\s*\(/, 'Lauf mit einer `while`-Schleife über die Knoten.'], [/->\s*next/, 'Geh mit `->next` zum nächsten Knoten.']], solution: cppFile('struct Knoten {\n    int wert;\n    std::unique_ptr<Knoten> next;\n};', 'auto kopf = std::make_unique<Knoten>(Knoten{1, nullptr});\nkopf->next = std::make_unique<Knoten>(Knoten{2, nullptr});\nkopf->next->next = std::make_unique<Knoten>(Knoten{3, nullptr});\n\nKnoten* aktuell = kopf.get();\nwhile (aktuell != nullptr) {\n    std::cout << aktuell->wert << std::endl;\n    aktuell = aktuell->next.get();\n}', ['iostream', 'memory']) }),
        ],
      },
      {
        id: 'cpp15-3',
        title: 'Eigener Stack als Template',
        goal: 'Eine wiederverwendbare Klasse für beliebige Typen schreiben.',
        steps: [
          concept('Klassen-Templates',
            'Nicht nur Funktionen, auch Klassen können Templates sein. `template <typename T> class Stapel` funktioniert dann mit `int`, `std::string` oder deinen eigenen Typen. Genau so ist `std::vector<T>` gebaut.',
            { code: 'template <typename T>\nclass Stapel {\npublic:\n    void push(const T& x) { daten.push_back(x); }\n    void pop() { daten.pop_back(); }\n    const T& top() const { return daten.back(); }\n    bool empty() const { return daten.empty(); }\nprivate:\n    std::vector<T> daten;\n};' }),
          mc('Warum `const T&` bei `push`?', ['Große Objekte werden nicht kopiert und nicht verändert', 'Damit es kürzer ist', 'Templates verlangen das', 'Damit T immer int ist'], 0),
          write('Schreib das Template `Stapel<T>` mit `push`, `pop`, `top` und `empty`. Lege einen `Stapel<std::string>` an, lege "Level 1", "Level 2", "Boss" drauf und nimm alles wieder runter, wobei du jedes oberste Element vor dem Entfernen ausgibst.',
            cppFile('', '', ['iostream', 'string', 'vector']),
            { expect: 'Boss\nLevel 2\nLevel 1', must: [[/template\s*<\s*typename\s+T\s*>\s*class\s+Stapel/, 'Beginne mit `template <typename T> class Stapel`.'], [/Stapel\s*<\s*std::string\s*>/, 'Nutze `Stapel<std::string>`.']], solution: cppFile('template <typename T>\nclass Stapel {\npublic:\n    void push(const T& x) { daten.push_back(x); }\n    void pop() { daten.pop_back(); }\n    const T& top() const { return daten.back(); }\n    bool empty() const { return daten.empty(); }\nprivate:\n    std::vector<T> daten;\n};', 'Stapel<std::string> s;\ns.push("Level 1");\ns.push("Level 2");\ns.push("Boss");\nwhile (!s.empty()) {\n    std::cout << s.top() << std::endl;\n    s.pop();\n}', ['iostream', 'string', 'vector']) }),
        ],
      },
    ],
  },

  /* ------------------------------------------------------------ 16 */
  {
    id: 'cpp16',
    title: 'STL-Container',
    summary: 'map, unordered_map, set und Iteratoren: die richtigen Container für jede Aufgabe.',
    lessons: [
      {
        id: 'cpp16-1',
        title: 'std::map',
        goal: 'Werte unter Schlüsseln speichern, sortiert.',
        steps: [
          concept('Das Dictionary von C++',
            '`std::map<Schluessel, Wert>` aus `<map>` speichert Paare und hält sie **nach Schlüssel sortiert**. Zugriff und Einfügen sind O(log n).\n\n- `m["Trank"] = 3;`: setzen (legt an, falls neu)\n- `m.count("Trank")` oder `m.contains("Trank")` (C++20): gibt es den Schlüssel?\n- `for (const auto& [name, anzahl] : m)`: alle Paare durchlaufen',
            { code: 'std::map<std::string, int> inventar;\ninventar["Trank"] = 3;\ninventar["Pfeil"] += 20;\nfor (const auto& [name, anzahl] : inventar) {\n    std::cout << name << ": " << anzahl << std::endl;\n}', console: 'Pfeil: 20\nTrank: 3', compare: { python: 'inventar = {}\ninventar["Trank"] = 3\ninventar["Pfeil"] = inventar.get("Pfeil", 0) + 20\nfor name, anzahl in sorted(inventar.items()):\n    print(f"{name}: {anzahl}")' } }),
          mc('In welcher Reihenfolge läuft eine `std::map<std::string, int>` durch?', ['Alphabetisch nach Schlüssel', 'In der Einfüge-Reihenfolge', 'Zufällig', 'Nach dem Wert'], 0),
          predict('Was gibt dieser Code aus?', 'std::map<std::string, int> hp;\nhp["Ork"] = 50;\nhp["Ork"] -= 20;\nstd::cout << hp["Ork"] << " " << hp.size() << std::endl;', '30 1'),
          write('Lies Wörter ein, bis die Eingabe zu Ende ist (`while (std::cin >> wort)`), zähle sie in einer `std::map` und gib jedes Wort mit Anzahl als `wort anzahl` aus.',
            cppFile('', '', ['iostream', 'map', 'string']),
            { tests: [{ stdin: 'ork geist ork drache ork', expect: 'drache 1\ngeist 1\nork 3' }, { stdin: 'a b a', expect: 'a 2\nb 1' }], must: [[/std::map\s*</, 'Nutze `std::map`.'], [/while\s*\(\s*std::cin\s*>>/, 'Lies mit `while (std::cin >> wort)`.']], solution: cppFile('', 'std::map<std::string, int> zaehler;\nstd::string wort;\nwhile (std::cin >> wort) {\n    zaehler[wort]++;\n}\nfor (const auto& [w, n] : zaehler) {\n    std::cout << w << " " << n << std::endl;\n}', ['iostream', 'map', 'string']) }),
        ],
      },
      {
        id: 'cpp16-2',
        title: 'unordered_map und set',
        goal: 'Hash-Container für schnelle Suche nutzen.',
        steps: [
          concept('Hashing',
            '`std::unordered_map` speichert unsortiert über eine **Hash-Funktion**. Dafür sind Suchen und Einfügen im Schnitt **O(1)**, schneller als `map`. Ideal z. B. für "welche Entity hat diese ID?".\n\n`std::set` und `std::unordered_set` speichern jeden Wert **nur einmal**. Perfekt für "Wurde dieses Feld schon besucht?".',
            { code: 'std::unordered_map<int, std::string> entities = {{7, "Spieler"}, {12, "Ork"}};\nstd::cout << entities[12] << std::endl;\n\nstd::set<int> besucht = {3, 1, 3, 2};\nstd::cout << besucht.size() << std::endl;', console: 'Ork\n3' }),
          mc('Wann `unordered_map` statt `map`?', ['Wenn die Reihenfolge egal ist und Tempo zählt', 'Wenn man sortiert ausgeben will', 'Nur für Zahlen', 'Nie'], 0),
          predict('Was gibt dieser Code aus?', 'std::set<std::string> s = {"b", "a", "b", "c"};\nfor (const auto& x : s) std::cout << x;\nstd::cout << std::endl;', 'abc'),
          write('Lies Zahlen bis zum Eingabeende. Gib aus, wie viele **verschiedene** Zahlen es waren. Nutze ein `std::set` oder `std::unordered_set`.',
            cppFile('', '', ['iostream', 'set']),
            { tests: [{ stdin: '4 7 4 4 9 7', expect: '3' }, { stdin: '1 1 1', expect: '1' }, { stdin: '5 6 7 8', expect: '4' }], must: [[/set\s*</, 'Nutze ein Set.']], solution: cppFile('', 'std::set<int> zahlen;\nint x;\nwhile (std::cin >> x) {\n    zahlen.insert(x);\n}\nstd::cout << zahlen.size() << std::endl;', ['iostream', 'set']) }),
        ],
      },
      {
        id: 'cpp16-3',
        title: 'Iteratoren und erase',
        goal: 'Elemente sicher aus Containern entfernen.',
        steps: [
          concept('Iteratoren',
            'Ein **Iterator** zeigt auf ein Element im Container, wie ein Pointer. `v.begin()` zeigt auf das erste, `v.end()` **hinter** das letzte.\n\nTote Gegner aus einem Vector entfernen geht seit C++20 elegant mit `std::erase_if(v, bedingung)`. Davor nutzte man das **Erase-Remove-Idiom**. Wichtig: Entfernst du in einer normalen for-Schleife Elemente, werden Iteratoren ungültig. Das ist eine typische Absturzursache in Spielen.',
            { code: 'std::vector<int> hp = {30, 0, 12, 0, 7};\nstd::erase_if(hp, [](int x) { return x <= 0; });\n// hp ist jetzt {30, 12, 7}\n\n// vor C++20:\n// hp.erase(std::remove_if(hp.begin(), hp.end(), pred), hp.end());' }),
          mc('Worauf zeigt `v.end()`?', ['Hinter das letzte Element', 'Auf das letzte Element', 'Auf nullptr', 'Auf das erste Element'], 0),
          mc('Warum ist `for (auto it = v.begin(); it != v.end(); ++it) v.erase(it);` gefährlich?', ['erase macht den Iterator ungültig, danach ist ++it undefiniert', 'erase gibt es nicht', 'Es ist nur langsam', 'Es ist völlig in Ordnung'], 0),
          write('Gegeben sind Gegner-HP. Entferne alle mit HP kleiner oder gleich 0 (mit `std::erase_if` oder Erase-Remove) und gib danach Anzahl und alle restlichen HP aus, eine Zahl pro Zeile.',
            cppFile('', 'std::vector<int> hp = {30, 0, 12, -5, 7, 0};\n', ['iostream', 'vector', 'algorithm']),
            { expect: '3\n30\n12\n7', must: [[/erase_if|remove_if/, 'Nutze `std::erase_if` oder `std::remove_if`.']], solution: cppFile('', 'std::vector<int> hp = {30, 0, 12, -5, 7, 0};\nstd::erase_if(hp, [](int x) { return x <= 0; });\nstd::cout << hp.size() << std::endl;\nfor (int x : hp) {\n    std::cout << x << std::endl;\n}', ['iostream', 'vector', 'algorithm']) }),
        ],
      },
    ],
  },

  /* ------------------------------------------------------------ 17 */
  {
    id: 'cpp17',
    title: 'RAII und Move',
    summary: 'Destruktoren, die Regel der Fünf und Move-Semantik: wie C++-Profis Ressourcen verwalten.',
    lessons: [
      {
        id: 'cpp17-1',
        title: 'Konstruktor, Destruktor, RAII',
        goal: 'Ressourcen automatisch freigeben lassen.',
        steps: [
          concept('Aufräumen am Ende des Blocks',
            'Der **Destruktor** `~Klasse()` läuft automatisch, wenn ein Objekt seinen Gültigkeitsbereich verlässt. Darauf baut **RAII** auf ("Resource Acquisition Is Initialization"): Eine Ressource wie Datei, Speicher oder Netzwerk wird im Konstruktor geholt und im Destruktor freigegeben. Vergessen geht nicht mehr.\n\n`std::unique_ptr`, `std::vector` und `std::ifstream` arbeiten alle nach RAII.',
            { code: 'class Datei {\npublic:\n    Datei() { std::cout << "geoeffnet" << std::endl; }\n    ~Datei() { std::cout << "geschlossen" << std::endl; }\n};\n\nint main() {\n    {\n        Datei d;\n        std::cout << "arbeite" << std::endl;\n    }   // hier laeuft ~Datei()\n    std::cout << "fertig" << std::endl;\n}', console: 'geoeffnet\narbeite\ngeschlossen\nfertig' }),
          predict('Was gibt dieser Code aus?', cppFile('struct T {\n    char c;\n    T(char x) : c(x) { std::cout << "+" << c; }\n    ~T() { std::cout << "-" << c; }\n};', 'T a(\'A\');\nT b(\'B\');'), '+A+B-B-A', 'Objekte werden in umgekehrter Reihenfolge zerstört: zuletzt gebaut, zuerst abgebaut.'),
          mc('Was bedeutet RAII sinngemäß?', ['Ressource im Konstruktor holen, im Destruktor freigeben', 'Alles in main schreiben', 'Nie Pointer benutzen', 'Nur globale Variablen'], 0),
          write('Schreib `class Logger`: Der Konstruktor gibt `Start` aus, der Destruktor `Ende`. Erzeuge in `main` in einem eigenen Block `{ }` einen Logger, gib darin `Mitte` aus und nach dem Block `Danach`.',
            cppFile('', ''),
            { expect: 'Start\nMitte\nEnde\nDanach', must: [[/~\s*Logger\s*\(\s*\)/, 'Lege den Destruktor `~Logger()` an.']], solution: cppFile('class Logger {\npublic:\n    Logger() { std::cout << "Start" << std::endl; }\n    ~Logger() { std::cout << "Ende" << std::endl; }\n};', '{\n    Logger log;\n    std::cout << "Mitte" << std::endl;\n}\nstd::cout << "Danach" << std::endl;') }),
        ],
      },
      {
        id: 'cpp17-2',
        title: 'Kopieren und die Regel der Fünf',
        goal: 'Steuern, ob und wie Objekte kopiert werden.',
        steps: [
          concept('Wer besitzt was?',
            'Verwaltet eine Klasse eine Ressource selbst, muss sie fünf Dinge regeln: Destruktor, Kopier-Konstruktor, Kopier-Zuweisung, Move-Konstruktor, Move-Zuweisung. Das ist die **Regel der Fünf**.\n\nDie moderne Abkürzung heißt **Regel der Null**: Nutze Mitglieder, die das schon können (`std::vector`, `std::string`, `std::unique_ptr`), dann brauchst du keine der fünf.\n\nSoll etwas nie kopiert werden, z. B. eine Textur auf der Grafikkarte, verbietest du es mit `= delete`.',
            { code: 'class Textur {\npublic:\n    explicit Textur(int id) : id(id) {}\n    Textur(const Textur&) = delete;            // kein Kopieren\n    Textur& operator=(const Textur&) = delete;\n    Textur(Textur&&) = default;                 // Verschieben erlaubt\n    int id;\n};' }),
          mc('Was bewirkt `Textur(const Textur&) = delete;`?', ['Kopieren führt zu einem Compiler-Fehler', 'Das Objekt wird gelöscht', 'Kopieren ist schneller', 'Nichts'], 0),
          mc('Was besagt die Regel der Null?', ['Nutze Mitglieder, die ihre Ressourcen selbst verwalten, dann musst du nichts davon selbst schreiben', 'Klassen dürfen keine Mitglieder haben', 'Nie mehr als null Pointer', 'Konstruktoren sind verboten'], 0),
          predict('Was gibt dieser Code aus?', 'std::vector<int> a = {1, 2, 3};\nstd::vector<int> b = a;   // Kopie\nb.push_back(4);\nstd::cout << a.size() << " " << b.size() << std::endl;', '3 4'),
        ],
      },
      {
        id: 'cpp17-3',
        title: 'Move-Semantik',
        goal: 'Besitz verschieben statt teuer kopieren.',
        steps: [
          concept('Verschieben statt kopieren',
            '`std::move(x)` sagt: "x wird nicht mehr gebraucht, nimm seinen Inhalt mit." Ein Vector mit einer Million Elementen wird dann nicht kopiert, sondern nur sein interner Pointer übergeben. Danach ist das Original leer, aber gültig.\n\nBei `std::unique_ptr` ist Verschieben sogar die einzige Möglichkeit, den Besitz weiterzugeben.',
            { code: 'std::vector<int> gross(1000000, 7);\nstd::vector<int> ziel = std::move(gross);   // kein Kopieren\nstd::cout << gross.size() << " " << ziel.size() << std::endl;', console: '0 1000000' }),
          mc('Was passiert bei `auto b = a;`, wenn a ein `std::unique_ptr` ist?', ['Compiler-Fehler, unique_ptr kann nicht kopiert werden', 'b und a zeigen beide aufs Objekt', 'a wird gelöscht', 'Es entsteht eine Kopie des Objekts'], 0),
          fill('Übergib den Besitz an die Liste.', 'auto boss = std::make_unique<Gegner>();\nhorde.push_back(⟦0⟧(boss));', ['std::move'], ['std::move', 'std::copy', '&', 'new']),
          write('Erzeuge `auto a = std::make_unique<int>(42);`. Verschiebe ihn mit `std::move` nach `b`. Gib danach aus, ob a leer ist (`leer`, sonst `voll`), und in der nächsten Zeile den Wert von `*b`.',
            cppFile('', '', ['iostream', 'memory']),
            { expect: 'leer\n42', must: [[/std::move\s*\(\s*a\s*\)/, 'Verschiebe mit `std::move(a)`.']], solution: cppFile('', 'auto a = std::make_unique<int>(42);\nauto b = std::move(a);\nstd::cout << (a ? "voll" : "leer") << std::endl;\nstd::cout << *b << std::endl;', ['iostream', 'memory']) }),
        ],
      },
    ],
  },

  /* ------------------------------------------------------------ 18 */
  {
    id: 'cpp18',
    title: 'Spielarchitektur',
    summary: 'Zustandsautomaten, Komponenten und Ereignisse: wie große Spiele ihren Code ordnen.',
    lessons: [
      {
        id: 'cpp18-1',
        title: 'Zustandsautomat',
        goal: 'Spielzustände sauber mit enum class steuern.',
        steps: [
          concept('Ein Zustand zur Zeit',
            'Ein Spiel ist immer in genau einem **Zustand**: Menü, Spielen, Pause, Game Over. Ein **Zustandsautomat** legt fest, welche Eingabe zu welchem Wechsel führt.\n\n`enum class` gibt den Zuständen Namen und verhindert Verwechslungen mit normalen Zahlen. Gegner-KI funktioniert oft genauso: Patrouille, Verfolgen, Angreifen, Fliehen.',
            { code: 'enum class Zustand { Menue, Spiel, Pause };\n\nZustand naechster(Zustand z, char taste) {\n    switch (z) {\n        case Zustand::Menue: return taste == \'s\' ? Zustand::Spiel : z;\n        case Zustand::Spiel: return taste == \'p\' ? Zustand::Pause : z;\n        case Zustand::Pause: return taste == \'p\' ? Zustand::Spiel : z;\n    }\n    return z;\n}' }),
          mc('Warum `enum class` statt einfacher int-Werte wie 0, 1, 2?', ['Namen sind lesbar, und der Compiler verhindert Verwechslungen mit Zahlen', 'Es ist schneller', 'int darf man nicht in switch nutzen', 'Es ist dasselbe'], 0),
          write('Baue einen Zustandsautomaten für eine Gegner-KI mit `enum class KI { Patrouille, Verfolgen, Angriff };`. Lies Ereignisse bis zum Eingabeende: `sieht` (Patrouille -> Verfolgen), `nah` (Verfolgen -> Angriff), `weg` (jeder Zustand -> Patrouille). Andere Ereignisse ändern nichts. Gib nach jedem Ereignis den Zustand aus.',
            cppFile('', '', ['iostream', 'string']),
            { tests: [{ stdin: 'sieht nah weg', expect: 'Verfolgen\nAngriff\nPatrouille' }, { stdin: 'nah sieht sieht nah', expect: 'Patrouille\nVerfolgen\nVerfolgen\nAngriff' }], must: [[/enum\s+class\s+KI/, 'Nutze `enum class KI`.']], solution: cppFile('enum class KI { Patrouille, Verfolgen, Angriff };\n\nstd::string name(KI z) {\n    switch (z) {\n        case KI::Patrouille: return "Patrouille";\n        case KI::Verfolgen: return "Verfolgen";\n        case KI::Angriff: return "Angriff";\n    }\n    return "";\n}', 'KI z = KI::Patrouille;\nstd::string e;\nwhile (std::cin >> e) {\n    if (e == "weg") z = KI::Patrouille;\n    else if (e == "sieht" && z == KI::Patrouille) z = KI::Verfolgen;\n    else if (e == "nah" && z == KI::Verfolgen) z = KI::Angriff;\n    std::cout << name(z) << std::endl;\n}', ['iostream', 'string']) }),
        ],
      },
      {
        id: 'cpp18-2',
        title: 'Komponenten statt Vererbungstürme',
        goal: 'Objekte aus Bausteinen zusammensetzen.',
        steps: [
          concept('Zusammensetzen statt erben',
            'Mit tiefer Vererbung landet man schnell bei Klassen wie `FliegenderSchwimmenderFeuerGegner`. Moderne Engines setzen Objekte stattdessen aus **Komponenten** zusammen: Position, Bewegung, Leben, Grafik. Ein Objekt hat nur die Komponenten, die es braucht.\n\nUnreal nennt das `UActorComponent`, Unity `Component`. Die Extremform ist **ECS** (Entity Component System): Entities sind nur IDs, Systeme bearbeiten alle Komponenten eines Typs am Stück. Das ist sehr schnell, weil die Daten hintereinander im Speicher liegen.',
            { code: 'struct Position { float x = 0, y = 0; };\nstruct Bewegung { float vx = 0, vy = 0; };\n\nstruct Entity {\n    std::string name;\n    Position pos;\n    std::optional<Bewegung> bew;   // nicht jeder bewegt sich\n};' }),
          mc('Was liefert `std::optional<Bewegung>`?', ['Entweder eine Bewegung oder nichts', 'Immer eine Bewegung', 'Einen Pointer', 'Eine Liste von Bewegungen'], 0),
          mc('Ein Baum, ein Pfeil und ein Spieler. Wer braucht die Bewegungs-Komponente?', ['Pfeil und Spieler', 'Nur der Baum', 'Alle drei', 'Keiner'], 0),
          write('Nutze `Position`, `Bewegung` und `Entity` wie im Beispiel (mit `std::optional`). Lege `Baum` bei (0, 0) ohne Bewegung und `Pfeil` bei (0, 0) mit vx = 10, vy = 5 an. Ein Update-System bewegt alle mit Bewegung um vx * dt und vy * dt, mit dt = 0.5, dreimal. Gib danach für jede Entity `Name x y` aus.',
            cppFile('struct Position { float x = 0, y = 0; };\nstruct Bewegung { float vx = 0, vy = 0; };\n\nstruct Entity {\n    std::string name;\n    Position pos;\n    std::optional<Bewegung> bew;\n};', '', ['iostream', 'optional', 'string', 'vector']),
            { expect: 'Baum 0 0\nPfeil 15 7.5', must: [[/std::optional/, 'Nutze `std::optional<Bewegung>`.'], [/if\s*\(\s*\w+\.bew/, 'Prüf mit `if (e.bew)`, ob die Komponente da ist.']], solution: cppFile('struct Position { float x = 0, y = 0; };\nstruct Bewegung { float vx = 0, vy = 0; };\n\nstruct Entity {\n    std::string name;\n    Position pos;\n    std::optional<Bewegung> bew;\n};\n\nvoid bewegeAlle(std::vector<Entity>& welt, float dt) {\n    for (auto& e : welt) {\n        if (e.bew) {\n            e.pos.x += e.bew->vx * dt;\n            e.pos.y += e.bew->vy * dt;\n        }\n    }\n}', 'std::vector<Entity> welt;\nwelt.push_back({"Baum", {0, 0}, std::nullopt});\nwelt.push_back({"Pfeil", {0, 0}, Bewegung{10, 5}});\nfor (int i = 0; i < 3; i++) bewegeAlle(welt, 0.5f);\nfor (const auto& e : welt) {\n    std::cout << e.name << " " << e.pos.x << " " << e.pos.y << std::endl;\n}', ['iostream', 'optional', 'string', 'vector']) }),
        ],
      },
      {
        id: 'cpp18-3',
        title: 'Ereignisse',
        goal: 'Teile des Spiels lose über Ereignisse verbinden.',
        steps: [
          concept('Observer',
            'Stirbt ein Gegner, sollen Punktestand, Sound und Erfolge reagieren. Statt dass der Gegner alle kennt, sendet er ein **Ereignis**. Interessierte melden sich vorher als **Beobachter** (Observer) an.\n\n`std::function<void(int)>` speichert dafür beliebige Funktionen oder Lambdas. Unreal nennt das **Delegates**, die du mit `BindUFunction` oder in Blueprints verbindest.',
            { code: 'class Ereignis {\npublic:\n    void anmelden(std::function<void(int)> f) { beobachter.push_back(f); }\n    void senden(int wert) { for (auto& f : beobachter) f(wert); }\nprivate:\n    std::vector<std::function<void(int)>> beobachter;\n};' }),
          mc('Was ist der Vorteil von Ereignissen?', ['Sender und Empfänger müssen sich nicht kennen', 'Der Code wird kürzer zu kompilieren', 'Es braucht keinen Speicher', 'Es gibt keine Fehler mehr'], 0),
          write('Baue die Klasse `Ereignis` wie im Beispiel. Melde zwei Lambdas an: eines addiert den Wert auf eine Variable `punkte`, das andere gibt `Gegner besiegt: WERT` aus. Sende 100 und 250 und gib am Ende `Punkte: 350` aus.',
            cppFile('', '', ['iostream', 'functional', 'vector']),
            { expect: 'Gegner besiegt: 100\nGegner besiegt: 250\nPunkte: 350', must: [[/std::function\s*</, 'Speichere Beobachter als `std::function`.'], [/\[\s*&\s*\]/, 'Das Lambda für die Punkte braucht `[&]`, um `punkte` zu verändern.']], solution: cppFile('class Ereignis {\npublic:\n    void anmelden(std::function<void(int)> f) { beobachter.push_back(f); }\n    void senden(int wert) { for (auto& f : beobachter) f(wert); }\nprivate:\n    std::vector<std::function<void(int)>> beobachter;\n};', 'int punkte = 0;\nEreignis besiegt;\nbesiegt.anmelden([&](int w) { punkte += w; });\nbesiegt.anmelden([](int w) { std::cout << "Gegner besiegt: " << w << std::endl; });\nbesiegt.senden(100);\nbesiegt.senden(250);\nstd::cout << "Punkte: " << punkte << std::endl;', ['iostream', 'functional', 'vector']) }),
        ],
      },
    ],
  },

  /* ------------------------------------------------------------ 19 */
  {
    id: 'cpp19',
    title: 'KI für Spiele',
    summary: 'Wegfindung auf Gittern, Heuristiken wie bei A* und Gegner-Wellen: Spiele-KI zum Selberbauen.',
    lessons: [
      {
        id: 'cpp19-1',
        title: 'Wegfindung auf dem Gitter',
        goal: 'Mit Breitensuche den kürzesten Weg durch ein Level finden.',
        steps: [
          concept('Das Level als Gitter',
            'Viele Spiele denken in Feldern: `#` ist Wand, `.` ist frei. Die **Breitensuche** startet am Start, besucht alle Nachbarn (oben, unten, links, rechts), dann deren Nachbarn, und so weiter. Die Zahl der Runden bis zum Ziel ist der kürzeste Weg.\n\nGespeichert wird mit einer `std::queue` aus Positionen und einem Gitter für die Entfernungen.',
            { code: 'const int dx[] = {1, -1, 0, 0};\nconst int dy[] = {0, 0, 1, -1};\n// fuer jeden Nachbarn: nx = x + dx[i], ny = y + dy[i]\n// innerhalb des Gitters? keine Wand? noch nicht besucht?\n// dann: dist[ny][nx] = dist[y][x] + 1; schlange.push({nx, ny});' }),
          mc('Warum findet die Breitensuche auf einem Gitter den kürzesten Weg?', ['Sie besucht Felder in der Reihenfolge ihrer Entfernung zum Start', 'Sie probiert zufällig', 'Sie geht immer geradeaus', 'Das tut sie nicht'], 0),
          write('Lies zuerst Höhe und Breite, dann die Zeilen eines Levels mit `S` (Start), `Z` (Ziel), `#` (Wand) und `.` (frei). Gib die kürzeste Anzahl Schritte von S nach Z aus, oder `-1`, wenn es keinen Weg gibt.',
            cppFile('', '', ['iostream', 'queue', 'string', 'vector']),
            { tests: [
              { stdin: '3 5\nS..#.\n.#...\n...#Z', expect: '6' },
              { stdin: '2 3\nS#Z\n.#.', expect: '-1' },
              { stdin: '1 4\nS..Z', expect: '3' },
            ], must: [[/std::queue/, 'Nutze `std::queue` für die Breitensuche.']], solution: cppFile('', 'int h, w;\nstd::cin >> h >> w;\nstd::vector<std::string> feld(h);\nfor (auto& zeile : feld) std::cin >> zeile;\n\nstd::vector<std::vector<int>> dist(h, std::vector<int>(w, -1));\nstd::queue<std::pair<int, int>> q;\nint zx = -1, zy = -1;\nfor (int y = 0; y < h; y++) {\n    for (int x = 0; x < w; x++) {\n        if (feld[y][x] == \'S\') { dist[y][x] = 0; q.push({x, y}); }\n        if (feld[y][x] == \'Z\') { zx = x; zy = y; }\n    }\n}\nconst int dx[] = {1, -1, 0, 0};\nconst int dy[] = {0, 0, 1, -1};\nwhile (!q.empty()) {\n    auto [x, y] = q.front();\n    q.pop();\n    for (int i = 0; i < 4; i++) {\n        int nx = x + dx[i], ny = y + dy[i];\n        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;\n        if (feld[ny][nx] == \'#\' || dist[ny][nx] != -1) continue;\n        dist[ny][nx] = dist[y][x] + 1;\n        q.push({nx, ny});\n    }\n}\nstd::cout << dist[zy][zx] << std::endl;', ['iostream', 'queue', 'string', 'vector']) }),
        ],
      },
      {
        id: 'cpp19-2',
        title: 'Heuristiken und A*',
        goal: 'Verstehen, wie A* schneller ans Ziel findet.',
        steps: [
          concept('Schätzen hilft',
            'Die Breitensuche schaut in alle Richtungen gleich. **A*** (sprich "A-Stern") ist schlauer: Es bevorzugt Felder, die laut einer **Heuristik** näher am Ziel liegen. Auf Gittern nimmt man meist die **Manhattan-Distanz**: `|x1 - x2| + |y1 - y2|`.\n\nA* bewertet jedes Feld mit `f = g + h`: g ist der bisherige Weg, h die Schätzung zum Ziel. Gespeichert wird in einer `std::priority_queue`, die immer das Feld mit dem kleinsten f liefert. Unreal nutzt für seine NavMesh-Wegfindung eine Variante davon.',
            { code: 'int manhattan(int x1, int y1, int x2, int y2) {\n    return std::abs(x1 - x2) + std::abs(y1 - y2);\n}' }),
          mc('Wofür steht h in `f = g + h`?', ['Die geschätzte Entfernung bis zum Ziel', 'Die Höhe des Feldes', 'Die Anzahl der Gegner', 'Die bisher gegangenen Schritte'], 0),
          predict('Was gibt `manhattan(1, 2, 4, 6)` zurück?', 'std::cout << manhattan(1, 2, 4, 6) << std::endl;', '7', '|1 - 4| + |2 - 6| = 3 + 4 = 7.'),
          write('Ein Gegner steht bei (2, 3). Lies die Anzahl n und danach n Spielerpositionen x y. Gib den Index (ab 0) des Spielers mit der kleinsten Manhattan-Distanz aus, bei Gleichstand den kleineren Index. Nutze eine Funktion `manhattan`.',
            cppFile('', '', ['iostream', 'cstdlib']),
            { tests: [{ stdin: '3\n10 10\n3 3\n0 0', expect: '1' }, { stdin: '2\n2 5\n4 3', expect: '0' }, { stdin: '4\n9 9\n8 8\n2 4\n1 3', expect: '2' }], must: [[/int\s+manhattan\s*\(/, 'Schreib eine Funktion `int manhattan(...)`.'], [/abs\s*\(/, 'Nutze `std::abs`.']], solution: cppFile('int manhattan(int x1, int y1, int x2, int y2) {\n    return std::abs(x1 - x2) + std::abs(y1 - y2);\n}', 'int n;\nstd::cin >> n;\nint best = -1;\nint bestDist = 0;\nfor (int i = 0; i < n; i++) {\n    int x, y;\n    std::cin >> x >> y;\n    int d = manhattan(2, 3, x, y);\n    if (best == -1 || d < bestDist) {\n        best = i;\n        bestDist = d;\n    }\n}\nstd::cout << best << std::endl;', ['iostream', 'cstdlib']) }),
        ],
      },
      {
        id: 'cpp19-3',
        title: 'Wellen und Balancing',
        goal: 'Schwierigkeit über Formeln steuern.',
        steps: [
          concept('Spieldesign mit Zahlen',
            'Gegnerwellen werden selten von Hand festgelegt, sondern über Formeln. So bleibt das Spiel fair, wird aber stetig härter:\n\n- Anzahl: `basis + welle * zuwachs`\n- Leben: wächst prozentual, z. B. 10 % pro Welle\n- Alle 5 Wellen ein Boss\n\nFür Zufall nutzt man in modernem C++ `<random>` mit `std::mt19937`. Mit festem Startwert (Seed) kommen bei jedem Start dieselben Zahlen. Das ist beim Testen Gold wert.',
            { code: 'for (int welle = 1; welle <= 5; welle++) {\n    int anzahl = 3 + welle * 2;\n    double hp = 50 * std::pow(1.1, welle - 1);\n    bool boss = welle % 5 == 0;\n}' }),
          mc('Warum nutzen Spiele beim Testen einen festen Seed?', ['Damit der Zufall reproduzierbar ist und Fehler nachstellbar sind', 'Damit es schneller läuft', 'Weil Zufall sonst verboten ist', 'Für bessere Grafik'], 0),
          write('Lies die Anzahl der Wellen n. Gib für jede Welle `Welle W: A Gegner` aus mit A = 3 + W * 2. Ist W durch 5 teilbar, hänge ` + Boss` an.',
            cppFile('', ''),
            { tests: [{ stdin: '3', expect: 'Welle 1: 5 Gegner\nWelle 2: 7 Gegner\nWelle 3: 9 Gegner' }, { stdin: '5', expect: 'Welle 1: 5 Gegner\nWelle 2: 7 Gegner\nWelle 3: 9 Gegner\nWelle 4: 11 Gegner\nWelle 5: 13 Gegner + Boss' }], must: [[/for\s*\(|while\s*\(/, 'Nutze eine Schleife über die Wellen.'], [/%\s*5/, 'Prüfe mit `% 5` auf die Boss-Wellen.']], solution: cppFile('', 'int n;\nstd::cin >> n;\nfor (int w = 1; w <= n; w++) {\n    std::cout << "Welle " << w << ": " << 3 + w * 2 << " Gegner";\n    if (w % 5 == 0) std::cout << " + Boss";\n    std::cout << std::endl;\n}'), explain: 'Damit ist der C++-Kurs komplett. Jetzt kommen die großen Projekte.' }),
        ],
      },
    ],
  },
];
