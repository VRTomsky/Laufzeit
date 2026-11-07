// Task generator (English): creates new variants every run (different numbers, names, limits).
// Jeder Generator: (r, lang, hard) => Schritt. r ist ein Zufallsgenerator, hard die Gold-Stufe.
// _verify: { code, stdin, expect } erlaubt automatische Tests (wird in der App nicht angezeigt).

import { cppMain, cppFile } from '../helpers.js';

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

const VARS = ['lives', 'gold', 'points', 'level', 'mana', 'ammo', 'xp', 'speed', 'damage', 'energy'];
const ITEMS = ['Sword', 'Shield', 'Potion', 'Bow', 'Helmet', 'Map', 'Torch', 'Axe', 'Ring', 'Rope'];
const WORDS = ['Start', 'Level', 'Boss', 'Victory', 'Pause', 'Bonus', 'Enemy', 'Goal', 'Portal', 'Treasure'];
const NAMES = ['Ada', 'Sam', 'Linus', 'Grace', 'Bit', 'Mia', 'Leo', 'Kai'];
const PHRASES = ['Ready to start', 'Level complete', 'New highscore', 'Welcome to the game', 'Boss defeated', 'Saving done', 'I am learning to code'];

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
        return predictStep(lang, 'What does this code output? Watch the line breaks.', code, `${ws[0]} ${ws[1]}${ws[2]}\n${ws[3]}`, 'Only endl ends a line. Without endl the output simply continues.');
      }
      return predictStep(lang, 'What does this code output?', lines(ws.map(w => out(lang, str(w)))), ws.join('\n'));
    }
    if (hard) {
      const n = r.int(2, 4);
      const code = lines([`print("${ws[0]}", "${ws[1]}")`, `print("${ws[2]}" * ${n})`, `print("${ws[3]}")`]);
      return predictStep(lang, 'What does this program output?', code, `${ws[0]} ${ws[1]}\n${ws[2].repeat(n)}\n${ws[3]}`, 'print with several values puts spaces in between. Text times a number repeats the text.');
    }
    return predictStep(lang, 'What does this program output?', lines(ws.map(w => out(lang, str(w)))), ws.join('\n'));
  },

  printWhich(r, lang) {
    const w = r.pick(PHRASES);
    const right = isCpp(lang) ? `std::cout << "${w}" << std::endl;` : `print("${w}")`;
    const wrong = isCpp(lang)
      ? [`std::cout >> "${w}" >> std::endl;`, `std::cout << "${w}" << std::endl`, `cout("${w}");`, `std::cout << ${w} << std::endl;`]
      : [`Print("${w}")`, `print("${w}"`, `print(${w})`, `print "${w}"`];
    const opts = r.picks(wrong, 3);
    opts.splice(r.int(0, 3), 0, right);
    return { type: 'mc', prompt: `Which line outputs \`${w}\` correctly?`, options: opts, answer: opts.indexOf(right), codeOptions: true,
      explain: isCpp(lang) ? 'Arrows towards cout, text in quotes, semicolon at the end.' : 'Lower case print, round brackets, text in quotes.',
      _verify: { code: full(lang, right), expect: w } };
  },

  writeEcho(r, lang) {
    const phrase = r.pick(PHRASES);
    const solution = isCpp(lang) ? cppMain(out(lang, str(phrase))) : out(lang, str(phrase));
    return {
      type: 'write', prompt: `Write a program that outputs exactly \`${phrase}\`.`,
      code: isCpp(lang) ? cppMain() : '',
      expect: phrase, must: [[isCpp(lang) ? /cout/ : /print\s*\(/, isCpp(lang) ? 'Use `std::cout`.' : 'Use `print()`.']], solution,
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
    return predictStep(lang, 'What does this line output?', out(lang, expr), answer,
      hard ? 'Multiplication before addition, brackets first. % is the remainder of the division.' : (val === null ? 'With / Python always gives a decimal number.' : null));
  },

  writeCalc(r, lang) {
    const a = r.int(3, 40);
    const b = r.int(2, 12);
    const [sym, word, val] = r.pick([['+', 'plus', a + b], ['*', 'times', a * b], ['-', 'minus', a - b]]);
    const body = out(lang, `${a} ${sym} ${b}`);
    return {
      type: 'write', prompt: `Let ${isCpp(lang) ? 'C++' : 'Python'} calculate \`${a} ${word} ${b}\` and output only the result.`,
      code: isCpp(lang) ? cppMain() : '', expect: String(val),
      must: [[new RegExp(`\\${sym}`), `Calculate with \`${sym}\`.`]],
      mustNot: val === a || val === b ? [] : [[new RegExp(`(^|[^\\d])${val}([^\\d]|$)`), 'Let the program calculate, don\'t write the result yourself.']],
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
    return predictStep(lang, `What value does \`${v}\` have at the end?`, lines(steps), String(x), 'The right side of = uses the old value, then it is overwritten.');
  },

  typeOf(r, lang) {
    const py = [['42', 'int'], ['3.5', 'float'], ['"Hello"', 'str'], ['True', 'bool'], ['"7"', 'str'], ['0.0', 'float'], ['-8', 'int'], ['False', 'bool']];
    const cpp = [['42', 'int'], ['3.5', 'double'], ["'W'", 'char'], ['true', 'bool'], ['std::string("Orc")', 'std::string'], ['-8', 'int'], ['0.25', 'double']];
    const [lit, type] = r.pick(isCpp(lang) ? cpp : py);
    const options = isCpp(lang) ? ['int', 'double', 'char', 'bool', 'std::string'] : ['int', 'float', 'str', 'bool'];
    const opts = r.picks(options.filter(o => o !== type), 3);
    opts.splice(r.int(0, 3), 0, type);
    return { type: 'mc', prompt: `What type is \`${lit}\`?`, options: opts, answer: opts.indexOf(type), explain: type === 'str' && lit.includes('7') ? 'Quotes make it text, even with digits.' : null, codeOptions: true };
  },

  concat(r, lang, hard) {
    const name = r.pick(NAMES);
    const lv = r.int(2, 50);
    if (isCpp(lang)) {
      const code = lines([`std::string name = "${name}";`, `int level = ${lv};`, `std::cout << name << " is level " << level ${hard ? '+ 1 ' : ''}<< std::endl;`]);
      return predictStep(lang, 'What does this code output?', code, `${name} is level ${hard ? lv + 1 : lv}`, null, ['iostream', 'string']);
    }
    if (hard) {
      const a = r.int(2, 9);
      const b = r.int(2, 9);
      return predictStep(lang, 'What does this program output?', lines([`a = "${a}"`, `b = ${b}`, 'print(a + str(b))', 'print(int(a) + b)']), `${a}${b}\n${a + b}`, 'Text plus text glues together, number plus number calculates.');
    }
    return predictStep(lang, 'What does this program output?', lines([`name = "${name}"`, `level = ${lv}`, 'print(f"{name} is level {level}")']), `${name} is level ${lv}`);
  },

  writeInputMul(r, lang) {
    const k = r.int(2, 9);
    const tests = r.picks([3, 7, 12, 21, 40, 5, 9], 3).map(n => ({ stdin: String(n), expect: String(n * k) }));
    const body = isCpp(lang) ? lines(['int number;', 'std::cin >> number;', out(lang, `number * ${k}`)]) : lines(['number = int(input("Number: "))', out(lang, `number * ${k}`)]);
    return {
      type: 'write', prompt: `Read a whole number and output it **times ${k}**.`,
      code: isCpp(lang) ? cppMain() : '', tests,
      must: [[isCpp(lang) ? /cin\s*>>/ : /int\s*\(\s*input/, isCpp(lang) ? 'Read with `std::cin >>`.' : 'Read with `int(input())`.']],
      solution: isCpp(lang) ? cppMain(body) : body, explain: 'Checked with several inputs.',
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
      return predictStep(lang, 'What does this line output?', out(lang, expr), boolOut(lang, val), isCpp(lang) ? 'cout shows true as 1 and false as 0.' : null);
    }
    const [op, val] = r.pick(ops);
    return predictStep(lang, 'What does this line output?', out(lang, `${a} ${op} ${b}`), boolOut(lang, val), isCpp(lang) ? 'cout shows true as 1 and false as 0.' : null);
  },

  ifElse(r, lang, hard) {
    const v = r.pick(VARS);
    const x = r.int(0, 100);
    if (hard) {
      const t1 = r.int(60, 90);
      const t2 = r.int(20, 55);
      const res = x >= t1 ? 'Gold' : x >= t2 ? 'Silver' : 'Bronze';
      const code = isCpp(lang)
        ? lines([`int ${v} = ${x};`, `if (${v} >= ${t1}) {`, '    std::cout << "Gold" << std::endl;', `} else if (${v} >= ${t2}) {`, '    std::cout << "Silver" << std::endl;', '} else {', '    std::cout << "Bronze" << std::endl;', '}'])
        : lines([`${v} = ${x}`, `if ${v} >= ${t1}:`, '    print("Gold")', `elif ${v} >= ${t2}:`, '    print("Silver")', 'else:', '    print("Bronze")']);
      return predictStep(lang, 'What does this code output?', code, res, 'The first branch that matches counts.');
    }
    const t = r.pick([x, x + r.int(1, 10), Math.max(0, x - r.int(1, 10))]);
    const [a, b] = r.picks(WORDS, 2);
    const res = x > t ? a : b;
    const code = isCpp(lang)
      ? lines([`int ${v} = ${x};`, `if (${v} > ${t}) {`, `    std::cout << "${a}" << std::endl;`, '} else {', `    std::cout << "${b}" << std::endl;`, '}'])
      : lines([`${v} = ${x}`, `if ${v} > ${t}:`, `    print("${a}")`, 'else:', `    print("${b}")`]);
    return predictStep(lang, 'What does this code output?', code, res, x === t ? 'Equal is not greater: > is false here.' : null);
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
    return { type: 'mc', prompt: `What is \`${expr}\`?`, options: opts, answer: val ? 0 : 1, codeOptions: true, _verify: { code: full(lang, out(lang, expr)), expect: boolOut(lang, val) } };
  },

  writeThreshold(r, lang) {
    const t = r.int(10, 80);
    const [yes, no] = r.pick([['Passed', 'Failed'], ['Allowed', 'Too young'], ['Level unlocked', 'Still locked'], ['Strong', 'Weak']]);
    const tests = [t - 1, t, t + r.int(3, 20)].map(n => ({ stdin: String(n), expect: n >= t ? yes : no }));
    const body = isCpp(lang)
      ? lines(['int n;', 'std::cin >> n;', `if (n >= ${t}) {`, `    std::cout << "${yes}" << std::endl;`, '} else {', `    std::cout << "${no}" << std::endl;`, '}'])
      : lines(['n = int(input("Number: "))', `if n >= ${t}:`, `    print("${yes}")`, 'else:', `    print("${no}")`]);
    return {
      type: 'write', prompt: `Read a number. If it is **at least ${t}**, output \`${yes}\`, otherwise \`${no}\`.`,
      code: isCpp(lang) ? cppMain() : '', tests, must: [[/\bif\b/, 'Use `if`.'], [/\belse\b/, 'Use `else`.']],
      solution: isCpp(lang) ? cppMain(body) : body, explain: 'Tested exactly at the limit, just below and above.',
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
    return predictStep(lang, 'What does this loop output?', code, vals.join('\n'), hard ? 'The condition is checked before every run. The number where it becomes false is not printed any more.' : null);
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
      return predictStep(lang, 'What does this loop output?', code, vals.join('\n'), 'Counting backwards: the end is again not included.');
    }
    const a = r.int(0, 4);
    const b = a + r.int(3, 6);
    const vals = [];
    for (let i = a; i < b; i++) vals.push(i);
    const code = isCpp(lang)
      ? lines([`for (int i = ${a}; i < ${b}; i++) {`, '    std::cout << i << std::endl;', '}'])
      : lines([`for i in range(${a}, ${b}):`, '    print(i)']);
    return predictStep(lang, 'What does this loop output?', code, vals.join('\n'), 'The end is not included.');
  },

  loopSum(r, lang, hard) {
    const n = r.int(4, hard ? 12 : 8);
    let sum = 0;
    for (let i = 1; i <= n; i++) if (!hard || i % 2 === 0) sum += i;
    const code = isCpp(lang)
      ? lines(['int total = 0;', `for (int i = 1; i <= ${n}; i++) {`, hard ? '    if (i % 2 == 0) total += i;' : '    total += i;', '}', 'std::cout << total << std::endl;'])
      : lines(['total = 0', `for i in range(1, ${n + 1}):`, ...(hard ? ['    if i % 2 == 0:', '        total += i'] : ['    total += i']), 'print(total)']);
    return predictStep(lang, 'What does this program output?', code, String(sum), hard ? 'Only even numbers are added.' : null);
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
    const step = predictStep(lang, 'What does this loop output?', code, vals.join('\n'), 'break ends the loop immediately, continue jumps to the next run.');
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
      type: 'write', prompt: `Use a loop to output the numbers ${vals.slice(0, 3).join(', ')} ... up to ${b} (always +${s}), each on its own line.`,
      code: isCpp(lang) ? cppMain() : '', expect: vals.join('\n'),
      must: [[isCpp(lang) ? /\b(for|while)\s*\(/ : /\b(for|while)\b/, 'Use a loop.']],
      solution: isCpp(lang) ? cppMain(body) : body,
    };
  },

  writeSumTo(r, lang) {
    const tests = r.picks([3, 5, 10, 25, 100, 7], 3).map(n => ({ stdin: String(n), expect: String((n * (n + 1)) / 2) }));
    const body = isCpp(lang)
      ? lines(['int n;', 'std::cin >> n;', 'int total = 0;', 'for (int i = 1; i <= n; i++) {', '    total += i;', '}', 'std::cout << total << std::endl;'])
      : lines(['n = int(input("n: "))', 'total = 0', 'for i in range(1, n + 1):', '    total += i', 'print(total)']);
    return {
      type: 'write', prompt: 'Read a number n and output the sum 1 + 2 + ... + n. Use a loop.',
      code: isCpp(lang) ? cppMain() : '', tests, must: [[isCpp(lang) ? /\b(for|while)\s*\(/ : /\b(for|while)\b/, 'Use a loop.']],
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
      return { type: 'fix', prompt: 'The compiler reports an error. Fix the program.', code: bad, expect: w, solution: good };
    }
    const good = lines([`${v} = ${x}`, `if ${v} > ${t}:`, `    print("${w}")`]);
    const bad = r.pick([
      good.replace(`if ${v} > ${t}:`, `if ${v} > ${t}`),
      good.replace(`    print("${w}")`, `print("${w}")`),
      good.replace(`print("${w}")`, `print("${w}"`),
      good.replace(`print("${w}")`, `Print("${w}")`),
    ]);
    return { type: 'fix', prompt: 'Python reports an error. Fix the program.', code: bad, expect: w, solution: good };
  },

  /* ---------- Python: Listen und Strings */
  listIndex(r, lang, hard) {
    const items = r.picks(ITEMS, 5);
    const i = r.int(0, 4);
    if (hard) {
      const j = r.int(1, 3);
      return predictStep(lang, 'What does this program output?', lines([`inventory = ${pyList(items)}`, `print(inventory[-${j}])`, `print(inventory[${i}] + "!")`, 'print(len(inventory[1:4]))']), `${items[5 - j]}\n${items[i]}!\n3`, 'Negative indices count from the back, -1 is the last element.');
    }
    return predictStep(lang, 'What does this program output?', lines([`inventory = ${pyList(items)}`, `print(inventory[${i}])`]), items[i], 'Counting starts at 0.');
  },

  listAppend(r, lang, hard) {
    const items = r.picks(ITEMS, 6);
    const lst = items.slice(0, 3);
    const code = [`items = ${pyList(lst)}`];
    code.push(`items.append("${items[3]}")`); lst.push(items[3]);
    if (hard) {
      code.push(`items.insert(1, "${items[4]}")`); lst.splice(1, 0, items[4]);
      code.push(`items.remove("${lst[0]}")`); lst.splice(0, 1);
      code.push('items.pop()'); lst.pop();
    } else {
      code.push(`items.remove("${lst[1]}")`); lst.splice(1, 1);
    }
    code.push('print(items)');
    return predictStep(lang, 'What does the list look like at the end?', lines(code), pyList(lst), 'append adds at the end, insert puts it at a position, remove deletes the value, pop the last element.');
  },

  slicing(r, lang, hard) {
    const word = r.pick(['Laufzeit', 'Program', 'Player', 'Dragon', 'Portal', 'Treasuremap']);
    const a = r.int(0, 2);
    const b = a + r.int(2, 4);
    if (hard) {
      return predictStep(lang, 'What does this program output?', lines([`w = "${word}"`, 'print(w[::-1])', `print(w[${a}:${b}].upper())`, 'print(w[-3:])']), `${[...word].reverse().join('')}\n${word.slice(a, b).toUpperCase()}\n${word.slice(-3)}`);
    }
    return predictStep(lang, 'What does this line output?', `print("${word}"[${a}:${b}])`, word.slice(a, b), 'The start is included, the end is not.');
  },

  strMethods(r, lang, hard) {
    const ws = r.picks(WORDS, 3).map(w => w.toLowerCase());
    if (hard) {
      const t = ws.join(',');
      return predictStep(lang, 'What does this program output?', lines([`text = "${t}"`, 'parts = text.split(",")', 'print(len(parts))', 'print(" | ".join(parts).upper())']), `3\n${ws.join(' | ').toUpperCase()}`);
    }
    return predictStep(lang, 'What does this line output?', `print("${ws.join(' ')}".split())`, pyList(ws));
  },

  writeListMax(r, lang, hard) {
    const mk = () => r.picks([3, 17, 8, 42, 5, 23, 11, 64, 9, 30, 2, 51], r.int(4, 6));
    const tests = [mk(), mk(), mk()].map(l => ({ stdin: l.join(' '), expect: `${Math.max(...l)}\n${Math.min(...l)}` }));
    return {
      type: 'write', prompt: `Read a line of numbers (separated by spaces). Output the biggest and on the next line the smallest${hard ? ', **without** `max()` and `min()`' : ''}.`,
      code: '', tests, mustNot: hard ? [[/\bmax\s*\(|\bmin\s*\(/, 'Without `max()` and `min()`.']] : [],
      solution: hard
        ? lines(['numbers = [int(x) for x in input().split()]', 'biggest = numbers[0]', 'smallest = numbers[0]', 'for n in numbers:', '    if n > biggest:', '        biggest = n', '    if n < smallest:', '        smallest = n', 'print(biggest)', 'print(smallest)'])
        : lines(['numbers = [int(x) for x in input().split()]', 'print(max(numbers))', 'print(min(numbers))']),
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
      const code = cppFile(`int calc(int x) {\n    return ${a} * x + ${b};\n}`, hard ? `std::cout << calc(calc(${m})) - ${n} << std::endl;` : `std::cout << calc(${n}) << std::endl;`);
      return { ...predictStep(lang, 'What does this program output?', code, String(res)), _verify: { code, expect: String(res) } };
    }
    const code = lines(['def calc(x):', `    return ${a} * x + ${b}`, '', hard ? `print(calc(calc(${m})) - ${n})` : `print(calc(${n}))`]);
    return predictStep(lang, 'What does this program output?', code, String(res), hard ? 'Calculate the inner call first, the result goes into the outer one.' : null);
  },

  funcDefault(r, lang) {
    const base = r.int(10, 60);
    const d = r.int(5, 20);
    const k = r.int(1, 30);
    const code = lines([`def heal(hp, amount=${d}):`, '    return hp + amount', '', `print(heal(${base}))`, `print(heal(${base}, ${k}))`]);
    return predictStep(lang, 'What does this program output?', code, `${base + d}\n${base + k}`, 'If an argument is missing, the default value is used.');
  },

  writeFunction(r, lang) {
    const a = r.int(2, 6);
    const b = r.int(0, 9);
    const name = r.pick(['points', 'bonus', 'damage', 'price']);
    const xs = r.picks([1, 2, 3, 5, 8, 10], 2);
    const expect = xs.map(x => a * x + b).join('\n');
    const formel = `${a} * x + ${b}`;
    if (isCpp(lang)) {
      return {
        type: 'write', prompt: `Write a function \`int ${name}(int x)\` that returns \`${formel}\`. Output \`${name}(${xs[0]})\` and \`${name}(${xs[1]})\`, each on its own line.`,
        code: cppFile('', ''), expect, must: [[new RegExp(`int\\s+${name}\\s*\\(\\s*int`), `Create \`int ${name}(int x)\`.`], [/return/, 'Use `return`.']],
        solution: cppFile(`int ${name}(int x) {\n    return ${formel};\n}`, `std::cout << ${name}(${xs[0]}) << std::endl;\nstd::cout << ${name}(${xs[1]}) << std::endl;`),
      };
    }
    return {
      type: 'write', prompt: `Write a function \`${name}(x)\` that returns \`${formel}\`. Output \`${name}(${xs[0]})\` and \`${name}(${xs[1]})\`.`,
      code: '', expect, must: [[new RegExp(`def\\s+${name}\\s*\\(`), `Create \`def ${name}(x):\`.`], [/\breturn\b/, 'Use `return`.']],
      solution: lines([`def ${name}(x):`, `    return ${formel}`, '', `print(${name}(${xs[0]}))`, `print(${name}(${xs[1]}))`]),
    };
  },

  /* ---------- Python: Datenstrukturen, Fehler, Klassen */
  dictGet(r, lang, hard) {
    const [a, b, c] = r.picks(ITEMS, 3);
    const va = r.int(1, 50);
    const vb = r.int(1, 50);
    if (hard) {
      return predictStep(lang, 'What does this program output?', lines([`storage = {"${a}": ${va}, "${b}": ${vb}}`, `storage["${a}"] += 5`, `storage["${c}"] = storage.get("${c}", 0) + 1`, 'print(len(storage))', `print(storage["${a}"], storage["${c}"])`]), `3\n${va + 5} 1`);
    }
    return predictStep(lang, 'What does this program output?', lines([`prices = {"${a}": ${va}, "${b}": ${vb}}`, `print(prices["${b}"])`, `print(prices.get("${c}", 0))`]), `${vb}\n0`, 'get returns the default value if the key is missing.');
  },

  comprehension(r, lang, hard) {
    const n = r.int(4, 8);
    const k = r.int(2, 4);
    const vals = [];
    for (let x = 0; x < n; x++) if (!hard || x % 2 === 1) vals.push(x * k);
    const code = hard ? `print([x * ${k} for x in range(${n}) if x % 2 == 1])` : `print([x * ${k} for x in range(${n})])`;
    return predictStep(lang, 'What does this line output?', code, pyList(vals));
  },

  writeWordCount(r, lang) {
    const pool = ['gg', 'ez', 'wp', 'lol', 'gg'];
    const target = 'gg';
    const tests = [0, 1, 2].map(() => {
      const ws = Array.from({ length: r.int(3, 7) }, () => r.pick(pool));
      return { stdin: ws.join(' '), expect: String(ws.filter(w => w === target).length) };
    });
    return {
      type: 'write', prompt: 'Read a line of words. Output how often the word `gg` appears in it.',
      code: '', tests, solution: lines(['words = input().split()', 'print(words.count("gg"))']),
    };
  },

  tryExcept(r, lang, hard) {
    const val = r.pick(['"ten"', '"12"', '"3.5"', '"7"']);
    const ok = /^"\d+"$/.test(val);
    const n = ok ? Number(val.slice(1, -1)) : 0;
    if (hard) {
      const d = r.pick([0, 2]);
      const lines2 = ['try:', `    x = int(${val})`, `    print(x // ${d})`, 'except ValueError:', '    print("Not a number")', 'except ZeroDivisionError:', '    print("By 0")', 'print("End")'];
      const expect = `${!ok ? 'Not a number' : d === 0 ? 'By 0' : Math.floor(n / d)}\nEnd`;
      return predictStep(lang, 'What does this program output?', lines(lines2), expect, 'The first error stops the try block, then the matching except runs.');
    }
    return predictStep(lang, 'What does this program output?', lines(['try:', `    print(int(${val}) + 1)`, 'except ValueError:', '    print("Error")']), ok ? String(n + 1) : 'Error', '`int()` only handles whole numbers in text form.');
  },

  classAttr(r, lang, hard) {
    const name = r.pick(NAMES);
    const hp = r.int(30, 100);
    const d = r.int(5, 20);
    const times = hard ? r.int(2, 4) : 1;
    const code = lines(['class Player:', '    def __init__(self, name, hp):', '        self.name = name', '        self.hp = hp', '', '    def hit(self, damage):', '        self.hp = max(0, self.hp - damage)', '', `p = Player("${name}", ${hp})`, ...Array.from({ length: times }, () => `p.hit(${d})`), 'print(p.name, p.hp)']);
    return predictStep(lang, 'What does this program output?', code, `${name} ${Math.max(0, hp - d * times)}`);
  },

  inherit(r, lang, hard) {
    const [a, b] = r.picks(['Grrr', 'Booo', 'Hiss', 'Rumble', 'Screech'], 2);
    const code = lines(['class Enemy:', '    def sound(self):', `        return "${a}"`, '', 'class Boss(Enemy):', ...(hard ? ['    def sound(self):', `        return super().sound() + "${b}"`] : ['    pass']), '', 'print(Boss().sound())']);
    return predictStep(lang, 'What does this program output?', code, hard ? a + b : a, hard ? 'super() calls the method of the parent class.' : 'Boss inherits sound() from Enemy.');
  },

  sortedKey(r, lang, hard) {
    const ws = r.picks(['Fig', 'Kiwi', 'Banana', 'Apple', 'Melon', 'Pear', 'Strawberry'], 4);
    if (isCpp(lang)) {
      const nums = r.picks([7, 3, 9, 1, 12, 5, 8], 4);
      const sorted = [...nums].sort((x, y) => (hard ? y - x : x - y));
      const code = lines([`std::vector<int> v = {${nums.join(', ')}};`, hard ? 'std::sort(v.begin(), v.end(), [](int a, int b) { return a > b; });' : 'std::sort(v.begin(), v.end());', 'for (int x : v) std::cout << x << " ";', 'std::cout << std::endl;']);
      return predictStep(lang, 'What does this code output?', code, sorted.join(' '), null, ['iostream', 'vector', 'algorithm']);
    }
    // stabil nach Laenge, bei gleicher Laenge bleibt die Reihenfolge
    const sorted = ws.map((w, i) => [w, i]).sort((x, y) => (hard ? y[0].length - x[0].length : x[0].length - y[0].length) || x[1] - y[1]).map(x => x[0]);
    return predictStep(lang, 'What does this line output?', `print(sorted(${pyList(ws)}, key=len${hard ? ', reverse=True' : ''}))`, pyList(sorted), 'With equal length the original order is kept.');
  },

  recursion(r, lang, hard) {
    const n = r.int(3, hard ? 6 : 5);
    if (hard) {
      const b = r.int(2, 3);
      const res = b ** n;
      const code = isCpp(lang)
        ? cppFile(`int power(int b, int e) {\n    if (e == 0) return 1;\n    return b * power(b, e - 1);\n}`, `std::cout << power(${b}, ${n}) << std::endl;`)
        : lines(['def power(b, e):', '    if e == 0:', '        return 1', '    return b * power(b, e - 1)', '', `print(power(${b}, ${n}))`]);
      return { ...predictStep(lang, 'What does this program output?', code, String(res)), _verify: { code, expect: String(res) } };
    }
    const res = (n * (n + 1)) / 2;
    const code = isCpp(lang)
      ? cppFile('int total(int n) {\n    if (n == 0) return 0;\n    return n + total(n - 1);\n}', `std::cout << total(${n}) << std::endl;`)
      : lines(['def total(n):', '    if n == 0:', '        return 0', '    return n + total(n - 1)', '', `print(total(${n}))`]);
    return { ...predictStep(lang, 'What does this program output?', code, String(res)), _verify: { code, expect: String(res) } };
  },

  stackQueue(r, lang, hard) {
    const ws = r.picks(WORDS, 4);
    if (hard) {
      return predictStep(lang, 'What does this program output?', lines(['from collections import deque', `q = deque(${pyList(ws.slice(0, 3))})`, `q.append("${ws[3]}")`, 'q.popleft()', 'print(q.popleft())', 'print(len(q))']), `${ws[1]}\n2`, 'Queue: first come, first served.');
    }
    return predictStep(lang, 'What does this program output?', lines([`stack = ${pyList(ws.slice(0, 3))}`, `stack.append("${ws[3]}")`, 'print(stack.pop())', 'print(stack.pop())']), `${ws[3]}\n${ws[2]}`, 'Stack: last in, first out.');
  },

  /* ---------- C++: Container, Pointer, Klassen */
  arrayIndex(r, lang, hard) {
    const vals = Array.from({ length: 5 }, () => r.int(1, 30));
    const i = r.int(0, 4);
    const j = r.int(0, 4);
    const code = hard
      ? lines([`int a[5] = {${vals.join(', ')}};`, 'int s = 0;', 'for (int i = 0; i < 5; i += 2) s += a[i];', 'std::cout << s << std::endl;'])
      : lines([`int a[5] = {${vals.join(', ')}};`, `std::cout << a[${i}] + a[${j}] << std::endl;`]);
    return predictStep(lang, 'What does this code output?', code, String(hard ? vals[0] + vals[2] + vals[4] : vals[i] + vals[j]), 'Counting starts at 0.');
  },

  vectorOps(r, lang, hard) {
    const vals = r.picks([4, 8, 15, 16, 23, 42, 7], 3);
    const add = r.int(1, 9);
    const code = hard
      ? lines([`std::vector<int> v = {${vals.join(', ')}};`, `v.push_back(${add});`, 'v.pop_back();', `v.push_back(v[0] + v.back());`, 'std::cout << v.size() << " " << v.back() << std::endl;'])
      : lines([`std::vector<int> v = {${vals.join(', ')}};`, `v.push_back(${add});`, 'std::cout << v.size() << " " << v.back() << std::endl;']);
    const answer = hard ? `4 ${vals[0] + vals[2]}` : `4 ${add}`;
    return predictStep(lang, 'What does this code output?', code, answer, 'back() returns the last element.', ['iostream', 'vector']);
  },

  stringOps(r, lang, hard) {
    const word = r.pick(['Unreal', 'Laufzeit', 'Player', 'Dragon', 'Portal']);
    const a = r.int(0, 2);
    const n = r.int(2, 3);
    const code = hard
      ? lines([`std::string s = "${word}";`, `std::cout << s.length() << " " << s[s.length() - 1] << " " << s.substr(${a}, ${n}) << std::endl;`])
      : lines([`std::string s = "${word}";`, `std::cout << s.substr(${a}, ${n}) << std::endl;`]);
    const answer = hard ? `${word.length} ${word[word.length - 1]} ${word.substr(a, n)}` : word.substr(a, n);
    return predictStep(lang, 'What does this code output?', code, answer, 'substr(start, count): from position start, that many characters.', ['iostream', 'string']);
  },

  writeVectorSum(r, lang) {
    const mk = () => r.picks([3, 17, 8, 42, 5, 23, 11, 9, 30], r.int(3, 6));
    const tests = [mk(), mk(), mk()].map(l => ({ stdin: l.join(' '), expect: `${l.length}\n${l.reduce((s, x) => s + x, 0)}` }));
    return {
      type: 'write', prompt: 'Read numbers until the input ends into a `std::vector<int>`. Output the count and on the next line the sum.',
      code: cppMain('', ['iostream', 'vector']), tests, must: [[/std::vector/, 'Store the numbers in a `std::vector<int>`.']],
      solution: cppMain(lines(['std::vector<int> v;', 'int x;', 'while (std::cin >> x) v.push_back(x);', 'int total = 0;', 'for (int n : v) total += n;', 'std::cout << v.size() << std::endl;', 'std::cout << total << std::endl;']), ['iostream', 'vector']),
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
    return predictStep(lang, 'What does this code output?', code, String(hard ? (a + k) * m - 1 : a + k), 'Pointers and references point to the same variable. Every change hits the original.');
  },

  classMethod(r, lang, hard) {
    const start = r.int(20, 80);
    const d = r.int(5, 15);
    const h2 = r.int(5, 15);
    const code = cppFile(`class Enemy {\npublic:\n    Enemy(int hp) : hp(hp) {}\n    void hit(int s) { hp -= s; if (hp < 0) hp = 0; }\n    void heal(int x) { hp += x; }\n    int getHp() const { return hp; }\nprivate:\n    int hp;\n};`,
      hard ? `Enemy e(${start});\ne.hit(${d});\ne.heal(${h2});\ne.hit(${d * 3});\nstd::cout << e.getHp() << std::endl;` : `Enemy e(${start});\ne.hit(${d});\nstd::cout << e.getHp() << std::endl;`);
    let hp = start - d;
    if (hp < 0) hp = 0;
    if (hard) { hp += h2; hp -= d * 3; if (hp < 0) hp = 0; }
    return { ...predictStep(lang, 'What does this program output?', code, String(hp)), _verify: { code, expect: String(hp) } };
  },

  virtualDispatch(r, lang, hard) {
    const [a, b] = r.picks(['Grrr', 'Booo', 'Hiss', 'Rumble'], 2);
    const virt = hard ? r.chance(0.5) : true;
    const code = cppFile(`class Enemy {\npublic:\n    virtual ~Enemy() = default;\n    ${virt ? 'virtual ' : ''}std::string sound() const { return "${a}"; }\n};\n\nclass Ghost : public Enemy {\npublic:\n    std::string sound() const${virt ? ' override' : ''} { return "${b}"; }\n};`,
      'std::unique_ptr<Enemy> e = std::make_unique<Ghost>();\nstd::cout << e->sound() << std::endl;', ['iostream', 'memory', 'string']);
    return { ...predictStep(lang, 'What does this program output?', code, virt ? b : a, virt ? 'With virtual the real type decides (Ghost).' : 'Without virtual the type of the pointer decides (Enemy).'), _verify: { code, expect: virt ? b : a } };
  },

  mapCount(r, lang, hard) {
    const ws = Array.from({ length: hard ? 7 : 5 }, () => r.pick(['orc', 'ghost', 'dragon']));
    const counts = {};
    ws.forEach(w => { counts[w] = (counts[w] || 0) + 1; });
    const answer = Object.keys(counts).sort().map(k => `${k} ${counts[k]}`).join('\n');
    const code = lines([`std::vector<std::string> words = {${ws.map(w => `"${w}"`).join(', ')}};`, 'std::map<std::string, int> counts;', 'for (const auto& w : words) counts[w]++;', 'for (const auto& [w, n] : counts) std::cout << w << " " << n << std::endl;']);
    return predictStep(lang, 'What does this code output?', code, answer, 'std::map is sorted by key.', ['iostream', 'map', 'string', 'vector']);
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
