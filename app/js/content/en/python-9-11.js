// Python units 9 to 11 (English): object orientation, projects and algorithms, games

import { concept, mc, predict, fill, order, fix, write } from '../helpers.js';

export const pythonUnits9to11 = [
  /* ------------------------------------------------------------ 9 */
  {
    id: 'py9',
    title: 'Object orientation',
    summary: 'Your own data types with classes: players, enemies and items as objects with values and abilities.',
    lessons: [
      {
        id: 'py9-1',
        title: 'Classes and objects',
        goal: 'Create a class as a blueprint and build objects from it.',
        steps: [
          concept('Blueprint and object',
            'A **class** is a blueprint, e.g. for players. An **object** is a concrete instance built from that blueprint.\n\n`__init__` is the **constructor**: it runs when the object is created and sets the start values. `self` is the object itself. So `self.hp` means: the hit points of **this** player.',
            { code: 'class Player:\n    def __init__(self, name):\n        self.name = name\n        self.hp = 100\n\nalex = Player("Alex")\nada = Player("Ada")\nada.hp = 70\nprint(alex.name, alex.hp)\nprint(ada.name, ada.hp)', console: 'Alex 100\nAda 70' }),
          mc('What is `self`?', ['The object the method is currently running for', 'The name of the class', 'A global variable', 'A Python module'], 0),
          predict('What does this program output?', 'class Item:\n    def __init__(self, name, value):\n        self.name = name\n        self.value = value\n\nx = Item("Potion", 5)\nprint(x.value * 3)', '15'),
          fill('Complete the constructor.', 'class Enemy:\n    def ⟦0⟧(self, hp):\n        ⟦1⟧.hp = hp', ['__init__', 'self'], ['__init__', 'self', 'init', 'this']),
          write('Write a class `Player` with `name` (parameter) and `hp = 100`. Create `Player("Alex")` and output `Alex: 100 HP` using the attributes.',
            '',
            { expect: 'Alex: 100 HP', must: [[/class\s+Player/, 'Create `class Player:`.'], [/def\s+__init__\s*\(\s*self/, 'The constructor is called `__init__(self, ...)`.'], [/\.name/, 'Access `name` through the object.']], solution: 'class Player:\n    def __init__(self, name):\n        self.name = name\n        self.hp = 100\n\np = Player("Alex")\nprint(f"{p.name}: {p.hp} HP")' }),
        ],
      },
      {
        id: 'py9-2',
        title: 'Methods',
        goal: 'Give objects abilities.',
        steps: [
          concept('Abilities',
            'A **method** is a function inside a class. It always gets `self` first and can use it to read and change the values of the object.',
            { code: 'class Player:\n    def __init__(self, name):\n        self.name = name\n        self.hp = 100\n\n    def heal(self, amount):\n        self.hp = min(100, self.hp + amount)\n\np = Player("Alex")\np.hp = 60\np.heal(30)\nprint(p.hp)', console: '90' }),
          predict('What does this program output?', 'class Counter:\n    def __init__(self):\n        self.value = 0\n    def plus(self):\n        self.value += 1\n\nc = Counter()\nc.plus()\nc.plus()\nprint(c.value)', '2'),
          mc('Why does every method need `self` as its first parameter?', ['So it knows which object is meant', 'Because Python would be slow otherwise', 'For the return value', 'It is just a comment'], 0),
          write('Extend the class `Player` with `damage(amount)`, which lowers `hp` but never below 0, and `is_defeated()`, which returns `True` when `hp` is 0. The test code is already below.',
            'class Player:\n    def __init__(self, name):\n        self.name = name\n        self.hp = 100\n\n\np = Player("Alex")\np.damage(30)\nprint(p.hp)\np.damage(90)\nprint(p.hp, p.is_defeated())\n',
            { expect: '70\n0 True', must: [[/def\s+damage\s*\(\s*self/, 'Create `def damage(self, amount):` inside the class.'], [/def\s+is_defeated\s*\(\s*self/, 'Create `def is_defeated(self):`.']], solution: 'class Player:\n    def __init__(self, name):\n        self.name = name\n        self.hp = 100\n\n    def damage(self, amount):\n        self.hp = max(0, self.hp - amount)\n\n    def is_defeated(self):\n        return self.hp == 0\n\n\np = Player("Alex")\np.damage(30)\nprint(p.hp)\np.damage(90)\nprint(p.hp, p.is_defeated())\n' }),
        ],
      },
      {
        id: 'py9-3',
        title: 'Inheritance',
        goal: 'Let classes inherit from other classes.',
        steps: [
          concept('Inherit and override',
            'With `class Boss(Enemy):` Boss **inherits** everything from Enemy. You only add what is different. You can **override** an inherited method, i.e. write it anew.\n\n`super().__init__(...)` calls the constructor of the parent class.',
            { code: 'class Enemy:\n    def __init__(self, hp):\n        self.hp = hp\n    def attack(self):\n        return 5\n\nclass Boss(Enemy):\n    def __init__(self):\n        super().__init__(500)\n    def attack(self):\n        return 40\n\nb = Boss()\nprint(b.hp, b.attack())', console: '500 40' }),
          predict('What does this program output?', 'class A:\n    def hello(self):\n        return "A"\n\nclass B(A):\n    pass\n\nprint(B().hello())', 'A', 'B has no hello method of its own, so the one from A is used.'),
          mc('What does `super().__init__(500)` do in the example?', ['Calls the constructor of Enemy', 'Creates a second boss', 'Deletes the object', 'Sets hp to super'], 0),
          write('Create `Animal` with the method `sound()` that returns `"..."`. Derive `Dog` and `Cat` from it and override `sound()` with `"Woof"` and `"Meow"`. In a loop over `[Dog(), Cat()]`, output `sound()` for each.',
            '',
            { expect: 'Woof\nMeow', must: [[/class\s+Dog\s*\(\s*Animal\s*\)/, 'Derive with `class Dog(Animal):`.'], [/class\s+Cat\s*\(\s*Animal\s*\)/, 'Derive with `class Cat(Animal):`.'], [/\bfor\b/, 'Use a loop over the list.']], solution: 'class Animal:\n    def sound(self):\n        return "..."\n\nclass Dog(Animal):\n    def sound(self):\n        return "Woof"\n\nclass Cat(Animal):\n    def sound(self):\n        return "Meow"\n\nfor a in [Dog(), Cat()]:\n    print(a.sound())', explain: 'The same loop calls the right method for each object. This is called **polymorphism** and is just as important in C++ and Unreal.' }),
        ],
      },
    ],
  },

  /* ------------------------------------------------------------ 10 */
  {
    id: 'py10',
    title: 'Projects and algorithms',
    summary: 'Use modules, build searching and sorting yourself: the toolkit for your own programs.',
    lessons: [
      {
        id: 'py10-1',
        title: 'Modules',
        goal: 'Use ready-made tools with import.',
        steps: [
          concept('Don\'t build everything yourself',
            'Python comes with many **modules**: collections of ready-made functions. You bring them into your program with `import`.\n\n- `math`: square root, rounding, pi\n- `random`: randomness, e.g. dice\n- `time`: time and pauses\n\n`from math import sqrt` only imports one function, then you write `sqrt(9)` instead of `math.sqrt(9)`.',
            { code: 'import math\nimport random\n\nprint(math.sqrt(16))\ndice = random.randint(1, 6)\nprint(1 <= dice <= 6)', console: '4.0\nTrue' }),
          predict('What does this program output?', 'import math\nprint(math.floor(7.8))', '7'),
          mc('Which values can `random.randint(1, 6)` return?', ['1 to 6, both included', '1 to 5', '0 to 6', 'only 1 or 6'], 0,
            'Unlike range, with randint the end is included.'),
          fill('Import only the function `choice`.', '⟦0⟧ random ⟦1⟧ choice\nprint(choice(["Rock", "Scissors", "Paper"]))', ['from', 'import'], ['from', 'import', 'get', 'use']),
          write('Import `math`. Output `math.floor(9.99)` and below it pi rounded to two places with `round()`.',
            '',
            { expect: '9\n3.14', must: [[/import\s+math/, 'Start with `import math`.'], [/round\s*\(/, 'Round with `round(value, 2)`.']], solution: 'import math\nprint(math.floor(9.99))\nprint(round(math.pi, 2))' }),
        ],
      },
      {
        id: 'py10-2',
        title: 'Searching',
        goal: 'Find an element in a list yourself.',
        steps: [
          concept('Linear search',
            'An **algorithm** is an exact recipe for solving a problem. The simplest search algorithm checks each element one after the other: the **linear search**.\n\nIf the list is sorted, it gets much faster: **binary search** looks in the middle and halves the range with every step. With a million entries it only needs about 20 steps.',
            { code: 'def find(items, target):\n    for i in range(len(items)):\n        if items[i] == target:\n            return i\n    return -1\n\nprint(find([4, 8, 15], 8))', console: '1' }),
          mc('In the worst case, how many steps does linear search need for 1000 elements?', ['1000', '10', '1', '500'], 0, 'If the target is at the very end or missing, every element must be checked.'),
          predict('What does this program output?', 'def find(items, target):\n    for i in range(len(items)):\n        if items[i] == target:\n            return i\n    return -1\n\nprint(find(["a", "b"], "z"))', '-1'),
          order('Put the linear search together.',
            ['def find(items, target):', '    for i in range(len(items)):', '        if items[i] == target:', '            return i', '    return -1'],
            'return -1 comes after the loop, otherwise it would give up at the first wrong element.'),
          write('Write `find(items, target)` yourself, without `.index()`. It returns the position or -1. Test with `find([3, 9, 27, 81], 27)` and `find([3, 9, 27, 81], 5)`.',
            '',
            { expect: '2\n-1', must: [[/def\s+find\s*\(/, 'Create `def find(items, target):`.']], mustNot: [[/\.index\s*\(/, 'Build the search yourself, without `.index()`.']], solution: 'def find(items, target):\n    for i in range(len(items)):\n        if items[i] == target:\n            return i\n    return -1\n\nprint(find([3, 9, 27, 81], 27))\nprint(find([3, 9, 27, 81], 5))' }),
        ],
      },
      {
        id: 'py10-3',
        title: 'Sorting',
        goal: 'Sort with sorted() and your own sorting algorithm.',
        steps: [
          concept('Bringing order',
            '`sorted(list)` returns a sorted copy, `list.sort()` sorts the list itself. With `key=` you decide what to sort by, with `reverse=True` the other way round.\n\nInside there is a sorting algorithm. The simplest one is **bubble sort**: always compare two neighbours and swap them if they are the wrong way round. Repeat until nothing is swapped any more.',
            { code: 'words = ["Kiwi", "Fig", "Banana"]\nprint(sorted(words, key=len))\nprint(sorted([3, 1, 2], reverse=True))', console: "['Fig', 'Kiwi', 'Banana']\n[3, 2, 1]" }),
          predict('What does this line output?', 'print(sorted([5, 2, 9, 1]))', '[1, 2, 5, 9]'),
          mc('How do you swap `a` and `b` in one line in Python?', ['a, b = b, a', 'a = b = a', 'swap(a, b)', 'a <-> b'], 0, null, { codeOptions: true }),
          write('Write bubble sort yourself, without `sorted()` and `.sort()`. Sort `numbers = [9, 2, 5, 1]` and output the list.',
            'numbers = [9, 2, 5, 1]\n',
            { expect: '[1, 2, 5, 9]', mustNot: [[/sorted\s*\(|\.sort\s*\(/, 'Build the sorting yourself, without `sorted()` or `.sort()`.']], must: [[/\bfor\b[\s\S]*\bfor\b|\bwhile\b[\s\S]*\bfor\b/, 'Bubble sort needs two loops: one for the passes, one for the neighbours.']], solution: 'numbers = [9, 2, 5, 1]\nfor sweep in range(len(numbers)):\n    for i in range(len(numbers) - 1):\n        if numbers[i] > numbers[i + 1]:\n            numbers[i], numbers[i + 1] = numbers[i + 1], numbers[i]\nprint(numbers)' }),
        ],
      },
    ],
  },

  /* ------------------------------------------------------------ 11 */
  {
    id: 'py11',
    title: 'Games with Python',
    summary: 'Game logic in the console, windows with pygame and the bridge to the Godot engine.',
    lessons: [
      {
        id: 'py11-1',
        title: 'Turn-based battle',
        goal: 'Build a game loop with states in the console.',
        steps: [
          concept('Game logic without graphics',
            'At its core every game is a **loop** that changes the state of the world step by step. Graphics are just the display of that state.\n\nA turn-based battle: as long as both are alive, the hero strikes first, then the enemy, if it is still alive.',
            { code: 'hero, enemy = 20, 12\nround_no = 0\nwhile hero > 0 and enemy > 0:\n    round_no += 1\n    enemy = max(0, enemy - 7)\n    if enemy > 0:\n        hero -= 4\n    print(f"Round {round_no}: Hero {hero}, Enemy {enemy}")', console: 'Round 1: Hero 16, Enemy 5\nRound 2: Hero 16, Enemy 0' }),
          mc('Why is there `if enemy > 0:` before the counter-attack in the example?', ['A defeated enemy must not strike again', 'So the loop is faster', 'Otherwise there is a syntax error', 'It is unnecessary'], 0),
          write('Hero: 30 HP, hits for 8. Enemy: 25 HP, hits for 5. Hero first, the enemy only strikes back if still alive, HP never below 0. Each round output `Round N: Hero X, Enemy Y` and at the end `Victory!` if the enemy is at 0, otherwise `Defeat`.',
            'hero = 30\nenemy = 25\n',
            { expect: 'Round 1: Hero 25, Enemy 17\nRound 2: Hero 20, Enemy 9\nRound 3: Hero 15, Enemy 1\nRound 4: Hero 15, Enemy 0\nVictory!', must: [[/\bwhile\b/, 'Use a `while` loop as the game loop.']], solution: 'hero = 30\nenemy = 25\nround_no = 0\nwhile hero > 0 and enemy > 0:\n    round_no += 1\n    enemy = max(0, enemy - 8)\n    if enemy > 0:\n        hero = max(0, hero - 5)\n    print(f"Round {round_no}: Hero {hero}, Enemy {enemy}")\nif enemy == 0:\n    print("Victory!")\nelse:\n    print("Defeat")' }),
          predict('What does this program output?', 'state = "menu"\nfor key in ["start", "pause", "start"]:\n    if key == "start":\n        state = "game"\n    elif key == "pause":\n        state = "pause"\n    print(state)', 'game\npause\ngame', 'This is how state machines work: a variable remembers which state the game is in.'),
        ],
      },
      {
        id: 'py11-2',
        title: 'Windows with pygame',
        goal: 'Understand the structure of a pygame game.',
        steps: [
          concept('pygame',
            '**pygame** is a library for 2D games in Python. Install it in the terminal: `pip install pygame`. Then the code runs in VS Code, not here in Laufzeit, because it opens a real window.\n\nThe structure is always the game loop: read events, update the world, draw, show the picture.',
            { code: 'import pygame\n\npygame.init()\nwindow = pygame.display.set_mode((640, 480))\nclock = pygame.time.Clock()\nx = 50\nrunning = True\n\nwhile running:\n    for event in pygame.event.get():\n        if event.type == pygame.QUIT:\n            running = False\n    x += 2\n    window.fill((30, 30, 40))\n    pygame.draw.circle(window, (255, 200, 0), (x, 240), 20)\n    pygame.display.flip()\n    clock.tick(60)\n\npygame.quit()' }),
          order('Put one frame of the pygame loop in the right order.',
            ['for event in pygame.event.get():', '    if event.type == pygame.QUIT:', '        running = False', 'x += 2', 'window.fill((30, 30, 40))', 'pygame.display.flip()'],
            'First events, then update, then drawing, and at the very end show the finished picture.'),
          mc('What does `clock.tick(60)` do?', ['Limits the game to 60 frames per second', 'Waits 60 seconds', 'Counts to 60', 'Plays a sound'], 0),
          fill('Show the finished picture.', 'pygame.display.⟦0⟧()', ['flip'], ['flip', 'show', 'print', 'draw']),
          write('Write the skeleton of a pygame program: `pygame.init()`, a window with `set_mode`, a `while` loop that checks events for `pygame.QUIT` and `pygame.display.flip()`.\n\nThis code is only checked for its building blocks, not run.',
            'import pygame\n\n',
            { run: false, must: [[/pygame\.init\s*\(/, 'Start with `pygame.init()`.'], [/set_mode\s*\(/, 'Open a window with `pygame.display.set_mode((640, 480))`.'], [/\bwhile\b/, 'The game loop is a `while` loop.'], [/pygame\.event\.get\s*\(/, 'Read events with `pygame.event.get()`.'], [/pygame\.QUIT/, 'Check for `pygame.QUIT` so the window can be closed.'], [/display\.flip\s*\(/, 'Show the picture with `pygame.display.flip()`.']], solution: 'import pygame\n\npygame.init()\nwindow = pygame.display.set_mode((640, 480))\nrunning = True\nwhile running:\n    for event in pygame.event.get():\n        if event.type == pygame.QUIT:\n            running = False\n    window.fill((0, 0, 0))\n    pygame.display.flip()\npygame.quit()', explain: 'Try it in VS Code: `pip install pygame`, save the file, run it.' }),
        ],
      },
      {
        id: 'py11-3',
        title: 'Delta time and Godot',
        goal: 'Movement independent of the frame rate and the way to GDScript.',
        steps: [
          concept('Delta time',
            'If a game runs at 30 frames per second on one PC and at 144 on another, a character moving with `x += 2` would have different speeds. The solution: **delta time**, the time since the last frame in seconds.\n\n`x += speed * dt` moves the character by `speed` units **per second**, no matter how fast the PC is.',
            { code: 'speed = 100      # units per second\nx = 0.0\nfor dt in [0.5, 0.25, 0.25]:\n    x += speed * dt\n    print(x)', console: '50.0\n75.0\n100.0' }),
          concept('GDScript in Godot',
            'The **Godot** engine uses GDScript, which looks almost like Python. Godot calls the function `_process(delta)` every frame, and `delta` is exactly the delta time from before.',
            { code: 'extends Sprite2D\n\nvar speed = 200\n\nfunc _process(delta):\n    if Input.is_action_pressed("ui_right"):\n        position.x += speed * delta' }),
          mc('What is `delta` in `_process(delta)`?', ['The time since the last frame in seconds', 'The number of frames', 'The speed', 'The position'], 0),
          mc('An enemy should fly 300 units per second. Which line is right?', ['x += 300 * dt', 'x += 300', 'x += dt', 'x = 300 / dt'], 0, null, { codeOptions: true }),
          write('Simulate a rocket with `speed = 80` that starts at `y = 0.0`. The frames took `[0.5, 0.5, 0.25]` seconds. Output `y` after every frame.',
            'speed = 80\ny = 0.0\n',
            { expect: '40.0\n80.0\n100.0', must: [[/\*\s*dt|dt\s*\*/, 'Calculate with `speed * dt`.'], [/\bfor\b/, 'Loop over the frames with `for dt in [...]`.']], solution: 'speed = 80\ny = 0.0\nfor dt in [0.5, 0.5, 0.25]:\n    y += speed * dt\n    print(y)', explain: 'Exactly this principle is inside Godot, Unity and Unreal. With that you have completed the Python path.' }),
        ],
      },
    ],
  },
];
