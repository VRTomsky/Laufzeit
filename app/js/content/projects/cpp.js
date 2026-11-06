// C++: Projekte (mehrere Etappen) und freie Aufgaben (nur Beschreibung + Testfaelle)

const inc = (...names) => names.map(n => `#include <${n}>`).join('\n') + '\n\n';

/* ---------------------------------------------------------------- Tic-Tac-Toe */

const TTT_ZEIGE = `char brett[3][3];

void zeige() {
    for (int z = 0; z < 3; z++) {
        for (int s = 0; s < 3; s++) std::cout << brett[z][s];
        std::cout << std::endl;
    }
}
`;

const TTT_1 = inc('iostream') + TTT_ZEIGE + `
int main() {
    for (int z = 0; z < 3; z++)
        for (int s = 0; s < 3; s++) brett[z][s] = '.';
    zeige();
    return 0;
}
`;

const TTT_2 = inc('iostream') + TTT_ZEIGE + `
int main() {
    for (int z = 0; z < 3; z++)
        for (int s = 0; s < 3; s++) brett[z][s] = '.';
    char spieler = 'X';
    int z, s;
    while (std::cin >> z >> s) {
        if (z < 0 || z > 2 || s < 0 || s > 2 || brett[z][s] != '.') {
            std::cout << "Feld belegt" << std::endl;
            continue;
        }
        brett[z][s] = spieler;
        spieler = spieler == 'X' ? 'O' : 'X';
    }
    zeige();
    return 0;
}
`;

const TTT_3 = inc('iostream') + TTT_ZEIGE + `
bool gewonnen(char p) {
    for (int i = 0; i < 3; i++) {
        if (brett[i][0] == p && brett[i][1] == p && brett[i][2] == p) return true;
        if (brett[0][i] == p && brett[1][i] == p && brett[2][i] == p) return true;
    }
    if (brett[0][0] == p && brett[1][1] == p && brett[2][2] == p) return true;
    return brett[0][2] == p && brett[1][1] == p && brett[2][0] == p;
}

int main() {
    for (int z = 0; z < 3; z++)
        for (int s = 0; s < 3; s++) brett[z][s] = '.';
    char spieler = 'X';
    int zuege = 0;
    int z, s;
    while (std::cin >> z >> s) {
        if (z < 0 || z > 2 || s < 0 || s > 2 || brett[z][s] != '.') {
            std::cout << "Feld belegt" << std::endl;
            continue;
        }
        brett[z][s] = spieler;
        zuege++;
        if (gewonnen(spieler)) {
            zeige();
            std::cout << spieler << " gewinnt" << std::endl;
            return 0;
        }
        spieler = spieler == 'X' ? 'O' : 'X';
    }
    zeige();
    if (zuege == 9) std::cout << "Unentschieden" << std::endl;
    return 0;
}
`;

/* ---------------------------------------------------------------- Kampf */

const FIGHTER = `class Kaempfer {
public:
    Kaempfer(std::string name, int hp, int angriff)
        : name(name), hp(hp), maxHp(hp), angriff(angriff) {}
    virtual ~Kaempfer() = default;

    virtual int schaden() const { return angriff; }
    void angreifen(Kaempfer& ziel) const {
        ziel.hp -= schaden();
        if (ziel.hp < 0) ziel.hp = 0;
    }
    bool lebt() const { return hp > 0; }

    std::string name;
    int hp;
    int maxHp;
    int angriff;
};
`;

const ZUG = `
void zug(const Kaempfer& a, Kaempfer& z) {
    a.angreifen(z);
    std::cout << a.name << " trifft " << z.name << ": " << z.hp << " HP übrig" << std::endl;
}

void kampf(Kaempfer& held, Kaempfer& gegner) {
    while (held.lebt() && gegner.lebt()) {
        zug(held, gegner);
        if (gegner.lebt()) zug(gegner, held);
    }
    std::cout << (held.lebt() ? held.name : gegner.name) << " gewinnt" << std::endl;
}
`;

const FIGHT_1 = inc('iostream', 'string') + FIGHTER + `
int main() {
    Kaempfer held("Ada", 30, 8);
    Kaempfer ork("Ork", 20, 5);
    held.angreifen(ork);
    held.angreifen(ork);
    std::cout << ork.hp << std::endl;
    held.angreifen(ork);
    std::cout << ork.hp << std::endl;
    return 0;
}
`;

const FIGHT_2 = inc('iostream', 'string') + FIGHTER + ZUG + `
int main() {
    Kaempfer held("Ada", 30, 8);
    Kaempfer ork("Ork", 20, 5);
    kampf(held, ork);
    return 0;
}
`;

const FIGHT_3 = inc('iostream', 'string') + FIGHTER + `
class Berserker : public Kaempfer {
public:
    using Kaempfer::Kaempfer;
    int schaden() const override {
        return hp * 2 < maxHp ? angriff * 2 : angriff;
    }
};
` + ZUG + `
int main() {
    Kaempfer held("Ada", 30, 6);
    Berserker grok("Grok", 30, 5);
    kampf(held, grok);
    return 0;
}
`;

/* ---------------------------------------------------------------- Inventar */

const INV_1 = inc('iostream', 'map', 'string') + `int main() {
    std::map<std::string, int> inventar;
    std::string befehl;
    while (std::cin >> befehl) {
        if (befehl == "add") {
            std::string name;
            int n;
            std::cin >> name >> n;
            inventar[name] += n;
        } else if (befehl == "list") {
            if (inventar.empty()) std::cout << "Inventar leer" << std::endl;
            for (const auto& [name, n] : inventar) std::cout << name << ": " << n << std::endl;
        }
    }
    return 0;
}
`;

const INV_2 = inc('iostream', 'map', 'string') + `int main() {
    std::map<std::string, int> inventar;
    std::string befehl;
    while (std::cin >> befehl) {
        if (befehl == "add") {
            std::string name;
            int n;
            std::cin >> name >> n;
            inventar[name] += n;
        } else if (befehl == "remove") {
            std::string name;
            int n;
            std::cin >> name >> n;
            auto it = inventar.find(name);
            if (it == inventar.end() || it->second < n) {
                std::cout << "Nicht genug " << name << std::endl;
                continue;
            }
            it->second -= n;
            if (it->second == 0) inventar.erase(it);
        } else if (befehl == "list") {
            if (inventar.empty()) std::cout << "Inventar leer" << std::endl;
            for (const auto& [name, n] : inventar) std::cout << name << ": " << n << std::endl;
        }
    }
    return 0;
}
`;

const INV_3 = inc('iostream', 'map', 'string') + `const std::map<std::string, int> GEWICHT = {{"Trank", 1}, {"Schwert", 5}, {"Schild", 8}};
const int MAX_LAST = 20;

int gesamt(const std::map<std::string, int>& inv) {
    int g = 0;
    for (const auto& [name, n] : inv) g += GEWICHT.at(name) * n;
    return g;
}

int main() {
    std::map<std::string, int> inventar;
    std::string befehl;
    while (std::cin >> befehl) {
        if (befehl == "add") {
            std::string name;
            int n;
            std::cin >> name >> n;
            if (gesamt(inventar) + GEWICHT.at(name) * n > MAX_LAST) {
                std::cout << "Zu schwer" << std::endl;
                continue;
            }
            inventar[name] += n;
        } else if (befehl == "remove") {
            std::string name;
            int n;
            std::cin >> name >> n;
            auto it = inventar.find(name);
            if (it == inventar.end() || it->second < n) {
                std::cout << "Nicht genug " << name << std::endl;
                continue;
            }
            it->second -= n;
            if (it->second == 0) inventar.erase(it);
        } else if (befehl == "list") {
            if (inventar.empty()) std::cout << "Inventar leer" << std::endl;
            for (const auto& [name, n] : inventar) std::cout << name << ": " << n << std::endl;
        } else if (befehl == "gewicht") {
            std::cout << "Gewicht: " << gesamt(inventar) << "/" << MAX_LAST << std::endl;
        }
    }
    return 0;
}
`;

/* ---------------------------------------------------------------- Labyrinth */

const MAZE_READ = `    int h, w;
    std::cin >> h >> w;
    std::vector<std::string> feld(h);
    for (auto& zeile : feld) std::cin >> zeile;
    int sx = 0, sy = 0, zx = 0, zy = 0;
    for (int y = 0; y < h; y++) {
        for (int x = 0; x < w; x++) {
            if (feld[y][x] == 'S') { sx = x; sy = y; }
            if (feld[y][x] == 'Z') { zx = x; zy = y; }
        }
    }
`;

const MAZE_1 = inc('iostream', 'string', 'vector') + `int main() {
${MAZE_READ}    std::cout << "Start: " << sx << " " << sy << std::endl;
    std::cout << "Ziel: " << zx << " " << zy << std::endl;
    return 0;
}
`;

const MAZE_BFS = `    std::vector<std::vector<int>> dist(h, std::vector<int>(w, -1));
    std::vector<std::vector<std::pair<int, int>>> vorher(h, std::vector<std::pair<int, int>>(w, {-1, -1}));
    std::queue<std::pair<int, int>> q;
    dist[sy][sx] = 0;
    q.push({sx, sy});
    const int dx[] = {1, -1, 0, 0};
    const int dy[] = {0, 0, 1, -1};
    while (!q.empty()) {
        auto [x, y] = q.front();
        q.pop();
        for (int i = 0; i < 4; i++) {
            int nx = x + dx[i], ny = y + dy[i];
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            if (feld[ny][nx] == '#' || dist[ny][nx] != -1) continue;
            dist[ny][nx] = dist[y][x] + 1;
            vorher[ny][nx] = {x, y};
            q.push({nx, ny});
        }
    }
    if (dist[zy][zx] == -1) {
        std::cout << "Kein Weg" << std::endl;
        return 0;
    }
`;

const MAZE_2 = inc('iostream', 'queue', 'string', 'vector') + `int main() {
${MAZE_READ}${MAZE_BFS}    std::cout << "Schritte: " << dist[zy][zx] << std::endl;
    return 0;
}
`;

const MAZE_3 = inc('iostream', 'queue', 'string', 'vector') + `int main() {
${MAZE_READ}${MAZE_BFS}    auto [px, py] = vorher[zy][zx];
    while (!(px == sx && py == sy)) {
        feld[py][px] = '*';
        auto naechster = vorher[py][px];
        px = naechster.first;
        py = naechster.second;
    }
    for (const auto& zeile : feld) std::cout << zeile << std::endl;
    std::cout << "Schritte: " << dist[zy][zx] << std::endl;
    return 0;
}
`;

const MAZES = [
  { stdin: '3 5\nS..#.\n.#...\n...#Z', start: 'Start: 0 0\nZiel: 4 2', steps: 'Schritte: 6', path: 'S**#.\n.#***\n...#Z\nSchritte: 6' },
  { stdin: '2 3\nS#Z\n.#.', start: 'Start: 0 0\nZiel: 2 0', steps: 'Kein Weg', path: 'Kein Weg' },
  { stdin: '1 4\nZ..S', start: 'Start: 3 0\nZiel: 0 0', steps: 'Schritte: 3', path: 'Z**S\nSchritte: 3' },
];

export const cppProjects = [
  {
    id: 'cp-ttt',
    title: 'Tic-Tac-Toe',
    summary: 'Ein Spielbrett als 2D-Array, Züge von der Tastatur und eine Gewinnprüfung.',
    unlockAfter: 'cpp6',
    steps: [
      {
        title: 'Das Brett',
        task: 'Das Brett ist ein `char brett[3][3]`. Fülle jedes Feld mit `.` und schreib eine Funktion `void zeige()`, die das Brett zeilenweise ausgibt (3 Zeichen pro Zeile, ohne Leerzeichen).',
        starter: inc('iostream') + 'char brett[3][3];\n\n// zeige()\n\nint main() {\n    \n    return 0;\n}\n',
        tests: [{ stdin: '', expect: '...\n...\n...' }],
        must: [[/void\s+zeige\s*\(\s*\)/, 'Schreib die Funktion `void zeige()`.']],
        solution: TTT_1,
      },
      {
        title: 'Züge',
        task: 'Lies Züge als `zeile spalte` (0 bis 2), bis die Eingabe zu Ende ist. X beginnt, dann abwechselnd. Ist das Feld belegt oder ungültig, gib `Feld belegt` aus, und **derselbe** Spieler ist nochmal dran. Am Ende gib das Brett aus.',
        tests: [
          { stdin: '0 0\n1 1\n0 0\n2 2', expect: 'Feld belegt\nX..\n.O.\n..X' },
          { stdin: '1 1\n0 2\n5 5', expect: 'Feld belegt\n..O\n.X.\n...' },
        ],
        hint: '`while (std::cin >> z >> s)` liest so lange, wie Zahlen kommen. Mit `continue` überspringst du den Spielerwechsel.',
        solution: TTT_2,
      },
      {
        title: 'Wer gewinnt?',
        task: 'Schreib `bool gewonnen(char p)`, die alle Reihen, Spalten und beide Diagonalen prüft. Nach jedem gültigen Zug: Hat der Spieler gewonnen, gib das Brett und `X gewinnt` bzw. `O gewinnt` aus und beende das Programm. Endet die Eingabe ohne Sieger, gib das Brett aus und, falls alle 9 Felder voll sind, zusätzlich `Unentschieden`.',
        tests: [
          { stdin: '0 0\n1 0\n0 1\n1 1\n0 2', expect: 'XXX\nOO.\n...\nX gewinnt' },
          { stdin: '0 0\n0 1\n0 2\n1 1\n1 0\n1 2\n2 1\n2 0\n2 2', expect: 'XOX\nXOO\nOXX\nUnentschieden' },
          { stdin: '0 0\n0 2\n1 0\n1 1\n2 2\n2 0', expect: 'X.O\nXO.\nO.X\nO gewinnt' },
        ],
        must: [[/bool\s+gewonnen\s*\(\s*char/, 'Schreib `bool gewonnen(char p)`.']],
        hint: 'Eine Schleife über i von 0 bis 2 prüft Reihe i und Spalte i gleichzeitig. Die zwei Diagonalen prüfst du danach einzeln.',
        solution: TTT_3,
      },
    ],
  },
  {
    id: 'cp-kampf',
    title: 'Kampf-System',
    summary: 'Kämpfer als Klassen, ein Kampfablauf und ein Berserker, der per virtual anders zuschlägt.',
    unlockAfter: 'cpp10',
    steps: [
      {
        title: 'Die Kämpfer-Klasse',
        task: 'Schreib `class Kaempfer` mit `name`, `hp`, `maxHp` (= Start-HP) und `angriff`, einem passenden Konstruktor, `virtual int schaden() const` (liefert `angriff`), `void angreifen(Kaempfer& ziel) const` (HP nie unter 0) und `bool lebt() const`. In main: Ada (30, 8) greift Ork (20, 5) zweimal an, gib Orks HP aus, dann ein drittes Mal und wieder HP ausgeben.',
        starter: inc('iostream', 'string') + '// class Kaempfer\n\nint main() {\n    \n    return 0;\n}\n',
        tests: [{ stdin: '', expect: '4\n0' }],
        must: [[/class\s+Kaempfer/, 'Lege `class Kaempfer` an.'], [/virtual\s+int\s+schaden\s*\(\s*\)\s*const/, 'Die Methode heißt `virtual int schaden() const`.']],
        solution: FIGHT_1,
      },
      {
        title: 'Der Kampfablauf',
        task: 'Schreib `void kampf(Kaempfer& held, Kaempfer& gegner)`: abwechselnd, der Held beginnt, ein Besiegter schlägt nicht zurück. Jeder Treffer: `Ada trifft Ork: 12 HP übrig`. Am Ende `Ada gewinnt` oder `Ork gewinnt`. Teste mit Ada (30, 8) gegen Ork (20, 5).',
        tests: [{ stdin: '', expect: 'Ada trifft Ork: 12 HP übrig\nOrk trifft Ada: 25 HP übrig\nAda trifft Ork: 4 HP übrig\nOrk trifft Ada: 20 HP übrig\nAda trifft Ork: 0 HP übrig\nAda gewinnt' }],
        must: [[/void\s+kampf\s*\(/, 'Schreib `void kampf(Kaempfer& held, Kaempfer& gegner)`.']],
        solution: FIGHT_2,
      },
      {
        title: 'Der Berserker',
        task: 'Leite `class Berserker : public Kaempfer` ab. Er überschreibt `schaden()` mit `override`: Sind seine HP unter der Hälfte von `maxHp`, macht er doppelten Schaden. Lass Ada (30 HP, 6 Angriff) gegen den Berserker Grok (30 HP, 5 Angriff) kämpfen.',
        tests: [{ stdin: '', expect: 'Ada trifft Grok: 24 HP übrig\nGrok trifft Ada: 25 HP übrig\nAda trifft Grok: 18 HP übrig\nGrok trifft Ada: 20 HP übrig\nAda trifft Grok: 12 HP übrig\nGrok trifft Ada: 10 HP übrig\nAda trifft Grok: 6 HP übrig\nGrok trifft Ada: 0 HP übrig\nGrok gewinnt' }],
        must: [[/class\s+Berserker\s*:\s*public\s+Kaempfer/, 'Leite ab mit `class Berserker : public Kaempfer`.'], [/override/, 'Markiere `schaden()` mit `override`.']],
        hint: '`using Kaempfer::Kaempfer;` übernimmt den Konstruktor der Basisklasse. Da `angreifen` die virtuelle Methode `schaden()` aufruft, wirkt der Berserker automatisch.',
        solution: FIGHT_3,
      },
    ],
  },
  {
    id: 'cp-inventar',
    title: 'Inventar-System',
    summary: 'Befehle verarbeiten, Gegenstände in einer map verwalten, Gewichtsgrenze einhalten.',
    unlockAfter: 'cpp16',
    steps: [
      {
        title: 'Hinzufügen und anzeigen',
        task: 'Lies Befehle bis zum Eingabeende:\n\n- `add NAME ANZAHL`: Gegenstände hinzufügen\n- `list`: alle Gegenstände alphabetisch als `NAME: ANZAHL`, oder `Inventar leer`',
        starter: inc('iostream', 'map', 'string') + 'int main() {\n    \n    return 0;\n}\n',
        tests: [
          { stdin: 'list\nadd Trank 2\nadd Schwert 1\nadd Trank 3\nlist', expect: 'Inventar leer\nSchwert: 1\nTrank: 5' },
          { stdin: 'add Pfeil 20\nlist', expect: 'Pfeil: 20' },
        ],
        must: [[/std::map/, 'Nutze `std::map<std::string, int>`.']],
        solution: INV_1,
      },
      {
        title: 'Entfernen',
        task: 'Neuer Befehl `remove NAME ANZAHL`. Gibt es nicht genug, gib `Nicht genug NAME` aus und ändere nichts. Fällt die Anzahl auf 0, verschwindet der Gegenstand ganz aus der Liste.',
        tests: [
          { stdin: 'add Trank 3\nremove Trank 1\nlist\nremove Trank 5\nremove Trank 2\nlist', expect: 'Trank: 2\nNicht genug Trank\nInventar leer' },
          { stdin: 'remove Schild 1', expect: 'Nicht genug Schild' },
        ],
        hint: '`inventar.find(name)` liefert einen Iterator, `inventar.erase(it)` löscht den Eintrag.',
        solution: INV_2,
      },
      {
        title: 'Gewichtsgrenze',
        task: 'Jeder Gegenstand wiegt etwas: Trank 1, Schwert 5, Schild 8 (als `const std::map`). Das Inventar trägt höchstens 20. Würde `add` die Grenze überschreiten, gib `Zu schwer` aus und füge nichts hinzu. Neuer Befehl `gewicht`: gibt `Gewicht: X/20` aus.',
        tests: [
          { stdin: 'add Schild 1\nadd Schwert 2\ngewicht\nadd Trank 3\nadd Schild 1\ngewicht\nlist', expect: 'Gewicht: 18/20\nZu schwer\nZu schwer\nGewicht: 18/20\nSchild: 1\nSchwert: 2' },
          { stdin: 'add Trank 20\ngewicht\nadd Trank 1', expect: 'Gewicht: 20/20\nZu schwer' },
        ],
        hint: 'Eine Funktion `int gesamt(const std::map<std::string, int>& inv)` berechnet das aktuelle Gewicht.',
        solution: INV_3,
      },
    ],
  },
  {
    id: 'cp-labyrinth',
    title: 'Labyrinth-Löser',
    summary: 'Ein Level einlesen, mit Breitensuche den kürzesten Weg finden und ihn einzeichnen. Spiele-KI in Reinform.',
    unlockAfter: 'cpp19',
    steps: [
      {
        title: 'Level einlesen',
        task: 'Lies zuerst Höhe und Breite, dann die Zeilen des Levels (`S` Start, `Z` Ziel, `#` Wand, `.` frei). Gib die Positionen als `Start: x y` und `Ziel: x y` aus (x ist die Spalte, y die Zeile, beide ab 0).',
        starter: inc('iostream', 'string', 'vector') + 'int main() {\n    \n    return 0;\n}\n',
        tests: MAZES.map(m => ({ stdin: m.stdin, expect: m.start })),
        solution: MAZE_1,
      },
      {
        title: 'Kürzester Weg',
        task: 'Finde mit einer Breitensuche die kürzeste Anzahl Schritte von S nach Z. Gib statt der Positionen `Schritte: N` aus, oder `Kein Weg`.',
        tests: MAZES.map(m => ({ stdin: m.stdin, expect: m.steps })),
        must: [[/std::queue/, 'Nutze `std::queue` für die Breitensuche.']],
        solution: MAZE_2,
      },
      {
        title: 'Den Weg einzeichnen',
        task: 'Merk dir für jedes Feld, von welchem Feld du gekommen bist. Gehe dann vom Ziel rückwärts zum Start und markiere jedes Feld dazwischen mit `*`. Gib das Level aus und danach `Schritte: N`. Gibt es keinen Weg, nur `Kein Weg`.\n\nWichtig für eindeutige Ergebnisse: Untersuche die Nachbarn in der Reihenfolge rechts, links, unten, oben.',
        tests: MAZES.map(m => ({ stdin: m.stdin, expect: m.path })),
        hint: 'Ein zweites Gitter `vorher` aus `std::pair<int, int>`. Setze es, wenn du ein Feld zum ersten Mal erreichst.',
        solution: MAZE_3,
      },
    ],
  },
];

/* ---------------------------------------------------------------- freie Aufgaben */

const M = body => inc('iostream') + 'int main() {\n' + body.split('\n').map(l => (l ? '    ' + l : l)).join('\n') + '\n    return 0;\n}\n';

export const cppChallenges = [
  { id: 'cc-gerade', level: 1, unlockAfter: 'cpp3', title: 'Gerade oder ungerade', short: 'Eine Zahl prüfen',
    task: 'Lies eine ganze Zahl ein und gib `gerade` oder `ungerade` aus. Achtung bei negativen Zahlen.',
    tests: [{ stdin: '4', expect: 'gerade' }, { stdin: '-7', expect: 'ungerade' }, { stdin: '0', expect: 'gerade' }],
    hint: 'In C++ ist `-7 % 2` gleich `-1`, nicht `1`. Prüfe darum auf `== 0`.',
    solution: M('int n;\nstd::cin >> n;\nstd::cout << (n % 2 == 0 ? "gerade" : "ungerade") << std::endl;') },
  { id: 'cc-max3', level: 1, unlockAfter: 'cpp3', title: 'Größte von drei', short: 'Ohne std::max',
    task: 'Lies drei ganze Zahlen und gib die größte aus, ohne `std::max`.',
    tests: [{ stdin: '3 9 4', expect: '9' }, { stdin: '-1 -5 -2', expect: '-1' }, { stdin: '7 7 2', expect: '7' }],
    mustNot: [[/std::max|max\s*\(/, 'Löse es ohne `std::max`.']],
    solution: M('int a, b, c;\nstd::cin >> a >> b >> c;\nint g = a;\nif (b > g) g = b;\nif (c > g) g = c;\nstd::cout << g << std::endl;') },
  { id: 'cc-summe', level: 1, unlockAfter: 'cpp4', title: 'Summe bis n', short: '1 + 2 + ... + n',
    task: 'Lies n ein und gib die Summe 1 + 2 + ... + n aus. n kann bis 100000 groß sein, achte auf den Zahlentyp.',
    tests: [{ stdin: '10', expect: '55' }, { stdin: '1', expect: '1' }, { stdin: '100000', expect: '5000050000' }],
    hint: '5000050000 passt nicht in einen `int`. Nimm `long long`.',
    solution: M('long long n;\nstd::cin >> n;\nlong long s = 0;\nfor (long long i = 1; i <= n; i++) s += i;\nstd::cout << s << std::endl;') },
  { id: 'cc-treppe', level: 1, unlockAfter: 'cpp4', title: 'Sternen-Treppe', short: 'Verschachtelte Schleifen',
    task: 'Lies n ein und gib eine Treppe aus n Zeilen aus: Zeile i besteht aus i Sternen `*`.',
    tests: [{ stdin: '3', expect: '*\n**\n***' }, { stdin: '1', expect: '*' }],
    solution: M('int n;\nstd::cin >> n;\nfor (int i = 1; i <= n; i++) {\n    for (int j = 0; j < i; j++) std::cout << "*";\n    std::cout << std::endl;\n}') },
  { id: 'cc-umdrehen', level: 2, unlockAfter: 'cpp6', title: 'Wort umdrehen', short: 'Strings von hinten',
    task: 'Lies ein Wort und gib es rückwärts aus.',
    tests: [{ stdin: 'Unreal', expect: 'laernU' }, { stdin: 'a', expect: 'a' }, { stdin: 'Laufzeit', expect: 'tiezfuaL' }],
    solution: inc('iostream', 'string') + 'int main() {\n    std::string w;\n    std::cin >> w;\n    for (int i = (int)w.size() - 1; i >= 0; i--) std::cout << w[i];\n    std::cout << std::endl;\n    return 0;\n}\n' },
  { id: 'cc-vokale', level: 2, unlockAfter: 'cpp6', title: 'Vokale zählen', short: 'Eine ganze Zeile lesen',
    task: 'Lies eine ganze Zeile (mit Leerzeichen) und gib die Anzahl der Vokale a, e, i, o, u aus, groß und klein.',
    tests: [{ stdin: 'Hallo Welt', expect: '3' }, { stdin: 'XYZ', expect: '0' }, { stdin: 'AEIOU aeiou', expect: '10' }],
    hint: '`std::getline(std::cin, zeile)` und `std::tolower` aus `<cctype>`.',
    solution: inc('iostream', 'string', 'cctype') + 'int main() {\n    std::string z;\n    std::getline(std::cin, z);\n    int n = 0;\n    for (char c : z) {\n        char k = (char)std::tolower((unsigned char)c);\n        if (k == \'a\' || k == \'e\' || k == \'i\' || k == \'o\' || k == \'u\') n++;\n    }\n    std::cout << n << std::endl;\n    return 0;\n}\n' },
  { id: 'cc-prim', level: 2, unlockAfter: 'cpp5', title: 'Primzahl', short: 'Mit eigener Funktion',
    task: 'Lies n ein. Gib `Primzahl` oder `keine Primzahl` aus. Schreib dafür `bool istPrim(int n)`.',
    tests: [{ stdin: '7', expect: 'Primzahl' }, { stdin: '1', expect: 'keine Primzahl' }, { stdin: '91', expect: 'keine Primzahl' }, { stdin: '97', expect: 'Primzahl' }],
    must: [[/bool\s+istPrim\s*\(/, 'Schreib `bool istPrim(int n)`.']],
    solution: inc('iostream') + 'bool istPrim(int n) {\n    if (n < 2) return false;\n    for (int i = 2; i * i <= n; i++)\n        if (n % i == 0) return false;\n    return true;\n}\n\nint main() {\n    int n;\n    std::cin >> n;\n    std::cout << (istPrim(n) ? "Primzahl" : "keine Primzahl") << std::endl;\n    return 0;\n}\n' },
  { id: 'cc-schnitt', level: 2, unlockAfter: 'cpp6', title: 'Durchschnitt', short: 'Zwei Nachkommastellen',
    task: 'Lies n und danach n ganze Zahlen. Gib den Durchschnitt mit genau zwei Nachkommastellen aus.',
    tests: [{ stdin: '3\n1 2 3', expect: '2.00' }, { stdin: '2\n1 2', expect: '1.50' }, { stdin: '3\n1 1 5', expect: '2.33' }],
    hint: '`std::cout << std::fixed << std::setprecision(2)` aus `<iomanip>`. Und an die Ganzzahl-Division denken.',
    solution: inc('iostream', 'iomanip') + 'int main() {\n    int n;\n    std::cin >> n;\n    double s = 0;\n    for (int i = 0; i < n; i++) {\n        int x;\n        std::cin >> x;\n        s += x;\n    }\n    std::cout << std::fixed << std::setprecision(2) << s / n << std::endl;\n    return 0;\n}\n' },
  { id: 'cc-haeufig', level: 3, unlockAfter: 'cpp16', title: 'Häufigstes Wort', short: 'map zum Zählen',
    task: 'Lies Wörter bis zum Eingabeende und gib das häufigste aus. Bei Gleichstand das alphabetisch kleinste.',
    tests: [{ stdin: 'ork geist ork drache', expect: 'ork' }, { stdin: 'b a b a', expect: 'a' }, { stdin: 'solo', expect: 'solo' }],
    solution: inc('iostream', 'map', 'string') + 'int main() {\n    std::map<std::string, int> z;\n    std::string w;\n    while (std::cin >> w) z[w]++;\n    std::string best;\n    int n = 0;\n    for (const auto& [wort, anzahl] : z) {\n        if (anzahl > n) { best = wort; n = anzahl; }\n    }\n    std::cout << best << std::endl;\n    return 0;\n}\n' },
  { id: 'cc-anagramm', level: 3, unlockAfter: 'cpp14', title: 'Anagramm', short: 'Sortieren hilft',
    task: 'Lies zwei Wörter (nur Kleinbuchstaben). Gib `Ja` aus, wenn sie Anagramme sind, sonst `Nein`.',
    tests: [{ stdin: 'lager regal', expect: 'Ja' }, { stdin: 'abc abd', expect: 'Nein' }, { stdin: 'aab ab', expect: 'Nein' }],
    solution: inc('iostream', 'string', 'algorithm') + 'int main() {\n    std::string a, b;\n    std::cin >> a >> b;\n    std::sort(a.begin(), a.end());\n    std::sort(b.begin(), b.end());\n    std::cout << (a == b ? "Ja" : "Nein") << std::endl;\n    return 0;\n}\n' },
  { id: 'cc-fib', level: 3, unlockAfter: 'cpp15', title: 'Große Fibonacci-Zahl', short: 'Rekursion ist hier zu langsam',
    task: 'Lies n (0 bis 90) und gib die n-te Fibonacci-Zahl aus (fib(0) = 0, fib(1) = 1). Rekursion ohne Gedächtnis wäre viel zu langsam, rechne mit einer Schleife.',
    tests: [{ stdin: '10', expect: '55' }, { stdin: '0', expect: '0' }, { stdin: '90', expect: '2880067194370816120' }],
    solution: M('int n;\nstd::cin >> n;\nlong long a = 0, b = 1;\nfor (int i = 0; i < n; i++) {\n    long long c = a + b;\n    a = b;\n    b = c;\n}\nstd::cout << a << std::endl;') },
  { id: 'cc-klammern', level: 3, unlockAfter: 'cpp15', title: 'Klammer-Prüfer', short: 'Mit einem Stack',
    task: 'Lies eine Zeile und gib `ok` aus, wenn alle Klammern `()`, `[]` und `{}` korrekt sind, sonst `fehler`.',
    tests: [{ stdin: 'int main() { return a[0]; }', expect: 'ok' }, { stdin: '(]', expect: 'fehler' }, { stdin: '((', expect: 'fehler' }],
    solution: inc('iostream', 'stack', 'string') + 'int main() {\n    std::string z;\n    std::getline(std::cin, z);\n    std::stack<char> s;\n    bool ok = true;\n    for (char c : z) {\n        if (c == \'(\' || c == \'[\' || c == \'{\') s.push(c);\n        else if (c == \')\' || c == \']\' || c == \'}\') {\n            char auf = c == \')\' ? \'(\' : c == \']\' ? \'[\' : \'{\';\n            if (s.empty() || s.top() != auf) { ok = false; break; }\n            s.pop();\n        }\n    }\n    std::cout << (ok && s.empty() ? "ok" : "fehler") << std::endl;\n    return 0;\n}\n' },
  { id: 'cc-matrix', level: 3, unlockAfter: 'cpp6', title: 'Spielfeld drehen', short: '90 Grad im Uhrzeigersinn',
    task: 'Lies Höhe und Breite und danach die Zeilen eines Spielfelds. Gib es um 90 Grad im Uhrzeigersinn gedreht aus.',
    tests: [{ stdin: '2 3\nabc\ndef', expect: 'da\neb\nfc' }, { stdin: '1 1\nx', expect: 'x' }],
    hint: 'Die neue Zeile x besteht aus Spalte x der alten Zeilen, von unten nach oben gelesen.',
    solution: inc('iostream', 'string', 'vector') + 'int main() {\n    int h, w;\n    std::cin >> h >> w;\n    std::vector<std::string> f(h);\n    for (auto& z : f) std::cin >> z;\n    for (int x = 0; x < w; x++) {\n        for (int y = h - 1; y >= 0; y--) std::cout << f[y][x];\n        std::cout << std::endl;\n    }\n    return 0;\n}\n' },
];
