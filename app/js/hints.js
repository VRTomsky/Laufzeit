// Uebersetzt typische Fehlermeldungen in verstaendliche Hinweise (Deutsch oder Englisch).
// Die erste passende Regel gewinnt, darum stehen spezielle Regeln vor allgemeinen.

import { t } from './i18n.js';

const PYTHON = [
  [/IndentationError: expected an indented block/, t('Nach einer Zeile mit `:` (if, for, while, def ...) muss der nächste Block eingerückt sein. Setze 4 Leerzeichen an den Zeilenanfang.', 'After a line ending in `:` (if, for, while, def ...) the next block must be indented. Put 4 spaces at the start of the line.')],
  [/IndentationError|TabError/, t('Die Einrückung stimmt nicht. Python erkennt Blöcke an den Leerzeichen am Zeilenanfang. Alles, was zusammengehört, braucht genau dieselbe Einrückung.', 'The indentation is wrong. Python recognises blocks by the spaces at the start of a line. Everything that belongs together needs exactly the same indentation.')],
  [/unterminated string|EOL while scanning/, t('Ein Text (String) wurde nicht geschlossen. Zu jedem `"` gehört ein zweites `"` am Ende des Textes.', 'A text (string) was not closed. Every `"` needs a second `"` at the end of the text.')],
  [/'\(' was never closed|unexpected EOF while parsing/, t('Eine Klammer ist offen geblieben. Zähle nach: Zu jeder `(` gehört eine `)`.', 'A bracket was left open. Count them: every `(` needs a `)`.')],
  [/expected ':'/, t('Am Ende der Zeile fehlt ein Doppelpunkt `:`. Den brauchen if, elif, else, for, while und def.', 'A colon `:` is missing at the end of the line. if, elif, else, for, while and def need it.')],
  [/Missing parentheses in call to 'print'/, t('In Python 3 braucht print Klammern: `print("Text")`.', 'In Python 3, print needs brackets: `print("Text")`.')],
  [/invalid syntax\. Maybe you meant '==' or ':=' instead of '='/, t('In einer Bedingung vergleichst du mit `==`. Ein einzelnes `=` speichert nur einen Wert.', 'In a condition you compare with `==`. A single `=` only stores a value.')],
  [/NameError: name '(\w+)' is not defined/, t('Python kennt den Namen `$1` nicht. Prüfe Tippfehler und Groß-/Kleinschreibung. Ist es ein Text, fehlen Anführungszeichen. Ist es eine Variable, muss sie vorher angelegt werden.', 'Python doesn\'t know the name `$1`. Check for typos and upper/lower case. If it\'s text, quotes are missing. If it\'s a variable, it has to be created first.')],
  [/can only concatenate str \(not "int"\)|can only concatenate str/, t('Du verbindest Text und Zahl mit `+`. Das geht nicht direkt: Wandle die Zahl mit `str()` um oder nutze einen f-String.', 'You\'re joining text and a number with `+`. That doesn\'t work directly: convert the number with `str()` or use an f-string.')],
  [/unsupported operand type\(s\) for [+\-*/]+: 'str' and 'int'|unsupported operand type\(s\) for [+\-*/]+: 'int' and 'str'/, t('Text und Zahl passen hier nicht zusammen. `input()` liefert immer Text: Wandle ihn mit `int()` in eine Zahl um, bevor du rechnest.', 'Text and number don\'t fit together here. `input()` always returns text: convert it to a number with `int()` before calculating.')],
  [/'[<>]=?' not supported between instances of 'str' and 'int'/, t('Du vergleichst Text mit einer Zahl. `input()` liefert Text, also zuerst mit `int()` umwandeln.', 'You\'re comparing text with a number. `input()` returns text, so convert it with `int()` first.')],
  [/invalid literal for int\(\) with base 10/, t('`int()` hat einen Text bekommen, der keine ganze Zahl ist.', '`int()` got a text that isn\'t a whole number.')],
  [/ZeroDivisionError/, t('Durch 0 teilen ist nicht erlaubt. Prüfe den Wert vor der Division.', 'Dividing by 0 is not allowed. Check the value before dividing.')],
  [/IndexError/, t('Du greifst auf eine Position zu, die es nicht gibt. Die Zählung beginnt bei 0, das letzte Element hat also die Nummer Länge minus 1.', 'You\'re accessing a position that doesn\'t exist. Counting starts at 0, so the last element has the number length minus 1.')],
  [/KeyError/, t('Diesen Schlüssel gibt es im Dictionary nicht.', 'This key doesn\'t exist in the dictionary.')],
  [/EOFError/, t('Dein Programm ruft öfter `input()` auf, als es Eingaben gibt.', 'Your program calls `input()` more often than there are inputs.')],
  [/TypeError: '(\w+)' object is not callable/, t('Du rufst `$1` mit Klammern auf, obwohl es keine Funktion ist. Hast du einen Funktionsnamen als Variable überschrieben?', 'You\'re calling `$1` with brackets although it isn\'t a function. Did you overwrite a function name with a variable?')],
  [/SyntaxError/, t('Python versteht diese Zeile nicht. Schau auf die markierte Stelle: Oft fehlt ein Zeichen, eine Klammer oder ein Wort ist falsch geschrieben.', 'Python doesn\'t understand this line. Look at the marked spot: often a character or bracket is missing, or a word is misspelled.')],
];

const CPP = [
  [/'(?:std::)?cout'.*(?:undeclared|not declared)|cout.*C2065|C2039: 'cout'/, t('Für `std::cout` brauchst du ganz oben `#include <iostream>`. Achte auch auf das `std::` davor.', 'For `std::cout` you need `#include <iostream>` at the very top. Also watch the `std::` in front.')],
  [/'(?:std::)?cin'.*(?:undeclared|not declared)|cin.*C2065/, t('Für `std::cin` brauchst du `#include <iostream>` und das `std::` davor.', 'For `std::cin` you need `#include <iostream>` and the `std::` in front.')],
  [/'string'.*(?:undeclared|not declared|not a member)|string.*C2065/, t('Für `std::string` brauchst du `#include <string>` und das `std::` davor.', 'For `std::string` you need `#include <string>` and the `std::` in front.')],
  [/expected ';'|C2143|C2146/, t('Es fehlt ein Semikolon `;`. In C++ endet fast jede Anweisung damit. Der Compiler meldet den Fehler oft erst in der Zeile **danach**, schau also auch eine Zeile höher.', 'A semicolon `;` is missing. In C++ almost every statement ends with one. The compiler often reports the error on the line **after**, so also look one line up.')],
  [/C1075|expected '}' at end of input/, t('Eine geschweifte Klammer `}` fehlt. Zu jeder `{` gehört eine `}`.', 'A curly brace `}` is missing. Every `{` needs a `}`.')],
  [/C2001|missing terminating " character|newline in constant/, t('Ein Text wurde nicht mit `"` geschlossen.', 'A text was not closed with `"`.')],
  [/undeclared identifier|was not declared in this scope|C2065|C3861/, t('Diesen Namen kennt der Compiler nicht. Tippfehler? Groß-/Kleinschreibung? Variable vergessen zu deklarieren? Oder fehlt `std::` davor?', 'The compiler doesn\'t know this name. A typo? Upper/lower case? Forgot to declare the variable? Or is `std::` missing in front?')],
  [/C2440|C2664|cannot convert|invalid conversion/, t('Die Typen passen nicht zusammen, z. B. Text in einen `int`. In C++ hat jede Variable einen festen Typ.', 'The types don\'t match, e.g. text into an `int`. In C++ every variable has a fixed type.')],
  [/C2059|expected primary-expression|expected '\('/, t('Der Compiler stolpert über die Schreibweise. Häufig: Python-Stil benutzt. In C++ stehen Bedingungen in `( )`, Blöcke in `{ }`, und es gibt keinen Doppelpunkt nach if.', 'The compiler trips over the syntax. Common cause: Python style. In C++ conditions go in `( )`, blocks in `{ }`, and there is no colon after if.')],
  [/C2374|C2086|redefinition|redeclared/, t('Ein Name wurde zweimal angelegt. Eine Variable deklarierst du nur einmal mit Typ, danach benutzt du sie ohne Typ.', 'A name was created twice. You declare a variable only once with its type, after that you use it without the type.')],
  [/C2679|C2678|no match for 'operator(<<|>>)'/, t('Dieser Wert lässt sich so nicht mit `<<` oder `>>` verarbeiten. Prüfe die Pfeilrichtung: `cout <<` und `cin >>`.', 'This value can\'t be handled with `<<` or `>>` like this. Check the arrow direction: `cout <<` and `cin >>`.')],
  [/LNK2019.*main|LNK1120|undefined reference to `?WinMain|undefined reference to `?main/, t('Es gibt keine Funktion `int main()`. Jedes Programm braucht genau einen Startpunkt `main`.', 'There is no function `int main()`. Every program needs exactly one starting point `main`.')],
  [/C4700|is used uninitialized|uninitialized local variable/, t('Du benutzt eine Variable, der noch kein Wert zugewiesen wurde. Gib ihr beim Anlegen einen Startwert, z. B. `int x = 0;`.', 'You\'re using a variable that has no value yet. Give it a start value when you create it, e.g. `int x = 0;`.')],
  [/error/, t('Der Compiler hat Fehler gefunden. Lies die **erste** Meldung zuerst: Ein einziger Fehler kann viele Folgefehler auslösen.', 'The compiler found errors. Read the **first** message first: a single error can cause many follow-up errors.')],
];

/** Liefert einen Hinweis zur ersten passenden Fehlermeldung */
export function explainError(text, lang) {
  if (!text) return null;
  for (const [re, hint] of lang === 'cpp' ? CPP : PYTHON) {
    const m = text.match(re);
    if (m) return hint.replace('$1', m[1] || '');
  }
  return null;
}

/** Findet die Zeilennummer im Fehlertext (main.py / main.cpp) */
export function errorLine(text, lang) {
  if (!text) return null;
  const re = lang === 'cpp'
    ? /main\.cpp(?:\((\d+)\)|:(\d+):)/
    : /File "main\.py", line (\d+)(?![\s\S]*File "main\.py", line \d+)/;
  const m = text.match(re);
  if (!m) return null;
  return Number(m[1] || m[2]) || null;
}

/** Laufzeitprobleme, die keine Fehlermeldung haben */
export const TIMEOUT_HINT = t('Das Programm wurde nach 5 Sekunden gestoppt. Vermutlich eine **Endlosschleife**: Prüfe, ob sich die Bedingung deiner Schleife irgendwann ändert, oder ob das Programm auf eine Eingabe wartet.', 'The program was stopped after 5 seconds. Probably an **infinite loop**: check whether your loop condition ever changes, or whether the program is waiting for input.');
