// Werkstatt: Systemcheck und Schritt-fuer-Schritt-Anleitungen zum Einrichten

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
    'aria-label': 'Befehl kopieren',
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
    why.push('Spieleentwicklung dein Ziel ist');
  }
  if (!open.size) open.add(1);
  return { open, why };
}

/** Online-Version: Laufzeit auf den eigenen PC holen (fuer echtes C++ und eigene Programme) */
function downloadSection() {
  return h('section', { class: 'section download-box' },
    h('h2', {}, 'Laufzeit herunterladen'),
    p('Online läuft Python direkt im Browser. **C++ braucht einen echten Compiler**, und der läuft nur auf deinem PC. Außerdem willst du am Ende sowieso eigene Programme auf deinem Rechner schreiben. So holst du dir Laufzeit:'),
    h('ol', { class: 'steps' },
      h('li', { html: inline('Lade das ZIP herunter und entpacke es, z. B. auf den Desktop.') }),
      h('li', { html: inline('Installiere Python von python.org (Haken bei **„Add python.exe to PATH“**), siehe Anleitung 02.') }),
      h('li', { html: inline('Für C++: Visual Studio mit **„Desktopentwicklung mit C++“**, siehe Anleitung 03.') }),
      h('li', { html: inline('Doppelklick auf **`start.bat`**. Laufzeit öffnet sich unter `127.0.0.1:5741`.') }),
      h('li', { html: inline('Mit deinem Konto einloggen. Dein Fortschritt kommt automatisch mit.') })),
    h('div', { class: 'row-actions' },
      h('a', { class: 'btn btn-go', href: DOWNLOAD_URL, rel: 'noopener' }, 'ZIP herunterladen'),
      h('a', { class: 'btn btn-ghost', href: REPO_URL, target: '_blank', rel: 'noopener' }, 'Auf GitHub ansehen')));
}

export function renderSetup(main) {
  const personal = personalGuides();
  openGuides = personal.open;
  const sys = h('div', { class: 'sys', 'aria-live': 'polite' },
    sysRow('Server', 'wait', 'prüfe', 'Verbindung zu server.py'),
    sysRow('Python', 'wait', 'prüfe', 'Interpreter'),
    sysRow('C++', 'wait', 'prüfe', 'Compiler'));

  async function check(force) {
    const s = await getStatus(force);
    sys.innerHTML = '';
    if (s.web) {
      sys.append(
        sysRow('Version', 'ok', 'online', 'Laufzeit im Browser, ohne Installation'),
        sysRow('Python', 'ok', 'bereit', `${s.python.version}, läuft direkt im Browser (Pyodide)`),
        sysRow('C++', 'bad', 'nur lokal', 'Im Browser gibt es keinen Compiler. Lade Laufzeit herunter, siehe unten.'));
      return s;
    }
    sys.append(
      sysRow('Server', s.online ? 'ok' : 'bad', s.online ? 'läuft' : 'aus', s.online ? 'Laufzeit läuft lokal auf 127.0.0.1:5741' : 'Starte die App mit start.bat'),
      sysRow('Python', s.python ? 'ok' : 'bad', s.python ? 'bereit' : 'fehlt', s.python ? s.python.version : 'Siehe Anleitung 02'),
      sysRow('C++', s.cpp ? 'ok' : s.ready ? 'bad' : 'wait', s.cpp ? 'bereit' : s.ready ? 'fehlt' : 'sucht', s.cpp ? s.cpp.version : s.ready ? 'Siehe Anleitung 03' : 'Der Compiler wird beim Start gesucht, das dauert ein paar Sekunden'));
    if (!s.ready) setTimeout(() => check(true), 2500);
    return s;
  }

  main.append(
    h('header', { class: 'page-head' },
      h('p', { class: 'eyebrow' }, 'Werkstatt'),
      h('h1', { class: 'display' }, 'Werkstatt'),
      h('p', { class: 'lede' }, 'Alles, was du brauchst, um auch außerhalb von Laufzeit echte Programme zu schreiben. Für Windows, Schritt für Schritt.')),
    mobileStats(),
    IS_WEB ? downloadSection() : null,
    h('section', { class: 'section' },
      h('h2', {}, 'Dein System'),
      h('p', {}, IS_WEB ? 'In der Online-Version prüft Laufzeit Python direkt im Browser:' : 'Laufzeit prüft deinen Code mit den Werkzeugen auf deinem PC. So sieht es gerade aus:'),
      sys,
      h('button', { type: 'button', class: 'btn btn-small', onclick: () => check(true).then(() => toast('Neu geprüft')) }, h('span', { html: icon('reset', 16) }), 'Neu prüfen')),

    h('section', { class: 'section' },
      h('h2', {}, 'Anleitungen'),
      personal.why.length ? h('p', { class: 'note', style: { marginBottom: 'var(--s4)' } }, `Weil ${personal.why.join(' und ')}, habe ich dir die passenden Anleitungen schon aufgeklappt.`) : null,
      guide(1, 'VS Code einrichten', 'Der Editor, in dem Profis schreiben', [
        p('Lade VS Code von **code.visualstudio.com** herunter und installiere es. Setze beim Installieren die Haken bei **"Zu PATH hinzufügen"** und **"Mit Code öffnen"**.'),
        p('Öffne VS Code, klick links auf das Symbol mit den vier Quadraten (**Erweiterungen**, oder `Strg+Umschalt+X`).'),
        p('Suche und installiere **Python** (von Microsoft) und **C/C++** (von Microsoft).'),
        p('Leg dir auf dem Desktop einen Ordner `Code` an. In VS Code: **Datei, Ordner öffnen**, diesen Ordner wählen. Dort landen ab jetzt deine Programme.'),
        h('div', { class: 'note', html: inline('Auf deinem PC ist VS Code schon installiert. Prüf nur, ob die zwei Erweiterungen da sind.') }),
      ], true),
      guide(2, 'Python prüfen und das erste Skript', 'Interpreter, Terminal, hello.py', [
        p('Falls Python fehlt: Installer von **python.org** laden. Ganz wichtig: unten im ersten Fenster den Haken bei **"Add python.exe to PATH"** setzen.'),
        p('Öffne in VS Code das Terminal mit **Terminal, Neues Terminal** (oder `Strg+ö`). Tippe:'),
        cmd('python --version'),
        p('Es sollte etwas wie `Python 3.13.7` erscheinen.'),
        p('Leg im Ordner eine Datei `hello.py` an, schreib `print("Hallo")` hinein, speichere mit `Strg+S` und starte sie im Terminal:'),
        cmd('python hello.py'),
        p('Alternativ oben rechts auf das Dreieck **Python-Datei ausführen** klicken.'),
        p('Für den Spiele-Abschnitt 11 brauchst du **pygame**. Installiere es einmal im Terminal:'),
        cmd('pip install pygame'),
      ]),
      guide(3, 'C++-Compiler einrichten', 'Visual Studio oder g++', [
        p('**Variante A, empfohlen für dich:** der Compiler aus **Visual Studio Community**. Den brauchst du später sowieso für Unreal. Laufzeit hat ihn auf deinem PC schon gefunden.'),
        p('Falls er fehlt: Starte den **Visual Studio Installer**, wähle **Ändern** und setze den Haken bei **"Desktopentwicklung mit C++"**. Für Unreal zusätzlich **"Spieleentwicklung mit C++"**.'),
        p('Um ihn außerhalb von Laufzeit zu nutzen, öffne über das Startmenü die **Developer PowerShell for VS**. Nur dort ist `cl` bekannt:'),
        cmd('cl /EHsc /std:c++20 /utf-8 hello.cpp'),
        cmd('.\\hello.exe'),
        p('**Variante B:** g++ über **MSYS2** (msys2.org). Nach der Installation im MSYS2-Fenster:'),
        cmd('pacman -S mingw-w64-ucrt-x86_64-gcc'),
        p('Danach `C:\\msys64\\ucrt64\\bin` zur Windows-Umgebungsvariable **Path** hinzufügen und VS Code neu starten. Test mit `g++ --version`.'),
        h('div', { class: 'note', html: inline('Laufzeit nimmt automatisch g++, wenn es im PATH ist, sonst den Visual-Studio-Compiler.') }),
      ]),
      guide(4, 'Erstes C++-Programm in VS Code', 'Schreiben, kompilieren, starten', [
        p('Leg im Ordner `Code` eine Datei `hello.cpp` an und füg das Grundgerüst aus Lektion 1.1 ein.'),
        p('Öffne die **Developer PowerShell for VS**, wechsle in deinen Ordner und kompiliere:'),
        cmd('cd $HOME\\Desktop\\Code'),
        cmd('cl /EHsc /std:c++20 /utf-8 hello.cpp'),
        p('Es entsteht `hello.exe`. Starte sie mit `.\\hello.exe`. Genau das macht Laufzeit bei jedem Klick auf **Ausführen** im Hintergrund.'),
        p('Tipp: Startest du VS Code aus der Developer PowerShell mit `code .`, kennt auch das Terminal in VS Code den Compiler.'),
      ]),
      guide(5, 'Raylib für eigene Spiele', 'Kommt mit dem Raylib-Abschnitt', [
        p('Raylib ist eine kleine Bibliothek für Fenster, Grafik, Tastatur und Sound. Ideal, um den Game-Loop selbst zu bauen, bevor eine große Engine dir alles abnimmt.'),
        p('Lade auf **raylib.com** den **Windows-Installer**. Er bringt einen fertigen Compiler (w64devkit) und Beispiele mit.'),
        p('Öffne nach der Installation `C:\\raylib\\raylib\\examples` und starte ein Beispiel mit **notepad++** aus dem Raylib-Ordner, dort mit `F6`.'),
        h('div', { class: 'note', html: inline('Den Raylib-Teil des Kurses gibt es ab Abschnitt 12. Bis dahin reicht reines C++.') }),
      ]),
      guide(6, 'Unreal Engine mit C++', 'UE 5 ist auf deinem PC schon da', [
        p('Unreal startest du über den **Epic Games Launcher**, Reiter **Unreal Engine, Bibliothek**.'),
        p('Für C++-Projekte braucht Unreal Visual Studio mit **"Spieleentwicklung mit C++"** (siehe Anleitung 03).'),
        p('Neues Projekt: **Games, Third Person**, rechts **C++** statt Blueprint wählen. Unreal erzeugt den Code und öffnet ihn in Visual Studio.'),
        p('Der erste eigene Actor: im Editor **Tools, Neue C++-Klasse, Actor**. Die Funktion `Tick` darin kennst du schon aus Lektion 4.3.'),
        h('div', { class: 'note', html: inline('Unreal-C++ ist der letzte Abschnitt des Kurses. Vorher brauchst du Klassen, Pointer und Vererbung, sonst wirkt der Code wie Zauberei.') }),
      ]),
      guide(7, 'Andere Engines', 'Godot und Unity im Vergleich', [
        p('**Godot:** kostenlos, leicht, sehr beliebt bei Indies. Die Skriptsprache **GDScript** sieht fast aus wie Python, dein Schulwissen zahlt sich hier direkt aus. Für Performance gibt es auch C++ (GDExtension).'),
        p('**Unity:** nutzt **C#**. Die Syntax ähnelt C++ stark: Klammern, Semikolons, Typen, Klassen. Wer C++ kann, liest C# nach wenigen Tagen.'),
        p('**Unreal:** C++ und Blueprints. Branchenstandard für große 3D-Spiele. Studios wie Rockstar nutzen eigene Engines (bei Rockstar heißt sie RAGE), die ebenfalls in C++ geschrieben sind.'),
      ])));

  check(false);
}
