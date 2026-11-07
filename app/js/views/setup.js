// Werkstatt: Systemcheck und Schritt-fuer-Schritt-Anleitungen zum Einrichten

import { t, locale } from '../i18n.js';
import { h, inline, toast } from '../util.js';
import { icon } from '../icons.js';
import { getStatus, IS_WEB } from '../runner.js';
import { DOWNLOAD_URL, REPO_URL } from '../config.js';
import { mobileStats } from './shell.js';
import { store } from '../store.js';

let openGuides = new Set([1]);

/** Befehl mit Kopier-Knopf */
function cmd(text) {
  const btn = h('button', {
    type: 'button',
    'aria-label': t('Befehl kopieren', 'Copy command'),
    onclick: async () => {
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = 'kopiert';
      } catch {
        btn.textContent = 'markieren';
      }
      setTimeout(() => { btn.textContent = 'kopieren'; }, 1500);
    },
  }, 'kopieren');
  return h('div', { class: 'cmd' }, h('pre', {}, text), btn);
}

const p = text => h('p', { html: inline(text) });

function guide(no, title, sub, steps, open = false) {
  return h('details', { class: 'guide', open: open || openGuides.has(no) },
    h('summary', {},
      h('span', { class: 'g-no' }, String(no).padStart(2, '0')),
      h('h3', {}, title, h('small', {}, sub)),
      h('span', { class: 'g-toggle', html: icon('chevron') })),
    h('div', { class: 'guide-body' }, h('ol', { class: 'steps' }, steps.map(s => h('li', {}, s)))));
}

function sysRow(name, state, text, detail) {
  return h('div', { class: 'sys-row' },
    h('b', {}, name),
    h('span', { class: 'muted' }, detail),
    h('span', { class: `sys-state is-${state}` }, text));
}

/** Anleitungen passend zu den Antworten aus der Einfuehrung aufklappen */
function personalGuides() {
  const s = store.state;
  const p = s.profile;
  const open = new Set();
  const why = [];
  if (p.setup === 'no' || p.setup === 'partly') {
    open.add(1);
    if (s.courses.includes('python')) open.add(2);
    if (s.courses.includes('cpp')) { open.add(3); open.add(4); }
    why.push(p.setup === 'no' ? 'noch nichts eingerichtet ist' : 'erst teilweise alles eingerichtet ist');
  }
  if (p.reasons.includes('game')) {
    open.add(6);
    open.add(7);
    why.push(t('Spieleentwicklung dein Ziel ist', 'game development is your goal'));
  }
  if (!open.size) open.add(1);
  return { open, why };
}

/** Online-Version: Laufzeit auf den eigenen PC holen (fuer echtes C++ und eigene Programme) */
function downloadSection() {
  return h('section', { class: 'section download-box' },
    h('h2', {}, t('Laufzeit herunterladen', 'Download Laufzeit')),
    p(t('Online läuft Python direkt im Browser. **C++ braucht einen echten Compiler**, und der läuft nur auf deinem PC. Außerdem willst du am Ende sowieso eigene Programme auf deinem Rechner schreiben. So holst du dir Laufzeit:', 'Online, Python runs directly in the browser. **C++ needs a real compiler**, and that only runs on your PC. And in the end you\'ll want to write your own programs on your computer anyway. Here\'s how to get Laufzeit:')),
    h('ol', { class: 'steps' },
      h('li', { html: inline(t('Lade das ZIP herunter und entpacke es, z. B. auf den Desktop.', 'Download the ZIP and unpack it, e.g. to your desktop.')) }),
      h('li', { html: inline(t('Installiere Python von python.org (Haken bei **„Add python.exe to PATH“**), siehe Anleitung 02.', 'Install Python from python.org (tick **“Add python.exe to PATH”**), see guide 02.')) }),
      h('li', { html: inline(t('Für C++: Visual Studio mit **„Desktopentwicklung mit C++“**, siehe Anleitung 03.', 'For C++: Visual Studio with **“Desktop development with C++”**, see guide 03.')) }),
      h('li', { html: inline(t('Doppelklick auf **`start.bat`**. Laufzeit öffnet sich unter `127.0.0.1:5741`.', 'Double-click **`start.bat`**. Laufzeit opens at `127.0.0.1:5741`.')) }),
      h('li', { html: inline(t('Mit deinem Konto einloggen. Dein Fortschritt kommt automatisch mit.', 'Log in with your account. Your progress comes along automatically.')) })),
    h('div', { class: 'row-actions' },
      h('a', { class: 'btn btn-go', href: DOWNLOAD_URL, rel: 'noopener' }, 'ZIP herunterladen'),
      h('a', { class: 'btn btn-ghost', href: REPO_URL, target: '_blank', rel: 'noopener' }, t('Auf GitHub ansehen', 'View on GitHub'))));
}

export function renderSetup(main) {
  const personal = personalGuides();
  openGuides = personal.open;
  const sys = h('div', { class: 'sys', 'aria-live': 'polite' },
    sysRow('Server', 'wait', t('prüfe', 'checking'), t('Verbindung zu server.py', 'Connection to server.py')),
    sysRow('Python', 'wait', t('prüfe', 'checking'), 'Interpreter'),
    sysRow('C++', 'wait', t('prüfe', 'checking'), 'Compiler'));

  async function check(force) {
    const s = await getStatus(force);
    sys.innerHTML = '';
    if (s.web) {
      sys.append(
        sysRow('Version', 'ok', 'online', t('Laufzeit im Browser, ohne Installation', 'Laufzeit in the browser, no installation')),
        sysRow('Python', 'ok', 'bereit', t(`${s.python.version}, läuft direkt im Browser (Pyodide)`, `${s.python.version}, runs directly in the browser (Pyodide)`)),
        sysRow('C++', 'bad', 'nur lokal', t('Im Browser gibt es keinen Compiler. Lade Laufzeit herunter, siehe unten.', 'There is no compiler in the browser. Download Laufzeit, see below.')));
      return s;
    }
    sys.append(
      sysRow('Server', s.online ? 'ok' : 'bad', s.online ? t('läuft', 'running') : 'aus', s.online ? t('Laufzeit läuft lokal auf 127.0.0.1:5741', 'Laufzeit runs locally at 127.0.0.1:5741') : t('Starte die App mit start.bat', 'Start the app with start.bat')),
      sysRow('Python', s.python ? 'ok' : 'bad', s.python ? 'bereit' : 'fehlt', s.python ? s.python.version : t('Siehe Anleitung 02', 'See guide 02')),
      sysRow('C++', s.cpp ? 'ok' : s.ready ? 'bad' : 'wait', s.cpp ? 'bereit' : s.ready ? 'fehlt' : 'sucht', s.cpp ? s.cpp.version : s.ready ? t('Siehe Anleitung 03', 'See guide 03') : t('Der Compiler wird beim Start gesucht, das dauert ein paar Sekunden', 'The compiler is searched at startup, this takes a few seconds')));
    if (!s.ready) setTimeout(() => check(true), 2500);
    return s;
  }

  main.append(
    h('header', { class: 'page-head' },
      h('p', { class: 'eyebrow' }, t('Werkstatt', 'Workshop')),
      h('h1', { class: 'display' }, t('Werkstatt', 'Workshop')),
      h('p', { class: 'lede' }, t('Alles, was du brauchst, um auch außerhalb von Laufzeit echte Programme zu schreiben. Für Windows, Schritt für Schritt.', 'Everything you need to write real programs outside of Laufzeit too. For Windows, step by step.'))),
    mobileStats(),
    IS_WEB ? downloadSection() : null,
    h('section', { class: 'section' },
      h('h2', {}, t('Dein System', 'Your system')),
      h('p', {}, IS_WEB ? t('In der Online-Version prüft Laufzeit Python direkt im Browser:', 'In the online version Laufzeit checks Python directly in the browser:') : t('Laufzeit prüft deinen Code mit den Werkzeugen auf deinem PC. So sieht es gerade aus:', 'Laufzeit checks your code with the tools on your PC. This is the current state:')),
      sys,
      h('button', { type: 'button', class: 'btn btn-small', onclick: () => check(true).then(() => toast(t('Neu geprüft', 'Checked again'))) }, h('span', { html: icon('reset', 16) }), t('Neu prüfen', 'Check again'))),

    h('section', { class: 'section' },
      h('h2', {}, t('Anleitungen', 'Guides')),
      personal.why.length ? h('p', { class: 'note', style: { marginBottom: 'var(--s4)' } }, t(`Weil ${personal.why.join(' und ')}, habe ich dir die passenden Anleitungen schon aufgeklappt.`, `Because ${personal.why.join(' and ')}, I've already opened the matching guides for you.`)) : null,
      guide(1, t('VS Code einrichten', 'Set up VS Code'), t('Der Editor, in dem Profis schreiben', 'The editor pros write in'), [
        p(t('Lade VS Code von **code.visualstudio.com** herunter und installiere es. Setze beim Installieren die Haken bei **"Zu PATH hinzufügen"** und **"Mit Code öffnen"**.', 'Download VS Code from **code.visualstudio.com** and install it. During installation tick **"Add to PATH"** and **"Open with Code"**.')),
        p(t('Öffne VS Code, klick links auf das Symbol mit den vier Quadraten (**Erweiterungen**, oder `Strg+Umschalt+X`).', 'Open VS Code, click the icon with the four squares on the left (**Extensions**, or `Ctrl+Shift+X`).')),
        p(t('Suche und installiere **Python** (von Microsoft) und **C/C++** (von Microsoft).', 'Search for and install **Python** (by Microsoft) and **C/C++** (by Microsoft).')),
        p(t('Leg dir auf dem Desktop einen Ordner `Code` an. In VS Code: **Datei, Ordner öffnen**, diesen Ordner wählen. Dort landen ab jetzt deine Programme.', 'Create a folder `Code` on your desktop. In VS Code: **File, Open Folder**, pick that folder. Your programs go there from now on.')),
        h('div', { class: 'note', html: inline(t('Auf deinem PC ist VS Code schon installiert. Prüf nur, ob die zwei Erweiterungen da sind.', 'VS Code is already installed on your PC. Just check that the two extensions are there.')) }),
      ], true),
      guide(2, t('Python prüfen und das erste Skript', 'Check Python and write your first script'), t('Interpreter, Terminal, hello.py', 'Interpreter, terminal, hello.py'), [
        p(t('Falls Python fehlt: Installer von **python.org** laden. Ganz wichtig: unten im ersten Fenster den Haken bei **"Add python.exe to PATH"** setzen.', 'If Python is missing: download the installer from **python.org**. Very important: in the first window, tick **"Add python.exe to PATH"** at the bottom.')),
        p(t('Öffne in VS Code das Terminal mit **Terminal, Neues Terminal** (oder `Strg+ö`). Tippe:', 'In VS Code open the terminal with **Terminal, New Terminal** (or `Ctrl+ö`). Type:')),
        cmd('python --version'),
        p(t('Es sollte etwas wie `Python 3.13.7` erscheinen.', 'Something like `Python 3.13.7` should appear.')),
        p(t('Leg im Ordner eine Datei `hello.py` an, schreib `print("Hallo")` hinein, speichere mit `Strg+S` und starte sie im Terminal:', 'Create a file `hello.py` in the folder, write `print("Hello")` in it, save with `Ctrl+S` and run it in the terminal:')),
        cmd('python hello.py'),
        p(t('Alternativ oben rechts auf das Dreieck **Python-Datei ausführen** klicken.', 'Or click the triangle **Run Python File** at the top right.')),
        p(t('Für den Spiele-Abschnitt 11 brauchst du **pygame**. Installiere es einmal im Terminal:', 'For the games unit 11 you need **pygame**. Install it once in the terminal:')),
        cmd('pip install pygame'),
      ]),
      guide(3, t('C++-Compiler einrichten', 'Set up a C++ compiler'), t('Visual Studio oder g++', 'Visual Studio or g++'), [
        p(t('**Variante A, empfohlen für dich:** der Compiler aus **Visual Studio Community**. Den brauchst du später sowieso für Unreal. Laufzeit hat ihn auf deinem PC schon gefunden.', '**Option A, recommended for you:** the compiler from **Visual Studio Community**. You\'ll need it for Unreal later anyway. Laufzeit already found it on your PC.')),
        p(t('Falls er fehlt: Starte den **Visual Studio Installer**, wähle **Ändern** und setze den Haken bei **"Desktopentwicklung mit C++"**. Für Unreal zusätzlich **"Spieleentwicklung mit C++"**.', 'If it\'s missing: start the **Visual Studio Installer**, choose **Modify** and tick **"Desktop development with C++"**. For Unreal also **"Game development with C++"**.')),
        p(t('Um ihn außerhalb von Laufzeit zu nutzen, öffne über das Startmenü die **Developer PowerShell for VS**. Nur dort ist `cl` bekannt:', 'To use it outside Laufzeit, open **Developer PowerShell for VS** from the start menu. Only there is `cl` known:')),
        cmd('cl /EHsc /std:c++20 /utf-8 hello.cpp'),
        cmd('.\\hello.exe'),
        p(t('**Variante B:** g++ über **MSYS2** (msys2.org). Nach der Installation im MSYS2-Fenster:', '**Option B:** g++ via **MSYS2** (msys2.org). After installing, in the MSYS2 window:')),
        cmd('pacman -S mingw-w64-ucrt-x86_64-gcc'),
        p(t('Danach `C:\\msys64\\ucrt64\\bin` zur Windows-Umgebungsvariable **Path** hinzufügen und VS Code neu starten. Test mit `g++ --version`.', 'Then add `C:\\msys64\\ucrt64\\bin` to the Windows environment variable **Path** and restart VS Code. Test with `g++ --version`.')),
        h('div', { class: 'note', html: inline(t('Laufzeit nimmt automatisch g++, wenn es im PATH ist, sonst den Visual-Studio-Compiler.', 'Laufzeit automatically uses g++ if it\'s on the PATH, otherwise the Visual Studio compiler.')) }),
      ]),
      guide(4, t('Erstes C++-Programm in VS Code', 'First C++ program in VS Code'), t('Schreiben, kompilieren, starten', 'Write, compile, run'), [
        p(t('Leg im Ordner `Code` eine Datei `hello.cpp` an und füg das Grundgerüst aus Lektion 1.1 ein.', 'Create a file `hello.cpp` in the `Code` folder and paste the skeleton from lesson 1.1.')),
        p(t('Öffne die **Developer PowerShell for VS**, wechsle in deinen Ordner und kompiliere:', 'Open **Developer PowerShell for VS**, go to your folder and compile:')),
        cmd('cd $HOME\\Desktop\\Code'),
        cmd('cl /EHsc /std:c++20 /utf-8 hello.cpp'),
        p(t('Es entsteht `hello.exe`. Starte sie mit `.\\hello.exe`. Genau das macht Laufzeit bei jedem Klick auf **Ausführen** im Hintergrund.', 'This creates `hello.exe`. Run it with `.\\hello.exe`. That\'s exactly what Laufzeit does in the background every time you click **Run**.')),
        p(t('Tipp: Startest du VS Code aus der Developer PowerShell mit `code .`, kennt auch das Terminal in VS Code den Compiler.', 'Tip: if you start VS Code from the Developer PowerShell with `code .`, the terminal in VS Code knows the compiler too.')),
      ]),
      guide(5, t('Raylib für eigene Spiele', 'Raylib for your own games'), t('Kommt mit dem Raylib-Abschnitt', 'Comes with the Raylib unit'), [
        p(t('Raylib ist eine kleine Bibliothek für Fenster, Grafik, Tastatur und Sound. Ideal, um den Game-Loop selbst zu bauen, bevor eine große Engine dir alles abnimmt.', 'Raylib is a small library for windows, graphics, keyboard and sound. Ideal for building the game loop yourself before a big engine does everything for you.')),
        p(t('Lade auf **raylib.com** den **Windows-Installer**. Er bringt einen fertigen Compiler (w64devkit) und Beispiele mit.', 'Download the **Windows installer** from **raylib.com**. It includes a ready-made compiler (w64devkit) and examples.')),
        p(t('Öffne nach der Installation `C:\\raylib\\raylib\\examples` und starte ein Beispiel mit **notepad++** aus dem Raylib-Ordner, dort mit `F6`.', 'After installing, open `C:\\raylib\\raylib\\examples` and run an example with **notepad++** from the Raylib folder, there with `F6`.')),
        h('div', { class: 'note', html: inline(t('Den Raylib-Teil des Kurses gibt es ab Abschnitt 12. Bis dahin reicht reines C++.', 'The Raylib part of the course starts in unit 12. Until then plain C++ is enough.')) }),
      ]),
      guide(6, t('Unreal Engine mit C++', 'Unreal Engine with C++'), t('UE 5 ist auf deinem PC schon da', 'UE 5 is already on your PC'), [
        p(t('Unreal startest du über den **Epic Games Launcher**, Reiter **Unreal Engine, Bibliothek**.', 'Start Unreal from the **Epic Games Launcher**, tab **Unreal Engine, Library**.')),
        p(t('Für C++-Projekte braucht Unreal Visual Studio mit **"Spieleentwicklung mit C++"** (siehe Anleitung 03).', 'For C++ projects Unreal needs Visual Studio with **"Game development with C++"** (see guide 03).')),
        p(t('Neues Projekt: **Games, Third Person**, rechts **C++** statt Blueprint wählen. Unreal erzeugt den Code und öffnet ihn in Visual Studio.', 'New project: **Games, Third Person**, on the right choose **C++** instead of Blueprint. Unreal generates the code and opens it in Visual Studio.')),
        p(t('Der erste eigene Actor: im Editor **Tools, Neue C++-Klasse, Actor**. Die Funktion `Tick` darin kennst du schon aus Lektion 4.3.', 'Your first own actor: in the editor **Tools, New C++ Class, Actor**. You already know its `Tick` function from lesson 4.3.')),
        h('div', { class: 'note', html: inline(t('Unreal-C++ ist der letzte Abschnitt des Kurses. Vorher brauchst du Klassen, Pointer und Vererbung, sonst wirkt der Code wie Zauberei.', 'Unreal C++ is the last unit of the course. Before that you need classes, pointers and inheritance, otherwise the code looks like magic.')) }),
      ]),
      guide(7, t('Andere Engines', 'Other engines'), t('Godot und Unity im Vergleich', 'Godot and Unity compared'), [
        p(t('**Godot:** kostenlos, leicht, sehr beliebt bei Indies. Die Skriptsprache **GDScript** sieht fast aus wie Python, dein Schulwissen zahlt sich hier direkt aus. Für Performance gibt es auch C++ (GDExtension).', '**Godot:** free, lightweight, very popular with indies. Its scripting language **GDScript** looks almost like Python, so your school knowledge pays off right away. For performance there\'s also C++ (GDExtension).')),
        p(t('**Unity:** nutzt **C#**. Die Syntax ähnelt C++ stark: Klammern, Semikolons, Typen, Klassen. Wer C++ kann, liest C# nach wenigen Tagen.', '**Unity:** uses **C#**. The syntax is very similar to C++: braces, semicolons, types, classes. If you know C++, you can read C# after a few days.')),
        p(t('**Unreal:** C++ und Blueprints. Branchenstandard für große 3D-Spiele. Studios wie Rockstar nutzen eigene Engines (bei Rockstar heißt sie RAGE), die ebenfalls in C++ geschrieben sind.', '**Unreal:** C++ and Blueprints. The industry standard for big 3D games. Studios like Rockstar use their own engines (Rockstar\'s is called RAGE), which are also written in C++.')),
      ])));

  check(false);
}
