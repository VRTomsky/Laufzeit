// Nachsicht bei kleinen Tippfehlern in der AUSGABE (nicht im Code).
// Wie bei Duolingo: "Ziel" statt "ZieL" zaehlt als richtig, die App sagt aber, was abweicht.
// Streng bleiben: Zahlen, Satzzeichen, Zeilen, True/False/None und Aufgaben,
// in denen Gross-/Kleinschreibung das Thema ist (upper, lower, toupper ...).

import { t, locale } from './i18n.js';
import { normalizeOutput, escapeHtml } from './util.js';

const IS_LETTER = /\p{L}/u;
const IS_SPACE = /[ \t]/;
const IS_DIGIT = /\d/;
// Woerter, bei denen die Schreibweise selbst die Antwort ist
const STRICT_WORDS = new Set(['true', 'false', 'none', 'null', 'nullptr',
  'int', 'str', 'float', 'bool', 'list', 'dict', 'tuple', 'set', 'class', 'nan', 'inf']);
const CASE_TOPIC = /\.(upper|lower|capitalize|title|swapcase|casefold|isupper|islower)\s*\(|\b(toupper|tolower)\b/;

/** Ist Gross-/Kleinschreibung in dieser Aufgabe das Lernziel? */
export function caseMatters(step) {
  if (!step) return false;
  if (step.strictCase) return true;
  const text = [step.prompt, step.code, step.solution, step.starter].filter(Boolean).join('\n');
  return CASE_TOPIC.test(text);
}

const lower = c => c.toLocaleLowerCase('de');
const sameIgnoringCase = (a, b) => a !== b && lower(a) === lower(b);

/**
 * Vergleicht erwartete und tatsaechliche Ausgabe.
 * Ergebnis: { kind: 'exact' | 'typo' | 'wrong', words: [[deins, richtig]], spacing: bool }
 */
export function compareOutput(expectedRaw, actualRaw, { strictCase = false } = {}) {
  const e = normalizeOutput(expectedRaw);
  const a = normalizeOutput(actualRaw);
  if (e === a) return { kind: 'exact' };
  const wrong = { kind: 'wrong' };
  if (!e || !a || e.length > 1500 || a.length > 1500) return wrong;
  if (e.split('\n').length !== a.split('\n').length) return wrong;

  // Editier-Abstand mit Gewichten: Gross/klein und Leerzeichen sind billig,
  // damit die Zuordnung diese Faelle bevorzugt.
  const n = e.length, m = a.length;
  const subCost = (x, y) => (x === y ? 0 : sameIgnoringCase(x, y) ? 0.4 : 1);
  const gapCost = c => (IS_SPACE.test(c) ? 0.4 : 1);
  const D = Array.from({ length: n + 1 }, () => new Float32Array(m + 1));
  for (let i = 1; i <= n; i++) D[i][0] = D[i - 1][0] + gapCost(e[i - 1]);
  for (let j = 1; j <= m; j++) D[0][j] = D[0][j - 1] + gapCost(a[j - 1]);
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      D[i][j] = Math.min(
        D[i - 1][j - 1] + subCost(e[i - 1], a[j - 1]),
        D[i - 1][j] + gapCost(e[i - 1]),
        D[i][j - 1] + gapCost(a[j - 1]));
    }
  }
  const eps = 1e-4;
  // Rueckweg: Paare [i, j], -1 = Luecke
  const pairs = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && Math.abs(D[i][j] - (D[i - 1][j - 1] + subCost(e[i - 1], a[j - 1]))) < eps) {
      pairs.push([i - 1, j - 1]); i--; j--;
    } else if (i > 0 && Math.abs(D[i][j] - (D[i - 1][j] + gapCost(e[i - 1]))) < eps) {
      pairs.push([i - 1, -1]); i--;
    } else {
      pairs.push([-1, j - 1]); j--;
    }
  }
  pairs.reverse();

  // Wortgrenzen in der erwarteten Ausgabe (Wort = zusammenhaengende Buchstaben)
  const wordOf = new Int32Array(n).fill(-1);
  const words = [];
  for (let k = 0; k < n; k++) {
    if (IS_LETTER.test(e[k])) {
      if (k === 0 || wordOf[k - 1] < 0) words.push([k, k + 1]);
      else words[words.length - 1][1] = k + 1;
      wordOf[k] = words.length - 1;
    }
  }

  let spacing = false;
  let letters = 0;
  const touched = new Map(); // Wort-Index -> Anzahl echter Buchstaben-Tippfehler
  let lastI = -1;
  for (let p = 0; p < pairs.length; p++) {
    const [pi, pj] = pairs[p];
    if (pi >= 0) lastI = pi;
    const ec = pi >= 0 ? e[pi] : null;
    const ac = pj >= 0 ? a[pj] : null;
    if (ec !== null && ac !== null && ec === ac) continue;

    // Leerzeichen zu viel oder zu wenig
    if ((ec === null && IS_SPACE.test(ac)) || (ac === null && IS_SPACE.test(ec))) {
      // nicht zwischen zwei Ziffern: "1 2" und "12" sind verschiedene Ausgaben
      const before = pi >= 0 ? e[pi - 1] : e[lastI];
      const after = pi >= 0 ? e[pi + 1] : e[lastI + 1];
      if (IS_DIGIT.test(before || '') && IS_DIGIT.test(after || '')) return wrong;
      spacing = true;
      continue;
    }
    if ((ec !== null && IS_SPACE.test(ec)) || (ac !== null && IS_SPACE.test(ac))) return wrong;

    // Ab hier geht es um Buchstaben. Alles andere (Ziffern, Zeichen, Zeilen) bleibt streng.
    if ((ec !== null && !IS_LETTER.test(ec)) || (ac !== null && !IS_LETTER.test(ac))) return wrong;

    // Wort in der erwarteten Ausgabe finden (bei Einfuegungen das Nachbarwort)
    let w = pi >= 0 ? wordOf[pi] : -1;
    if (w < 0 && lastI >= 0) w = wordOf[lastI];
    if (w < 0) {
      const next = pairs.slice(p + 1).find(q => q[0] >= 0);
      if (next) w = wordOf[next[0]];
    }
    if (w < 0) return wrong;
    const [ws, we] = words[w];
    const wordText = e.slice(ws, we);
    if (STRICT_WORDS.has(lower(wordText))) return wrong;

    if (ec !== null && ac !== null && sameIgnoringCase(ec, ac)) {
      if (strictCase) return wrong;
      if (!touched.has(w)) touched.set(w, 0);
      continue;
    }
    // echter Buchstabendreher: nur in laengeren Woertern, hoechstens einer pro Wort
    if (wordText.length < 4) return wrong;
    const count = (touched.get(w) || 0) + 1;
    if (count > 1) return wrong;
    touched.set(w, count);
    letters++;
  }
  if (letters > 2) return wrong;
  if (!touched.size && !spacing) return wrong;

  // Fuer den Hinweis: welche Woerter weichen ab? [deine Schreibweise, richtige]
  const pairsByWord = new Map();
  let lw = -1;
  for (const [pi, pj] of pairs) {
    let w = pi >= 0 ? wordOf[pi] : lw;
    if (pi >= 0 && w < 0) { lw = -1; continue; }
    if (w < 0 || !touched.has(w)) { if (pi >= 0) lw = w; continue; }
    lw = w;
    if (pj >= 0 && !IS_SPACE.test(a[pj])) pairsByWord.set(w, (pairsByWord.get(w) || '') + a[pj]);
  }
  const diffWords = [...touched.keys()].map(w => [pairsByWord.get(w) || '', e.slice(...words[w])]);
  return { kind: 'typo', words: diffWords, spacing };
}

/** HTML-Hinweis fuer ein "typo"-Ergebnis */
export function typoNote(result, { code = false } = {}) {
  const parts = [];
  if (result.words?.length) {
    const list = result.words.map(([mine, right]) =>
      t(`<code>${escapeHtml(mine)}</code> → richtig wäre <code>${escapeHtml(right)}</code>`, `<code>${escapeHtml(mine)}</code> → correct would be <code>${escapeHtml(right)}</code>`)).join(', ');
    parts.push(t(`<p>Zählt trotzdem, aber achte drauf: ${list}.</p>`, `<p>Still counts, but watch out: ${list}.</p>`));
  }
  if (result.spacing) {
    parts.push(t(`<p>${result.words?.length ? 'Außerdem weichen' : 'Zählt trotzdem, aber es weichen'} die Leerzeichen leicht ab.</p>`, `<p>${result.words?.length ? 'Also, the' : 'Still counts, but the'} spaces differ slightly.</p>`));
  }
  parts.push(code
    ? t('<p>In Textausgaben ist so ein Tippfehler harmlos. Im Code selbst zählt aber jedes Zeichen: <code>Print</code> statt <code>print</code> wäre ein echter Fehler.</p>', '<p>In text output a typo like this is harmless. In the code itself every character counts: <code>Print</code> instead of <code>print</code> would be a real error.</p>')
    : t('<p>Computer vergleichen Zeichen für Zeichen. Im echten Programm wäre das eine andere Ausgabe.</p>', '<p>Computers compare character by character. In a real program this would be a different output.</p>'));
  return parts.join('');
}

export const TYPO_TITLE = t('Richtig, mit kleinem Tippfehler.', 'Correct, with a small typo.');
