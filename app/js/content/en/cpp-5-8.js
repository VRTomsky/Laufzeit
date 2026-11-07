// C++ units 5 to 8 (English): functions, containers, references and pointers, memory management

import { concept, mc, predict, fill, order, fix, write, cppMain, cppFile } from '../helpers.js';

export const cppUnits5to8 = [
  /* ------------------------------------------------------------ 5 */
  {
    id: 'cpp5',
    title: 'Functions',
    summary: 'Bundle code in functions: return types, parameters, declarations and overloading.',
    lessons: [
      {
        id: 'cpp5-1',
        title: 'Functions with a return value',
        goal: 'Write your own functions with a fixed return type.',
        steps: [
          concept('Type before the name',
            'In C++ every function has its **return type** in front. Every parameter has a type too. If a function returns nothing, its type is `void`.\n\nFunctions go outside of `main`, usually above it.',
            {
              code: cppFile('int doubled(int x) {\n    return x * 2;\n}', 'std::cout << doubled(21) << std::endl;'),
              compare: { python: 'def doubled(x):\n    return x * 2\n\nprint(doubled(21))' },
              console: '42',
            }),
          mc('Which return type fits a function that only prints something and returns nothing?', ['void', 'int', 'none', 'null'], 0, null, { codeOptions: true }),
          predict('What does this code output?', cppFile('int plus(int a, int b) {\n    return a + b;\n}', 'std::cout << plus(3, 4) * 2 << std::endl;'), '14'),
          fill('Complete the return type and return.', '⟦0⟧ half(double x) {\n    ⟦1⟧ x / 2;\n}', ['double', 'return'], ['double', 'return', 'void', 'print']),
          write('Write a function `int square(int n)` and output `square(7)`.',
            cppFile('// Your function here', ''),
            { expect: '49', must: [[/int\s+square\s*\(\s*int\s+\w+\s*\)/, 'The function is called `int square(int n)`.'], [/return/, 'Return the result with `return`.']], solution: cppFile('int square(int n) {\n    return n * n;\n}', 'std::cout << square(7) << std::endl;') }),
        ],
      },
      {
        id: 'cpp5-2',
        title: 'Declaration and definition',
        goal: 'Understand why the compiler has to know a function beforehand.',
        steps: [
          concept('Announce first, then use',
            'The compiler reads from top to bottom. If you call a function that only comes **further down**, it doesn\'t know it yet.\n\nSolution: a **declaration** (just the head with a semicolon) at the top, the **definition** (with the body) somewhere later. That is exactly how header files (`.h`) work: they contain the declarations.',
            { code: '#include <iostream>\n\nint damage(int a, int d);   // declaration\n\nint main() {\n    std::cout << damage(30, 12) << std::endl;\n    return 0;\n}\n\nint damage(int a, int d) {   // definition\n    return a - d;\n}' }),
          mc('What does a header file `.h` typically contain?', ['Declarations of functions and classes', 'Only the main function', 'The finished .exe', 'Comments for the teacher'], 0),
          fix('The compiler reports `identifier not found`. Fix it without moving the function up.',
            '#include <iostream>\n\nint main() {\n    std::cout << "Damage: " << damage(30, 12) << std::endl;\n    return 0;\n}\n\nint damage(int a, int d) {\n    return a - d;\n}',
            { expect: 'Damage: 18', must: [[/int\s+damage\s*\([^)]*\)\s*;/, 'Put a declaration `int damage(int a, int d);` before main.']], solution: '#include <iostream>\n\nint damage(int a, int d);\n\nint main() {\n    std::cout << "Damage: " << damage(30, 12) << std::endl;\n    return 0;\n}\n\nint damage(int a, int d) {\n    return a - d;\n}' }),
          concept('bool as return value',
            'A function can also return `bool`. `std::cout` shows `true` as `1` and `false` as `0`.',
            { code: 'bool isCritical(int hp) {\n    return hp < 20;\n}', console: '1' }),
          write('Write `bool isCritical(int hp)` that returns `true` if hp is less than 20. Output the result for 15 and for 80, each on its own line.',
            cppFile('', ''),
            { expect: '1\n0', must: [[/bool\s+isCritical\s*\(\s*int/, 'The function is called `bool isCritical(int hp)`.']], solution: cppFile('bool isCritical(int hp) {\n    return hp < 20;\n}', 'std::cout << isCritical(15) << std::endl;\nstd::cout << isCritical(80) << std::endl;') }),
        ],
      },
      {
        id: 'cpp5-3',
        title: 'Overloading and default values',
        goal: 'Several functions with the same name, and parameters with a default value.',
        steps: [
          concept('Same name, different parameters',
            '**Overloading**: several functions may have the same name if their parameters differ. The compiler picks the right one based on the arguments.\n\n**Default values** work like in Python: `int heal(int hp, int amount = 10)`.',
            { code: 'int area(int side) { return side * side; }\nint area(int w, int h) { return w * h; }\n\n// area(5)    -> 25\n// area(3, 4) -> 12' }),
          predict('What does this code output?', cppFile('int heal(int hp, int amount = 10) {\n    return hp + amount;\n}', 'std::cout << heal(50) << " " << heal(50, 25) << std::endl;'), '60 75'),
          mc('How does the compiler tell overloaded functions apart?', ['By the number and types of the parameters', 'By the return type alone', 'By their order in the code', 'By the comment above'], 0),
          write('Write two overloaded functions `area`: one for a square (`int side`) and one for a rectangle (`int w, int h`). Output `area(5)` and `area(3, 4)`.',
            cppFile('', ''),
            { expect: '25\n12', must: [[/int\s+area\s*\(\s*int\s+\w+\s*\)/, 'Create `int area(int side)`.'], [/int\s+area\s*\(\s*int\s+\w+\s*,\s*int\s+\w+\s*\)/, 'Create `int area(int w, int h)`.']], solution: cppFile('int area(int side) {\n    return side * side;\n}\n\nint area(int w, int h) {\n    return w * h;\n}', 'std::cout << area(5) << std::endl;\nstd::cout << area(3, 4) << std::endl;') }),
        ],
      },
    ],
  },

  /* ------------------------------------------------------------ 6 */
  {
    id: 'cpp6',
    title: 'Arrays, vector and string',
    summary: 'Store many values: fixed arrays, growing vectors and text.',
    lessons: [
      {
        id: 'cpp6-1',
        title: 'Arrays',
        goal: 'Create fixed rows of values and loop over them.',
        steps: [
          concept('Boxes right next to each other',
            'An **array** has a fixed size and sits in one piece in memory. Counting starts at 0.\n\n**Careful:** C++ doesn\'t check whether you read outside. `points[5]` with 3 elements gives no error, but reads some random memory. That is called **undefined behaviour**, a classic cause of crashes in games.',
            {
              code: 'int points[3] = {10, 20, 30};\nstd::cout << points[0] << std::endl;\npoints[2] = 99;',
              memory: [
                { name: 'points[0]', value: '10', addr: '0x2000', size: '4 B' },
                { name: 'points[1]', value: '20', addr: '0x2004', size: '4 B' },
                { name: 'points[2]', value: '99', addr: '0x2008', size: '4 B' },
              ],
              memoryCaption: 'The addresses go up by 4 bytes each, the size of an int.',
            }),
          predict('What does this code output?', 'int values[4] = {5, 6, 7, 8};\nstd::cout << values[1] + values[3] << std::endl;', '14'),
          mc('What happens with `int a[3];` and `a[10] = 1;`?', ['Undefined behaviour, C++ doesn\'t check the bounds', 'The array grows to 11', 'Compiler error', 'The value is ignored'], 0),
          write('Create `int coins[5] = {4, 12, 7, 9, 8};` and calculate the sum with a for loop. Output `Total: 40`.',
            cppMain('int coins[5] = {4, 12, 7, 9, 8};\n'),
            { expect: 'Total: 40', must: [[/for\s*\(/, 'Use a `for` loop.']], mustNot: [[/<<\s*"Total: 40"|<<\s*40\b/, 'Let the loop do the maths.']], solution: cppMain('int coins[5] = {4, 12, 7, 9, 8};\nint total = 0;\nfor (int i = 0; i < 5; i++) {\n    total += coins[i];\n}\nstd::cout << "Total: " << total << std::endl;') }),
        ],
      },
      {
        id: 'cpp6-2',
        title: 'std::vector',
        goal: 'Work with a growing container.',
        steps: [
          concept('The list of C++',
            '`std::vector` from `#include <vector>` is the C++ counterpart of the Python list: it grows when needed. In games it is everywhere: enemy lists, bullets, particles.\n\n- `v.push_back(x)`: add at the end\n- `v.size()`: number of elements\n- `for (int x : v)`: loop over all elements',
            {
              code: '#include <iostream>\n#include <vector>\n\nint main() {\n    std::vector<int> hp = {100, 80};\n    hp.push_back(60);\n    for (int x : hp) {\n        std::cout << x << std::endl;\n    }\n    return 0;\n}',
              compare: { python: 'hp = [100, 80]\nhp.append(60)\nfor x in hp:\n    print(x)' },
            }),
          predict('What does this code output?', 'std::vector<int> v = {3, 1};\nv.push_back(4);\nstd::cout << v.size() << std::endl;', '3'),
          fill('Add 500 at the end.', 'std::vector<int> points;\npoints.⟦0⟧(500);', ['push_back'], ['push_back', 'append', 'add', 'insert']),
          mc('What goes in the angle brackets of `std::vector<int>`?', ['The type of the elements', 'The size', 'The name', 'The start value'], 0),
          write('Create an empty `std::vector<int>`, add 10, 20 and 30. Output `Count: 3` and then each element on its own line.',
            cppMain('', ['iostream', 'vector']),
            { expect: 'Count: 3\n10\n20\n30', must: [[/push_back/, 'Use `push_back`.'], [/\.size\s*\(/, '`.size()` gives the number.']], solution: cppMain('std::vector<int> values;\nvalues.push_back(10);\nvalues.push_back(20);\nvalues.push_back(30);\nstd::cout << "Count: " << values.size() << std::endl;\nfor (int v : values) {\n    std::cout << v << std::endl;\n}', ['iostream', 'vector']) }),
        ],
      },
      {
        id: 'cpp6-3',
        title: 'std::string',
        goal: 'Join, split and read text.',
        steps: [
          concept('Text in C++',
            '`std::string` from `#include <string>` can do a lot:\n\n- `s.length()`: length\n- `s[0]`: first character (a `char`)\n- `a + b`: join\n- `s.substr(start, count)`: a piece\n- `std::getline(std::cin, s)`: read a whole line including spaces',
            { code: 'std::string name = "Laufzeit";\nstd::cout << name.length() << std::endl;\nstd::cout << name.substr(0, 4) << std::endl;\nstd::cout << name + "!" << std::endl;', console: '8\nLauf\nLaufzeit!' }),
          predict('What does this code output?', 'std::string s = "Unreal";\nstd::cout << s.substr(2, 3) << std::endl;', 'rea', 'From position 2, three characters: r, e, a.'),
          mc('How do you read a whole line including spaces?', ['std::getline(std::cin, text);', 'std::cin >> text;', 'text = input();', 'std::readline(text);'], 0, null, { codeOptions: true }),
          write('Read a word with `std::cin`. Output its length and below it the first letter.',
            cppMain('', ['iostream', 'string']),
            { stdin: 'Laufzeit', expect: '8\nL', must: [[/\.length\s*\(|\.size\s*\(/, '`.length()` gives the length.'], [/\[\s*0\s*\]/, '`[0]` gives the first letter.']], solution: cppMain('std::string word;\nstd::cin >> word;\nstd::cout << word.length() << std::endl;\nstd::cout << word[0] << std::endl;', ['iostream', 'string']), explain: 'Tested with Laufzeit.' }),
        ],
      },
    ],
  },

  /* ------------------------------------------------------------ 7 */
  {
    id: 'cpp7',
    title: 'References and pointers',
    summary: 'The heart of C++: addresses, references, pointers. Step by step with memory pictures.',
    lessons: [
      {
        id: 'cpp7-1',
        title: 'Addresses and references',
        goal: 'Understand what & means and why references save copies.',
        steps: [
          concept('Every variable has an address',
            'Remember the memory picture? With `&x` you get the **address** of x.\n\nA **reference** `int& r = x;` is a **second name** for the same variable. No new box, no copying. If you change r, you change x.',
            {
              code: 'int hp = 100;\nint& r = hp;     // r is a second name for hp\nr = 50;\nstd::cout << hp << std::endl;   // 50',
              memory: [{ name: 'hp  (also: r)', type: 'int', value: '50', addr: '0x1000', size: '4 bytes' }],
              memoryCaption: 'One box, two names.',
            }),
          predict('What does this code output?', 'int a = 3;\nint& b = a;\nb += 10;\nstd::cout << a << std::endl;', '13'),
          concept('References as parameters',
            'Normally a function gets a **copy**. Changes inside are lost. With `&` in the parameter it gets the **original**.\n\nIn games this matters twice: copying big objects takes time. That is why you see `const FVector&` all the time in Unreal.',
            { code: 'void healCopy(int hp) { hp += 20; }      // only changes the copy\nvoid heal(int& hp) { hp += 20; }          // changes the original' }),
          mc('What does `int x = 1; healCopy(x); std::cout << x;` output?', ['1', '21', '20', 'Error'], 0, 'healCopy works with a copy. x stays 1.'),
          write('Write `void heal(int& hp)` that adds 20. In main: `int hp = 50;`, `heal(hp);`, then output hp.',
            cppFile('', ''),
            { expect: '70', must: [[/void\s+heal\s*\(\s*int\s*&/, 'The parameter needs an `&`: `void heal(int& hp)`.']], solution: cppFile('void heal(int& hp) {\n    hp += 20;\n}', 'int hp = 50;\nheal(hp);\nstd::cout << hp << std::endl;') }),
        ],
      },
      {
        id: 'cpp7-2',
        title: 'Pointers',
        goal: 'Create pointers, dereference them and understand them in memory.',
        steps: [
          concept('A note with an address',
            'A **pointer** is a variable that stores an **address**. Think of it as a note that says which box something is in.\n\n- `int* p = &gold;`: p stores the address of gold\n- `*p`: "go to the address and take what is there". This is called **dereferencing**\n- `*p = 999;`: changes gold through the pointer',
            {
              code: 'int gold = 50;\nint* p = &gold;\n*p = 999;\nstd::cout << gold << std::endl;   // 999',
              memory: [
                { name: 'gold', type: 'int', value: '999', addr: '0x1000', size: '4 bytes' },
                { arrow: '<- points to' },
                { name: 'p', type: 'int*', value: '0x1000', addr: '0x1008', size: '8 bytes', kind: 'ptr' },
              ],
              memoryCaption: 'p itself is a variable too. Its value is an address.',
            }),
          predict('What does this code output?', 'int x = 7;\nint* p = &x;\nstd::cout << *p + 1 << std::endl;', '8'),
          mc('What does `int* p = &x;` store in p?', ['The address of x', 'A copy of x', 'The value of x times 2', 'The name x'], 0),
          fill('Make p point to level and set level to 5 through p.', 'int level = 1;\nint* p = ⟦0⟧level;\n⟦1⟧p = 5;', ['&', '*'], ['&', '*', '->', '#']),
          write('Create `int gold = 50;` and a pointer `p` to gold. Set gold to 999 **through the pointer** and then output gold.',
            cppMain(),
            { expect: '999', must: [[/int\s*\*\s*\w+\s*=\s*&\s*gold/, 'Create the pointer with `int* p = &gold;`.'], [/\*\s*\w+\s*=\s*999/, 'Change the value with `*p = 999;`.']], mustNot: [[/gold\s*=\s*999/, 'Don\'t change gold directly, do it through the pointer.']], solution: cppMain('int gold = 50;\nint* p = &gold;\n*p = 999;\nstd::cout << gold << std::endl;') }),
        ],
      },
      {
        id: 'cpp7-3',
        title: 'nullptr and swapping',
        goal: 'Recognise empty pointers and use references on purpose.',
        steps: [
          concept('The empty note',
            '`nullptr` means: this pointer points to **nothing**. Dereferencing it crashes the program. That is why you check first.\n\nRule of thumb for parameters:\n\n- Reference `T&` if the object definitely exists\n- Pointer `T*` if it may also be "nothing"',
            { code: 'int* target = nullptr;\nif (target != nullptr) {\n    std::cout << *target << std::endl;\n} else {\n    std::cout << "No target" << std::endl;\n}', console: 'No target' }),
          mc('What happens with `int* p = nullptr; std::cout << *p;`?', ['Crash, you must not dereference nullptr', '0 appears', 'nullptr appears', 'Compiler error'], 0),
          fix('levelUp should really increase the level. Right now it outputs 1 instead of 2.',
            cppFile('void levelUp(int level) {\n    level++;\n}', 'int level = 1;\nlevelUp(level);\nstd::cout << level << std::endl;'),
            { expect: '2', must: [[/void\s+levelUp\s*\(\s*int\s*&/, 'Pass by reference: `int& level`.']], solution: cppFile('void levelUp(int& level) {\n    level++;\n}', 'int level = 1;\nlevelUp(level);\nstd::cout << level << std::endl;') }),
          write('Write `void swapValues(int& a, int& b)` that swaps the values. Test with `x = 3`, `y = 7` and then output `x y`.',
            cppFile('', ''),
            { expect: '7 3', must: [[/void\s+swapValues\s*\(\s*int\s*&\s*\w+\s*,\s*int\s*&/, 'Both parameters need `&`.']], mustNot: [[/std::swap/, 'Build the swap yourself, without `std::swap`.']], solution: cppFile('void swapValues(int& a, int& b) {\n    int tmp = a;\n    a = b;\n    b = tmp;\n}', 'int x = 3;\nint y = 7;\nswapValues(x, y);\nstd::cout << x << " " << y << std::endl;'), explain: 'Without the helper variable tmp one value would be lost.' }),
        ],
      },
    ],
  },

  /* ------------------------------------------------------------ 8 */
  {
    id: 'cpp8',
    title: 'Memory management',
    summary: 'Stack and heap, new and delete, memory leaks and why pros use smart pointers.',
    lessons: [
      {
        id: 'cpp8-1',
        title: 'Stack and heap',
        goal: 'Tell the two memory areas apart.',
        steps: [
          concept('Two memory areas',
            '**Stack:** normal local variables. Fast, cleaned up automatically as soon as the function ends. But limited and only valid as long as the function runs.\n\n**Heap:** memory you get with `new`. It stays until you give it back with `delete`. Good for things that live longer, e.g. enemies that appear during the game.',
            {
              code: 'void spawn() {\n    int local = 5;            // stack\n    int* enemyHp = new int(100);   // heap\n    delete enemyHp;           // give it back\n}',
              memory: [
                { name: 'local', type: 'int', value: '5', addr: 'Stack', size: 'auto' },
                { name: 'enemyHp', type: 'int*', value: '0x9F00', addr: 'Stack', size: '8 B', kind: 'ptr' },
                { arrow: '-> points to' },
                { name: '(nameless)', type: 'int', value: '100', addr: 'Heap 0x9F00', size: '4 B', kind: 'heap' },
              ],
            }),
          mc('When is a local stack variable freed?', ['Automatically at the end of its block', 'Never', 'Only with delete', 'When the PC restarts'], 0),
          mc('What does `new int(100)` return?', ['A pointer to an int on the heap', 'The value 100', 'A reference', 'A new type'], 0),
          predict('What does this code output?', 'int* p = new int(40);\n*p += 2;\nstd::cout << *p << std::endl;\ndelete p;', '42'),
        ],
      },
      {
        id: 'cpp8-2',
        title: 'new, delete and leaks',
        goal: 'Request heap memory, give it back and avoid leaks.',
        steps: [
          concept('Whoever says new must say delete',
            'Every `new` needs exactly one `delete`. For arrays: `new int[n]` and `delete[]`.\n\nIf you forget `delete`, the memory stays taken. If that happens every frame, memory use grows until the game crashes. That is a **memory leak**. Deleting twice is just as dangerous.',
            { code: 'int n = 5;\nint* field = new int[n];\nfor (int i = 0; i < n; i++) {\n    field[i] = i * i;\n}\nstd::cout << field[n - 1] << std::endl;\ndelete[] field;', console: '16' }),
          mc('How do you correctly free `int* a = new int[10];`?', ['delete[] a;', 'delete a;', 'free a;', 'a = nullptr;'], 0, null, { codeOptions: true }),
          mc('What is a memory leak?', ['Requested memory that is never freed', 'A pointer to nullptr', 'An array that is too big', 'A typo in the code'], 0),
          write('Read a number `n`. Get an int array of size n with `new`, fill field i with `i * i`, output the last field and free the memory with `delete[]`.',
            cppMain(),
            { stdin: '5', expect: '16', must: [[/new\s+int\s*\[/, 'Get the array with `new int[n]`.'], [/delete\s*\[\s*\]/, 'Free it with `delete[]`.']], solution: cppMain('int n;\nstd::cin >> n;\nint* field = new int[n];\nfor (int i = 0; i < n; i++) {\n    field[i] = i * i;\n}\nstd::cout << field[n - 1] << std::endl;\ndelete[] field;'), explain: 'Tested with 5: the last field is 4 * 4 = 16.' }),
        ],
      },
      {
        id: 'cpp8-3',
        title: 'Smart pointers',
        goal: 'Let memory be cleaned up automatically.',
        steps: [
          concept('Let it clean up',
            'Modern C++ pros almost never write `delete`. They use **smart pointers** from `#include <memory>`:\n\n- `std::unique_ptr<T>`: exactly one owner. When it is destroyed, the memory is freed automatically\n- `std::shared_ptr<T>`: several owners, counts them. The last one cleans up\n\nYou create them with `std::make_unique<T>()`. You access members with `->`.',
            { code: 'struct Enemy {\n    int hp = 100;\n};\n\nauto e = std::make_unique<Enemy>();\ne->hp -= 30;\nstd::cout << e->hp << std::endl;   // 70\n// no delete needed' }),
          mc('When does a `std::unique_ptr` free its memory?', ['Automatically when it is destroyed itself', 'Never', 'Only with delete', 'After 5 seconds'], 0),
          predict('What does this code output?', 'auto a = std::make_shared<int>(5);\nauto b = a;\nstd::cout << a.use_count() << std::endl;', '2', 'a and b share the same memory, the counter is at 2.'),
          fill('Access hp through the smart pointer.', 'auto boss = std::make_unique<Enemy>();\nboss⟦0⟧hp = 500;', ['->'], ['->', '.', '*', '::']),
          write('Create `struct Enemy { int hp = 0; };`. In main, create an enemy with `std::make_unique`, set `hp` to 50 and output it.',
            cppFile('', '', ['iostream', 'memory']),
            { expect: '50', must: [[/make_unique\s*<\s*Enemy\s*>/, 'Create the enemy with `std::make_unique<Enemy>()`.'], [/->\s*hp/, 'Access it with `->hp`.']], mustNot: [[/\bdelete\b/, 'With smart pointers you don\'t need delete.']], solution: cppFile('struct Enemy {\n    int hp = 0;\n};', 'auto e = std::make_unique<Enemy>();\ne->hp = 50;\nstd::cout << e->hp << std::endl;', ['iostream', 'memory']) }),
        ],
      },
    ],
  },
];
