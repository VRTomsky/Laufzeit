// C++ units 15 to 19 (pro, English): recursion and your own data structures, STL containers,
// RAII and move, game architecture, AI for games

import { concept, mc, predict, fill, order, write, cppFile } from '../helpers.js';

export const cppUnits15to19 = [
  /* ------------------------------------------------------------ 15 */
  {
    id: 'cpp15',
    title: 'Recursion and your own data structures',
    summary: 'Recursive functions, a linked list with pointers and your own stack as a template.',
    lessons: [
      {
        id: 'cpp15-1',
        title: 'Recursion in C++',
        goal: 'Write recursive functions and understand the call stack.',
        steps: [
          concept('The call stack',
            'Every function call gets its own slot on the **stack** with its local variables. With recursion these slots pile up until the base case is reached, then they are removed again from the top.\n\nRecursion that goes too deep blows the stack: **stack overflow**. That is exactly where the name of the famous website comes from.',
            { code: 'int factorial(int n) {\n    if (n <= 1) return 1;        // base case\n    return n * factorial(n - 1); // recursive step\n}', flow: ['factorial(3)', 'factorial(2)', 'factorial(1) = 1', '2 * 1 = 2', '3 * 2 = 6'] }),
          predict('What does this code output?', cppFile('int power(int b, int e) {\n    if (e == 0) return 1;\n    return b * power(b, e - 1);\n}', 'std::cout << power(2, 5) << std::endl;'), '32'),
          mc('What is a stack overflow?', ['Too many nested calls, the stack memory is full', 'An array on the heap that is too big', 'An error while compiling', 'Just a website'], 0),
          write('Write `int fib(int n)` recursively and output `fib(10)`.',
            cppFile('', ''),
            { expect: '55', must: [[/int\s+fib\s*\(\s*int/, 'Create `int fib(int n)`.'], [/fib\s*\(\s*n\s*-\s*1\s*\)/, 'Call `fib(n - 1)` recursively.']], solution: cppFile('int fib(int n) {\n    if (n < 2) return n;\n    return fib(n - 1) + fib(n - 2);\n}', 'std::cout << fib(10) << std::endl;') }),
        ],
      },
      {
        id: 'cpp15-2',
        title: 'Linked list',
        goal: 'Build a data structure of nodes and pointers yourself.',
        steps: [
          concept('Nodes pointing at each other',
            'A **linked list** consists of nodes. Each stores a value and a pointer to the next one. The last one points to `nullptr`.\n\nAdvantage: inserting at the front is O(1). Disadvantage: the nodes are scattered in memory, so for the processor it is usually slower than `std::vector`. You still build it once yourself, because it trains pointers perfectly and is a favourite in job interviews.',
            {
              code: 'struct Node {\n    int value;\n    std::unique_ptr<Node> next;\n};',
              memory: [
                { name: 'head', type: 'Node', value: '1 | next', kind: 'heap' }, { arrow: '->' },
                { name: '', type: 'Node', value: '2 | next', kind: 'heap' }, { arrow: '->' },
                { name: '', type: 'Node', value: '3 | nullptr', kind: 'heap' },
              ],
              memoryCaption: 'With unique_ptr every node automatically cleans up its successor too.',
            }),
          mc('How do you recognise the end of a linked list?', ['next is nullptr', 'The value is 0', 'There is no end', 'By its size'], 0),
          order('Walk through the list and output every value.',
            ['Node* current = head.get();', 'while (current != nullptr) {', '    std::cout << current->value << std::endl;', '    current = current->next.get();', '}']),
          write('With `struct Node { int value; std::unique_ptr<Node> next; };` build a list 1 -> 2 -> 3 and output the values in a while loop, each on its own line.',
            cppFile('struct Node {\n    int value;\n    std::unique_ptr<Node> next;\n};', '', ['iostream', 'memory']),
            { expect: '1\n2\n3', must: [[/while\s*\(/, 'Walk through the nodes with a `while` loop.'], [/->\s*next/, 'Go to the next node with `->next`.']], solution: cppFile('struct Node {\n    int value;\n    std::unique_ptr<Node> next;\n};', 'auto head = std::make_unique<Node>(Node{1, nullptr});\nhead->next = std::make_unique<Node>(Node{2, nullptr});\nhead->next->next = std::make_unique<Node>(Node{3, nullptr});\n\nNode* current = head.get();\nwhile (current != nullptr) {\n    std::cout << current->value << std::endl;\n    current = current->next.get();\n}', ['iostream', 'memory']) }),
        ],
      },
      {
        id: 'cpp15-3',
        title: 'Your own stack as a template',
        goal: 'Write a reusable class for any type.',
        steps: [
          concept('Class templates',
            'Not only functions, classes can be templates too. `template <typename T> class Stack` then works with `int`, `std::string` or your own types. That is exactly how `std::vector<T>` is built.',
            { code: 'template <typename T>\nclass Stack {\npublic:\n    void push(const T& x) { data.push_back(x); }\n    void pop() { data.pop_back(); }\n    const T& top() const { return data.back(); }\n    bool empty() const { return data.empty(); }\nprivate:\n    std::vector<T> data;\n};' }),
          mc('Why `const T&` for `push`?', ['Big objects are neither copied nor changed', 'So it is shorter', 'Templates require it', 'So T is always int'], 0),
          write('Write the template `Stack<T>` with `push`, `pop`, `top` and `empty`. Create a `Stack<std::string>`, push "Level 1", "Level 2", "Boss" and take everything off again, outputting each top element before removing it.',
            cppFile('', '', ['iostream', 'string', 'vector']),
            { expect: 'Boss\nLevel 2\nLevel 1', must: [[/template\s*<\s*typename\s+T\s*>\s*class\s+Stack/, 'Start with `template <typename T> class Stack`.'], [/Stack\s*<\s*std::string\s*>/, 'Use `Stack<std::string>`.']], solution: cppFile('template <typename T>\nclass Stack {\npublic:\n    void push(const T& x) { data.push_back(x); }\n    void pop() { data.pop_back(); }\n    const T& top() const { return data.back(); }\n    bool empty() const { return data.empty(); }\nprivate:\n    std::vector<T> data;\n};', 'Stack<std::string> s;\ns.push("Level 1");\ns.push("Level 2");\ns.push("Boss");\nwhile (!s.empty()) {\n    std::cout << s.top() << std::endl;\n    s.pop();\n}', ['iostream', 'string', 'vector']) }),
        ],
      },
    ],
  },

  /* ------------------------------------------------------------ 16 */
  {
    id: 'cpp16',
    title: 'STL containers',
    summary: 'map, unordered_map, set and iterators: the right container for every job.',
    lessons: [
      {
        id: 'cpp16-1',
        title: 'std::map',
        goal: 'Store values under keys, sorted.',
        steps: [
          concept('The dictionary of C++',
            '`std::map<Key, Value>` from `<map>` stores pairs and keeps them **sorted by key**. Access and insertion are O(log n).\n\n- `m["Potion"] = 3;`: set (creates it if new)\n- `m.count("Potion")` or `m.contains("Potion")` (C++20): does the key exist?\n- `for (const auto& [name, count] : m)`: loop over all pairs',
            { code: 'std::map<std::string, int> inventory;\ninventory["Potion"] = 3;\ninventory["Arrow"] += 20;\nfor (const auto& [name, count] : inventory) {\n    std::cout << name << ": " << count << std::endl;\n}', console: 'Arrow: 20\nPotion: 3', compare: { python: 'inventory = {}\ninventory["Potion"] = 3\ninventory["Arrow"] = inventory.get("Arrow", 0) + 20\nfor name, count in sorted(inventory.items()):\n    print(f"{name}: {count}")' } }),
          mc('In which order does a `std::map<std::string, int>` loop?', ['Alphabetically by key', 'In insertion order', 'Randomly', 'By value'], 0),
          predict('What does this code output?', 'std::map<std::string, int> hp;\nhp["Orc"] = 50;\nhp["Orc"] -= 20;\nstd::cout << hp["Orc"] << " " << hp.size() << std::endl;', '30 1'),
          write('Read words until the input ends (`while (std::cin >> word)`), count them in a `std::map` and output each word with its count as `word count`.',
            cppFile('', '', ['iostream', 'map', 'string']),
            { tests: [{ stdin: 'orc ghost orc dragon orc', expect: 'dragon 1\nghost 1\norc 3' }, { stdin: 'a b a', expect: 'a 2\nb 1' }], must: [[/std::map\s*</, 'Use `std::map`.'], [/while\s*\(\s*std::cin\s*>>/, 'Read with `while (std::cin >> word)`.']], solution: cppFile('', 'std::map<std::string, int> counter;\nstd::string word;\nwhile (std::cin >> word) {\n    counter[word]++;\n}\nfor (const auto& [w, n] : counter) {\n    std::cout << w << " " << n << std::endl;\n}', ['iostream', 'map', 'string']) }),
        ],
      },
      {
        id: 'cpp16-2',
        title: 'unordered_map and set',
        goal: 'Use hash containers for fast lookups.',
        steps: [
          concept('Hashing',
            '`std::unordered_map` stores unsorted using a **hash function**. In return, lookups and insertions are **O(1)** on average, faster than `map`. Ideal e.g. for "which entity has this ID?".\n\n`std::set` and `std::unordered_set` store every value **only once**. Perfect for "has this tile been visited yet?".',
            { code: 'std::unordered_map<int, std::string> entities = {{7, "Player"}, {12, "Orc"}};\nstd::cout << entities[12] << std::endl;\n\nstd::set<int> visited = {3, 1, 3, 2};\nstd::cout << visited.size() << std::endl;', console: 'Orc\n3' }),
          mc('When `unordered_map` instead of `map`?', ['When order doesn\'t matter and speed does', 'When you want sorted output', 'Only for numbers', 'Never'], 0),
          predict('What does this code output?', 'std::set<std::string> s = {"b", "a", "b", "c"};\nfor (const auto& x : s) std::cout << x;\nstd::cout << std::endl;', 'abc'),
          write('Read numbers until the input ends. Output how many **different** numbers there were. Use a `std::set` or `std::unordered_set`.',
            cppFile('', '', ['iostream', 'set']),
            { tests: [{ stdin: '4 7 4 4 9 7', expect: '3' }, { stdin: '1 1 1', expect: '1' }, { stdin: '5 6 7 8', expect: '4' }], must: [[/set\s*</, 'Use a set.']], solution: cppFile('', 'std::set<int> numbers;\nint x;\nwhile (std::cin >> x) {\n    numbers.insert(x);\n}\nstd::cout << numbers.size() << std::endl;', ['iostream', 'set']) }),
        ],
      },
      {
        id: 'cpp16-3',
        title: 'Iterators and erase',
        goal: 'Remove elements from containers safely.',
        steps: [
          concept('Iterators',
            'An **iterator** points to an element in a container, like a pointer. `v.begin()` points to the first, `v.end()` **past** the last.\n\nRemoving dead enemies from a vector has been elegant since C++20 with `std::erase_if(v, condition)`. Before that people used the **erase-remove idiom**. Important: if you remove elements in a normal for loop, iterators become invalid. That is a typical cause of crashes in games.',
            { code: 'std::vector<int> hp = {30, 0, 12, 0, 7};\nstd::erase_if(hp, [](int x) { return x <= 0; });\n// hp is now {30, 12, 7}\n\n// before C++20:\n// hp.erase(std::remove_if(hp.begin(), hp.end(), pred), hp.end());' }),
          mc('What does `v.end()` point to?', ['Past the last element', 'The last element', 'nullptr', 'The first element'], 0),
          mc('Why is `for (auto it = v.begin(); it != v.end(); ++it) v.erase(it);` dangerous?', ['erase invalidates the iterator, so ++it is undefined afterwards', 'erase doesn\'t exist', 'It is just slow', 'It is completely fine'], 0),
          write('You have enemy HP values. Remove all with HP less than or equal to 0 (with `std::erase_if` or erase-remove) and then output the count and all remaining HP, one number per line.',
            cppFile('', 'std::vector<int> hp = {30, 0, 12, -5, 7, 0};\n', ['iostream', 'vector', 'algorithm']),
            { expect: '3\n30\n12\n7', must: [[/erase_if|remove_if/, 'Use `std::erase_if` or `std::remove_if`.']], solution: cppFile('', 'std::vector<int> hp = {30, 0, 12, -5, 7, 0};\nstd::erase_if(hp, [](int x) { return x <= 0; });\nstd::cout << hp.size() << std::endl;\nfor (int x : hp) {\n    std::cout << x << std::endl;\n}', ['iostream', 'vector', 'algorithm']) }),
        ],
      },
    ],
  },

  /* ------------------------------------------------------------ 17 */
  {
    id: 'cpp17',
    title: 'RAII and move',
    summary: 'Destructors, the rule of five and move semantics: how C++ pros manage resources.',
    lessons: [
      {
        id: 'cpp17-1',
        title: 'Constructor, destructor, RAII',
        goal: 'Let resources be freed automatically.',
        steps: [
          concept('Cleaning up at the end of the block',
            'The **destructor** `~Class()` runs automatically when an object leaves its scope. **RAII** builds on that ("Resource Acquisition Is Initialization"): a resource like a file, memory or network connection is acquired in the constructor and released in the destructor. Forgetting is no longer possible.\n\n`std::unique_ptr`, `std::vector` and `std::ifstream` all work with RAII.',
            { code: 'class File {\npublic:\n    File() { std::cout << "opened" << std::endl; }\n    ~File() { std::cout << "closed" << std::endl; }\n};\n\nint main() {\n    {\n        File f;\n        std::cout << "working" << std::endl;\n    }   // ~File() runs here\n    std::cout << "done" << std::endl;\n}', console: 'opened\nworking\nclosed\ndone' }),
          predict('What does this code output?', cppFile('struct T {\n    char c;\n    T(char x) : c(x) { std::cout << "+" << c; }\n    ~T() { std::cout << "-" << c; }\n};', 'T a(\'A\');\nT b(\'B\');'), '+A+B-B-A', 'Objects are destroyed in reverse order: built last, torn down first.'),
          mc('What does RAII roughly mean?', ['Acquire the resource in the constructor, release it in the destructor', 'Write everything in main', 'Never use pointers', 'Only global variables'], 0),
          write('Write `class Logger`: the constructor outputs `Start`, the destructor `End`. In `main`, create a logger in its own block `{ }`, output `Middle` inside it and `After` after the block.',
            cppFile('', ''),
            { expect: 'Start\nMiddle\nEnd\nAfter', must: [[/~\s*Logger\s*\(\s*\)/, 'Create the destructor `~Logger()`.']], solution: cppFile('class Logger {\npublic:\n    Logger() { std::cout << "Start" << std::endl; }\n    ~Logger() { std::cout << "End" << std::endl; }\n};', '{\n    Logger log;\n    std::cout << "Middle" << std::endl;\n}\nstd::cout << "After" << std::endl;') }),
        ],
      },
      {
        id: 'cpp17-2',
        title: 'Copying and the rule of five',
        goal: 'Control whether and how objects are copied.',
        steps: [
          concept('Who owns what?',
            'If a class manages a resource itself, it has to handle five things: destructor, copy constructor, copy assignment, move constructor, move assignment. That is the **rule of five**.\n\nThe modern shortcut is the **rule of zero**: use members that already handle this (`std::vector`, `std::string`, `std::unique_ptr`), then you need none of the five.\n\nIf something must never be copied, e.g. a texture on the graphics card, you forbid it with `= delete`.',
            { code: 'class Texture {\npublic:\n    explicit Texture(int id) : id(id) {}\n    Texture(const Texture&) = delete;            // no copying\n    Texture& operator=(const Texture&) = delete;\n    Texture(Texture&&) = default;                 // moving allowed\n    int id;\n};' }),
          mc('What does `Texture(const Texture&) = delete;` do?', ['Copying causes a compiler error', 'The object is deleted', 'Copying is faster', 'Nothing'], 0),
          mc('What does the rule of zero say?', ['Use members that manage their own resources, then you don\'t have to write any of it yourself', 'Classes may have no members', 'Never more than zero pointers', 'Constructors are forbidden'], 0),
          predict('What does this code output?', 'std::vector<int> a = {1, 2, 3};\nstd::vector<int> b = a;   // copy\nb.push_back(4);\nstd::cout << a.size() << " " << b.size() << std::endl;', '3 4'),
        ],
      },
      {
        id: 'cpp17-3',
        title: 'Move semantics',
        goal: 'Move ownership instead of copying expensively.',
        steps: [
          concept('Moving instead of copying',
            '`std::move(x)` says: "x is no longer needed, take its content along." A vector with a million elements is then not copied, only its internal pointer is handed over. Afterwards the original is empty, but valid.\n\nWith `std::unique_ptr`, moving is even the only way to pass on ownership.',
            { code: 'std::vector<int> big(1000000, 7);\nstd::vector<int> target = std::move(big);   // no copying\nstd::cout << big.size() << " " << target.size() << std::endl;', console: '0 1000000' }),
          mc('What happens with `auto b = a;` if a is a `std::unique_ptr`?', ['Compiler error, unique_ptr can\'t be copied', 'b and a both point to the object', 'a is deleted', 'A copy of the object is made'], 0),
          fill('Hand ownership over to the list.', 'auto boss = std::make_unique<Enemy>();\nhorde.push_back(⟦0⟧(boss));', ['std::move'], ['std::move', 'std::copy', '&', 'new']),
          write('Create `auto a = std::make_unique<int>(42);`. Move it to `b` with `std::move`. Then output whether a is empty (`empty`, otherwise `full`), and on the next line the value of `*b`.',
            cppFile('', '', ['iostream', 'memory']),
            { expect: 'empty\n42', must: [[/std::move\s*\(\s*a\s*\)/, 'Move with `std::move(a)`.']], solution: cppFile('', 'auto a = std::make_unique<int>(42);\nauto b = std::move(a);\nstd::cout << (a ? "full" : "empty") << std::endl;\nstd::cout << *b << std::endl;', ['iostream', 'memory']) }),
        ],
      },
    ],
  },

  /* ------------------------------------------------------------ 18 */
  {
    id: 'cpp18',
    title: 'Game architecture',
    summary: 'State machines, components and events: how big games organise their code.',
    lessons: [
      {
        id: 'cpp18-1',
        title: 'State machine',
        goal: 'Control game states cleanly with enum class.',
        steps: [
          concept('One state at a time',
            'A game is always in exactly one **state**: menu, playing, pause, game over. A **state machine** defines which input leads to which change.\n\n`enum class` gives the states names and prevents mix-ups with normal numbers. Enemy AI often works the same way: patrol, chase, attack, flee.',
            { code: 'enum class State { Menu, Playing, Pause };\n\nState next(State s, char key) {\n    switch (s) {\n        case State::Menu: return key == \'s\' ? State::Playing : s;\n        case State::Playing: return key == \'p\' ? State::Pause : s;\n        case State::Pause: return key == \'p\' ? State::Playing : s;\n    }\n    return s;\n}' }),
          mc('Why `enum class` instead of plain int values like 0, 1, 2?', ['Names are readable, and the compiler prevents mix-ups with numbers', 'It is faster', 'int can\'t be used in switch', 'It is the same'], 0),
          write('Build a state machine for an enemy AI with `enum class AI { Patrol, Chase, Attack };`. Read events until the input ends: `sees` (Patrol -> Chase), `close` (Chase -> Attack), `gone` (any state -> Patrol). Other events change nothing. Output the state after every event.',
            cppFile('', '', ['iostream', 'string']),
            { tests: [{ stdin: 'sees close gone', expect: 'Chase\nAttack\nPatrol' }, { stdin: 'close sees sees close', expect: 'Patrol\nChase\nChase\nAttack' }], must: [[/enum\s+class\s+AI/, 'Use `enum class AI`.']], solution: cppFile('enum class AI { Patrol, Chase, Attack };\n\nstd::string name(AI s) {\n    switch (s) {\n        case AI::Patrol: return "Patrol";\n        case AI::Chase: return "Chase";\n        case AI::Attack: return "Attack";\n    }\n    return "";\n}', 'AI s = AI::Patrol;\nstd::string e;\nwhile (std::cin >> e) {\n    if (e == "gone") s = AI::Patrol;\n    else if (e == "sees" && s == AI::Patrol) s = AI::Chase;\n    else if (e == "close" && s == AI::Chase) s = AI::Attack;\n    std::cout << name(s) << std::endl;\n}', ['iostream', 'string']) }),
        ],
      },
      {
        id: 'cpp18-2',
        title: 'Components instead of inheritance towers',
        goal: 'Assemble objects from building blocks.',
        steps: [
          concept('Composing instead of inheriting',
            'With deep inheritance you quickly end up with classes like `FlyingSwimmingFireEnemy`. Modern engines instead assemble objects from **components**: position, movement, health, graphics. An object only has the components it needs.\n\nUnreal calls this `UActorComponent`, Unity `Component`. The extreme form is **ECS** (entity component system): entities are just IDs, systems process all components of one type in one go. That is very fast, because the data sits right next to each other in memory.',
            { code: 'struct Position { float x = 0, y = 0; };\nstruct Movement { float vx = 0, vy = 0; };\n\nstruct Entity {\n    std::string name;\n    Position pos;\n    std::optional<Movement> move;   // not everything moves\n};' }),
          mc('What does `std::optional<Movement>` hold?', ['Either a movement or nothing', 'Always a movement', 'A pointer', 'A list of movements'], 0),
          mc('A tree, an arrow and a player. Who needs the movement component?', ['Arrow and player', 'Only the tree', 'All three', 'None'], 0),
          write('Use `Position`, `Movement` and `Entity` like in the example (with `std::optional`). Create `Tree` at (0, 0) without movement and `Arrow` at (0, 0) with vx = 10, vy = 5. An update system moves everything with movement by vx * dt and vy * dt, with dt = 0.5, three times. Then output `Name x y` for each entity.',
            cppFile('struct Position { float x = 0, y = 0; };\nstruct Movement { float vx = 0, vy = 0; };\n\nstruct Entity {\n    std::string name;\n    Position pos;\n    std::optional<Movement> move;\n};', '', ['iostream', 'optional', 'string', 'vector']),
            { expect: 'Tree 0 0\nArrow 15 7.5', must: [[/std::optional/, 'Use `std::optional<Movement>`.'], [/if\s*\(\s*\w+\.move/, 'Check with `if (e.move)` whether the component exists.']], solution: cppFile('struct Position { float x = 0, y = 0; };\nstruct Movement { float vx = 0, vy = 0; };\n\nstruct Entity {\n    std::string name;\n    Position pos;\n    std::optional<Movement> move;\n};\n\nvoid moveAll(std::vector<Entity>& world, float dt) {\n    for (auto& e : world) {\n        if (e.move) {\n            e.pos.x += e.move->vx * dt;\n            e.pos.y += e.move->vy * dt;\n        }\n    }\n}', 'std::vector<Entity> world;\nworld.push_back({"Tree", {0, 0}, std::nullopt});\nworld.push_back({"Arrow", {0, 0}, Movement{10, 5}});\nfor (int i = 0; i < 3; i++) moveAll(world, 0.5f);\nfor (const auto& e : world) {\n    std::cout << e.name << " " << e.pos.x << " " << e.pos.y << std::endl;\n}', ['iostream', 'optional', 'string', 'vector']) }),
        ],
      },
      {
        id: 'cpp18-3',
        title: 'Events',
        goal: 'Connect parts of the game loosely through events.',
        steps: [
          concept('Observer',
            'When an enemy dies, the score, sound and achievements should react. Instead of the enemy knowing all of them, it sends an **event**. Interested parties register beforehand as **observers**.\n\n`std::function<void(int)>` stores any functions or lambdas for that. Unreal calls these **delegates**, which you connect with `BindUFunction` or in Blueprints.',
            { code: 'class Event {\npublic:\n    void subscribe(std::function<void(int)> f) { observers.push_back(f); }\n    void send(int value) { for (auto& f : observers) f(value); }\nprivate:\n    std::vector<std::function<void(int)>> observers;\n};' }),
          mc('What is the advantage of events?', ['Sender and receiver don\'t have to know each other', 'The code compiles faster', 'It needs no memory', 'There are no more bugs'], 0),
          write('Build the class `Event` like in the example. Subscribe two lambdas: one adds the value to a variable `points`, the other outputs `Enemy defeated: VALUE`. Send 100 and 250 and at the end output `Points: 350`.',
            cppFile('', '', ['iostream', 'functional', 'vector']),
            { expect: 'Enemy defeated: 100\nEnemy defeated: 250\nPoints: 350', must: [[/std::function\s*</, 'Store observers as `std::function`.'], [/\[\s*&\s*\]/, 'The lambda for the points needs `[&]` to change `points`.']], solution: cppFile('class Event {\npublic:\n    void subscribe(std::function<void(int)> f) { observers.push_back(f); }\n    void send(int value) { for (auto& f : observers) f(value); }\nprivate:\n    std::vector<std::function<void(int)>> observers;\n};', 'int points = 0;\nEvent defeated;\ndefeated.subscribe([&](int v) { points += v; });\ndefeated.subscribe([](int v) { std::cout << "Enemy defeated: " << v << std::endl; });\ndefeated.send(100);\ndefeated.send(250);\nstd::cout << "Points: " << points << std::endl;', ['iostream', 'functional', 'vector']) }),
        ],
      },
    ],
  },

  /* ------------------------------------------------------------ 19 */
  {
    id: 'cpp19',
    title: 'AI for games',
    summary: 'Pathfinding on grids, heuristics like in A* and enemy waves: game AI to build yourself.',
    lessons: [
      {
        id: 'cpp19-1',
        title: 'Pathfinding on a grid',
        goal: 'Find the shortest way through a level with breadth-first search.',
        steps: [
          concept('The level as a grid',
            'Many games think in tiles: `#` is a wall, `.` is free. **Breadth-first search** starts at the start, visits all neighbours (up, down, left, right), then their neighbours, and so on. The number of rounds until the goal is the shortest path.\n\nIt is stored with a `std::queue` of positions and a grid for the distances.',
            { code: 'const int dx[] = {1, -1, 0, 0};\nconst int dy[] = {0, 0, 1, -1};\n// for every neighbour: nx = x + dx[i], ny = y + dy[i]\n// inside the grid? no wall? not visited yet?\n// then: dist[ny][nx] = dist[y][x] + 1; queue.push({nx, ny});' }),
          mc('Why does breadth-first search find the shortest path on a grid?', ['It visits tiles in order of their distance from the start', 'It tries randomly', 'It always goes straight', 'It doesn\'t'], 0),
          write('First read height and width, then the rows of a level with `S` (start), `Z` (goal), `#` (wall) and `.` (free). Output the shortest number of steps from S to Z, or `-1` if there is no path.',
            cppFile('', '', ['iostream', 'queue', 'string', 'vector']),
            { tests: [
              { stdin: '3 5\nS..#.\n.#...\n...#Z', expect: '6' },
              { stdin: '2 3\nS#Z\n.#.', expect: '-1' },
              { stdin: '1 4\nS..Z', expect: '3' },
            ], must: [[/std::queue/, 'Use `std::queue` for the breadth-first search.']], solution: cppFile('', 'int h, w;\nstd::cin >> h >> w;\nstd::vector<std::string> grid(h);\nfor (auto& row : grid) std::cin >> row;\n\nstd::vector<std::vector<int>> dist(h, std::vector<int>(w, -1));\nstd::queue<std::pair<int, int>> q;\nint gx = -1, gy = -1;\nfor (int y = 0; y < h; y++) {\n    for (int x = 0; x < w; x++) {\n        if (grid[y][x] == \'S\') { dist[y][x] = 0; q.push({x, y}); }\n        if (grid[y][x] == \'Z\') { gx = x; gy = y; }\n    }\n}\nconst int dx[] = {1, -1, 0, 0};\nconst int dy[] = {0, 0, 1, -1};\nwhile (!q.empty()) {\n    auto [x, y] = q.front();\n    q.pop();\n    for (int i = 0; i < 4; i++) {\n        int nx = x + dx[i], ny = y + dy[i];\n        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;\n        if (grid[ny][nx] == \'#\' || dist[ny][nx] != -1) continue;\n        dist[ny][nx] = dist[y][x] + 1;\n        q.push({nx, ny});\n    }\n}\nstd::cout << dist[gy][gx] << std::endl;', ['iostream', 'queue', 'string', 'vector']) }),
        ],
      },
      {
        id: 'cpp19-2',
        title: 'Heuristics and A*',
        goal: 'Understand how A* finds the goal faster.',
        steps: [
          concept('Guessing helps',
            'Breadth-first search looks in all directions equally. **A*** (say "A star") is smarter: it prefers tiles that, according to a **heuristic**, are closer to the goal. On grids you usually use the **Manhattan distance**: `|x1 - x2| + |y1 - y2|`.\n\nA* rates every tile with `f = g + h`: g is the path so far, h the estimate to the goal. It is stored in a `std::priority_queue`, which always returns the tile with the smallest f. Unreal uses a variant of this for its NavMesh pathfinding.',
            { code: 'int manhattan(int x1, int y1, int x2, int y2) {\n    return std::abs(x1 - x2) + std::abs(y1 - y2);\n}' }),
          mc('What does h stand for in `f = g + h`?', ['The estimated distance to the goal', 'The height of the tile', 'The number of enemies', 'The steps taken so far'], 0),
          predict('What does `manhattan(1, 2, 4, 6)` return?', 'std::cout << manhattan(1, 2, 4, 6) << std::endl;', '7', '|1 - 4| + |2 - 6| = 3 + 4 = 7.'),
          write('An enemy stands at (2, 3). Read the number n and then n player positions x y. Output the index (from 0) of the player with the smallest Manhattan distance, the smaller index on a tie. Use a function `manhattan`.',
            cppFile('', '', ['iostream', 'cstdlib']),
            { tests: [{ stdin: '3\n10 10\n3 3\n0 0', expect: '1' }, { stdin: '2\n2 5\n4 3', expect: '0' }, { stdin: '4\n9 9\n8 8\n2 4\n1 3', expect: '2' }], must: [[/int\s+manhattan\s*\(/, 'Write a function `int manhattan(...)`.'], [/abs\s*\(/, 'Use `std::abs`.']], solution: cppFile('int manhattan(int x1, int y1, int x2, int y2) {\n    return std::abs(x1 - x2) + std::abs(y1 - y2);\n}', 'int n;\nstd::cin >> n;\nint best = -1;\nint bestDist = 0;\nfor (int i = 0; i < n; i++) {\n    int x, y;\n    std::cin >> x >> y;\n    int d = manhattan(2, 3, x, y);\n    if (best == -1 || d < bestDist) {\n        best = i;\n        bestDist = d;\n    }\n}\nstd::cout << best << std::endl;', ['iostream', 'cstdlib']) }),
        ],
      },
      {
        id: 'cpp19-3',
        title: 'Waves and balancing',
        goal: 'Control difficulty with formulas.',
        steps: [
          concept('Game design with numbers',
            'Enemy waves are rarely set by hand, but with formulas. That way the game stays fair but gets steadily harder:\n\n- Count: `base + wave * growth`\n- Health: grows by a percentage, e.g. 10 % per wave\n- A boss every 5 waves\n\nFor randomness modern C++ uses `<random>` with `std::mt19937`. With a fixed start value (seed) you get the same numbers on every start. That is worth gold when testing.',
            { code: 'for (int wave = 1; wave <= 5; wave++) {\n    int count = 3 + wave * 2;\n    double hp = 50 * std::pow(1.1, wave - 1);\n    bool boss = wave % 5 == 0;\n}' }),
          mc('Why do games use a fixed seed when testing?', ['So randomness is reproducible and bugs can be recreated', 'So it runs faster', 'Because randomness is otherwise forbidden', 'For better graphics'], 0),
          write('Read the number of waves n. For each wave output `Wave W: A enemies` with A = 3 + W * 2. If W is divisible by 5, append ` + Boss`.',
            cppFile('', ''),
            { tests: [{ stdin: '3', expect: 'Wave 1: 5 enemies\nWave 2: 7 enemies\nWave 3: 9 enemies' }, { stdin: '5', expect: 'Wave 1: 5 enemies\nWave 2: 7 enemies\nWave 3: 9 enemies\nWave 4: 11 enemies\nWave 5: 13 enemies + Boss' }], must: [[/for\s*\(|while\s*\(/, 'Use a loop over the waves.'], [/%\s*5/, 'Check for boss waves with `% 5`.']], solution: cppFile('', 'int n;\nstd::cin >> n;\nfor (int w = 1; w <= n; w++) {\n    std::cout << "Wave " << w << ": " << 3 + w * 2 << " enemies";\n    if (w % 5 == 0) std::cout << " + Boss";\n    std::cout << std::endl;\n}'), explain: 'With that the C++ course is complete. Now come the big projects.' }),
        ],
      },
    ],
  },
];
