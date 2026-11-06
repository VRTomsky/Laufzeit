// Lernstand im Browser (localStorage). Mit Konto zusaetzlich in der Cloud (siehe cloud.js).

const KEY = 'laufzeit.v1';

function defaults() {
  return {
    version: 1,
    activeLang: 'python',
    onboarded: false,                           // Einfuehrung abgeschlossen?
    courses: [],                                // hinzugefuegte Kurse, z. B. ['python']
    profile: {
      age: null, reasons: [], prior: [], setup: null, level: {},   // reasons/prior: Mehrfachauswahl
      name: '', username: '', bio: '', avatar: null, banner: null, // avatar/banner: verkleinerte Bilder als data-URL
      joined: new Date().toISOString().slice(0, 10),
    },
    settings: { theme: 'auto', dailyGoal: 30, autoBackup: true },
    xp: 0,
    days: {},                                   // 'YYYY-MM-DD' -> XP an diesem Tag
    daily: {},                                  // 'YYYY-MM-DD' -> { sessions, perfect } fuer Tagesaufgaben
    streak: { count: 0, best: 0, last: null },  // last = letzter Lerntag
    langs: {
      python: { xp: 0, lessons: {}, tests: {}, gold: {} }, // lessons[id] = { done, best, perfect, last, gold }, tests/gold[unitId] = Datum
      cpp: { xp: 0, lessons: {}, tests: {}, gold: {} },
    },
    mistakes: {},                               // Uebungs-Schluessel -> Fehlerzahl (fuer Training)
    badges: {},                                 // Badge-ID -> Datum
    lab: { python: null, cpp: null },           // zuletzt im Labor geschriebener Code
    projects: {},                               // Projekt-ID -> { step: erledigte Schritte, done: Datum }
    challenges: {},                             // Aufgaben-ID -> Datum der Loesung
    drafts: {},                                 // Projekt-/Aufgaben-ID -> zuletzt geschriebener Code
    stats: { lessons: 0, perfect: 0, trainings: 0, tests: 0, questDays: 0, runs: { python: 0, cpp: 0 }, nightOwl: false },
  };
}

/** Fuehrt gespeicherte Daten mit den Standardwerten zusammen (fuer spaetere Versionen) */
function merge(base, saved) {
  if (saved == null || typeof saved !== 'object' || Array.isArray(saved)) return saved ?? base;
  const out = { ...base };
  for (const [k, v] of Object.entries(saved)) {
    out[k] = base[k] && typeof base[k] === 'object' && !Array.isArray(base[k]) ? merge(base[k], v) : v;
  }
  return out;
}

/** Staende von vor der Einfuehrung: wer schon gelernt hat, ueberspringt sie */
function upgrade(saved) {
  const state = merge(defaults(), saved);
  // aeltere Einfuehrung: einzelne Antworten statt Listen
  const p = state.profile;
  if (typeof p.reason === 'string') p.reasons = [p.reason];
  if (typeof p.prior === 'string') p.prior = [p.prior];
  if (!Array.isArray(p.reasons)) p.reasons = [];
  if (!Array.isArray(p.prior)) p.prior = [];
  delete p.reason;
  if (!saved.profile || !saved.profile.joined) {
    // Beitrittsdatum: erster Lerntag, sonst heute
    const first = Object.keys(saved.days || {}).sort()[0];
    p.joined = first || new Date().toISOString().slice(0, 10);
  }
  if (saved.onboarded === undefined) {
    const used = ['python', 'cpp'].filter(l => Object.keys(saved.langs?.[l]?.lessons || {}).length > 0);
    if (used.length || saved.xp > 0) {
      state.onboarded = true;
      state.courses = used.length ? used : [state.activeLang];
    }
  }
  return state;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? upgrade(JSON.parse(raw)) : defaults();
  } catch {
    return defaults();
  }
}

const listeners = new Set();

export const store = {
  state: load(),

  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.state));
    } catch {
      // Speicher voll oder gesperrt: App laeuft weiter, nur ohne Sichern
    }
  },

  /** Aendert den Zustand, speichert und informiert die Oberflaeche */
  update(fn) {
    const result = fn(this.state);
    this.save();
    listeners.forEach(l => l(this.state));
    return result;
  },

  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  exportJSON() {
    return JSON.stringify(this.state, null, 2);
  },

  importJSON(text) {
    const data = JSON.parse(text);
    if (!data || data.version !== 1 || !data.langs) throw new Error('Keine Laufzeit-Sicherung.');
    this.state = upgrade(data);
    if (!this.state.courses.length) this.state.courses = [this.state.activeLang];
    this.state.onboarded = true;
    this.save();
    listeners.forEach(l => l(this.state));
  },

  /** Kompletten Stand ersetzen (z. B. aus dem Konto geladen) */
  replace(data) {
    this.state = upgrade(data);
    this.save();
    listeners.forEach(l => l(this.state));
  },

  reset() {
    const theme = this.state.settings.theme;
    this.state = defaults();
    this.state.settings.theme = theme;
    this.save();
    listeners.forEach(l => l(this.state));
  },
};
