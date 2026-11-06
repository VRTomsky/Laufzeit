// Kleine Helfer, die ueberall gebraucht werden

/** Erzeugt ein DOM-Element. h('button', { class: 'btn', onclick }, 'Text') */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value == null || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key === 'html') el.innerHTML = value;
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'style' && typeof value === 'object') Object.assign(el.style, value);
    else if (value === true) el.setAttribute(key, '');
    else el.setAttribute(key, value);
  }
  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Inline-Markdown: `code` und **fett** */
export function inline(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

/** Mini-Markdown fuer Lektionstexte: Absaetze, Listen mit "- " oder "1. " */
export function md(src = '') {
  return src.trim().split(/\n{2,}/).map(block => {
    const lines = block.split('\n');
    if (lines.every(l => /^- /.test(l))) {
      return `<ul>${lines.map(l => `<li>${inline(l.slice(2))}</li>`).join('')}</ul>`;
    }
    if (lines.every(l => /^\d+\. /.test(l))) {
      return `<ol>${lines.map(l => `<li>${inline(l.replace(/^\d+\. /, ''))}</li>`).join('')}</ol>`;
    }
    return `<p>${lines.map(inline).join('<br>')}</p>`;
  }).join('');
}

export function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Datum als 'YYYY-MM-DD' in lokaler Zeit */
export function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

export function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function pad2(n) {
  return String(n).padStart(2, '0');
}

/** Gleiche Ausgaben trotz Windows-Zeilenenden und Leerzeichen am Zeilenende */
export function normalizeOutput(text) {
  return String(text ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(line => line.replace(/\s+$/, ''))
    .join('\n')
    .replace(/^\n+|\n+$/g, '');
}

export function toast(title, text = '', glyph = null) {
  const host = document.getElementById('toasts');
  if (!host) return;
  const el = h('div', { class: 'toast', role: 'status' },
    glyph ? h('span', { class: 'seal', 'aria-hidden': 'true' }, glyph) : h('span'),
    h('div', {}, h('strong', {}, title), text ? h('p', {}, text) : null));
  host.append(el);
  setTimeout(() => {
    el.classList.add('is-out');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, 4200);
}

/** Oeffnet einen <dialog> und sperrt solange das Scrollen im Hintergrund. Liefert eine Funktion zum Freigeben. */
let modalLocks = 0;
export function showModal(dlg) {
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    modalLocks = Math.max(0, modalLocks - 1);
    if (!modalLocks) document.documentElement.classList.remove('no-scroll');
  };
  modalLocks += 1;
  document.documentElement.classList.add('no-scroll');
  dlg.addEventListener('close', release, { once: true });
  document.body.append(dlg);
  dlg.showModal();
  return release;
}

/** Eigener Bestaetigungs-Dialog statt window.confirm */
export function confirmDialog({ title, text, ok = 'OK', cancel = 'Abbrechen', danger = false }) {
  return new Promise(resolve => {
    const dlg = h('dialog', { class: 'confirm' },
      h('h2', {}, title),
      h('p', { class: 'muted' }, text),
      h('div', { class: 'row-actions' },
        h('button', { class: 'btn', onclick: () => close(false) }, cancel),
        h('button', { class: `btn ${danger ? 'btn-bad' : 'btn-sky'}`, onclick: () => close(true) }, ok)));
    let release = () => {};
    function close(result) {
      dlg.close();
      release();
      dlg.remove();
      resolve(result);
    }
    dlg.addEventListener('cancel', e => { e.preventDefault(); close(false); });
    release = showModal(dlg);
  });
}

/** Liest ein Bild, schneidet es mittig auf w x h zu und liefert ein kleines JPEG als data-URL */
export function readImage(file, w, h, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) { reject(new Error('Das ist kein Bild.')); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.max(w / img.width, h / img.height);
      const sw = w / scale;
      const sh = h / scale;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Das Bild ließ sich nicht öffnen.')); };
    img.src = url;
  });
}
