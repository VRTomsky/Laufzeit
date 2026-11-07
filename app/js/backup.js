// Automatische Sicherung auf den Desktop (ueber server.py, Ordner "Laufzeit-Sicherungen")

import { t, locale } from './i18n.js';
import { store } from './store.js';
import { IS_WEB } from './env.js';

const META_KEY = 'laufzeit.backup';      // wann zuletzt gesichert, getrennt vom Lernstand
const MIN_GAP = 5 * 60 * 1000;           // hoechstens alle 5 Minuten
const QUIET = 20 * 1000;                 // 20 Sekunden nach der letzten Aenderung

let timer = null;
let lastSent = 0;
let dirty = false;
let busy = false;
const listeners = new Set();

const headers = { 'Content-Type': 'application/json', 'X-Laufzeit': '1' };

export function backupInfo() {
  try {
    return JSON.parse(localStorage.getItem(META_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveInfo(info) {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(info));
  } catch {
    // ohne Speicher eben ohne Anzeige
  }
  listeners.forEach(l => l(info));
}

export function onBackupChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Sichert sofort. Liefert { ok, dir, name } oder { ok: false, error } */
export async function backupNow() {
  if (busy) return { ok: false, error: t('Sicherung läuft schon.', 'Backup already running.') };
  busy = true;
  let res;
  try {
    const r = await fetch('/api/backup', { method: 'POST', headers, body: JSON.stringify({ data: store.state }) });
    res = r.ok ? await r.json() : { ok: false, error: r.status === 404 ? t('Der Server kennt die Sicherung noch nicht. Schließ das schwarze Fenster und starte start.bat neu.', 'The server doesn\'t know backups yet. Close the black window and restart start.bat.') : t(`Server-Fehler ${r.status}`, `Server error ${r.status}`) };
  } catch {
    res = { ok: false, error: t('Der lokale Server antwortet nicht. Läuft start.bat?', 'The local server isn\'t responding. Is start.bat running?') };
  }
  busy = false;
  lastSent = Date.now();
  const info = { ...backupInfo(), lastTry: Date.now() };
  if (res.ok) {
    dirty = false;
    Object.assign(info, { last: Date.now(), dir: res.dir, name: res.name, error: null });
  } else {
    info.error = res.error;
  }
  saveInfo(info);
  return res;
}

export async function listBackups() {
  if (IS_WEB) return { ok: false, files: [], error: t('Online gibt es keine Desktop-Sicherung.', 'There is no desktop backup online.') };
  try {
    const r = await fetch('/api/backup', { headers, cache: 'no-store' });
    if (!r.ok) return { ok: false, files: [], error: r.status === 404 ? t('Server neu starten, dann geht es.', 'Restart the server, then it works.') : t(`Server-Fehler ${r.status}`, `Server error ${r.status}`) };
    return await r.json();
  } catch {
    return { ok: false, files: [], error: t('Server nicht erreichbar.', 'Server not reachable.') };
  }
}

export async function loadBackup(name) {
  const r = await fetch(`/api/backup?name=${encodeURIComponent(name)}`, { headers, cache: 'no-store' });
  if (!r.ok) throw new Error(t('Sicherung nicht gefunden.', 'Backup not found.'));
  const res = await r.json();
  return res.data;
}

function schedule() {
  clearTimeout(timer);
  const wait = Math.max(QUIET, lastSent + MIN_GAP - Date.now());
  timer = setTimeout(() => { if (dirty) backupNow(); }, wait);
}

const enabled = () => !IS_WEB && store.state.settings.autoBackup !== false && store.state.onboarded;

/** Einmal beim Start aufrufen */
export function startAutoBackup() {
  store.subscribe(() => {
    if (!enabled()) return;
    dirty = true;
    schedule();
  });
  // Beim Verlassen oder Minimieren schnell noch sichern
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && dirty && enabled()) backupNow();
  });
  // Einmal am Tag beim Start
  const info = backupInfo();
  const today = new Date().toDateString();
  if (enabled() && (!info.last || new Date(info.last).toDateString() !== today)) {
    setTimeout(() => backupNow(), 3000);
  }
}
