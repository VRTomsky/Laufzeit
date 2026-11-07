// Sprach-Icon (Weltkugel) mit kleinem Menue: DE / EN. Sitzt oben rechts.

import { h } from '../util.js';
import { icon } from '../icons.js';
import { uiLang, setUiLang, t } from '../i18n.js';

let menu = null;
function close() {
  menu?.remove();
  menu = null;
  document.querySelectorAll('.uilang-btn').forEach(b => b.setAttribute('aria-expanded', 'false'));
}
document.addEventListener('click', e => { if (menu && !e.target.closest('.uilang-menu, .uilang-btn')) close(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
window.addEventListener('hashchange', close);

function open(btn) {
  if (menu) { close(); return; }
  const r = btn.getBoundingClientRect();
  const current = uiLang();
  menu = h('div', {
    class: 'uilang-menu',
    role: 'menu',
    style: { top: `${r.bottom + 8}px`, left: `${Math.max(8, Math.min(window.innerWidth - 168, r.right - 160))}px` },
  }, [['de', 'DE', 'Deutsch'], ['en', 'EN', 'English']].map(([id, short, name]) => h('button', {
    type: 'button',
    role: 'menuitemradio',
    'aria-checked': String(id === current),
    class: 'uilang-item',
    onclick: () => {
      close();
      if (id === uiLang()) return;
      setUiLang(id);
      location.reload();
    },
  }, h('b', {}, short), h('span', {}, name))));
  document.body.append(menu);
  btn.setAttribute('aria-expanded', 'true');
  menu.querySelector('[aria-checked="true"]')?.focus();
}

/** Knopf mit Weltkugel und aktuellem Kuerzel */
export function uiLangButton(extraClass = '') {
  return h('button', {
    type: 'button',
    class: `uilang-btn ${extraClass}`.trim(),
    'aria-haspopup': 'menu',
    'aria-expanded': 'false',
    'aria-label': t('Sprache: Deutsch. Ändern', 'Language: English. Change'),
    title: t('Sprache', 'Language'),
    onclick: e => { e.stopPropagation(); open(e.currentTarget); },
  }, h('span', { html: icon('globe', 20) }), h('b', {}, uiLang().toUpperCase()));
}
