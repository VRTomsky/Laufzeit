// Einfuehrung beim ersten Start. Mehrfachauswahl bei Sprachen, Gruenden und Vorkenntnissen.
// Pro gewaehlter Sprache: Wissensstand und Startpunkt (mit optionalem Einstufungstest).
// Auch fuer "Kurs hinzufuegen": dann nur die Fragen zu dieser Sprache.

import { h, dayKey, toast } from '../util.js';
import { icon, solidIcon, levelBars, langLogo } from '../icons.js';
import { bit } from '../mascot.js';
import { store } from '../store.js';
import { COURSES, LANG_IDS } from '../content/index.js';
import { getStatus, IS_WEB } from '../runner.js';
import { CLOUD_ENABLED, currentUser } from '../cloud.js';
import { startPlacement } from './lesson.js';
import { applyTheme } from '../theme.js';
import { listBackups, loadBackup } from '../backup.js';
import { GOALS as GOAL_LABEL, knowsLanguage } from '../personalize.js';

const REASONS = [
  ['school', 'school', 'Für die Schule', 'Weniger Druck im Unterricht'],
  ['game', 'game', 'Spieleentwicklung', 'Eigene Spiele bauen, später beruflich'],
  ['work', 'work', 'Ausbildung oder Beruf', 'Ein Skill für später'],
  ['tool', 'tool', 'Eigene Programme', 'Tools und Apps für mich selbst'],
  ['fun', 'heart', 'Aus Spaß', 'Einfach neugierig'],
];
const AGES = [['u13', 'Unter 13'], ['13-15', '13 bis 15'], ['16-18', '16 bis 18'], ['19+', '19 oder älter']];
const PRIOR = [
  ['none', 'none', 'Noch nie'],
  ['blocks', 'blocks', 'Mit Blöcken, z. B. Scratch'],
  ['python', 'code', 'Ein bisschen Python'],
  ['cfamily', 'code', 'C++, C# oder Java'],
  ['other', 'code', 'Eine andere Sprache'],
];
const LEVELS = [
  [1, 'Ich bin neu in {name}'],
  [2, 'Ich kenne ein paar Befehle'],
  [3, 'Ich kann einfache Programme schreiben'],
  [4, 'Ich kenne Schleifen und Funktionen'],
  [5, 'Ich bin schon fortgeschritten'],
];
const DAILY = [[10, 'Locker', '5 Min. pro Tag'], [30, 'Normal', '10 Min. pro Tag'], [50, 'Ernsthaft', '15 Min. pro Tag'], [100, 'Intensiv', '20 Min. oder mehr']];
const SETUP = [['yes', 'Ja, alles ist installiert'], ['partly', 'Teilweise'], ['no', 'Nein oder weiß ich nicht']];

let draft = null;

const nameOf = lang => COURSES[lang]?.name || 'Programmieren';
const listNames = langs => langs.map(nameOf).join(' und ');

/** lang = null fuer die volle Einfuehrung, sonst "Kurs hinzufuegen" */
export function renderOnboarding(addLang = null) {
  const mode = addLang && COURSES[addLang] ? 'add' : 'full';
  if (!draft || draft.mode !== mode || (mode === 'add' && draft.langs[0] !== addLang)) {
    draft = {
      mode,
      step: mode === 'full' ? 'welcome' : `level:${addLang}`,
      langs: mode === 'add' ? [addLang] : [],
      reasons: [], age: null, prior: [],
      levels: {}, starts: {}, placed: {},
      goal: store.state.settings.dailyGoal || 30, setup: null,
    };
  }
  render();
}

/** Aktuelle Reihenfolge der Schritte. Haengt von den gewaehlten Sprachen ab. */
function flow() {
  const perLang = draft.langs.flatMap(l => [
    `level:${l}`,
    `start:${l}`,
    ...(draft.starts[l] === 'placement' && draft.placed[l] != null ? [`result:${l}`] : []),
  ]);
  return draft.mode === 'full'
    ? ['welcome', 'langs', 'reasons', 'age', 'prior', ...perLang, 'goal', 'setup', 'name', 'ready']
    : [...perLang, 'ready'];
}

const stepLang = () => draft.step.split(':')[1] || draft.langs[0] || 'python';

function go(step) {
  draft.step = step;
  render();
}

function next() {
  const [kind, lang] = draft.step.split(':');
  if (kind === 'start' && draft.starts[lang] === 'placement') {
    startPlacement(lang, solved => {
      draft.placed[lang] = Math.min(solved, COURSES[lang].units.length);
      go(`result:${lang}`);
    }, () => go(`start:${lang}`));
    return;
  }
  if (kind === 'start') delete draft.placed[lang];
  const list = flow();
  const following = list[list.indexOf(draft.step) + 1];
  if (following) go(following);
}

function back() {
  const list = flow();
  const i = list.indexOf(draft.step);
  if (i > 0) go(list[i - 1]);
  else if (draft.mode === 'add') { draft = null; location.hash = '#/pfad'; }
}

/* ---------------------------------------------------------------- Bausteine */

function frame({ bubble, hint, mood = 'happy', body, canGo, nextLabel = 'Weiter', onNext = next }) {
  const list = flow();
  const i = Math.max(0, list.indexOf(draft.step));
  const pct = Math.round((i / (list.length - 1)) * 100);
  const nextBtn = h('button', { type: 'button', class: 'btn btn-go', disabled: !canGo, onclick: onNext }, nextLabel);
  const lang = stepLang();
  document.body.dataset.lang = lang;
  const screen = h('div', { class: 'onb', 'data-lang': lang },
    h('header', { class: 'onb-top' },
      h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Zurück', html: icon('chevron', 26).replace('M9 5l7 7-7 7', 'M15 5l-7 7 7 7'), onclick: back }),
      h('div', { class: 'pbar', role: 'progressbar', 'aria-valuenow': String(pct), 'aria-valuemin': '0', 'aria-valuemax': '100' }, h('span', { class: 'pbar-fill', style: { width: `${Math.max(pct, 3)}%` } })),
      h('span')),
    h('main', { class: 'onb-body' },
      h('div', { class: 'onb-say' }, h('div', { html: bit({ size: 96, mood }) }),
        h('div', { class: 'speech' }, bubble, hint ? h('small', {}, hint) : null)),
      body),
    h('footer', { class: 'onb-foot' }, h('div', { class: 'foot-inner' }, h('span'), nextBtn)));
  const app = document.getElementById('app');
  app.innerHTML = '';
  app.append(screen);
  window.scrollTo({ top: 0 });
  return { nextBtn };
}

/**
 * Auswaehlbare Karten. options: [{ value, title, sub, art, side }]
 * multi: draft[key] ist eine Liste. exclusive: Werte, die alle anderen abwaehlen (z. B. "Noch nie")
 */
function optionList(key, options, { grid = false, multi = false, exclusive = [], target = draft, onChange } = {}) {
  let ref;
  const isOn = v => (multi ? target[key].includes(v) : target[key] === v);
  const list = h('div', { class: `onb-options${grid ? ' is-grid' : ''}${multi ? ' is-multi' : ''}`, role: multi ? 'group' : 'radiogroup' });

  function sync() {
    list.querySelectorAll('.onb-option').forEach(b => b.setAttribute('aria-checked', String(isOn(b.dataset.value))));
    const ok = multi ? target[key].length > 0 : target[key] != null;
    if (ref) ref.nextBtn.disabled = !ok;
    onChange?.();
  }

  options.forEach(o => {
    const btn = h('button', {
      type: 'button',
      class: 'onb-option',
      role: multi ? 'checkbox' : 'radio',
      onclick: () => {
        if (!multi) target[key] = o.value;
        else if (target[key].includes(o.value)) target[key] = target[key].filter(v => v !== o.value);
        else if (exclusive.includes(o.value)) target[key] = [o.value];
        else target[key] = [...target[key].filter(v => !exclusive.includes(v)), o.value];
        sync();
      },
    },
    o.art ? h('span', { class: 'onb-art', html: o.art }) : null,
    h('span', { class: 'onb-text' }, h('b', {}, o.title), o.sub ? h('small', {}, o.sub) : null),
    o.side ? h('span', { class: 'onb-side' }, o.side) : null,
    multi ? h('span', { class: 'onb-tick', 'aria-hidden': 'true', html: icon('check', 18) }) : null);
    btn.dataset.value = String(o.value);
    list.append(btn);
  });
  // Werte im Datensatz koennen Zahlen sein, dataset ist immer Text
  const raw = target[key];
  if (!multi && typeof raw === 'number') {
    list.querySelectorAll('.onb-option').forEach(b => b.setAttribute('aria-checked', String(Number(b.dataset.value) === raw)));
  } else {
    list.querySelectorAll('.onb-option').forEach(b => b.setAttribute('aria-checked', String(isOn(b.dataset.value))));
  }
  return { list, bind: r => { ref = r; } };
}

function markArt(lang) {
  return langLogo(lang, 64);
}

/** Bei Zahlenwerten (Level, Tagesziel) die Auswahl als Zahl speichern */
function numberList(key, options, target) {
  const proxy = { [key]: target[key] == null ? null : String(target[key]) };
  const opts = optionList(key, options.map(o => ({ ...o, value: String(o.value) })), {
    target: proxy,
    onChange: () => { target[key] = Number(proxy[key]); },
  });
  return opts;
}

/* ---------------------------------------------------------------- Schritte */

const STEPS = {
  welcome() {
    const app = document.getElementById('app');
    app.innerHTML = '';
    document.body.dataset.lang = 'python';
    const fileInput = h('input', {
      type: 'file', accept: 'application/json,.json', class: 'sr-only',
      onchange: async e => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          store.importJSON(await file.text());
          applyTheme();
          draft = null;
          toast('Sicherung geladen', 'Willkommen zurück.');
          location.hash = '#/pfad';
        } catch (err) {
          toast('Laden fehlgeschlagen', err.message);
        }
      },
    });
    const desktopBtn = h('button', { type: 'button', class: 'btn btn-sky', hidden: true }, 'Fortschritt vom Desktop laden');
    app.append(h('div', { class: 'onb onb-welcome' },
      h('main', { class: 'onb-hero' },
        h('div', { class: 'onb-hero-bit', html: bit({ size: 200, mood: 'wave' }) }),
        h('p', { class: 'onb-brand' }, 'laufzeit'),
        h('h1', {}, `Programmieren lernen. Kostenlos, ${IS_WEB ? 'im Browser' : 'lokal'}, Schritt für Schritt.`),
        h('p', { class: 'muted' }, 'Hi, ich bin Bit. Bevor es losgeht, stelle ich dir ein paar kurze Fragen. Dann passt dein Kurs genau zu dir.'),
        h('div', { class: 'onb-hero-actions' },
          h('button', { type: 'button', class: 'btn btn-go', onclick: () => go('langs') }, 'Los geht’s'),
          CLOUD_ENABLED ? h('a', { class: 'btn btn-sky', href: '#/konto' }, 'Ich habe schon ein Konto') : null,
          desktopBtn,
          h('label', { class: 'btn btn-ghost' }, 'Sicherung aus Datei laden', fileInput)))));
    // Gibt es Sicherungen auf dem Desktop? Dann die neueste direkt anbieten
    listBackups().then(res => {
      const newest = res.ok && res.files.find(f => !f.name.includes('-vorher-'));
      if (!newest || !document.body.contains(desktopBtn)) return;
      const day = new Date(newest.name.slice(19, 29)).toLocaleDateString('de-DE');
      desktopBtn.hidden = false;
      desktopBtn.textContent = `Fortschritt vom Desktop laden (${day})`;
      desktopBtn.onclick = async () => {
        try {
          store.importJSON(JSON.stringify(await loadBackup(newest.name)));
          applyTheme();
          draft = null;
          toast('Willkommen zurück', `Sicherung vom ${day} geladen.`);
          location.hash = '#/pfad';
        } catch (err) {
          toast('Laden fehlgeschlagen', err.message);
        }
      };
    });
  },

  langs() {
    const opts = optionList('langs', [
      { value: 'python', title: 'Python', sub: 'Für die Schule. Der leichteste Einstieg.', art: markArt('python') },
      { value: 'cpp', title: 'C++', sub: 'Für Spieleentwicklung und Unreal.', art: markArt('cpp') },
    ], { grid: true, multi: true });
    opts.bind(frame({ bubble: 'Was möchtest du lernen?', hint: 'Du kannst auch beide wählen.', mood: 'wave', body: opts.list, canGo: draft.langs.length > 0 }));
  },

  reasons() {
    const opts = optionList('reasons', REASONS.map(([value, art, title, sub]) => ({ value, title, sub, art: solidIcon(art, 34) })), { multi: true });
    opts.bind(frame({
      bubble: `Warum lernst du ${listNames(draft.langs)}?`,
      hint: 'Mehrere Antworten möglich. Ich markiere dir später die Abschnitte, die zu deinen Zielen passen.',
      mood: 'think', body: opts.list, canGo: draft.reasons.length > 0,
    }));
  },

  age() {
    const opts = optionList('age', AGES.map(([value, title]) => ({ value, title })));
    opts.bind(frame({
      bubble: 'Wie alt bist du?',
      body: h('div', {}, opts.list, h('p', { class: 'onb-note' }, 'Nur für dein Profil. Alles bleibt auf deinem PC.')),
      canGo: Boolean(draft.age),
    }));
  },

  prior() {
    const opts = optionList('prior', PRIOR.map(([value, art, title]) => ({ value, title, art: solidIcon(art, 32) })), { multi: true, exclusive: ['none'] });
    opts.bind(frame({ bubble: 'Womit hast du schon programmiert?', hint: 'Mehrere Antworten möglich.', mood: 'think', body: opts.list, canGo: draft.prior.length > 0 }));
  },

  level() {
    const lang = stepLang();
    const opts = numberList(lang, LEVELS.map(([value, title]) => ({ value, title: title.replace('{name}', nameOf(lang)), art: levelBars(value, 34) })), draft.levels);
    const known = knowsLanguage(lang, draft.prior);
    opts.bind(frame({
      bubble: `Wie viel weißt du schon über ${nameOf(lang)}?`,
      hint: known ? `Du hast gesagt, du kennst schon ${lang === 'python' ? 'Python' : 'eine C-Sprache'}.` : null,
      mood: 'think', body: opts.list, canGo: draft.levels[lang] != null,
    }));
  },

  start() {
    const lang = stepLang();
    const first = COURSES[lang].units[0].lessons[0].title;
    const recommendTest = (draft.levels[lang] || 1) >= 3 || knowsLanguage(lang, draft.prior);
    const holder = { start: draft.starts[lang] ?? null };
    const opts = optionList('start', [
      { value: 'zero', title: 'Von vorne anfangen', sub: `Mit Lektion 1.1 „${first}“.${recommendTest ? '' : ' Empfohlen für dich.'}`, art: solidIcon('restart', 44) },
      { value: 'placement', title: 'Einstufungstest machen', sub: `Bis zu 10 Fragen, ca. 5 Minuten. Bit findet heraus, wo du einsteigst.${recommendTest ? ' Empfohlen für dich.' : ''}`, art: solidIcon('compass', 44) },
    ], { grid: true, target: holder, onChange: () => { draft.starts[lang] = holder.start; } });
    opts.bind(frame({ bubble: `Wo möchtest du in ${nameOf(lang)} anfangen?`, body: opts.list, canGo: Boolean(holder.start) }));
  },

  result() {
    const lang = stepLang();
    const units = COURSES[lang].units;
    const placed = draft.placed[lang] || 0;
    const startUnit = units[Math.min(placed, units.length - 1)];
    const text = placed === 0
      ? `Wir fangen bei Abschnitt 1 „${units[0].title}“ an. Die Grundlagen sitzen danach sicher.`
      : `Du hast ${placed} ${placed === 1 ? 'Abschnitt' : 'Abschnitte'} übersprungen und startest bei Abschnitt ${placed + 1} „${startUnit.title}“.`;
    frame({
      bubble: placed === 0 ? 'Gut, dass wir gefragt haben!' : `Stark, du kannst schon einiges in ${nameOf(lang)}!`,
      mood: 'cheer',
      body: h('div', { class: 'onb-result' },
        h('div', { class: 'score-row is-two' },
          h('div', { class: 'score is-leaf' }, h('span', {}, 'Richtig'), h('b', {}, `${placed}`)),
          h('div', { class: 'score is-sky' }, h('span', {}, 'Dein Start'), h('b', {}, `Abschnitt ${Math.min(placed + 1, units.length)}`))),
        h('p', {}, text),
        placed > 0 ? h('p', { class: 'onb-note' }, 'Übersprungene Lektionen kannst du jederzeit trotzdem machen.') : null),
      canGo: true,
    });
  },

  goal() {
    const opts = numberList('goal', DAILY.map(([value, title, sub]) => ({ value, title, sub, side: `${value} XP` })), draft);
    opts.bind(frame({
      bubble: 'Wie viel Zeit willst du pro Tag investieren?',
      body: h('div', {}, opts.list, h('p', { class: 'onb-note' }, 'Eine Lektion bringt etwa 15 bis 22 XP. Du kannst das Ziel jederzeit im Profil ändern.')),
      canGo: Boolean(draft.goal),
    }));
  },

  setup() {
    const status = h('div', { class: 'onb-check' }, h('span', { class: 'muted' }, 'Ich schaue kurz auf deinem PC nach ...'));
    const opts = optionList('setup', SETUP.map(([value, title]) => ({ value, title })));
    opts.bind(frame({
      bubble: `${draft.langs.length > 1 ? 'Sind' : 'Ist'} ${listNames(draft.langs)} auf deinem PC schon eingerichtet?`,
      hint: 'Sagst du nein oder teilweise, öffne ich dir in der Werkstatt gleich die passenden Anleitungen.',
      body: h('div', {}, opts.list, status),
      canGo: Boolean(draft.setup),
    }));
    const show = s => {
      if (!document.body.contains(status)) return;
      if (!s.ready) { setTimeout(() => getStatus(true).then(show), 1500); return; }
      const rows = [];
      rows.push(['Python', s.python ? s.python.version : null]);
      if (draft.langs.includes('cpp')) rows.push(['C++-Compiler', s.cpp ? s.cpp.version.replace(/^Microsoft \(R\) C\/C\+\+ Optimizing Compiler Version/, 'MSVC') : null]);
      const allOk = rows.every(r => r[1]);
      status.replaceChildren(
        h('p', {}, h('b', {}, 'Bit hat nachgesehen:')),
        h('ul', {}, rows.map(([name, v]) => h('li', { class: v ? 'is-ok' : 'is-bad' }, h('span', { html: icon(v ? 'check' : 'cross', 18) }), `${name}: ${v || 'nicht gefunden'}`))),
        h('p', { class: 'muted' }, allOk
          ? 'Damit laufen alle Übungen echt auf deinem PC. Wie du auch außerhalb von Laufzeit programmierst, steht in der Werkstatt.'
          : 'Laufzeit funktioniert trotzdem. Was fehlt und wie du es einrichtest, steht in der Werkstatt.'));
    };
    getStatus(true).then(show);
  },

  name() {
    const input = h('input', { class: 'text-input onb-name', maxlength: '40', placeholder: 'Dein Vorname', 'aria-label': 'Dein Name', value: draft.name || '' });
    const ref = frame({
      bubble: 'Wie soll ich dich nennen?',
      hint: 'Freiwillig. Der Name steht in deinem Profil, dort kannst du auch Profil- und Titelbild hinzufügen.',
      body: input,
      canGo: true,
      nextLabel: draft.name ? 'Weiter' : 'Überspringen',
    });
    input.addEventListener('input', () => {
      draft.name = input.value.trim();
      ref.nextBtn.textContent = draft.name ? 'Weiter' : 'Überspringen';
    });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') next(); });
    input.focus();
  },

  ready() {
    const s = store.state;
    const startText = lang => (draft.starts[lang] === 'placement' && draft.placed[lang] ? `Abschnitt ${Math.min(draft.placed[lang] + 1, COURSES[lang].units.length)}` : 'Lektion 1.1');
    const rows = [
      [draft.langs.length > 1 ? 'Kurse' : 'Kurs', listNames(draft.langs)],
      draft.mode === 'full' ? ['Deine Ziele', draft.reasons.map(r => GOAL_LABEL[r]).join(', ')] : null,
      draft.mode === 'full' && draft.name ? ['Name', draft.name] : null,
      ['Tagesziel', `${draft.mode === 'full' ? draft.goal : s.settings.dailyGoal} XP`],
      ...draft.langs.map(l => [`Start ${nameOf(l)}`, startText(l)]),
    ].filter(Boolean);

    // Persoenliche Hinweise aus den Antworten
    const reasons = draft.mode === 'full' ? draft.reasons : s.profile.reasons;
    const prior = draft.mode === 'full' ? draft.prior : s.profile.prior;
    const allLangs = [...new Set([...s.courses, ...draft.langs])];
    const notes = [];
    if (reasons.includes('game') && !allLangs.includes('cpp')) notes.push('Für Spieleentwicklung brauchst du später C++. Du kannst den Kurs jederzeit über das Kurs-Menü oben hinzufügen.');
    if (reasons.includes('school') && !allLangs.includes('python')) notes.push('In der Schule lernst du Python. Den Kurs kannst du jederzeit über das Kurs-Menü hinzufügen.');
    if (draft.langs.includes('cpp') && (prior.includes('python') || allLangs.includes('python'))) notes.push('Du kennst Python: In C++ zeige ich dir oft den Python-Code direkt daneben.');
    if (reasons.some(r => r !== 'fun')) notes.push('Abschnitte, die zu deinen Zielen passen, sind im Lernpfad markiert.');

    frame({
      bubble: 'Alles bereit. Ich freu mich auf dich!',
      mood: 'cheer',
      body: h('div', {},
        h('div', { class: 'onb-summary' }, rows.map(([k, v]) => h('div', {}, h('span', {}, k), h('b', {}, v)))),
        notes.length ? h('ul', { class: 'onb-tips' }, notes.map(n => h('li', {}, n))) : null),
      canGo: true,
      nextLabel: 'Kurs starten',
      onNext: commit,
    });
  },
};

function render() {
  const kind = draft.step.split(':')[0];
  (STEPS[kind] || STEPS.welcome)();
}

/** Speichert alles und oeffnet den Lernpfad */
function commit() {
  const d = draft;
  const today = dayKey();
  store.update(s => {
    s.onboarded = true;
    for (const lang of LANG_IDS.filter(l => d.langs.includes(l))) {
      if (!s.courses.includes(lang)) s.courses.push(lang);
      s.profile.level[lang] = d.levels[lang];
      // Einstufung: Lektionen der bestandenen Abschnitte gelten als geschafft (ohne XP)
      const skipped = d.starts[lang] === 'placement' ? d.placed[lang] || 0 : 0;
      for (const unit of COURSES[lang].units.slice(0, skipped)) {
        for (const lesson of unit.lessons) {
          if (!s.langs[lang].lessons[lesson.id]) s.langs[lang].lessons[lesson.id] = { done: 1, best: 0, perfect: false, last: today, placed: true };
        }
      }
    }
    s.activeLang = d.langs[0];
    if (d.mode === 'full') {
      s.profile.age = d.age;
      s.profile.reasons = [...d.reasons];
      s.profile.prior = [...d.prior];
      s.profile.setup = d.setup;
      if (d.name) s.profile.name = d.name;
      s.settings.dailyGoal = d.goal;
    }
  });
  draft = null;
  // Online: direkt ein Konto anbieten, damit Freunde und Speichern klappen
  location.hash = CLOUD_ENABLED && IS_WEB && !currentUser() ? '#/konto/registrieren' : '#/pfad';
}
