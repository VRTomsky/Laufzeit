// Training-Seite: Wiederholung aus abgeschlossenen Lektionen

import { t, locale } from '../i18n.js';
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
      h('p', { class: 'lede' }, t('Mischt Übungen aus Lektionen, die du schon geschafft hast. Aufgaben, bei denen du danebenlagst, kommen öfter dran, bis sie sitzen.', 'Mixes exercises from lessons you\'ve already finished. Tasks you got wrong come up more often until they stick.')))));

  if (pool.length === 0) {
    page.append(h('div', { class: 'empty' },
      h('div', {},
        h('h2', {}, t('Noch nichts zu wiederholen', 'Nothing to review yet')),
        h('p', {}, t(`Sobald du die erste ${course.name}-Lektion geschafft hast, landen ihre Übungen hier.`, `As soon as you finish your first ${course.name} lesson, its exercises land here.`)),
        h('a', { class: 'btn btn-go', href: '#/pfad' }, t('Zum Lernpfad', 'Go to the learning path')))));
    return;
  }

  page.append(
    h('div', { class: 'facts' },
      h('div', { class: 'fact' }, h('b', {}, pool.length), h('span', {}, t('Übungen im Pool', 'exercises in the pool'))),
      h('div', { class: 'fact' }, h('b', {}, shaky), h('span', {}, 'davon noch wackelig')),
      h('div', { class: 'fact' }, h('b', {}, Math.min(8, pool.length)), h('span', {}, t('pro Durchgang', 'per round')))),
    h('a', { class: 'btn btn-go', href: '#/training/los' }, t('Training starten', 'Start training')),
    h('p', { class: 'muted', style: { marginTop: 'var(--s5)', maxWidth: '56ch' } },
      t('Ein Training bringt weniger XP als eine neue Lektion, zählt aber genauso für deine Serie und die Tagesaufgaben. Abschnittstests findest du als Pokal am Ende jedes Abschnitts im Lernpfad.', 'A training gives less XP than a new lesson, but counts just the same for your streak and daily quests. Unit tests are the trophy at the end of each unit on the learning path.')));
}
