// Web Worker: echtes Python (Pyodide, CPython als WebAssembly) direkt im Browser.
// Wird nur in der Online-Version benutzt, wenn kein lokaler server.py da ist.
// Endlosschleifen beendet die Hauptseite, indem sie diesen Worker abschiesst.

/* global importScripts, loadPyodide */
const PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';
importScripts(PYODIDE + 'pyodide.js');

const RUNNER = `
import sys, io, traceback, builtins

class _LzOut(io.StringIO):
    LIMIT = 20000
    def write(self, s):
        if self.tell() < self.LIMIT:
            return super().write(s)
        return len(s)

def _lz_run(src, stdin, quiet):
    out, err = _LzOut(), _LzOut()
    old = (sys.stdin, sys.stdout, sys.stderr)
    sys.stdin, sys.stdout, sys.stderr = io.StringIO(stdin), out, err
    g = {"__name__": "__main__", "__builtins__": builtins}
    if quiet:
        _orig = builtins.input
        g["input"] = lambda prompt="": _orig()
    exit_code = 0
    try:
        exec(compile(src, "main.py", "exec"), g)
    except SystemExit as e:
        exit_code = e.code if isinstance(e.code, int) else (0 if e.code is None else 1)
    except BaseException as e:
        tb = e.__traceback__
        while tb is not None and tb.tb_frame.f_code.co_filename != "main.py":
            tb = tb.tb_next
        traceback.print_exception(type(e), e, tb, file=err)
        exit_code = 1
    finally:
        sys.stdin, sys.stdout, sys.stderr = old
    text = out.getvalue()
    if out.tell() >= _LzOut.LIMIT:
        text += "\\n... (Ausgabe gekuerzt)"
    return [text, err.getvalue(), exit_code]
`;

const ready = (async () => {
  const py = await loadPyodide({ indexURL: PYODIDE });
  py.runPython(RUNNER);
  const version = py.runPython('import sys; sys.version.split()[0]');
  postMessage({ type: 'ready', version: `Python ${version}` });
  return py;
})().catch(err => {
  postMessage({ type: 'failed', error: String(err && err.message || err) });
  throw err;
});

onmessage = async ({ data }) => {
  const py = await ready;
  const fn = py.globals.get('_lz_run');
  try {
    const result = fn(data.code, data.stdin || '', !!data.quietInput);
    const [stdout, stderr, exitCode] = result.toJs();
    result.destroy();
    postMessage({ type: 'result', id: data.id, stdout, stderr, exitCode });
  } catch (err) {
    postMessage({ type: 'result', id: data.id, stdout: '', stderr: String(err && err.message || err), exitCode: 1 });
  } finally {
    fn.destroy();
  }
};
