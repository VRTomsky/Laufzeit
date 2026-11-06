// C++ Abschnitt 5 bis 8: Funktionen, Container, Referenzen und Pointer, Speicherverwaltung

import { concept, mc, predict, fill, order, fix, write, cppMain, cppFile } from './helpers.js';

export const cppUnits5to8 = [
  /* ------------------------------------------------------------ 5 */
  {
    id: 'cpp5',
    title: 'Funktionen',
    summary: 'Code in Funktionen bündeln: Rückgabetypen, Parameter, Deklarationen und Überladen.',
    lessons: [
      {
        id: 'cpp5-1',
        title: 'Funktionen mit Rückgabewert',
        goal: 'Eigene Funktionen mit festem Rückgabetyp schreiben.',
        steps: [
          concept('Typ vor dem Namen',
            'In C++ steht vor jeder Funktion ihr **Rückgabetyp**. Jeder Parameter hat ebenfalls einen Typ. Gibt eine Funktion nichts zurück, ist ihr Typ `void`.\n\nFunktionen stehen außerhalb von `main`, meist darüber.',
            {
              code: cppFile('int doppelt(int x) {\n    return x * 2;\n}', 'std::cout << doppelt(21) << std::endl;'),
              compare: { python: 'def doppelt(x):\n    return x * 2\n\nprint(doppelt(21))' },
              console: '42',
            }),
          mc('Welcher Rückgabetyp passt zu einer Funktion, die nur etwas ausgibt und nichts zurückgibt?', ['void', 'int', 'none', 'null'], 0, null, { codeOptions: true }),
          predict('Was gibt dieser Code aus?', cppFile('int plus(int a, int b) {\n    return a + b;\n}', 'std::cout << plus(3, 4) * 2 << std::endl;'), '14'),
          fill('Ergänze Rückgabetyp und return.', '⟦0⟧ halbe(double x) {\n    ⟦1⟧ x / 2;\n}', ['double', 'return'], ['double', 'return', 'void', 'print']),
          write('Schreib eine Funktion `int quadrat(int n)` und gib `quadrat(7)` aus.',
            cppFile('// Deine Funktion hier', ''),
            { expect: '49', must: [[/int\s+quadrat\s*\(\s*int\s+\w+\s*\)/, 'Die Funktion heißt `int quadrat(int n)`.'], [/return/, 'Gib das Ergebnis mit `return` zurück.']], solution: cppFile('int quadrat(int n) {\n    return n * n;\n}', 'std::cout << quadrat(7) << std::endl;') }),
        ],
      },
      {
        id: 'cpp5-2',
        title: 'Deklaration und Definition',
        goal: 'Verstehen, warum der Compiler eine Funktion vorher kennen muss.',
        steps: [
          concept('Erst ankündigen, dann benutzen',
            'Der Compiler liest von oben nach unten. Rufst du eine Funktion auf, die erst **weiter unten** steht, kennt er sie noch nicht.\n\nLösung: eine **Deklaration** (nur der Kopf mit Semikolon) oben, die **Definition** (mit Rumpf) irgendwo später. Genau so funktionieren Header-Dateien (`.h`): Sie enthalten die Deklarationen.',
            { code: '#include <iostream>\n\nint schaden(int a, int v);   // Deklaration\n\nint main() {\n    std::cout << schaden(30, 12) << std::endl;\n    return 0;\n}\n\nint schaden(int a, int v) {   // Definition\n    return a - v;\n}' }),
          mc('Was steht in einer Header-Datei `.h` typischerweise?', ['Deklarationen von Funktionen und Klassen', 'Nur die main-Funktion', 'Die fertige .exe', 'Kommentare für den Lehrer'], 0),
          fix('Der Compiler meldet `identifier not found`. Repariere das, ohne die Funktion nach oben zu verschieben.',
            '#include <iostream>\n\nint main() {\n    std::cout << "Schaden: " << schaden(30, 12) << std::endl;\n    return 0;\n}\n\nint schaden(int a, int v) {\n    return a - v;\n}',
            { expect: 'Schaden: 18', must: [[/int\s+schaden\s*\([^)]*\)\s*;/, 'Setze eine Deklaration `int schaden(int a, int v);` vor main.']], solution: '#include <iostream>\n\nint schaden(int a, int v);\n\nint main() {\n    std::cout << "Schaden: " << schaden(30, 12) << std::endl;\n    return 0;\n}\n\nint schaden(int a, int v) {\n    return a - v;\n}' }),
          concept('bool als Rückgabe',
            'Eine Funktion kann auch `bool` zurückgeben. `std::cout` zeigt `true` als `1` und `false` als `0` an.',
            { code: 'bool istKritisch(int hp) {\n    return hp < 20;\n}', console: '1' }),
          write('Schreib `bool istKritisch(int hp)`, die `true` liefert, wenn hp kleiner als 20 ist. Gib das Ergebnis für 15 und für 80 aus, jeweils in eigener Zeile.',
            cppFile('', ''),
            { expect: '1\n0', must: [[/bool\s+istKritisch\s*\(\s*int/, 'Die Funktion heißt `bool istKritisch(int hp)`.']], solution: cppFile('bool istKritisch(int hp) {\n    return hp < 20;\n}', 'std::cout << istKritisch(15) << std::endl;\nstd::cout << istKritisch(80) << std::endl;') }),
        ],
      },
      {
        id: 'cpp5-3',
        title: 'Überladen und Standardwerte',
        goal: 'Mehrere Funktionen mit gleichem Namen und Parameter mit Standardwert.',
        steps: [
          concept('Gleicher Name, andere Parameter',
            '**Überladen**: Mehrere Funktionen dürfen gleich heißen, wenn sich ihre Parameter unterscheiden. Der Compiler wählt anhand der Argumente die passende.\n\n**Standardwerte** gibt es wie in Python: `int heilen(int hp, int menge = 10)`.',
            { code: 'int flaeche(int seite) { return seite * seite; }\nint flaeche(int b, int h) { return b * h; }\n\n// flaeche(5)    -> 25\n// flaeche(3, 4) -> 12' }),
          predict('Was gibt dieser Code aus?', cppFile('int heilen(int hp, int menge = 10) {\n    return hp + menge;\n}', 'std::cout << heilen(50) << " " << heilen(50, 25) << std::endl;'), '60 75'),
          mc('Woran unterscheidet der Compiler überladene Funktionen?', ['An Anzahl und Typen der Parameter', 'Am Rückgabetyp allein', 'An der Reihenfolge im Code', 'Am Kommentar darüber'], 0),
          write('Schreib zwei überladene Funktionen `flaeche`: eine für ein Quadrat (`int seite`) und eine für ein Rechteck (`int b, int h`). Gib `flaeche(5)` und `flaeche(3, 4)` aus.',
            cppFile('', ''),
            { expect: '25\n12', must: [[/int\s+flaeche\s*\(\s*int\s+\w+\s*\)/, 'Lege `int flaeche(int seite)` an.'], [/int\s+flaeche\s*\(\s*int\s+\w+\s*,\s*int\s+\w+\s*\)/, 'Lege `int flaeche(int b, int h)` an.']], solution: cppFile('int flaeche(int seite) {\n    return seite * seite;\n}\n\nint flaeche(int b, int h) {\n    return b * h;\n}', 'std::cout << flaeche(5) << std::endl;\nstd::cout << flaeche(3, 4) << std::endl;') }),
        ],
      },
    ],
  },

  /* ------------------------------------------------------------ 6 */
  {
    id: 'cpp6',
    title: 'Arrays, vector und string',
    summary: 'Viele Werte speichern: feste Arrays, wachsende Vektoren und Texte.',
    lessons: [
      {
        id: 'cpp6-1',
        title: 'Arrays',
        goal: 'Feste Reihen von Werten anlegen und durchlaufen.',
        steps: [
          concept('Fächer direkt nebeneinander',
            'Ein **Array** hat eine feste Größe und liegt am Stück im Speicher. Gezählt wird ab 0.\n\n**Achtung:** C++ prüft nicht, ob du außerhalb liest. `punkte[5]` bei 3 Elementen gibt keinen Fehler, sondern liest irgendeinen Speicher. Das nennt man **undefiniertes Verhalten**, eine klassische Absturzursache in Spielen.',
            {
              code: 'int punkte[3] = {10, 20, 30};\nstd::cout << punkte[0] << std::endl;\npunkte[2] = 99;',
              memory: [
                { name: 'punkte[0]', value: '10', addr: '0x2000', size: '4 B' },
                { name: 'punkte[1]', value: '20', addr: '0x2004', size: '4 B' },
                { name: 'punkte[2]', value: '99', addr: '0x2008', size: '4 B' },
              ],
              memoryCaption: 'Die Adressen steigen jeweils um 4 Byte, die Größe eines int.',
            }),
          predict('Was gibt dieser Code aus?', 'int werte[4] = {5, 6, 7, 8};\nstd::cout << werte[1] + werte[3] << std::endl;', '14'),
          mc('Was passiert bei `int a[3];` und `a[10] = 1;`?', ['Undefiniertes Verhalten, C++ prüft die Grenze nicht', 'Das Array wächst auf 11', 'Compiler-Fehler', 'Der Wert wird ignoriert'], 0),
          write('Lege `int muenzen[5] = {4, 12, 7, 9, 8};` an und berechne die Summe mit einer for-Schleife. Gib `Summe: 40` aus.',
            cppMain('int muenzen[5] = {4, 12, 7, 9, 8};\n'),
            { expect: 'Summe: 40', must: [[/for\s*\(/, 'Nutze eine `for`-Schleife.']], mustNot: [[/<<\s*"Summe: 40"|<<\s*40\b/, 'Lass die Schleife rechnen.']], solution: cppMain('int muenzen[5] = {4, 12, 7, 9, 8};\nint summe = 0;\nfor (int i = 0; i < 5; i++) {\n    summe += muenzen[i];\n}\nstd::cout << "Summe: " << summe << std::endl;') }),
        ],
      },
      {
        id: 'cpp6-2',
        title: 'std::vector',
        goal: 'Mit einem wachsenden Container arbeiten.',
        steps: [
          concept('Die Liste von C++',
            '`std::vector` aus `#include <vector>` ist das C++-Gegenstück zur Python-Liste: Er wächst bei Bedarf. In Spielen steckt er überall: Gegnerlisten, Kugeln, Partikel.\n\n- `v.push_back(x)`: hinten anhängen\n- `v.size()`: Anzahl\n- `for (int x : v)`: über alle Elemente laufen',
            {
              code: '#include <iostream>\n#include <vector>\n\nint main() {\n    std::vector<int> hp = {100, 80};\n    hp.push_back(60);\n    for (int x : hp) {\n        std::cout << x << std::endl;\n    }\n    return 0;\n}',
              compare: { python: 'hp = [100, 80]\nhp.append(60)\nfor x in hp:\n    print(x)' },
            }),
          predict('Was gibt dieser Code aus?', 'std::vector<int> v = {3, 1};\nv.push_back(4);\nstd::cout << v.size() << std::endl;', '3'),
          fill('Häng 500 an.', 'std::vector<int> punkte;\npunkte.⟦0⟧(500);', ['push_back'], ['push_back', 'append', 'add', 'insert']),
          mc('Was steht in den spitzen Klammern bei `std::vector<int>`?', ['Der Typ der Elemente', 'Die Größe', 'Der Name', 'Der Startwert'], 0),
          write('Lege einen leeren `std::vector<int>` an, hänge 10, 20 und 30 an. Gib `Anzahl: 3` aus und danach jedes Element in einer eigenen Zeile.',
            cppMain('', ['iostream', 'vector']),
            { expect: 'Anzahl: 3\n10\n20\n30', must: [[/push_back/, 'Nutze `push_back`.'], [/\.size\s*\(/, 'Die Anzahl liefert `.size()`.']], solution: cppMain('std::vector<int> werte;\nwerte.push_back(10);\nwerte.push_back(20);\nwerte.push_back(30);\nstd::cout << "Anzahl: " << werte.size() << std::endl;\nfor (int w : werte) {\n    std::cout << w << std::endl;\n}', ['iostream', 'vector']) }),
        ],
      },
      {
        id: 'cpp6-3',
        title: 'std::string',
        goal: 'Texte zusammensetzen, zerlegen und einlesen.',
        steps: [
          concept('Texte in C++',
            '`std::string` aus `#include <string>` kann viel:\n\n- `s.length()`: Länge\n- `s[0]`: erstes Zeichen (ein `char`)\n- `a + b`: zusammenfügen\n- `s.substr(start, anzahl)`: Ausschnitt\n- `std::getline(std::cin, s)`: ganze Zeile mit Leerzeichen einlesen',
            { code: 'std::string name = "Laufzeit";\nstd::cout << name.length() << std::endl;\nstd::cout << name.substr(0, 4) << std::endl;\nstd::cout << name + "!" << std::endl;', console: '8\nLauf\nLaufzeit!' }),
          predict('Was gibt dieser Code aus?', 'std::string s = "Unreal";\nstd::cout << s.substr(2, 3) << std::endl;', 'rea', 'Ab Position 2, drei Zeichen: r, e, a.'),
          mc('Womit liest du eine ganze Zeile inklusive Leerzeichen ein?', ['std::getline(std::cin, text);', 'std::cin >> text;', 'text = input();', 'std::readline(text);'], 0, null, { codeOptions: true }),
          write('Lies ein Wort mit `std::cin` ein. Gib seine Länge aus und darunter den ersten Buchstaben.',
            cppMain('', ['iostream', 'string']),
            { stdin: 'Laufzeit', expect: '8\nL', must: [[/\.length\s*\(|\.size\s*\(/, 'Die Länge liefert `.length()`.'], [/\[\s*0\s*\]/, 'Den ersten Buchstaben liefert `[0]`.']], solution: cppMain('std::string wort;\nstd::cin >> wort;\nstd::cout << wort.length() << std::endl;\nstd::cout << wort[0] << std::endl;', ['iostream', 'string']), explain: 'Getestet mit Laufzeit.' }),
        ],
      },
    ],
  },

  /* ------------------------------------------------------------ 7 */
  {
    id: 'cpp7',
    title: 'Referenzen und Pointer',
    summary: 'Das Herzstück von C++: Adressen, Referenzen, Pointer. Mit Speicherbildern Schritt für Schritt.',
    lessons: [
      {
        id: 'cpp7-1',
        title: 'Adressen und Referenzen',
        goal: 'Verstehen, was & bedeutet und warum Referenzen Kopien sparen.',
        steps: [
          concept('Jede Variable hat eine Adresse',
            'Erinnerst du dich an das Speicherbild? Mit `&x` bekommst du die **Adresse** von x.\n\nEine **Referenz** `int& r = x;` ist ein **zweiter Name** für dieselbe Variable. Kein neues Fach, kein Kopieren. Änderst du r, änderst du x.',
            {
              code: 'int hp = 100;\nint& r = hp;     // r ist ein zweiter Name fuer hp\nr = 50;\nstd::cout << hp << std::endl;   // 50',
              memory: [{ name: 'hp  (auch: r)', type: 'int', value: '50', addr: '0x1000', size: '4 Byte' }],
              memoryCaption: 'Ein Fach, zwei Namen.',
            }),
          predict('Was gibt dieser Code aus?', 'int a = 3;\nint& b = a;\nb += 10;\nstd::cout << a << std::endl;', '13'),
          concept('Referenzen als Parameter',
            'Normalerweise bekommt eine Funktion eine **Kopie**. Änderungen darin verpuffen. Mit `&` im Parameter bekommt sie das **Original**.\n\nIn Spielen ist das doppelt wichtig: Große Objekte zu kopieren kostet Zeit. Darum siehst du in Unreal ständig `const FVector&`.',
            { code: 'void heilKopie(int hp) { hp += 20; }      // aendert nur die Kopie\nvoid heilen(int& hp) { hp += 20; }        // aendert das Original' }),
          mc('Was gibt `int x = 1; heilKopie(x); std::cout << x;` aus?', ['1', '21', '20', 'Fehler'], 0, 'heilKopie arbeitet mit einer Kopie. x bleibt 1.'),
          write('Schreib `void heilen(int& hp)`, die 20 dazu addiert. In main: `int hp = 50;`, `heilen(hp);`, dann hp ausgeben.',
            cppFile('', ''),
            { expect: '70', must: [[/void\s+heilen\s*\(\s*int\s*&/, 'Der Parameter braucht ein `&`: `void heilen(int& hp)`.']], solution: cppFile('void heilen(int& hp) {\n    hp += 20;\n}', 'int hp = 50;\nheilen(hp);\nstd::cout << hp << std::endl;') }),
        ],
      },
      {
        id: 'cpp7-2',
        title: 'Pointer',
        goal: 'Pointer anlegen, dereferenzieren und im Speicher verstehen.',
        steps: [
          concept('Ein Zettel mit einer Adresse',
            'Ein **Pointer** ist eine Variable, die eine **Adresse** speichert. Stell ihn dir als Zettel vor, auf dem steht, in welchem Fach etwas liegt.\n\n- `int* p = &gold;`: p speichert die Adresse von gold\n- `*p`: "geh zu der Adresse und nimm, was dort liegt". Das heißt **dereferenzieren**\n- `*p = 999;`: ändert gold über den Pointer',
            {
              code: 'int gold = 50;\nint* p = &gold;\n*p = 999;\nstd::cout << gold << std::endl;   // 999',
              memory: [
                { name: 'gold', type: 'int', value: '999', addr: '0x1000', size: '4 Byte' },
                { arrow: '<- zeigt auf' },
                { name: 'p', type: 'int*', value: '0x1000', addr: '0x1008', size: '8 Byte', kind: 'ptr' },
              ],
              memoryCaption: 'p selbst ist auch eine Variable. Ihr Wert ist eine Adresse.',
            }),
          predict('Was gibt dieser Code aus?', 'int x = 7;\nint* p = &x;\nstd::cout << *p + 1 << std::endl;', '8'),
          mc('Was speichert `int* p = &x;` in p?', ['Die Adresse von x', 'Eine Kopie von x', 'Den Wert von x mal 2', 'Den Namen x'], 0),
          fill('Lass p auf level zeigen und setz level über p auf 5.', 'int level = 1;\nint* p = ⟦0⟧level;\n⟦1⟧p = 5;', ['&', '*'], ['&', '*', '->', '#']),
          write('Lege `int gold = 50;` an, dazu einen Pointer `p` auf gold. Setze gold **über den Pointer** auf 999 und gib dann gold aus.',
            cppMain(),
            { expect: '999', must: [[/int\s*\*\s*\w+\s*=\s*&\s*gold/, 'Lege den Pointer mit `int* p = &gold;` an.'], [/\*\s*\w+\s*=\s*999/, 'Ändere den Wert über `*p = 999;`.']], mustNot: [[/gold\s*=\s*999/, 'Ändere gold nicht direkt, sondern über den Pointer.']], solution: cppMain('int gold = 50;\nint* p = &gold;\n*p = 999;\nstd::cout << gold << std::endl;') }),
        ],
      },
      {
        id: 'cpp7-3',
        title: 'nullptr und Tauschen',
        goal: 'Leere Pointer erkennen und Referenzen gezielt einsetzen.',
        steps: [
          concept('Der leere Zettel',
            '`nullptr` heißt: Dieser Pointer zeigt auf **nichts**. Ihn zu dereferenzieren lässt das Programm abstürzen. Deshalb prüft man vorher.\n\nFaustregel für Parameter:\n\n- Referenz `T&`, wenn es das Objekt sicher gibt\n- Pointer `T*`, wenn es auch "nichts" sein darf',
            { code: 'int* ziel = nullptr;\nif (ziel != nullptr) {\n    std::cout << *ziel << std::endl;\n} else {\n    std::cout << "Kein Ziel" << std::endl;\n}', console: 'Kein Ziel' }),
          mc('Was passiert bei `int* p = nullptr; std::cout << *p;`?', ['Absturz, nullptr darf man nicht dereferenzieren', 'Es erscheint 0', 'Es erscheint nullptr', 'Compiler-Fehler'], 0),
          fix('levelUp soll das Level wirklich erhöhen. Gerade kommt 1 heraus statt 2.',
            cppFile('void levelUp(int level) {\n    level++;\n}', 'int level = 1;\nlevelUp(level);\nstd::cout << level << std::endl;'),
            { expect: '2', must: [[/void\s+levelUp\s*\(\s*int\s*&/, 'Übergib per Referenz: `int& level`.']], solution: cppFile('void levelUp(int& level) {\n    level++;\n}', 'int level = 1;\nlevelUp(level);\nstd::cout << level << std::endl;') }),
          write('Schreib `void tausche(int& a, int& b)`, die die Werte vertauscht. Teste mit `x = 3`, `y = 7` und gib danach `x y` aus.',
            cppFile('', ''),
            { expect: '7 3', must: [[/void\s+tausche\s*\(\s*int\s*&\s*\w+\s*,\s*int\s*&/, 'Beide Parameter brauchen `&`.']], mustNot: [[/std::swap/, 'Bau das Tauschen selbst, ohne `std::swap`.']], solution: cppFile('void tausche(int& a, int& b) {\n    int tmp = a;\n    a = b;\n    b = tmp;\n}', 'int x = 3;\nint y = 7;\ntausche(x, y);\nstd::cout << x << " " << y << std::endl;'), explain: 'Ohne Hilfsvariable tmp wäre ein Wert verloren.' }),
        ],
      },
    ],
  },

  /* ------------------------------------------------------------ 8 */
  {
    id: 'cpp8',
    title: 'Speicherverwaltung',
    summary: 'Stack und Heap, new und delete, Speicherlecks und warum Profis Smart Pointer nutzen.',
    lessons: [
      {
        id: 'cpp8-1',
        title: 'Stack und Heap',
        goal: 'Die zwei Speicherbereiche unterscheiden.',
        steps: [
          concept('Zwei Speicherbereiche',
            '**Stack:** Normale lokale Variablen. Schnell, wird automatisch aufgeräumt, sobald die Funktion endet. Aber begrenzt und nur so lange gültig wie die Funktion.\n\n**Heap:** Speicher, den du dir mit `new` holst. Bleibt bestehen, bis du ihn mit `delete` zurückgibst. Gut für Dinge, die länger leben, z. B. Gegner, die während des Spiels entstehen.',
            {
              code: 'void spawn() {\n    int lokal = 5;            // Stack\n    int* gegnerHp = new int(100);   // Heap\n    delete gegnerHp;          // zurueckgeben\n}',
              memory: [
                { name: 'lokal', type: 'int', value: '5', addr: 'Stack', size: 'auto' },
                { name: 'gegnerHp', type: 'int*', value: '0x9F00', addr: 'Stack', size: '8 B', kind: 'ptr' },
                { arrow: '-> zeigt auf' },
                { name: '(namenlos)', type: 'int', value: '100', addr: 'Heap 0x9F00', size: '4 B', kind: 'heap' },
              ],
            }),
          mc('Wann wird eine lokale Stack-Variable freigegeben?', ['Automatisch am Ende ihres Blocks', 'Nie', 'Erst mit delete', 'Beim Neustart des PCs'], 0),
          mc('Was liefert `new int(100)`?', ['Einen Pointer auf ein int im Heap', 'Den Wert 100', 'Eine Referenz', 'Einen neuen Typ'], 0),
          predict('Was gibt dieser Code aus?', 'int* p = new int(40);\n*p += 2;\nstd::cout << *p << std::endl;\ndelete p;', '42'),
        ],
      },
      {
        id: 'cpp8-2',
        title: 'new, delete und Lecks',
        goal: 'Heap-Speicher anfordern, zurückgeben und Lecks vermeiden.',
        steps: [
          concept('Wer new sagt, muss delete sagen',
            'Jedes `new` braucht genau ein `delete`. Für Arrays: `new int[n]` und `delete[]`.\n\nVergisst du `delete`, bleibt der Speicher belegt. Passiert das in jedem Frame, wächst der Speicherverbrauch, bis das Spiel abstürzt. Das ist ein **Speicherleck**. Doppeltes `delete` ist genauso gefährlich.',
            { code: 'int n = 5;\nint* feld = new int[n];\nfor (int i = 0; i < n; i++) {\n    feld[i] = i * i;\n}\nstd::cout << feld[n - 1] << std::endl;\ndelete[] feld;', console: '16' }),
          mc('Wie gibst du `int* a = new int[10];` richtig frei?', ['delete[] a;', 'delete a;', 'free a;', 'a = nullptr;'], 0, null, { codeOptions: true }),
          mc('Was ist ein Speicherleck?', ['Angeforderter Speicher, der nie freigegeben wird', 'Ein Pointer auf nullptr', 'Ein zu großes Array', 'Ein Tippfehler im Code'], 0),
          write('Lies eine Zahl `n` ein. Hol dir mit `new` ein int-Array der Größe n, fülle Feld i mit `i * i`, gib das letzte Feld aus und gib den Speicher mit `delete[]` frei.',
            cppMain(),
            { stdin: '5', expect: '16', must: [[/new\s+int\s*\[/, 'Hol dir das Array mit `new int[n]`.'], [/delete\s*\[\s*\]/, 'Gib es mit `delete[]` frei.']], solution: cppMain('int n;\nstd::cin >> n;\nint* feld = new int[n];\nfor (int i = 0; i < n; i++) {\n    feld[i] = i * i;\n}\nstd::cout << feld[n - 1] << std::endl;\ndelete[] feld;'), explain: 'Getestet mit 5: das letzte Feld ist 4 * 4 = 16.' }),
        ],
      },
      {
        id: 'cpp8-3',
        title: 'Smart Pointer',
        goal: 'Speicher automatisch aufräumen lassen.',
        steps: [
          concept('Aufräumen lassen',
            'Moderne C++-Profis schreiben fast nie `delete`. Sie nutzen **Smart Pointer** aus `#include <memory>`:\n\n- `std::unique_ptr<T>`: genau ein Besitzer. Wird er zerstört, wird der Speicher automatisch freigegeben\n- `std::shared_ptr<T>`: mehrere Besitzer, zählt mit. Der letzte räumt auf\n\nErzeugt wird mit `std::make_unique<T>()`. Auf Mitglieder greifst du mit `->` zu.',
            { code: 'struct Gegner {\n    int hp = 100;\n};\n\nauto g = std::make_unique<Gegner>();\ng->hp -= 30;\nstd::cout << g->hp << std::endl;   // 70\n// kein delete noetig' }),
          mc('Wann gibt ein `std::unique_ptr` seinen Speicher frei?', ['Automatisch, wenn er selbst zerstört wird', 'Nie', 'Nur mit delete', 'Nach 5 Sekunden'], 0),
          predict('Was gibt dieser Code aus?', 'auto a = std::make_shared<int>(5);\nauto b = a;\nstd::cout << a.use_count() << std::endl;', '2', 'a und b teilen sich denselben Speicher, der Zähler steht auf 2.'),
          fill('Greif über den Smart Pointer auf hp zu.', 'auto boss = std::make_unique<Gegner>();\nboss⟦0⟧hp = 500;', ['->'], ['->', '.', '*', '::']),
          write('Lege `struct Gegner { int hp = 0; };` an. Erzeuge in main mit `std::make_unique` einen Gegner, setze `hp` auf 50 und gib es aus.',
            cppFile('', '', ['iostream', 'memory']),
            { expect: '50', must: [[/make_unique\s*<\s*Gegner\s*>/, 'Erzeuge den Gegner mit `std::make_unique<Gegner>()`.'], [/->\s*hp/, 'Greif mit `->hp` zu.']], mustNot: [[/\bdelete\b/, 'Mit Smart Pointern brauchst du kein delete.']], solution: cppFile('struct Gegner {\n    int hp = 0;\n};', 'auto g = std::make_unique<Gegner>();\ng->hp = 50;\nstd::cout << g->hp << std::endl;', ['iostream', 'memory']) }),
        ],
      },
    ],
  },
];
