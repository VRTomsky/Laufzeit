// Sprache der Oberflaeche: Deutsch oder Englisch.
// Texte stehen direkt im Code als Paar: t('Deutsch', 'English').

import { store } from './store.js';

export const UI_LANGS = { de: 'Deutsch', en: 'English' };

export function uiLang() {
  const set = store.state.settings.uiLang;
  if (set === 'de' || set === 'en') return set;
  return /^de\b/i.test(navigator.language || '') ? 'de' : 'en';
}

export const isEn = () => uiLang() === 'en';

/** Text in der aktuellen Sprache. Fehlt die englische Fassung, bleibt es Deutsch. */
export function t(de, en) {
  return isEn() && en != null ? en : de;
}

/** Fuer Inhalte: { de, en } oder einfacher Text */
export function pick(value) {
  if (value && typeof value === 'object' && !Array.isArray(value) && ('de' in value || 'en' in value)) {
    return isEn() ? (value.en ?? value.de) : (value.de ?? value.en);
  }
  return value;
}

export function setUiLang(lang) {
  store.update(s => { s.settings.uiLang = lang; });
  document.documentElement.lang = lang;
}

export const locale = () => (isEn() ? 'en-GB' : 'de-DE');

export function applyUiLang() {
  document.documentElement.lang = uiLang();
}
