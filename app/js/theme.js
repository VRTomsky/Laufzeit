import { store } from './store.js';

const media = matchMedia('(prefers-color-scheme: dark)');

export function applyTheme() {
  const choice = store.state.settings.theme;
  const resolved = choice === 'auto' ? (media.matches ? 'dark' : 'light') : choice;
  document.documentElement.dataset.theme = resolved;
}

media.addEventListener('change', () => {
  if (store.state.settings.theme === 'auto') applyTheme();
});
