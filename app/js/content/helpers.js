// Kurzschreibweisen fuer Lektionsinhalte.
// Neue Lektion = neues Objekt in python.js oder cpp.js. Mehr ist nicht noetig.
//
// Uebungstypen:
//   concept  Erklaerung mit optionalem Code, Konsolen-Ausgabe, Speicherbild, Ablauf oder Vergleich
//   mc       Multiple Choice (Antworten werden automatisch gemischt)
//   predict  "Was wird ausgegeben?" Der Lernende tippt die Ausgabe
//   fill     Lueckentext im Code: Luecken sind ⟦0⟧, ⟦1⟧ ... mit Wortbank oder freier Eingabe
//   order    Zeilen in die richtige Reihenfolge bringen (Parsons-Aufgabe)
//   fix      Fehlerhaften Code reparieren, wird echt ausgefuehrt
//   write    Selbst schreiben, wird echt ausgefuehrt

/** Erklaerkarte. more: { code, console, after, memory, flow, loop, compare } */
export const concept = (title, body, more = {}) => ({ type: 'concept', title, body, ...more });

/** Multiple Choice. answer = Index der richtigen Option. more: { code, codeOptions } */
export const mc = (prompt, options, answer, explain, more = {}) => ({ type: 'mc', prompt, options, answer, explain, ...more });

/** Ausgabe vorhersagen. answer: String oder Liste erlaubter Varianten */
export const predict = (prompt, code, answer, explain) => ({ type: 'predict', prompt, code, answer, explain });

/** Lueckentext. gaps: je Luecke eine Antwort oder Liste erlaubter Antworten. bank: Wortbank oder null fuer freie Eingabe */
export const fill = (prompt, code, gaps, bank, explain) => ({ type: 'fill', prompt, code, gaps, bank, explain });

/** Reihenfolge. lines: korrekte Reihenfolge (Einrueckung zaehlt). distractors: falsche Zusatzzeilen */
export const order = (prompt, lines, explain, distractors = []) => ({ type: 'order', prompt, lines, explain, distractors });

/**
 * Code reparieren bzw. selbst schreiben.
 * check: { expect, stdin, must: [[RegExp, Hinweis]], mustNot, solution, explain, run }
 */
export const fix = (prompt, code, check) => ({ type: 'fix', prompt, code, ...check });
export const write = (prompt, code, check) => ({ type: 'write', prompt, code, ...check });

/** Ein vollstaendiges C++-Programm um einen Rumpf bauen */
export function cppMain(body = '', includes = ['iostream']) {
  const head = includes.map(i => `#include <${i}>`).join('\n');
  const inner = body
    ? body.split('\n').map(l => (l ? '    ' + l : l)).join('\n')
    : '    ';
  return `${head}\n\nint main() {\n${inner}\n    return 0;\n}`;
}

/** C++-Programm mit Code vor main (Funktionen, Klassen) */
export function cppFile(top, body = '', includes = ['iostream']) {
  const head = includes.map(i => `#include <${i}>`).join('\n');
  const inner = body
    ? body.split('\n').map(l => (l ? '    ' + l : l)).join('\n')
    : '    ';
  return `${head}\n\n${top.trim()}\n\nint main() {\n${inner}\n    return 0;\n}`;
}
