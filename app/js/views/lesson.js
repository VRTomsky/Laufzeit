// Lektions-Runner: zeigt Schritt fuer Schritt, prueft, gibt Feedback, wiederholt Fehler, vergibt XP.
// Modi: 'lesson' (eine Lektion), 'training' (gemischt, gewichtet), 'test' (Abschnittstest)

import { t, locale } from '../i18n.js';
import { setGuard, clearGuard } from '../guard.js';
import { h, inline, formatDuration, toast, confirmDialog, shuffle } from '../util.js';
import { icon, solidIcon } from '../icons.js';
import { bit } from '../mascot.js';
import { store } from '../store.js';
import { COURSES, findLesson, lessonStates } from '../content/index.js';
import { completeSession, recordAnswer } from '../gamification.js';
import { renderExercise, KIND_LABEL } from './exercises.js';
import { generate, hasGenerators } from '../content/generators.js';

const MAX_RETRIES = 2;
const PRAISE = [t('Super!', 'Great!'), t('Richtig!', 'Correct!'), t('Stark!', 'Strong!'), t('Genau so!', 'Exactly!'), t('Sauber!', 'Clean!'), t('Klasse!', 'Nice!')];
const STREAK_PRAISE = { 3: t('3 in Folge richtig', '3 in a row'), 5: t('5 in Folge richtig', '5 in a row'), 8: t('8 in Folge, läuft bei dir', '8 in a row, you\'re on fire'), 12: t('12 in Folge, Profi-Niveau', '12 in a row, pro level') };

const isCodeStep = s => s.type === 'write' || s.type === 'fix';

/** Lektion starten. mode: 'auto' (erstes Mal Original, danach Varianten) oder 'gold' */
export function startLesson(id, mode = 'auto') {
  const found = findLesson(id);
  if (!found) { location.hash = '#/pfad'; return; }
  const lang = found.course.id;
  if (store.state.activeLang !== lang) store.update(s => { s.activeLang = lang; });
  if (lessonStates(lang, store.state).get(id) === 'locked') {
    toast(t('Noch gesperrt', 'Still locked'), t('Schließ zuerst die Lektionen davor ab.', 'Finish the lessons before this one first.'));
    location.hash = '#/pfad';
    return;
  }
  const { unit, index, lesson } = found;
  const rec = store.state.langs[lang].lessons[id];
  const originals = lesson.steps.map((step, i) => ({ ...step, key: `${id}#${i}` }));
  const exercisesOnly = shuffle(originals.filter(s => s.type !== 'concept'));
  const canGenerate = hasGenerators(unit.id);
  let steps;
  let gold = false;

  if (mode === 'gold' && rec?.done) {
    // Gold: schwere neue Aufgaben, dazu eine Original-Code-Aufgabe
    gold = true;
    const generated = canGenerate ? generate(unit.id, lang, { count: 7, upto: index + 1, focus: index + 1, hard: true, code: 2 }) : [];
    const own = exercisesOnly.filter(isCodeStep).slice(0, 1);
    const fill = exercisesOnly.filter(s => !isCodeStep(s)).slice(0, Math.max(0, 8 - generated.length - own.length));
    steps = shuffle([...generated, ...own, ...fill]);
  } else if (rec?.done) {
    // Wiederholung: keine Erklaerkarten, ueber die Haelfte neue Aufgaben
    const n = exercisesOnly.length;
    const generated = canGenerate ? generate(unit.id, lang, { count: Math.ceil(n * 0.6), upto: index + 1, focus: index + 1, code: 1 }) : [];
    const keep = exercisesOnly.slice(0, Math.max(2, n - generated.length));
    steps = shuffle([...generated, ...keep]);
  } else {
    steps = originals;
  }

  runSession({
    mode: 'lesson', lang, lessonId: id, gold, maxMistakes: gold ? 1 : null,
    title: lesson.title,
    steps,
  });
}

/** Alle Uebungen (ohne Erklaerkarten) der abgeschlossenen Lektionen, mit Gewicht fuer Fehler */
export function buildTrainingPool(lang, state = store.state, unitFilter = null) {
  const pool = [];
  for (const unit of COURSES[lang].units) {
    if (unitFilter && unit.id !== unitFilter) continue;
    for (const lesson of unit.lessons) {
      if (!unitFilter && !state.langs[lang].lessons[lesson.id]?.done) continue;
      lesson.steps.forEach((step, i) => {
        if (step.type === 'concept') return;
        const key = `${lesson.id}#${i}`;
        pool.push({ ...step, key, weight: 1 + 3 * (state.mistakes[key] || 0) });
      });
    }
  }
  return pool;
}

function weightedPick(pool, size) {
  const rest = [...pool];
  const picked = [];
  while (picked.length < size && rest.length) {
    const total = rest.reduce((sum, s) => sum + s.weight, 0);
    let r = Math.random() * total;
    const index = rest.findIndex(s => (r -= s.weight) <= 0);
    picked.push(rest.splice(index < 0 ? 0 : index, 1)[0]);
  }
  return picked;
}

export function startTraining() {
  const lang = store.state.activeLang;
  const pool = buildTrainingPool(lang);
  if (pool.length === 0) { location.hash = '#/training'; return; }
  // Halb gewichtete Originale (Fehler zuerst), halb neue Varianten aus geschafften Abschnitten
  const doneUnits = COURSES[lang].units.filter(u => u.lessons.some(l => store.state.langs[lang].lessons[l.id]?.done) && hasGenerators(u.id));
  const generated = [];
  for (let i = 0; i < 4 && doneUnits.length; i++) {
    const unit = doneUnits[Math.floor(Math.random() * doneUnits.length)];
    const upto = unit.lessons.filter(l => store.state.langs[lang].lessons[l.id]?.done).length;
    generated.push(...generate(unit.id, lang, { count: 1, upto, code: i === 0 ? 1 : 0 }));
  }
  runSession({ mode: 'training', lang, title: 'Training', steps: shuffle([...weightedPick(pool, 8 - generated.length), ...generated]) });
}

/** Ist jede Lektion eines Abschnitts auf Gold? */
export function unitLessonsGold(lang, unit, state = store.state) {
  return unit.lessons.every(l => state.langs[lang].lessons[l.id]?.gold);
}

export function startUnitTest(unitId, mode = 'normal') {
  for (const course of Object.values(COURSES)) {
    const unitIndex = course.units.findIndex(u => u.id === unitId);
    if (unitIndex < 0) continue;
    const unit = course.units[unitIndex];
    const lang = course.id;
    const allDone = unit.lessons.every(l => store.state.langs[lang].lessons[l.id]?.done);
    if (!allDone) {
      toast(t('Test noch gesperrt', 'Test still locked'), t('Schließ zuerst alle Lektionen dieses Abschnitts ab.', 'Finish all lessons in this unit first.'));
      location.hash = '#/pfad';
      return;
    }
    const gold = mode === 'gold';
    if (gold && !unitLessonsGold(lang, unit)) {
      toast(t('Gold-Prüfung noch gesperrt', 'Gold test still locked'), t('Hol dir zuerst in jeder Lektion dieses Abschnitts Gold.', 'Get gold in every lesson of this unit first.'));
      location.hash = '#/pfad';
      return;
    }
    if (store.state.activeLang !== lang) store.update(s => { s.activeLang = lang; });
    const pool = shuffle(buildTrainingPool(lang, store.state, unitId));
    const canGenerate = hasGenerators(unitId);
    let steps;
    if (gold) {
      const generated = canGenerate ? generate(unitId, lang, { count: 10, hard: true, code: 3 }) : [];
      const own = pool.filter(isCodeStep).slice(0, 2);
      steps = shuffle([...generated, ...own, ...pool.filter(s => !isCodeStep(s)).slice(0, Math.max(0, 12 - generated.length - own.length))]);
    } else {
      // Ueberwiegend neue Aufgaben, die in den Lektionen so nicht vorkamen
      const generated = canGenerate ? generate(unitId, lang, { count: 6, code: 2 }) : [];
      const code = pool.filter(isCodeStep).slice(0, 1);
      const quick = pool.filter(s => !isCodeStep(s)).slice(0, 10 - generated.length - code.length);
      steps = shuffle([...generated, ...code, ...quick]);
    }
    runSession({ mode: 'test', lang, unitId, gold, maxMistakes: gold ? 2 : null, title: t(`${gold ? 'Gold-Prüfung' : 'Test'}: ${unit.title}`, `${gold ? 'Gold test' : 'Test'}: ${unit.title}`), steps });
    return;
  }
  location.hash = '#/pfad';
}

/** Einstufungstest: eine Frage pro Abschnitt, Abbruch nach zwei Fehlern. onDone(anzahlRichtig) */
export function startPlacement(lang, onDone, onCancel) {
  const course = COURSES[lang];
  const steps = [];
  course.units.slice(0, 10).forEach(unit => {
    const pool = unit.lessons.flatMap(l => l.steps.map((s, i) => ({ ...s, key: `${l.id}#${i}` })))
      .filter(s => ['mc', 'predict', 'fill', 'order'].includes(s.type));
    if (pool.length) steps.push(shuffle(pool)[0]);
  });
  runSession({ mode: 'placement', lang, title: t('Einstufungstest', 'Placement test'), steps, onDone, onCancel });
}

function runSession(cfg) {
  const app = document.getElementById('app');
  app.innerHTML = '';
  document.body.dataset.lang = cfg.lang;

  // _sid: eindeutige Nummer pro Aufgabe in dieser Runde (generierte Aufgaben teilen sich sonst Schluessel)
  const queue = cfg.steps.map((step, i) => ({ step: { ...step, _sid: i }, attempt: 0 }));
  const firstTry = new Map();
  const exercises = cfg.steps.filter(s => s.type !== 'concept').length;
  const startedAt = Date.now();
  let pos = 0;
  let current = null;
  let ready = false;
  let phase = 'answer';      // 'answer' | 'feedback' | 'busy'
  let keyHandler = null;
  let combo = 0;
  let solved = 0;
  let strikes = 0;
  let stopAfter = false;
  const placement = cfg.mode === 'placement';

  /* ----- Grundgeruest */
  const fill = h('span', { class: 'pbar-fill' });
  const modeEl = h('span', { class: `lesson-mode${cfg.gold ? ' is-gold' : ''}` }, placement ? t('Einstufung', 'Placement') : cfg.gold ? t(`Gold · ${cfg.maxMistakes} Fehler frei`, `Gold · ${cfg.maxMistakes} mistakes left`) : cfg.mode === 'test' ? 'Test' : cfg.mode === 'training' ? 'Training' : '');
  let misses = 0;
  const comboEl = h('span', { class: 'combo', 'aria-live': 'polite' });
  const progress = h('div', { class: 'pbar', role: 'progressbar', 'aria-label': t('Fortschritt', 'Progress'), 'aria-valuemin': '0' }, fill, comboEl);
  const reviewBtn = h('button', { type: 'button', class: 'icon-btn review-btn', 'aria-label': t('Vorige Fragen ansehen', 'Look at previous questions'), title: t('Vorige Fragen ansehen', 'Look at previous questions'), html: icon('back', 24), disabled: true, onclick: () => openReview() });
  const top = h('div', { class: 'lesson-top' },
    h('button', { type: 'button', class: 'icon-btn', 'aria-label': t('Verlassen', 'Leave'), html: icon('close', 26), onclick: leave }),
    reviewBtn,
    progress,
    modeEl);
  const body = h('main', { class: 'lesson-body' });
  const footInner = h('div', { class: 'foot-inner' });
  const foot = h('footer', { class: 'lesson-foot' }, footInner);
  const screen = h('div', { class: 'lesson', 'data-lang': cfg.lang }, top, body, foot);
  app.append(screen);

  // Zurueck-Navigation (Browser-Knopf, Rechtsklick > Zurueck) fragt erst nach
  if (!placement) setGuard();
  // Kontextmenue in der Lektion aus, ausser in Eingabefeldern (Kopieren/Einfuegen)
  screen.addEventListener('contextmenu', e => {
    if (!e.target.closest('textarea, input, pre, code')) e.preventDefault();
  });

  // Tastatur: Enter prueft bzw. geht weiter, Zahlentasten waehlen bei Multiple Choice
  document.addEventListener('keydown', globalKeys);
  function globalKeys(e) {
    if (!document.body.contains(screen)) { document.removeEventListener('keydown', globalKeys); return; }
    if (document.querySelector('dialog[open]')) return;
    if (reviewing) {
      if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); closeReview(); }
      else if (e.key === 'ArrowLeft') reviewMove(-1);
      else if (e.key === 'ArrowRight') reviewMove(1);
      return;
    }
    const t = e.target;
    const typing = t.tagName === 'TEXTAREA' || t.tagName === 'INPUT';
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      if (t.tagName === 'TEXTAREA' && !(e.ctrlKey || e.metaKey)) return;
      if (t.tagName === 'A') return;
      if (t.tagName === 'BUTTON' && !t.closest('.lesson-foot') && phase === 'answer') return;
      e.preventDefault();
      primary();
      return;
    }
    if (phase === 'answer' && !typing) keyHandler?.(e);
  }

  async function leave() {
    if (placement) {
      if (await confirmDialog({ title: t('Einstufung abbrechen?', 'Cancel the placement test?'), text: t('Du kannst danach einfach von vorne anfangen.', 'You can simply start over afterwards.'), ok: t('Abbrechen', 'Cancel'), cancel: t('Weitermachen', 'Keep going'), danger: true })) {
        document.removeEventListener('keydown', globalKeys);
        clearGuard();
        cfg.onCancel?.();
      }
      return;
    }
    const started = pos > 0 || solved > 0;
    if (started && !(await confirmDialog({ title: t('Wirklich aufhören?', 'Really stop?'), text: t('Dein Fortschritt in dieser Runde geht verloren. XP gibt es erst am Ende.', 'Your progress in this round will be lost. XP is only awarded at the end.'), ok: t('Aufhören', 'Stop'), cancel: t('Weiterlernen', 'Keep learning'), danger: true }))) return;
    clearGuard();
    location.hash = cfg.mode === 'training' ? '#/training' : '#/pfad';
  }

  function renderProgress() {
    const pct = Math.round((pos / queue.length) * 100);
    fill.style.width = `${Math.max(pct, 2)}%`;
    progress.setAttribute('aria-valuenow', String(pos));
    progress.setAttribute('aria-valuemax', String(queue.length));
  }

  function showCombo() {
    const text = STREAK_PRAISE[combo];
    if (!text) return;
    comboEl.textContent = text;
    comboEl.classList.remove('is-on');
    void comboEl.offsetWidth;
    comboEl.classList.add('is-on');
  }

  /* ----- Fusszeile */
  const checkBtn = h('button', { type: 'button', class: 'btn btn-go', onclick: () => primary() }, t('Prüfen', 'Check'));
  const skipBtn = h('button', { type: 'button', class: 'btn btn-ghost', onclick: () => skip() }, t('Überspringen', 'Skip'));

  function setReady(value) {
    ready = value;
    if (phase === 'answer') checkBtn.disabled = !ready;
  }

  function footIdle(step) {
    foot.className = 'lesson-foot';
    footInner.innerHTML = '';
    const isConcept = step.type === 'concept';
    checkBtn.textContent = isConcept ? t('Weiter', 'Continue') : t('Prüfen', 'Check');
    checkBtn.disabled = !ready;
    footInner.append(
      h('div', { class: 'foot-left' }, isConcept ? h('span', { class: 'foot-hint' }, t('Enter: weiter', 'Enter: continue')) : skipBtn),
      h('div', { class: 'foot-actions' }, checkBtn));
  }

  function footFeedback(res) {
    phase = 'feedback';
    lastResult = res;
    foot.className = `lesson-foot ${res.ok ? 'is-ok' : 'is-bad'}`;
    footInner.innerHTML = '';
    const title = res.ok
      ? (res.title && res.title !== t('Richtig.', 'Correct.') ? res.title : PRAISE[Math.floor(Math.random() * PRAISE.length)])
      : (res.title && res.title !== t('Nicht ganz.', 'Not quite.') ? res.title : t('Nicht ganz.', 'Not quite.'));
    const fb = h('div', { class: 'feedback', role: 'status' },
      h('span', { class: 'fb-icon', html: icon(res.ok ? 'check' : 'cross', 30) }),
      h('div', { class: 'fb-text' },
        h('h3', {}, title),
        res.html ? h('div', { class: 'feedback-detail', html: res.html }) : null));

    const actions = h('div', { class: 'foot-actions' });
    if (!res.ok && current.keepOnFail) {
      const again = h('button', { type: 'button', class: 'btn btn-bad', onclick: () => backToEditing() }, t('Weiter bearbeiten', 'Keep editing'));
      actions.append(
        current.solution ? h('button', { type: 'button', class: 'btn btn-ghost', onclick: () => { current.editor.setValue(current.solution); backToEditing(); } }, t('Lösung zeigen', 'Show solution')) : null,
        again);
      setTimeout(() => again.focus(), 30);
    } else {
      const next = h('button', { type: 'button', class: `btn ${res.ok ? 'btn-go' : 'btn-bad'}`, onclick: () => advance() }, t('Weiter', 'Continue'));
      actions.append(next);
      setTimeout(() => next.focus(), 30);
    }
    footInner.append(fb, actions);
  }

  function backToEditing() {
    phase = 'answer';
    footIdle(queue[pos].step);
    checkBtn.disabled = false;
    current.focus?.();
  }

  /* ----- Rueckschau: beantwortete Fragen nur ansehen */
  const answered = [];          // { node, ok, title, html, kind }
  let lastResult = null;
  let reviewing = false;
  let reviewIndex = 0;
  let saved = null;

  function snapshot(ok, res) {
    const live = body.firstElementChild;
    if (!live) return;
    const node = live.cloneNode(true);
    // Werte aus Eingabefeldern mitnehmen (cloneNode kopiert sie nicht)
    const src = live.querySelectorAll('textarea, input');
    node.querySelectorAll('textarea, input').forEach((el, i) => {
      el.value = src[i]?.value ?? '';
      el.readOnly = true;
      el.tabIndex = -1;
    });
    node.querySelectorAll('button, [contenteditable]').forEach(el => {
      el.disabled = true;
      el.removeAttribute('contenteditable');
      el.tabIndex = -1;
    });
    node.setAttribute('inert', '');
    answered.push({ node, ok, title: res?.title, html: res?.html || '' });
    reviewBtn.disabled = false;
  }

  function paintReview() {
    const item = answered[reviewIndex];
    body.innerHTML = '';
    body.append(h('div', { class: 'review-banner' },
      h('span', {}, t(`Frage ${reviewIndex + 1} von ${answered.length}, nur zum Ansehen`, `Question ${reviewIndex + 1} of ${answered.length}, view only`))),
    item.node);
    foot.className = `lesson-foot is-review ${item.ok ? 'is-ok' : 'is-bad'}`;
    footInner.innerHTML = '';
    footInner.append(
      h('div', { class: 'feedback', role: 'status' },
        h('span', { class: 'fb-icon', html: icon(item.ok ? 'check' : 'cross', 30) }),
        h('div', { class: 'fb-text' },
          h('h3', {}, item.ok ? t('Richtig beantwortet', 'Answered correctly') : item.skipped ? t('Übersprungen', 'Skipped') : t('Falsch beantwortet', 'Answered incorrectly')),
          item.html ? h('div', { class: 'feedback-detail', html: item.html }) : null)),
      h('div', { class: 'foot-actions review-actions' },
        h('button', { type: 'button', class: 'btn btn-ghost', disabled: reviewIndex === 0, onclick: () => reviewMove(-1) }, t('‹ Vorige', '‹ Previous')),
        h('button', { type: 'button', class: 'btn btn-ghost', disabled: reviewIndex === answered.length - 1, onclick: () => reviewMove(1) }, t('Nächste ›', 'Next ›')),
        h('button', { type: 'button', class: 'btn btn-sky', onclick: () => closeReview() }, t('Zurück zur Aufgabe', 'Back to the task'))));
    window.scrollTo({ top: 0 });
  }

  function openReview() {
    if (!answered.length || reviewing || phase === 'busy') return;
    reviewing = true;
    saved = { body: [...body.childNodes], foot: [...footInner.childNodes], footClass: foot.className, scroll: window.scrollY };
    reviewIndex = answered.length - 1;
    reviewBtn.classList.add('is-on');
    paintReview();
  }

  function reviewMove(d) {
    const next = reviewIndex + d;
    if (next < 0 || next >= answered.length) return;
    reviewIndex = next;
    paintReview();
  }

  function closeReview() {
    if (!reviewing) return;
    reviewing = false;
    reviewBtn.classList.remove('is-on');
    body.replaceChildren(...saved.body);
    footInner.replaceChildren(...saved.foot);
    foot.className = saved.footClass;
    window.scrollTo({ top: saved.scroll });
    if (phase === 'answer') setTimeout(() => current.focus?.(), 30);
    saved = null;
  }

  /* ----- Ablauf */
  function show() {
    const item = queue[pos];
    const step = item.step;
    phase = 'answer';
    ready = false;
    keyHandler = null;
    current = renderExercise(step, { lang: cfg.lang, setReady, onKey: fn => { keyHandler = fn; } });
    body.innerHTML = '';
    const kind = item.attempt > 0 ? t('Nochmal', 'Again') : KIND_LABEL[step.type];
    body.append(h('section', { class: `step step-${step.type}` },
      h('p', { class: 'step-kind' }, item.attempt > 0 ? h('span', { class: 'kind-again' }, t('Fehler von vorhin', 'Mistake from earlier')) : null, kind),
      current.el));
    renderProgress();
    footIdle(step);
    window.scrollTo({ top: 0 });
    setTimeout(() => current.focus?.(), 40);
  }

  function record(item, ok) {
    if (placement) {
      if (!ok) strikes += 1;
      if (strikes >= 2) stopAfter = true;
      return;
    }
    const key = item.step.key;
    const sid = item.step._sid;
    if (!firstTry.has(sid)) {
      firstTry.set(sid, ok);
      if (key) recordAnswer(key, ok);
      if (!ok) misses += 1;
      if (cfg.gold) {
        const left = cfg.maxMistakes - misses;
        modeEl.textContent = left >= 0 ? t(`Gold · ${left} Fehler frei`, `Gold · ${left} mistakes left`) : t('Gold verpasst', 'Gold missed');
        modeEl.classList.toggle('is-lost', left < 0);
      }
    } else if (ok && key) {
      recordAnswer(key, true);
    }
  }

  async function primary() {
    if (phase === 'busy') return;
    if (phase === 'feedback') {
      footInner.querySelector('.foot-actions .btn:last-child')?.click();
      return;
    }
    if (!ready) return;
    const item = queue[pos];
    if (item.step.type === 'concept') { advance(); return; }

    phase = 'busy';
    checkBtn.disabled = true;
    checkBtn.textContent = item.step.type === 'fix' || item.step.type === 'write' ? t('Läuft ...', 'Running ...') : t('Prüfen', 'Check');
    let res;
    try {
      res = await current.check();
    } catch (err) {
      res = { ok: false, title: t('Prüfung fehlgeschlagen', 'Check failed'), html: `<p>${inline(String(err.message || err))}</p>` };
    }

    record(item, res.ok);
    if (res.ok) {
      solved += 1;
      combo += 1;
      showCombo();
    } else {
      combo = 0;
    }
    if (!res.ok && !current.keepOnFail && !placement && item.attempt < MAX_RETRIES) {
      queue.push({ step: item.step, attempt: item.attempt + 1 });
      res.html = (res.html || '') + t('<p class="foot-hint">Die Aufgabe kommt am Ende nochmal.</p>', '<p class="foot-hint">This task comes back at the end.</p>');
    }
    footFeedback(res);
  }

  function skip() {
    if (phase !== 'answer') return;
    const item = queue[pos];
    record(item, false);
    snapshot(false, { html: '' });
    if (answered.length) answered[answered.length - 1].skipped = true;
    lastResult = null;
    combo = 0;
    if (!placement && item.attempt < MAX_RETRIES) queue.push({ step: item.step, attempt: item.attempt + 1 });
    advance();
  }

  function advance() {
    const item = queue[pos];
    if (item && item.step.type !== 'concept' && lastResult) snapshot(lastResult.ok, lastResult);
    lastResult = null;
    pos += 1;
    if (pos >= queue.length || stopAfter) finish();
    else show();
  }

  function finish() {
    document.removeEventListener('keydown', globalKeys);
    clearGuard();
    fill.style.width = '100%';
    if (placement) {
      setTimeout(() => cfg.onDone?.(solved), 250);
      return;
    }
    const correct = [...firstTry.values()].filter(Boolean).length;
    const accuracy = exercises ? correct / exercises : 1;
    const perfect = correct === exercises;
    const seconds = (Date.now() - startedAt) / 1000;
    const goldPassed = Boolean(cfg.gold) && misses <= cfg.maxMistakes;
    const summary = completeSession(cfg, { accuracy, perfect, exercises, goldPassed });
    setTimeout(() => renderFinish(cfg, summary, { accuracy, perfect, seconds, goldPassed, misses }), 250);
  }

  show();
}

function renderFinish(cfg, summary, stats) {
  const app = document.getElementById('app');
  app.innerHTML = '';
  let title = stats.perfect ? t('Fehlerfrei!', 'Flawless!') : cfg.mode === 'test' ? t('Test bestanden!', 'Test passed!') : cfg.mode === 'training' ? t('Training geschafft!', 'Training done!') : t('Lektion geschafft!', 'Lesson complete!');
  let sub = stats.perfect
    ? t('Keine einzige falsche Antwort. Genau so.', 'Not a single wrong answer. Exactly like that.')
    : stats.accuracy >= 0.8 ? t('Fast alles beim ersten Versuch.', 'Almost everything on the first try.') : t('Fehler gehören dazu. Das Training holt die wackeligen Aufgaben später zurück.', 'Mistakes are part of it. Training brings the shaky tasks back later.');
  if (cfg.gold) {
    title = stats.goldPassed ? (cfg.mode === 'test' ? t('Abschnitt vergoldet!', 'Unit turned gold!') : t('Gold geholt!', 'Gold earned!')) : stats.misses <= cfg.maxMistakes + 1 ? t('Knapp vorbei', 'So close') : t('Noch nicht Gold', 'Not gold yet');
    sub = stats.goldPassed
      ? (cfg.mode === 'test' ? t('Der ganze Abschnitt leuchtet jetzt golden. Das schaffen nur wenige.', 'The whole unit now shines gold. Only a few manage that.') : t(`Mit nur ${stats.misses} ${stats.misses === 1 ? 'Fehler' : 'Fehlern'} durch die schweren Aufgaben. Die Lektion ist jetzt golden.`, `Only ${stats.misses} ${stats.misses === 1 ? 'mistake' : 'mistakes'} through the hard tasks. The lesson is now gold.`))
      : t(`Für Gold sind höchstens ${cfg.maxMistakes} ${cfg.maxMistakes === 1 ? 'Fehler' : 'Fehler'} erlaubt, du hattest ${stats.misses}. Die XP bekommst du trotzdem. Beim nächsten Versuch kommen neue Aufgaben.`, `Gold allows at most ${cfg.maxMistakes} ${cfg.maxMistakes === 1 ? 'mistake' : 'mistakes'}, you had ${stats.misses}. You still get the XP. Next time you get new tasks.`);
  }
  const notes = [];
  if (summary.streakExtended) notes.push(summary.streak === 1 ? t('Neue Serie gestartet: Tag 1.', 'New streak started: day 1.') : t(`Serie verlängert: ${summary.streak} Tage in Folge.`, `Streak extended: ${summary.streak} days in a row.`));
  if (summary.goalReached) notes.push(t(`Tagesziel erreicht: ${summary.todayXp} XP.`, `Daily goal reached: ${summary.todayXp} XP.`));
  if (summary.allQuests) notes.push(t('Alle drei Tagesaufgaben erledigt.', 'All three daily quests done.'));

  const goldPart = cfg.gold ? '/gold' : '';
  const again = cfg.mode === 'lesson' ? `#/lektion/${cfg.lessonId}${goldPart}` : cfg.mode === 'test' ? `#/test/${cfg.unitId}${goldPart}` : '#/training/los';
  const back = cfg.mode === 'training' ? '#/training' : '#/pfad';
  const accLabel = stats.accuracy >= 0.95 ? t('Spitze', 'Top') : stats.accuracy >= 0.75 ? t('Gut', 'Good') : t('Treffer', 'Accuracy');

  const screen = h('div', { class: 'finish', 'data-lang': cfg.lang },
    h('div', { class: 'finish-inner' },
      cfg.gold && stats.goldPassed ? h('div', { class: 'gold-medal', html: solidIcon('crown', 54) }) : null,
      h('div', { class: 'finish-bit', html: bit({ size: 170, mood: cfg.gold && !stats.goldPassed ? 'think' : 'cheer' }) }),
      h('h1', {}, title),
      h('p', { class: 'finish-sub' }, sub),
      h('div', { class: 'score-row' },
        h('div', { class: 'score is-amber' }, h('span', {}, 'XP gesamt'), h('b', { html: `${solidIcon('bolt', 22)}+${summary.xp}` })),
        h('div', { class: 'score is-leaf' }, h('span', {}, accLabel), h('b', {}, `${Math.round(stats.accuracy * 100)} %`)),
        h('div', { class: 'score is-sky' }, h('span', {}, t('Zeit', 'Time')), h('b', {}, formatDuration(stats.seconds)))),
      notes.length ? h('div', { class: 'finish-notes' }, notes.map(n => h('p', {}, n))) : null,
      summary.badges.length ? h('div', { class: 'finish-badges' },
        summary.badges.map(b => h('div', {}, h('span', { class: 'seal' }, b.mark), h('div', {}, h('strong', {}, t(`Neues Abzeichen: ${b.name}`, `New badge: ${b.name}`)), h('p', {}, b.desc))))) : null),
    h('footer', { class: 'finish-foot' },
      h('div', { class: 'foot-inner' },
        h('a', { class: 'btn btn-ghost', href: again }, cfg.mode === 'lesson' ? t('Lektion wiederholen', 'Repeat lesson') : t('Nochmal', 'Again')),
        h('a', { class: 'btn btn-go', href: back }, t('Weiter', 'Continue')))));
  app.append(screen);
  // Gleiche URL erneut ansteuern: Hash kurz zuruecksetzen, damit hashchange feuert
  screen.querySelector(`a[href="${again}"]`).addEventListener('click', e => {
    if (location.hash === again) { e.preventDefault(); location.hash = '#/'; setTimeout(() => { location.hash = again; }, 0); }
  });
  const go = screen.querySelector('.btn-go');
  go.focus();
}
