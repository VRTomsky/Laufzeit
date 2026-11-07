// Icons: Linien-Icons fuer Knoepfe, farbige Flaechen-Icons fuer Navigation und Pfad. Keine Emojis.

const svg = (body, size = 20) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const icons = {
  check: svg('<path d="M4.5 12.5l4.8 4.8L19.5 7"/>'),
  lock: svg('<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  arrow: svg('<path d="M5 12h13M13 6l6 6-6 6"/>'),
  chevron: svg('<path d="M9 5l7 7-7 7"/>'),
  copy: svg('<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>'),
  reset: svg('<path d="M4 4v5h5"/><path d="M4.6 9A8 8 0 1 1 4 13"/>'),
  run: svg('<path d="M7 4.5l12 7.5-12 7.5z" fill="currentColor"/>'),
  cross: svg('<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>'),
  book: svg('<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z"/>'),
  skip: svg('<path d="M5 5l8 7-8 7z"/><path d="M17 5v14"/>'),
  chat: svg('<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 3.5V17A2.5 2.5 0 0 1 4 14.5z"/>'),
  globe: svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 4 5.8 4 9s-1.4 6.4-4 9M12 3c-2.6 2.6-4 5.8-4 9s1.4 6.4 4 9"/>'),
  clip: svg('<path d="M20 11.5l-8 8a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7L9.7 17.2a1.7 1.7 0 0 1-2.4-2.4L15 7"/>'),
  file: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>'),
  back: svg('<path d="M19 12H6M11 6l-6 6 6 6"/>'),
  logout: svg('<path d="M10 4H6.5A2.5 2.5 0 0 0 4 6.5v11A2.5 2.5 0 0 0 6.5 20H10"/><path d="M15 8l4 4-4 4M19 12H9"/>'),
};

export function icon(name, size) {
  const s = icons[name] || '';
  return size ? s.replace(/width="20" height="20"/, `width="${size}" height="${size}"`) : s;
}

/* ---------- farbige Flaechen-Icons */

const solid = (body, size) => `<svg viewBox="0 0 32 32" width="${size}" height="${size}" aria-hidden="true">${body}</svg>`;

const SOLID = {
  path: '<path d="M6 14.5L16 6l10 8.5V26a2 2 0 0 1-2 2h-5v-7h-6v7H8a2 2 0 0 1-2-2z" fill="#F2A31B"/><path d="M4 15.5L16 5.5l12 10" fill="none" stroke="#C43C3A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><rect x="13" y="21" width="6" height="7" rx="1" fill="#C78211"/>',
  training: '<rect x="3" y="11" width="5" height="10" rx="2" fill="#1D8FD4"/><rect x="24" y="11" width="5" height="10" rx="2" fill="#1D8FD4"/><rect x="7" y="8" width="5" height="16" rx="2" fill="#2A9FE5"/><rect x="20" y="8" width="5" height="16" rx="2" fill="#2A9FE5"/><rect x="12" y="14.5" width="8" height="3" rx="1.5" fill="#8C9AA5"/>',
  lab: '<path d="M12 4h8M13 4v8L6.5 24.5A2.5 2.5 0 0 0 8.7 28h14.6a2.5 2.5 0 0 0 2.2-3.5L19 12V4" fill="#ECE4FD" stroke="#7149C7" stroke-width="2.5" stroke-linejoin="round"/><path d="M9.5 19h13l3 5.5a2 2 0 0 1-1.8 2.5H8.3a2 2 0 0 1-1.8-2.5z" fill="#9166EC"/><circle cx="14" cy="22.5" r="1.6" fill="#fff"/><circle cx="18.5" cy="21" r="1.1" fill="#fff"/>',
  setup: '<rect x="3" y="5" width="26" height="22" rx="4" fill="#1E252B"/><rect x="3" y="5" width="26" height="5" rx="2" fill="#33404A"/><path d="M8 15l4 3-4 3" fill="none" stroke="#3A9E33" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><rect x="14" y="20" width="8" height="2.6" rx="1.3" fill="#FFD866"/>',
  profile: '<circle cx="16" cy="16" r="13" fill="#E5579D"/><circle cx="16" cy="13" r="5" fill="#fff"/><path d="M7.5 25a9.5 9.5 0 0 1 17 0" fill="#fff"/>',
  flame: '<path d="M16 2.5c1.2 4.6 8 7.6 8 15a8 8 0 0 1-16 0c0-3.3 1.6-5.6 3.3-7.2 0 3.2 1.4 4.8 3.2 5 .5-4.8-1.1-8.1 1.5-12.8z" fill="#F27C1B"/><path d="M16 15c.6 2.3 4 3.8 4 7.4a4 4 0 0 1-8 0c0-1.7.8-2.8 1.7-3.6 0 1.6.7 2.4 1.6 2.5.2-2.4-.6-4 .7-6.3z" fill="#FFD866"/>',
  flameCold: '<path d="M16 2.5c1.2 4.6 8 7.6 8 15a8 8 0 0 1-16 0c0-3.3 1.6-5.6 3.3-7.2 0 3.2 1.4 4.8 3.2 5 .5-4.8-1.1-8.1 1.5-12.8z" fill="#C4CBD0"/><path d="M16 15c.6 2.3 4 3.8 4 7.4a4 4 0 0 1-8 0c0-1.7.8-2.8 1.7-3.6 0 1.6.7 2.4 1.6 2.5.2-2.4-.6-4 .7-6.3z" fill="#E6EAED"/>',
  bolt: '<path d="M18.5 2L6 18h9l-2 12 13-17h-9z" fill="#F2A31B" stroke="#C78211" stroke-width="1.6" stroke-linejoin="round"/>',
  target: '<circle cx="16" cy="16" r="13" fill="#EF5350"/><circle cx="16" cy="16" r="9" fill="#fff"/><circle cx="16" cy="16" r="5" fill="#EF5350"/>',
  star: '<path d="M16 3.5l3.8 7.8 8.5 1.2-6.2 6 1.5 8.5L16 23l-7.6 4 1.5-8.5-6.2-6 8.5-1.2z" fill="currentColor"/>',
  trophy: '<path d="M9 4h14v7a7 7 0 0 1-14 0z" fill="currentColor"/><path d="M9 7H5a4 4 0 0 0 4 5M23 7h4a4 4 0 0 1-4 5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><rect x="14" y="17" width="4" height="6" fill="currentColor"/><rect x="9.5" y="23" width="13" height="5" rx="2" fill="currentColor"/>',
  code: '<path d="M11 9l-6 7 6 7M21 9l6 7-6 7" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>',
  checkBig: '<path d="M7 16.5l6 6L25.5 10" fill="none" stroke="currentColor" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>',
  lockBig: '<rect x="8" y="14" width="16" height="13" rx="3.5" fill="currentColor"/><path d="M11.5 14v-3.5a4.5 4.5 0 0 1 9 0V14" fill="none" stroke="currentColor" stroke-width="3"/>',
  crown: '<path d="M4 11l5 4 7-9 7 9 5-4-2.5 14h-19z" fill="currentColor"/><rect x="6.5" y="26" width="19" height="3" rx="1.5" fill="currentColor"/>',
  quest: '<rect x="5" y="4" width="22" height="25" rx="4" fill="#F2A31B"/><rect x="10" y="2" width="12" height="6" rx="2" fill="#C78211"/><path d="M10 15l3 3 6-6" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><rect x="10" y="22" width="12" height="2.6" rx="1.3" fill="#fff"/>',
};

Object.assign(SOLID, {
  school: '<path d="M3 11l13-6 13 6-13 6z" fill="#1D8FD4"/><path d="M8 14v6c0 2 3.6 4 8 4s8-2 8-4v-6l-8 3.7z" fill="#166FA6"/><path d="M27 12v8" stroke="#F2A31B" stroke-width="2.5" stroke-linecap="round"/><circle cx="27" cy="21.5" r="2" fill="#F2A31B"/>',
  game: '<path d="M9 9h14a6 6 0 0 1 6 6v3a5 5 0 0 1-9 3l-1-1.5h-6L12 21a5 5 0 0 1-9-3v-3a6 6 0 0 1 6-6z" fill="#9166EC"/><rect x="8" y="13" width="2.6" height="8" rx="1.3" fill="#fff"/><rect x="5.3" y="15.7" width="8" height="2.6" rx="1.3" fill="#fff"/><circle cx="21" cy="14.5" r="1.7" fill="#FFD866"/><circle cx="24.5" cy="18" r="1.7" fill="#FFD866"/>',
  work: '<rect x="4" y="10" width="24" height="17" rx="3.5" fill="#C78211"/><path d="M12 10V7.5A2.5 2.5 0 0 1 14.5 5h3A2.5 2.5 0 0 1 20 7.5V10" fill="none" stroke="#9A6206" stroke-width="2.6"/><rect x="4" y="15" width="24" height="3" fill="#9A6206"/><rect x="14" y="14" width="4" height="5" rx="1" fill="#FFD866"/>',
  tool: '<path d="M20.5 4.5a6.5 6.5 0 0 0-6.2 8.4L5 22.2a2.8 2.8 0 1 0 4 4l9.3-9.3a6.5 6.5 0 0 0 8.4-6.2l-3.6 3.6-3.7-.7-.7-3.7z" fill="#17AE9F"/><circle cx="7" cy="24.3" r="1.5" fill="#fff"/>',
  friends: '<circle cx="11" cy="11" r="5" fill="#1D8FD4"/><path d="M2.5 26a8.5 8.5 0 0 1 17 0z" fill="#1D8FD4"/><circle cx="22" cy="12" r="4.2" fill="#17AE9F"/><path d="M17.5 26a7 7 0 0 1 12 0z" fill="#17AE9F"/>',
  heart: '<path d="M16 27S4 19.6 4 11.5A6.5 6.5 0 0 1 16 8a6.5 6.5 0 0 1 12 3.5C28 19.6 16 27 16 27z" fill="#EF5350"/><path d="M9 11a3 3 0 0 1 3-3" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".7"/>',
  restart: '<circle cx="16" cy="16" r="13" fill="#3A9E33"/><path d="M12 10.5l10 5.5-10 5.5z" fill="#fff"/>',
  compass: '<circle cx="16" cy="16" r="13" fill="#1D8FD4"/><path d="M20.5 11.5l-2.8 6.2-6.2 2.8 2.8-6.2z" fill="#fff"/><circle cx="16" cy="16" r="1.6" fill="#1D8FD4"/>',
  none: '<circle cx="16" cy="16" r="12" fill="none" stroke="#C4CBD0" stroke-width="3"/><path d="M10 22l12-12" stroke="#C4CBD0" stroke-width="3" stroke-linecap="round"/>',
  blocks: '<rect x="4" y="15" width="11" height="11" rx="2.5" fill="#F2A31B"/><rect x="17" y="15" width="11" height="11" rx="2.5" fill="#1D8FD4"/><rect x="10.5" y="4" width="11" height="11" rx="2.5" fill="#3A9E33"/>',
});

/** Signal-Balken fuer Wissensstand 1 bis 5 */
export function levelBars(n, size = 30) {
  let body = '';
  for (let i = 0; i < 5; i++) {
    const hgt = 6 + i * 5;
    body += `<rect x="${3 + i * 5.6}" y="${29 - hgt}" width="4.2" height="${hgt}" rx="1.6" fill="${i < n ? '#1D8FD4' : '#D2D2D2'}"/>`;
  }
  return solid(body, size);
}

export function solidIcon(name, size = 28) {
  return SOLID[name] ? solid(SOLID[name], size) : '';
}

/** Offizielles Python- bzw. C++-Logo (img/python.svg, img/cpp.svg) */
export function langLogo(lang, size = 30) {
  const name = lang === 'cpp' ? 'C++' : 'Python';
  return `<img class="lang-logo" src="img/${lang === 'cpp' ? 'cpp' : 'python'}.svg" width="${size}" height="${size}" alt="${name}-Logo">`;
}
