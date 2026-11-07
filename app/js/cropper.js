// Zuschneide-Fenster: Bild verschieben und zoomen, der Rahmen zeigt den fertigen Ausschnitt.
// cropImage(file, breite, hoehe, { round, title }) liefert ein JPEG als data-URL oder null (abgebrochen).

import { t, locale } from './i18n.js';
import { h, showModal } from './util.js';

const MAX_ZOOM = 4;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) { reject(new Error(t('Das ist kein Bild.', 'That\'s not an image.'))); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(t('Das Bild ließ sich nicht öffnen.', 'The image couldn\'t be opened.'))); };
    img.src = url;
  });
}

export async function cropImage(file, outW, outH, { round = false, title = t('Ausschnitt wählen', 'Choose the crop') } = {}) {
  const { img, url } = await loadImage(file);

  return new Promise(resolve => {
    // Rahmengroesse passend zum Bildschirm, Seitenverhaeltnis wie das Ergebnis
    const frameW = Math.min(round ? 320 : 560, window.innerWidth - 72);
    const frameH = Math.round(frameW * outH / outW);
    const base = Math.max(frameW / img.naturalWidth, frameH / img.naturalHeight);
    let zoom = 1;
    let scale = base;
    let x = (frameW - img.naturalWidth * scale) / 2;
    let y = (frameH - img.naturalHeight * scale) / 2;

    const pic = h('img', { src: url, alt: '', draggable: 'false', class: 'crop-img' });
    const frame = h('div', {
      class: `crop-frame${round ? ' is-round' : ''}`,
      style: { width: `${frameW}px`, height: `${frameH}px` },
      tabindex: '0',
      role: 'application',
      'aria-label': t('Bildausschnitt. Ziehen oder Pfeiltasten zum Verschieben, Plus und Minus zum Zoomen.', 'Image crop. Drag or use arrow keys to move, plus and minus to zoom.'),
    }, pic, h('span', { class: 'crop-grid', 'aria-hidden': 'true' }));
    const slider = h('input', { type: 'range', min: '1', max: String(MAX_ZOOM), step: '0.01', value: '1', class: 'crop-zoom', 'aria-label': 'Zoom' });

    /** Bild darf den Rahmen nie freilegen */
    function clamp() {
      const w = img.naturalWidth * scale;
      const hgt = img.naturalHeight * scale;
      x = Math.min(0, Math.max(frameW - w, x));
      y = Math.min(0, Math.max(frameH - hgt, y));
    }
    function paint() {
      clamp();
      pic.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    }
    /** Zoomen um einen Punkt im Rahmen (cx, cy), damit dieser Punkt stehen bleibt */
    function setZoom(next, cx = frameW / 2, cy = frameH / 2) {
      next = Math.min(MAX_ZOOM, Math.max(1, next));
      const ix = (cx - x) / scale;
      const iy = (cy - y) / scale;
      zoom = next;
      scale = base * zoom;
      x = cx - ix * scale;
      y = cy - iy * scale;
      slider.value = String(zoom);
      paint();
    }

    // Ziehen mit Maus, Stift oder Finger
    let drag = null;
    frame.addEventListener('pointerdown', e => {
      drag = { px: e.clientX, py: e.clientY, x, y };
      frame.setPointerCapture(e.pointerId);
      frame.classList.add('is-dragging');
    });
    frame.addEventListener('pointermove', e => {
      if (!drag) return;
      x = drag.x + (e.clientX - drag.px);
      y = drag.y + (e.clientY - drag.py);
      paint();
    });
    const stop = () => { drag = null; frame.classList.remove('is-dragging'); };
    frame.addEventListener('pointerup', stop);
    frame.addEventListener('pointercancel', stop);
    frame.addEventListener('wheel', e => {
      e.preventDefault();
      const r = frame.getBoundingClientRect();
      setZoom(zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08), e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });
    frame.addEventListener('keydown', e => {
      const step = e.shiftKey ? 40 : 10;
      if (e.key === 'ArrowLeft') x += step;
      else if (e.key === 'ArrowRight') x -= step;
      else if (e.key === 'ArrowUp') y += step;
      else if (e.key === 'ArrowDown') y -= step;
      else if (e.key === '+' || e.key === '=') { setZoom(zoom * 1.1); e.preventDefault(); return; }
      else if (e.key === '-') { setZoom(zoom / 1.1); e.preventDefault(); return; }
      else return;
      e.preventDefault();
      paint();
    });
    slider.addEventListener('input', () => setZoom(Number(slider.value)));

    let release = () => {};
    function finish(result) {
      dlg.close();
      release();
      dlg.remove();
      URL.revokeObjectURL(url);
      resolve(result);
    }
    function apply() {
      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, -x / scale, -y / scale, frameW / scale, frameH / scale, 0, 0, outW, outH);
      finish(canvas.toDataURL('image/jpeg', 0.88));
    }

    const dlg = h('dialog', { class: 'confirm crop-dialog' },
      h('h2', {}, title),
      h('p', { class: 'muted' }, t('Zieh das Bild in die richtige Position. Mit dem Regler oder dem Mausrad zoomst du.', 'Drag the image into the right position. Zoom with the slider or the mouse wheel.')),
      h('div', { class: 'crop-stage' }, frame),
      h('label', { class: 'crop-zoom-row' }, h('span', { 'aria-hidden': 'true' }, '−'), slider, h('span', { 'aria-hidden': 'true' }, '+')),
      h('div', { class: 'row-actions' },
        h('button', { type: 'button', class: 'btn', onclick: () => finish(null) }, t('Abbrechen', 'Cancel')),
        h('button', { type: 'button', class: 'btn btn-go', onclick: apply }, t('Übernehmen', 'Apply'))));
    dlg.addEventListener('cancel', e => { e.preventDefault(); finish(null); });

    paint();
    release = showModal(dlg);
    frame.focus();
  });
}
