// Konto: Registrieren, Einloggen, Passwort vergessen, neues Passwort
// Eigene Vollbild-Seite (wie die Einfuehrung), funktioniert auch vor der Einfuehrung.

import { t, locale } from '../i18n.js';
import { h, toast } from '../util.js';
import { bit } from '../mascot.js';
import { uiLangButton } from './uilang.js';
import { store } from '../store.js';
import { CLOUD_ENABLED, USERNAME_RE, register, login, sendReset, setNewPassword, germanError, currentUser, initCloud } from '../cloud.js';

function field(label, input, hint) {
  return h('label', { class: 'field' }, h('span', {}, label), input, hint || null);
}

function input(attrs) {
  return h('input', { class: 'text-input', autocomplete: 'off', spellcheck: 'false', ...attrs });
}

function frame(title, sub, body, mood = 'wave') {
  const app = document.getElementById('app');
  app.innerHTML = '';
  app.append(h('div', { class: 'auth-page' },
    h('div', { class: 'auth-top' },
      h('a', { class: 'brand auth-brand', href: store.state.onboarded ? '#/pfad' : '#/start' }, 'bitweg', h('span', { class: 'brand-cursor' })),
      uiLangButton()),
    h('main', { class: 'auth-card' },
      h('div', { class: 'auth-bit', html: bit({ size: 96, mood }) }),
      h('h1', {}, title),
      sub ? h('p', { class: 'muted' }, sub) : null,
      body)));
}

function errorBox() {
  return h('p', { class: 'auth-error', role: 'alert', hidden: true });
}
function showError(box, err) {
  box.hidden = false;
  box.textContent = germanError(err);
}

/** Nach dem Login: weiter in die App (oder zur Einfuehrung, falls noch nicht gemacht) */
function done(msg) {
  toast(msg);
  enterApp('#/freunde');
}

/** Eingeloggt: direkt in die App. Wer ein Konto hat, muss nicht nochmal durch die Einfuehrung
 *  (sonst landete man nach "Eingeloggt" wieder auf der Startseite, z. B. am iPhone). */
function enterApp(target) {
  if (!store.state.onboarded) {
    store.update(s => {
      s.onboarded = true;
      if (!s.courses.length) s.courses = [s.activeLang || 'python'];
      if (!s.courses.includes(s.activeLang)) s.activeLang = s.courses[0];
    });
    target = '#/pfad';
  }
  if (location.hash === target) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = target;
}

function notConfigured() {
  frame(t('Konten sind noch nicht eingerichtet', 'Accounts are not set up yet'),
    t('Für Konten, Freunde und Nachrichten braucht Bitweg eine Datenbank. Die ist für diese Version noch nicht verbunden. Du kannst trotzdem ganz normal lernen, dein Fortschritt bleibt in diesem Browser.', 'Bitweg needs a database for accounts, friends and messages. It isn\'t connected for this version yet. You can still learn as usual, your progress stays in this browser.'),
    h('div', { class: 'auth-actions' }, h('a', { class: 'btn btn-go', href: store.state.onboarded ? '#/pfad' : '#/start' }, t('Weiter lernen', 'Keep learning'))), 'think');
}

function renderLogin() {
  const email = input({ type: 'email', autocomplete: 'email', placeholder: 'du@beispiel.de', required: true });
  const pw = input({ type: 'password', autocomplete: 'current-password', placeholder: t('Passwort', 'Password'), required: true });
  const err = errorBox();
  const btn = h('button', { type: 'submit', class: 'btn btn-go' }, t('Einloggen', 'Log in'));
  const form = h('form', {
    class: 'auth-form',
    onsubmit: async e => {
      e.preventDefault();
      err.hidden = true;
      btn.disabled = true;
      btn.textContent = t('Einen Moment ...', 'One moment ...');
      try {
        await login(email.value, pw.value);
        done(t('Eingeloggt', 'Logged in'));
      } catch (ex) {
        showError(err, ex);
        btn.disabled = false;
        btn.textContent = t('Einloggen', 'Log in');
      }
    },
  },
  field(t('E-Mail', 'Email'), email),
  field(t('Passwort', 'Password'), pw),
  err,
  h('div', { class: 'auth-actions' }, btn),
  h('p', { class: 'auth-links' },
    h('a', { href: '#/konto/registrieren' }, t('Noch kein Konto? Registrieren', 'No account yet? Sign up')),
    h('a', { href: '#/konto/passwort' }, t('Passwort vergessen?', 'Forgot password?'))));
  frame(t('Willkommen zurück', 'Welcome back'), t('Log dich ein, dann sind dein Fortschritt und deine Freunde da.', 'Log in and your progress and friends are there.'), form);
  email.focus();
}

function renderRegister() {
  const name = input({ type: 'text', maxlength: '40', placeholder: t('z. B. Alex', 'e.g. Alex'), autocomplete: 'given-name', value: store.state.profile.name || '' });
  const user = input({ type: 'text', maxlength: '20', placeholder: 'z. B. alex_codet', autocapitalize: 'off', value: store.state.profile.username || '' });
  const userHint = h('small', { class: 'muted' }, t('Damit finden dich deine Freunde. Kleinbuchstaben, Zahlen und _, 3 bis 20 Zeichen.', 'This is how your friends find you. Lowercase letters, numbers and _, 3 to 20 characters.'));
  const email = input({ type: 'email', autocomplete: 'email', placeholder: 'du@beispiel.de', required: true });
  const pw = input({ type: 'password', autocomplete: 'new-password', placeholder: t('mindestens 8 Zeichen', 'at least 8 characters'), minlength: '8', required: true });
  const pw2 = input({ type: 'password', autocomplete: 'new-password', placeholder: 'nochmal', required: true });
  const err = errorBox();
  const btn = h('button', { type: 'submit', class: 'btn btn-go' }, t('Konto erstellen', 'Create account'));

  user.addEventListener('input', () => {
    user.value = user.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    userHint.className = 'muted';
    userHint.textContent = t('Damit finden dich deine Freunde. Kleinbuchstaben, Zahlen und _, 3 bis 20 Zeichen.', 'This is how your friends find you. Lowercase letters, numbers and _, 3 to 20 characters.');
  });

  const form = h('form', {
    class: 'auth-form',
    onsubmit: async e => {
      e.preventDefault();
      err.hidden = true;
      if (!USERNAME_RE.test(user.value)) {
        userHint.className = 'is-bad';
        userHint.textContent = t('Benutzername: 3 bis 20 Zeichen, nur Kleinbuchstaben, Zahlen und _.', 'Username: 3 to 20 characters, only lowercase letters, numbers and _.');
        user.focus();
        return;
      }
      if (pw.value !== pw2.value) { showError(err, t('Die beiden Passwörter sind nicht gleich.', 'The two passwords don\'t match.')); pw2.focus(); return; }
      btn.disabled = true;
      btn.textContent = t('Wird erstellt ...', 'Creating ...');
      try {
        const res = await register({ email: email.value, password: pw.value, username: user.value, name: name.value });
        if (res.needsConfirm) {
          frame(t('Fast geschafft', 'Almost done'), t(`Wir haben dir eine E-Mail an ${email.value.trim()} geschickt. Klick auf den Link darin, dann bist du eingeloggt. Schau auch im Spam-Ordner nach.`, `We sent an email to ${email.value.trim()}. Click the link in it and you're logged in. Also check your spam folder.`),
            h('div', { class: 'auth-actions' }, h('a', { class: 'btn btn-sky', href: '#/konto' }, t('Zum Login', 'Go to login'))), 'happy');
          return;
        }
        // Neues Konto: Einfuehrung (Kurs, Ziele) noch machen, falls nicht schon passiert
        toast(t('Konto erstellt. Willkommen!', 'Account created. Welcome!'));
        location.hash = store.state.onboarded ? '#/freunde' : '#/start';
      } catch (ex) {
        showError(err, ex);
        btn.disabled = false;
        btn.textContent = t('Konto erstellen', 'Create account');
      }
    },
  },
  field('Name', name),
  field(t('Benutzername', 'Username'), user, userHint),
  field(t('E-Mail', 'Email'), email, h('small', { class: 'muted' }, t('Nur zum Einloggen und für „Passwort vergessen“. Andere sehen sie nicht.', 'Only for logging in and “Forgot password”. Others don\'t see it.'))),
  field(t('Passwort', 'Password'), pw),
  field(t('Passwort wiederholen', 'Repeat password'), pw2),
  err,
  h('p', { class: 'auth-small muted' }, t('Dein bisheriger Fortschritt in diesem Browser wird ins Konto übernommen. Freunde sehen deinen Namen, Benutzernamen, Profilbild, Kurs und Fortschritt.', 'Your progress so far in this browser is moved into the account. Friends see your name, username, profile picture, course and progress.')),
  h('div', { class: 'auth-actions' }, btn),
  h('p', { class: 'auth-links' },
    h('a', { href: '#/konto' }, t('Schon ein Konto? Einloggen', 'Already have an account? Log in')),
    store.state.onboarded ? h('a', { href: '#/pfad' }, t('Später, erst mal lernen', 'Later, learn first')) : null));
  frame(t('Konto erstellen', 'Create account'), t('Mit Konto lernst du auf jedem Gerät weiter und kannst Freunde hinzufügen.', 'With an account you can keep learning on any device and add friends.'), form, 'happy');
  name.focus();
}

function renderForgot() {
  const email = input({ type: 'email', autocomplete: 'email', placeholder: 'du@beispiel.de', required: true });
  const err = errorBox();
  const btn = h('button', { type: 'submit', class: 'btn btn-go' }, t('Link schicken', 'Send link'));
  const form = h('form', {
    class: 'auth-form',
    onsubmit: async e => {
      e.preventDefault();
      err.hidden = true;
      btn.disabled = true;
      try {
        await sendReset(email.value);
        frame(t('E-Mail ist unterwegs', 'Email is on its way'), t('Falls es für diese Adresse ein Konto gibt, kommt gleich ein Link. Öffne ihn in diesem Browser, dann kannst du ein neues Passwort setzen.', 'If there is an account for this address, a link is coming. Open it in this browser, then you can set a new password.'),
          h('div', { class: 'auth-actions' }, h('a', { class: 'btn btn-sky', href: '#/konto' }, t('Zum Login', 'Go to login'))), 'happy');
      } catch (ex) {
        showError(err, ex);
        btn.disabled = false;
      }
    },
  }, field(t('E-Mail', 'Email'), email), err, h('div', { class: 'auth-actions' }, btn),
  h('p', { class: 'auth-links' }, h('a', { href: '#/konto' }, t('Zurück zum Login', 'Back to login'))));
  frame(t('Passwort vergessen', 'Forgot password'), t('Gib deine E-Mail ein. Du bekommst einen Link, mit dem du ein neues Passwort setzt.', 'Enter your email. You\'ll get a link to set a new password.'), form, 'think');
  email.focus();
}

function renderNewPassword() {
  const pw = input({ type: 'password', autocomplete: 'new-password', placeholder: t('mindestens 8 Zeichen', 'at least 8 characters'), required: true });
  const pw2 = input({ type: 'password', autocomplete: 'new-password', placeholder: 'nochmal', required: true });
  const err = errorBox();
  const btn = h('button', { type: 'submit', class: 'btn btn-go' }, t('Passwort speichern', 'Save password'));
  const form = h('form', {
    class: 'auth-form',
    onsubmit: async e => {
      e.preventDefault();
      err.hidden = true;
      if (pw.value !== pw2.value) { showError(err, t('Die beiden Passwörter sind nicht gleich.', 'The two passwords don\'t match.')); return; }
      btn.disabled = true;
      try {
        await setNewPassword(pw.value);
        done(t('Neues Passwort gespeichert', 'New password saved'));
      } catch (ex) {
        showError(err, ex);
        btn.disabled = false;
      }
    },
  }, field(t('Neues Passwort', 'New password'), pw), field(t('Wiederholen', 'Repeat'), pw2), err, h('div', { class: 'auth-actions' }, btn));
  frame(t('Neues Passwort', 'New password'), currentUser() ? t('Setz jetzt dein neues Passwort.', 'Set your new password now.') : t('Öffne den Link aus der E-Mail in diesem Browser. Danach kannst du hier ein neues Passwort setzen.', 'Open the link from the email in this browser. Then you can set a new password here.'), form);
  pw.focus();
}

function loading() {
  frame(t('Einen Moment ...', 'One moment ...'), t('Verbinde mit dem Konto-Dienst.', 'Connecting to the account service.'), h('div', { class: 'auth-spinner', 'aria-hidden': 'true' }), 'think');
}

function offline(sub) {
  frame(t('Keine Verbindung', 'No connection'),
    t('Der Konto-Dienst antwortet gerade nicht. Prüf dein Internet. Falls du die Seite aus WhatsApp, Instagram oder TikTok geöffnet hast: oben auf „In Safari öffnen“ bzw. „Im Browser öffnen“ tippen.', 'The account service isn\'t answering right now. Check your internet. If you opened the page from WhatsApp, Instagram or TikTok: tap “Open in Safari” or “Open in browser”.'),
    h('div', { class: 'auth-actions' },
      h('button', { class: 'btn btn-go', type: 'button', onclick: () => renderAccount(sub) }, t('Nochmal versuchen', 'Try again')),
      h('a', { class: 'btn btn-sky', href: store.state.onboarded ? '#/pfad' : '#/start' }, t('Zurück', 'Back'))), 'think');
}

export async function renderAccount(sub) {
  if (!CLOUD_ENABLED) { notConfigured(); return; }
  // Sofort etwas zeigen, damit der Knopf nie "nichts tut"
  const slow = setTimeout(loading, 150);
  const backend = await initCloud();
  clearTimeout(slow);
  if (!location.hash.startsWith('#/konto')) return; // inzwischen woanders hin
  if (!backend) { offline(sub); return; }
  if (sub === 'neues-passwort') { renderNewPassword(); return; }
  if (currentUser() && sub !== 'passwort') { enterApp('#/profil'); return; }
  if (sub === 'registrieren') renderRegister();
  else if (sub === 'passwort') renderForgot();
  else renderLogin();
}
