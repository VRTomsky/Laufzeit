// Lernpfad: farbige Abschnitts-Banner, runde Lektions-Knoten im Zickzack, Abschnittstest am Ende

import { h, md, showModal } from '../util.js';
import { icon, solidIcon } from '../icons.js';
import { bit } from '../mascot.js';
import { store } from '../store.js';
import { COURSES, lessonStates, exerciseCount } from '../content/index.js';
import { courseProgress } from '../gamification.js';
import { mobileStats } from './shell.js';
import { highlight } from '../highlight.js';
import { GOALS, userGoals, unitGoals, missingCourseHint } from '../personalize.js';
import { PROJECTS, CHALLENGES } from '../content/projects/index.js';

const TRACK_W = 340;
const ROW = 108;
const TOP = 56;
const OFFSETS = [0, -44, -70, -44, 0, 44, 70, 44];     // seitlicher Versatz: ergibt die Zickzack-Linie
export const UNIT_COLORS = ['leaf', 'sky', 'violet', 'coral', 'teal', 'amber', 'rose'];
const MOODS = ['wave', 'think', 'happy', 'cheer'];

export function unitColorVars(index) {
  const c = UNIT_COLORS[index % UNIT_COLORS.length];
  return `--u: var(--${c}); --u-edge: var(--${c}-edge); --u-soft: var(--${c}-soft);`;
}

let openPop = null;
function closePop() {
  if (openPop) { openPop.remove(); openPop = null; }
}
document.addEventListener('click', e => {
  if (openPop && !e.target.closest('.pop') && !e.target.closest('.node')) closePop();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePop(); });

function popover(track, x, y, content, id, locked) {
  closePop();
  const left = Math.max(0, Math.min(TRACK_W - 280, x - 140));
  openPop = h('div', {
    class: `pop${locked ? ' is-locked' : ''}`,
    role: 'dialog',
    style: { left: `${left}px`, top: `${y + 50}px`, '--arrow': `${x - left}px` },
  }, content);
  openPop.dataset.id = id;
  track.append(openPop);
  openPop.querySelector('a')?.focus();
}

/** Leitfaden: alle Erklaerkarten eines Abschnitts zum Nachlesen, unten geht es weiter */
function openGuide(course, unit, unitIndex) {
  const cards = unit.lessons.flatMap(l => l.steps.filter(s => s.type === 'concept').map(s => ({ ...s, lesson: l.title })));
  const states = lessonStates(course.id, store.state);
  const open = unit.lessons.find(l => states.get(l.id) === 'current');
  const allDone = unit.lessons.every(l => states.get(l.id) === 'done');
  const nextUnit = course.units[unitIndex + 1];

  const actions = [];
  if (open) {
    const no = `${unitIndex + 1}.${unit.lessons.indexOf(open) + 1}`;
    actions.push(h('a', { class: 'btn btn-go', href: `#/lektion/${open.id}`, onclick: () => dlg.close() }, `Lektion ${no} starten`));
  } else if (allDone && !store.state.langs[course.id].tests[unit.id]) {
    actions.push(h('a', { class: 'btn btn-go', href: `#/test/${unit.id}`, onclick: () => dlg.close() }, 'Abschnittstest starten'));
  }
  if (nextUnit) {
    actions.push(h('button', { type: 'button', class: `btn ${actions.length ? 'btn-ghost' : 'btn-go'}`, onclick: () => { dlg.close(); openGuide(course, nextUnit, unitIndex + 1); } }, 'Nächster Leitfaden'));
  }
  actions.push(h('button', { type: 'button', class: 'btn btn-ghost', onclick: () => dlg.close() }, 'Schließen'));

  const dlg = h('dialog', { class: 'guide-dlg', style: unitColorVars(unitIndex) },
    h('header', {},
      h('div', {}, h('p', { class: 'eyebrow' }, `Leitfaden · Abschnitt ${unitIndex + 1}`), h('h2', {}, unit.title)),
      h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Leitfaden schließen', html: icon('close'), onclick: () => dlg.close() })),
    h('div', { class: 'guide-dlg-body' },
      cards.map(c => h('article', {},
        h('p', { class: 'eyebrow' }, c.lesson),
        h('h3', {}, c.title),
        h('div', { class: 'concept-body', html: md(c.body) }),
        c.code ? h('pre', { class: 'guide-code', html: highlight(c.code, course.id) }) : null,
        c.after ? h('div', { class: 'concept-body', html: md(c.after) }) : null)),
      h('footer', { class: 'guide-dlg-foot' },
        h('p', { class: 'muted' }, open ? 'Alles gelesen? Dann probier es direkt aus.' : allDone ? 'Diesen Abschnitt hast du geschafft.' : 'Die Lektionen dieses Abschnitts sind noch gesperrt.'),
        h('div', { class: 'row-actions' }, actions))));
  dlg.addEventListener('close', () => dlg.remove());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  showModal(dlg);
}

function renderUnit(course, unit, unitIndex, states, startIndex) {
  const s = store.state;
  const lessons = unit.lessons;
  const doneCount = lessons.filter(l => states.get(l.id) === 'done').length;
  const allDone = doneCount === lessons.length;
  const testDone = Boolean(s.langs[course.id].tests[unit.id]);
  const goldCount = lessons.filter(l => s.langs[course.id].lessons[l.id]?.gold).length;
  const lessonsGold = goldCount === lessons.length;
  const unitGold = lessonsGold && Boolean(s.langs[course.id].gold?.[unit.id]);
  const unitState = allDone ? 'done' : lessons.some(l => states.get(l.id) === 'current') ? 'active' : 'locked';

  const nodes = [...lessons.map(l => ({ kind: 'lesson', lesson: l })), { kind: 'test' }];
  const points = nodes.map((_, i) => ({ x: TRACK_W / 2 + OFFSETS[(startIndex + i) % OFFSETS.length], y: TOP + i * ROW }));
  const height = TOP + (nodes.length - 1) * ROW + 70;
  const track = h('div', { class: 'track', style: { height: `${height}px` } });

  nodes.forEach((node, i) => {
    const { x, y } = points[i];
    let status;
    let glyph;
    let label;
    let pop;
    let isGold = false;
    if (node.kind === 'lesson') {
      const lesson = node.lesson;
      status = states.get(lesson.id);
      const rec = s.langs[course.id].lessons[lesson.id];
      const prev = i > 0 ? lessons[i - 1] : unitIndex > 0 ? course.units[unitIndex - 1].lessons.at(-1) : null;
      isGold = Boolean(rec?.gold);
      glyph = isGold ? solidIcon('crown', 34) : status === 'done' ? solidIcon('checkBig', 34) : status === 'locked' ? solidIcon('lockBig', 30) : solidIcon('star', 34);
      label = `Lektion ${unitIndex + 1}.${i + 1}: ${lesson.title}`;
      pop = status === 'locked'
        ? [h('h3', {}, lesson.title), h('p', {}, `Schließ zuerst „${prev?.title}“ ab, um diese Lektion freizuschalten.`)]
        : [
          h('h3', {}, lesson.title),
          h('p', {}, `Lektion ${i + 1} von ${lessons.length} · ${exerciseCount(lesson)} Übungen`),
          h('p', { class: 'pop-goal' }, lesson.goal),
          h('a', { class: 'btn btn-pop', href: `#/lektion/${lesson.id}` }, status === 'current' ? 'Los geht’s' : rec ? 'Üben mit neuen Aufgaben' : 'Starten'),
          rec?.done ? h('a', { class: 'btn btn-pop is-gold', href: `#/lektion/${lesson.id}/gold` }, isGold ? 'Gold nochmal' : 'Gold holen') : null,
          rec?.done ? h('p', { class: 'pop-note' }, isGold ? `Golden seit ${new Date(rec.gold).toLocaleDateString('de-DE')} · ${rec.done}x geschafft` : `${rec.done}x geschafft · Gold: schwere neue Aufgaben, höchstens 1 Fehler`) : null,
        ];
    } else {
      status = testDone ? 'done' : allDone ? 'current' : 'locked';
      isGold = unitGold;
      glyph = solidIcon(isGold ? 'crown' : 'trophy', 34);
      label = `Abschnittstest: ${unit.title}`;
      pop = !allDone
        ? [h('h3', {}, 'Abschnittstest'), h('p', {}, 'Schließ alle Lektionen dieses Abschnitts ab. Dann prüft dich der Test mit gemischten Aufgaben aus dem ganzen Abschnitt.')]
        : [
          h('h3', {}, 'Abschnittstest'),
          h('p', {}, testDone ? 'Bestanden. Du kannst ihn jederzeit wiederholen.' : '10 gemischte Aufgaben aus dem ganzen Abschnitt. Bringt 15 XP extra.'),
          h('a', { class: 'btn btn-pop', href: `#/test/${unit.id}` }, testDone ? 'Nochmal testen' : 'Test starten'),
          testDone && lessonsGold ? h('a', { class: 'btn btn-pop is-gold', href: `#/test/${unit.id}/gold` }, unitGold ? 'Gold-Prüfung nochmal' : 'Gold-Prüfung') : null,
          testDone && !lessonsGold ? h('p', { class: 'pop-note' }, `Gold-Prüfung: Hol erst in allen Lektionen Gold (${goldCount}/${lessons.length}).`) : null,
          unitGold ? h('p', { class: 'pop-note' }, 'Dieser Abschnitt ist komplett vergoldet.') : null,
        ];
    }
    const isTest = node.kind === 'test';
    const btn = h('button', {
      class: `node is-${status}${isTest ? ' is-test' : ''}${isGold ? ' is-gold' : ''}`,
      type: 'button',
      'aria-label': `${label}${status === 'done' ? ', geschafft' : status === 'locked' ? ', gesperrt' : ''}`,
      'aria-haspopup': 'dialog',
      html: glyph,
      onclick: e => {
        e.stopPropagation();
        const id = isTest ? `test-${unit.id}` : node.lesson.id;
        if (openPop && openPop.dataset.id === id) { closePop(); return; }
        popover(track, x, y, pop, id, status === 'locked');
      },
    });
    const wrap = h('div', { class: 'node-wrap', style: { left: `${x - 37}px`, top: `${y - 35}px` } },
      status === 'current' && !isTest ? h('span', { class: 'node-here' }, s.langs[course.id].lessons[node.lesson.id] ? 'Weiter' : 'Start') : null,
      status === 'current' && !isTest ? h('span', { class: 'node-ring', 'aria-hidden': 'true' }) : null,
      btn);
    track.append(wrap);
  });

  // Bit steht auf der Seite, auf der weniger Knoten liegen
  const avg = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const mascotLeft = avg > TRACK_W / 2 ? -150 : TRACK_W + 40;
  track.append(h('div', {
    class: 'track-bit',
    'aria-hidden': 'true',
    style: { left: `${mascotLeft}px`, top: `${TOP + ROW * 0.6}px` },
    html: bit({ size: 110, mood: MOODS[unitIndex % MOODS.length], body: 'var(--u)', edge: 'var(--u-edge)' }),
  }));

  const colors = unitGold ? '--u: var(--gold); --u-edge: var(--gold-edge); --u-soft: var(--gold-soft);' : unitColorVars(unitIndex);
  return h('section', { class: `unit${unitGold ? ' is-gold' : ''}`, 'data-state': unitState, style: colors, 'aria-labelledby': `unit-${unit.id}` },
    h('header', { class: 'unit-banner' },
      h('div', {},
        h('p', { class: 'unit-eyebrow' }, `Abschnitt ${unitIndex + 1} · ${doneCount}/${lessons.length} Lektionen${goldCount ? ` · ${goldCount}/${lessons.length} Gold` : ''}`),
        unitGold ? h('p', { class: 'unit-goal', html: `${solidIcon('crown', 16)}<span>Vergoldet</span>` }) : null,
        unitGoals(unit.id).length ? h('p', { class: 'unit-goal', html: `${solidIcon('target', 16)}<span>Wichtig für: ${unitGoals(unit.id).map(g => GOALS[g]).join(', ')}</span>` }) : null,
        h('h2', { id: `unit-${unit.id}` }, unit.title),
        h('p', { class: 'unit-sum' }, unit.summary)),
      h('button', { type: 'button', class: 'guide-btn', onclick: () => openGuide(course, unit, unitIndex) },
        h('span', { html: icon('book', 22) }), h('span', { class: 'guide-btn-text' }, 'Leitfaden'))),
    track);
}

/** "Dein Weg": naechster Abschnitt, der zu den eigenen Zielen passt, plus Kurs-Empfehlung */
function goalCard(course, states) {
  const goals = userGoals();
  const hint = missingCourseHint();
  if (!goals.length && !hint) return null;
  const nextUnit = course.units.find(u => unitGoals(u.id).length && u.lessons.some(l => states.get(l.id) !== 'done'));
  const parts = [];
  if (goals.length) {
    parts.push(h('p', {}, h('b', {}, 'Deine Ziele: '), goals.map(g => GOALS[g]).join(', ')));
    parts.push(h('p', { class: 'muted' }, nextUnit
      ? `Nächster Meilenstein dafür: Abschnitt ${course.units.indexOf(nextUnit) + 1} „${nextUnit.title}“.`
      : `Alle Abschnitte für deine Ziele in ${course.name} sind geschafft. Weiter geht es im Training und im Labor.`));
  }
  if (hint) {
    parts.push(h('div', { class: 'goal-hint' },
      h('p', {}, hint.text),
      h('a', { class: 'btn btn-small btn-sky', href: `#/start/kurs/${hint.lang}` }, `${COURSES[hint.lang].name} hinzufügen`)));
  }
  return h('section', { class: 'goal-card' },
    h('span', { class: 'goal-card-icon', html: solidIcon('target', 40) }),
    h('div', {}, parts));
}

export function renderPath(main) {
  closePop();
  const lang = store.state.activeLang;
  const course = COURSES[lang];
  const states = lessonStates(lang, store.state);
  const prog = courseProgress(lang);
  const pct = Math.round((prog.done / prog.total) * 100);

  main.append(
    h('header', { class: 'course-head' },
      h('div', {},
        h('p', { class: 'eyebrow' }, `${course.name}-Kurs · ${course.sub}`),
        h('h1', {}, course.name),
        h('p', { class: 'muted' }, course.tagline)),
      h('div', { class: 'course-progress' },
        h('div', { class: 'qbar is-accent' }, h('span', { style: { width: `${pct}%` } })),
        h('span', {}, `${prog.done} von ${prog.total} Lektionen · ${pct} %`))),
    ...[goalCard(course, states)].filter(Boolean),
    mobileStats());

  let index = 0;
  course.units.forEach((unit, u) => {
    main.append(renderUnit(course, unit, u, states, index));
    index += unit.lessons.length + 1;
  });

  if (course.upcoming && course.upcoming.length) {
    const offset = course.units.length;
    main.append(h('section', { class: 'roadmap' },
      h('h2', {}, 'So geht es weiter'),
      h('ol', {}, course.upcoming.map((u, i) => h('li', {},
        h('span', { class: 'rm-no' }, offset + i + 1),
        h('div', {}, h('strong', {}, u.title), h('span', {}, u.topics)))))));
  } else {
    const finished = prog.done === prog.total;
    const s = store.state;
    const projects = PROJECTS[lang] || [];
    const challenges = CHALLENGES[lang] || [];
    const doneP = projects.filter(p => s.projects[p.id]?.done).length;
    const doneC = challenges.filter(c => s.challenges[c.id]).length;
    const parts = prog.total + projects.length + challenges.length;
    const pro = Math.round(((prog.done + doneP + doneC) / parts) * 100);
    main.append(h('section', { class: 'course-end' },
      h('div', { html: bit({ size: 120, mood: finished ? 'cheer' : 'think' }) }),
      h('div', {},
        h('h2', {}, finished ? `Alle ${course.name}-Lektionen geschafft` : 'Dein Weg zum Profi'),
        h('p', {}, finished
          ? 'Jetzt kommt der wichtigste Teil: selbst bauen. Projekte und freie Aufgaben machen aus Wissen echtes Können.'
          : `Lektionen geben dir die Bausteine. Profi wirst du, wenn du mit Projekten und freien Aufgaben eigene ${course.name}-Programme schreibst.`),
        h('div', { class: 'qbar is-accent', style: { margin: 'var(--s3) 0' } }, h('span', { style: { width: `${pro}%` } }), h('b', {}, `${pro} %`)),
        h('p', { class: 'muted' }, `Lektionen ${prog.done}/${prog.total} · Projekte ${doneP}/${projects.length} · Freie Aufgaben ${doneC}/${challenges.length}`),
        h('a', { class: 'btn btn-go btn-small', href: '#/projekte' }, 'Zu den Projekten'))));
  }

  const current = main.querySelector('.node.is-current:not(.is-test)');
  const inFirstUnit = current && current.closest('.unit') === main.querySelector('.unit');
  window.scrollTo({ top: 0 });
  if (current && !inFirstUnit) {
    document.fonts.ready.then(() => {
      if (document.body.contains(current)) current.scrollIntoView({ block: 'center' });
    });
  }
}

