// Code-Editor: Textfeld ueber eingefaerbtem Code, mit Zeilennummern und Auto-Einrueckung

import { t, locale } from './i18n.js';
import { h } from './util.js';
import { highlight } from './highlight.js';

const INDENT = '    ';

function insertText(ta, text) {
  // execCommand haelt Strg+Z intakt; Fallback fuer Browser ohne Unterstuetzung
  if (!document.execCommand || !document.execCommand('insertText', false, text)) {
    ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, 'end');
    ta.dispatchEvent(new Event('input'));
  }
}

export function createEditor({ value = '', lang = 'python', minLines = 6, onChange, onRun, label = t('Code-Editor', 'Code editor') }) {
  const gutter = h('div', { class: 'ed-gutter', 'aria-hidden': 'true' });
  const pre = h('pre', { class: 'ed-hl', 'aria-hidden': 'true' });
  const ta = h('textarea', {
    class: 'ed-input',
    spellcheck: 'false',
    autocapitalize: 'off',
    autocomplete: 'off',
    autocorrect: 'off',
    wrap: 'off',
    rows: '1',
    cols: '1',
    'aria-label': label,
  });
  ta.value = value;
  const el = h('div', { class: 'editor' }, gutter, h('div', { class: 'ed-scroll' }, h('div', { class: 'ed-stack' }, pre, ta)));

  let errorLine = null;

  function render() {
    const text = ta.value;
    pre.innerHTML = highlight(text, lang) + '\n';
    const count = Math.max(minLines, text.split('\n').length);
    let html = '';
    for (let n = 1; n <= count; n++) html += `<span${n === errorLine ? ' class="is-err"' : ''}>${n}</span>`;
    gutter.innerHTML = html;
    pre.style.minHeight = `calc(${count} * var(--ed-lh) + 32px)`;
  }

  ta.addEventListener('input', () => {
    errorLine = null;
    render();
    onChange?.(ta.value);
  });

  ta.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      onRun?.();
      return;
    }
    const { selectionStart: start, selectionEnd: end, value: text } = ta;
    const lineStart = text.lastIndexOf('\n', start - 1) + 1;

    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        const lead = text.slice(lineStart).match(/^ {1,4}/);
        if (lead) {
          ta.setSelectionRange(lineStart, lineStart + lead[0].length);
          insertText(ta, '');
          const pos = Math.max(lineStart, start - lead[0].length);
          ta.setSelectionRange(pos, pos);
        }
      } else {
        insertText(ta, INDENT);
      }
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const line = text.slice(lineStart, start);
      let indent = line.match(/^[ \t]*/)[0];
      const trimmed = line.trimEnd();
      if ((lang === 'python' && trimmed.endsWith(':')) || (lang === 'cpp' && trimmed.endsWith('{'))) indent += INDENT;
      insertText(ta, '\n' + indent);
      return;
    }

    if (e.key === '}' && lang === 'cpp' && start === end) {
      const before = text.slice(lineStart, start);
      if (/^ {4,}$/.test(before)) {
        e.preventDefault();
        ta.setSelectionRange(lineStart, start);
        insertText(ta, before.slice(4) + '}');
      }
      return;
    }

    if (e.key === 'Backspace' && start === end) {
      const before = text.slice(lineStart, start);
      if (before.length >= 4 && /^ +$/.test(before) && before.length % 4 === 0) {
        e.preventDefault();
        ta.setSelectionRange(start - 4, start);
        insertText(ta, '');
      }
    }
  });

  render();

  return {
    el,
    textarea: ta,
    get value() { return ta.value; },
    setValue(next) {
      ta.value = next;
      errorLine = null;
      render();
      onChange?.(next);
    },
    focus() {
      ta.focus();
    },
    markLine(n) {
      errorLine = n || null;
      render();
    },
  };
}
