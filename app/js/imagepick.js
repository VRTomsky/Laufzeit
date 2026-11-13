// Bild-Waehler fuer Profil- und Gruppenbilder:
// Datei waehlen, aus der Zwischenablage einfuegen (Knopf oder Strg+V), entfernen.
// Danach kommt immer das Zuschneide-Fenster (cropper.js).

import { t } from './i18n.js';
import { h, toast } from './util.js';
import { cropImage } from './cropper.js';

/** Bild aus der Zwischenablage per Clipboard-API. undefined = geht in diesem Browser nicht, null = kein Bild drin */
async function clipboardImage() {
  if (!navigator.clipboard?.read) return undefined;
  const items = await navigator.clipboard.read();
  for (const item of items) {
    const type = item.types.find(x => x.startsWith('image/'));
    if (type) {
      const blob = await item.getType(type);
      return new File([blob], `zwischenablage.${type.split('/')[1] || 'png'}`, { type });
    }
  }
  return null;
}

/** Bild aus einem paste-Ereignis (Strg+V) */
function imageFromPaste(e) {
  for (const it of e.clipboardData?.items || []) {
    if (it.kind === 'file' && it.type.startsWith('image/')) return it.getAsFile();
  }
  return null;
}

/**
 * opts: { label, w, h, round, title, onPick(dataUrl), onRemove() }
 * Liefert { el, use(file) }.
 */
export function imagePicker(opts) {
  async function use(file) {
    try {
      const result = await cropImage(file, opts.w, opts.h, { round: opts.round, title: opts.title });
      if (result) opts.onPick(result);
    } catch (err) {
      toast(t('Bild nicht übernommen', 'Image not used'), err.message);
    }
  }
  const input = h('input', {
    type: 'file', accept: 'image/*', class: 'sr-only',
    onchange: async e => { const f = e.target.files[0]; e.target.value = ''; if (f) await use(f); },
  });
  const paste = h('button', {
    type: 'button', class: 'btn btn-small',
    title: t('Bild aus der Zwischenablage einfügen (am PC auch mit Strg+V)', 'Paste an image from the clipboard (on a PC also Ctrl+V)'),
    onclick: async () => {
      let file;
      try { file = await clipboardImage(); } catch { file = undefined; }
      if (file) { await use(file); return; }
      if (file === null) toast(t('Kein Bild in der Zwischenablage', 'No image in the clipboard'), t('Kopier zuerst ein Bild, z. B. per Rechtsklick „Bild kopieren“.', 'Copy an image first, e.g. right-click “Copy image”.'));
      else toast(t('Einfügen per Knopf geht hier nicht', 'Paste button doesn\'t work here'), t('Kopier ein Bild und drück dann im Fenster Strg+V.', 'Copy an image, then press Ctrl+V in this window.'));
    },
  }, t('Einfügen', 'Paste'));
  const el = h('div', { class: 'row-actions img-pick' },
    h('label', { class: 'btn btn-small' }, opts.label, input),
    paste,
    h('button', { type: 'button', class: 'btn btn-small btn-ghost', onclick: () => opts.onRemove() }, t('Entfernen', 'Remove')));
  return { el, use };
}

/**
 * Strg+V im Dialog: das Bild geht an den Waehler, den man zuletzt angetippt oder ueberfahren hat,
 * sonst an `fallback`. Text-Einfuegen in Felder bleibt normal.
 */
export function pasteImagesInto(dlg, pickers, fallback = 0) {
  let target = pickers[fallback];
  pickers.forEach(p => {
    ['pointerenter', 'pointerdown', 'focusin'].forEach(ev => p.zone.addEventListener(ev, () => { target = p; }));
  });
  dlg.addEventListener('paste', e => {
    const file = imageFromPaste(e);
    if (!file) return;
    e.preventDefault();
    target.picker.use(file);
  });
}
