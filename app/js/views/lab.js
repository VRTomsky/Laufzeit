// Labor: freier Editor, der Code wirklich auf diesem PC ausfuehrt

import { h, confirmDialog } from '../util.js';
import { icon } from '../icons.js';
import { store } from '../store.js';
import { COURSES } from '../content/index.js';
import { createEditor } from '../editor.js';
import { runCode, getStatus } from '../runner.js';
import { consolePanel } from './exercises.js';
import { cppMain } from '../content/helpers.js';

const EXAMPLES = {
  python: [
    ['Leer', 'print("Hallo aus dem Labor")\n'],
    ['Zahlenraten', 'import random\n\nziel = random.randint(1, 20)\nversuche = 0\n\nwhile True:\n    tipp = int(input("Dein Tipp (1-20): "))\n    versuche += 1\n    if tipp < ziel:\n        print("Zu klein")\n    elif tipp > ziel:\n        print("Zu groß")\n    else:\n        print(f"Richtig! {versuche} Versuche.")\n        break\n'],
    ['Einmaleins', 'for zeile in range(1, 6):\n    for spalte in range(1, 6):\n        print(f"{zeile * spalte:4}", end="")\n    print()\n'],
  ],
  cpp: [
    ['Leer', cppMain('std::cout << "Hallo aus dem Labor" << std::endl;') + '\n'],
    ['Game-Loop', cppMain('int x = 0;\nint ziel = 10;\nint frame = 0;\n\nwhile (x < ziel) {\n    frame++;\n    x += 3;                 // Update\n    if (x > ziel) x = ziel;\n    std::cout << "Frame " << frame << ": ";\n    for (int i = 0; i < ziel; i++) {\n        std::cout << (i == x - 1 ? "@" : ".");   // Render\n    }\n    std::cout << std::endl;\n}\nstd::cout << "Ziel erreicht" << std::endl;') + '\n'],
    ['Schadensrechner', cppMain('int hp;\nint schaden;\nstd::cout << "HP und Schaden: ";\nstd::cin >> hp >> schaden;\nhp -= schaden;\nif (hp <= 0) {\n    std::cout << "Besiegt" << std::endl;\n} else {\n    std::cout << "Rest-HP: " << hp << std::endl;\n}') + '\n'],
  ],
};

export function renderLab(main) {
  const lang = store.state.activeLang;
  const course = COURSES[lang];
  const saved = store.state.lab[lang];
  const out = consolePanel();
  const runtime = h('span', { class: 'runtime-line' }, 'Prüfe Werkzeuge ...');
  let busy = false;
  let saveTimer = null;

  const editor = createEditor({
    value: saved ?? EXAMPLES[lang][0][1],
    lang,
    minLines: 16,
    label: `${course.name}-Code`,
    onRun: () => run(),
    onChange: value => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => store.update(s => { s.lab[lang] = value; }), 400);
    },
  });

  const stdin = h('textarea', {
    class: 'lab-stdin',
    placeholder: lang === 'cpp' ? 'Eingaben für std::cin, z. B. 100 25' : 'Eingaben für input(), eine pro Zeile',
    'aria-label': 'Eingaben für das Programm',
    spellcheck: 'false',
  });

  async function run() {
    if (busy) return;
    busy = true;
    runBtn.disabled = true;
    const status = await getStatus();
    out.running(lang === 'cpp' ? status.cpp?.version || 'Compiler' : status.python?.version);
    const res = await runCode(lang, editor.value, stdin.value);
    const info = out.show(res, lang);
    editor.markLine(info.line);
    busy = false;
    runBtn.disabled = false;
  }

  const runBtn = h('button', { type: 'button', class: 'btn btn-go', onclick: run }, h('span', { html: icon('run', 18) }), 'Ausführen');

  main.append(
    h('header', { class: 'page-head' },
      h('p', { class: 'eyebrow' }, `Labor · ${course.name}`),
      h('h1', { class: 'display' }, 'Labor'),
      h('p', { class: 'lede' }, 'Freie Spielwiese. Schreib beliebigen Code und führe ihn direkt auf deinem PC aus. Dein Code wird automatisch gemerkt.')),
    h('div', { class: 'section', style: { maxWidth: '980px' } },
      h('div', { class: 'lab-examples' }, h('span', {}, 'Beispiele:'),
        EXAMPLES[lang].map(([name, code]) => h('button', {
          type: 'button',
          class: 'btn btn-small',
          onclick: async () => {
            const current = editor.value.trim();
            const isExample = EXAMPLES[lang].some(([, c]) => c.trim() === current);
            if (current && !isExample && !(await confirmDialog({ title: 'Code ersetzen?', text: 'Dein aktueller Code im Labor wird durch das Beispiel ersetzt.', ok: 'Ersetzen' }))) return;
            editor.setValue(code);
            editor.focus();
          },
        }, name))),
      editor.el,
      h('div', { class: 'ed-bar' }, h('span', { class: 'hint-key' }, 'Strg+Enter: Ausführen')),
      h('div', { class: 'lab-tools' }, runBtn, runtime),
      h('label', { class: 'field' }, h('span', {}, 'Eingaben (optional)'), stdin),
      out.el));

  getStatus(true).then(status => {
    if (!status.online) runtime.textContent = 'Server nicht erreichbar. Läuft start.bat?';
    else if (lang === 'cpp') runtime.textContent = status.cpp ? `läuft mit ${status.cpp.version}` : status.ready ? 'Kein C++-Compiler gefunden. Siehe Werkstatt.' : 'Compiler wird noch gesucht ...';
    else runtime.textContent = status.python ? `läuft mit ${status.python.version}` : 'Python nicht gefunden.';
  });
}
