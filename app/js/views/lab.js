// Labor: freier Editor, der Code wirklich auf diesem PC ausfuehrt

import { t, locale } from '../i18n.js';
import { h, confirmDialog } from '../util.js';
import { icon } from '../icons.js';
import { store } from '../store.js';
import { COURSES } from '../content/index.js';
import { createEditor } from '../editor.js';
import { runCode, getStatus, needsInput } from '../runner.js';
import { consolePanel } from './exercises.js';
import { cppMain } from '../content/helpers.js';

const EXAMPLES = {
  python: [
    [t('Leer', 'Empty'), 'print("Hallo aus dem Labor")\n'],
    [t('Zahlenraten', 'Guess the number'), 'import random\n\nziel = random.randint(1, 20)\nversuche = 0\n\nwhile True:\n    tipp = int(input("Dein Tipp (1-20): "))\n    versuche += 1\n    if tipp < ziel:\n        print("Zu klein")\n    elif tipp > ziel:\n        print("Zu groß")\n    else:\n        print(f"Richtig! {versuche} Versuche.")\n        break\n'],
    [t('Einmaleins', 'Times table'), 'for zeile in range(1, 6):\n    for spalte in range(1, 6):\n        print(f"{zeile * spalte:4}", end="")\n    print()\n'],
  ],
  cpp: [
    [t('Leer', 'Empty'), cppMain('std::cout << "Hallo aus dem Labor" << std::endl;') + '\n'],
    ['Game-Loop', cppMain('int x = 0;\nint ziel = 10;\nint frame = 0;\n\nwhile (x < ziel) {\n    frame++;\n    x += 3;                 // Update\n    if (x > ziel) x = ziel;\n    std::cout << "Frame " << frame << ": ";\n    for (int i = 0; i < ziel; i++) {\n        std::cout << (i == x - 1 ? "@" : ".");   // Render\n    }\n    std::cout << std::endl;\n}\nstd::cout << "Ziel erreicht" << std::endl;') + '\n'],
    [t('Schadensrechner', 'Damage calculator'), cppMain('int hp;\nint schaden;\nstd::cout << "HP und Schaden: ";\nstd::cin >> hp >> schaden;\nhp -= schaden;\nif (hp <= 0) {\n    std::cout << "Besiegt" << std::endl;\n} else {\n    std::cout << "Rest-HP: " << hp << std::endl;\n}') + '\n'],
  ],
};

export function renderLab(main) {
  const lang = store.state.activeLang;
  const course = COURSES[lang];
  const saved = store.state.lab[lang];
  const out = consolePanel();
  const runtime = h('span', { class: 'runtime-line' }, t('Prüfe Werkzeuge ...', 'Checking tools ...'));
  let busy = false;
  let saveTimer = null;

  const editor = createEditor({
    value: saved ?? EXAMPLES[lang][0][1],
    lang,
    minLines: 16,
    label: t(`${course.name}-Code`, `${course.name} code`),
    onRun: () => run(),
    onChange: value => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => store.update(s => { s.lab[lang] = value; }), 400);
    },
  });

  const stdin = h('textarea', {
    class: 'lab-stdin',
    placeholder: lang === 'cpp' ? t('Eingaben für std::cin, z. B. 100 25', 'Input for std::cin, e.g. 100 25') : t('Eingaben für input(), eine pro Zeile', 'Input for input(), one per line'),
    'aria-label': t('Eingaben für das Programm', 'Input for the program'),
    spellcheck: 'false',
  });

  // Python laeuft im Terminal-Stil: bei jedem input() fragt die Konsole nach.
  // Technisch wird das Programm mit allen bisherigen Antworten neu gestartet,
  // der Zufall ist pro Durchlauf fest, darum sieht es aus wie ein durchgehender Lauf.
  let session = 0;
  const MAX_ANSWERS = 200;

  async function run() {
    if (busy) return;
    busy = true;
    runBtn.disabled = true;
    const mine = ++session;
    const status = await getStatus();
    const tool = lang === 'cpp' ? status.cpp?.version || 'Compiler' : status.python?.version;
    out.running(tool);
    if (lang !== 'python') {
      const res = await runCode(lang, editor.value, stdin.value);
      editor.markLine(out.show(res, lang).line);
      busy = false;
      runBtn.disabled = false;
      return;
    }
    const code = editor.value;
    const seed = Math.floor(Math.random() * 1e9);
    const answers = [];
    const step = async () => {
      if (mine !== session) return;
      const input = answers.length ? `${answers.join('\n')}\n` : '';
      const res = await runCode('python', code, input, { interactive: seed });
      if (mine !== session) return;
      if (needsInput(res) && answers.length < MAX_ANSWERS) {
        busy = false;
        runBtn.disabled = false;
        editor.markLine(null);
        out.ask((res.stdout || '').replace(/\r\n?/g, '\n'), res.tool || tool, value => {
          if (mine !== session) return;
          answers.push(value);
          busy = true;
          runBtn.disabled = true;
          step();
        });
        return;
      }
      editor.markLine(out.show(res, lang).line);
      busy = false;
      runBtn.disabled = false;
    };
    step();
  }

  const runBtn = h('button', { type: 'button', class: 'btn btn-go', onclick: run }, h('span', { html: icon('run', 18) }), t('Ausführen', 'Run'));

  main.append(
    h('header', { class: 'page-head' },
      h('p', { class: 'eyebrow' }, t(`Labor · ${course.name}`, `Lab · ${course.name}`)),
      h('h1', { class: 'display' }, t('Labor', 'Lab')),
      h('p', { class: 'lede' }, lang === 'python'
        ? t('Freie Spielwiese. Schreib beliebigen Code und führe ihn aus. Fragt dein Programm mit input() etwas, tippst du die Antwort direkt in die Ausgabe, wie im Terminal. Dein Code wird automatisch gemerkt.', 'Free playground. Write any code and run it. When your program asks something with input(), you type the answer right into the output, like in a terminal. Your code is remembered automatically.')
        : t('Freie Spielwiese. Schreib beliebigen Code und führe ihn direkt auf deinem PC aus. Eingaben für std::cin trägst du vorher unten ein. Dein Code wird automatisch gemerkt.', 'Free playground. Write any code and run it directly. Enter input for std::cin below beforehand. Your code is remembered automatically.'))),
    h('div', { class: 'section', style: { maxWidth: '980px' } },
      h('div', { class: 'lab-examples' }, h('span', {}, t('Beispiele:', 'Examples:')),
        EXAMPLES[lang].map(([name, code]) => h('button', {
          type: 'button',
          class: 'btn btn-small',
          onclick: async () => {
            const current = editor.value.trim();
            const isExample = EXAMPLES[lang].some(([, c]) => c.trim() === current);
            if (current && !isExample && !(await confirmDialog({ title: t('Code ersetzen?', 'Replace code?'), text: t('Dein aktueller Code im Labor wird durch das Beispiel ersetzt.', 'Your current code in the Lab will be replaced by the example.'), ok: t('Ersetzen', 'Replace') }))) return;
            editor.setValue(code);
            editor.focus();
          },
        }, name))),
      editor.el,
      h('div', { class: 'ed-bar' }, h('span', { class: 'hint-key' }, t('Strg+Enter: Ausführen', 'Ctrl+Enter: run'))),
      h('div', { class: 'lab-tools' }, runBtn, runtime),
      lang === 'cpp' ? h('label', { class: 'field' }, h('span', {}, t('Eingaben (optional)', 'Input (optional)')), stdin) : null,
      out.el));

  getStatus(true).then(status => {
    if (!status.online) runtime.textContent = t('Server nicht erreichbar. Läuft start.bat?', 'Server not reachable. Is start.bat running?');
    else if (lang === 'cpp') runtime.textContent = status.cpp ? t(`läuft mit ${status.cpp.version}`, `runs with ${status.cpp.version}`) : status.ready ? t('Kein C++-Compiler gefunden. Siehe Werkstatt.', 'No C++ compiler found. See Workshop.') : t('Compiler wird noch gesucht ...', 'Still looking for a compiler ...');
    else runtime.textContent = status.python ? t(`läuft mit ${status.python.version}`, `runs with ${status.python.version}`) : t('Python nicht gefunden.', 'Python not found.');
  });
}
