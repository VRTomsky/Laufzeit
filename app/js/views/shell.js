// App-Rahmen: linke Leiste (Marke, Sprachwechsel, Navigation) und rechte Spalte (Kennzahlen, Tagesaufgaben, Stufe)

import { t, locale } from '../i18n.js';
import { h, dayKey, addDays, WEEKDAYS } from '../util.js';
import { icon, solidIcon, langLogo } from '../icons.js';
import { store } from '../store.js';
import { COURSES, LANG_IDS } from '../content/index.js';
import { uiLangButton } from './uilang.js';
import { CLOUD_ENABLED, socialCounts, onCloudChange } from '../cloud.js';
import { levelInfo, currentStreak, learnedToday, todayXp, nextBadge, dailyQuests } from '../gamification.js';

const NAV = [
  ['pfad', t('Lernen', 'Learn'), 'path'],
  ['training', 'Training', 'training'],
  ['projekte', t('Projekte', 'Projects'), 'work'],
  ['labor', t('Labor', 'Lab'), 'lab'],
  ['werkstatt', t('Werkstatt', 'Workshop'), 'setup'],
  ['freunde', t('Freunde', 'Friends'), 'friends'],
  ['profil', t('Profil', 'Profile'), 'profile'],
];

let onLangChange = () => {};
export function setLangHandler(fn) { onLangChange = fn; }


let menuEl = null;
function closeMenu() {
  if (!menuEl) return;
  menuEl.remove();
  menuEl = null;
  document.querySelectorAll('.course-chip').forEach(b => b.setAttribute('aria-expanded', 'false'));
}
document.addEventListener('click', e => {
  if (menuEl && !e.target.closest('.course-menu') && !e.target.closest('.course-chip')) closeMenu();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
window.addEventListener('hashchange', closeMenu);

/** Kurs-Menue wie das Flaggen-Menue bei Sprach-Apps: Meine Kurse + Kurs hinzufuegen */
function toggleCourseMenu(anchor) {
  if (menuEl) { closeMenu(); return; }
  const s = store.state;
  const mine = s.courses.length ? s.courses : [s.activeLang];
  const others = LANG_IDS.filter(id => !mine.includes(id));
  const r = anchor.getBoundingClientRect();
  menuEl = h('div', {
    class: 'course-menu',
    role: 'menu',
    style: { top: `${r.bottom + 10}px`, left: `${Math.max(12, Math.min(window.innerWidth - 292, r.left - 8))}px` },
  },
  h('p', { class: 'eyebrow' }, t('Meine Kurse', 'My courses')),
  mine.map(id => h('button', {
    type: 'button',
    role: 'menuitemradio',
    'aria-checked': String(id === s.activeLang),
    class: 'cm-item',
    onclick: () => {
      closeMenu();
      if (store.state.activeLang === id) return;
      store.update(st => { st.activeLang = id; });
      onLangChange();
    },
  }, h('span', { class: 'ls-logo', html: langLogo(id, 34) }),
    h('span', { class: 'ls-text' }, h('span', { class: 'ls-name' }, COURSES[id].name), h('span', { class: 'ls-sub' }, COURSES[id].sub)))),
  others.length ? h('div', { class: 'cm-sep' }) : null,
  others.map(id => h('a', { class: 'cm-item is-add', role: 'menuitem', href: `#/start/kurs/${id}` },
    h('span', { class: 'cm-plus', 'aria-hidden': 'true' }, '+'),
    h('span', { class: 'ls-text' }, h('span', { class: 'ls-name' }, t(`${COURSES[id].name} hinzufügen`, `Add ${COURSES[id].name}`)), h('span', { class: 'ls-sub' }, COURSES[id].sub)))));
  document.body.append(menuEl);
  anchor.setAttribute('aria-expanded', 'true');
  menuEl.querySelector('.cm-item')?.focus();
}

/** Obere Kennzahlen-Zeile: Kurs, Serie, XP */
export function statRow() {
  const s = store.state;
  const lang = s.activeLang;
  const streak = currentStreak(s);
  const hot = streak > 0 && learnedToday(s);
  return h('div', { class: 'stat-row' },
    h('button', {
      type: 'button',
      class: 'stat-chip course-chip',
      'aria-haspopup': 'menu',
      'aria-expanded': 'false',
      'aria-label': t(`Kurs: ${COURSES[lang].name}. Kurs wechseln oder hinzufügen`, `Course: ${COURSES[lang].name}. Switch or add a course`),
      onclick: e => { e.stopPropagation(); toggleCourseMenu(e.currentTarget); },
    }, h('span', { class: 'ls-logo', html: langLogo(lang, 32) }), h('span', { class: 'chip-caret', html: icon('chevron', 16) })),
    h('span', { class: `stat-chip is-flame${hot ? '' : ' is-cold'}`, title: t(`${streak} Tage in Folge`, `${streak} days in a row`) }, h('span', { html: solidIcon(hot ? 'flame' : 'flameCold', 26) }), streak),
    h('span', { class: 'stat-chip is-xp', title: `${s.xp} XP gesamt` }, h('span', { html: solidIcon('bolt', 26) }), s.xp),
    uiLangButton('stat-chip'));
}

function streakCard() {
  const s = store.state;
  const streak = currentStreak(s);
  const today = learnedToday(s);
  const goal = s.settings.dailyGoal;
  const sub = streak === 0
    ? (s.streak.best > 0 ? t(`Serie gerissen. Dein Bestwert: ${s.streak.best} Tage.`, `Streak broken. Your best: ${s.streak.best} days.`) : t('Schließ heute eine Lektion ab und starte deine Serie.', 'Finish a lesson today and start your streak.'))
    : today ? t(`Heute erledigt. Bestwert: ${s.streak.best}.`, `Done for today. Best: ${s.streak.best}.`) : t('Heute noch nichts gelernt. Um Mitternacht reißt die Serie.', 'Nothing learned today yet. The streak breaks at midnight.');
  const week = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(new Date(), -i);
    const v = s.days[dayKey(d)] || 0;
    week.push(h('div', { class: `week-day${v >= goal ? ' is-full' : v > 0 ? ' is-part' : ''}${i === 0 ? ' is-today' : ''}`, title: `${v} XP` },
      h('i'), WEEKDAYS[d.getDay()]));
  }
  return h('section', { class: 'card' },
    h('div', { class: 'card-head' }, h('h2', {}, t('Serie', 'Streak')), h('span', { class: 'card-big is-flame' }, t(`${streak} ${streak === 1 ? 'Tag' : 'Tage'}`, `${streak} ${streak === 1 ? 'day' : 'days'}`))),
    h('p', { class: 'card-sub' }, sub),
    h('div', { class: 'week' }, week));
}

export function questCard() {
  const quests = dailyQuests();
  return h('section', { class: 'card' },
    h('div', { class: 'card-head' }, h('h2', {}, t('Tagesaufgaben', 'Daily quests')), h('span', { class: 'card-meta' }, `${quests.filter(q => q.value >= q.max).length}/3`)),
    h('ul', { class: 'quests' }, quests.map(q => {
      const pct = Math.round((q.value / q.max) * 100);
      return h('li', { class: pct >= 100 ? 'is-done' : '' },
        h('span', { class: 'quest-icon', html: solidIcon(q.icon, 30) }),
        h('div', {},
          h('p', {}, q.text),
          h('div', { class: 'qbar' }, h('span', { style: { width: `${pct}%` } }), h('b', {}, `${q.value} / ${q.max}`))));
    })));
}

function levelCard() {
  const s = store.state;
  const lvl = levelInfo(s.xp);
  const pct = Math.round((lvl.into / lvl.need) * 100);
  return h('section', { class: 'card' },
    h('div', { class: 'card-head' }, h('h2', {}, t(`Stufe ${lvl.level}`, `Level ${lvl.level}`)), h('span', { class: 'card-meta' }, `${lvl.into} / ${lvl.need} XP`)),
    h('div', { class: 'qbar is-accent' }, h('span', { style: { width: `${pct}%` } })));
}

function badgeCard() {
  const badge = nextBadge();
  return h('section', { class: 'card' },
    h('div', { class: 'card-head' }, h('h2', {}, t('Nächstes Abzeichen', 'Next badge'))),
    badge
      ? h('div', { class: 'next-badge' },
        h('span', { class: 'seal is-locked', 'aria-hidden': 'true' }, badge.mark),
        h('div', {}, h('strong', {}, badge.name), h('p', {}, badge.desc)))
      : h('p', { class: 'card-sub' }, t('Alle Abzeichen gesammelt.', 'All badges collected.')));
}

function ledger() {
  return h('aside', { class: 'ledger', id: 'ledger', 'aria-label': t('Dein Stand', 'Your progress') },
    statRow(), streakCard(), questCard(), levelCard(), badgeCard());
}

/** Baut den Rahmen neu und gibt das Hauptelement zurueck */
export function renderShell(view) {
  const app = document.getElementById('app');
  app.innerHTML = '';
  const main = h('main', { class: 'main', id: 'main' });
  const rail = h('header', { class: 'rail' },
    h('div', { class: 'brand-row' },
      h('a', { class: 'brand', href: '#/pfad', 'aria-label': t('Laufzeit, zum Lernpfad', 'Laufzeit, to the learning path') }, 'laufzeit', h('span', { class: 'brand-cursor' })),
      h('div', { class: 'mobile-only', id: 'mobile-stats' }, statRow())),
    h('nav', { class: 'nav', 'aria-label': t('Bereiche', 'Sections') },
      NAV.map(([id, label, ic]) => h('a', { href: `#/${id}`, 'aria-current': id === view ? 'page' : null },
        id === 'profil' && store.state.profile.avatar
          ? h('img', { class: 'nav-icon nav-avatar', src: store.state.profile.avatar, alt: '', width: 30, height: 30 })
          : h('span', { class: 'nav-icon', html: solidIcon(ic, 30) }),
        h('span', { class: 'nav-label' }, label),
        id === 'freunde' ? h('i', { class: 'nav-badge', id: 'nav-friends-badge', hidden: true }) : null))));
  app.append(h('div', { class: 'shell' }, rail, main, ledger()));
  paintBadge();
  return main;
}

/** Zahl am Freunde-Knopf: ungelesene Nachrichten, Anfragen, Anfeuern */
function paintBadge() {
  const el = document.getElementById('nav-friends-badge');
  if (!el || !CLOUD_ENABLED) return;
  const c = socialCounts();
  const n = c.messages + c.requests + c.nudges;
  el.hidden = n === 0;
  el.textContent = n > 9 ? '9+' : String(n);
  el.title = [c.messages && `${c.messages} ungelesen`, c.requests && t(`${c.requests} Anfragen`, `${c.requests} requests`), c.nudges && t(`${c.nudges} Anfeuern`, `${c.nudges} cheers`)].filter(Boolean).join(', ');
}
onCloudChange(paintBadge);

/** Aktualisiert nur die Kennzahlen, ohne die Seite neu zu bauen */
export function refreshStats() {
  const old = document.getElementById('ledger');
  if (old) old.replaceWith(ledger());
  const mob = document.getElementById('mobile-stats');
  if (mob) mob.replaceChildren(statRow());
}

/** Fuer mittlere Breiten (rechte Spalte fehlt): Tagesaufgaben im Hauptbereich */
export function mobileStats() {
  return h('div', { class: 'inline-cards' }, questCard());
}
