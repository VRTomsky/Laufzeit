// XP, Stufen, Streaks und Badges

import { t, locale } from './i18n.js';
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
  { id: 'first', mark: 'Hi', name: t('Hallo, Welt', 'Hello, World'), desc: t('Erste Lektion abgeschlossen.', 'Finished your first lesson.'), test: s => s.stats.lessons >= 1 },
  { id: 'perfect', mark: '0err', name: t('Sauberer Build', 'Clean build'), desc: t('Eine Lektion ohne einen einzigen Fehler.', 'A lesson without a single mistake.'), test: s => s.stats.perfect >= 1 },
  { id: 'build', mark: '.exe', name: t('Erster Build', 'First build'), desc: t('Erstes eigenes C++-Programm kompiliert und gestartet.', 'Compiled and ran your first own C++ program.'), test: s => s.stats.runs.cpp >= 1 },
  { id: 'both', mark: '2x', name: t('Zweisprachig', 'Bilingual'), desc: t('In Python und C++ je eine Lektion geschafft.', 'Finished a lesson in both Python and C++.'), test: s => ownLessons(s, 'python') > 0 && ownLessons(s, 'cpp') > 0 },
  { id: 'unit', mark: '§1', name: t('Kapitel zu', 'Chapter closed'), desc: t('Einen ganzen Abschnitt abgeschlossen.', 'Finished a whole unit.'), test: s => Object.values(COURSES).some(c => c.units.some(u => unitDone(s, c.id, u))) },
  { id: 'streak3', mark: '3d', name: t('Drei am Stück', 'Three in a row'), desc: t('Drei Tage hintereinander gelernt.', 'Learned three days in a row.'), test: s => s.streak.best >= 3 },
  { id: 'streak7', mark: '7d', name: t('Eine Woche', 'One week'), desc: t('Sieben Tage hintereinander gelernt.', 'Learned seven days in a row.'), test: s => s.streak.best >= 7 },
  { id: 'streak30', mark: '30d', name: t('Dranbleiber', 'Sticking with it'), desc: t('Dreißig Tage hintereinander gelernt.', 'Learned thirty days in a row.'), test: s => s.streak.best >= 30 },
  { id: 'xp100', mark: '100', name: t('Dreistellig', 'Three digits'), desc: '100 XP gesammelt.', test: s => s.xp >= 100 },
  { id: 'xp1000', mark: '1k', name: t('Tausender', 'Thousand'), desc: '1000 XP gesammelt.', test: s => s.xp >= 1000 },
  { id: 'ten', mark: '10L', name: t('Zehn Lektionen', 'Ten lessons'), desc: t('Zehn verschiedene Lektionen abgeschlossen.', 'Finished ten different lessons.'), test: s => distinctLessons(s) >= 10 },
  { id: 'training', mark: 'rep', name: t('Wiederholer', 'Repeater'), desc: t('Erstes Training absolviert.', 'Finished your first training.'), test: s => s.stats.trainings >= 1 },
  { id: 'test', mark: 'A+', name: t('Prüfung bestanden', 'Test passed'), desc: t('Den ersten Abschnittstest geschafft.', 'Passed your first unit test.'), test: s => s.stats.tests >= 1 },
  { id: 'quests', mark: '3/3', name: t('Tagwerk', 'Day\'s work'), desc: t('An einem Tag alle drei Tagesaufgaben erledigt.', 'Finished all three daily quests in one day.'), test: s => s.stats.questDays >= 1 },
  { id: 'pyDone', mark: '.py', name: t('Python-Profi', 'Python pro'), desc: t('Den kompletten Python-Kurs abgeschlossen.', 'Finished the complete Python course.'), test: s => courseProgress('python', s).done === courseProgress('python', s).total },
  { id: 'cppDone', mark: '.cpp', name: t('C++-Profi', 'C++ pro'), desc: t('Den kompletten C++-Kurs abgeschlossen.', 'Finished the complete C++ course.'), test: s => courseProgress('cpp', s).done === courseProgress('cpp', s).total },
  { id: 'project1', mark: 'v1', name: t('Erstes Projekt', 'First project'), desc: t('Ein komplettes Projekt fertig gebaut.', 'Built a complete project.'), test: s => Object.values(s.projects).some(p => p.done) },
  { id: 'project4', mark: 'v4', name: t('Baumeister', 'Master builder'), desc: t('Vier Projekte fertig gebaut.', 'Built four projects.'), test: s => Object.values(s.projects).filter(p => p.done).length >= 4 },
  { id: 'chal1', mark: 'OK', name: t('Ohne Vorlage', 'No template'), desc: t('Die erste freie Aufgabe gelöst.', 'Solved your first free task.'), test: s => Object.keys(s.challenges).length >= 1 },
  { id: 'chal10', mark: '10/10', name: t('Problemlöser', 'Problem solver'), desc: t('Zehn freie Aufgaben gelöst.', 'Solved ten free tasks.'), test: s => Object.keys(s.challenges).length >= 10 },
  { id: 'chal25', mark: '25+', name: t('Wettkampfreif', 'Competition ready'), desc: t('25 freie Aufgaben gelöst.', 'Solved 25 free tasks.'), test: s => Object.keys(s.challenges).length >= 25 },
  { id: 'gold1', mark: 'Au', name: t('Erstes Gold', 'First gold'), desc: t('Eine Lektion auf Gold abgeschlossen.', 'Finished a lesson on gold.'), test: s => Object.values(s.langs).some(l => Object.values(l.lessons).some(r => r.gold)) },
  { id: 'goldUnit', mark: 'Au+', name: t('Goldener Abschnitt', 'Golden unit'), desc: t('Einen ganzen Abschnitt samt Gold-Prüfung vergoldet.', 'Turned a whole unit gold, including the gold test.'), test: s => Object.values(s.langs).some(l => Object.keys(l.gold || {}).length > 0) },
  { id: 'gold5', mark: '5Au', name: t('Goldrausch', 'Gold rush'), desc: t('Fünf Abschnitte vergoldet.', 'Five units turned gold.'), test: s => Object.values(s.langs).reduce((n, l) => n + Object.keys(l.gold || {}).length, 0) >= 5 },
  { id: 'night', mark: '22h', name: t('Nachtschicht', 'Night shift'), desc: t('Nach 22 Uhr noch eine Lektion gemacht.', 'Did a lesson after 10 pm.'), test: s => s.stats.nightOwl },
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
    { id: 'xp', icon: 'bolt', text: t(`Sammle ${goal} XP`, `Earn ${goal} XP`), value: Math.min(xp, goal), max: goal },
    { id: 'sessions', icon: 'target', text: t('Schließe 2 Lektionen oder Trainings ab', 'Finish 2 lessons or trainings'), value: Math.min(d.sessions, 2), max: 2 },
    { id: 'perfect', icon: 'quest', text: t('Schaffe eine Runde ohne Fehler', 'Finish a round without mistakes'), value: Math.min(d.perfect, 1), max: 1 },
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
