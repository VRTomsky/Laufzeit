// Uebersetzt typische Fehlermeldungen in verstaendliche Hinweise auf Deutsch.
// Die erste passende Regel gewinnt, darum stehen spezielle Regeln vor allgemeinen.

const PYTHON = [
  [/IndentationError: expected an indented block/, 'Nach einer Zeile mit `:` (if, for, while, def ...) muss der nächste Block eingerückt sein. Setze 4 Leerzeichen an den Zeilenanfang.'],
  [/IndentationError|TabError/, 'Die Einrückung stimmt nicht. Python erkennt Blöcke an den Leerzeichen am Zeilenanfang. Alles, was zusammengehört, braucht genau dieselbe Einrückung.'],
  [/unterminated string|EOL while scanning/, 'Ein Text (String) wurde nicht geschlossen. Zu jedem `"` gehört ein zweites `"` am Ende des Textes.'],
  [/'\(' was never closed|unexpected EOF while parsing/, 'Eine Klammer ist offen geblieben. Zähle nach: Zu jeder `(` gehört eine `)`.'],
  [/expected ':'/, 'Am Ende der Zeile fehlt ein Doppelpunkt `:`. Den brauchen if, elif, else, for, while und def.'],
  [/Missing parentheses in call to 'print'/, 'In Python 3 braucht print Klammern: `print("Text")`.'],
  [/invalid syntax\. Maybe you meant '==' or ':=' instead of '='/, 'In einer Bedingung vergleichst du mit `==`. Ein einzelnes `=` speichert nur einen Wert.'],
  [/NameError: name '(\w+)' is not defined/, 'Python kennt den Namen `$1` nicht. Prüfe Tippfehler und Groß-/Kleinschreibung. Ist es ein Text, fehlen Anführungszeichen. Ist es eine Variable, muss sie vorher angelegt werden.'],
  [/can only concatenate str \(not "int"\)|can only concatenate str/, 'Du verbindest Text und Zahl mit `+`. Das geht nicht direkt: Wandle die Zahl mit `str()` um oder nutze einen f-String.'],
  [/unsupported operand type\(s\) for [+\-*/]+: 'str' and 'int'|unsupported operand type\(s\) for [+\-*/]+: 'int' and 'str'/, 'Text und Zahl passen hier nicht zusammen. `input()` liefert immer Text: Wandle ihn mit `int()` in eine Zahl um, bevor du rechnest.'],
  [/'[<>]=?' not supported between instances of 'str' and 'int'/, 'Du vergleichst Text mit einer Zahl. `input()` liefert Text, also zuerst mit `int()` umwandeln.'],
  [/invalid literal for int\(\) with base 10/, '`int()` hat einen Text bekommen, der keine ganze Zahl ist.'],
  [/ZeroDivisionError/, 'Durch 0 teilen ist nicht erlaubt. Prüfe den Wert vor der Division.'],
  [/IndexError/, 'Du greifst auf eine Position zu, die es nicht gibt. Die Zählung beginnt bei 0, das letzte Element hat also die Nummer Länge minus 1.'],
  [/KeyError/, 'Diesen Schlüssel gibt es im Dictionary nicht.'],
  [/EOFError/, 'Dein Programm ruft öfter `input()` auf, als es Eingaben gibt.'],
  [/TypeError: '(\w+)' object is not callable/, 'Du rufst `$1` mit Klammern auf, obwohl es keine Funktion ist. Hast du einen Funktionsnamen als Variable überschrieben?'],
  [/SyntaxError/, 'Python versteht diese Zeile nicht. Schau auf die markierte Stelle: Oft fehlt ein Zeichen, eine Klammer oder ein Wort ist falsch geschrieben.'],
];

const CPP = [
  [/'(?:std::)?cout'.*(?:undeclared|not declared)|cout.*C2065|C2039: 'cout'/, 'Für `std::cout` brauchst du ganz oben `#include <iostream>`. Achte auch auf das `std::` davor.'],
  [/'(?:std::)?cin'.*(?:undeclared|not declared)|cin.*C2065/, 'Für `std::cin` brauchst du `#include <iostream>` und das `std::` davor.'],
  [/'string'.*(?:undeclared|not declared|not a member)|string.*C2065/, 'Für `std::string` brauchst du `#include <string>` und das `std::` davor.'],
  [/expected ';'|C2143|C2146/, 'Es fehlt ein Semikolon `;`. In C++ endet fast jede Anweisung damit. Der Compiler meldet den Fehler oft erst in der Zeile **danach**, schau also auch eine Zeile höher.'],
  [/C1075|expected '}' at end of input/, 'Eine geschweifte Klammer `}` fehlt. Zu jeder `{` gehört eine `}`.'],
  [/C2001|missing terminating " character|newline in constant/, 'Ein Text wurde nicht mit `"` geschlossen.'],
  [/undeclared identifier|was not declared in this scope|C2065|C3861/, 'Diesen Namen kennt der Compiler nicht. Tippfehler? Groß-/Kleinschreibung? Variable vergessen zu deklarieren? Oder fehlt `std::` davor?'],
  [/C2440|C2664|cannot convert|invalid conversion/, 'Die Typen passen nicht zusammen, z. B. Text in einen `int`. In C++ hat jede Variable einen festen Typ.'],
  [/C2059|expected primary-expression|expected '\('/, 'Der Compiler stolpert über die Schreibweise. Häufig: Python-Stil benutzt. In C++ stehen Bedingungen in `( )`, Blöcke in `{ }`, und es gibt keinen Doppelpunkt nach if.'],
  [/C2374|C2086|redefinition|redeclared/, 'Ein Name wurde zweimal angelegt. Eine Variable deklarierst du nur einmal mit Typ, danach benutzt du sie ohne Typ.'],
  [/C2679|C2678|no match for 'operator(<<|>>)'/, 'Dieser Wert lässt sich so nicht mit `<<` oder `>>` verarbeiten. Prüfe die Pfeilrichtung: `cout <<` und `cin >>`.'],
  [/LNK2019.*main|LNK1120|undefined reference to `?WinMain|undefined reference to `?main/, 'Es gibt keine Funktion `int main()`. Jedes Programm braucht genau einen Startpunkt `main`.'],
  [/C4700|is used uninitialized|uninitialized local variable/, 'Du benutzt eine Variable, der noch kein Wert zugewiesen wurde. Gib ihr beim Anlegen einen Startwert, z. B. `int x = 0;`.'],
  [/error/, 'Der Compiler hat Fehler gefunden. Lies die **erste** Meldung zuerst: Ein einziger Fehler kann viele Folgefehler auslösen.'],
];

/** Liefert einen deutschen Hinweis zur ersten passenden Fehlermeldung */
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
export const TIMEOUT_HINT = 'Das Programm wurde nach 5 Sekunden gestoppt. Vermutlich eine **Endlosschleife**: Prüfe, ob sich die Bedingung deiner Schleife irgendwann ändert, oder ob das Programm auf eine Eingabe wartet.';
