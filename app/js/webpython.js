// Steuert den Python-Worker der Online-Version: laden, ausfuehren, nach 5 Sekunden abbrechen

const RUN_TIMEOUT = 5000;
let worker = null;
let readyPromise = null;
let version = null;
let seq = 0;
const pending = new Map();

function spawn() {
  worker = new Worker(new URL('./pyworker.js', import.meta.url));
  readyPromise = new Promise((resolve, reject) => {
    worker.onmessage = ({ data }) => {
      if (data.type === 'ready') { version = data.version; resolve(version); return; }
      if (data.type === 'failed') { reject(new Error(data.error)); return; }
      if (data.type === 'result') {
        const job = pending.get(data.id);
        if (!job) return;
        pending.delete(data.id);
        clearTimeout(job.timer);
        job.resolve(data);
      }
    };
    worker.onerror = e => reject(new Error(e.message || 'Python konnte nicht geladen werden.'));
  });
  readyPromise.catch(() => {});
}

/** Laedt Python im Hintergrund vor (etwa 10 MB beim ersten Mal, danach aus dem Browser-Cache) */
export function warmUp() {
  if (!worker) spawn();
  return readyPromise;
}

export const webPythonVersion = () => version;

export async function runWebPython(code, stdin, quietInput, seed = null) {
  if (!worker) spawn();
  try {
    await readyPromise;
  } catch (err) {
    worker?.terminate();
    worker = null;
    return { available: false, reason: `Python konnte im Browser nicht geladen werden (${err.message}). Prüfe die Internetverbindung und lade die Seite neu.` };
  }
  const id = ++seq;
  return new Promise(resolve => {
    const timer = setTimeout(() => {
      // Endlosschleife: Worker hart beenden und neu starten
      pending.delete(id);
      worker.terminate();
      worker = null;
      spawn();
      resolve({ available: true, stage: 'run', ok: false, stdout: '', stderr: '', exitCode: null, timedOut: true, tool: version });
    }, RUN_TIMEOUT);
    pending.set(id, {
      timer,
      resolve: data => resolve({
        available: true,
        stage: 'run',
        ok: data.exitCode === 0,
        stdout: data.stdout,
        stderr: data.stderr,
        exitCode: data.exitCode,
        timedOut: false,
        tool: version,
      }),
    });
    worker.postMessage({ id, code, stdin, quietInput, seed });
  });
}
