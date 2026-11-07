// Einfuehrung beim ersten Start. Mehrfachauswahl bei Sprachen, Gruenden und Vorkenntnissen.
// Pro gewaehlter Sprache: Wissensstand und Startpunkt (mit optionalem Einstufungstest).
// Auch fuer "Kurs hinzufuegen": dann nur die Fragen zu dieser Sprache.

import { t, locale } from '../i18n.js';
import { uiLangButton } from './uilang.js';
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
  ['school', 'school', t('Für die Schule', 'For school'), t('Weniger Druck im Unterricht', 'Less stress in class')],
  ['game', 'game', t('Spieleentwicklung', 'Game development'), t('Eigene Spiele bauen, später beruflich', 'Build my own games, maybe as a job')],
  ['work', 'work', t('Ausbildung oder Beruf', 'Training or career'), t('Ein Skill für später', 'A skill for later')],
  ['tool', 'tool', t('Eigene Programme', 'My own programs'), t('Tools und Apps für mich selbst', 'Tools and apps for myself')],
  ['fun', 'heart', t('Aus Spaß', 'For fun'), t('Einfach neugierig', 'Just curious')],
];
const AGES = [['u13', t('Unter 13', 'Under 13')], ['13-15', '13 bis 15'], ['16-18', '16 bis 18'], ['19+', t('19 oder älter', '19 or older')]];
const PRIOR = [
  ['none', 'none', t('Noch nie', 'Never')],
  ['blocks', 'blocks', t('Mit Blöcken, z. B. Scratch', 'With blocks, e.g. Scratch')],
  ['python', 'code', t('Ein bisschen Python', 'A bit of Python')],
  ['cfamily', 'code', t('C++, C# oder Java', 'C++, C# or Java')],
  ['other', 'code', t('Eine andere Sprache', 'Another language')],
];
const LEVELS = [
  [1, t('Ich bin neu in {name}', 'I\'m new to {name}')],
  [2, t('Ich kenne ein paar Befehle', 'I know a few commands')],
  [3, t('Ich kann einfache Programme schreiben', 'I can write simple programs')],
  [4, t('Ich kenne Schleifen und Funktionen', 'I know loops and functions')],
  [5, t('Ich bin schon fortgeschritten', 'I\'m already advanced')],
];
const DAILY = [[10, t('Locker', 'Casual'), t('5 Min. pro Tag', '5 min per day')], [30, t('Normal', 'Regular'), t('10 Min. pro Tag', '10 min per day')], [50, t('Ernsthaft', 'Serious'), t('15 Min. pro Tag', '15 min per day')], [100, t('Intensiv', 'Intense'), t('20 Min. oder mehr', '20 min or more')]];
const SETUP = [['yes', t('Ja, alles ist installiert', 'Yes, everything is installed')], ['partly', t('Teilweise', 'Partly')], ['no', t('Nein oder weiß ich nicht', 'No, or I don\'t know')]];

let draft = null;

const nameOf = lang => COURSES[lang]?.name || t('Programmieren', 'Programming');
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

function frame({ bubble, hint, mood = 'happy', body, canGo, nextLabel = t('Weiter', 'Continue'), onNext = next }) {
  const list = flow();
  const i = Math.max(0, list.indexOf(draft.step));
  const pct = Math.round((i / (list.length - 1)) * 100);
  const nextBtn = h('button', { type: 'button', class: 'btn btn-go', disabled: !canGo, onclick: onNext }, nextLabel);
  const lang = stepLang();
  document.body.dataset.lang = lang;
  const screen = h('div', { class: 'onb', 'data-lang': lang },
    h('header', { class: 'onb-top' },
      h('button', { type: 'button', class: 'icon-btn', 'aria-label': t('Zurück', 'Back'), html: icon('chevron', 26).replace('M9 5l7 7-7 7', 'M15 5l-7 7 7 7'), onclick: back }),
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
          toast(t('Sicherung geladen', 'Backup loaded'), t('Willkommen zurück.', 'Welcome back.'));
          location.hash = '#/pfad';
        } catch (err) {
          toast(t('Laden fehlgeschlagen', 'Loading failed'), err.message);
        }
      },
    });
    const desktopBtn = h('button', { type: 'button', class: 'btn btn-sky', hidden: true }, t('Fortschritt vom Desktop laden', 'Load progress from desktop'));
    const langToggle = uiLangButton('onb-uilang');
    app.append(h('div', { class: 'onb onb-welcome' }, langToggle,
      h('main', { class: 'onb-hero' },
        h('div', { class: 'onb-hero-bit', html: bit({ size: 200, mood: 'wave' }) }),
        h('p', { class: 'onb-brand' }, 'laufzeit'),
        h('h1', {}, t(`Programmieren lernen. Kostenlos, ${IS_WEB ? 'im Browser' : 'lokal'}, Schritt für Schritt.`, `Learn to code. Free, ${IS_WEB ? 'in your browser' : 'on your PC'}, step by step.`)),
        h('p', { class: 'muted' }, t('Hi, ich bin Bit. Bevor es losgeht, stelle ich dir ein paar kurze Fragen. Dann passt dein Kurs genau zu dir.', 'Hi, I\'m Bit. Before we start, I\'ll ask you a few quick questions. Then your course fits you perfectly.')),
        h('div', { class: 'onb-hero-actions' },
          h('button', { type: 'button', class: 'btn btn-go', onclick: () => go('langs') }, t('Los geht’s', 'Let’s go')),
          CLOUD_ENABLED ? h('a', { class: 'btn btn-sky', href: '#/konto' }, t('Ich habe schon ein Konto', 'I already have an account')) : null,
          desktopBtn,
          h('label', { class: 'btn btn-ghost' }, t('Sicherung aus Datei laden', 'Load backup from file'), fileInput)))));
    // Gibt es Sicherungen auf dem Desktop? Dann die neueste direkt anbieten
    listBackups().then(res => {
      const newest = res.ok && res.files.find(f => !f.name.includes('-vorher-'));
      if (!newest || !document.body.contains(desktopBtn)) return;
      const day = new Date(newest.name.slice(19, 29)).toLocaleDateString(locale());
      desktopBtn.hidden = false;
      desktopBtn.textContent = t(`Fortschritt vom Desktop laden (${day})`, `Load progress from desktop (${day})`);
      desktopBtn.onclick = async () => {
        try {
          store.importJSON(JSON.stringify(await loadBackup(newest.name)));
          applyTheme();
          draft = null;
          toast(t('Willkommen zurück', 'Welcome back'), t(`Sicherung vom ${day} geladen.`, `Backup from ${day} loaded.`));
          location.hash = '#/pfad';
        } catch (err) {
          toast(t('Laden fehlgeschlagen', 'Loading failed'), err.message);
        }
      };
    });
  },

  langs() {
    const opts = optionList('langs', [
      { value: 'python', title: 'Python', sub: t('Für die Schule. Der leichteste Einstieg.', 'For school. The easiest start.'), art: markArt('python') },
      { value: 'cpp', title: 'C++', sub: t('Für Spieleentwicklung und Unreal.', 'For game development and Unreal.'), art: markArt('cpp') },
    ], { grid: true, multi: true });
    opts.bind(frame({ bubble: t('Was möchtest du lernen?', 'What do you want to learn?'), hint: t('Du kannst auch beide wählen.', 'You can also pick both.'), mood: 'wave', body: opts.list, canGo: draft.langs.length > 0 }));
  },

  reasons() {
    const opts = optionList('reasons', REASONS.map(([value, art, title, sub]) => ({ value, title, sub, art: solidIcon(art, 34) })), { multi: true });
    opts.bind(frame({
      bubble: t(`Warum lernst du ${listNames(draft.langs)}?`, `Why are you learning ${listNames(draft.langs)}?`),
      hint: t('Mehrere Antworten möglich. Ich markiere dir später die Abschnitte, die zu deinen Zielen passen.', 'Several answers possible. Later I\'ll mark the units that match your goals.'),
      mood: 'think', body: opts.list, canGo: draft.reasons.length > 0,
    }));
  },

  age() {
    const opts = optionList('age', AGES.map(([value, title]) => ({ value, title })));
    opts.bind(frame({
      bubble: t('Wie alt bist du?', 'How old are you?'),
      body: h('div', {}, opts.list, h('p', { class: 'onb-note' }, t('Nur für dein Profil. Alles bleibt auf deinem PC.', 'Only for your profile.'))),
      canGo: Boolean(draft.age),
    }));
  },

  prior() {
    const opts = optionList('prior', PRIOR.map(([value, art, title]) => ({ value, title, art: solidIcon(art, 32) })), { multi: true, exclusive: ['none'] });
    opts.bind(frame({ bubble: t('Womit hast du schon programmiert?', 'What have you programmed with so far?'), hint: t('Mehrere Antworten möglich.', 'Several answers possible.'), mood: 'think', body: opts.list, canGo: draft.prior.length > 0 }));
  },

  level() {
    const lang = stepLang();
    const opts = numberList(lang, LEVELS.map(([value, title]) => ({ value, title: title.replace('{name}', nameOf(lang)), art: levelBars(value, 34) })), draft.levels);
    const known = knowsLanguage(lang, draft.prior);
    opts.bind(frame({
      bubble: t(`Wie viel weißt du schon über ${nameOf(lang)}?`, `How much do you already know about ${nameOf(lang)}?`),
      hint: known ? t(`Du hast gesagt, du kennst schon ${lang === 'python' ? 'Python' : 'eine C-Sprache'}.`, `You said you already know ${lang === 'python' ? 'Python' : 'a C-style language'}.`) : null,
      mood: 'think', body: opts.list, canGo: draft.levels[lang] != null,
    }));
  },

  start() {
    const lang = stepLang();
    const first = COURSES[lang].units[0].lessons[0].title;
    const recommendTest = (draft.levels[lang] || 1) >= 3 || knowsLanguage(lang, draft.prior);
    const holder = { start: draft.starts[lang] ?? null };
    const opts = optionList('start', [
      { value: 'zero', title: t('Von vorne anfangen', 'Start from the beginning'), sub: t(`Mit Lektion 1.1 „${first}“.${recommendTest ? '' : ' Empfohlen für dich.'}`, `With lesson 1.1 “${first}”.${recommendTest ? '' : ' Recommended for you.'}`), art: solidIcon('restart', 44) },
      { value: 'placement', title: t('Einstufungstest machen', 'Take the placement test'), sub: t(`Bis zu 10 Fragen, ca. 5 Minuten. Bit findet heraus, wo du einsteigst.${recommendTest ? ' Empfohlen für dich.' : ''}`, `Up to 10 questions, about 5 minutes. Bit finds out where you start.${recommendTest ? ' Recommended for you.' : ''}`), art: solidIcon('compass', 44) },
    ], { grid: true, target: holder, onChange: () => { draft.starts[lang] = holder.start; } });
    opts.bind(frame({ bubble: t(`Wo möchtest du in ${nameOf(lang)} anfangen?`, `Where do you want to start in ${nameOf(lang)}?`), body: opts.list, canGo: Boolean(holder.start) }));
  },

  result() {
    const lang = stepLang();
    const units = COURSES[lang].units;
    const placed = draft.placed[lang] || 0;
    const startUnit = units[Math.min(placed, units.length - 1)];
    const text = placed === 0
      ? t(`Wir fangen bei Abschnitt 1 „${units[0].title}“ an. Die Grundlagen sitzen danach sicher.`, `We start at unit 1 “${units[0].title}”. Afterwards the basics will be solid.`)
      : t(`Du hast ${placed} ${placed === 1 ? 'Abschnitt' : 'Abschnitte'} übersprungen und startest bei Abschnitt ${placed + 1} „${startUnit.title}“.`, `You skipped ${placed} ${placed === 1 ? 'unit' : 'units'} and start at unit ${placed + 1} “${startUnit.title}”.`);
    frame({
      bubble: placed === 0 ? t('Gut, dass wir gefragt haben!', 'Good thing we asked!') : t(`Stark, du kannst schon einiges in ${nameOf(lang)}!`, `Nice, you already know quite a bit of ${nameOf(lang)}!`),
      mood: 'cheer',
      body: h('div', { class: 'onb-result' },
        h('div', { class: 'score-row is-two' },
          h('div', { class: 'score is-leaf' }, h('span', {}, t('Richtig', 'Correct')), h('b', {}, `${placed}`)),
          h('div', { class: 'score is-sky' }, h('span', {}, t('Dein Start', 'Your start')), h('b', {}, t(`Abschnitt ${Math.min(placed + 1, units.length)}`, `Unit ${Math.min(placed + 1, units.length)}`)))),
        h('p', {}, text),
        placed > 0 ? h('p', { class: 'onb-note' }, t('Übersprungene Lektionen kannst du jederzeit trotzdem machen.', 'You can still do the skipped lessons any time.')) : null),
      canGo: true,
    });
  },

  goal() {
    const opts = numberList('goal', DAILY.map(([value, title, sub]) => ({ value, title, sub, side: `${value} XP` })), draft);
    opts.bind(frame({
      bubble: t('Wie viel Zeit willst du pro Tag investieren?', 'How much time do you want to invest per day?'),
      body: h('div', {}, opts.list, h('p', { class: 'onb-note' }, t('Eine Lektion bringt etwa 15 bis 22 XP. Du kannst das Ziel jederzeit im Profil ändern.', 'A lesson gives about 15 to 22 XP. You can change the goal any time in your profile.'))),
      canGo: Boolean(draft.goal),
    }));
  },

  setup() {
    const status = h('div', { class: 'onb-check' }, h('span', { class: 'muted' }, t('Ich schaue kurz auf deinem PC nach ...', 'Let me quickly check your PC ...')));
    const opts = optionList('setup', SETUP.map(([value, title]) => ({ value, title })));
    opts.bind(frame({
      bubble: t(`${draft.langs.length > 1 ? 'Sind' : 'Ist'} ${listNames(draft.langs)} auf deinem PC schon eingerichtet?`, `${draft.langs.length > 1 ? 'Are' : 'Is'} ${listNames(draft.langs)} already set up on your PC?`),
      hint: t('Sagst du nein oder teilweise, öffne ich dir in der Werkstatt gleich die passenden Anleitungen.', 'If you say no or partly, I\'ll open the matching guides in the Workshop for you.'),
      body: h('div', {}, opts.list, status),
      canGo: Boolean(draft.setup),
    }));
    const show = s => {
      if (!document.body.contains(status)) return;
      if (!s.ready) { setTimeout(() => getStatus(true).then(show), 1500); return; }
      const rows = [];
      rows.push(['Python', s.python ? s.python.version : null]);
      if (draft.langs.includes('cpp')) rows.push([t('C++-Compiler', 'C++ compiler'), s.cpp ? s.cpp.version.replace(/^Microsoft \(R\) C\/C\+\+ Optimizing Compiler Version/, 'MSVC') : null]);
      const allOk = rows.every(r => r[1]);
      status.replaceChildren(
        h('p', {}, h('b', {}, t('Bit hat nachgesehen:', 'Bit checked:'))),
        h('ul', {}, rows.map(([name, v]) => h('li', { class: v ? 'is-ok' : 'is-bad' }, h('span', { html: icon(v ? 'check' : 'cross', 18) }), t(`${name}: ${v || 'nicht gefunden'}`, `${name}: ${v || 'not found'}`)))),
        h('p', { class: 'muted' }, allOk
          ? t('Damit laufen alle Übungen echt auf deinem PC. Wie du auch außerhalb von Laufzeit programmierst, steht in der Werkstatt.', 'All exercises really run on your PC. How to program outside Laufzeit is explained in the Workshop.')
          : t('Laufzeit funktioniert trotzdem. Was fehlt und wie du es einrichtest, steht in der Werkstatt.', 'Laufzeit still works. What is missing and how to set it up is in the Workshop.')));
    };
    getStatus(true).then(show);
  },

  name() {
    const input = h('input', { class: 'text-input onb-name', maxlength: '40', placeholder: t('Dein Vorname', 'Your first name'), 'aria-label': t('Dein Name', 'Your name'), value: draft.name || '' });
    const ref = frame({
      bubble: t('Wie soll ich dich nennen?', 'What should I call you?'),
      hint: t('Freiwillig. Der Name steht in deinem Profil, dort kannst du auch Profil- und Titelbild hinzufügen.', 'Optional. The name appears in your profile, where you can also add a profile picture and banner.'),
      body: input,
      canGo: true,
      nextLabel: draft.name ? t('Weiter', 'Continue') : t('Überspringen', 'Skip'),
    });
    input.addEventListener('input', () => {
      draft.name = input.value.trim();
      ref.nextBtn.textContent = draft.name ? t('Weiter', 'Continue') : t('Überspringen', 'Skip');
    });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') next(); });
    input.focus();
  },

  ready() {
    const s = store.state;
    const startText = lang => (draft.starts[lang] === 'placement' && draft.placed[lang] ? t(`Abschnitt ${Math.min(draft.placed[lang] + 1, COURSES[lang].units.length)}`, `Unit ${Math.min(draft.placed[lang] + 1, COURSES[lang].units.length)}`) : t('Lektion 1.1', 'Lesson 1.1'));
    const rows = [
      [draft.langs.length > 1 ? t('Kurse', 'Courses') : t('Kurs', 'Course'), listNames(draft.langs)],
      draft.mode === 'full' ? [t('Deine Ziele', 'Your goals'), draft.reasons.map(r => GOAL_LABEL[r]).join(', ')] : null,
      draft.mode === 'full' && draft.name ? ['Name', draft.name] : null,
      [t('Tagesziel', 'Daily goal'), `${draft.mode === 'full' ? draft.goal : s.settings.dailyGoal} XP`],
      ...draft.langs.map(l => [`Start ${nameOf(l)}`, startText(l)]),
    ].filter(Boolean);

    // Persoenliche Hinweise aus den Antworten
    const reasons = draft.mode === 'full' ? draft.reasons : s.profile.reasons;
    const prior = draft.mode === 'full' ? draft.prior : s.profile.prior;
    const allLangs = [...new Set([...s.courses, ...draft.langs])];
    const notes = [];
    if (reasons.includes('game') && !allLangs.includes('cpp')) notes.push(t('Für Spieleentwicklung brauchst du später C++. Du kannst den Kurs jederzeit über das Kurs-Menü oben hinzufügen.', 'For game development you\'ll need C++ later. You can add the course any time from the course menu at the top.'));
    if (reasons.includes('school') && !allLangs.includes('python')) notes.push(t('In der Schule lernst du Python. Den Kurs kannst du jederzeit über das Kurs-Menü hinzufügen.', 'At school you learn Python. You can add the course any time from the course menu.'));
    if (draft.langs.includes('cpp') && (prior.includes('python') || allLangs.includes('python'))) notes.push(t('Du kennst Python: In C++ zeige ich dir oft den Python-Code direkt daneben.', 'You know Python: in C++ I\'ll often show you the Python code right next to it.'));
    if (reasons.some(r => r !== 'fun')) notes.push(t('Abschnitte, die zu deinen Zielen passen, sind im Lernpfad markiert.', 'Units that match your goals are marked on the learning path.'));

    frame({
      bubble: t('Alles bereit. Ich freu mich auf dich!', 'All set. I\'m looking forward to it!'),
      mood: 'cheer',
      body: h('div', {},
        h('div', { class: 'onb-summary' }, rows.map(([k, v]) => h('div', {}, h('span', {}, k), h('b', {}, v)))),
        notes.length ? h('ul', { class: 'onb-tips' }, notes.map(n => h('li', {}, n))) : null),
      canGo: true,
      nextLabel: t('Kurs starten', 'Start course'),
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
