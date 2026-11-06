// Personalisierung: Was die Antworten aus der Einfuehrung spaeter bewirken

import { store } from './store.js';

export const GOALS = {
  school: 'Schule',
  game: 'Spieleentwicklung',
  work: 'Ausbildung und Beruf',
  tool: 'Eigene Programme',
  fun: 'Spaß',
};

/** Welche Abschnitte zu welchem Ziel besonders beitragen */
const UNIT_TAGS = {
  py1: ['school'], py2: ['school'], py3: ['school'], py4: ['school'],
  py5: ['school', 'tool'], py6: ['school', 'tool'], py7: ['school', 'tool'],
  py8: ['school', 'tool'], py9: ['school', 'work'], py10: ['tool', 'work'], py11: ['game'],
  cpp4: ['game'], cpp5: ['work', 'tool'], cpp6: ['tool', 'game'], cpp7: ['game', 'work'],
  cpp8: ['game', 'work'], cpp9: ['game', 'work'], cpp10: ['game', 'work'],
  cpp11: ['game'], cpp12: ['game'], cpp13: ['game'], cpp14: ['work', 'game'],
  py12: ['work', 'tool'], py13: ['work', 'tool'], py14: ['work', 'tool'], py15: ['work', 'game'],
  cpp15: ['work', 'game'], cpp16: ['game', 'work', 'tool'], cpp17: ['game', 'work'], cpp18: ['game'], cpp19: ['game'],
};

/** Die Ziele des Nutzers, als Liste. Spass zaehlt nicht als Wegweiser. */
export function userGoals(state = store.state) {
  const r = state.profile.reasons || [];
  return r.filter(g => g !== 'fun');
}

/** Ziele, zu denen ein Abschnitt passt */
export function unitGoals(unitId, state = store.state) {
  const mine = userGoals(state);
  return (UNIT_TAGS[unitId] || []).filter(t => mine.includes(t));
}

/** Kurs-Empfehlung passend zu den Zielen, falls der Kurs noch fehlt */
export function missingCourseHint(state = store.state) {
  const goals = userGoals(state);
  if (goals.includes('game') && !state.courses.includes('cpp')) {
    return { lang: 'cpp', text: 'Für Spieleentwicklung brauchst du C++. Unreal und fast alle großen Engines laufen darauf.' };
  }
  if (goals.includes('school') && !state.courses.includes('python')) {
    return { lang: 'python', text: 'In der Schule lernst du Python. Mit dem Python-Kurs bist du dem Unterricht voraus.' };
  }
  return null;
}

/** Kennt der Nutzer die Sprache schon aus seinen Vorkenntnissen? */
export function knowsLanguage(lang, prior = []) {
  return lang === 'python' ? prior.includes('python') : prior.includes('cfamily');
}
