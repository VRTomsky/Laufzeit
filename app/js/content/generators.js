// Aufgaben-Generator: erzeugt bei jedem Durchlauf neue Varianten (andere Zahlen, Namen, Grenzen).
// Jeder Generator: (r, lang, hard) => Schritt. r ist ein Zufallsgenerator, hard die Gold-Stufe.
// _verify: { code, stdin, expect } erlaubt automatische Tests (wird in der App nicht angezeigt).

import { cppMain, cppFile } from './helpers.js';

/* ---------------------------------------------------------------- Zufall */

export function makeRng(seed = Date.now() ^ (Math.random() * 1e9)) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    pick: list => list[Math.floor(next() * list.length)],
    picks(list, n) {
      const copy = [...list];
      const out = [];
      while (out.length < n && copy.length) out.push(copy.splice(Math.floor(next() * copy.length), 1)[0]);
      return out;
    },
    chance: p => next() < p,
  };
}

const VARS = ['leben', 'gold', 'punkte', 'level', 'mana', 'munition', 'xp', 'tempo', 'schaden', 'energie'];
const ITEMS = ['Schwert', 'Schild', 'Trank', 'Bogen', 'Helm', 'Karte', 'Fackel', 'Axt', 'Ring', 'Seil'];
const WORDS = ['Start', 'Level', 'Boss', 'Sieg', 'Pause', 'Bonus', 'Gegner', 'Ziel', 'Portal', 'Schatz'];
const NAMES = ['Ada', 'Tom', 'Linus', 'Grace', 'Bit', 'Mia', 'Leo', 'Kai'];
const PHRASES = ['Bereit zum Start', 'Level geschafft', 'Neuer Highscore', 'Willkommen im Spiel', 'Boss besiegt', 'Speichern fertig', 'Ich lerne Programmieren'];

const isCpp = lang => lang === 'cpp';
/** Ausgabe-Zeile. In C++ brauchen Vergleiche und Logik Klammern, weil << staerker bindet. */
const out = (lang, expr) => {
  if (!isCpp(lang)) return `print(${expr})`;
  const needs = /[<>=!&|]/.test(expr.replace(/"[^"]*"/g, ''));
  return `std::cout << ${needs ? `(${expr})` : expr} << std::endl;`;
};
const str = s => `"${s}"`;
const lines = arr => arr.join('\n');
const pyList = arr => `[${arr.map(x => (typeof x === 'string' ? `'${x}'` : String(x))).join(', ')}]`;
const pyBool = b => (b ? 'True' : 'False');
const cppBool = b => (b ? '1' : '0');
const boolOut = (lang, b) => (isCpp(lang) ? cppBool(b) : pyBool(b));
const fmtNum = (lang, x) => (isCpp(lang) || !Number.isInteger(x) ? String(x) : String(x));
/** Python-Division: immer float, z. B. 3.0 */
const pyFloat = x => (Number.isInteger(x) ? `${x}.0` : String(x));

/** Vollstaendiges Programm zum Pruefen */
function full(lang, body, includes = ['iostream']) {
  if (!isCpp(lang)) return body;
  return /int\s+main\s*\(/.test(body) ? body : cppMain(body, includes);
}

function predictStep(lang, prompt, code, answer, explain, includes) {
  return { type: 'predict', prompt, code, answer, explain, _verify: { code: full(lang, code, includes), expect: answer } };
}

/* ---------------------------------------------------------------- Generatoren */

export const GEN = {
  /* ---------- Ausgabe */
  printOrder(r, lang, hard) {
    const ws = r.picks(WORDS, hard ? 4 : r.int(2, 3));
    if (isCpp(lang)) {
      if (hard) {
        const code = lines([`std::cout << "${ws[0]}" << " " << "${ws[1]}";`, `std::cout << "${ws[2]}" << std::endl;`, `std::cout << "${ws[3]}" << std::endl;`]);
        return predictStep(lang, 'Was gibt dieser Code aus? Achte auf die Zeilenumbrüche.', code, `${ws[0]} ${ws[1]}${ws[2]}\n${ws[3]}`, 'Nur endl beendet eine Zeile. Ohne endl geht die Ausgabe direkt weiter.');
      }
      return predictStep(lang, 'Was gibt dieser Code aus?', lines(ws.map(w => out(lang, str(w)))), ws.join('\n'));
    }
    if (hard) {
      const n = r.int(2, 4);
      const code = lines([`print("${ws[0]}", "${ws[1]}")`, `print("${ws[2]}" * ${n})`, `print("${ws[3]}")`]);
      return predictStep(lang, 'Was gibt dieses Programm aus?', code, `${ws[0]} ${ws[1]}\n${ws[2].repeat(n)}\n${ws[3]}`, 'print mit mehreren Werten setzt Leerzeichen dazwischen. Text mal Zahl wiederholt den Text.');
    }
    return predictStep(lang, 'Was gibt dieses Programm aus?', lines(ws.map(w => out(lang, str(w)))), ws.join('\n'));
  },

  printWhich(r, lang) {
    const w = r.pick(PHRASES);
    const right = isCpp(lang) ? `std::cout << "${w}" << std::endl;` : `print("${w}")`;
    const wrong = isCpp(lang)
      ? [`std::cout >> "${w}" >> std::endl;`, `std::cout << "${w}" << std::endl`, `cout("${w}");`, `std::cout << ${w} << std::endl;`]
      : [`Print("${w}")`, `print("${w}"`, `print(${w})`, `print "${w}"`];
    const opts = r.picks(wrong, 3);
    opts.splice(r.int(0, 3), 0, right);
    return { type: 'mc', prompt: `Welche Zeile gibt \`${w}\` korrekt aus?`, options: opts, answer: opts.indexOf(right), codeOptions: true,
      explain: isCpp(lang) ? 'Pfeile zu cout hin, Text in Anführungszeichen, Semikolon am Ende.' : 'Kleines print, runde Klammern, Text in Anführungszeichen.',
      _verify: { code: full(lang, right), expect: w } };
  },

  writeEcho(r, lang) {
    const phrase = r.pick(PHRASES);
    const solution = isCpp(lang) ? cppMain(out(lang, str(phrase))) : out(lang, str(phrase));
    return {
      type: 'write', prompt: `Schreib ein Programm, das genau \`${phrase}\` ausgibt.`,
      code: isCpp(lang) ? cppMain() : '',
      expect: phrase, must: [[isCpp(lang) ? /cout/ : /print\s*\(/, isCpp(lang) ? 'Nutze `std::cout`.' : 'Nutze `print()`.']], solution,
    };
  },

  /* ---------- Rechnen */
  arith(r, lang, hard) {
    const a = r.int(hard ? 6 : 2, hard ? 30 : 12);
    const b = r.int(2, hard ? 9 : 6);
    const c = r.int(2, 5);
    const ops = hard
      ? [[`${a} + ${b} * ${c}`, a + b * c], [`(${a} + ${b}) * ${c}`, (a + b) * c], [`${a} % ${b} + ${c}`, (a % b) + c], [`${a} - ${b} * ${c}`, a - b * c]]
      : [[`${a} + ${b}`, a + b], [`${a} * ${b}`, a * b], [`${a} - ${b}`, a - b], [`${a} % ${b}`, a % b]];
    if (isCpp(lang)) ops.push([`${a * b + (hard ? 1 : 0)} / ${b}`, Math.trunc((a * b + (hard ? 1 : 0)) / b)]);
    else ops.push(hard ? [`${a * b + 1} // ${b}`, Math.floor((a * b + 1) / b)] : [`${a * 2} / 2`, null]);
    const [expr, val] = r.pick(ops);
    const answer = val === null ? pyFloat(a) : String(val);
    return predictStep(lang, 'Was gibt diese Zeile aus?', out(lang, expr), answer,
      hard ? 'Punkt vor Strich, Klammern zuerst. % ist der Rest der Division.' : (val === null ? 'Mit / kommt in Python immer eine Kommazahl heraus.' : null));
  },

  writeCalc(r, lang) {
    const a = r.int(3, 40);
    const b = r.int(2, 12);
    const [sym, word, val] = r.pick([['+', 'plus', a + b], ['*', 'mal', a * b], ['-', 'minus', a - b]]);
    const body = out(lang, `${a} ${sym} ${b}`);
    return {
      type: 'write', prompt: `Lass ${isCpp(lang) ? 'C++' : 'Python'} \`${a} ${word} ${b}\` ausrechnen und gib nur das Ergebnis aus.`,
      code: isCpp(lang) ? cppMain() : '', expect: String(val),
      must: [[new RegExp(`\\${sym}`), `Rechne mit \`${sym}\`.`]],
      mustNot: val === a || val === b ? [] : [[new RegExp(`(^|[^\\d])${val}([^\\d]|$)`), 'Lass das Programm rechnen, schreib das Ergebnis nicht selbst hin.']],
      solution: isCpp(lang) ? cppMain(body) : body,
    };
  },

  /* ---------- Variablen */
  varUpdate(r, lang, hard) {
    const v = r.pick(VARS);
    let x = r.int(2, 20);
    const decl = isCpp(lang) ? `int ${v} = ${x};` : `${v} = ${x}`;
    const steps = [decl];
    const n = hard ? 4 : 2;
    for (let i = 0; i < n; i++) {
      const k = r.int(2, hard ? 9 : 6);
      const op = r.pick(hard ? ['+=', '-=', '*=', 'self'] : ['+', '-', '*']);
      if (op === 'self') { steps.push(isCpp(lang) ? `${v} = ${v} + ${v};` : `${v} = ${v} + ${v}`); x += x; continue; }
      if (op.length === 2) {
        steps.push(isCpp(lang) ? `${v} ${op} ${k};` : `${v} ${op} ${k}`);
        x = op === '+=' ? x + k : op === '-=' ? x - k : x * k;
      } else {
        steps.push(isCpp(lang) ? `${v} = ${v} ${op} ${k};` : `${v} = ${v} ${op} ${k}`);
        x = op === '+' ? x + k : op === '-' ? x - k : x * k;
      }
    }
    steps.push(out(lang, v));
    return predictStep(lang, `Welchen Wert hat \`${v}\` am Ende?`, lines(steps), String(x), 'Rechts vom = wird mit dem alten Wert gerechnet, dann überschrieben.');
  },

  typeOf(r, lang) {
    const py = [['42', 'int'], ['3.5', 'float'], ['"Hallo"', 'str'], ['True', 'bool'], ['"7"', 'str'], ['0.0', 'float'], ['-8', 'int'], ['False', 'bool']];
    const cpp = [['42', 'int'], ['3.5', 'double'], ["'W'", 'char'], ['true', 'bool'], ['std::string("Ork")', 'std::string'], ['-8', 'int'], ['0.25', 'double']];
    const [lit, type] = r.pick(isCpp(lang) ? cpp : py);
    const options = isCpp(lang) ? ['int', 'double', 'char', 'bool', 'std::string'] : ['int', 'float', 'str', 'bool'];
    const opts = r.picks(options.filter(o => o !== type), 3);
    opts.splice(r.int(0, 3), 0, type);
    return { type: 'mc', prompt: `Welchen Typ hat \`${lit}\`?`, options: opts, answer: opts.indexOf(type), explain: type === 'str' && lit.includes('7') ? 'Anführungszeichen machen es zu Text, auch mit Ziffern.' : null, codeOptions: true };
  },

  concat(r, lang, hard) {
    const name = r.pick(NAMES);
    const lv = r.int(2, 50);
    if (isCpp(lang)) {
      const code = lines([`std::string name = "${name}";`, `int level = ${lv};`, `std::cout << name << " ist Level " << level ${hard ? '+ 1 ' : ''}<< std::endl;`]);
      return predictStep(lang, 'Was gibt dieser Code aus?', code, `${name} ist Level ${hard ? lv + 1 : lv}`, null, ['iostream', 'string']);
    }
    if (hard) {
      const a = r.int(2, 9);
      const b = r.int(2, 9);
      return predictStep(lang, 'Was gibt dieses Programm aus?', lines([`a = "${a}"`, `b = ${b}`, 'print(a + str(b))', 'print(int(a) + b)']), `${a}${b}\n${a + b}`, 'Text plus Text klebt zusammen, Zahl plus Zahl rechnet.');
    }
    return predictStep(lang, 'Was gibt dieses Programm aus?', lines([`name = "${name}"`, `level = ${lv}`, 'print(f"{name} ist Level {level}")']), `${name} ist Level ${lv}`);
  },

  writeInputMul(r, lang) {
    const k = r.int(2, 9);
    const tests = r.picks([3, 7, 12, 21, 40, 5, 9], 3).map(n => ({ stdin: String(n), expect: String(n * k) }));
    const body = isCpp(lang) ? lines(['int zahl;', 'std::cin >> zahl;', out(lang, `zahl * ${k}`)]) : lines(['zahl = int(input("Zahl: "))', out(lang, `zahl * ${k}`)]);
    return {
      type: 'write', prompt: `Lies eine ganze Zahl ein und gib das **${k}-Fache** aus.`,
      code: isCpp(lang) ? cppMain() : '', tests,
      must: [[isCpp(lang) ? /cin\s*>>/ : /int\s*\(\s*input/, isCpp(lang) ? 'Lies mit `std::cin >>`.' : 'Lies mit `int(input())`.']],
      solution: isCpp(lang) ? cppMain(body) : body, explain: 'Geprüft mit mehreren Eingaben.',
    };
  },

  /* ---------- Entscheidungen */
  compare(r, lang, hard) {
    const a = r.int(1, 20);
    const b = r.pick([a, a + r.int(1, 5), a - r.int(1, 5)]);
    const ops = [['>', a > b], ['<', a < b], ['>=', a >= b], ['<=', a <= b], ['==', a === b], ['!=', a !== b]];
    if (hard) {
      const c = r.int(1, 20);
      const and = isCpp(lang) ? '&&' : 'and';
      const or = isCpp(lang) ? '||' : 'or';
      const [o1, v1] = r.pick(ops);
      const useAnd = r.chance(0.5);
      const v2 = c % 2 === 0;
      const expr = `(${a} ${o1} ${b}) ${useAnd ? and : or} (${c} % 2 == 0)`;
      const val = useAnd ? v1 && v2 : v1 || v2;
      return predictStep(lang, 'Was gibt diese Zeile aus?', out(lang, expr), boolOut(lang, val), isCpp(lang) ? 'cout zeigt true als 1 und false als 0.' : null);
    }
    const [op, val] = r.pick(ops);
    return predictStep(lang, 'Was gibt diese Zeile aus?', out(lang, `${a} ${op} ${b}`), boolOut(lang, val), isCpp(lang) ? 'cout zeigt true als 1 und false als 0.' : null);
  },

  ifElse(r, lang, hard) {
    const v = r.pick(VARS);
    const x = r.int(0, 100);
    if (hard) {
      const t1 = r.int(60, 90);
      const t2 = r.int(20, 55);
      const res = x >= t1 ? 'Gold' : x >= t2 ? 'Silber' : 'Bronze';
      const code = isCpp(lang)
        ? lines([`int ${v} = ${x};`, `if (${v} >= ${t1}) {`, '    std::cout << "Gold" << std::endl;', `} else if (${v} >= ${t2}) {`, '    std::cout << "Silber" << std::endl;', '} else {', '    std::cout << "Bronze" << std::endl;', '}'])
        : lines([`${v} = ${x}`, `if ${v} >= ${t1}:`, '    print("Gold")', `elif ${v} >= ${t2}:`, '    print("Silber")', 'else:', '    print("Bronze")']);
      return predictStep(lang, 'Was gibt dieser Code aus?', code, res, 'Es zählt der erste Zweig, der passt.');
    }
    const t = r.pick([x, x + r.int(1, 10), Math.max(0, x - r.int(1, 10))]);
    const [a, b] = r.picks(WORDS, 2);
    const res = x > t ? a : b;
    const code = isCpp(lang)
      ? lines([`int ${v} = ${x};`, `if (${v} > ${t}) {`, `    std::cout << "${a}" << std::endl;`, '} else {', `    std::cout << "${b}" << std::endl;`, '}'])
      : lines([`${v} = ${x}`, `if ${v} > ${t}:`, `    print("${a}")`, 'else:', `    print("${b}")`]);
    return predictStep(lang, 'Was gibt dieser Code aus?', code, res, x === t ? 'Gleich ist nicht größer: > ist hier falsch.' : null);
  },

  logic(r, lang) {
    const a = r.chance(0.5);
    const b = r.chance(0.5);
    const T = v => (isCpp(lang) ? String(v) : pyBool(v));
    const forms = isCpp(lang)
      ? [[`${T(a)} && ${T(b)}`, a && b], [`${T(a)} || ${T(b)}`, a || b], [`!${T(a)}`, !a], [`!(${T(a)} && ${T(b)})`, !(a && b)]]
      : [[`${T(a)} and ${T(b)}`, a && b], [`${T(a)} or ${T(b)}`, a || b], [`not ${T(a)}`, !a], [`not (${T(a)} and ${T(b)})`, !(a && b)]];
    const [expr, val] = r.pick(forms);
    const opts = isCpp(lang) ? ['true', 'false'] : ['True', 'False'];
    return { type: 'mc', prompt: `Was ergibt \`${expr}\`?`, options: opts, answer: val ? 0 : 1, codeOptions: true, _verify: { code: full(lang, out(lang, expr)), expect: boolOut(lang, val) } };
  },

  writeThreshold(r, lang) {
    const t = r.int(10, 80);
    const [yes, no] = r.pick([['Bestanden', 'Nicht bestanden'], ['Zugelassen', 'Zu jung'], ['Level frei', 'Noch gesperrt'], ['Stark', 'Schwach']]);
    const tests = [t - 1, t, t + r.int(3, 20)].map(n => ({ stdin: String(n), expect: n >= t ? yes : no }));
    const body = isCpp(lang)
      ? lines(['int n;', 'std::cin >> n;', `if (n >= ${t}) {`, `    std::cout << "${yes}" << std::endl;`, '} else {', `    std::cout << "${no}" << std::endl;`, '}'])
      : lines(['n = int(input("Zahl: "))', `if n >= ${t}:`, `    print("${yes}")`, 'else:', `    print("${no}")`]);
    return {
      type: 'write', prompt: `Lies eine Zahl ein. Ist sie **mindestens ${t}**, gib \`${yes}\` aus, sonst \`${no}\`.`,
      code: isCpp(lang) ? cppMain() : '', tests, must: [[/\bif\b/, 'Nutze `if`.'], [/\belse\b/, 'Nutze `else`.']],
      solution: isCpp(lang) ? cppMain(body) : body, explain: 'Getestet genau an der Grenze, knapp darunter und darüber.',
    };
  },

  /* ---------- Schleifen */
  whileCount(r, lang, hard) {
    const s = r.int(1, 6);
    const k = r.int(2, hard ? 4 : 3);
    const e = s + k * r.int(2, 4) + (hard ? r.int(0, k - 1) : 0);
    const vals = [];
    for (let i = s; i < e; i += k) vals.push(i);
    const code = isCpp(lang)
      ? lines([`int i = ${s};`, `while (i < ${e}) {`, '    std::cout << i << std::endl;', `    i += ${k};`, '}'])
      : lines([`i = ${s}`, `while i < ${e}:`, '    print(i)', `    i += ${k}`]);
    return predictStep(lang, 'Was gibt diese Schleife aus?', code, vals.join('\n'), hard ? 'Die Bedingung wird vor jedem Durchlauf geprüft. Die Zahl, bei der sie falsch wird, kommt nicht mehr dran.' : null);
  },

  forRange(r, lang, hard) {
    if (hard) {
      const a = r.int(8, 14);
      const b = r.int(0, 3);
      const s = r.int(2, 4);
      const vals = [];
      for (let i = a; i > b; i -= s) vals.push(i);
      const code = isCpp(lang)
        ? lines([`for (int i = ${a}; i > ${b}; i -= ${s}) {`, '    std::cout << i << std::endl;', '}'])
        : lines([`for i in range(${a}, ${b}, -${s}):`, '    print(i)']);
      return predictStep(lang, 'Was gibt diese Schleife aus?', code, vals.join('\n'), 'Rückwärts zählen: Das Ende ist wieder nicht dabei.');
    }
    const a = r.int(0, 4);
    const b = a + r.int(3, 6);
    const vals = [];
    for (let i = a; i < b; i++) vals.push(i);
    const code = isCpp(lang)
      ? lines([`for (int i = ${a}; i < ${b}; i++) {`, '    std::cout << i << std::endl;', '}'])
      : lines([`for i in range(${a}, ${b}):`, '    print(i)']);
    return predictStep(lang, 'Was gibt diese Schleife aus?', code, vals.join('\n'), 'Das Ende ist nicht dabei.');
  },

  loopSum(r, lang, hard) {
    const n = r.int(4, hard ? 12 : 8);
    let sum = 0;
    for (let i = 1; i <= n; i++) if (!hard || i % 2 === 0) sum += i;
    const code = isCpp(lang)
      ? lines(['int summe = 0;', `for (int i = 1; i <= ${n}; i++) {`, hard ? '    if (i % 2 == 0) summe += i;' : '    summe += i;', '}', 'std::cout << summe << std::endl;'])
      : lines(['summe = 0', `for i in range(1, ${n + 1}):`, ...(hard ? ['    if i % 2 == 0:', '        summe += i'] : ['    summe += i']), 'print(summe)']);
    return predictStep(lang, 'Was gibt dieses Programm aus?', code, String(sum), hard ? 'Nur gerade Zahlen werden addiert.' : null);
  },

  breakCont(r, lang, hard) {
    const n = r.int(6, 10);
    const stop = r.int(3, n - 1);
    const skip = r.int(2, 3);
    const vals = [];
    for (let i = 0; i < n; i++) {
      if (i === stop) break;
      if (hard && i % skip === 0) continue;
      vals.push(i);
    }
    const code = isCpp(lang)
      ? lines([`for (int i = 0; i < ${n}; i++) {`, `    if (i == ${stop}) break;`, ...(hard ? [`    if (i % ${skip} == 0) continue;`] : []), '    std::cout << i << std::endl;', '}'])
      : lines([`for i in range(${n}):`, `    if i == ${stop}:`, '        break', ...(hard ? [`    if i % ${skip} == 0:`, '        continue'] : []), '    print(i)']);
    const step = predictStep(lang, 'Was gibt diese Schleife aus?', code, vals.join('\n'), 'break beendet die Schleife sofort, continue springt zum nächsten Durchlauf.');
    if (!vals.length) step.answer = '';
    return vals.length ? step : GEN.forRange(r, lang, hard);
  },

  writeRangePrint(r, lang) {
    const a = r.int(1, 10);
    const s = r.int(2, 5);
    const b = a + s * r.int(3, 5);
    const vals = [];
    for (let i = a; i <= b; i += s) vals.push(i);
    const body = isCpp(lang)
      ? lines([`for (int i = ${a}; i <= ${b}; i += ${s}) {`, '    std::cout << i << std::endl;', '}'])
      : lines([`for i in range(${a}, ${b + 1}, ${s}):`, '    print(i)']);
    return {
      type: 'write', prompt: `Gib mit einer Schleife die Zahlen ${vals.slice(0, 3).join(', ')} ... bis ${b} aus (immer +${s}), jede in einer eigenen Zeile.`,
      code: isCpp(lang) ? cppMain() : '', expect: vals.join('\n'),
      must: [[isCpp(lang) ? /\b(for|while)\s*\(/ : /\b(for|while)\b/, 'Nutze eine Schleife.']],
      solution: isCpp(lang) ? cppMain(body) : body,
    };
  },

  writeSumTo(r, lang) {
    const tests = r.picks([3, 5, 10, 25, 100, 7], 3).map(n => ({ stdin: String(n), expect: String((n * (n + 1)) / 2) }));
    const body = isCpp(lang)
      ? lines(['int n;', 'std::cin >> n;', 'int summe = 0;', 'for (int i = 1; i <= n; i++) {', '    summe += i;', '}', 'std::cout << summe << std::endl;'])
      : lines(['n = int(input("n: "))', 'summe = 0', 'for i in range(1, n + 1):', '    summe += i', 'print(summe)']);
    return {
      type: 'write', prompt: 'Lies eine Zahl n ein und gib die Summe 1 + 2 + ... + n aus. Nutze eine Schleife.',
      code: isCpp(lang) ? cppMain() : '', tests, must: [[isCpp(lang) ? /\b(for|while)\s*\(/ : /\b(for|while)\b/, 'Nutze eine Schleife.']],
      solution: isCpp(lang) ? cppMain(body) : body,
    };
  },

  /* ---------- Fehler reparieren */
  fixSyntax(r, lang) {
    const v = r.pick(VARS);
    const x = r.int(10, 60);
    const t = r.int(1, x - 1);
    const w = r.pick(WORDS);
    if (isCpp(lang)) {
      const good = cppMain(lines([`int ${v} = ${x};`, `if (${v} > ${t}) {`, `    std::cout << "${w}" << std::endl;`, '}']));
      const bad = r.pick([
        good.replace(`int ${v} = ${x};`, `int ${v} = ${x}`),
        good.replace(`"${w}" << std::endl;`, `"${w}" << std::endl`),
        good.replace(`if (${v} > ${t}) {`, `if ${v} > ${t} {`),
      ]);
      return { type: 'fix', prompt: 'Der Compiler meldet einen Fehler. Repariere das Programm.', code: bad, expect: w, solution: good };
    }
    const good = lines([`${v} = ${x}`, `if ${v} > ${t}:`, `    print("${w}")`]);
    const bad = r.pick([
      good.replace(`if ${v} > ${t}:`, `if ${v} > ${t}`),
      good.replace(`    print("${w}")`, `print("${w}")`),
      good.replace(`print("${w}")`, `print("${w}"`),
      good.replace(`print("${w}")`, `Print("${w}")`),
    ]);
    return { type: 'fix', prompt: 'Python meldet einen Fehler. Repariere das Programm.', code: bad, expect: w, solution: good };
  },

  /* ---------- Python: Listen und Strings */
  listIndex(r, lang, hard) {
    const items = r.picks(ITEMS, 5);
    const i = r.int(0, 4);
    if (hard) {
      const j = r.int(1, 3);
      return predictStep(lang, 'Was gibt dieses Programm aus?', lines([`inventar = ${pyList(items)}`, `print(inventar[-${j}])`, `print(inventar[${i}] + "!")`, 'print(len(inventar[1:4]))']), `${items[5 - j]}\n${items[i]}!\n3`, 'Negative Indizes zählen von hinten, -1 ist das letzte Element.');
    }
    return predictStep(lang, 'Was gibt dieses Programm aus?', lines([`inventar = ${pyList(items)}`, `print(inventar[${i}])`]), items[i], 'Gezählt wird ab 0.');
  },

  listAppend(r, lang, hard) {
    const items = r.picks(ITEMS, 6);
    const lst = items.slice(0, 3);
    const code = [`liste = ${pyList(lst)}`];
    code.push(`liste.append("${items[3]}")`); lst.push(items[3]);
    if (hard) {
      code.push(`liste.insert(1, "${items[4]}")`); lst.splice(1, 0, items[4]);
      code.push(`liste.remove("${lst[0]}")`); lst.splice(0, 1);
      code.push('liste.pop()'); lst.pop();
    } else {
      code.push(`liste.remove("${lst[1]}")`); lst.splice(1, 1);
    }
    code.push('print(liste)');
    return predictStep(lang, 'Wie sieht die Liste am Ende aus?', lines(code), pyList(lst), 'append hängt hinten an, insert fügt an einer Position ein, remove löscht den Wert, pop das letzte Element.');
  },

  slicing(r, lang, hard) {
    const word = r.pick(['Laufzeit', 'Programm', 'Spieler', 'Drachen', 'Portal', 'Schatzkarte']);
    const a = r.int(0, 2);
    const b = a + r.int(2, 4);
    if (hard) {
      return predictStep(lang, 'Was gibt dieses Programm aus?', lines([`w = "${word}"`, 'print(w[::-1])', `print(w[${a}:${b}].upper())`, 'print(w[-3:])']), `${[...word].reverse().join('')}\n${word.slice(a, b).toUpperCase()}\n${word.slice(-3)}`);
    }
    return predictStep(lang, 'Was gibt diese Zeile aus?', `print("${word}"[${a}:${b}])`, word.slice(a, b), 'Der Start ist dabei, das Ende nicht.');
  },

  strMethods(r, lang, hard) {
    const ws = r.picks(WORDS, 3).map(w => w.toLowerCase());
    if (hard) {
      const t = ws.join(',');
      return predictStep(lang, 'Was gibt dieses Programm aus?', lines([`text = "${t}"`, 'teile = text.split(",")', 'print(len(teile))', 'print(" | ".join(teile).upper())']), `3\n${ws.join(' | ').toUpperCase()}`);
    }
    return predictStep(lang, 'Was gibt diese Zeile aus?', `print("${ws.join(' ')}".split())`, pyList(ws));
  },

  writeListMax(r, lang, hard) {
    const mk = () => r.picks([3, 17, 8, 42, 5, 23, 11, 64, 9, 30, 2, 51], r.int(4, 6));
    const tests = [mk(), mk(), mk()].map(l => ({ stdin: l.join(' '), expect: `${Math.max(...l)}\n${Math.min(...l)}` }));
    return {
      type: 'write', prompt: `Lies eine Zeile mit Zahlen (durch Leerzeichen getrennt). Gib die größte und in der nächsten Zeile die kleinste aus${hard ? ', **ohne** `max()` und `min()`' : ''}.`,
      code: '', tests, mustNot: hard ? [[/\bmax\s*\(|\bmin\s*\(/, 'Ohne `max()` und `min()`.']] : [],
      solution: hard
        ? lines(['zahlen = [int(x) for x in input().split()]', 'groesste = zahlen[0]', 'kleinste = zahlen[0]', 'for z in zahlen:', '    if z > groesste:', '        groesste = z', '    if z < kleinste:', '        kleinste = z', 'print(groesste)', 'print(kleinste)'])
        : lines(['zahlen = [int(x) for x in input().split()]', 'print(max(zahlen))', 'print(min(zahlen))']),
    };
  },

  /* ---------- Funktionen (beide Sprachen) */
  funcReturn(r, lang, hard) {
    const a = r.int(2, 5);
    const b = r.int(1, 9);
    const n = r.int(2, 7);
    const m = r.int(1, 4);
    const f = x => a * x + b;
    const res = hard ? f(f(m)) - n : f(n);
    if (isCpp(lang)) {
      const code = cppFile(`int rechne(int x) {\n    return ${a} * x + ${b};\n}`, hard ? `std::cout << rechne(rechne(${m})) - ${n} << std::endl;` : `std::cout << rechne(${n}) << std::endl;`);
      return { ...predictStep(lang, 'Was gibt dieses Programm aus?', code, String(res)), _verify: { code, expect: String(res) } };
    }
    const code = lines(['def rechne(x):', `    return ${a} * x + ${b}`, '', hard ? `print(rechne(rechne(${m})) - ${n})` : `print(rechne(${n}))`]);
    return predictStep(lang, 'Was gibt dieses Programm aus?', code, String(res), hard ? 'Erst den inneren Aufruf ausrechnen, das Ergebnis geht in den äußeren.' : null);
  },

  funcDefault(r, lang) {
    const base = r.int(10, 60);
    const d = r.int(5, 20);
    const k = r.int(1, 30);
    const code = lines([`def heilen(hp, menge=${d}):`, '    return hp + menge', '', `print(heilen(${base}))`, `print(heilen(${base}, ${k}))`]);
    return predictStep(lang, 'Was gibt dieses Programm aus?', code, `${base + d}\n${base + k}`, 'Fehlt ein Argument, wird der Standardwert genommen.');
  },

  writeFunction(r, lang) {
    const a = r.int(2, 6);
    const b = r.int(0, 9);
    const name = r.pick(['punkte', 'bonus', 'schaden', 'preis']);
    const xs = r.picks([1, 2, 3, 5, 8, 10], 2);
    const expect = xs.map(x => a * x + b).join('\n');
    const formel = `${a} * x + ${b}`;
    if (isCpp(lang)) {
      return {
        type: 'write', prompt: `Schreib eine Funktion \`int ${name}(int x)\`, die \`${formel}\` zurückgibt. Gib \`${name}(${xs[0]})\` und \`${name}(${xs[1]})\` aus, jeweils in eigener Zeile.`,
        code: cppFile('', ''), expect, must: [[new RegExp(`int\\s+${name}\\s*\\(\\s*int`), `Lege \`int ${name}(int x)\` an.`], [/return/, 'Nutze `return`.']],
        solution: cppFile(`int ${name}(int x) {\n    return ${formel};\n}`, `std::cout << ${name}(${xs[0]}) << std::endl;\nstd::cout << ${name}(${xs[1]}) << std::endl;`),
      };
    }
    return {
      type: 'write', prompt: `Schreib eine Funktion \`${name}(x)\`, die \`${formel}\` zurückgibt. Gib \`${name}(${xs[0]})\` und \`${name}(${xs[1]})\` aus.`,
      code: '', expect, must: [[new RegExp(`def\\s+${name}\\s*\\(`), `Lege \`def ${name}(x):\` an.`], [/\breturn\b/, 'Nutze `return`.']],
      solution: lines([`def ${name}(x):`, `    return ${formel}`, '', `print(${name}(${xs[0]}))`, `print(${name}(${xs[1]}))`]),
    };
  },

  /* ---------- Python: Datenstrukturen, Fehler, Klassen */
  dictGet(r, lang, hard) {
    const [a, b, c] = r.picks(ITEMS, 3);
    const va = r.int(1, 50);
    const vb = r.int(1, 50);
    if (hard) {
      return predictStep(lang, 'Was gibt dieses Programm aus?', lines([`lager = {"${a}": ${va}, "${b}": ${vb}}`, `lager["${a}"] += 5`, `lager["${c}"] = lager.get("${c}", 0) + 1`, 'print(len(lager))', `print(lager["${a}"], lager["${c}"])`]), `3\n${va + 5} 1`);
    }
    return predictStep(lang, 'Was gibt dieses Programm aus?', lines([`preise = {"${a}": ${va}, "${b}": ${vb}}`, `print(preise["${b}"])`, `print(preise.get("${c}", 0))`]), `${vb}\n0`, 'get liefert den Standardwert, wenn der Schlüssel fehlt.');
  },

  comprehension(r, lang, hard) {
    const n = r.int(4, 8);
    const k = r.int(2, 4);
    const vals = [];
    for (let x = 0; x < n; x++) if (!hard || x % 2 === 1) vals.push(x * k);
    const code = hard ? `print([x * ${k} for x in range(${n}) if x % 2 == 1])` : `print([x * ${k} for x in range(${n})])`;
    return predictStep(lang, 'Was gibt diese Zeile aus?', code, pyList(vals));
  },

  writeWordCount(r, lang) {
    const pool = ['gg', 'ez', 'wp', 'lol', 'gg'];
    const target = 'gg';
    const tests = [0, 1, 2].map(() => {
      const ws = Array.from({ length: r.int(3, 7) }, () => r.pick(pool));
      return { stdin: ws.join(' '), expect: String(ws.filter(w => w === target).length) };
    });
    return {
      type: 'write', prompt: 'Lies eine Zeile mit Wörtern ein. Gib aus, wie oft das Wort `gg` darin vorkommt.',
      code: '', tests, solution: lines(['woerter = input().split()', 'print(woerter.count("gg"))']),
    };
  },

  tryExcept(r, lang, hard) {
    const val = r.pick(['"zehn"', '"12"', '"3.5"', '"7"']);
    const ok = /^"\d+"$/.test(val);
    const n = ok ? Number(val.slice(1, -1)) : 0;
    if (hard) {
      const d = r.pick([0, 2]);
      const lines2 = ['try:', `    x = int(${val})`, `    print(x // ${d})`, 'except ValueError:', '    print("Keine Zahl")', 'except ZeroDivisionError:', '    print("Durch 0")', 'print("Ende")'];
      const expect = `${!ok ? 'Keine Zahl' : d === 0 ? 'Durch 0' : Math.floor(n / d)}\nEnde`;
      return predictStep(lang, 'Was gibt dieses Programm aus?', lines(lines2), expect, 'Der erste Fehler bricht den try-Block ab, dann läuft der passende except.');
    }
    return predictStep(lang, 'Was gibt dieses Programm aus?', lines(['try:', `    print(int(${val}) + 1)`, 'except ValueError:', '    print("Fehler")']), ok ? String(n + 1) : 'Fehler', '`int()` schafft nur ganze Zahlen in Textform.');
  },

  classAttr(r, lang, hard) {
    const name = r.pick(NAMES);
    const hp = r.int(30, 100);
    const d = r.int(5, 20);
    const times = hard ? r.int(2, 4) : 1;
    const code = lines(['class Spieler:', '    def __init__(self, name, hp):', '        self.name = name', '        self.hp = hp', '', '    def treffer(self, schaden):', '        self.hp = max(0, self.hp - schaden)', '', `s = Spieler("${name}", ${hp})`, ...Array.from({ length: times }, () => `s.treffer(${d})`), 'print(s.name, s.hp)']);
    return predictStep(lang, 'Was gibt dieses Programm aus?', code, `${name} ${Math.max(0, hp - d * times)}`);
  },

  inherit(r, lang, hard) {
    const [a, b] = r.picks(['Grrr', 'Huuu', 'Zisch', 'Brumm', 'Kreisch'], 2);
    const code = lines(['class Gegner:', '    def laut(self):', `        return "${a}"`, '', 'class Boss(Gegner):', ...(hard ? ['    def laut(self):', `        return super().laut() + "${b}"`] : ['    pass']), '', 'print(Boss().laut())']);
    return predictStep(lang, 'Was gibt dieses Programm aus?', code, hard ? a + b : a, hard ? 'super() ruft die Methode der Elternklasse auf.' : 'Boss erbt laut() von Gegner.');
  },

  sortedKey(r, lang, hard) {
    const ws = r.picks(['Ei', 'Kiwi', 'Banane', 'Apfel', 'Melone', 'Feige', 'Erdbeere'], 4);
    if (isCpp(lang)) {
      const nums = r.picks([7, 3, 9, 1, 12, 5, 8], 4);
      const sorted = [...nums].sort((x, y) => (hard ? y - x : x - y));
      const code = lines([`std::vector<int> v = {${nums.join(', ')}};`, hard ? 'std::sort(v.begin(), v.end(), [](int a, int b) { return a > b; });' : 'std::sort(v.begin(), v.end());', 'for (int x : v) std::cout << x << " ";', 'std::cout << std::endl;']);
      return predictStep(lang, 'Was gibt dieser Code aus?', code, sorted.join(' '), null, ['iostream', 'vector', 'algorithm']);
    }
    // stabil nach Laenge, bei gleicher Laenge bleibt die Reihenfolge
    const sorted = ws.map((w, i) => [w, i]).sort((x, y) => (hard ? y[0].length - x[0].length : x[0].length - y[0].length) || x[1] - y[1]).map(x => x[0]);
    return predictStep(lang, 'Was gibt diese Zeile aus?', `print(sorted(${pyList(ws)}, key=len${hard ? ', reverse=True' : ''}))`, pyList(sorted), 'Bei gleicher Länge bleibt die ursprüngliche Reihenfolge erhalten.');
  },

  recursion(r, lang, hard) {
    const n = r.int(3, hard ? 6 : 5);
    if (hard) {
      const b = r.int(2, 3);
      const res = b ** n;
      const code = isCpp(lang)
        ? cppFile(`int potenz(int b, int e) {\n    if (e == 0) return 1;\n    return b * potenz(b, e - 1);\n}`, `std::cout << potenz(${b}, ${n}) << std::endl;`)
        : lines(['def potenz(b, e):', '    if e == 0:', '        return 1', '    return b * potenz(b, e - 1)', '', `print(potenz(${b}, ${n}))`]);
      return { ...predictStep(lang, 'Was gibt dieses Programm aus?', code, String(res)), _verify: { code, expect: String(res) } };
    }
    const res = (n * (n + 1)) / 2;
    const code = isCpp(lang)
      ? cppFile('int summe(int n) {\n    if (n == 0) return 0;\n    return n + summe(n - 1);\n}', `std::cout << summe(${n}) << std::endl;`)
      : lines(['def summe(n):', '    if n == 0:', '        return 0', '    return n + summe(n - 1)', '', `print(summe(${n}))`]);
    return { ...predictStep(lang, 'Was gibt dieses Programm aus?', code, String(res)), _verify: { code, expect: String(res) } };
  },

  stackQueue(r, lang, hard) {
    const ws = r.picks(WORDS, 4);
    if (hard) {
      return predictStep(lang, 'Was gibt dieses Programm aus?', lines(['from collections import deque', `q = deque(${pyList(ws.slice(0, 3))})`, `q.append("${ws[3]}")`, 'q.popleft()', 'print(q.popleft())', 'print(len(q))']), `${ws[1]}\n2`, 'Queue: Wer zuerst kam, ist zuerst dran.');
    }
    return predictStep(lang, 'Was gibt dieses Programm aus?', lines([`stapel = ${pyList(ws.slice(0, 3))}`, `stapel.append("${ws[3]}")`, 'print(stapel.pop())', 'print(stapel.pop())']), `${ws[3]}\n${ws[2]}`, 'Stack: Das Letzte rein, das Erste raus.');
  },

  /* ---------- C++: Container, Pointer, Klassen */
  arrayIndex(r, lang, hard) {
    const vals = Array.from({ length: 5 }, () => r.int(1, 30));
    const i = r.int(0, 4);
    const j = r.int(0, 4);
    const code = hard
      ? lines([`int a[5] = {${vals.join(', ')}};`, 'int s = 0;', 'for (int i = 0; i < 5; i += 2) s += a[i];', 'std::cout << s << std::endl;'])
      : lines([`int a[5] = {${vals.join(', ')}};`, `std::cout << a[${i}] + a[${j}] << std::endl;`]);
    return predictStep(lang, 'Was gibt dieser Code aus?', code, String(hard ? vals[0] + vals[2] + vals[4] : vals[i] + vals[j]), 'Gezählt wird ab 0.');
  },

  vectorOps(r, lang, hard) {
    const vals = r.picks([4, 8, 15, 16, 23, 42, 7], 3);
    const add = r.int(1, 9);
    const code = hard
      ? lines([`std::vector<int> v = {${vals.join(', ')}};`, `v.push_back(${add});`, 'v.pop_back();', `v.push_back(v[0] + v.back());`, 'std::cout << v.size() << " " << v.back() << std::endl;'])
      : lines([`std::vector<int> v = {${vals.join(', ')}};`, `v.push_back(${add});`, 'std::cout << v.size() << " " << v.back() << std::endl;']);
    const answer = hard ? `4 ${vals[0] + vals[2]}` : `4 ${add}`;
    return predictStep(lang, 'Was gibt dieser Code aus?', code, answer, 'back() liefert das letzte Element.', ['iostream', 'vector']);
  },

  stringOps(r, lang, hard) {
    const word = r.pick(['Unreal', 'Laufzeit', 'Spieler', 'Drachen', 'Portal']);
    const a = r.int(0, 2);
    const n = r.int(2, 3);
    const code = hard
      ? lines([`std::string s = "${word}";`, `std::cout << s.length() << " " << s[s.length() - 1] << " " << s.substr(${a}, ${n}) << std::endl;`])
      : lines([`std::string s = "${word}";`, `std::cout << s.substr(${a}, ${n}) << std::endl;`]);
    const answer = hard ? `${word.length} ${word[word.length - 1]} ${word.substr(a, n)}` : word.substr(a, n);
    return predictStep(lang, 'Was gibt dieser Code aus?', code, answer, 'substr(start, anzahl): ab Position start, so viele Zeichen.', ['iostream', 'string']);
  },

  writeVectorSum(r, lang) {
    const mk = () => r.picks([3, 17, 8, 42, 5, 23, 11, 9, 30], r.int(3, 6));
    const tests = [mk(), mk(), mk()].map(l => ({ stdin: l.join(' '), expect: `${l.length}\n${l.reduce((s, x) => s + x, 0)}` }));
    return {
      type: 'write', prompt: 'Lies Zahlen bis zum Eingabeende in einen `std::vector<int>`. Gib die Anzahl und in der nächsten Zeile die Summe aus.',
      code: cppMain('', ['iostream', 'vector']), tests, must: [[/std::vector/, 'Speichere die Zahlen in einem `std::vector<int>`.']],
      solution: cppMain(lines(['std::vector<int> v;', 'int x;', 'while (std::cin >> x) v.push_back(x);', 'int summe = 0;', 'for (int z : v) summe += z;', 'std::cout << v.size() << std::endl;', 'std::cout << summe << std::endl;']), ['iostream', 'vector']),
    };
  },

  pointerRef(r, lang, hard) {
    const a = r.int(2, 20);
    const k = r.int(1, 9);
    const m = r.int(2, 4);
    const v = r.pick(VARS);
    const code = hard
      ? lines([`int ${v} = ${a};`, `int* p = &${v};`, `int& r = ${v};`, `*p += ${k};`, `r *= ${m};`, `int* q = p;`, `*q -= 1;`, `std::cout << ${v} << std::endl;`])
      : lines([`int ${v} = ${a};`, `int* p = &${v};`, `*p += ${k};`, `std::cout << ${v} << std::endl;`]);
    return predictStep(lang, 'Was gibt dieser Code aus?', code, String(hard ? (a + k) * m - 1 : a + k), 'Pointer und Referenzen zeigen auf dieselbe Variable. Jede Änderung trifft das Original.');
  },

  classMethod(r, lang, hard) {
    const start = r.int(20, 80);
    const d = r.int(5, 15);
    const h2 = r.int(5, 15);
    const code = cppFile(`class Gegner {\npublic:\n    Gegner(int hp) : hp(hp) {}\n    void treffer(int s) { hp -= s; if (hp < 0) hp = 0; }\n    void heilen(int x) { hp += x; }\n    int getHp() const { return hp; }\nprivate:\n    int hp;\n};`,
      hard ? `Gegner g(${start});\ng.treffer(${d});\ng.heilen(${h2});\ng.treffer(${d * 3});\nstd::cout << g.getHp() << std::endl;` : `Gegner g(${start});\ng.treffer(${d});\nstd::cout << g.getHp() << std::endl;`);
    let hp = start - d;
    if (hp < 0) hp = 0;
    if (hard) { hp += h2; hp -= d * 3; if (hp < 0) hp = 0; }
    return { ...predictStep(lang, 'Was gibt dieses Programm aus?', code, String(hp)), _verify: { code, expect: String(hp) } };
  },

  virtualDispatch(r, lang, hard) {
    const [a, b] = r.picks(['Grrr', 'Huuu', 'Zisch', 'Brumm'], 2);
    const virt = hard ? r.chance(0.5) : true;
    const code = cppFile(`class Gegner {\npublic:\n    virtual ~Gegner() = default;\n    ${virt ? 'virtual ' : ''}std::string laut() const { return "${a}"; }\n};\n\nclass Geist : public Gegner {\npublic:\n    std::string laut() const${virt ? ' override' : ''} { return "${b}"; }\n};`,
      'std::unique_ptr<Gegner> g = std::make_unique<Geist>();\nstd::cout << g->laut() << std::endl;', ['iostream', 'memory', 'string']);
    return { ...predictStep(lang, 'Was gibt dieses Programm aus?', code, virt ? b : a, virt ? 'Mit virtual entscheidet der echte Typ (Geist).' : 'Ohne virtual entscheidet der Typ des Pointers (Gegner).'), _verify: { code, expect: virt ? b : a } };
  },

  mapCount(r, lang, hard) {
    const ws = Array.from({ length: hard ? 7 : 5 }, () => r.pick(['ork', 'geist', 'drache']));
    const counts = {};
    ws.forEach(w => { counts[w] = (counts[w] || 0) + 1; });
    const answer = Object.keys(counts).sort().map(k => `${k} ${counts[k]}`).join('\n');
    const code = lines([`std::vector<std::string> woerter = {${ws.map(w => `"${w}"`).join(', ')}};`, 'std::map<std::string, int> z;', 'for (const auto& w : woerter) z[w]++;', 'for (const auto& [w, n] : z) std::cout << w << " " << n << std::endl;']);
    return predictStep(lang, 'Was gibt dieser Code aus?', code, answer, 'std::map ist nach dem Schlüssel sortiert.', ['iostream', 'map', 'string', 'vector']);
  },
};

/* ---------------------------------------------------------------- Zuordnung */

// Pro Abschnitt: [Generator, ab welcher Lektion (1, 2, 3)]
export const UNIT_GENS = {
  py1: [['printOrder', 1], ['printWhich', 1], ['writeEcho', 1], ['arith', 2], ['writeCalc', 2], ['fixSyntax', 3]],
  py2: [['varUpdate', 1], ['typeOf', 2], ['concat', 2], ['writeInputMul', 3]],
  py3: [['compare', 1], ['ifElse', 2], ['fixSyntax', 2], ['logic', 3], ['writeThreshold', 2]],
  py4: [['whileCount', 1], ['forRange', 2], ['loopSum', 2], ['breakCont', 3], ['writeRangePrint', 2], ['writeSumTo', 3]],
  py5: [['listIndex', 1], ['listAppend', 2], ['slicing', 3], ['strMethods', 3], ['writeListMax', 2]],
  py6: [['funcReturn', 1], ['writeFunction', 1], ['funcDefault', 3]],
  py7: [['dictGet', 1], ['writeWordCount', 2], ['comprehension', 3]],
  py8: [['tryExcept', 1], ['writeThreshold', 1]],
  py9: [['classAttr', 1], ['inherit', 3]],
  py10: [['sortedKey', 3], ['writeListMax', 2], ['listIndex', 1]],
  py11: [['loopSum', 1], ['whileCount', 1], ['ifElse', 1]],
  py12: [['recursion', 1], ['writeSumTo', 1]],
  py13: [['sortedKey', 1], ['comprehension', 2], ['funcReturn', 3]],
  py14: [['tryExcept', 1], ['dictGet', 2]],
  py15: [['stackQueue', 1], ['classAttr', 3]],
  cpp1: [['printOrder', 1], ['printWhich', 1], ['writeEcho', 1], ['fixSyntax', 2], ['arith', 2]],
  cpp2: [['varUpdate', 1], ['typeOf', 1], ['arith', 2], ['writeCalc', 2], ['concat', 3], ['writeInputMul', 3]],
  cpp3: [['compare', 1], ['ifElse', 1], ['fixSyntax', 1], ['logic', 2], ['writeThreshold', 1]],
  cpp4: [['whileCount', 1], ['forRange', 2], ['loopSum', 2], ['breakCont', 2], ['writeRangePrint', 2], ['writeSumTo', 3]],
  cpp5: [['funcReturn', 1], ['writeFunction', 1]],
  cpp6: [['arrayIndex', 1], ['vectorOps', 2], ['stringOps', 3], ['writeVectorSum', 2]],
  cpp7: [['pointerRef', 1]],
  cpp8: [['pointerRef', 1], ['vectorOps', 1]],
  cpp9: [['classMethod', 1]],
  cpp10: [['virtualDispatch', 2], ['classMethod', 1]],
  cpp11: [['arith', 1], ['writeVectorSum', 1]],
  cpp14: [['sortedKey', 2], ['funcReturn', 1]],
  cpp15: [['recursion', 1], ['classMethod', 3]],
  cpp16: [['mapCount', 1], ['vectorOps', 3], ['writeVectorSum', 1]],
  cpp17: [['classMethod', 1], ['pointerRef', 3]],
  cpp18: [['ifElse', 1], ['virtualDispatch', 2]],
  cpp19: [['loopSum', 3], ['arrayIndex', 1]],
};

export function hasGenerators(unitId) {
  return Boolean(UNIT_GENS[unitId]?.length);
}

/**
 * Erzeugt count neue Aufgaben fuer einen Abschnitt.
 * upto: bis zu welcher Lektion (1-basiert), focus: diese Lektion bevorzugen, hard: Gold-Stufe,
 * code: Anzahl Schreib-/Reparatur-Aufgaben, die mindestens dabei sein sollen
 */
/** Abschnitte desselben Kurses vor unitId, z. B. py3 -> [py2, py1] */
function earlierUnits(unitId) {
  const m = /^(py|cpp)(\d+)$/.exec(unitId);
  if (!m) return [];
  const out = [];
  for (let n = Number(m[2]) - 1; n >= 1; n--) if (UNIT_GENS[`${m[1]}${n}`]) out.push(`${m[1]}${n}`);
  return out;
}

/** Zieht ohne Zuruecklegen, erst wenn alle dran waren, wird neu gemischt. So wiederholt sich nichts direkt. */
function bag(rng, items) {
  let pool = [];
  return () => {
    if (!pool.length) pool = rng.picks(items, items.length);
    return pool.shift();
  };
}

export function generate(unitId, lang, { count = 6, upto = 99, focus = null, hard = false, code = 1, rng = makeRng() } = {}) {
  const own = (UNIT_GENS[unitId] || []).filter(([, from]) => from <= upto);
  if (!own.length) return [];
  const isCode = name => /^(write|fix)/.test(name);
  // Schwerpunkt auf der aktuellen Lektion, dazu alles Bisherige aus dem Abschnitt
  const ownQuick = own.filter(([n]) => !isCode(n)).flatMap(([n, from]) => Array(focus && from === focus ? 2 : 1).fill([unitId, n]));
  const ownCode = own.filter(([n]) => isCode(n)).map(([n]) => [unitId, n]);
  // Zu wenig Auswahl? Dann Wiederholung aus frueheren Abschnitten (verteiltes Lernen)
  const review = [];
  for (const u of earlierUnits(unitId)) {
    if (new Set([...ownQuick, ...review].map(([, n]) => n)).size >= 4) break;
    const have = new Set([...ownQuick, ...review].map(([, n]) => n));
    for (const [n] of UNIT_GENS[u]) if (!isCode(n) && !have.has(n)) review.push([u, n]);
  }
  const quick = bag(rng, [...ownQuick, ...review]);
  const coder = bag(rng, ownCode);
  const picked = [];
  for (let i = 0; i < Math.min(code, ownCode.length ? code : 0); i++) picked.push(coder());
  while (picked.length < count) picked.push(ownQuick.length || review.length ? quick() : coder());
  return picked.map(([u, name], i) => ({ ...GEN[name](rng, lang, hard), key: `gen:${u}:${name}`, generated: true, _n: i }));
}
