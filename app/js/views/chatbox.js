// Gemeinsamer Chat-Baustein fuer Einzel- und Gruppenchats:
// Nachrichtenliste mit sauberem Scrollen, Eingabe, Anhaenge, Bildvorschau mit Zoom.

import { t, locale } from '../i18n.js';
import { h, toast, showModal } from '../util.js';
import { icon } from '../icons.js';
import { germanError, attachmentUrl, attachmentsAvailable, ATTACH_TYPES, ATTACH_MAX } from '../cloud.js';

export function timeText(iso) {
  const d = new Date(iso);
  const today = d.toDateString() === new Date().toDateString();
  return today ? d.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }) : d.toLocaleString(locale(), { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

const sizeText = bytes => {
  const kb = Math.max(1, Math.round((bytes || 0) / 1024));
  return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
};

/* ---------------------------------------------------------------- Bildvorschau mit Zoom */

/** Vollbild-Vorschau: Mausrad zoomt zum Mauszeiger, Ziehen verschiebt, Doppelklick zoomt,
 *  am Handy mit zwei Fingern zoomen. Schliessen mit X, Esc oder Klick daneben. */
export function openLightbox(url, a) {
  let release = () => {};
  const MIN = 1;
  const MAX = 8;
  let scale = 1;
  let tx = 0;
  let ty = 0;
  const img = h('img', { class: 'lightbox-img', src: url, alt: a.name || t('Bild', 'Image'), draggable: 'false' });
  const canvas = h('div', { class: 'lightbox-canvas' }, img);
  const stage = h('div', { class: 'lightbox-stage' }, canvas);
  const zoomLabel = h('span', { class: 'lightbox-zoom' }, '100 %');

  function apply(animate = false) {
    img.style.transition = animate ? 'transform .18s cubic-bezier(.16, 1, .3, 1)' : 'none';
    img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    zoomLabel.textContent = `${Math.round(scale * 100)} %`;
    stage.classList.toggle('is-zoomed', scale > 1.001);
  }

  /** Bild nicht komplett aus dem Bild schieben lassen */
  function clamp() {
    const w = canvas.clientWidth;
    const hgt = canvas.clientHeight;
    const minX = Math.min(0, w - w * scale);
    const minY = Math.min(0, hgt - hgt * scale);
    tx = Math.min(0, Math.max(minX, tx));
    ty = Math.min(0, Math.max(minY, ty));
    if (scale <= 1) { tx = 0; ty = 0; }
  }

  /** Zoom um einen Punkt (Bildschirmkoordinaten), der Punkt bleibt unter dem Zeiger */
  function zoomAt(next, clientX, clientY, animate = false) {
    const s2 = Math.min(MAX, Math.max(MIN, next));
    const r = canvas.getBoundingClientRect();
    const px = clientX - r.left;
    const py = clientY - r.top;
    tx = px - (px - tx) * (s2 / scale);
    ty = py - (py - ty) * (s2 / scale);
    scale = s2;
    clamp();
    apply(animate);
  }
  const center = () => {
    const r = canvas.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  };
  const reset = () => { scale = 1; tx = 0; ty = 0; apply(true); };

  stage.addEventListener('wheel', e => {
    e.preventDefault();
    zoomAt(scale * Math.exp(-e.deltaY * 0.0018), e.clientX, e.clientY);
  }, { passive: false });

  // Ziehen (Maus) und Zwei-Finger-Zoom (Touch)
  const pointers = new Map();
  let moved = false;
  let last = null;
  let pinch = null;
  stage.addEventListener('pointerdown', e => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    stage.setPointerCapture(e.pointerId);
    moved = false;
    last = { x: e.clientX, y: e.clientY };
    if (pointers.size === 2) {
      const [p1, p2] = [...pointers.values()];
      pinch = { dist: Math.hypot(p1.x - p2.x, p1.y - p2.y), scale };
    }
  });
  stage.addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2 && pinch) {
      const [p1, p2] = [...pointers.values()];
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      zoomAt(pinch.scale * (dist / pinch.dist), (p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
      moved = true;
      return;
    }
    if (scale <= 1 || !last) return;
    const dx = e.clientX - last.x;
    const dy = e.clientY - last.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
    tx += dx;
    ty += dy;
    last = { x: e.clientX, y: e.clientY };
    clamp();
    apply();
  });
  const up = e => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    last = pointers.size ? { ...[...pointers.values()][0] } : null;
  };
  stage.addEventListener('pointerup', up);
  stage.addEventListener('pointercancel', up);
  stage.addEventListener('dblclick', e => {
    if (scale > 1.001) reset();
    else zoomAt(2.5, e.clientX, e.clientY, true);
  });

  const close = () => { dlg.close(); release(); dlg.remove(); };
  const download = async () => {
    try {
      const href = await attachmentUrl(a.path, a.name || true);
      const link = h('a', { href, download: a.name || 'bild', rel: 'noopener' });
      document.body.append(link);
      link.click();
      link.remove();
    } catch (err) {
      toast(t('Download nicht möglich', 'Download not possible'), germanError(err));
    }
  };
  const btn = (label, ic, fn, cls = '') => h('button', { type: 'button', class: `lightbox-btn ${cls}`, onclick: fn, title: label, 'aria-label': label }, typeof ic === 'string' ? h('span', { html: icon(ic, 20) }) : ic);

  const dlg = h('dialog', { class: 'lightbox', 'aria-label': t('Bildvorschau', 'Image preview') },
    h('div', { class: 'lightbox-bar' },
      h('span', { class: 'lightbox-name' }, h('b', {}, a.name || t('Bild', 'Image')), h('small', {}, sizeText(a.size))),
      h('div', { class: 'lightbox-tools' },
        btn(t('Verkleinern', 'Zoom out'), h('b', { class: 'lb-sym' }, '−'), () => zoomAt(scale / 1.5, ...center(), true)),
        zoomLabel,
        btn(t('Vergrößern', 'Zoom in'), h('b', { class: 'lb-sym' }, '+'), () => zoomAt(scale * 1.5, ...center(), true)),
        btn(t('Zurücksetzen', 'Reset'), 'reset', reset)),
      h('button', { type: 'button', class: 'lightbox-btn is-text', onclick: download, title: t('Herunterladen', 'Download') }, h('span', { html: icon('file', 20) }), h('span', { class: 'lb-label' }, t('Herunterladen', 'Download'))),
      btn(t('Schließen', 'Close'), 'close', close, 'is-close')),
    stage,
    h('p', { class: 'lightbox-help' }, t('Mausrad oder zwei Finger: zoomen · Ziehen: verschieben · Doppelklick: rein und raus', 'Mouse wheel or two fingers: zoom · Drag: move · Double-click: in and out')));

  // Klick auf den dunklen Rand schliesst, aber nicht nach dem Verschieben oder im Zoom
  stage.addEventListener('click', e => {
    if (moved) { moved = false; return; }
    if (scale <= 1.001 && e.target === stage) close();
  });
  dlg.addEventListener('keydown', e => {
    if (e.key === '+' || e.key === '=') zoomAt(scale * 1.5, ...center(), true);
    else if (e.key === '-') zoomAt(scale / 1.5, ...center(), true);
    else if (e.key === '0') reset();
  });
  dlg.addEventListener('cancel', e => { e.preventDefault(); close(); });
  release = showModal(dlg);
  apply();
}

/* ---------------------------------------------------------------- Chat-Baustein */

/**
 * opts:
 *  meId, canWrite, placeholder, lockedText (wenn canWrite false), emptyText,
 *  send(body) -> Nachricht, sendFile(file, body) -> Nachricht,
 *  senderOf(m) -> { name, avatarEl } fuer Gruppen (sonst null), onReport(m) (optional)
 */
export function chatBox(opts) {
  const list = h('ol', { class: 'chat-list', 'aria-live': 'polite' });
  const seen = new Set();
  let pinned = true;          // klebt die Ansicht unten? Nur dann automatisch nach unten
  let lastSender = null;

  const nearBottom = () => list.scrollHeight - list.scrollTop - list.clientHeight < 80;
  list.addEventListener('scroll', () => { pinned = nearBottom(); }, { passive: true });
  const toBottom = () => { list.scrollTop = list.scrollHeight; pinned = true; };
  const keepBottom = () => { if (pinned) list.scrollTop = list.scrollHeight; };

  function attachmentView(a) {
    if (/^image\//.test(a.type || '')) {
      const img = h('img', { class: 'msg-img', alt: a.name || t('Bild', 'Image') });
      const link = h('button', { type: 'button', class: 'msg-img-link', title: t('Vorschau öffnen', 'Open preview'), 'aria-label': t(`Bild ${a.name || ''} ansehen`, `View image ${a.name || ''}`) }, img);
      attachmentUrl(a.path).then(url => {
        const before = list.scrollHeight;
        const above = link.offsetTop + link.offsetHeight <= list.scrollTop;
        img.addEventListener('load', () => {
          if (pinned) keepBottom();
          else if (above) list.scrollTop += list.scrollHeight - before;   // Bild oberhalb geladen: Ansicht nicht springen lassen
        }, { once: true });
        img.src = url;
        link.onclick = () => openLightbox(url, a);
      }).catch(() => { link.replaceWith(h('span', { class: 'msg-file is-missing' }, t('Bild nicht verfügbar', 'Image not available'))); });
      return link;
    }
    return h('button', {
      type: 'button', class: 'msg-file',
      onclick: async () => {
        try { window.open(await attachmentUrl(a.path, a.name || true), '_blank', 'noopener'); } catch (err) { toast(t('Datei nicht verfügbar', 'File not available'), germanError(err)); }
      },
    }, h('span', { html: icon('file', 22) }), h('span', {}, h('b', {}, a.name || t('Datei', 'File')), h('small', {}, `${sizeText(a.size)} · ${t('herunterladen', 'download')}`)));
  }

  function add(m, { live = false } = {}) {
    if (seen.has(m.id)) return;
    seen.add(m.id);
    list.querySelector('.chat-empty')?.remove();
    const mine = m.sender === opts.meId;
    const who = !mine && opts.senderOf ? opts.senderOf(m) : null;
    const first = who && lastSender !== m.sender;
    lastSender = m.sender;
    list.append(h('li', { class: `msg${mine ? ' is-mine' : ''}${m.attachment ? ' has-file' : ''}${who ? ' in-group' : ''}${first ? ' is-first' : ''}` },
      who && first ? h('span', { class: 'msg-who' }, who.avatarEl, h('b', {}, who.name)) : null,
      m.attachment ? attachmentView(m.attachment) : null,
      m.body ? h('p', {}, m.body) : null,
      h('small', {}, timeText(m.created_at),
        !mine && opts.onReport ? h('button', { type: 'button', class: 'msg-report', title: t('Nachricht melden', 'Report message'), onclick: () => opts.onReport(m) }, t('melden', 'report')) : null)));
    if (live) keepBottom(); else toBottom();
  }

  function empty(textValue) {
    if (!list.children.length) list.append(h('li', { class: 'chat-empty muted' }, textValue));
  }

  const text = h('textarea', {
    class: 'text-input chat-input', rows: '1', maxlength: '1000',
    placeholder: opts.canWrite ? opts.placeholder : opts.lockedText,
    disabled: !opts.canWrite, 'aria-label': t('Nachricht', 'Message'),
  });
  const sendBtn = h('button', { type: 'submit', class: 'btn btn-go', disabled: !opts.canWrite }, t('Senden', 'Send'));

  async function send(e) {
    e?.preventDefault();
    const body = text.value.trim();
    if (!body) return;
    sendBtn.disabled = true;
    try {
      const m = await opts.send(body);
      text.value = '';
      add(m);
    } catch (err) {
      toast(t('Nicht gesendet', 'Not sent'), germanError(err));
    }
    sendBtn.disabled = false;
    text.focus();
  }
  text.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) send(e); });

  const fileInput = h('input', { type: 'file', class: 'sr-only', accept: ATTACH_TYPES.join(','), tabindex: '-1' });
  const clipBtn = h('button', {
    type: 'button', class: 'icon-btn chat-clip', disabled: !opts.canWrite,
    title: t('Bild oder Datei anhängen (max. 5 MB)', 'Attach image or file (max. 5 MB)'),
    'aria-label': t('Bild oder Datei anhängen', 'Attach image or file'),
    html: icon('clip', 22),
    onclick: () => {
      if (!attachmentsAvailable()) { toast(t('Anhänge sind noch nicht eingerichtet', 'Attachments are not set up yet'), t('Der Betreiber muss dafür noch supabase/02-anhaenge.sql ausführen.', 'The operator still has to run supabase/02-anhaenge.sql.')); return; }
      fileInput.click();
    },
  });
  async function sendFile(file) {
    if (!file || !opts.canWrite) return;
    if (file.size > ATTACH_MAX * 3) { toast(t('Zu groß', 'Too large'), t('Höchstens 5 MB pro Datei.', 'At most 5 MB per file.')); return; }
    clipBtn.disabled = true;
    sendBtn.disabled = true;
    const busy = h('li', { class: 'msg is-mine is-busy' }, h('p', {}, t(`Lädt hoch: ${file.name}`, `Uploading: ${file.name}`)));
    list.append(busy);
    toBottom();
    try {
      const m = await opts.sendFile(file, text.value.trim());
      text.value = '';
      busy.remove();
      add(m);
    } catch (err) {
      busy.remove();
      toast(t('Nicht gesendet', 'Not sent'), germanError(err));
    }
    clipBtn.disabled = false;
    sendBtn.disabled = false;
  }
  fileInput.addEventListener('change', () => { const f = fileInput.files?.[0]; fileInput.value = ''; sendFile(f); });
  text.addEventListener('paste', e => {
    const f = [...(e.clipboardData?.files || [])][0];
    if (f) { e.preventDefault(); sendFile(f); }
  });

  const form = h('form', {
    class: 'chat-form',
    onsubmit: send,
    ondragover: e => { if (opts.canWrite) { e.preventDefault(); e.currentTarget.classList.add('is-drop'); } },
    ondragleave: e => e.currentTarget.classList.remove('is-drop'),
    ondrop: e => { e.preventDefault(); e.currentTarget.classList.remove('is-drop'); sendFile(e.dataTransfer?.files?.[0]); },
  }, clipBtn, fileInput, text, sendBtn);

  return { list, form, add, empty, toBottom, focus: () => text.focus(), error: msg => list.append(h('li', { class: 'muted' }, msg)) };
}
