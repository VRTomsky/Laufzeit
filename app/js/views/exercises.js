// Darstellung und Pruefung der einzelnen Uebungstypen.
// Jede Funktion bekommt (step, ctx) und liefert { el, check(), focus?() }.
// ctx: { lang, setReady(bool), onKey(fn), submit() }

import { t, locale } from '../i18n.js';
import { h, md, inline, escapeHtml, shuffle, normalizeOutput } from '../util.js';
import { highlight } from '../highlight.js';
import { icon } from '../icons.js';
import { createEditor } from '../editor.js';
import { runCode, describeRun, validateCode, getStatus } from '../runner.js';
import { compareOutput, caseMatters, typoNote, TYPO_TITLE } from '../tolerance.js';

const LANG_FILE = { python: 'main.py', cpp: 'main.cpp' };
const GAP = /⟦(\d+)⟧/g;

export const KIND_LABEL = {
  concept: t('Neues Konzept', 'New concept'),
  mc: t('Wähle die richtige Antwort', 'Pick the right answer'),
  predict: t('Was wird ausgegeben?', 'What is the output?'),
  fill: t('Ergänze den Code', 'Fill in the code'),
  order: t('Bring in die richtige Reihenfolge', 'Put it in the right order'),
  fix: t('Finde den Fehler', 'Find the bug'),
  write: t('Schreib selbst', 'Write it yourself'),
};

/* ---------------------------------------------------------------- Bausteine */

export function codeBlock(code, lang, label) {
  return h('div', { class: 'code' },
    h('div', { class: 'code-head' }, h('span', {}, label || LANG_FILE[lang]), h('span', {}, lang === 'cpp' ? 'C++' : 'Python')),
    h('pre', { html: highlight(code, lang) }));
}

function consoleBlock(text) {
  return h('div', { class: 'code is-console' }, h('div', { class: 'code-head' }, h('span', {}, t('Konsole', 'Console'))), h('pre', {}, text));
}

function memoryBlock(cells, caption) {
  return h('figure', { class: 'memory', style: { margin: 'var(--s5) 0' } },
    h('div', { class: 'memory-row' }, cells.map(c => c.arrow ? h('div', { class: 'mem-arrow' }, c.arrow) : h('div', { class: `mem${c.kind ? ` is-${c.kind}` : ''}` },
      c.addr ? h('div', { class: 'mem-addr' }, h('span', {}, c.addr), h('span', {}, c.size || '')) : null,
      h('div', { class: 'mem-val' }, c.value),
      h('div', { class: 'mem-name', html: `${c.type ? `<code>${escapeHtml(c.type)}</code> ` : ''}<code>${escapeHtml(c.name)}</code>` })))),
    caption ? h('figcaption', { class: 'memory-cap' }, caption) : null);
}

function flowBlock(items, loop) {
  const parts = [];
  items.forEach((item, i) => {
    if (i > 0) parts.push(h('span', { class: 'flow-arrow', html: icon('arrow') }));
    parts.push(h('span', { class: 'flow-box' }, item));
  });
  if (loop) parts.push(h('span', { class: 'flow-arrow', html: icon('reset') }), h('span', { class: 'muted', style: { fontSize: 'var(--text-sm)' } }, t('nächster Frame', 'next frame')));
  return h('div', { class: `flow${loop ? ' is-loop' : ''}` }, parts);
}

const prompt = text => h('div', { class: 'step-prompt', html: md(text) });
const accepted = answer => (Array.isArray(answer) ? answer : [answer]);
const normGap = s => String(s).trim().replace(/\s+/g, ' ');

/* ---------------------------------------------------------------- concept */

function concept(step, ctx) {
  ctx.setReady(true);
  const parts = [h('h1', { class: 'step-title' }, step.title), h('div', { class: 'concept-body', html: md(step.body) })];
  if (step.flow) parts.push(flowBlock(step.flow, step.loop));
  if (step.memory) parts.push(memoryBlock(step.memory, step.memoryCaption));
  if (step.compare && step.code) {
    parts.push(h('div', { class: 'compare' }, codeBlock(step.compare.python, 'python', t('So in Python', 'In Python')), codeBlock(step.code, ctx.lang, 'So in C++')));
  } else if (step.code) {
    parts.push(codeBlock(step.code, ctx.lang));
  }
  if (step.console) parts.push(consoleBlock(step.console));
  if (step.after) parts.push(h('div', { class: 'concept-body concept-after', html: md(step.after) }));
  return { el: h('div', {}, parts), check: async () => ({ ok: true }) };
}

/* ---------------------------------------------------------------- mc */

function multipleChoice(step, ctx) {
  const order = shuffle(step.options.map((_, i) => i));
  let chosen = null;
  const buttons = order.map((optIndex, n) => h('button', {
    type: 'button',
    class: `choice${step.codeOptions ? ' is-code' : ''}`,
    role: 'radio',
    'aria-checked': 'false',
    onclick: () => select(n),
  }, h('span', { class: 'choice-key' }, n + 1),
    h('span', { class: 'choice-text', html: step.codeOptions ? escapeHtml(step.options[optIndex]) : inline(step.options[optIndex]) })));

  function select(n) {
    if (buttons[0].disabled) return;
    chosen = n;
    buttons.forEach((b, i) => b.setAttribute('aria-checked', String(i === n)));
    ctx.setReady(true);
  }
  ctx.onKey(e => {
    const n = Number(e.key) - 1;
    if (n >= 0 && n < buttons.length) select(n);
  });

  const el = h('div', {}, prompt(step.prompt), step.code ? codeBlock(step.code, ctx.lang) : null,
    h('div', { class: 'choices', role: 'radiogroup' }, buttons));

  return {
    el,
    async check() {
      const ok = order[chosen] === step.answer;
      buttons.forEach((b, i) => {
        b.disabled = true;
        if (order[i] === step.answer) b.classList.add('is-right');
        else if (i === chosen) b.classList.add('is-wrong');
      });
      const right = step.options[step.answer];
      return {
        ok,
        html: (ok ? '' : `<p>${t('Richtig wäre', 'Correct would be')}: ${step.codeOptions ? `<code>${escapeHtml(right)}</code>` : inline(right)}</p>`) + (step.explain ? `<p>${inline(step.explain)}</p>` : ''),
      };
    },
  };
}

/* ---------------------------------------------------------------- predict */

function predictOutput(step, ctx) {
  const answers = accepted(step.answer);
  const multiline = answers[0].includes('\n');
  const input = h(multiline ? 'textarea' : 'input', {
    class: 'answer-input',
    'aria-label': t('Deine vorhergesagte Ausgabe', 'Your predicted output'),
    placeholder: multiline ? t('Jede Ausgabezeile in eine eigene Zeile', 'Each output line on its own line') : t('Ausgabe eintippen', 'Type the output'),
    spellcheck: 'false',
    autocomplete: 'off',
    autocapitalize: 'off',
    rows: multiline ? String(answers[0].split('\n').length + 1) : null,
  });
  input.addEventListener('input', () => ctx.setReady(input.value.trim().length > 0));

  const el = h('div', {}, prompt(step.prompt), codeBlock(step.code, ctx.lang), input,
    multiline ? h('p', { class: 'foot-hint', style: { marginTop: '8px' } }, t('Strg+Enter zum Prüfen', 'Ctrl+Enter to check')) : null);

  return {
    el,
    focus: () => input.focus(),
    async check() {
      const got = normalizeOutput(input.value);
      const exact = answers.some(a => normalizeOutput(a) === got);
      // kleine Tippfehler zaehlen, die App sagt aber, was abweicht
      const strictCase = caseMatters(step);
      const typo = exact ? null : answers.map(a => compareOutput(a, got, { strictCase })).find(r => r.kind === 'typo');
      const ok = exact || !!typo;
      const loose = s => s.toLowerCase().replace(/\s+/g, '');
      const near = !ok && answers.some(a => loose(a) === loose(got));
      input.readOnly = true;
      input.classList.add(ok ? 'is-right' : 'is-wrong');
      let html = '';
      if (typo) html += typoNote(typo) + t(`<p>Genau wäre:</p><pre>${escapeHtml(answers[0])}</pre>`, `<p>Exactly:</p><pre>${escapeHtml(answers[0])}</pre>`);
      if (!ok) html += `${near ? `<p>${t('Fast! Hier zählt die Schreibweise', 'Almost! The exact spelling counts here')}${strictCase ? t(', denn genau darum geht es in dieser Aufgabe', ', because that is exactly what this task is about') : ''}.</p>` : ''}<p>${t('Die Ausgabe ist:', 'The output is:')}</p><pre>${escapeHtml(answers[0])}</pre>`;
      if (step.explain) html += `<p>${inline(step.explain)}</p>`;
      return { ok, typo: !!typo, title: typo ? TYPO_TITLE : undefined, html };
    },
  };
}

/* ---------------------------------------------------------------- fill */

function fillGaps(step, ctx) {
  const gapAnswers = step.gaps.map(accepted);
  const useBank = Array.isArray(step.bank) && step.bank.length > 0;
  const values = step.gaps.map(() => null);
  const gapEls = [];
  const pre = h('pre');

  // Code in Stuecke zerlegen und die Luecken als Elemente einsetzen
  let last = 0;
  for (const m of step.code.matchAll(GAP)) {
    pre.insertAdjacentHTML('beforeend', highlight(step.code.slice(last, m.index), ctx.lang));
    const index = Number(m[1]);
    let gap;
    if (useBank) {
      gap = h('button', { type: 'button', class: 'gap', 'aria-label': t(`Lücke ${index + 1}, leer`, `Gap ${index + 1}, empty`), onclick: () => clearGap(index) }, ' ');
    } else {
      const width = Math.max(...gapAnswers[index].map(a => a.length), 3) + 1;
      gap = h('input', { class: 'gap', size: String(width), 'aria-label': t(`Lücke ${index + 1}`, `Gap ${index + 1}`), spellcheck: 'false', autocomplete: 'off', autocapitalize: 'off' });
      gap.addEventListener('input', () => { values[index] = gap.value; updateReady(); });
    }
    gapEls[index] = gap;
    pre.append(gap);
    last = m.index + m[0].length;
  }
  pre.insertAdjacentHTML('beforeend', highlight(step.code.slice(last), ctx.lang));

  const chips = [];
  const bankEl = useBank ? h('div', { class: 'bank', 'aria-label': t('Bausteine', 'Pieces') }) : null;
  if (useBank) {
    shuffle(step.bank).forEach(word => {
      const chip = h('button', { type: 'button', class: 'chip', onclick: () => place(chip) }, word);
      chip.dataset.word = word;
      chips.push(chip);
      bankEl.append(chip);
    });
  }

  function markActive() {
    const next = values.findIndex(v => v == null);
    gapEls.forEach((g, i) => g.classList.toggle('is-active', i === next));
  }
  function place(chip) {
    if (locked) return;
    const index = values.findIndex(v => v == null);
    if (index < 0) return;
    values[index] = chip.dataset.word;
    gapEls[index].textContent = chip.dataset.word;
    gapEls[index].classList.add('is-filled');
    gapEls[index].setAttribute('aria-label', t(`Lücke ${index + 1}: ${chip.dataset.word}. Antippen zum Entfernen`, `Gap ${index + 1}: ${chip.dataset.word}. Tap to remove`));
    gapEls[index].dataset.chip = String(chips.indexOf(chip));
    chip.classList.add('is-used');
    markActive();
    updateReady();
  }
  function clearGap(index) {
    if (locked || values[index] == null) return;
    const chip = chips[Number(gapEls[index].dataset.chip)];
    chip?.classList.remove('is-used');
    values[index] = null;
    gapEls[index].textContent = ' ';
    gapEls[index].classList.remove('is-filled');
    gapEls[index].setAttribute('aria-label', t(`Lücke ${index + 1}, leer`, `Gap ${index + 1}, empty`));
    markActive();
    updateReady();
  }
  function updateReady() {
    ctx.setReady(values.every(v => v != null && String(v).trim() !== ''));
  }
  let locked = false;
  markActive();

  const code = h('div', { class: 'code gap-code' },
    h('div', { class: 'code-head' }, h('span', {}, LANG_FILE[ctx.lang]), h('span', {}, useBank ? t('Bausteine antippen', 'Tap the pieces') : t('In die Lücken tippen', 'Tap into the gaps'))),
    pre);

  return {
    el: h('div', {}, prompt(step.prompt), code, bankEl),
    focus: () => { if (!useBank) gapEls[0]?.focus(); },
    async check() {
      locked = true;
      let ok = true;
      values.forEach((v, i) => {
        const right = gapAnswers[i].some(a => normGap(a) === normGap(v ?? ''));
        if (!right) ok = false;
        gapEls[i].classList.add(right ? 'is-right' : 'is-wrong');
        if (!useBank) gapEls[i].readOnly = true;
      });
      const solution = step.code.replace(GAP, (_, n) => gapAnswers[Number(n)][0]);
      let html = ok ? '' : t(`<p>So ist es richtig:</p><pre>${escapeHtml(solution)}</pre>`, `<p>This is correct:</p><pre>${escapeHtml(solution)}</pre>`);
      if (step.explain) html += `<p>${inline(step.explain)}</p>`;
      return { ok, html };
    },
  };
}

/* ---------------------------------------------------------------- order */

function orderLines(step, ctx) {
  const all = [...step.lines.map((text, i) => ({ text, i })), ...(step.distractors || []).map(text => ({ text, i: -1 }))];
  let pool = shuffle(all);
  // Nicht zufaellig schon richtig sortiert anzeigen
  if (pool.every((x, n) => x.i === n) && pool.length > 1) pool = [...pool.slice(1), pool[0]];
  const answer = [];
  const area = h('div', { class: 'order-area', 'aria-label': t('Dein Programm', 'Your program') });
  const poolEl = h('div', { class: 'order-pool', 'aria-label': t('Verfügbare Zeilen', 'Available lines') });
  let locked = false;

  function render() {
    area.innerHTML = '';
    poolEl.innerHTML = '';
    answer.forEach((item, n) => area.append(h('button', {
      type: 'button', class: 'line-btn', 'aria-label': t(`Zeile ${n + 1}: ${item.text.trim()}. Antippen zum Entfernen`, `Line ${n + 1}: ${item.text.trim()}. Tap to remove`),
      onclick: () => { if (locked) return; answer.splice(n, 1); pool.push(item); render(); },
      html: highlight(item.text, ctx.lang),
    })));
    pool.forEach((item, n) => poolEl.append(h('button', {
      type: 'button', class: 'line-btn', 'aria-label': t(`Zeile hinzufügen: ${item.text.trim()}`, `Add line: ${item.text.trim()}`),
      onclick: () => { if (locked) return; pool.splice(n, 1); answer.push(item); render(); },
      html: highlight(item.text, ctx.lang),
    })));
    ctx.setReady(answer.length === step.lines.length);
  }
  render();

  return {
    el: h('div', {}, prompt(step.prompt), area, h('p', { class: 'eyebrow' }, t('Zeilen', 'Lines')), poolEl),
    async check() {
      locked = true;
      const ok = answer.length === step.lines.length && answer.every((item, n) => item.text === step.lines[n]);
      [...area.children].forEach((btn, n) => btn.classList.add(answer[n].text === step.lines[n] ? 'is-right' : 'is-wrong'));
      let html = ok ? '' : t(`<p>Richtige Reihenfolge:</p><pre>${escapeHtml(step.lines.join('\n'))}</pre>`, `<p>Correct order:</p><pre>${escapeHtml(step.lines.join('\n'))}</pre>`);
      if (step.explain) html += `<p>${inline(step.explain)}</p>`;
      return { ok, html };
    },
  };
}

/* ---------------------------------------------------------------- fix / write */

export function consolePanel() {
  const head = h('div', { class: 'console-head' }, h('span', {}, t('Ausgabe', 'Output')), h('span', {}, ''));
  const pre = h('pre', {}, h('span', { class: 'is-dim' }, t('Noch nichts ausgeführt.', 'Nothing run yet.')));
  const hint = h('div', { class: 'console-hint', hidden: true });
  const el = h('div', { class: 'console', 'aria-live': 'polite' }, head, pre, hint);
  return {
    el,
    running(tool) {
      el.classList.add('is-running');
      head.lastChild.textContent = tool || '';
      pre.innerHTML = t(`<span class="is-dim">${tool && tool.includes('Compiler') ? 'Kompiliere und starte ...' : 'Läuft ...'}</span>\n`, `<span class="is-dim">${tool && tool.includes('Compiler') ? 'Compiling and starting ...' : 'Running ...'}</span>\n`);
      hint.hidden = true;
    },
    show(res, lang) {
      el.classList.remove('is-running');
      const info = describeRun(res, lang);
      head.firstChild.textContent = info.label || t('Ausgabe', 'Output');
      head.lastChild.textContent = res.tool || '';
      pre.innerHTML = '';
      if (info.isError) {
        if (info.stdout) pre.append(h('span', {}, info.stdout + '\n'));
        pre.append(h('span', { class: 'is-err' }, (info.errText || info.text || '').trim() || t('(keine Ausgabe)', '(no output)')));
      } else {
        pre.append(info.text ? h('span', {}, info.text) : h('span', { class: 'is-dim' }, t('(keine Ausgabe)', '(no output)')));
        if (res.compileLog && /warning/i.test(res.compileLog)) pre.append(h('span', { class: 'is-dim' }, t(`\n\nCompiler-Warnung:\n${res.compileLog}`, `\n\nCompiler warning:\n${res.compileLog}`)));
      }
      hint.hidden = !info.hint;
      if (info.hint) hint.innerHTML = t(`<strong>Hinweis:</strong> ${inline(info.hint)}`, `<strong>Hint:</strong> ${inline(info.hint)}`);
      return info;
    },
  };
}

function codeTask(step, ctx) {
  const lang = ctx.lang;
  const out = consolePanel();
  let busy = false;

  const editor = createEditor({
    value: step.code || '',
    lang,
    minLines: Math.max(5, (step.code || '').split('\n').length + 1),
    onChange: () => ctx.setReady(editor && editor.value.trim().length > 0),
    onRun: () => run(),
    label: step.type === 'fix' ? t('Code zum Reparieren', 'Code to fix') : t('Dein Code', 'Your code'),
  });

  const sampleIn = step.stdin || step.tests?.[0]?.stdin || '';
  const manyTests = (step.tests?.length || 0) > 1;

  async function run() {
    if (busy) return;
    busy = true;
    const status = await getStatus();
    out.running(lang === 'cpp' ? status.cpp?.version || 'Compiler' : status.python?.version);
    const res = await runCode(lang, editor.value, sampleIn, { quietInput: true });
    const info = out.show(res, lang);
    editor.markLine(info.line);
    busy = false;
  }

  const runBtn = h('button', { type: 'button', class: 'btn btn-small', onclick: run }, h('span', { html: icon('run', 16) }), t('Ausführen', 'Run'));
  const resetBtn = h('button', { type: 'button', class: 'btn btn-small', onclick: () => { editor.setValue(step.code || ''); editor.focus(); } },
    h('span', { html: icon('reset', 16) }), t('Zurücksetzen', 'Reset'));
  const bar = h('div', { class: 'ed-bar' }, runBtn, resetBtn,
    sampleIn ? h('span', { class: 'ed-stdin' }, `${manyTests ? t('Beispiel-Eingabe', 'Sample input') : t('Eingabe beim Testen', 'Input when checking')}: ${sampleIn.replace(/\n/g, ' | ')}${manyTests ? t(` (geprüft mit ${step.tests.length} Eingaben)`, ` (checked with ${step.tests.length} inputs)`) : ''}`) : null,
    h('span', { class: 'hint-key' }, t('Strg+Enter: Ausführen', 'Ctrl+Enter: run')));

  ctx.setReady((step.code || '').trim().length > 0);

  return {
    el: h('div', {}, prompt(step.prompt), editor.el, bar, out.el),
    focus: () => editor.focus(),
    editor,
    keepOnFail: true,
    solution: step.solution,
    async check() {
      const status = await getStatus();
      out.running(lang === 'cpp' ? status.cpp?.version || 'Compiler' : status.python?.version);
      const res = await validateCode(step, editor.value, lang);
      if (res.run) {
        const info = out.show(res.run, lang);
        editor.markLine(info.line);
      } else {
        out.el.classList.remove('is-running');
        out.el.querySelector('pre').innerHTML = t('<span class="is-dim">Nicht ausgeführt, die Regeln der Aufgabe sind noch nicht erfüllt.</span>', '<span class="is-dim">Not run, the rules of this task are not met yet.</span>');
      }
      return res;
    },
  };
}

/* ---------------------------------------------------------------- Verteiler */

const RENDERERS = {
  concept,
  mc: multipleChoice,
  predict: predictOutput,
  fill: fillGaps,
  order: orderLines,
  fix: codeTask,
  write: codeTask,
};

export function renderExercise(step, ctx) {
  const render = RENDERERS[step.type];
  if (!render) throw new Error(t(`Unbekannter Übungstyp: ${step.type}`, `Unknown exercise type: ${step.type}`));
  return render(step, ctx);
}
