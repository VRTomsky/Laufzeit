// Einstieg: Router und Start

import { t, locale } from './i18n.js';
import { store } from './store.js';
import { applyTheme } from './theme.js';
import { renderShell, refreshStats, setLangHandler } from './views/shell.js';
import { renderPath } from './views/path.js';
import { startLesson, startTraining, startUnitTest } from './views/lesson.js';
import { renderTraining } from './views/training.js';
import { renderLab } from './views/lab.js';
import { renderSetup } from './views/setup.js';
import { renderProfile } from './views/profile.js';
import { getStatus } from './runner.js';
import { renderOnboarding } from './views/onboarding.js';
import { startAutoBackup } from './backup.js';
import { renderProjects, startProject, startChallenge } from './views/projects.js';
import { renderFriends, renderUser, renderChat } from './views/friends.js';
import { renderGroup } from './views/groups.js';
import { renderAccount } from './views/account.js';
import { initCloud } from './cloud.js';
import { allowNavigation } from './guard.js';
import { applyUiLang } from './i18n.js';

const VIEWS = {
  pfad: renderPath,
  training: renderTraining,
  projekte: renderProjects,
  labor: renderLab,
  werkstatt: renderSetup,
  profil: renderProfile,
  freunde: renderFriends,
};

const TITLES = { pfad: t('Lernpfad', 'Learning path'), training: 'Training', projekte: t('Projekte', 'Projects'), labor: t('Labor', 'Lab'), werkstatt: t('Werkstatt', 'Workshop'), profil: t('Profil', 'Profile'), freunde: t('Freunde', 'Friends') };

function route() {
  const [name = 'pfad', arg, arg2] = location.hash.replace(/^#\/?/, '').split('/');
  document.body.dataset.lang = store.state.activeLang;

  if (name === 'konto') {
    document.title = t('Konto · Bitweg', 'Account · Bitweg');
    renderAccount(arg);
    return;
  }
  if (name === 'start') {
    if (store.state.onboarded && (arg !== 'kurs' || store.state.courses.includes(arg2))) {
      location.replace('#/pfad');
      return;
    }
    document.title = t('Willkommen · Bitweg', 'Welcome · Bitweg');
    renderOnboarding(arg === 'kurs' ? arg2 : null);
    return;
  }
  if (!store.state.onboarded) {
    location.replace('#/start');
    return;
  }

  if (name === 'lektion' && arg) {
    document.title = t('Lektion · Bitweg', 'Lesson · Bitweg');
    startLesson(arg, arg2 === 'gold' ? 'gold' : 'auto');
    return;
  }
  if (name === 'projekt' && arg) {
    document.title = t('Projekt · Bitweg', 'Project · Bitweg');
    startProject(arg);
    return;
  }
  if (name === 'aufgabe' && arg) {
    document.title = t('Aufgabe · Bitweg', 'Task · Bitweg');
    startChallenge(arg);
    return;
  }
  if (name === 'test' && arg) {
    document.title = t('Abschnittstest · Bitweg', 'Unit test · Bitweg');
    startUnitTest(arg, arg2 === 'gold' ? 'gold' : 'normal');
    return;
  }
  if (name === 'training' && arg === 'los') {
    document.title = 'Training · Bitweg';
    startTraining();
    return;
  }
  if (name === 'gruppe' && arg) {
    document.title = t('Gruppe · Bitweg', 'Group · Bitweg');
    renderGroup(renderShell('freunde'), decodeURIComponent(arg));
    window.scrollTo({ top: 0 });
    return;
  }
  if ((name === 'nutzer' || name === 'chat') && arg) {
    document.title = t(`${name === 'chat' ? 'Nachrichten' : 'Profil'} · Bitweg`, `${name === 'chat' ? 'Messages' : 'Profile'} · Bitweg`);
    const main = renderShell('freunde');
    (name === 'chat' ? renderChat : renderUser)(main, decodeURIComponent(arg));
    window.scrollTo({ top: 0 });
    return;
  }
  const view = VIEWS[name] ? name : 'pfad';
  document.title = `${TITLES[view]} · Bitweg`;
  const main = renderShell(view);
  VIEWS[view](main);
  if (view !== 'pfad') window.scrollTo({ top: 0 });
}

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
setLangHandler(route);
store.subscribe(() => refreshStats());
window.addEventListener('hashchange', () => { if (allowNavigation()) route(); });

applyTheme();
applyUiLang();
route();
startAutoBackup();
getStatus();
initCloud();

// Installierbar machen (Handy: "Zum Startbildschirm hinzufuegen")
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === '127.0.0.1' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
