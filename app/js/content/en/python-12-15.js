// Python units 12 to 15 (pro, English): recursion and algorithms, advanced functions,
// clean programs, data structures and efficiency

import { concept, mc, predict, fill, order, write } from '../helpers.js';

export const pythonUnits12to15 = [
  /* ------------------------------------------------------------ 12 */
  {
    id: 'py12',
    title: 'Recursion and algorithms',
    summary: 'Functions that call themselves, binary search and how to measure the speed of code.',
    lessons: [
      {
        id: 'py12-1',
        title: 'Recursion',
        goal: 'Solve problems by having a function call itself.',
        steps: [
          concept('A function calls itself',
            '**Recursion** means: a function solves a big problem by calling itself for a smaller one. Two parts are required:\n\n- **Base case**: the smallest version, answered without calling itself\n- **Recursive step**: a call with a smaller problem\n\nWithout a base case the function calls itself endlessly until Python stops with `RecursionError`.',
            { code: 'def factorial(n):\n    if n <= 1:          # base case\n        return 1\n    return n * factorial(n - 1)\n\nprint(factorial(5))   # 5 * 4 * 3 * 2 * 1', console: '120' }),
          predict('What does this program output?', 'def countdown(n):\n    if n == 0:\n        print("Start")\n        return\n    print(n)\n    countdown(n - 1)\n\ncountdown(3)', '3\n2\n1\nStart'),
          mc('What happens if the base case is missing?', ['RecursionError: the function calls itself endlessly', 'The function returns 0', 'Nothing', 'SyntaxError'], 0),
          predict('What does this program output?', 'def total(items):\n    if not items:\n        return 0\n    return items[0] + total(items[1:])\n\nprint(total([4, 5, 6]))', '15', 'An empty list is the base case. Otherwise: first element plus the total of the rest.'),
          write('Write `fib(n)` recursively: `fib(0) = 0`, `fib(1) = 1`, otherwise `fib(n - 1) + fib(n - 2)`. Output `fib(10)`.',
            '',
            { expect: '55', must: [[/def\s+fib\s*\(/, 'Create `def fib(n):`.'], [/def\s+fib[\s\S]*fib\s*\(\s*n\s*-\s*1\s*\)/, 'The function must call itself with `fib(n - 1)`.']], solution: 'def fib(n):\n    if n < 2:\n        return n\n    return fib(n - 1) + fib(n - 2)\n\nprint(fib(10))', explain: 'For fib(40) this would already be very slow, because a lot is calculated twice. The fix: remember results (memoization) or use a loop.' }),
        ],
      },
      {
        id: 'py12-2',
        title: 'Thinking recursively',
        goal: 'Apply recursion to numbers, text and nested data.',
        steps: [
          concept('Make it smaller until it\'s trivial',
            'The trick with every recursion: how does the problem get **one step smaller**? With numbers often `n // 10` (drop the last digit) or `n - 1`, with text `text[1:]`, with nested lists: process every element again.',
            { code: 'def deep_sum(data):\n    total = 0\n    for x in data:\n        if isinstance(x, list):\n            total += deep_sum(x)   # sublist recursively\n        else:\n            total += x\n    return total\n\nprint(deep_sum([1, [2, 3], [4, [5]]]))', console: '15' }),
          predict('What does this line output?', 'print(9045 // 10, 9045 % 10)', '904 5', '`// 10` cuts off the last digit, `% 10` gives it to you.'),
          predict('What does this program output?', 'def reverse(t):\n    if len(t) <= 1:\n        return t\n    return reverse(t[1:]) + t[0]\n\nprint(reverse("Bit"))', 'tiB'),
          write('Write `digit_sum(n)` recursively: the sum of all digits. Output `digit_sum(9045)` and `digit_sum(7)`.',
            '',
            { expect: '18\n7', must: [[/def\s+digit_sum[\s\S]*digit_sum\s*\(\s*n\s*\/\/\s*10\s*\)/, 'Call the function recursively with `n // 10`.']], mustNot: [[/\bstr\s*\(/, 'Solve it with maths, not with `str()`.']], solution: 'def digit_sum(n):\n    if n < 10:\n        return n\n    return n % 10 + digit_sum(n // 10)\n\nprint(digit_sum(9045))\nprint(digit_sum(7))' }),
        ],
      },
      {
        id: 'py12-3',
        title: 'Binary search and Big O',
        goal: 'Search fast and estimate the speed of algorithms.',
        steps: [
          concept('How fast is your code?',
            '**Big O** describes how the running time grows with the amount of data n:\n\n- `O(1)`: always equally fast, e.g. `items[5]`\n- `O(log n)`: binary search, about 20 steps for a million elements\n- `O(n)`: go through everything once, linear search\n- `O(n²)`: two nested loops, e.g. bubble sort\n\nIn games this decides whether 10,000 objects run smoothly or the game stutters.',
            { code: 'def binary_search(items, target):\n    left, right = 0, len(items) - 1\n    while left <= right:\n        middle = (left + right) // 2\n        if items[middle] == target:\n            return middle\n        if items[middle] < target:\n            left = middle + 1\n        else:\n            right = middle - 1\n    return -1' }),
          mc('What does binary search require?', ['The list must be sorted', 'The list must be short', 'Only numbers', 'Nothing'], 0),
          mc('Two nested loops over n elements. Which complexity?', ['O(n²)', 'O(n)', 'O(log n)', 'O(1)'], 0, null, { codeOptions: true }),
          order('Put together the core of binary search.',
            ['while left <= right:', '    middle = (left + right) // 2', '    if items[middle] == target:', '        return middle', '    if items[middle] < target:', '        left = middle + 1', '    else:', '        right = middle - 1']),
          write('Write `binary_search(items, target)` yourself (without `in` and `.index()`). Test with `[2, 5, 8, 12, 16, 23, 38]`: search for 12 and 7.',
            '',
            { expect: '3\n-1', must: [[/\bwhile\b/, 'Use a `while` loop.'], [/\/\/\s*2/, 'Calculate the middle with `// 2`.']], mustNot: [[/\.index\s*\(/, 'Without `.index()`.']], solution: 'def binary_search(items, target):\n    left, right = 0, len(items) - 1\n    while left <= right:\n        middle = (left + right) // 2\n        if items[middle] == target:\n            return middle\n        if items[middle] < target:\n            left = middle + 1\n        else:\n            right = middle - 1\n    return -1\n\nnumbers = [2, 5, 8, 12, 16, 23, 38]\nprint(binary_search(numbers, 12))\nprint(binary_search(numbers, 7))' }),
        ],
      },
    ],
  },

  /* ------------------------------------------------------------ 13 */
  {
    id: 'py13',
    title: 'Advanced functions',
    summary: 'Lambdas, generators, *args, closures and decorators: tools pros use every day.',
    lessons: [
      {
        id: 'py13-1',
        title: 'Lambda, map and filter',
        goal: 'Write small functions right where you need them.',
        steps: [
          concept('Functions without a name',
            'A **lambda** is a mini function in one line: `lambda x: x * 2`. Especially handy as `key` when sorting.\n\n- `sorted(items, key=lambda s: s[1])`: sorts by the second value\n- `map(f, items)`: applies f to every element\n- `filter(f, items)`: keeps only elements where f is true',
            { code: 'scores = [("Ada", 120), ("Alex", 300)]\nbest = sorted(scores, key=lambda p: p[1], reverse=True)\nprint(best[0][0])\nprint(list(map(lambda x: x * 2, [1, 2, 3])))', console: 'Alex\n[2, 4, 6]' }),
          predict('What does this line output?', 'print(list(filter(lambda n: n % 2 == 0, [1, 2, 3, 4, 5, 6])))', '[2, 4, 6]'),
          mc('What does `(lambda a, b: a + b)(2, 3)` return?', ['5', '23', 'A function', 'Error'], 0, null, { codeOptions: true }),
          write('You have a highscore list of tuples. Sort it with `sorted` and a lambda **descending by points** and output the names one after the other.',
            'players = [("Ada", 120), ("Alex", 300), ("Linus", 80)]\n',
            { expect: 'Alex\nAda\nLinus', must: [[/lambda/, 'Use a `lambda` as key.'], [/sorted\s*\(|\.sort\s*\(/, 'Sort with `sorted()`.']], solution: 'players = [("Ada", 120), ("Alex", 300), ("Linus", 80)]\nfor name, points in sorted(players, key=lambda p: p[1], reverse=True):\n    print(name)' }),
        ],
      },
      {
        id: 'py13-2',
        title: '*args and generators',
        goal: 'Accept any number of arguments and produce values one by one.',
        steps: [
          concept('Flexible functions',
            '- `*args` collects any number of arguments in a tuple\n- `**kwargs` collects named arguments in a dictionary\n\nA **generator** uses `yield` instead of `return`. It delivers a value, pauses, and continues exactly there on the next request. That way you can produce huge or even endless sequences without keeping everything in memory.',
            { code: 'def total(*numbers):\n    return sum(numbers)\n\ndef count_up(limit):\n    n = 1\n    while n <= limit:\n        yield n\n        n += 1\n\nprint(total(1, 2, 3, 4))\nprint(list(count_up(3)))', console: '10\n[1, 2, 3]' }),
          predict('What does this program output?', 'def info(**values):\n    for k, v in values.items():\n        print(k, v)\n\ninfo(hp=80, level=3)', 'hp 80\nlevel 3'),
          mc('What is the advantage of a generator over a list?', ['Values are only created when needed, which saves memory', 'It is always faster to write', 'It can\'t have errors', 'It sorts automatically'], 0),
          write('Write a generator `countdown(n)` that yields n, n-1, ... down to 1. Output `list(countdown(4))`.',
            '',
            { expect: '[4, 3, 2, 1]', must: [[/\byield\b/, 'Use `yield`.']], solution: 'def countdown(n):\n    while n > 0:\n        yield n\n        n -= 1\n\nprint(list(countdown(4)))' }),
        ],
      },
      {
        id: 'py13-3',
        title: 'Closures and decorators',
        goal: 'Build functions that change functions.',
        steps: [
          concept('Functions are just values too',
            'In Python you can store functions in variables, pass them around and return them. An inner function remembers variables of the outer one: that is a **closure**.\n\nA **decorator** is a function that wraps another function and extends its behaviour. Written with `@name` above the function. Frameworks like Flask or pytest use this all the time.',
            { code: 'def log(function):\n    def wrapper(*args):\n        print(f"Call {function.__name__}{args}")\n        return function(*args)\n    return wrapper\n\n@log\ndef plus(a, b):\n    return a + b\n\nprint(plus(2, 3))', console: 'Call plus(2, 3)\n5' }),
          predict('What does this program output?', 'def multiplier(factor):\n    def times(x):\n        return x * factor\n    return times\n\ntriple = multiplier(3)\nprint(triple(7))', '21', 'triple remembers factor = 3. That is the closure.'),
          mc('What does `@log` above `def plus` do?', ['It replaces plus with log(plus)', 'It comments the function out', 'It makes plus private', 'It calls plus immediately'], 0),
          write('Write a decorator `loud` that returns the result of the wrapped function in capital letters. Decorate `greet(name)` with it, which returns `f"hello {name}"`, and output `greet("alex")`.',
            '',
            { expect: 'HELLO ALEX', must: [[/def\s+loud\s*\(/, 'Create `def loud(function):`.'], [/@loud/, 'Decorate with `@loud`.'], [/\.upper\s*\(/, 'Use `.upper()`.']], solution: 'def loud(function):\n    def wrapper(*args):\n        return function(*args).upper()\n    return wrapper\n\n@loud\ndef greet(name):\n    return f"hello {name}"\n\nprint(greet("alex"))' }),
        ],
      },
    ],
  },

  /* ------------------------------------------------------------ 14 */
  {
    id: 'py14',
    title: 'Clean programs',
    summary: 'Your own errors, JSON, type hints and tests: this is what code written in teams and companies looks like.',
    lessons: [
      {
        id: 'py14-1',
        title: 'Raising your own errors',
        goal: 'Work with raise and your own exception classes.',
        steps: [
          concept('raise',
            'So far you have only caught errors. With `raise` you **throw** one yourself when something forbidden happens. Whoever calls the function decides with `try/except` what happens next.\n\nYou build your own kinds of errors as a class that inherits from `Exception`.',
            { code: 'class NotEnoughGold(Exception):\n    pass\n\ndef buy(gold, price):\n    if price > gold:\n        raise NotEnoughGold(f"{price - gold} gold missing")\n    return gold - price\n\ntry:\n    buy(30, 50)\nexcept NotEnoughGold as error:\n    print(error)', console: '20 gold missing' }),
          predict('What does this program output?', 'def check(age):\n    if age < 0:\n        raise ValueError("invalid")\n    return "ok"\n\ntry:\n    print(check(-3))\nexcept ValueError as e:\n    print("Error:", e)', 'Error: invalid'),
          mc('Why are your own exception classes worth it?', ['You can catch exactly that kind of error', 'They make the program faster', 'Python requires it', 'So there are no errors any more'], 0),
          write('Write `withdraw(balance, amount)`: if the amount is greater than the balance, raise a `ValueError` with the text `Not enough money`, otherwise return the new balance. Call `withdraw(100, 30)` and output the result, then `withdraw(100, 500)` in a `try` and output the error message.',
            '',
            { expect: '70\nNot enough money', must: [[/raise\s+ValueError/, 'Raise the error with `raise ValueError(...)`.'], [/except\s+ValueError/, 'Catch it with `except ValueError`.']], solution: 'def withdraw(balance, amount):\n    if amount > balance:\n        raise ValueError("Not enough money")\n    return balance - amount\n\nprint(withdraw(100, 30))\ntry:\n    withdraw(100, 500)\nexcept ValueError as e:\n    print(e)' }),
        ],
      },
      {
        id: 'py14-2',
        title: 'JSON and type hints',
        goal: 'Store data in the standard format and make code self-explanatory.',
        steps: [
          concept('Exchanging data',
            '**JSON** is the standard format for data between programs, websites and games. It looks like a Python dictionary. The `json` module translates back and forth:\n\n- `json.dump(data, file)` and `json.load(file)`: with files\n- `json.dumps(data)` and `json.loads(text)`: as text\n\n**Type hints** like `def heal(hp: int) -> int:` change nothing about how code runs, but make it easier to read, and editors like VS Code use them to find errors before you start.',
            { code: 'import json\n\nsave: dict = {"name": "Alex", "level": 3, "items": ["Sword"]}\nwith open("savegame.json", "w") as f:\n    json.dump(save, f)\n\nwith open("savegame.json") as f:\n    loaded = json.load(f)\nprint(loaded["items"][0])', console: 'Sword' }),
          predict('What does this line output?', 'import json\nprint(json.dumps({"hp": 80}))', '{"hp": 80}', 'JSON always uses double quotes.'),
          mc('What happens with `def f(x: int) -> int: return x` and the call `f("Text")`?', ['It still runs, type hints are not enforced', 'TypeError', 'SyntaxError', 'The text is converted to a number'], 0,
            'Python doesn\'t check type hints while running. Tools like mypy or VS Code warn you beforehand, though.'),
          write('Save `{"name": "Alex", "level": 3}` with `json.dump` to `save.json`, load the file with `json.load` and output `Alex 3` (name and level from the loaded data).',
            'import json\n\n',
            { expect: 'Alex 3', must: [[/json\.dump\s*\(/, 'Save with `json.dump`.'], [/json\.load\s*\(/, 'Load with `json.load`.']], solution: 'import json\n\nwith open("save.json", "w") as f:\n    json.dump({"name": "Alex", "level": 3}, f)\n\nwith open("save.json") as f:\n    data = json.load(f)\nprint(data["name"], data["level"])' }),
        ],
      },
      {
        id: 'py14-3',
        title: 'Testing',
        goal: 'Check your own code automatically.',
        steps: [
          concept('Code that checks code',
            'Pros write **tests**: small programs that check whether functions return the right thing. If you change something later, the tests immediately show whether everything still works.\n\nThe simplest tool is `assert condition, "message"`: if the condition is false, the program stops with an `AssertionError`. Bigger projects use **pytest**, which works exactly the same way.\n\nBy the way: this is exactly how Bitweg checks your tasks.',
            { code: 'def double(x):\n    return x * 2\n\ndef test_double():\n    assert double(2) == 4\n    assert double(0) == 0\n    assert double(-3) == -6, "negative numbers"\n\ntest_double()\nprint("All tests passed")', console: 'All tests passed' }),
          mc('What happens with `assert 1 + 1 == 3, "maths broken"`?', ['AssertionError: maths broken', 'False appears', 'Nothing', 'SyntaxError'], 0),
          mc('Which test cases matter most for a function `is_adult(age)`?', ['17, 18 and 19, right at the limit', '1, 50 and 100', 'Only 18', 'Only very big numbers'], 0, 'Bugs almost always happen at limits: >= instead of >.'),
          write('Write `is_palindrome(text)` that ignores upper/lower case. Then write a function `test()` with at least three `assert` lines (e.g. "Anna", "Otto", "Alex"), call it and then output `All tests passed`.',
            '',
            { expect: 'All tests passed', must: [[/def\s+is_palindrome\s*\(/, 'Create `def is_palindrome(text):`.'], [/assert[\s\S]*assert[\s\S]*assert/, 'Write at least three `assert` lines.'], [/\.lower\s*\(|\.upper\s*\(|\.casefold\s*\(/, 'Ignore upper/lower case with `.lower()`.']], solution: 'def is_palindrome(text):\n    t = text.lower()\n    return t == t[::-1]\n\ndef test():\n    assert is_palindrome("Anna")\n    assert is_palindrome("Otto")\n    assert not is_palindrome("Alex")\n\ntest()\nprint("All tests passed")', explain: '`t[::-1]` reverses a text. Slicing with step -1.' }),
        ],
      },
    ],
  },

  /* ------------------------------------------------------------ 15 */
  {
    id: 'py15',
    title: 'Data structures and efficiency',
    summary: 'Stack, queue, graphs and breadth-first search, plus dataclasses. The toolkit for game AI and job interviews.',
    lessons: [
      {
        id: 'py15-1',
        title: 'Stack and queue',
        goal: 'The two most important data structures after the list.',
        steps: [
          concept('Stack and queue',
            '- **Stack**: the last thing you put on top is the first you take off. In Python: `append()` and `pop()`. Examples: undo, checking brackets\n- **Queue**: first come, first served. Use `collections.deque` with `append()` and `popleft()`, which is O(1). Examples: game turns, breadth-first search',
            { code: 'from collections import deque\n\nstack = [1, 2, 3]\nprint(stack.pop())\n\nqueue = deque(["Ada", "Alex"])\nqueue.append("Linus")\nprint(queue.popleft())', console: '3\nAda' }),
          predict('What does this program output?', 'undo = []\nfor action in ["run", "jump", "shoot"]:\n    undo.append(action)\nprint(undo.pop())\nprint(undo.pop())', 'shoot\njump'),
          mc('Why `deque.popleft()` instead of `list.pop(0)`?', ['pop(0) has to shift all other elements, popleft is O(1)', 'pop(0) doesn\'t exist', 'deque sorts automatically', 'There is no difference'], 0),
          write('Write `brackets_ok(text)` with a stack: `True` if all `()`, `[]` and `{}` are closed correctly. Output the result for `"(a[b]{c})"` and for `"(]"`.',
            '',
            { expect: 'True\nFalse', must: [[/def\s+brackets_ok\s*\(/, 'Create `def brackets_ok(text):`.'], [/\.pop\s*\(/, 'Take elements off the stack with `.pop()`.']], solution: 'def brackets_ok(text):\n    pairs = {")": "(", "]": "[", "}": "{"}\n    stack = []\n    for c in text:\n        if c in "([{":\n            stack.append(c)\n        elif c in pairs:\n            if not stack or stack.pop() != pairs[c]:\n                return False\n    return not stack\n\nprint(brackets_ok("(a[b]{c})"))\nprint(brackets_ok("(]"))' }),
        ],
      },
      {
        id: 'py15-2',
        title: 'Graphs and breadth-first search',
        goal: 'Find the shortest path between two places.',
        steps: [
          concept('Places and connections',
            'A **graph** consists of nodes (rooms, cities, tiles) and edges (connections). In Python it is usually stored as a dictionary: a node points to a list of its neighbours.\n\n**Breadth-first search (BFS)** finds the shortest path in steps: it works with a queue and first visits all neighbours, then their neighbours and so on. That is exactly how enemies in many games find their way to the player.',
            { code: 'from collections import deque\n\nmap_ = {\n    "Hall": ["Kitchen", "Tower"],\n    "Kitchen": ["Hall", "Cellar"],\n    "Tower": ["Hall"],\n    "Cellar": ["Kitchen"],\n}\n\ndef steps(start, goal):\n    visited = {start: 0}\n    queue = deque([start])\n    while queue:\n        room = queue.popleft()\n        if room == goal:\n            return visited[room]\n        for neighbour in map_[room]:\n            if neighbour not in visited:\n                visited[neighbour] = visited[room] + 1\n                queue.append(neighbour)\n    return -1\n\nprint(steps("Tower", "Cellar"))', console: '3' }),
          mc('Why does BFS remember visited nodes?', ['Otherwise it runs in circles', 'So it types faster', 'For the graphics', 'It is unnecessary'], 0),
          mc('Which data structure does breadth-first search use?', ['Queue', 'Stack', 'A set alone', 'Tuple'], 0, 'With a stack instead of a queue it becomes depth-first search (DFS). It finds a path, but not necessarily the shortest one.'),
          write('Complete `steps(start, goal)` as a breadth-first search for the given map. Output the number of steps from `"A"` to `"E"` and from `"A"` to `"X"` (doesn\'t exist, so -1).',
            'from collections import deque\n\ngraph = {\n    "A": ["B", "C"],\n    "B": ["A", "D"],\n    "C": ["A", "D"],\n    "D": ["B", "C", "E"],\n    "E": ["D"],\n    "X": [],\n}\n\n',
            { expect: '3\n-1', must: [[/deque/, 'Use a `deque` as the queue.'], [/popleft\s*\(/, 'Get the next node with `popleft()`.']], solution: 'from collections import deque\n\ngraph = {\n    "A": ["B", "C"],\n    "B": ["A", "D"],\n    "C": ["A", "D"],\n    "D": ["B", "C", "E"],\n    "E": ["D"],\n    "X": [],\n}\n\ndef steps(start, goal):\n    visited = {start: 0}\n    queue = deque([start])\n    while queue:\n        node = queue.popleft()\n        if node == goal:\n            return visited[node]\n        for n in graph[node]:\n            if n not in visited:\n                visited[n] = visited[node] + 1\n                queue.append(n)\n    return -1\n\nprint(steps("A", "E"))\nprint(steps("A", "X"))' }),
        ],
      },
      {
        id: 'py15-3',
        title: 'Dataclasses and nice objects',
        goal: 'Write classes with little code and good output.',
        steps: [
          concept('@dataclass',
            'For classes that mainly hold data there is `@dataclass` from the `dataclasses` module. Constructor, comparison and output are created automatically.\n\nWith `__str__` you decide what an object looks like in `print()`. Methods with double underscores are called **dunder methods**. They connect your classes with Python itself, e.g. `__len__` for `len()` or `__lt__` for `<`.',
            { code: 'from dataclasses import dataclass\n\n@dataclass\nclass Item:\n    name: str\n    price: int\n\n    def __str__(self):\n        return f"{self.name} ({self.price} gold)"\n\na = Item("Potion", 5)\nprint(a)\nprint(a == Item("Potion", 5))', console: 'Potion (5 gold)\nTrue' }),
          mc('What does `@dataclass` create automatically?', ['Constructor, comparison with == and a readable representation', 'A database', 'A file', 'Only comments'], 0),
          predict('What does this program output?', 'class Team:\n    def __init__(self, names):\n        self.names = names\n    def __len__(self):\n        return len(self.names)\n\nprint(len(Team(["Ada", "Alex", "Bit"])))', '3'),
          write('Use `@dataclass` to create a class `Item` with `name` and `price`. Add a `__str__` method that returns `Sword (40 gold)`. Create a list of `Item("Sword", 40)` and `Item("Potion", 5)`, sort it with a lambda by price ascending and output each item.',
            'from dataclasses import dataclass\n\n',
            { expect: 'Potion (5 gold)\nSword (40 gold)', must: [[/@dataclass/, 'Use `@dataclass`.'], [/def\s+__str__\s*\(\s*self/, 'Create `__str__(self)`.']], solution: 'from dataclasses import dataclass\n\n@dataclass\nclass Item:\n    name: str\n    price: int\n\n    def __str__(self):\n        return f"{self.name} ({self.price} gold)"\n\nshop = [Item("Sword", 40), Item("Potion", 5)]\nfor item in sorted(shop, key=lambda i: i.price):\n    print(item)', explain: 'With that the Python course is complete. Now it\'s time for projects and free tasks.' }),
        ],
      },
    ],
  },
];
