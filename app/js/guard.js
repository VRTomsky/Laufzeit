// Schutz fuer laufende Lektionen: Zurueck-Knopf, Rechtsklick > Zurueck, Maus-Zurueck-Taste
// oder ein Link sollen die Runde nicht einfach wegwerfen. Erst nachfragen.

import { confirmDialog } from './util.js';
import { t } from './i18n.js';

let guard = null;        // { hash }
let ignoreNext = false;  // eigene Wiederherstellung der Adresse

function onBeforeUnload(e) {
  e.preventDefault();
  e.returnValue = '';
}

export function setGuard() {
  guard = { hash: location.hash };
  window.addEventListener('beforeunload', onBeforeUnload);
}

export function clearGuard() {
  guard = null;
  window.removeEventListener('beforeunload', onBeforeUnload);
}

/** Vom Router bei jedem hashchange aufgerufen. true = normal weiter, false = nichts tun */
export function allowNavigation() {
  if (ignoreNext) { ignoreNext = false; return false; }
  if (!guard || location.hash === guard.hash) return true;
  const target = location.hash;
  const keep = guard.hash;
  // sofort zurueck zur Lektion, damit sie sichtbar bleibt, dann fragen
  ignoreNext = true;
  location.replace(`${location.href.split('#')[0]}${keep}`);
  confirmDialog({
    title: t('Lektion verlassen?', 'Leave the lesson?'),
    text: t('Dein Fortschritt in dieser Runde geht verloren. XP gibt es erst am Ende.', 'Your progress in this round will be lost. XP is only awarded at the end.'),
    ok: t('Verlassen', 'Leave'),
    cancel: t('Weiterlernen', 'Keep learning'),
    danger: true,
  }).then(leave => {
    if (!leave) return;
    clearGuard();
    location.hash = target;
  });
  return false;
}
