// Projekte (echte Programme in mehreren Etappen) und freie Aufgaben (nur Beschreibung, versteckte Testfaelle)

import { h, md, inline, toast, confirmDialog } from '../util.js';
import { icon, solidIcon } from '../icons.js';
import { bit } from '../mascot.js';
import { store } from '../store.js';
import { COURSES } from '../content/index.js';
import { PROJECTS, CHALLENGES } from '../content/projects/index.js';
import { createEditor } from '../editor.js';
import { runCode, validateCode, getStatus } from '../runner.js';
import { awardXp } from '../gamification.js';
import { consolePanel } from './exercises.js';
import { mobileStats } from './shell.js';
import { unitColorVars } from './path.js';

const LEVEL_NAME = { 1: 'Einsteiger', 2: 'Fortgeschritten', 3: 'Profi' };
const LEVEL_XP = { 1: 10, 2: 20, 3: 35 };
const STEP_XP = 10;
const PROJECT_XP = 40;

/** Ist ein Abschnitt komplett geschafft (auch per Einstufung)? */
function unitComplete(lang, unitId) {
  if (!unitId) return true;
  const unit = COURSES[lang].units.find(u => u.id === unitId);
  return !unit || unit.lessons.every(l => store.state.langs[lang].lessons[l.id]?.done);
}

function unitLabel(lang, unitId) {
  const i = COURSES[lang].units.findIndex(u => u.id === unitId);
  return i < 0 ? '' : `Abschnitt ${i + 1} „${COURSES[lang].units[i].title}“`;
}

function findProject(id) {
  for (const lang of Object.keys(PROJECTS)) {
    const p = PROJECTS[lang].find(x => x.id === id);
    if (p) return { lang, project: p };
  }
  return null;
}

function findChallenge(id) {
  for (const lang of Object.keys(CHALLENGES)) {
    const c = CHALLENGES[lang].find(x => x.id === id);
    if (c) return { lang, challenge: c };
  }
  return null;
}

/* ---------------------------------------------------------------- Uebersicht */

export function renderProjects(main) {
  const s = store.state;
  const lang = s.activeLang;
  const course = COURSES[lang];
  const projects = PROJECTS[lang] || [];
  const challenges = CHALLENGES[lang] || [];
  const doneP = projects.filter(p => s.projects[p.id]?.done).length;
  const doneC = challenges.filter(c => s.challenges[c.id]).length;
  const page = h('div', { class: 'page page-wide' });
  main.append(mobileStats(), page);

  page.append(
    h('header', { class: 'page-head page-head-bit' },
      h('div', { html: bit({ size: 120, mood: 'think' }) }),
      h('div', {},
        h('p', { class: 'eyebrow' }, `Projekte · ${course.name}`),
        h('h1', {}, 'Selbst bauen'),
        h('p', { class: 'lede' }, 'Hier wirst du vom Lernenden zum Entwickler. Projekte führen dich Etappe für Etappe zu einem echten Programm. Freie Aufgaben haben keine Vorlage: nur eine Beschreibung und versteckte Testfälle.'))),
    h('div', { class: 'facts' },
      h('div', { class: 'fact' }, h('b', {}, `${doneP}/${projects.length}`), h('span', {}, 'Projekte fertig')),
      h('div', { class: 'fact' }, h('b', {}, `${doneC}/${challenges.length}`), h('span', {}, 'freie Aufgaben gelöst'))));

  // Projekte
  page.append(h('section', { class: 'section' },
    h('h2', {}, 'Projekte'),
    h('div', { class: 'proj-grid' }, projects.map((p, i) => {
      const rec = s.projects[p.id];
      const open = unitComplete(lang, p.unlockAfter);
      const pct = Math.round(((rec?.step || 0) / p.steps.length) * 100);
      const card = h(open ? 'a' : 'div', {
        class: `proj-card${open ? '' : ' is-locked'}${rec?.done ? ' is-done' : ''}`,
        href: open ? `#/projekt/${p.id}` : null,
        style: unitColorVars(i + 2),
      },
      h('div', { class: 'proj-top' }, h('span', { class: 'proj-icon', html: solidIcon(open ? (rec?.done ? 'checkBig' : 'code') : 'lockBig', 30) }), h('span', { class: 'proj-steps' }, `${p.steps.length} Etappen`)),
      h('h3', {}, p.title),
      h('p', {}, p.summary),
      open
        ? h('div', { class: 'qbar' }, h('span', { style: { width: `${pct}%` } }), h('b', {}, rec?.done ? 'fertig' : `${rec?.step || 0} / ${p.steps.length}`))
        : h('p', { class: 'proj-lock' }, `Frei nach ${unitLabel(lang, p.unlockAfter)}`));
      return card;
    }))));

  // Freie Aufgaben, nach Stufe
  for (const level of [1, 2, 3]) {
    const list = challenges.filter(c => c.level === level);
    if (!list.length) continue;
    page.append(h('section', { class: 'section' },
      h('h2', {}, `Freie Aufgaben: ${LEVEL_NAME[level]}`),
      h('ul', { class: 'chal-list' }, list.map(c => {
        const open = unitComplete(lang, c.unlockAfter);
        const solved = s.challenges[c.id];
        return h('li', {}, h(open ? 'a' : 'div', { class: `chal${open ? '' : ' is-locked'}${solved ? ' is-done' : ''}`, href: open ? `#/aufgabe/${c.id}` : null },
          h('span', { class: 'chal-mark', html: solved ? icon('check', 18) : open ? `<b>${LEVEL_XP[level]}</b>` : icon('lock', 16) }),
          h('span', { class: 'chal-text' }, h('b', {}, c.title), h('small', {}, open ? c.short : `Frei nach ${unitLabel(lang, c.unlockAfter)}`)),
          h('span', { class: 'chal-xp' }, solved ? 'gelöst' : `${LEVEL_XP[level]} XP`)));
      }))));
  }
}

/* ---------------------------------------------------------------- Arbeitsplatz */

/**
 * Gemeinsamer Arbeitsplatz fuer Projekt-Etappen und freie Aufgaben.
 * cfg: { lang, title, kicker, steps, index, draftKey, onPass(stepIndex), backHash }
 */
function workspace(cfg) {
  const app = document.getElementById('app');
  app.innerHTML = '';
  document.body.dataset.lang = cfg.lang;
  let index = cfg.index;
  let failed = 0;

  const out = consolePanel();
  const taskEl = h('div', { class: 'ws-task' });
  const stepsEl = h('ol', { class: 'ws-steps' });
  const feedback = h('div', { class: 'ws-feedback', 'aria-live': 'polite' });
  const editor = createEditor({
    value: '',
    lang: cfg.lang,
    minLines: 18,
    label: 'Dein Code',
    onRun: () => run(),
    onChange: value => { clearTimeout(saveTimer); saveTimer = setTimeout(() => store.update(s => { s.drafts[cfg.draftKey] = value; }), 400); },
  });
  let saveTimer = null;

  async function run() {
    const step = cfg.steps[index];
    const status = await getStatus();
    out.running(cfg.lang === 'cpp' ? status.cpp?.version || 'Compiler' : status.python?.version);
    const stdin = (step.tests && step.tests[0]?.stdin) || '';
    const res = await runCode(cfg.lang, editor.value, stdin);
    editor.markLine(out.show(res, cfg.lang).line);
  }

  const checkBtn = h('button', { type: 'button', class: 'btn btn-go', onclick: () => check() }, 'Prüfen');
  const runBtn = h('button', { type: 'button', class: 'btn btn-small', onclick: run }, h('span', { html: icon('run', 16) }), 'Ausführen');
  const solBtn = h('button', { type: 'button', class: 'btn btn-small', onclick: () => showSolution() }, 'Lösung');

  async function showSolution() {
    const ok = await confirmDialog({ title: 'Lösung ansehen?', text: 'Dein Code wird durch die Musterlösung ersetzt. Am meisten lernst du, wenn du vorher selbst probierst und die Tipps nutzt.', ok: 'Lösung zeigen' });
    if (ok) editor.setValue(cfg.steps[index].solution);
  }

  async function check() {
    const step = cfg.steps[index];
    checkBtn.disabled = true;
    checkBtn.textContent = 'Läuft ...';
    const status = await getStatus();
    out.running(cfg.lang === 'cpp' ? status.cpp?.version || 'Compiler' : status.python?.version);
    const res = await validateCode(step, editor.value, cfg.lang);
    if (res.run) editor.markLine(out.show(res.run, cfg.lang).line);
    else out.el.classList.remove('is-running');
    checkBtn.disabled = false;
    checkBtn.textContent = 'Prüfen';
    feedback.className = `ws-feedback ${res.ok ? 'is-ok' : 'is-bad'}`;
    feedback.innerHTML = '';
    feedback.append(h('h3', { html: `${icon(res.ok ? 'check' : 'cross', 22)} ${res.ok ? 'Geschafft!' : res.title || 'Noch nicht.'}` }),
      res.html ? h('div', { class: 'feedback-detail', html: res.html }) : null);
    if (!res.ok) {
      failed += 1;
      if (failed >= 2 && step.hint) feedback.append(h('p', { class: 'ws-hint', html: `<b>Tipp:</b> ${inline(step.hint)}` }));
      return;
    }
    failed = 0;
    const summary = cfg.onPass(index);
    if (summary?.badges?.length) summary.badges.forEach(b => toast(`Neues Abzeichen: ${b.name}`, b.desc, b.mark));
    if (index < cfg.steps.length - 1) {
      feedback.append(h('div', { class: 'row-actions' }, h('button', {
        type: 'button', class: 'btn btn-go', onclick: () => { index += 1; showStep(); },
      }, `Weiter zu Etappe ${index + 2}`)));
    } else {
      finishScreen(summary);
    }
  }

  function showStep() {
    const step = cfg.steps[index];
    failed = 0;
    feedback.className = 'ws-feedback';
    feedback.innerHTML = '';
    stepsEl.innerHTML = '';
    if (cfg.steps.length > 1) {
      cfg.steps.forEach((st, i) => stepsEl.append(h('li', { class: i < index ? 'is-done' : i === index ? 'is-now' : '' }, h('span', {}, i + 1), st.title)));
    }
    const tests = step.tests || [];
    taskEl.replaceChildren(
      h('p', { class: 'eyebrow' }, cfg.steps.length > 1 ? `Etappe ${index + 1} von ${cfg.steps.length}` : cfg.kicker),
      h('h2', {}, step.title),
      h('div', { class: 'concept-body', html: md(step.task) }),
      tests.length && tests[0].stdin != null && tests.some(t => t.stdin) ? h('div', { class: 'ws-example' },
        h('p', { class: 'eyebrow' }, 'Beispiel'),
        h('div', { class: 'diff' },
          h('div', {}, h('b', {}, 'Eingabe'), h('pre', {}, tests[0].stdin || '(keine)')),
          h('div', {}, h('b', {}, 'Ausgabe'), h('pre', {}, tests[0].expect)))) : null,
      tests.length > 1 ? h('p', { class: 'muted ws-tests' }, `Geprüft wird mit ${tests.length} Testfällen, auch mit anderen Eingaben als im Beispiel.`) : null,
      step.hint ? h('details', { class: 'ws-tip' }, h('summary', {}, 'Tipp anzeigen'), h('p', { html: inline(step.hint) })) : null);
    // Code: gespeicherter Stand, sonst Startcode dieser Etappe, sonst Code der vorigen Etappe weiterverwenden
    const draft = store.state.drafts[cfg.draftKey];
    if (index === cfg.index && draft != null) editor.setValue(draft);
    else if (step.starter != null) editor.setValue(step.starter);
    else if (!editor.value && index > 0) editor.setValue(cfg.steps[index - 1].solution);
    window.scrollTo({ top: 0 });
    editor.focus();
  }

  function finishScreen(summary) {
    const total = summary?.xp || 0;
    app.innerHTML = '';
    app.append(h('div', { class: 'finish', 'data-lang': cfg.lang },
      h('div', { class: 'finish-inner' },
        h('div', { class: 'finish-bit', html: bit({ size: 170, mood: 'cheer' }) }),
        h('h1', {}, cfg.steps.length > 1 ? 'Projekt fertig!' : 'Aufgabe gelöst!'),
        h('p', { class: 'finish-sub' }, cfg.steps.length > 1 ? `Du hast „${cfg.title}“ komplett selbst gebaut. Dein Code liegt im Projekt und lässt sich jederzeit weiter ausbauen.` : 'Ohne Vorlage, alle Testfälle bestanden. Genau so arbeiten Profis.'),
        h('div', { class: 'score-row is-two' },
          h('div', { class: 'score is-amber' }, h('span', {}, 'XP'), h('b', { html: `${solidIcon('bolt', 22)}+${total}` })),
          h('div', { class: 'score is-leaf' }, h('span', {}, 'Serie'), h('b', {}, `${summary?.streak || 0} ${summary?.streak === 1 ? 'Tag' : 'Tage'}`)))),
      h('footer', { class: 'finish-foot' }, h('div', { class: 'foot-inner' },
        h('a', { class: 'btn btn-ghost', href: '#/labor' }, 'Im Labor weiterbauen'),
        h('a', { class: 'btn btn-go', href: cfg.backHash }, 'Weiter')))));
    // Fertigen Code ins Labor uebernehmen, damit man direkt weiterbauen kann
    store.update(s => { s.lab[cfg.lang] = editor.value; });
  }

  const screen = h('div', { class: 'ws', 'data-lang': cfg.lang },
    h('header', { class: 'ws-top' },
      h('a', { class: 'icon-btn', href: cfg.backHash, 'aria-label': 'Zurück zur Übersicht', html: icon('close', 26) }),
      h('div', {}, h('p', { class: 'eyebrow' }, cfg.kicker), h('h1', {}, cfg.title)),
      h('span')),
    h('div', { class: 'ws-main' },
      h('aside', { class: 'ws-side' }, stepsEl, taskEl),
      h('section', { class: 'ws-code' },
        editor.el,
        h('div', { class: 'ed-bar' }, runBtn, solBtn, h('span', { class: 'hint-key' }, 'Strg+Enter: Ausführen')),
        h('div', { class: 'ws-actions' }, checkBtn),
        feedback,
        out.el)));
  app.append(screen);
  showStep();
}

export function startProject(id) {
  const found = findProject(id);
  if (!found) { location.hash = '#/projekte'; return; }
  const { lang, project } = found;
  if (!unitComplete(lang, project.unlockAfter)) { toast('Noch gesperrt', `Schließ zuerst ${unitLabel(lang, project.unlockAfter)} ab.`); location.hash = '#/projekte'; return; }
  if (store.state.activeLang !== lang) store.update(s => { s.activeLang = lang; });
  const rec = store.state.projects[id];
  const start = rec?.done ? 0 : Math.min(rec?.step || 0, project.steps.length - 1);
  workspace({
    lang,
    title: project.title,
    kicker: `Projekt · ${COURSES[lang].name}`,
    steps: project.steps,
    index: start,
    draftKey: `p:${id}`,
    backHash: '#/projekte',
    onPass: i => {
      const last = i === project.steps.length - 1;
      const already = store.state.projects[id]?.done;
      return awardXp(lang, already ? 2 : STEP_XP + (last ? PROJECT_XP : 0), s => {
        const r = s.projects[id] || { step: 0 };
        r.step = Math.max(r.step, i + 1);
        if (last) r.done = r.done || new Date().toISOString().slice(0, 10);
        s.projects[id] = r;
      });
    },
  });
}

export function startChallenge(id) {
  const found = findChallenge(id);
  if (!found) { location.hash = '#/projekte'; return; }
  const { lang, challenge } = found;
  if (!unitComplete(lang, challenge.unlockAfter)) { toast('Noch gesperrt', `Schließ zuerst ${unitLabel(lang, challenge.unlockAfter)} ab.`); location.hash = '#/projekte'; return; }
  if (store.state.activeLang !== lang) store.update(s => { s.activeLang = lang; });
  workspace({
    lang,
    title: challenge.title,
    kicker: `Freie Aufgabe · ${LEVEL_NAME[challenge.level]}`,
    steps: [{ title: challenge.title, task: challenge.task, starter: challenge.starter ?? (lang === 'cpp' ? '#include <iostream>\n\nint main() {\n    \n    return 0;\n}\n' : ''), tests: challenge.tests, must: challenge.must, mustNot: challenge.mustNot, solution: challenge.solution, hint: challenge.hint }],
    index: 0,
    draftKey: `c:${id}`,
    backHash: '#/projekte',
    onPass: () => {
      const already = store.state.challenges[id];
      return awardXp(lang, already ? 2 : LEVEL_XP[challenge.level], s => {
        s.challenges[id] = s.challenges[id] || new Date().toISOString().slice(0, 10);
      });
    },
  });
}
