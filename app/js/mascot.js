// "Bit": die Figur von Laufzeit. Ein kleiner Computer mit Bildschirm-Gesicht.
// Stimmungen: happy, cheer (Arme hoch), think, sad, wave

import { t, locale } from './i18n.js';

export function bit({ size = 120, mood = 'happy', body = 'var(--accent)', edge = 'var(--accent-edge)', label = t('Bit, die Laufzeit-Figur', 'Bit, the Laufzeit mascot') } = {}) {
  const eyes = {
    happy: '<path d="M44 52q5-6 10 0M66 52q5-6 10 0" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>',
    cheer: '<path d="M44 53q5-7 10 0M66 53q5-7 10 0" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>',
    wave: '<path d="M44 52q5-6 10 0" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="71" cy="50" r="4.5" fill="#fff"/>',
    think: '<circle cx="50" cy="48" r="4.5" fill="#fff"/><circle cx="71" cy="48" r="4.5" fill="#fff"/>',
    sad: '<circle cx="50" cy="51" r="4.5" fill="#fff"/><circle cx="71" cy="51" r="4.5" fill="#fff"/><path d="M43 43l9 3M78 43l-9 3" stroke="#fff" stroke-width="3" stroke-linecap="round"/>',
  }[mood] || '';
  const mouth = mood === 'cheer'
    ? '<path d="M53 61h14q0 9-7 9t-7-9z" fill="#FFD866"/>'
    : mood === 'sad'
      ? '<rect x="54" y="64" width="12" height="3.5" rx="1.75" fill="#FFD866"/>'
      : '<rect x="56" y="60" width="9" height="9" rx="2" fill="#FFD866" class="bit-cursor"/>';
  const arms = mood === 'cheer'
    ? `<rect x="6" y="18" width="13" height="30" rx="6.5" fill="${body}" transform="rotate(-24 12 40)"/><rect x="101" y="18" width="13" height="30" rx="6.5" fill="${body}" transform="rotate(24 108 40)"/>`
    : mood === 'wave'
      ? `<rect x="9" y="56" width="13" height="26" rx="6.5" fill="${body}"/><rect x="100" y="20" width="13" height="30" rx="6.5" fill="${body}" transform="rotate(28 106 42)" class="bit-wave"/>`
      : `<rect x="9" y="56" width="13" height="26" rx="6.5" fill="${body}"/><rect x="98" y="56" width="13" height="26" rx="6.5" fill="${body}"/>`;
  return `<svg class="bit bit-${mood}" viewBox="0 0 120 124" width="${size}" height="${Math.round(size * 1.03)}" role="img" aria-label="${label}">
    <line x1="60" y1="6" x2="60" y2="22" stroke="${edge}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="60" cy="7" r="6" fill="#FFD866" stroke="${edge}" stroke-width="3"/>
    ${arms}
    <rect x="38" y="98" width="16" height="16" rx="6" fill="${edge}"/>
    <rect x="66" y="98" width="16" height="16" rx="6" fill="${edge}"/>
    <rect x="20" y="28" width="80" height="76" rx="24" fill="${edge}"/>
    <rect x="20" y="22" width="80" height="76" rx="24" fill="${body}"/>
    <rect x="32" y="34" width="56" height="44" rx="14" fill="#1E252B"/>
    ${eyes}
    ${mouth}
    <circle cx="34" cy="88" r="3" fill="#fff" opacity=".55"/>
  </svg>`;
}
