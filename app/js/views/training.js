// Training-Seite: Wiederholung aus abgeschlossenen Lektionen

import { h } from '../util.js';
import { bit } from '../mascot.js';
import { store } from '../store.js';
import { COURSES } from '../content/index.js';
import { buildTrainingPool } from './lesson.js';
import { mobileStats } from './shell.js';

export function renderTraining(main) {
  const lang = store.state.activeLang;
  const course = COURSES[lang];
  const pool = buildTrainingPool(lang);
  const shaky = pool.filter(s => s.weight > 1).length;
  const page = h('div', { class: 'page' });
  main.append(mobileStats(), page);

  page.append(h('header', { class: 'page-head page-head-bit' },
    h('div', { html: bit({ size: 120, mood: pool.length ? 'cheer' : 'think' }) }),
    h('div', {},
      h('p', { class: 'eyebrow' }, `Training · ${course.name}`),
      h('h1', {}, 'Training'),
      h('p', { class: 'lede' }, 'Mischt Übungen aus Lektionen, die du schon geschafft hast. Aufgaben, bei denen du danebenlagst, kommen öfter dran, bis sie sitzen.'))));

  if (pool.length === 0) {
    page.append(h('div', { class: 'empty' },
      h('div', {},
        h('h2', {}, 'Noch nichts zu wiederholen'),
        h('p', {}, `Sobald du die erste ${course.name}-Lektion geschafft hast, landen ihre Übungen hier.`),
        h('a', { class: 'btn btn-go', href: '#/pfad' }, 'Zum Lernpfad'))));
    return;
  }

  page.append(
    h('div', { class: 'facts' },
      h('div', { class: 'fact' }, h('b', {}, pool.length), h('span', {}, 'Übungen im Pool')),
      h('div', { class: 'fact' }, h('b', {}, shaky), h('span', {}, 'davon noch wackelig')),
      h('div', { class: 'fact' }, h('b', {}, Math.min(8, pool.length)), h('span', {}, 'pro Durchgang'))),
    h('a', { class: 'btn btn-go', href: '#/training/los' }, 'Training starten'),
    h('p', { class: 'muted', style: { marginTop: 'var(--s5)', maxWidth: '56ch' } },
      'Ein Training bringt weniger XP als eine neue Lektion, zählt aber genauso für deine Serie und die Tagesaufgaben. Abschnittstests findest du als Pokal am Ende jedes Abschnitts im Lernpfad.'));
}
