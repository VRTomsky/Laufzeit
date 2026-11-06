// Spricht mit dem lokalen Server (server.py) und prueft Code-Aufgaben

import { store } from './store.js';
import { normalizeOutput, escapeHtml, inline } from './util.js';
import { compareOutput, caseMatters, typoNote, TYPO_TITLE } from './tolerance.js';
import { explainError, errorLine, TIMEOUT_HINT } from './hints.js';
import { checkBadges } from './gamification.js';

let statusCache = null;

import { IS_WEB } from './env.js';
export { IS_WEB };

export const CPP_WEB_REASON = 'In der Online-Version kann Laufzeit kein C++ übersetzen. Die Aufgaben werden über Regeln geprüft. Zum echten Kompilieren lade Laufzeit auf deinen PC (Werkstatt, „Laufzeit herunterladen“).';

export async function getStatus(force = false) {
  if (IS_WEB) {
    const { warmUp, webPythonVersion } = await import('./webpython.js');
    warmUp();
    statusCache = { online: true, web: true, ready: true, python: { version: webPythonVersion() || 'Python im Browser' }, cpp: null };
    return statusCache;
  }
  if (statusCache && statusCache.ready && !force) return statusCache;
  try {
    const res = await fetch('/api/status', { cache: 'no-store' });
    statusCache = { ...(await res.json()), online: true };
  } catch {
    statusCache = { online: false, ready: true, python: null, cpp: null };
  }
  return statusCache;
}

/**
 * Fuehrt Code aus: lokal ueber server.py, online Python im Browser.
 * Antwort: { available, ok, stage: 'compile' | 'run', stdout, stderr, compileLog, timedOut, tool }
 */
export async function runCode(lang, code, stdin = '', { quietInput = false } = {}) {
  let res;
  if (IS_WEB) {
    if (lang !== 'python') return { available: false, reason: CPP_WEB_REASON };
    const { runWebPython } = await import('./webpython.js');
    res = await runWebPython(code, stdin, quietInput);
    if (res.available && !res.timedOut) store.update(s => { s.stats.runs[lang] = (s.stats.runs[lang] || 0) + 1; });
    return res;
  }
  try {
    const response = await fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Laufzeit': '1' },
      body: JSON.stringify({ lang, code, stdin, quietInput }),
    });
    if (!response.ok) throw new Error(String(response.status));
    res = await response.json();
  } catch {
    return { available: false, reason: 'Der lokale Server antwortet nicht. Läuft das Fenster von start.bat noch?' };
  }
  if (res.available && res.stage === 'run' && !res.timedOut) {
    store.update(s => { s.stats.runs[lang] = (s.stats.runs[lang] || 0) + 1; });
    if (lang === 'cpp') checkBadges();
  }
  return res;
}

/** Bereitet ein Ergebnis fuer die Konsole auf: Text, Hinweis, Fehlerzeile */
export function describeRun(res, lang) {
  if (!res.available) return { text: res.reason, isError: true, hint: null, line: null };
  if (res.stage === 'compile' && !res.ok) {
    return {
      text: res.compileLog,
      isError: true,
      hint: explainError(res.compileLog, lang),
      line: errorLine(res.compileLog, lang),
      label: 'Compiler-Fehler',
    };
  }
  if (res.timedOut) return { text: res.stdout, isError: true, hint: TIMEOUT_HINT, line: null, label: 'Abgebrochen' };
  if (!res.ok) {
    const err = res.stderr || `Das Programm wurde mit Code ${res.exitCode} beendet.`;
    return {
      text: (res.stdout ? res.stdout + '\n' : '') + err,
      stdout: res.stdout,
      errText: err,
      isError: true,
      hint: explainError(err, lang) || (lang === 'cpp' ? 'Das Programm ist beim Laufen abgestürzt. Häufige Ursache: Zugriff außerhalb eines Arrays oder Teilen durch 0.' : null),
      line: errorLine(err, lang),
      label: 'Laufzeitfehler',
    };
  }
  return { text: res.stdout, isError: false, hint: null, line: null, label: 'Ausgabe' };
}

function stripComments(code, lang) {
  if (lang === 'cpp') return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  return code.replace(/(^|\s)#[^\n]*/g, '$1');
}

const fail = (title, html, extra = {}) => ({ ok: false, title, html, ...extra });

/**
 * Prueft eine Schreib- oder Reparatur-Aufgabe.
 * 1. statische Regeln (must / mustNot), 2. echtes Ausfuehren, 3. Ausgabe vergleichen
 */
export async function validateCode(step, code, lang) {
  const plain = stripComments(code, lang);
  if (!plain.trim()) return fail('Noch leer.', '<p>Schreib zuerst etwas Code in den Editor.</p>');

  for (const [re, hint] of step.mustNot || []) {
    if (re.test(plain)) return fail('Fast.', `<p>${inline(hint)}</p>`);
  }
  for (const [re, hint] of step.must || []) {
    if (!re.test(plain)) return fail('Fast.', `<p>${inline(hint)}</p>`);
  }

  const tests = step.tests || (step.expect != null ? [{ stdin: step.stdin || '', expect: step.expect }] : []);
  if (step.run === false || tests.length === 0) {
    return { ok: true, title: 'Richtig.', html: step.explain ? `<p>${inline(step.explain)}</p>` : '' };
  }

  const strictCase = caseMatters(step);
  let last = null;
  let typo = null;
  for (let t = 0; t < tests.length; t++) {
    const result = await checkOne(code, lang, tests[t], tests.length > 1 ? t + 1 : 0, tests.length, strictCase);
    if (!result.ok) return result;
    if (result.typo && !typo) typo = result.typo;
    last = result;
  }
  const many = tests.length > 1 ? `<p>Alle ${tests.length} Testfälle bestanden.</p>` : '';
  const title = last.offline ? last.title : typo ? TYPO_TITLE : 'Richtig.';
  const note = typo ? typoNote(typo, { code: true }) : '';
  return { ok: true, typo: !!typo, title, html: (last.offline ? last.html : many) + note + (step.explain ? `<p>${inline(step.explain)}</p>` : ''), run: last.run, info: last.info, offline: last.offline };
}

/** Ein Testfall: ausfuehren, Fehler deuten, Ausgabe vergleichen. nr = 0 heisst: einziger Test */
async function checkOne(code, lang, test, nr, total, strictCase = false) {
  const res = await runCode(lang, code, test.stdin || '', { quietInput: true });
  const info = describeRun(res, lang);
  const which = nr ? `<p><b>Testfall ${nr} von ${total}</b>${test.stdin ? `, Eingabe <code>${escapeHtml(test.stdin.replace(/\n/g, ' | '))}</code>` : ''}</p>` : '';

  if (!res.available) {
    // Ohne Compiler wenigstens die statischen Regeln gelten lassen
    return {
      ok: true,
      offline: true,
      title: 'Angenommen, aber ungeprüft.',
      html: `<p>${escapeHtml(res.reason || '')} Die Regeln der Aufgabe sind erfüllt, die Ausgabe konnte aber nicht getestet werden. In der Werkstatt steht, wie du das einrichtest.</p>`,
      run: res,
      info,
    };
  }

  if (info.isError) {
    const label = res.stage === 'compile' ? 'Der Compiler meldet einen Fehler.' : res.timedOut ? 'Das Programm hört nicht auf.' : 'Das Programm ist abgestürzt.';
    return fail(label, which + (info.hint ? `<p>${inline(info.hint)}</p>` : '<p>Schau in die Ausgabe unter dem Editor.</p>'), { run: res, info });
  }

  const actual = normalizeOutput(res.stdout);
  const expected = normalizeOutput(test.expect);
  if (actual === expected) return { ok: true, run: res, info };

  // Kleine Tippfehler im Ausgabetext zaehlen, mit Hinweis
  const cmp = compareOutput(expected, actual, { strictCase });
  if (cmp.kind === 'typo') return { ok: true, typo: cmp, run: res, info };

  const loose = s => s.toLowerCase().replace(/\s+/g, ' ').trim();
  const nearly = loose(actual) === loose(expected);
  const diff = `<div class="diff">
      <div><b>Erwartet</b><pre>${escapeHtml(expected) || ' '}</pre></div>
      <div><b>Deine Ausgabe</b><pre>${escapeHtml(actual) || '(nichts)'}</pre></div>
    </div>`;
  const lead = nearly
    ? strictCase
      ? '<p>Fast! In dieser Aufgabe geht es genau um Groß-/Kleinschreibung, deshalb zählt hier jeder Buchstabe.</p>'
      : '<p>Fast! Kleine Tippfehler im Text lässt die App durchgehen, aber nicht bei Wörtern wie <code>True</code>, <code>False</code>, <code>None</code> oder Typnamen wie <code>int</code>. Da ist die Schreibweise die Antwort.</p>'
    : !nr && test.stdin
      ? `<p>Die Ausgabe stimmt noch nicht. Getestet mit der Eingabe <code>${escapeHtml(test.stdin.replace(/\n/g, ' | '))}</code>.</p>`
      : '<p>Die Ausgabe stimmt noch nicht.</p>';
  return fail(nearly ? 'Fast.' : 'Andere Ausgabe.', which + lead + diff, { run: res, info });
}
