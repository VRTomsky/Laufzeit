// XP, Stufen, Streaks und Badges

import { store } from './store.js';
import { dayKey, addDays } from './util.js';
import { COURSES, allLessons } from './content/index.js';

/* ---------- Stufen: jede Stufe braucht 25 XP mehr als die vorige */

export function levelInfo(xp) {
  let level = 1;
  let need = 50;
  let rest = xp;
  while (rest >= need) {
    rest -= need;
    level += 1;
    need = 50 + (level - 1) * 25;
  }
  return { level, into: rest, need };
}

/* ---------- Streak */

export function todayKey() {
  return dayKey();
}

export function yesterdayKey() {
  return dayKey(addDays(new Date(), -1));
}

/** Aktuelle Serie: zaehlt nur, wenn heute oder gestern gelernt wurde */
export function currentStreak(state = store.state) {
  const { last, count } = state.streak;
  if (last === todayKey() || last === yesterdayKey()) return count;
  return 0;
}

export function learnedToday(state = store.state) {
  return state.streak.last === todayKey();
}

export function todayXp(state = store.state) {
  return state.days[todayKey()] || 0;
}

/* ---------- Badges */

function unitDone(state, lang, unit) {
  return unit.lessons.every(l => {
    const rec = state.langs[lang].lessons[l.id];
    return rec?.done && !rec.placed;
  });
}

/** Selbst gemachte Lektionen (ohne die per Einstufung uebersprungenen) */
function ownLessons(state, lang) {
  return Object.values(state.langs[lang].lessons).filter(r => !r.placed).length;
}

function distinctLessons(state) {
  return ownLessons(state, 'python') + ownLessons(state, 'cpp');
}

export const BADGES = [
  { id: 'first', mark: 'Hi', name: 'Hallo, Welt', desc: 'Erste Lektion abgeschlossen.', test: s => s.stats.lessons >= 1 },
  { id: 'perfect', mark: '0err', name: 'Sauberer Build', desc: 'Eine Lektion ohne einen einzigen Fehler.', test: s => s.stats.perfect >= 1 },
  { id: 'build', mark: '.exe', name: 'Erster Build', desc: 'Erstes eigenes C++-Programm kompiliert und gestartet.', test: s => s.stats.runs.cpp >= 1 },
  { id: 'both', mark: '2x', name: 'Zweisprachig', desc: 'In Python und C++ je eine Lektion geschafft.', test: s => ownLessons(s, 'python') > 0 && ownLessons(s, 'cpp') > 0 },
  { id: 'unit', mark: '§1', name: 'Kapitel zu', desc: 'Einen ganzen Abschnitt abgeschlossen.', test: s => Object.values(COURSES).some(c => c.units.some(u => unitDone(s, c.id, u))) },
  { id: 'streak3', mark: '3d', name: 'Drei am Stück', desc: 'Drei Tage hintereinander gelernt.', test: s => s.streak.best >= 3 },
  { id: 'streak7', mark: '7d', name: 'Eine Woche', desc: 'Sieben Tage hintereinander gelernt.', test: s => s.streak.best >= 7 },
  { id: 'streak30', mark: '30d', name: 'Dranbleiber', desc: 'Dreißig Tage hintereinander gelernt.', test: s => s.streak.best >= 30 },
  { id: 'xp100', mark: '100', name: 'Dreistellig', desc: '100 XP gesammelt.', test: s => s.xp >= 100 },
  { id: 'xp1000', mark: '1k', name: 'Tausender', desc: '1000 XP gesammelt.', test: s => s.xp >= 1000 },
  { id: 'ten', mark: '10L', name: 'Zehn Lektionen', desc: 'Zehn verschiedene Lektionen abgeschlossen.', test: s => distinctLessons(s) >= 10 },
  { id: 'training', mark: 'rep', name: 'Wiederholer', desc: 'Erstes Training absolviert.', test: s => s.stats.trainings >= 1 },
  { id: 'test', mark: 'A+', name: 'Prüfung bestanden', desc: 'Den ersten Abschnittstest geschafft.', test: s => s.stats.tests >= 1 },
  { id: 'quests', mark: '3/3', name: 'Tagwerk', desc: 'An einem Tag alle drei Tagesaufgaben erledigt.', test: s => s.stats.questDays >= 1 },
  { id: 'pyDone', mark: '.py', name: 'Python-Profi', desc: 'Den kompletten Python-Kurs abgeschlossen.', test: s => courseProgress('python', s).done === courseProgress('python', s).total },
  { id: 'cppDone', mark: '.cpp', name: 'C++-Profi', desc: 'Den kompletten C++-Kurs abgeschlossen.', test: s => courseProgress('cpp', s).done === courseProgress('cpp', s).total },
  { id: 'project1', mark: 'v1', name: 'Erstes Projekt', desc: 'Ein komplettes Projekt fertig gebaut.', test: s => Object.values(s.projects).some(p => p.done) },
  { id: 'project4', mark: 'v4', name: 'Baumeister', desc: 'Vier Projekte fertig gebaut.', test: s => Object.values(s.projects).filter(p => p.done).length >= 4 },
  { id: 'chal1', mark: 'OK', name: 'Ohne Vorlage', desc: 'Die erste freie Aufgabe gelöst.', test: s => Object.keys(s.challenges).length >= 1 },
  { id: 'chal10', mark: '10/10', name: 'Problemlöser', desc: 'Zehn freie Aufgaben gelöst.', test: s => Object.keys(s.challenges).length >= 10 },
  { id: 'chal25', mark: '25+', name: 'Wettkampfreif', desc: '25 freie Aufgaben gelöst.', test: s => Object.keys(s.challenges).length >= 25 },
  { id: 'gold1', mark: 'Au', name: 'Erstes Gold', desc: 'Eine Lektion auf Gold abgeschlossen.', test: s => Object.values(s.langs).some(l => Object.values(l.lessons).some(r => r.gold)) },
  { id: 'goldUnit', mark: 'Au+', name: 'Goldener Abschnitt', desc: 'Einen ganzen Abschnitt samt Gold-Prüfung vergoldet.', test: s => Object.values(s.langs).some(l => Object.keys(l.gold || {}).length > 0) },
  { id: 'gold5', mark: '5Au', name: 'Goldrausch', desc: 'Fünf Abschnitte vergoldet.', test: s => Object.values(s.langs).reduce((n, l) => n + Object.keys(l.gold || {}).length, 0) >= 5 },
  { id: 'night', mark: '22h', name: 'Nachtschicht', desc: 'Nach 22 Uhr noch eine Lektion gemacht.', test: s => s.stats.nightOwl },
];

/** Prueft alle Badges, traegt neue ein und gibt sie zurueck. Muss innerhalb von store.update laufen. */
function collectBadges(state) {
  const fresh = [];
  for (const badge of BADGES) {
    if (!state.badges[badge.id] && badge.test(state)) {
      state.badges[badge.id] = todayKey();
      fresh.push(badge);
    }
  }
  return fresh;
}

export function nextBadge(state = store.state) {
  return BADGES.find(b => !state.badges[b.id]) || null;
}

/** Fuer Ereignisse ausserhalb von Lektionen, z. B. erster C++-Build im Labor */
export function checkBadges() {
  return store.update(s => collectBadges(s));
}

/* ---------- Abschluss einer Lektion oder eines Trainings */

export function completeSession({ mode, lang, lessonId, unitId }, { accuracy, perfect, exercises, goldPassed = false }) {
  const base = mode === 'lesson' ? 10 : mode === 'test' ? 15 : 5;
  const xp = base + Math.round(accuracy * exercises) + (perfect && mode === 'lesson' ? 5 : 0) + (goldPassed ? 10 : 0);

  return store.update(s => {
    const today = todayKey();
    const goal = s.settings.dailyGoal;
    const xpBefore = s.days[today] || 0;
    const questsBefore = questsDone(s, today);

    let streakExtended = false;
    if (s.streak.last !== today) {
      s.streak.count = s.streak.last === yesterdayKey() ? s.streak.count + 1 : 1;
      s.streak.last = today;
      s.streak.best = Math.max(s.streak.best, s.streak.count);
      streakExtended = true;
    }

    s.xp += xp;
    s.langs[lang].xp += xp;
    s.days[today] = xpBefore + xp;

    const daily = s.daily[today] || { sessions: 0, perfect: 0 };
    daily.sessions += 1;
    if (perfect) daily.perfect += 1;
    s.daily[today] = daily;
    const allQuests = questsBefore < 3 && questsDone(s, today) === 3;
    if (allQuests) s.stats.questDays += 1;

    if (mode === 'lesson') {
      const rec = s.langs[lang].lessons[lessonId] || { done: 0, best: 0, perfect: false };
      rec.done += 1;
      rec.best = Math.max(rec.best, accuracy);
      rec.perfect = rec.perfect || perfect;
      rec.last = today;
      if (goldPassed) rec.gold = rec.gold || today;
      s.langs[lang].lessons[lessonId] = rec;
      s.stats.lessons += 1;
      if (perfect) s.stats.perfect += 1;
    } else if (mode === 'test') {
      s.langs[lang].tests[unitId] = today;
      if (goldPassed) s.langs[lang].gold[unitId] = s.langs[lang].gold[unitId] || today;
      s.stats.tests += 1;
    } else {
      s.stats.trainings += 1;
    }
    if (new Date().getHours() >= 22) s.stats.nightOwl = true;

    return {
      xp,
      streak: s.streak.count,
      streakExtended,
      goalReached: xpBefore < goal && s.days[today] >= goal,
      allQuests,
      todayXp: s.days[today],
      goal,
      badges: collectBadges(s),
      level: levelInfo(s.xp),
    };
  });
}

/** Fehler merken, damit das Training wackelige Aufgaben oefter zeigt */
export function recordAnswer(key, ok) {
  store.update(s => {
    const n = s.mistakes[key] || 0;
    if (!ok) s.mistakes[key] = n + 1;
    else if (n > 0) s.mistakes[key] = n - 1;
    if (s.mistakes[key] === 0) delete s.mistakes[key];
  });
}

/** Fortschritt eines Kurses in Prozent */
export function courseProgress(lang, state = store.state) {
  const lessons = allLessons(lang);
  const done = lessons.filter(l => state.langs[lang].lessons[l.id]?.done).length;
  return { done, total: lessons.length };
}

/* ---------- Tagesaufgaben */

export function dailyQuests(state = store.state, day = todayKey()) {
  const goal = state.settings.dailyGoal;
  const xp = state.days[day] || 0;
  const d = state.daily[day] || { sessions: 0, perfect: 0 };
  return [
    { id: 'xp', icon: 'bolt', text: `Sammle ${goal} XP`, value: Math.min(xp, goal), max: goal },
    { id: 'sessions', icon: 'target', text: 'Schließe 2 Lektionen oder Trainings ab', value: Math.min(d.sessions, 2), max: 2 },
    { id: 'perfect', icon: 'quest', text: 'Schaffe eine Runde ohne Fehler', value: Math.min(d.perfect, 1), max: 1 },
  ];
}

function questsDone(state, day) {
  return dailyQuests(state, day).filter(q => q.value >= q.max).length;
}

/** XP fuer Projekte und freie Aufgaben. Zaehlt fuer Serie, Tagesziel und Tagesaufgaben. */
export function awardXp(lang, xp, mutate) {
  return store.update(s => {
    const today = todayKey();
    const goal = s.settings.dailyGoal;
    const xpBefore = s.days[today] || 0;
    const questsBefore = questsDone(s, today);
    let streakExtended = false;
    if (s.streak.last !== today) {
      s.streak.count = s.streak.last === yesterdayKey() ? s.streak.count + 1 : 1;
      s.streak.last = today;
      s.streak.best = Math.max(s.streak.best, s.streak.count);
      streakExtended = true;
    }
    s.xp += xp;
    s.langs[lang].xp += xp;
    s.days[today] = xpBefore + xp;
    const daily = s.daily[today] || { sessions: 0, perfect: 0 };
    daily.sessions += 1;
    s.daily[today] = daily;
    mutate?.(s);
    const allQuests = questsBefore < 3 && questsDone(s, today) === 3;
    if (allQuests) s.stats.questDays += 1;
    return { xp, streak: s.streak.count, streakExtended, goalReached: xpBefore < goal && s.days[today] >= goal, badges: collectBadges(s) };
  });
}
