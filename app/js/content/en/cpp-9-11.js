// C++ units 9 to 11 (English): classes, inheritance and polymorphism, game dev maths

import { concept, mc, predict, fill, order, fix, write, cppFile } from '../helpers.js';

export const cppUnits9to11 = [
  /* ------------------------------------------------------------ 9 */
  {
    id: 'cpp9',
    title: 'Classes and objects',
    summary: 'Your own types with struct and class, constructors, methods and encapsulation.',
    lessons: [
      {
        id: 'cpp9-1',
        title: 'struct and class',
        goal: 'Bundle related data into your own type.',
        steps: [
          concept('Your own types',
            'With `struct` you group data into your own type, e.g. a player with name and HP. You access the members with `.`.\n\n`class` is almost the same. The only difference: in a `struct` everything is `public` by default (visible from outside), in a `class` `private`. Remember: `struct` for simple data, `class` for objects with behaviour.\n\nImportant: after the closing brace comes a **semicolon**.',
            {
              code: 'struct Player {\n    std::string name;\n    int hp;\n};\n\nPlayer p;\np.name = "Alex";\np.hp = 100;',
              compare: { python: 'class Player:\n    def __init__(self):\n        self.name = ""\n        self.hp = 0\n\np = Player()\np.name = "Alex"\np.hp = 100' },
            }),
          mc('What is the difference between `struct` and `class`?', ['In a struct everything is public by default, in a class private', 'class is faster', 'A struct can\'t have functions', 'There is none'], 0),
          fix('The compiler complains about the struct. Fix it.',
            cppFile('struct Item {\n    std::string name;\n    int value;\n}', 'Item i;\ni.name = "Potion";\ni.value = 5;\nstd::cout << i.name << ": " << i.value << std::endl;', ['iostream', 'string']),
            { expect: 'Potion: 5', solution: cppFile('struct Item {\n    std::string name;\n    int value;\n};', 'Item i;\ni.name = "Potion";\ni.value = 5;\nstd::cout << i.name << ": " << i.value << std::endl;', ['iostream', 'string']), explain: 'The semicolon after the struct is the one people forget most often.' }),
          write('Create `struct Player` with `std::string name` and `int hp`. Create a player Alex with 100 HP and output `Alex: 100`.',
            cppFile('', '', ['iostream', 'string']),
            { expect: 'Alex: 100', must: [[/struct\s+Player/, 'Create `struct Player { ... };`.'], [/\.\s*hp/, 'Access the hit points with `.hp`.']], solution: cppFile('struct Player {\n    std::string name;\n    int hp;\n};', 'Player p;\np.name = "Alex";\np.hp = 100;\nstd::cout << p.name << ": " << p.hp << std::endl;', ['iostream', 'string']) }),
        ],
      },
      {
        id: 'cpp9-2',
        title: 'Constructors and methods',
        goal: 'Start objects cleanly and give them behaviour.',
        steps: [
          concept('Start values and abilities',
            'The **constructor** has the same name as the class and no return type. With the **initializer list** `: hp(start)` you set start values directly.\n\n**Methods** are functions inside the class. They access the members directly, without `self`. Methods that change nothing are marked with `const`.',
            { code: 'class Enemy {\npublic:\n    Enemy(int start) : hp(start) {}\n\n    void hit(int damage) {\n        hp -= damage;\n        if (hp < 0) hp = 0;\n    }\n\n    int getHp() const { return hp; }\n\nprivate:\n    int hp;\n};' }),
          predict('What does this code output?', cppFile('class Counter {\npublic:\n    Counter() : value(10) {}\n    void plus() { value++; }\n    int get() const { return value; }\nprivate:\n    int value;\n};', 'Counter c;\nc.plus();\nc.plus();\nstd::cout << c.get() << std::endl;'), '12'),
          mc('What return type does a constructor have?', ['None, not even void', 'void', 'int', 'The type of the class'], 0),
          write('Write `class Enemy` with a private `int hp`, a constructor `Enemy(int start)`, the method `void hit(int damage)` (hp never below 0) and `int getHp() const`. In main: enemy with 40 HP, hit for 15, output hp, hit for 50, output hp.',
            cppFile('', ''),
            { expect: '25\n0', must: [[/class\s+Enemy/, 'Create `class Enemy`.'], [/Enemy\s*\(\s*int\s+\w+\s*\)/, 'The constructor is called `Enemy(int start)`.'], [/void\s+hit\s*\(/, 'Create `void hit(int damage)`.'], [/private\s*:/, 'hp belongs in the `private:` section.']], solution: cppFile('class Enemy {\npublic:\n    Enemy(int start) : hp(start) {}\n\n    void hit(int damage) {\n        hp -= damage;\n        if (hp < 0) hp = 0;\n    }\n\n    int getHp() const { return hp; }\n\nprivate:\n    int hp;\n};', 'Enemy e(40);\ne.hit(15);\nstd::cout << e.getHp() << std::endl;\ne.hit(50);\nstd::cout << e.getHp() << std::endl;') }),
        ],
      },
      {
        id: 'cpp9-3',
        title: 'Encapsulation',
        goal: 'Understand why data is private.',
        steps: [
          concept('Protection against nonsense',
            '**Encapsulation** means: the data is `private`, from outside you only get to it through methods. That way nobody can accidentally set `hp = -5000`. The method checks and stays the only door.\n\nThe compiler forbids access to private members from outside.',
            { code: 'class Account {\npublic:\n    void deposit(int amount) {\n        if (amount > 0) balance += amount;\n    }\n    int getBalance() const { return balance; }\nprivate:\n    int balance = 0;\n};' }),
          mc('What happens with `account.balance = 100;` if `balance` is private?', ['Compiler error', 'balance becomes 100', 'balance stays unchanged, without a message', 'Crash at startup'], 0),
          fix('main accesses a private member directly. Use the class method instead.',
            cppFile('class Hero {\npublic:\n    int getLevel() const { return level; }\nprivate:\n    int level = 3;\n};', 'Hero h;\nstd::cout << "Level " << h.level << std::endl;'),
            { expect: 'Level 3', must: [[/getLevel\s*\(\s*\)/, 'Use `h.getLevel()`.']], solution: cppFile('class Hero {\npublic:\n    int getLevel() const { return level; }\nprivate:\n    int level = 3;\n};', 'Hero h;\nstd::cout << "Level " << h.getLevel() << std::endl;') }),
          mc('What does `const` after `int getLevel() const` mean?', ['The method doesn\'t change the object', 'The result is always the same', 'The method is private', 'It may only run once'], 0),
        ],
      },
    ],
  },

  /* ------------------------------------------------------------ 10 */
  {
    id: 'cpp10',
    title: 'Inheritance and polymorphism',
    summary: 'Base classes, virtual and override: the principle behind Actor, Pawn and Character in Unreal.',
    lessons: [
      {
        id: 'cpp10-1',
        title: 'Inheritance',
        goal: 'Derive one class from another.',
        steps: [
          concept('Inheriting',
            '`class Boss : public Enemy` means: Boss inherits everything public from Enemy. `protected` members are visible to derived classes, but not from outside.\n\nIn Unreal your enemy inherits, for example, from `ACharacter`, which inherits from `APawn`, which inherits from `AActor`.',
            { code: 'class Character {\npublic:\n    void introduce() const {\n        std::cout << "I am " << name << std::endl;\n    }\nprotected:\n    std::string name = "Character";\n};\n\nclass Knight : public Character {\npublic:\n    Knight() { name = "Knight"; }\n};' }),
          predict('What does this code output?', cppFile('class A {\npublic:\n    int value() const { return 1; }\n};\n\nclass B : public A {};', 'B b;\nstd::cout << b.value() << std::endl;'), '1'),
          mc('Who may access `protected` members?', ['The class itself and derived classes', 'Everyone', 'Only main', 'Nobody'], 0),
          write('Create `class Character` with `protected: std::string name;` and the method `void introduce() const` that outputs `I am NAME`. Derive `class Knight : public Character` whose constructor sets `name = "Knight"`. Create a knight and call `introduce()`.',
            cppFile('', '', ['iostream', 'string']),
            { expect: 'I am Knight', must: [[/class\s+Knight\s*:\s*public\s+Character/, 'Derive with `class Knight : public Character`.'], [/protected\s*:/, 'name belongs in `protected:`.']], solution: cppFile('class Character {\npublic:\n    void introduce() const {\n        std::cout << "I am " << name << std::endl;\n    }\nprotected:\n    std::string name;\n};\n\nclass Knight : public Character {\npublic:\n    Knight() { name = "Knight"; }\n};', 'Knight k;\nk.introduce();', ['iostream', 'string']) }),
        ],
      },
      {
        id: 'cpp10-2',
        title: 'virtual and override',
        goal: 'Call the right method through a base class.',
        steps: [
          concept('Polymorphism',
            'You want all enemies in **one** list and tell each one "attack". But each should attack in its own way. For that:\n\n- In the base class: `virtual`\n- In the derived class: `override`\n- The list stores pointers to the base class, e.g. `std::vector<std::unique_ptr<Enemy>>`\n\nWithout `virtual` the method of the base class would always run.',
            { code: 'class Enemy {\npublic:\n    virtual ~Enemy() = default;\n    virtual std::string sound() const { return "..."; }\n};\n\nclass Orc : public Enemy {\npublic:\n    std::string sound() const override { return "Grrr"; }\n};' }),
          mc('What is `override` for?', ['The compiler checks that a virtual method is really being overridden', 'It makes the method faster', 'It deletes the base method', 'It is required for every method'], 0,
            'If you mistype the name, the compiler reports an error thanks to override instead of silently creating a new method.'),
          mc('Why does the base class have `virtual ~Enemy() = default;`?', ['So that deleting through a base pointer also runs the right destructor', 'So nobody can create enemies', 'For faster compiling', 'It is just style'], 0),
          write('Base class `Enemy` with `virtual std::string sound() const`, derived `Orc` (`"Grrr"`) and `Ghost` (`"Booo"`). Store one of each in a `std::vector<std::unique_ptr<Enemy>>` and output all sounds in a loop.',
            cppFile('', '', ['iostream', 'memory', 'string', 'vector']),
            { expect: 'Grrr\nBooo', must: [[/virtual/, 'The base method needs `virtual`.'], [/override/, 'Mark the overridden methods with `override`.'], [/vector\s*<\s*std::unique_ptr\s*<\s*Enemy\s*>\s*>/, 'Use `std::vector<std::unique_ptr<Enemy>>`.']], solution: cppFile('class Enemy {\npublic:\n    virtual ~Enemy() = default;\n    virtual std::string sound() const { return "..."; }\n};\n\nclass Orc : public Enemy {\npublic:\n    std::string sound() const override { return "Grrr"; }\n};\n\nclass Ghost : public Enemy {\npublic:\n    std::string sound() const override { return "Booo"; }\n};', 'std::vector<std::unique_ptr<Enemy>> horde;\nhorde.push_back(std::make_unique<Orc>());\nhorde.push_back(std::make_unique<Ghost>());\nfor (const auto& e : horde) {\n    std::cout << e->sound() << std::endl;\n}', ['iostream', 'memory', 'string', 'vector']) }),
        ],
      },
      {
        id: 'cpp10-3',
        title: 'Abstract classes',
        goal: 'Define interfaces with pure virtual methods.',
        steps: [
          concept('Just a promise',
            'A **pure virtual** method `virtual double area() const = 0;` has no body. A class with one is **abstract**: you can\'t create objects of it, only of derived classes that implement the method.\n\nThat is how you say: "Every shape **must** be able to calculate its area."',
            { code: 'class Shape {\npublic:\n    virtual ~Shape() = default;\n    virtual int area() const = 0;\n};' }),
          mc('What happens with `Shape s;` if Shape is abstract?', ['Compiler error', 'An empty object is created', 'area returns 0', 'Crash'], 0),
          fill('Make the method pure virtual.', 'class Weapon {\npublic:\n    ⟦0⟧ int damage() const ⟦1⟧;\n};', ['virtual', '= 0'], ['virtual', '= 0', 'override', 'static']),
          write('Abstract class `Shape` with `virtual int area() const = 0;`. Derive `Rectangle(int w, int h)` and `Square(int s)`. Output the area of Rectangle(3, 4) and Square(5) through a `const Shape&`, with a function `void show(const Shape& s)`.',
            cppFile('', ''),
            { expect: '12\n25', must: [[/=\s*0\s*;/, 'The method in Shape is pure virtual: `= 0;`.'], [/void\s+show\s*\(\s*const\s+Shape\s*&/, 'Create `void show(const Shape& s)`.']], solution: cppFile('class Shape {\npublic:\n    virtual ~Shape() = default;\n    virtual int area() const = 0;\n};\n\nclass Rectangle : public Shape {\npublic:\n    Rectangle(int w, int h) : w(w), h(h) {}\n    int area() const override { return w * h; }\nprivate:\n    int w, h;\n};\n\nclass Square : public Shape {\npublic:\n    Square(int s) : s(s) {}\n    int area() const override { return s * s; }\nprivate:\n    int s;\n};\n\nvoid show(const Shape& shape) {\n    std::cout << shape.area() << std::endl;\n}', 'show(Rectangle(3, 4));\nshow(Square(5));') }),
        ],
      },
    ],
  },

  /* ------------------------------------------------------------ 11 */
  {
    id: 'cpp11',
    title: 'Game dev maths',
    summary: 'Vectors, delta time and collision: the maths inside every game.',
    lessons: [
      {
        id: 'cpp11-1',
        title: 'Vectors',
        goal: 'Calculate positions and directions as 2D vectors.',
        steps: [
          concept('Arrows in space',
            'A **vector** consists of x and y (in 3D also z). It describes a position or a direction with a length. Unreal calls it `FVector`.\n\n- Adding: `(1, 2) + (3, 4) = (4, 6)`, e.g. position plus movement\n- Length: `sqrt(x*x + y*y)`, e.g. the distance to an enemy\n\nWith **operator overloading** you can define `+` for your own types.',
            { code: 'struct Vec2 {\n    double x, y;\n};\n\nVec2 operator+(Vec2 a, Vec2 b) {\n    return {a.x + b.x, a.y + b.y};\n}\n\ndouble length(Vec2 v) {\n    return std::sqrt(v.x * v.x + v.y * v.y);\n}' }),
          predict('A vector (3, 4). How long is it?', 'Vec2 v{3, 4};\nstd::cout << length(v) << std::endl;', '5', 'sqrt(9 + 16) = sqrt(25) = 5. The famous 3-4-5 triangle.'),
          mc('The character stands at (2, 5) and moves by (1, -2). Where is it afterwards?', ['(3, 3)', '(1, 7)', '(2, -10)', '(3, 7)'], 0),
          write('Create `struct Vec2 { double x, y; };`, plus `operator+` and `double length(Vec2 v)` (with `std::sqrt` from `<cmath>`). Output `(1, 2) + (3, 4)` as `(4, 6)` and on the next line the length of `(3, 4)`.',
            cppFile('', '', ['iostream', 'cmath']),
            { expect: '(4, 6)\n5', must: [[/operator\s*\+/, 'Overload `operator+`.'], [/sqrt/, 'The length needs `std::sqrt`.']], solution: cppFile('struct Vec2 {\n    double x, y;\n};\n\nVec2 operator+(Vec2 a, Vec2 b) {\n    return {a.x + b.x, a.y + b.y};\n}\n\ndouble length(Vec2 v) {\n    return std::sqrt(v.x * v.x + v.y * v.y);\n}', 'Vec2 s = Vec2{1, 2} + Vec2{3, 4};\nstd::cout << "(" << s.x << ", " << s.y << ")" << std::endl;\nstd::cout << length(Vec2{3, 4}) << std::endl;', ['iostream', 'cmath']) }),
        ],
      },
      {
        id: 'cpp11-2',
        title: 'Delta time',
        goal: 'Calculate movement independent of the frame rate.',
        steps: [
          concept('Equally fast on every PC',
            'Without delta time your game runs faster on fast PCs. With `position += speed * dt` everything moves the same distance **per second**. `dt` is the time since the last frame, about 0.0167 seconds at 60 FPS.\n\nIn Unreal dt is called `DeltaTime`, in Raylib you get it from `GetFrameTime()`.',
            { code: 'double x = 0;\ndouble speed = 100;   // units per second\ndouble frames[] = {0.5, 0.25, 0.25};\nfor (double dt : frames) {\n    x += speed * dt;\n    std::cout << x << std::endl;\n}', console: '50\n75\n100' }),
          mc('One PC runs at 30 FPS, another at 120. How far does the character get with `x += 200 * dt` in one second?', ['200 units on both', '4 times further on the fast one', 'Further on the slow one', 'It depends on the graphics card'], 0),
          predict('What does this code output?', 'double y = 10;\ndouble fall = 20;\ny -= fall * 0.25;\nstd::cout << y << std::endl;', '5'),
          write('A projectile flies with `speed = 300`. The frames took 0.1, 0.2 and 0.1 seconds. Start at `x = 0` and output x after every frame.',
            cppFile('', 'double x = 0;\ndouble speed = 300;\n'),
            { expect: '30\n90\n120', must: [[/\*\s*dt|dt\s*\*/, 'Calculate with `speed * dt`.'], [/for\s*\(/, 'Loop over the frame times.']], solution: cppFile('', 'double x = 0;\ndouble speed = 300;\ndouble frames[] = {0.1, 0.2, 0.1};\nfor (double dt : frames) {\n    x += speed * dt;\n    std::cout << x << std::endl;\n}') }),
        ],
      },
      {
        id: 'cpp11-3',
        title: 'Collision',
        goal: 'Check whether two rectangles overlap.',
        steps: [
          concept('AABB',
            'The simplest collision: two axis-aligned rectangles (**AABB**, axis-aligned bounding box). They overlap exactly when they overlap on the x axis **and** on the y axis.',
            { code: 'struct Rect {\n    double x, y, w, h;\n};\n\nbool collides(Rect a, Rect b) {\n    return a.x < b.x + b.w && a.x + a.w > b.x &&\n           a.y < b.y + b.h && a.y + a.h > b.y;\n}' }),
          mc('Rectangle A: x from 0 to 10. Rectangle B: x from 12 to 20. Can they collide?', ['No, they don\'t overlap on the x axis', 'Yes, always', 'Only if they are the same height', 'It depends on y'], 0),
          order('Put the collision check together.',
            ['bool collides(Rect a, Rect b) {', '    bool xOverlap = a.x < b.x + b.w && a.x + a.w > b.x;', '    bool yOverlap = a.y < b.y + b.h && a.y + a.h > b.y;', '    return xOverlap && yOverlap;', '}']),
          write('Write `struct Rect` and `bool collides(Rect a, Rect b)`. Test `{0, 0, 10, 10}` against `{5, 5, 10, 10}` and `{0, 0, 10, 10}` against `{20, 0, 5, 5}` and output both results.',
            cppFile('', ''),
            { expect: '1\n0', must: [[/bool\s+collides\s*\(/, 'Create `bool collides(Rect a, Rect b)`.'], [/&&/, 'Both axes must overlap: `&&`.']], solution: cppFile('struct Rect {\n    double x, y, w, h;\n};\n\nbool collides(Rect a, Rect b) {\n    return a.x < b.x + b.w && a.x + a.w > b.x &&\n           a.y < b.y + b.h && a.y + a.h > b.y;\n}', 'std::cout << collides({0, 0, 10, 10}, {5, 5, 10, 10}) << std::endl;\nstd::cout << collides({0, 0, 10, 10}, {20, 0, 5, 5}) << std::endl;') }),
        ],
      },
    ],
  },
];
