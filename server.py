"""
Laufzeit: lokaler Server

Aufgaben:
  1. liefert die Web-App aus dem Ordner app/ aus
  2. fuehrt Python- und C++-Code mit den Werkzeugen aus, die auf diesem PC installiert sind
     (Python: dieser Interpreter, C++: g++ / clang++ oder der Visual-Studio-Compiler cl.exe)

Nur ueber 127.0.0.1 erreichbar. Start: Doppelklick auf start.bat oder `python server.py`.
"""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import threading
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HOST = "127.0.0.1"
def _arg(name: str, default: str | None = None) -> str | None:
    """Liest --name WERT aus der Kommandozeile (fuer Tests: anderer Port, anderer Sicherungsordner)."""
    if name in sys.argv:
        i = sys.argv.index(name)
        if i + 1 < len(sys.argv):
            return sys.argv[i + 1]
    return default


PORT = int(_arg("--port", "5741"))
URL = f"http://{HOST}:{PORT}/"
ROOT = Path(__file__).resolve().parent
APP_DIR = ROOT / "app"

RUN_TIMEOUT = 5          # Sekunden, die ein Programm laufen darf
COMPILE_TIMEOUT = 60     # Sekunden fuer den C++-Compiler
MAX_CODE_BYTES = 64_000
MAX_OUTPUT_CHARS = 20_000

ALLOWED_HOSTS = {f"{HOST}:{PORT}", f"localhost:{PORT}"}
ALLOWED_ORIGINS = {f"http://{h}" for h in ALLOWED_HOSTS}
NO_WINDOW = getattr(subprocess, "CREATE_NO_WINDOW", 0)

# Ersetzt input() beim automatischen Pruefen, damit Eingabe-Texte wie
# input("Alter: ") die erwartete Ausgabe nicht verfaelschen. Steht in Zeile 1,
# deshalb werden Zeilennummern in Fehlermeldungen danach um 1 korrigiert.
QUIET_INPUT_PRELUDE = "import builtins as _lz_b; input = lambda prompt='', _f=_lz_b.input: _f()\n"

# Labor im Terminal-Stil: Eingaben werden mit ausgegeben (wie in einem echten Terminal),
# Zufall ist pro Sitzung fest, damit ein erneuter Lauf mit mehr Eingaben gleich ablaeuft.
def interactive_prelude(seed: int) -> str:
    return ("import builtins as _lz_b, random as _lz_r; _lz_r.seed(%d); "
            "input = lambda prompt='', _f=_lz_b.input: (lambda _v: (print(_v), _v)[1])(_f(prompt))\n" % seed)


toolchain = {"python": None, "cpp": None}
toolchain_ready = threading.Event()


# ---------------------------------------------------------------- Hilfen

def decode(data: bytes | None) -> str:
    if not data:
        return ""
    for enc in ("utf-8", "cp850", "cp1252"):
        try:
            return data.decode(enc)
        except UnicodeDecodeError:
            continue
    return data.decode("utf-8", errors="replace")


def clip(text: str) -> str:
    if len(text) <= MAX_OUTPUT_CHARS:
        return text
    return text[:MAX_OUTPUT_CHARS] + "\n... (Ausgabe gekuerzt)"


def first_line(text: str) -> str:
    for line in text.splitlines():
        if line.strip():
            return line.strip()
    return ""


def execute(cmd: list[str], cwd: str, stdin: str, timeout: int, env: dict | None = None) -> dict:
    try:
        proc = subprocess.run(
            cmd,
            cwd=cwd,
            input=(stdin or "").encode("utf-8"),
            capture_output=True,
            timeout=timeout,
            env=env,
            creationflags=NO_WINDOW,
        )
        return {
            "stdout": clip(decode(proc.stdout)),
            "stderr": clip(decode(proc.stderr)),
            "exitCode": proc.returncode,
            "timedOut": False,
        }
    except subprocess.TimeoutExpired as exc:
        return {"stdout": clip(decode(exc.stdout)), "stderr": "", "exitCode": None, "timedOut": True}
    except OSError as exc:
        return {"stdout": "", "stderr": str(exc), "exitCode": None, "timedOut": False}


def clean_paths(text: str, tmp: str) -> str:
    """Entfernt den temporaeren Ordner aus Meldungen, damit nur main.py / main.cpp stehen bleibt."""
    for variant in {tmp, tmp.replace("\\", "/"), os.path.realpath(tmp)}:
        text = text.replace(variant + os.sep, "").replace(variant + "/", "").replace(variant, "")
    return text


# ---------------------------------------------------------------- Werkzeuge finden

def load_vcvars(vcvars: Path) -> dict | None:
    """Fuehrt vcvars64.bat einmal aus und merkt sich die Umgebungsvariablen."""
    try:
        out = subprocess.run(
            f'cmd /d /s /c ""{vcvars}" >nul 2>&1 && set"',
            capture_output=True,
            timeout=60,
            creationflags=NO_WINDOW,
        )
    except (OSError, subprocess.TimeoutExpired):
        return None
    env = {}
    for line in decode(out.stdout).splitlines():
        if "=" in line and not line.startswith("="):
            key, value = line.split("=", 1)
            env[key] = value
    if not env:
        return None
    env["VSLANG"] = "1033"  # Compiler-Meldungen auf Englisch, dann greifen die Hinweise der App
    return env


def find_msvc() -> dict | None:
    program_files = os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)")
    vswhere = Path(program_files) / "Microsoft Visual Studio" / "Installer" / "vswhere.exe"
    if not vswhere.exists():
        return None
    try:
        out = subprocess.run(
            [str(vswhere), "-latest", "-products", "*",
             "-requires", "Microsoft.VisualStudio.Component.VC.Tools.x86.x64",
             "-property", "installationPath"],
            capture_output=True, timeout=30, creationflags=NO_WINDOW,
        )
    except (OSError, subprocess.TimeoutExpired):
        return None
    lines = decode(out.stdout).strip().splitlines()
    if not lines:
        return None
    vcvars = Path(lines[0].strip()) / "VC" / "Auxiliary" / "Build" / "vcvars64.bat"
    if not vcvars.exists():
        return None
    env = load_vcvars(vcvars)
    if not env:
        return None
    path_value = env.get("Path") or env.get("PATH") or ""
    cl = shutil.which("cl", path=path_value)
    if not cl:
        return None
    banner = execute([cl], str(ROOT), "", 20, env)
    version = first_line(banner["stderr"]) or "Microsoft C/C++ Compiler"
    return {"kind": "msvc", "cmd": cl, "env": env, "version": version}


def find_cpp() -> dict | None:
    for name, kind in (("g++", "gcc"), ("clang++", "clang")):
        path = shutil.which(name)
        if path:
            info = execute([path, "--version"], str(ROOT), "", 20)
            return {"kind": kind, "cmd": path, "env": None, "version": first_line(info["stdout"]) or name}
    return find_msvc()


def detect_toolchains() -> None:
    toolchain["python"] = {"cmd": sys.executable, "version": "Python " + sys.version.split()[0]}
    toolchain["cpp"] = find_cpp()
    toolchain_ready.set()
    cpp = toolchain["cpp"]
    print(f"  Python : {toolchain['python']['version']}")
    print(f"  C++    : {cpp['version'] if cpp else 'kein Compiler gefunden (siehe Werkstatt in der App)'}")


def status() -> dict:
    ready = toolchain_ready.is_set()
    cpp = toolchain["cpp"]
    return {
        "ready": ready,
        "python": {"version": toolchain["python"]["version"]} if toolchain["python"] else None,
        "cpp": {"version": cpp["version"], "kind": cpp["kind"]} if cpp else None,
    }


# ---------------------------------------------------------------- Ausfuehren

def run_python(code: str, stdin: str, quiet_input: bool, seed: int | None = None) -> dict:
    with tempfile.TemporaryDirectory(prefix="laufzeit-", ignore_cleanup_errors=True) as tmp:
        prelude = interactive_prelude(seed) if seed is not None else QUIET_INPUT_PRELUDE if quiet_input else ""
        source = prelude + code
        Path(tmp, "main.py").write_text(source, encoding="utf-8")
        env = {k: v for k, v in os.environ.items() if k not in ("FORCE_COLOR", "PY_COLORS")}
        env.update(PYTHON_COLORS="0", NO_COLOR="1")   # keine Farbcodes in Fehlermeldungen
        res = execute([sys.executable, "-I", "-X", "utf8", "main.py"], tmp, stdin, RUN_TIMEOUT, env)
        res["stderr"] = clean_paths(res["stderr"], tmp)
        if prelude:
            res["stderr"] = re.sub(
                r'(File "main\.py", line )(\d+)',
                lambda m: m.group(1) + str(max(1, int(m.group(2)) - 1)),
                res["stderr"],
            )
    res.update(stage="run", ok=res["exitCode"] == 0 and not res["timedOut"],
               tool=toolchain["python"]["version"])
    return res


def run_cpp(code: str, stdin: str) -> dict:
    cpp = toolchain["cpp"]
    with tempfile.TemporaryDirectory(prefix="laufzeit-", ignore_cleanup_errors=True) as tmp:
        Path(tmp, "main.cpp").write_text(code, encoding="utf-8")
        if cpp["kind"] == "msvc":
            cmd = [cpp["cmd"], "/nologo", "/EHsc", "/std:c++20", "/utf-8", "/W3", "main.cpp", "/Fe:main.exe"]
        else:
            cmd = [cpp["cmd"], "-std=c++20", "-Wall", "-fdiagnostics-color=never", "main.cpp", "-o", "main.exe"]
        comp = execute(cmd, tmp, "", COMPILE_TIMEOUT, cpp["env"])
        log = clean_paths((comp["stdout"] + "\n" + comp["stderr"]).strip(), tmp)
        log = "\n".join(l for l in log.splitlines() if l.strip() not in ("main.cpp",)).strip()
        exe = Path(tmp, "main.exe")
        if comp["timedOut"] or comp["exitCode"] != 0 or not exe.exists():
            return {
                "stage": "compile", "ok": False, "stdout": "", "stderr": "",
                "compileLog": log or "Der Compiler hat abgebrochen.", "exitCode": comp["exitCode"],
                "timedOut": comp["timedOut"], "tool": cpp["version"],
            }
        res = execute([str(exe)], tmp, stdin, RUN_TIMEOUT)
        res["stderr"] = clean_paths(res["stderr"], tmp)
    res.update(stage="run", ok=res["exitCode"] == 0 and not res["timedOut"],
               compileLog=log, tool=cpp["version"])
    return res


def handle_run(payload: dict) -> dict:
    lang = payload.get("lang")
    code = payload.get("code") or ""
    stdin = payload.get("stdin") or ""
    if not isinstance(code, str) or not isinstance(stdin, str):
        return {"available": True, "ok": False, "stage": "run", "stderr": "Ungueltige Anfrage."}
    if len(code.encode("utf-8")) > MAX_CODE_BYTES:
        return {"available": True, "ok": False, "stage": "run", "stderr": "Der Code ist zu lang."}
    toolchain_ready.wait(timeout=90)
    if lang == "python":
        seed = payload.get("interactive")
        seed = int(seed) if isinstance(seed, int) and not isinstance(seed, bool) else None
        result = run_python(code, stdin, bool(payload.get("quietInput")), seed)
    elif lang == "cpp":
        if not toolchain["cpp"]:
            return {"available": False, "reason": "Auf diesem PC wurde kein C++-Compiler gefunden."}
        result = run_cpp(code, stdin)
    else:
        return {"available": False, "reason": "Unbekannte Sprache."}
    result["available"] = True
    return result


# ---------------------------------------------------------------- Sicherungen auf dem Desktop

MAX_BACKUP_BYTES = 8_000_000
KEEP_BACKUPS = 14
BACKUP_NAME = re.compile(r"^laufzeit-sicherung-\d{4}-\d{2}-\d{2}(-vorher-\d{6})?\.json$")


def desktop_dir() -> Path:
    """Echter Desktop-Ordner. Bei OneDrive liegt er nicht unter USERPROFILE/Desktop."""
    try:
        import winreg
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders")
        value, _ = winreg.QueryValueEx(key, "Desktop")
        path = Path(os.path.expandvars(value))
        if path.is_dir():
            return path
    except OSError:
        pass
    return Path.home() / "Desktop"


BACKUP_DIR = Path(_arg("--backup-dir")) if _arg("--backup-dir") else desktop_dir() / "Laufzeit-Sicherungen"


def list_backups() -> list[dict]:
    if not BACKUP_DIR.is_dir():
        return []
    files = [f for f in BACKUP_DIR.iterdir() if f.is_file() and BACKUP_NAME.match(f.name)]
    files.sort(key=lambda f: f.name, reverse=True)
    return [{"name": f.name, "size": f.stat().st_size, "modified": f.stat().st_mtime} for f in files]


def write_backup(data: dict) -> dict:
    from datetime import date, datetime
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    name = f"laufzeit-sicherung-{date.today().isoformat()}.json"
    target = BACKUP_DIR / name
    # Hat die heutige Datei mehr Fortschritt (z. B. nach "Alles zuruecksetzen"), bleibt sie unter eigenem Namen erhalten
    old = read_backup(name)
    if old and (old.get("xp") or 0) > (data.get("xp") or 0):
        keep = f"laufzeit-sicherung-{date.today().isoformat()}-vorher-{datetime.now():%H%M%S}.json"
        os.replace(target, BACKUP_DIR / keep)
    tmp = BACKUP_DIR / (name + ".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    os.replace(tmp, target)  # erst komplett schreiben, dann tauschen: nie eine halbe Datei
    for old in list_backups()[KEEP_BACKUPS:]:
        try:
            (BACKUP_DIR / old["name"]).unlink()
        except OSError:
            pass
    return {"ok": True, "dir": str(BACKUP_DIR), "name": name}


def read_backup(name: str) -> dict | None:
    if not BACKUP_NAME.match(name or ""):
        return None
    path = BACKUP_DIR / name
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


# ---------------------------------------------------------------- HTTP

class Handler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".css": "text/css",
        ".svg": "image/svg+xml",
        ".json": "application/json",
        ".html": "text/html",
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(APP_DIR), **kwargs)

    def log_message(self, fmt, *args):  # Konsole ruhig halten
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def host_ok(self) -> bool:
        # Schutz gegen DNS-Rebinding: nur Anfragen an 127.0.0.1 / localhost
        return self.headers.get("Host", "") in ALLOWED_HOSTS

    def send_json(self, data: dict, code: int = 200) -> None:
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if not self.host_ok():
            self.send_error(403)
            return
        if self.path.startswith("/api/status"):
            self.send_json(status())
            return
        if self.path.startswith("/api/backup"):
            # Sicherungen enthalten persoenliche Daten: nur mit eigenem Header (blockt fremde Seiten)
            if self.headers.get("X-Laufzeit") != "1":
                self.send_error(403)
                return
            from urllib.parse import urlparse, parse_qs
            name = (parse_qs(urlparse(self.path).query).get("name") or [""])[0]
            if name:
                data = read_backup(name)
                if data is None:
                    self.send_error(404)
                    return
                self.send_json({"ok": True, "name": name, "data": data})
                return
            self.send_json({"ok": True, "dir": str(BACKUP_DIR), "files": list_backups()})
            return
        super().do_GET()

    def do_POST(self):
        # Fremde Webseiten duerfen keinen Code ausfuehren lassen: eigener Header
        # (erzwingt einen CORS-Preflight, den dieser Server nie erlaubt) plus Origin-Pruefung.
        origin = self.headers.get("Origin")
        if not self.host_ok() or self.headers.get("X-Laufzeit") != "1" or (origin and origin not in ALLOWED_ORIGINS):
            self.send_error(403)
            return
        if self.path not in ("/api/run", "/api/backup"):
            self.send_error(404)
            return
        try:
            length = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            length = 0
        limit = MAX_BACKUP_BYTES if self.path == "/api/backup" else MAX_CODE_BYTES * 2
        if length <= 0 or length > limit:
            self.send_error(413)
            return
        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            self.send_error(400)
            return
        if self.path == "/api/backup":
            data = payload.get("data") if isinstance(payload, dict) else None
            if not isinstance(data, dict) or data.get("version") != 1:
                self.send_error(400)
                return
            try:
                self.send_json(write_backup(data))
            except OSError as exc:
                self.send_json({"ok": False, "error": str(exc)})
            return
        self.send_json(handle_run(payload))


def _headless_logging() -> None:
    """Unter pythonw.exe (Autostart ohne Fenster) gibt es kein stdout/stderr.
    Der HTTP-Server schreibt aber jede Anfrage nach stderr. Deshalb in eine
    Logdatei umleiten, die bei jedem Start neu beginnt."""
    if sys.stdout is not None and sys.stderr is not None:
        return
    try:
        log = open(ROOT / "server.log", "w", encoding="utf-8", buffering=1)
    except OSError:
        log = open(os.devnull, "w", encoding="utf-8")
    sys.stdout = log
    sys.stderr = log


def main() -> None:
    _headless_logging()
    if not APP_DIR.is_dir():
        print("Der Ordner 'app' fehlt neben server.py.")
        sys.exit(1)
    open_browser = "--no-browser" not in sys.argv
    try:
        server = ThreadingHTTPServer((HOST, PORT), Handler)
    except OSError:
        print(f"Port {PORT} ist belegt. Vermutlich laeuft Laufzeit schon. Oeffne {URL}")
        if open_browser:
            webbrowser.open(URL)
        return
    print("")
    print("  LAUFZEIT")
    print(f"  laeuft auf {URL}")
    print("  Fenster offen lassen. Beenden mit Strg+C oder Fenster schliessen.")
    print("")
    print("  Suche Werkzeuge ...")
    threading.Thread(target=detect_toolchains, daemon=True).start()
    if open_browser:
        threading.Timer(0.8, lambda: webbrowser.open(URL)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
