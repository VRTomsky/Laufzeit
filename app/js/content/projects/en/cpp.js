// C++ (English): projects (several stages) and free tasks (description + test cases only)

const inc = (...names) => names.map(n => `#include <${n}>`).join('\n') + '\n\n';

/* ---------------------------------------------------------------- Tic-tac-toe */

const TTT_SHOW = `char board[3][3];

void show() {
    for (int r = 0; r < 3; r++) {
        for (int c = 0; c < 3; c++) std::cout << board[r][c];
        std::cout << std::endl;
    }
}
`;

const TTT_1 = inc('iostream') + TTT_SHOW + `
int main() {
    for (int r = 0; r < 3; r++)
        for (int c = 0; c < 3; c++) board[r][c] = '.';
    show();
    return 0;
}
`;

const TTT_2 = inc('iostream') + TTT_SHOW + `
int main() {
    for (int r = 0; r < 3; r++)
        for (int c = 0; c < 3; c++) board[r][c] = '.';
    char player = 'X';
    int r, c;
    while (std::cin >> r >> c) {
        if (r < 0 || r > 2 || c < 0 || c > 2 || board[r][c] != '.') {
            std::cout << "Field taken" << std::endl;
            continue;
        }
        board[r][c] = player;
        player = player == 'X' ? 'O' : 'X';
    }
    show();
    return 0;
}
`;

const TTT_3 = inc('iostream') + TTT_SHOW + `
bool won(char p) {
    for (int i = 0; i < 3; i++) {
        if (board[i][0] == p && board[i][1] == p && board[i][2] == p) return true;
        if (board[0][i] == p && board[1][i] == p && board[2][i] == p) return true;
    }
    if (board[0][0] == p && board[1][1] == p && board[2][2] == p) return true;
    return board[0][2] == p && board[1][1] == p && board[2][0] == p;
}

int main() {
    for (int r = 0; r < 3; r++)
        for (int c = 0; c < 3; c++) board[r][c] = '.';
    char player = 'X';
    int moves = 0;
    int r, c;
    while (std::cin >> r >> c) {
        if (r < 0 || r > 2 || c < 0 || c > 2 || board[r][c] != '.') {
            std::cout << "Field taken" << std::endl;
            continue;
        }
        board[r][c] = player;
        moves++;
        if (won(player)) {
            show();
            std::cout << player << " wins" << std::endl;
            return 0;
        }
        player = player == 'X' ? 'O' : 'X';
    }
    show();
    if (moves == 9) std::cout << "Draw" << std::endl;
    return 0;
}
`;

/* ---------------------------------------------------------------- Battle */

const FIGHTER = `class Fighter {
public:
    Fighter(std::string name, int hp, int attack)
        : name(name), hp(hp), maxHp(hp), attack(attack) {}
    virtual ~Fighter() = default;

    virtual int damage() const { return attack; }
    void strike(Fighter& target) const {
        target.hp -= damage();
        if (target.hp < 0) target.hp = 0;
    }
    bool alive() const { return hp > 0; }

    std::string name;
    int hp;
    int maxHp;
    int attack;
};
`;

const TURN = `
void turn(const Fighter& a, Fighter& t) {
    a.strike(t);
    std::cout << a.name << " hits " << t.name << ": " << t.hp << " HP left" << std::endl;
}

void battle(Fighter& hero, Fighter& enemy) {
    while (hero.alive() && enemy.alive()) {
        turn(hero, enemy);
        if (enemy.alive()) turn(enemy, hero);
    }
    std::cout << (hero.alive() ? hero.name : enemy.name) << " wins" << std::endl;
}
`;

const FIGHT_1 = inc('iostream', 'string') + FIGHTER + `
int main() {
    Fighter hero("Ada", 30, 8);
    Fighter orc("Orc", 20, 5);
    hero.strike(orc);
    hero.strike(orc);
    std::cout << orc.hp << std::endl;
    hero.strike(orc);
    std::cout << orc.hp << std::endl;
    return 0;
}
`;

const FIGHT_2 = inc('iostream', 'string') + FIGHTER + TURN + `
int main() {
    Fighter hero("Ada", 30, 8);
    Fighter orc("Orc", 20, 5);
    battle(hero, orc);
    return 0;
}
`;

const FIGHT_3 = inc('iostream', 'string') + FIGHTER + `
class Berserker : public Fighter {
public:
    using Fighter::Fighter;
    int damage() const override {
        return hp * 2 < maxHp ? attack * 2 : attack;
    }
};
` + TURN + `
int main() {
    Fighter hero("Ada", 30, 6);
    Berserker grok("Grok", 30, 5);
    battle(hero, grok);
    return 0;
}
`;

/* ---------------------------------------------------------------- Inventory */

const INV_1 = inc('iostream', 'map', 'string') + `int main() {
    std::map<std::string, int> inventory;
    std::string command;
    while (std::cin >> command) {
        if (command == "add") {
            std::string name;
            int n;
            std::cin >> name >> n;
            inventory[name] += n;
        } else if (command == "list") {
            if (inventory.empty()) std::cout << "Inventory empty" << std::endl;
            for (const auto& [name, n] : inventory) std::cout << name << ": " << n << std::endl;
        }
    }
    return 0;
}
`;

const INV_2 = inc('iostream', 'map', 'string') + `int main() {
    std::map<std::string, int> inventory;
    std::string command;
    while (std::cin >> command) {
        if (command == "add") {
            std::string name;
            int n;
            std::cin >> name >> n;
            inventory[name] += n;
        } else if (command == "remove") {
            std::string name;
            int n;
            std::cin >> name >> n;
            auto it = inventory.find(name);
            if (it == inventory.end() || it->second < n) {
                std::cout << "Not enough " << name << std::endl;
                continue;
            }
            it->second -= n;
            if (it->second == 0) inventory.erase(it);
        } else if (command == "list") {
            if (inventory.empty()) std::cout << "Inventory empty" << std::endl;
            for (const auto& [name, n] : inventory) std::cout << name << ": " << n << std::endl;
        }
    }
    return 0;
}
`;

const INV_3 = inc('iostream', 'map', 'string') + `const std::map<std::string, int> WEIGHT = {{"Potion", 1}, {"Sword", 5}, {"Shield", 8}};
const int MAX_LOAD = 20;

int total(const std::map<std::string, int>& inv) {
    int t = 0;
    for (const auto& [name, n] : inv) t += WEIGHT.at(name) * n;
    return t;
}

int main() {
    std::map<std::string, int> inventory;
    std::string command;
    while (std::cin >> command) {
        if (command == "add") {
            std::string name;
            int n;
            std::cin >> name >> n;
            if (total(inventory) + WEIGHT.at(name) * n > MAX_LOAD) {
                std::cout << "Too heavy" << std::endl;
                continue;
            }
            inventory[name] += n;
        } else if (command == "remove") {
            std::string name;
            int n;
            std::cin >> name >> n;
            auto it = inventory.find(name);
            if (it == inventory.end() || it->second < n) {
                std::cout << "Not enough " << name << std::endl;
                continue;
            }
            it->second -= n;
            if (it->second == 0) inventory.erase(it);
        } else if (command == "list") {
            if (inventory.empty()) std::cout << "Inventory empty" << std::endl;
            for (const auto& [name, n] : inventory) std::cout << name << ": " << n << std::endl;
        } else if (command == "weight") {
            std::cout << "Weight: " << total(inventory) << "/" << MAX_LOAD << std::endl;
        }
    }
    return 0;
}
`;

/* ---------------------------------------------------------------- Maze */

const MAZE_READ = `    int h, w;
    std::cin >> h >> w;
    std::vector<std::string> grid(h);
    for (auto& row : grid) std::cin >> row;
    int sx = 0, sy = 0, gx = 0, gy = 0;
    for (int y = 0; y < h; y++) {
        for (int x = 0; x < w; x++) {
            if (grid[y][x] == 'S') { sx = x; sy = y; }
            if (grid[y][x] == 'Z') { gx = x; gy = y; }
        }
    }
`;

const MAZE_1 = inc('iostream', 'string', 'vector') + `int main() {
${MAZE_READ}    std::cout << "Start: " << sx << " " << sy << std::endl;
    std::cout << "Goal: " << gx << " " << gy << std::endl;
    return 0;
}
`;

const MAZE_BFS = `    std::vector<std::vector<int>> dist(h, std::vector<int>(w, -1));
    std::vector<std::vector<std::pair<int, int>>> prev(h, std::vector<std::pair<int, int>>(w, {-1, -1}));
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
            if (grid[ny][nx] == '#' || dist[ny][nx] != -1) continue;
            dist[ny][nx] = dist[y][x] + 1;
            prev[ny][nx] = {x, y};
            q.push({nx, ny});
        }
    }
    if (dist[gy][gx] == -1) {
        std::cout << "No path" << std::endl;
        return 0;
    }
`;

const MAZE_2 = inc('iostream', 'queue', 'string', 'vector') + `int main() {
${MAZE_READ}${MAZE_BFS}    std::cout << "Steps: " << dist[gy][gx] << std::endl;
    return 0;
}
`;

const MAZE_3 = inc('iostream', 'queue', 'string', 'vector') + `int main() {
${MAZE_READ}${MAZE_BFS}    auto [px, py] = prev[gy][gx];
    while (!(px == sx && py == sy)) {
        grid[py][px] = '*';
        auto next = prev[py][px];
        px = next.first;
        py = next.second;
    }
    for (const auto& row : grid) std::cout << row << std::endl;
    std::cout << "Steps: " << dist[gy][gx] << std::endl;
    return 0;
}
`;

const MAZES = [
  { stdin: '3 5\nS..#.\n.#...\n...#Z', start: 'Start: 0 0\nGoal: 4 2', steps: 'Steps: 6', path: 'S**#.\n.#***\n...#Z\nSteps: 6' },
  { stdin: '2 3\nS#Z\n.#.', start: 'Start: 0 0\nGoal: 2 0', steps: 'No path', path: 'No path' },
  { stdin: '1 4\nZ..S', start: 'Start: 3 0\nGoal: 0 0', steps: 'Steps: 3', path: 'Z**S\nSteps: 3' },
];

export const cppProjects = [
  {
    id: 'cp-ttt',
    title: 'Tic-tac-toe',
    summary: 'A board as a 2D array, moves from the keyboard and a win check.',
    unlockAfter: 'cpp6',
    steps: [
      {
        title: 'The board',
        task: 'The board is a `char board[3][3]`. Fill every field with `.` and write a function `void show()` that outputs the board row by row (3 characters per row, no spaces).',
        starter: inc('iostream') + 'char board[3][3];\n\n// show()\n\nint main() {\n    \n    return 0;\n}\n',
        tests: [{ stdin: '', expect: '...\n...\n...' }],
        must: [[/void\s+show\s*\(\s*\)/, 'Write the function `void show()`.']],
        solution: TTT_1,
      },
      {
        title: 'Moves',
        task: 'Read moves as `row column` (0 to 2) until the input ends. X starts, then they take turns. If the field is taken or invalid, output `Field taken`, and the **same** player goes again. At the end output the board.',
        tests: [
          { stdin: '0 0\n1 1\n0 0\n2 2', expect: 'Field taken\nX..\n.O.\n..X' },
          { stdin: '1 1\n0 2\n5 5', expect: 'Field taken\n..O\n.X.\n...' },
        ],
        hint: '`while (std::cin >> r >> c)` reads as long as numbers come. With `continue` you skip switching players.',
        solution: TTT_2,
      },
      {
        title: 'Who wins?',
        task: 'Write `bool won(char p)` that checks all rows, columns and both diagonals. After every valid move: if the player has won, output the board and `X wins` or `O wins` and end the program. If the input ends without a winner, output the board and, if all 9 fields are full, also `Draw`.',
        tests: [
          { stdin: '0 0\n1 0\n0 1\n1 1\n0 2', expect: 'XXX\nOO.\n...\nX wins' },
          { stdin: '0 0\n0 1\n0 2\n1 1\n1 0\n1 2\n2 1\n2 0\n2 2', expect: 'XOX\nXOO\nOXX\nDraw' },
          { stdin: '0 0\n0 2\n1 0\n1 1\n2 2\n2 0', expect: 'X.O\nXO.\nO.X\nO wins' },
        ],
        must: [[/bool\s+won\s*\(\s*char/, 'Write `bool won(char p)`.']],
        hint: 'One loop over i from 0 to 2 checks row i and column i at the same time. Check the two diagonals separately afterwards.',
        solution: TTT_3,
      },
    ],
  },
  {
    id: 'cp-kampf',
    title: 'Battle system',
    summary: 'Fighters as classes, a battle sequence and a berserker who strikes differently thanks to virtual.',
    unlockAfter: 'cpp10',
    steps: [
      {
        title: 'The fighter class',
        task: 'Write `class Fighter` with `name`, `hp`, `maxHp` (= start HP) and `attack`, a matching constructor, `virtual int damage() const` (returns `attack`), `void strike(Fighter& target) const` (HP never below 0) and `bool alive() const`. In main: Ada (30, 8) strikes Orc (20, 5) twice, output the orc\'s HP, then a third time and output HP again.',
        starter: inc('iostream', 'string') + '// class Fighter\n\nint main() {\n    \n    return 0;\n}\n',
        tests: [{ stdin: '', expect: '4\n0' }],
        must: [[/class\s+Fighter/, 'Create `class Fighter`.'], [/virtual\s+int\s+damage\s*\(\s*\)\s*const/, 'The method is called `virtual int damage() const`.']],
        solution: FIGHT_1,
      },
      {
        title: 'The battle sequence',
        task: 'Write `void battle(Fighter& hero, Fighter& enemy)`: taking turns, the hero starts, a defeated fighter doesn\'t strike back. Every hit: `Ada hits Orc: 12 HP left`. At the end `Ada wins` or `Orc wins`. Test with Ada (30, 8) against Orc (20, 5).',
        tests: [{ stdin: '', expect: 'Ada hits Orc: 12 HP left\nOrc hits Ada: 25 HP left\nAda hits Orc: 4 HP left\nOrc hits Ada: 20 HP left\nAda hits Orc: 0 HP left\nAda wins' }],
        must: [[/void\s+battle\s*\(/, 'Write `void battle(Fighter& hero, Fighter& enemy)`.']],
        solution: FIGHT_2,
      },
      {
        title: 'The berserker',
        task: 'Derive `class Berserker : public Fighter`. It overrides `damage()` with `override`: if its HP is below half of `maxHp`, it deals double damage. Let Ada (30 HP, 6 attack) fight the berserker Grok (30 HP, 5 attack).',
        tests: [{ stdin: '', expect: 'Ada hits Grok: 24 HP left\nGrok hits Ada: 25 HP left\nAda hits Grok: 18 HP left\nGrok hits Ada: 20 HP left\nAda hits Grok: 12 HP left\nGrok hits Ada: 10 HP left\nAda hits Grok: 6 HP left\nGrok hits Ada: 0 HP left\nGrok wins' }],
        must: [[/class\s+Berserker\s*:\s*public\s+Fighter/, 'Derive with `class Berserker : public Fighter`.'], [/override/, 'Mark `damage()` with `override`.']],
        hint: '`using Fighter::Fighter;` takes over the constructor of the base class. Since `strike` calls the virtual method `damage()`, the berserker works automatically.',
        solution: FIGHT_3,
      },
    ],
  },
  {
    id: 'cp-inventar',
    title: 'Inventory system',
    summary: 'Process commands, manage items in a map, respect a weight limit.',
    unlockAfter: 'cpp16',
    steps: [
      {
        title: 'Add and list',
        task: 'Read commands until the input ends:\n\n- `add NAME COUNT`: add items\n- `list`: all items alphabetically as `NAME: COUNT`, or `Inventory empty`',
        starter: inc('iostream', 'map', 'string') + 'int main() {\n    \n    return 0;\n}\n',
        tests: [
          { stdin: 'list\nadd Potion 2\nadd Sword 1\nadd Potion 3\nlist', expect: 'Inventory empty\nPotion: 5\nSword: 1' },
          { stdin: 'add Arrow 20\nlist', expect: 'Arrow: 20' },
        ],
        must: [[/std::map/, 'Use `std::map<std::string, int>`.']],
        solution: INV_1,
      },
      {
        title: 'Removing',
        task: 'New command `remove NAME COUNT`. If there aren\'t enough, output `Not enough NAME` and change nothing. If the count drops to 0, the item disappears from the list completely.',
        tests: [
          { stdin: 'add Potion 3\nremove Potion 1\nlist\nremove Potion 5\nremove Potion 2\nlist', expect: 'Potion: 2\nNot enough Potion\nInventory empty' },
          { stdin: 'remove Shield 1', expect: 'Not enough Shield' },
        ],
        hint: '`inventory.find(name)` returns an iterator, `inventory.erase(it)` deletes the entry.',
        solution: INV_2,
      },
      {
        title: 'Weight limit',
        task: 'Every item has a weight: Potion 1, Sword 5, Shield 8 (as a `const std::map`). The inventory carries at most 20. If `add` would exceed the limit, output `Too heavy` and add nothing. New command `weight`: outputs `Weight: X/20`.',
        tests: [
          { stdin: 'add Shield 1\nadd Sword 2\nweight\nadd Potion 3\nadd Shield 1\nweight\nlist', expect: 'Weight: 18/20\nToo heavy\nToo heavy\nWeight: 18/20\nShield: 1\nSword: 2' },
          { stdin: 'add Potion 20\nweight\nadd Potion 1', expect: 'Weight: 20/20\nToo heavy' },
        ],
        hint: 'A function `int total(const std::map<std::string, int>& inv)` calculates the current weight.',
        solution: INV_3,
      },
    ],
  },
  {
    id: 'cp-labyrinth',
    title: 'Maze solver',
    summary: 'Read a level, find the shortest path with breadth-first search and draw it in. Game AI in its purest form.',
    unlockAfter: 'cpp19',
    steps: [
      {
        title: 'Reading the level',
        task: 'First read height and width, then the rows of the level (`S` start, `Z` goal, `#` wall, `.` free). Output the positions as `Start: x y` and `Goal: x y` (x is the column, y the row, both from 0).',
        starter: inc('iostream', 'string', 'vector') + 'int main() {\n    \n    return 0;\n}\n',
        tests: MAZES.map(m => ({ stdin: m.stdin, expect: m.start })),
        solution: MAZE_1,
      },
      {
        title: 'Shortest path',
        task: 'Use breadth-first search to find the shortest number of steps from S to Z. Instead of the positions output `Steps: N`, or `No path`.',
        tests: MAZES.map(m => ({ stdin: m.stdin, expect: m.steps })),
        must: [[/std::queue/, 'Use `std::queue` for the breadth-first search.']],
        solution: MAZE_2,
      },
      {
        title: 'Drawing the path',
        task: 'For every field remember which field you came from. Then walk backwards from the goal to the start and mark every field in between with `*`. Output the level and then `Steps: N`. If there is no path, only `No path`.\n\nImportant for unique results: check the neighbours in the order right, left, down, up.',
        tests: MAZES.map(m => ({ stdin: m.stdin, expect: m.path })),
        hint: 'A second grid `prev` of `std::pair<int, int>`. Set it when you reach a field for the first time.',
        solution: MAZE_3,
      },
    ],
  },
];

/* ---------------------------------------------------------------- free tasks */

const M = body => inc('iostream') + 'int main() {\n' + body.split('\n').map(l => (l ? '    ' + l : l)).join('\n') + '\n    return 0;\n}\n';

export const cppChallenges = [
  { id: 'cc-gerade', level: 1, unlockAfter: 'cpp3', title: 'Even or odd', short: 'Check a number',
    task: 'Read a whole number and output `even` or `odd`. Careful with negative numbers.',
    tests: [{ stdin: '4', expect: 'even' }, { stdin: '-7', expect: 'odd' }, { stdin: '0', expect: 'even' }],
    hint: 'In C++ `-7 % 2` is `-1`, not `1`. So check for `== 0`.',
    solution: M('int n;\nstd::cin >> n;\nstd::cout << (n % 2 == 0 ? "even" : "odd") << std::endl;') },
  { id: 'cc-max3', level: 1, unlockAfter: 'cpp3', title: 'Biggest of three', short: 'Without std::max',
    task: 'Read three whole numbers and output the biggest, without `std::max`.',
    tests: [{ stdin: '3 9 4', expect: '9' }, { stdin: '-1 -5 -2', expect: '-1' }, { stdin: '7 7 2', expect: '7' }],
    mustNot: [[/std::max|max\s*\(/, 'Solve it without `std::max`.']],
    solution: M('int a, b, c;\nstd::cin >> a >> b >> c;\nint g = a;\nif (b > g) g = b;\nif (c > g) g = c;\nstd::cout << g << std::endl;') },
  { id: 'cc-summe', level: 1, unlockAfter: 'cpp4', title: 'Sum up to n', short: '1 + 2 + ... + n',
    task: 'Read n and output the sum 1 + 2 + ... + n. n can be up to 100000, watch the number type.',
    tests: [{ stdin: '10', expect: '55' }, { stdin: '1', expect: '1' }, { stdin: '100000', expect: '5000050000' }],
    hint: '5000050000 doesn\'t fit in an `int`. Use `long long`.',
    solution: M('long long n;\nstd::cin >> n;\nlong long s = 0;\nfor (long long i = 1; i <= n; i++) s += i;\nstd::cout << s << std::endl;') },
  { id: 'cc-treppe', level: 1, unlockAfter: 'cpp4', title: 'Star staircase', short: 'Nested loops',
    task: 'Read n and output a staircase of n rows: row i consists of i stars `*`.',
    tests: [{ stdin: '3', expect: '*\n**\n***' }, { stdin: '1', expect: '*' }],
    solution: M('int n;\nstd::cin >> n;\nfor (int i = 1; i <= n; i++) {\n    for (int j = 0; j < i; j++) std::cout << "*";\n    std::cout << std::endl;\n}') },
  { id: 'cc-umdrehen', level: 2, unlockAfter: 'cpp6', title: 'Reverse a word', short: 'Strings from the back',
    task: 'Read a word and output it backwards.',
    tests: [{ stdin: 'Unreal', expect: 'laernU' }, { stdin: 'a', expect: 'a' }, { stdin: 'Laufzeit', expect: 'tiezfuaL' }],
    solution: inc('iostream', 'string') + 'int main() {\n    std::string w;\n    std::cin >> w;\n    for (int i = (int)w.size() - 1; i >= 0; i--) std::cout << w[i];\n    std::cout << std::endl;\n    return 0;\n}\n' },
  { id: 'cc-vokale', level: 2, unlockAfter: 'cpp6', title: 'Counting vowels', short: 'Read a whole line',
    task: 'Read a whole line (with spaces) and output the number of vowels a, e, i, o, u, upper and lower case.',
    tests: [{ stdin: 'Hello World', expect: '3' }, { stdin: 'XYZ', expect: '0' }, { stdin: 'AEIOU aeiou', expect: '10' }],
    hint: '`std::getline(std::cin, line)` and `std::tolower` from `<cctype>`.',
    solution: inc('iostream', 'string', 'cctype') + 'int main() {\n    std::string line;\n    std::getline(std::cin, line);\n    int n = 0;\n    for (char c : line) {\n        char k = (char)std::tolower((unsigned char)c);\n        if (k == \'a\' || k == \'e\' || k == \'i\' || k == \'o\' || k == \'u\') n++;\n    }\n    std::cout << n << std::endl;\n    return 0;\n}\n' },
  { id: 'cc-prim', level: 2, unlockAfter: 'cpp5', title: 'Prime number', short: 'With your own function',
    task: 'Read n. Output `prime` or `not prime`. Write `bool isPrime(int n)` for it.',
    tests: [{ stdin: '7', expect: 'prime' }, { stdin: '1', expect: 'not prime' }, { stdin: '91', expect: 'not prime' }, { stdin: '97', expect: 'prime' }],
    must: [[/bool\s+isPrime\s*\(/, 'Write `bool isPrime(int n)`.']],
    solution: inc('iostream') + 'bool isPrime(int n) {\n    if (n < 2) return false;\n    for (int i = 2; i * i <= n; i++)\n        if (n % i == 0) return false;\n    return true;\n}\n\nint main() {\n    int n;\n    std::cin >> n;\n    std::cout << (isPrime(n) ? "prime" : "not prime") << std::endl;\n    return 0;\n}\n' },
  { id: 'cc-schnitt', level: 2, unlockAfter: 'cpp6', title: 'Average', short: 'Two decimal places',
    task: 'Read n and then n whole numbers. Output the average with exactly two decimal places.',
    tests: [{ stdin: '3\n1 2 3', expect: '2.00' }, { stdin: '2\n1 2', expect: '1.50' }, { stdin: '3\n1 1 5', expect: '2.33' }],
    hint: '`std::cout << std::fixed << std::setprecision(2)` from `<iomanip>`. And remember integer division.',
    solution: inc('iostream', 'iomanip') + 'int main() {\n    int n;\n    std::cin >> n;\n    double s = 0;\n    for (int i = 0; i < n; i++) {\n        int x;\n        std::cin >> x;\n        s += x;\n    }\n    std::cout << std::fixed << std::setprecision(2) << s / n << std::endl;\n    return 0;\n}\n' },
  { id: 'cc-haeufig', level: 3, unlockAfter: 'cpp16', title: 'Most common word', short: 'A map for counting',
    task: 'Read words until the input ends and output the most common one. On a tie, the alphabetically smallest.',
    tests: [{ stdin: 'orc ghost orc dragon', expect: 'orc' }, { stdin: 'b a b a', expect: 'a' }, { stdin: 'solo', expect: 'solo' }],
    solution: inc('iostream', 'map', 'string') + 'int main() {\n    std::map<std::string, int> counts;\n    std::string w;\n    while (std::cin >> w) counts[w]++;\n    std::string best;\n    int n = 0;\n    for (const auto& [word, count] : counts) {\n        if (count > n) { best = word; n = count; }\n    }\n    std::cout << best << std::endl;\n    return 0;\n}\n' },
  { id: 'cc-anagramm', level: 3, unlockAfter: 'cpp14', title: 'Anagram', short: 'Sorting helps',
    task: 'Read two words (lower case only). Output `Yes` if they are anagrams, otherwise `No`.',
    tests: [{ stdin: 'listen silent', expect: 'Yes' }, { stdin: 'abc abd', expect: 'No' }, { stdin: 'aab ab', expect: 'No' }],
    solution: inc('iostream', 'string', 'algorithm') + 'int main() {\n    std::string a, b;\n    std::cin >> a >> b;\n    std::sort(a.begin(), a.end());\n    std::sort(b.begin(), b.end());\n    std::cout << (a == b ? "Yes" : "No") << std::endl;\n    return 0;\n}\n' },
  { id: 'cc-fib', level: 3, unlockAfter: 'cpp15', title: 'Big Fibonacci number', short: 'Recursion is too slow here',
    task: 'Read n (0 to 90) and output the n-th Fibonacci number (fib(0) = 0, fib(1) = 1). Recursion without memory would be far too slow, calculate with a loop.',
    tests: [{ stdin: '10', expect: '55' }, { stdin: '0', expect: '0' }, { stdin: '90', expect: '2880067194370816120' }],
    solution: M('int n;\nstd::cin >> n;\nlong long a = 0, b = 1;\nfor (int i = 0; i < n; i++) {\n    long long c = a + b;\n    a = b;\n    b = c;\n}\nstd::cout << a << std::endl;') },
  { id: 'cc-klammern', level: 3, unlockAfter: 'cpp15', title: 'Bracket checker', short: 'With a stack',
    task: 'Read a line and output `ok` if all brackets `()`, `[]` and `{}` are correct, otherwise `error`.',
    tests: [{ stdin: 'int main() { return a[0]; }', expect: 'ok' }, { stdin: '(]', expect: 'error' }, { stdin: '((', expect: 'error' }],
    solution: inc('iostream', 'stack', 'string') + 'int main() {\n    std::string line;\n    std::getline(std::cin, line);\n    std::stack<char> s;\n    bool ok = true;\n    for (char c : line) {\n        if (c == \'(\' || c == \'[\' || c == \'{\') s.push(c);\n        else if (c == \')\' || c == \']\' || c == \'}\') {\n            char open = c == \')\' ? \'(\' : c == \']\' ? \'[\' : \'{\';\n            if (s.empty() || s.top() != open) { ok = false; break; }\n            s.pop();\n        }\n    }\n    std::cout << (ok && s.empty() ? "ok" : "error") << std::endl;\n    return 0;\n}\n' },
  { id: 'cc-matrix', level: 3, unlockAfter: 'cpp6', title: 'Rotating the board', short: '90 degrees clockwise',
    task: 'Read height and width and then the rows of a board. Output it rotated 90 degrees clockwise.',
    tests: [{ stdin: '2 3\nabc\ndef', expect: 'da\neb\nfc' }, { stdin: '1 1\nx', expect: 'x' }],
    hint: 'New row x consists of column x of the old rows, read from bottom to top.',
    solution: inc('iostream', 'string', 'vector') + 'int main() {\n    int h, w;\n    std::cin >> h >> w;\n    std::vector<std::string> f(h);\n    for (auto& r : f) std::cin >> r;\n    for (int x = 0; x < w; x++) {\n        for (int y = h - 1; y >= 0; y--) std::cout << f[y][x];\n        std::cout << std::endl;\n    }\n    return 0;\n}\n' },
];
