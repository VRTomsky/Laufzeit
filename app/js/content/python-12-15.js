// Python Abschnitt 12 bis 15 (Profi): Rekursion und Algorithmen, fortgeschrittene Funktionen,
// saubere Programme, Datenstrukturen und Effizienz

import { concept, mc, predict, fill, order, write } from './helpers.js';

export const pythonUnits12to15 = [
  /* ------------------------------------------------------------ 12 */
  {
    id: 'py12',
    title: 'Rekursion und Algorithmen',
    summary: 'Funktionen, die sich selbst aufrufen, binäre Suche und wie man die Geschwindigkeit von Code misst.',
    lessons: [
      {
        id: 'py12-1',
        title: 'Rekursion',
        goal: 'Probleme lösen, indem eine Funktion sich selbst aufruft.',
        steps: [
          concept('Eine Funktion ruft sich selbst',
            '**Rekursion** heißt: Eine Funktion löst ein großes Problem, indem sie sich selbst für ein kleineres aufruft. Zwei Teile sind Pflicht:\n\n- **Basisfall**: die kleinste Version, die ohne Selbstaufruf beantwortet wird\n- **Rekursionsschritt**: Aufruf mit einem kleineren Problem\n\nFehlt der Basisfall, ruft sich die Funktion endlos auf, bis Python mit `RecursionError` abbricht.',
            { code: 'def fakultaet(n):\n    if n <= 1:          # Basisfall\n        return 1\n    return n * fakultaet(n - 1)\n\nprint(fakultaet(5))   # 5 * 4 * 3 * 2 * 1', console: '120' }),
          predict('Was gibt dieses Programm aus?', 'def countdown(n):\n    if n == 0:\n        print("Start")\n        return\n    print(n)\n    countdown(n - 1)\n\ncountdown(3)', '3\n2\n1\nStart'),
          mc('Was passiert, wenn der Basisfall fehlt?', ['RecursionError: die Funktion ruft sich endlos auf', 'Die Funktion gibt 0 zurück', 'Nichts', 'SyntaxError'], 0),
          predict('Was gibt dieses Programm aus?', 'def summe(liste):\n    if not liste:\n        return 0\n    return liste[0] + summe(liste[1:])\n\nprint(summe([4, 5, 6]))', '15', 'Eine leere Liste ist der Basisfall. Sonst: erstes Element plus Summe vom Rest.'),
          write('Schreib `fib(n)` rekursiv: `fib(0) = 0`, `fib(1) = 1`, sonst `fib(n - 1) + fib(n - 2)`. Gib `fib(10)` aus.',
            '',
            { expect: '55', must: [[/def\s+fib\s*\(/, 'Lege `def fib(n):` an.'], [/def\s+fib[\s\S]*fib\s*\(\s*n\s*-\s*1\s*\)/, 'Die Funktion muss sich selbst mit `fib(n - 1)` aufrufen.']], solution: 'def fib(n):\n    if n < 2:\n        return n\n    return fib(n - 1) + fib(n - 2)\n\nprint(fib(10))', explain: 'Für fib(40) wäre das schon sehr langsam, weil vieles doppelt berechnet wird. Lösung dafür: Ergebnisse merken (Memoization) oder eine Schleife.' }),
        ],
      },
      {
        id: 'py12-2',
        title: 'Rekursiv denken',
        goal: 'Rekursion auf Zahlen, Texte und verschachtelte Daten anwenden.',
        steps: [
          concept('Kleiner machen, bis es trivial ist',
            'Der Trick bei jeder Rekursion: Wie wird das Problem **einen Schritt kleiner**? Bei Zahlen oft `n // 10` (letzte Ziffer weg) oder `n - 1`, bei Texten `text[1:]`, bei verschachtelten Listen: jedes Element selbst wieder bearbeiten.',
            { code: 'def tiefe_summe(daten):\n    gesamt = 0\n    for x in daten:\n        if isinstance(x, list):\n            gesamt += tiefe_summe(x)   # Unterliste rekursiv\n        else:\n            gesamt += x\n    return gesamt\n\nprint(tiefe_summe([1, [2, 3], [4, [5]]]))', console: '15' }),
          predict('Was gibt diese Zeile aus?', 'print(9045 // 10, 9045 % 10)', '904 5', '`// 10` schneidet die letzte Ziffer ab, `% 10` liefert sie.'),
          predict('Was gibt dieses Programm aus?', 'def umdrehen(t):\n    if len(t) <= 1:\n        return t\n    return umdrehen(t[1:]) + t[0]\n\nprint(umdrehen("Bit"))', 'tiB'),
          write('Schreib `quersumme(n)` rekursiv: die Summe aller Ziffern. Gib `quersumme(9045)` und `quersumme(7)` aus.',
            '',
            { expect: '18\n7', must: [[/def\s+quersumme[\s\S]*quersumme\s*\(\s*n\s*\/\/\s*10\s*\)/, 'Ruf die Funktion rekursiv mit `n // 10` auf.']], mustNot: [[/\bstr\s*\(/, 'Löse es mit Rechnen, nicht über `str()`.']], solution: 'def quersumme(n):\n    if n < 10:\n        return n\n    return n % 10 + quersumme(n // 10)\n\nprint(quersumme(9045))\nprint(quersumme(7))' }),
        ],
      },
      {
        id: 'py12-3',
        title: 'Binäre Suche und Big-O',
        goal: 'Schnell suchen und die Geschwindigkeit von Algorithmen einschätzen.',
        steps: [
          concept('Wie schnell ist dein Code?',
            '**Big-O** beschreibt, wie die Laufzeit mit der Datenmenge n wächst:\n\n- `O(1)`: immer gleich schnell, z. B. `liste[5]`\n- `O(log n)`: binäre Suche, bei einer Million Elementen etwa 20 Schritte\n- `O(n)`: einmal alles durchgehen, lineare Suche\n- `O(n²)`: zwei verschachtelte Schleifen, z. B. Bubble Sort\n\nIn Spielen entscheidet das, ob 10 000 Objekte flüssig laufen oder das Spiel ruckelt.',
            { code: 'def binaere_suche(liste, ziel):\n    links, rechts = 0, len(liste) - 1\n    while links <= rechts:\n        mitte = (links + rechts) // 2\n        if liste[mitte] == ziel:\n            return mitte\n        if liste[mitte] < ziel:\n            links = mitte + 1\n        else:\n            rechts = mitte - 1\n    return -1' }),
          mc('Welche Voraussetzung braucht die binäre Suche?', ['Die Liste muss sortiert sein', 'Die Liste muss kurz sein', 'Nur Zahlen', 'Keine'], 0),
          mc('Zwei verschachtelte Schleifen über n Elemente. Welche Komplexität?', ['O(n²)', 'O(n)', 'O(log n)', 'O(1)'], 0, null, { codeOptions: true }),
          order('Bau den Kern der binären Suche zusammen.',
            ['while links <= rechts:', '    mitte = (links + rechts) // 2', '    if liste[mitte] == ziel:', '        return mitte', '    if liste[mitte] < ziel:', '        links = mitte + 1', '    else:', '        rechts = mitte - 1']),
          write('Schreib `binaere_suche(liste, ziel)` selbst (ohne `in` und `.index()`). Teste mit `[2, 5, 8, 12, 16, 23, 38]`: Suche 12 und 7.',
            '',
            { expect: '3\n-1', must: [[/\bwhile\b/, 'Nutze eine `while`-Schleife.'], [/\/\/\s*2/, 'Berechne die Mitte mit `// 2`.']], mustNot: [[/\.index\s*\(/, 'Ohne `.index()`.']], solution: 'def binaere_suche(liste, ziel):\n    links, rechts = 0, len(liste) - 1\n    while links <= rechts:\n        mitte = (links + rechts) // 2\n        if liste[mitte] == ziel:\n            return mitte\n        if liste[mitte] < ziel:\n            links = mitte + 1\n        else:\n            rechts = mitte - 1\n    return -1\n\nzahlen = [2, 5, 8, 12, 16, 23, 38]\nprint(binaere_suche(zahlen, 12))\nprint(binaere_suche(zahlen, 7))' }),
        ],
      },
    ],
  },

  /* ------------------------------------------------------------ 13 */
  {
    id: 'py13',
    title: 'Fortgeschrittene Funktionen',
    summary: 'Lambdas, Generatoren, *args, Closures und Dekoratoren: Werkzeuge, die Profis täglich nutzen.',
    lessons: [
      {
        id: 'py13-1',
        title: 'Lambda, map und filter',
        goal: 'Kleine Funktionen direkt an Ort und Stelle schreiben.',
        steps: [
          concept('Funktionen ohne Namen',
            'Ein **Lambda** ist eine Mini-Funktion in einer Zeile: `lambda x: x * 2`. Besonders praktisch als `key` beim Sortieren.\n\n- `sorted(liste, key=lambda s: s[1])`: sortiert nach dem zweiten Wert\n- `map(f, liste)`: wendet f auf jedes Element an\n- `filter(f, liste)`: behält nur Elemente, bei denen f wahr ist',
            { code: 'punkte = [("Ada", 120), ("Alex", 300)]\nbeste = sorted(punkte, key=lambda p: p[1], reverse=True)\nprint(beste[0][0])\nprint(list(map(lambda x: x * 2, [1, 2, 3])))', console: 'Alex\n[2, 4, 6]' }),
          predict('Was gibt diese Zeile aus?', 'print(list(filter(lambda n: n % 2 == 0, [1, 2, 3, 4, 5, 6])))', '[2, 4, 6]'),
          mc('Was liefert `(lambda a, b: a + b)(2, 3)`?', ['5', '23', 'Eine Funktion', 'Fehler'], 0, null, { codeOptions: true }),
          write('Gegeben ist eine Highscore-Liste aus Tupeln. Sortiere sie mit `sorted` und einem Lambda **absteigend nach Punkten** und gib die Namen nacheinander aus.',
            'spieler = [("Ada", 120), ("Alex", 300), ("Linus", 80)]\n',
            { expect: 'Alex\nAda\nLinus', must: [[/lambda/, 'Nutze ein `lambda` als key.'], [/sorted\s*\(|\.sort\s*\(/, 'Sortiere mit `sorted()`.']], solution: 'spieler = [("Ada", 120), ("Alex", 300), ("Linus", 80)]\nfor name, punkte in sorted(spieler, key=lambda p: p[1], reverse=True):\n    print(name)' }),
        ],
      },
      {
        id: 'py13-2',
        title: '*args und Generatoren',
        goal: 'Beliebig viele Argumente annehmen und Werte nach und nach erzeugen.',
        steps: [
          concept('Flexible Funktionen',
            '- `*args` sammelt beliebig viele Argumente in einem Tupel\n- `**kwargs` sammelt benannte Argumente in einem Dictionary\n\nEin **Generator** nutzt `yield` statt `return`. Er liefert einen Wert, pausiert, und macht beim nächsten Abruf genau dort weiter. Damit kannst du riesige oder sogar endlose Folgen erzeugen, ohne alles im Speicher zu halten.',
            { code: 'def summe(*zahlen):\n    return sum(zahlen)\n\ndef zaehle_hoch(bis):\n    n = 1\n    while n <= bis:\n        yield n\n        n += 1\n\nprint(summe(1, 2, 3, 4))\nprint(list(zaehle_hoch(3)))', console: '10\n[1, 2, 3]' }),
          predict('Was gibt dieses Programm aus?', 'def info(**werte):\n    for k, v in werte.items():\n        print(k, v)\n\ninfo(hp=80, level=3)', 'hp 80\nlevel 3'),
          mc('Was ist der Vorteil eines Generators gegenüber einer Liste?', ['Werte entstehen erst bei Bedarf, das spart Speicher', 'Er ist immer schneller zu schreiben', 'Er kann keine Fehler haben', 'Er sortiert automatisch'], 0),
          write('Schreib einen Generator `countdown(n)`, der n, n-1, ... bis 1 liefert. Gib `list(countdown(4))` aus.',
            '',
            { expect: '[4, 3, 2, 1]', must: [[/\byield\b/, 'Nutze `yield`.']], solution: 'def countdown(n):\n    while n > 0:\n        yield n\n        n -= 1\n\nprint(list(countdown(4)))' }),
        ],
      },
      {
        id: 'py13-3',
        title: 'Closures und Dekoratoren',
        goal: 'Funktionen bauen, die Funktionen verändern.',
        steps: [
          concept('Funktionen sind auch nur Werte',
            'In Python kannst du Funktionen in Variablen speichern, übergeben und zurückgeben. Eine innere Funktion merkt sich Variablen der äußeren: Das ist eine **Closure**.\n\nEin **Dekorator** ist eine Funktion, die eine andere Funktion einpackt und ihr Verhalten erweitert. Geschrieben mit `@name` über der Funktion. Frameworks wie Flask oder pytest nutzen das ständig.',
            { code: 'def protokoll(funktion):\n    def huelle(*args):\n        print(f"Aufruf {funktion.__name__}{args}")\n        return funktion(*args)\n    return huelle\n\n@protokoll\ndef plus(a, b):\n    return a + b\n\nprint(plus(2, 3))', console: 'Aufruf plus(2, 3)\n5' }),
          predict('Was gibt dieses Programm aus?', 'def multiplikator(faktor):\n    def mal(x):\n        return x * faktor\n    return mal\n\ndreifach = multiplikator(3)\nprint(dreifach(7))', '21', 'dreifach merkt sich faktor = 3. Das ist die Closure.'),
          mc('Was macht `@protokoll` über `def plus`?', ['Es ersetzt plus durch protokoll(plus)', 'Es kommentiert die Funktion aus', 'Es macht plus privat', 'Es ruft plus sofort auf'], 0),
          write('Schreib einen Dekorator `laut`, der das Ergebnis der eingepackten Funktion in Großbuchstaben zurückgibt. Dekoriere damit `gruss(name)`, die `f"hallo {name}"` zurückgibt, und gib `gruss("tom")` aus.',
            '',
            { expect: 'HALLO TOM', must: [[/def\s+laut\s*\(/, 'Lege `def laut(funktion):` an.'], [/@laut/, 'Dekoriere mit `@laut`.'], [/\.upper\s*\(/, 'Nutze `.upper()`.']], solution: 'def laut(funktion):\n    def huelle(*args):\n        return funktion(*args).upper()\n    return huelle\n\n@laut\ndef gruss(name):\n    return f"hallo {name}"\n\nprint(gruss("tom"))' }),
        ],
      },
    ],
  },

  /* ------------------------------------------------------------ 14 */
  {
    id: 'py14',
    title: 'Saubere Programme',
    summary: 'Eigene Fehler, JSON, Typ-Hinweise und Tests: So sieht Code aus, den man in Teams und Firmen schreibt.',
    lessons: [
      {
        id: 'py14-1',
        title: 'Eigene Fehler werfen',
        goal: 'Mit raise und eigenen Exception-Klassen arbeiten.',
        steps: [
          concept('raise',
            'Bisher hast du Fehler nur abgefangen. Mit `raise` **wirfst** du selbst einen, wenn etwas Unerlaubtes passiert. Wer die Funktion aufruft, entscheidet mit `try/except`, was dann geschieht.\n\nEigene Fehlerarten baust du als Klasse, die von `Exception` erbt.',
            { code: 'class ZuWenigGold(Exception):\n    pass\n\ndef kaufen(gold, preis):\n    if preis > gold:\n        raise ZuWenigGold(f"Es fehlen {preis - gold} Gold")\n    return gold - preis\n\ntry:\n    kaufen(30, 50)\nexcept ZuWenigGold as fehler:\n    print(fehler)', console: 'Es fehlen 20 Gold' }),
          predict('Was gibt dieses Programm aus?', 'def pruefe(alter):\n    if alter < 0:\n        raise ValueError("ungültig")\n    return "ok"\n\ntry:\n    print(pruefe(-3))\nexcept ValueError as e:\n    print("Fehler:", e)', 'Fehler: ungültig'),
          mc('Warum lohnen sich eigene Exception-Klassen?', ['Man kann gezielt genau diese Fehlerart abfangen', 'Sie machen das Programm schneller', 'Python verlangt das', 'Damit es keine Fehler mehr gibt'], 0),
          write('Schreib `abheben(stand, betrag)`: Ist der Betrag größer als der Stand, wirf einen `ValueError` mit dem Text `Nicht genug Geld`, sonst gib den neuen Stand zurück. Ruf `abheben(100, 30)` auf und gib das Ergebnis aus, danach `abheben(100, 500)` in einem `try` und gib die Fehlermeldung aus.',
            '',
            { expect: '70\nNicht genug Geld', must: [[/raise\s+ValueError/, 'Wirf den Fehler mit `raise ValueError(...)`.'], [/except\s+ValueError/, 'Fang ihn mit `except ValueError` ab.']], solution: 'def abheben(stand, betrag):\n    if betrag > stand:\n        raise ValueError("Nicht genug Geld")\n    return stand - betrag\n\nprint(abheben(100, 30))\ntry:\n    abheben(100, 500)\nexcept ValueError as e:\n    print(e)' }),
        ],
      },
      {
        id: 'py14-2',
        title: 'JSON und Typ-Hinweise',
        goal: 'Daten im Standardformat speichern und Code selbsterklärend machen.',
        steps: [
          concept('Daten austauschen',
            '**JSON** ist das Standardformat für Daten zwischen Programmen, Webseiten und Spielen. Es sieht aus wie ein Python-Dictionary. Das Modul `json` übersetzt hin und her:\n\n- `json.dump(daten, datei)` und `json.load(datei)`: in Dateien\n- `json.dumps(daten)` und `json.loads(text)`: als Text\n\n**Typ-Hinweise** wie `def heilen(hp: int) -> int:` ändern nichts am Ablauf, machen Code aber lesbarer, und Editoren wie VS Code finden damit Fehler, bevor du startest.',
            { code: 'import json\n\nstand: dict = {"name": "Alex", "level": 3, "items": ["Schwert"]}\nwith open("spielstand.json", "w") as f:\n    json.dump(stand, f)\n\nwith open("spielstand.json") as f:\n    geladen = json.load(f)\nprint(geladen["items"][0])', console: 'Schwert' }),
          predict('Was gibt diese Zeile aus?', 'import json\nprint(json.dumps({"hp": 80}))', '{"hp": 80}', 'JSON nutzt immer doppelte Anführungszeichen.'),
          mc('Was passiert bei `def f(x: int) -> int: return x` und dem Aufruf `f("Text")`?', ['Es läuft trotzdem, Typ-Hinweise werden nicht erzwungen', 'TypeError', 'SyntaxError', 'Der Text wird in eine Zahl umgewandelt'], 0,
            'Python prüft Typ-Hinweise nicht beim Ausführen. Werkzeuge wie mypy oder VS Code warnen dich aber vorher.'),
          write('Speichere `{"name": "Alex", "level": 3}` mit `json.dump` in `stand.json`, lade die Datei mit `json.load` und gib `Alex 3` aus (Name und Level aus den geladenen Daten).',
            'import json\n\n',
            { expect: 'Alex 3', must: [[/json\.dump\s*\(/, 'Speichere mit `json.dump`.'], [/json\.load\s*\(/, 'Lade mit `json.load`.']], solution: 'import json\n\nwith open("stand.json", "w") as f:\n    json.dump({"name": "Alex", "level": 3}, f)\n\nwith open("stand.json") as f:\n    daten = json.load(f)\nprint(daten["name"], daten["level"])' }),
        ],
      },
      {
        id: 'py14-3',
        title: 'Testen',
        goal: 'Eigenen Code automatisch prüfen.',
        steps: [
          concept('Code, der Code prüft',
            'Profis schreiben **Tests**: kleine Programme, die prüfen, ob Funktionen das Richtige liefern. Ändert man später etwas, zeigen die Tests sofort, ob noch alles funktioniert.\n\nDas einfachste Werkzeug ist `assert bedingung, "Meldung"`: Ist die Bedingung falsch, bricht das Programm mit einem `AssertionError` ab. Größere Projekte nutzen **pytest**, das genau so funktioniert.\n\nÜbrigens: Genau so prüft Laufzeit deine Aufgaben.',
            { code: 'def doppelt(x):\n    return x * 2\n\ndef test_doppelt():\n    assert doppelt(2) == 4\n    assert doppelt(0) == 0\n    assert doppelt(-3) == -6, "negative Zahlen"\n\ntest_doppelt()\nprint("Alle Tests bestanden")', console: 'Alle Tests bestanden' }),
          mc('Was passiert bei `assert 1 + 1 == 3, "Mathe kaputt"`?', ['AssertionError: Mathe kaputt', 'Es erscheint False', 'Nichts', 'SyntaxError'], 0),
          mc('Welche Testfälle sind für eine Funktion `ist_volljaehrig(alter)` am wichtigsten?', ['17, 18 und 19, also genau an der Grenze', '1, 50 und 100', 'Nur 18', 'Nur sehr große Zahlen'], 0, 'Fehler passieren fast immer an Grenzen: >= statt >.'),
          write('Schreib `ist_palindrom(text)`, die Groß-/Kleinschreibung ignoriert. Schreib dann eine Funktion `test()` mit mindestens drei `assert`-Zeilen (z. B. "Anna", "Otto", "Alex"), ruf sie auf und gib danach `Alle Tests bestanden` aus.',
            '',
            { expect: 'Alle Tests bestanden', must: [[/def\s+ist_palindrom\s*\(/, 'Lege `def ist_palindrom(text):` an.'], [/assert[\s\S]*assert[\s\S]*assert/, 'Schreib mindestens drei `assert`-Zeilen.'], [/\.lower\s*\(|\.upper\s*\(|\.casefold\s*\(/, 'Ignoriere Groß-/Kleinschreibung mit `.lower()`.']], solution: 'def ist_palindrom(text):\n    t = text.lower()\n    return t == t[::-1]\n\ndef test():\n    assert ist_palindrom("Anna")\n    assert ist_palindrom("Otto")\n    assert not ist_palindrom("Alex")\n\ntest()\nprint("Alle Tests bestanden")', explain: '`t[::-1]` dreht einen Text um. Slicing mit Schrittweite -1.' }),
        ],
      },
    ],
  },

  /* ------------------------------------------------------------ 15 */
  {
    id: 'py15',
    title: 'Datenstrukturen und Effizienz',
    summary: 'Stack, Queue, Graphen und Breitensuche, dazu Dataclasses. Das Werkzeug für Spiele-KI und Bewerbungsgespräche.',
    lessons: [
      {
        id: 'py15-1',
        title: 'Stack und Queue',
        goal: 'Die zwei wichtigsten Datenstrukturen nach der Liste.',
        steps: [
          concept('Stapel und Schlange',
            '- **Stack** (Stapel): Das Letzte, was du drauflegst, nimmst du zuerst runter. In Python: `append()` und `pop()`. Beispiele: Rückgängig-Funktion, Klammern prüfen\n- **Queue** (Warteschlange): Wer zuerst kommt, ist zuerst dran. Nimm `collections.deque` mit `append()` und `popleft()`, das ist O(1). Beispiele: Spielzüge, Breitensuche',
            { code: 'from collections import deque\n\nstapel = [1, 2, 3]\nprint(stapel.pop())\n\nschlange = deque(["Ada", "Alex"])\nschlange.append("Linus")\nprint(schlange.popleft())', console: '3\nAda' }),
          predict('Was gibt dieses Programm aus?', 'rueckgaengig = []\nfor aktion in ["laufen", "springen", "schiessen"]:\n    rueckgaengig.append(aktion)\nprint(rueckgaengig.pop())\nprint(rueckgaengig.pop())', 'schiessen\nspringen'),
          mc('Warum `deque.popleft()` statt `liste.pop(0)`?', ['pop(0) muss alle anderen Elemente verschieben, popleft ist O(1)', 'pop(0) gibt es nicht', 'deque sortiert automatisch', 'Es gibt keinen Unterschied'], 0),
          write('Schreib `klammern_ok(text)` mit einem Stack: `True`, wenn alle `()`, `[]` und `{}` korrekt geschlossen sind. Gib das Ergebnis für `"(a[b]{c})"` und für `"(]"` aus.',
            '',
            { expect: 'True\nFalse', must: [[/def\s+klammern_ok\s*\(/, 'Lege `def klammern_ok(text):` an.'], [/\.pop\s*\(/, 'Nimm Elemente mit `.pop()` vom Stack.']], solution: 'def klammern_ok(text):\n    paare = {")": "(", "]": "[", "}": "{"}\n    stapel = []\n    for z in text:\n        if z in "([{":\n            stapel.append(z)\n        elif z in paare:\n            if not stapel or stapel.pop() != paare[z]:\n                return False\n    return not stapel\n\nprint(klammern_ok("(a[b]{c})"))\nprint(klammern_ok("(]"))' }),
        ],
      },
      {
        id: 'py15-2',
        title: 'Graphen und Breitensuche',
        goal: 'Den kürzesten Weg zwischen zwei Orten finden.',
        steps: [
          concept('Orte und Verbindungen',
            'Ein **Graph** besteht aus Knoten (Räume, Städte, Felder) und Kanten (Verbindungen). In Python speichert man ihn meist als Dictionary: Knoten zeigt auf Liste der Nachbarn.\n\nDie **Breitensuche (BFS)** findet den kürzesten Weg in Schritten: Sie arbeitet mit einer Queue und besucht erst alle Nachbarn, dann deren Nachbarn und so weiter. Genau so suchen Gegner in vielen Spielen den Weg zum Spieler.',
            { code: 'from collections import deque\n\nkarte = {\n    "Halle": ["Kueche", "Turm"],\n    "Kueche": ["Halle", "Keller"],\n    "Turm": ["Halle"],\n    "Keller": ["Kueche"],\n}\n\ndef schritte(start, ziel):\n    besucht = {start: 0}\n    schlange = deque([start])\n    while schlange:\n        raum = schlange.popleft()\n        if raum == ziel:\n            return besucht[raum]\n        for nachbar in karte[raum]:\n            if nachbar not in besucht:\n                besucht[nachbar] = besucht[raum] + 1\n                schlange.append(nachbar)\n    return -1\n\nprint(schritte("Turm", "Keller"))', console: '3' }),
          mc('Warum merkt sich die BFS besuchte Knoten?', ['Sonst läuft sie im Kreis', 'Damit sie schneller tippt', 'Für die Grafik', 'Das ist unnötig'], 0),
          mc('Welche Datenstruktur nutzt die Breitensuche?', ['Queue', 'Stack', 'Set allein', 'Tupel'], 0, 'Mit einem Stack statt einer Queue wird daraus die Tiefensuche (DFS). Die findet einen Weg, aber nicht unbedingt den kürzesten.'),
          write('Ergänze `schritte(start, ziel)` als Breitensuche für die gegebene Karte. Gib die Anzahl Schritte von `"A"` nach `"E"` aus und von `"A"` nach `"X"` (gibt es nicht, also -1).',
            'from collections import deque\n\nkarte = {\n    "A": ["B", "C"],\n    "B": ["A", "D"],\n    "C": ["A", "D"],\n    "D": ["B", "C", "E"],\n    "E": ["D"],\n    "X": [],\n}\n\n',
            { expect: '3\n-1', must: [[/deque/, 'Nutze eine `deque` als Queue.'], [/popleft\s*\(/, 'Hol den nächsten Knoten mit `popleft()`.']], solution: 'from collections import deque\n\nkarte = {\n    "A": ["B", "C"],\n    "B": ["A", "D"],\n    "C": ["A", "D"],\n    "D": ["B", "C", "E"],\n    "E": ["D"],\n    "X": [],\n}\n\ndef schritte(start, ziel):\n    besucht = {start: 0}\n    schlange = deque([start])\n    while schlange:\n        knoten = schlange.popleft()\n        if knoten == ziel:\n            return besucht[knoten]\n        for n in karte[knoten]:\n            if n not in besucht:\n                besucht[n] = besucht[knoten] + 1\n                schlange.append(n)\n    return -1\n\nprint(schritte("A", "E"))\nprint(schritte("A", "X"))' }),
        ],
      },
      {
        id: 'py15-3',
        title: 'Dataclasses und schöne Objekte',
        goal: 'Klassen mit wenig Code und guter Ausgabe schreiben.',
        steps: [
          concept('@dataclass',
            'Für Klassen, die vor allem Daten halten, gibt es `@dataclass` aus dem Modul `dataclasses`. Konstruktor, Vergleich und Ausgabe entstehen automatisch.\n\nMit `__str__` bestimmst du, wie ein Objekt bei `print()` aussieht. Methoden mit doppelten Unterstrichen heißen **Dunder-Methoden**. Sie verbinden deine Klassen mit Python selbst, z. B. `__len__` für `len()` oder `__lt__` für `<`.',
            { code: 'from dataclasses import dataclass\n\n@dataclass\nclass Item:\n    name: str\n    preis: int\n\n    def __str__(self):\n        return f"{self.name} ({self.preis} Gold)"\n\na = Item("Trank", 5)\nprint(a)\nprint(a == Item("Trank", 5))', console: 'Trank (5 Gold)\nTrue' }),
          mc('Was erzeugt `@dataclass` automatisch?', ['Konstruktor, Vergleich mit == und eine lesbare Darstellung', 'Eine Datenbank', 'Eine Datei', 'Nur Kommentare'], 0),
          predict('Was gibt dieses Programm aus?', 'class Team:\n    def __init__(self, namen):\n        self.namen = namen\n    def __len__(self):\n        return len(self.namen)\n\nprint(len(Team(["Ada", "Alex", "Bit"])))', '3'),
          write('Lege mit `@dataclass` eine Klasse `Item` mit `name` und `preis` an. Gib eine `__str__`-Methode dazu, die `Schwert (40 Gold)` liefert. Erzeuge eine Liste aus `Item("Schwert", 40)` und `Item("Trank", 5)`, sortiere sie mit einem Lambda nach Preis aufsteigend und gib jedes Item aus.',
            'from dataclasses import dataclass\n\n',
            { expect: 'Trank (5 Gold)\nSchwert (40 Gold)', must: [[/@dataclass/, 'Nutze `@dataclass`.'], [/def\s+__str__\s*\(\s*self/, 'Lege `__str__(self)` an.']], solution: 'from dataclasses import dataclass\n\n@dataclass\nclass Item:\n    name: str\n    preis: int\n\n    def __str__(self):\n        return f"{self.name} ({self.preis} Gold)"\n\nladen = [Item("Schwert", 40), Item("Trank", 5)]\nfor item in sorted(laden, key=lambda i: i.preis):\n    print(item)', explain: 'Damit ist der Python-Kurs komplett. Jetzt heißt es: Projekte und freie Aufgaben.' }),
        ],
      },
    ],
  },
];
