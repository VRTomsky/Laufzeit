// Kurs-Verzeichnis und Abfragen auf die Inhalte

import { python } from './python.js';
import { cpp } from './cpp.js';
import { python as pythonEn } from './en/python.js';
import { isEn } from '../i18n.js';

// Inhalte je nach Sprache der Oberflaeche. Gleiche IDs, darum gilt der Fortschritt fuer beide.
// C++ auf Englisch folgt, bis dahin bleibt es Deutsch.
export const COURSES = isEn() ? { python: pythonEn, cpp } : { python, cpp };
export const LANG_IDS = ['python', 'cpp'];

export function allLessons(lang) {
  return COURSES[lang].units.flatMap(u => u.lessons);
}

/** Findet eine Lektion samt Kurs, Abschnitt und Position */
export function findLesson(id) {
  for (const course of Object.values(COURSES)) {
    for (let u = 0; u < course.units.length; u++) {
      const unit = course.units[u];
      const index = unit.lessons.findIndex(l => l.id === id);
      if (index >= 0) return { course, unit, unitIndex: u, lesson: unit.lessons[index], index };
    }
  }
  return null;
}

/** Status jeder Lektion: 'done', 'current' (die naechste offene) oder 'locked' */
export function lessonStates(lang, state) {
  const map = new Map();
  let currentFound = false;
  for (const lesson of allLessons(lang)) {
    if (state.langs[lang].lessons[lesson.id]?.done) map.set(lesson.id, 'done');
    else if (!currentFound) { map.set(lesson.id, 'current'); currentFound = true; }
    else map.set(lesson.id, 'locked');
  }
  return map;
}

export function exerciseCount(lesson) {
  return lesson.steps.filter(s => s.type !== 'concept').length;
}
