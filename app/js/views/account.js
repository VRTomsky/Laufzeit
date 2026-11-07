// Konto: Registrieren, Einloggen, Passwort vergessen, neues Passwort
// Eigene Vollbild-Seite (wie die Einfuehrung), funktioniert auch vor der Einfuehrung.

import { h, toast } from '../util.js';
import { bit } from '../mascot.js';
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
    h('a', { class: 'brand auth-brand', href: store.state.onboarded ? '#/pfad' : '#/start' }, 'laufzeit', h('span', { class: 'brand-cursor' })),
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
  location.hash = store.state.onboarded ? '#/freunde' : '#/start';
}

function notConfigured() {
  frame('Konten sind noch nicht eingerichtet',
    'Für Konten, Freunde und Nachrichten braucht Laufzeit eine Datenbank. Die ist für diese Version noch nicht verbunden. Du kannst trotzdem ganz normal lernen, dein Fortschritt bleibt in diesem Browser.',
    h('div', { class: 'auth-actions' }, h('a', { class: 'btn btn-go', href: store.state.onboarded ? '#/pfad' : '#/start' }, 'Weiter lernen')), 'think');
}

function renderLogin() {
  const email = input({ type: 'email', autocomplete: 'email', placeholder: 'du@beispiel.de', required: true });
  const pw = input({ type: 'password', autocomplete: 'current-password', placeholder: 'Passwort', required: true });
  const err = errorBox();
  const btn = h('button', { type: 'submit', class: 'btn btn-go' }, 'Einloggen');
  const form = h('form', {
    class: 'auth-form',
    onsubmit: async e => {
      e.preventDefault();
      err.hidden = true;
      btn.disabled = true;
      btn.textContent = 'Einen Moment ...';
      try {
        await login(email.value, pw.value);
        done('Eingeloggt');
      } catch (ex) {
        showError(err, ex);
        btn.disabled = false;
        btn.textContent = 'Einloggen';
      }
    },
  },
  field('E-Mail', email),
  field('Passwort', pw),
  err,
  h('div', { class: 'auth-actions' }, btn),
  h('p', { class: 'auth-links' },
    h('a', { href: '#/konto/registrieren' }, 'Noch kein Konto? Registrieren'),
    h('a', { href: '#/konto/passwort' }, 'Passwort vergessen?')));
  frame('Willkommen zurück', 'Log dich ein, dann sind dein Fortschritt und deine Freunde da.', form);
  email.focus();
}

function renderRegister() {
  const name = input({ type: 'text', maxlength: '40', placeholder: 'z. B. Alex', autocomplete: 'given-name', value: store.state.profile.name || '' });
  const user = input({ type: 'text', maxlength: '20', placeholder: 'z. B. alex_codet', autocapitalize: 'off', value: store.state.profile.username || '' });
  const userHint = h('small', { class: 'muted' }, 'Damit finden dich deine Freunde. Kleinbuchstaben, Zahlen und _, 3 bis 20 Zeichen.');
  const email = input({ type: 'email', autocomplete: 'email', placeholder: 'du@beispiel.de', required: true });
  const pw = input({ type: 'password', autocomplete: 'new-password', placeholder: 'mindestens 8 Zeichen', minlength: '8', required: true });
  const pw2 = input({ type: 'password', autocomplete: 'new-password', placeholder: 'nochmal', required: true });
  const err = errorBox();
  const btn = h('button', { type: 'submit', class: 'btn btn-go' }, 'Konto erstellen');

  user.addEventListener('input', () => {
    user.value = user.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    userHint.className = 'muted';
    userHint.textContent = 'Damit finden dich deine Freunde. Kleinbuchstaben, Zahlen und _, 3 bis 20 Zeichen.';
  });

  const form = h('form', {
    class: 'auth-form',
    onsubmit: async e => {
      e.preventDefault();
      err.hidden = true;
      if (!USERNAME_RE.test(user.value)) {
        userHint.className = 'is-bad';
        userHint.textContent = 'Benutzername: 3 bis 20 Zeichen, nur Kleinbuchstaben, Zahlen und _.';
        user.focus();
        return;
      }
      if (pw.value !== pw2.value) { showError(err, 'Die beiden Passwörter sind nicht gleich.'); pw2.focus(); return; }
      btn.disabled = true;
      btn.textContent = 'Wird erstellt ...';
      try {
        const res = await register({ email: email.value, password: pw.value, username: user.value, name: name.value });
        if (res.needsConfirm) {
          frame('Fast geschafft', `Wir haben dir eine E-Mail an ${email.value.trim()} geschickt. Klick auf den Link darin, dann bist du eingeloggt. Schau auch im Spam-Ordner nach.`,
            h('div', { class: 'auth-actions' }, h('a', { class: 'btn btn-sky', href: '#/konto' }, 'Zum Login')), 'happy');
          return;
        }
        done('Konto erstellt. Willkommen!');
      } catch (ex) {
        showError(err, ex);
        btn.disabled = false;
        btn.textContent = 'Konto erstellen';
      }
    },
  },
  field('Name', name),
  field('Benutzername', user, userHint),
  field('E-Mail', email, h('small', { class: 'muted' }, 'Nur zum Einloggen und für „Passwort vergessen“. Andere sehen sie nicht.')),
  field('Passwort', pw),
  field('Passwort wiederholen', pw2),
  err,
  h('p', { class: 'auth-small muted' }, 'Dein bisheriger Fortschritt in diesem Browser wird ins Konto übernommen. Freunde sehen deinen Namen, Benutzernamen, Profilbild, Kurs und Fortschritt.'),
  h('div', { class: 'auth-actions' }, btn),
  h('p', { class: 'auth-links' },
    h('a', { href: '#/konto' }, 'Schon ein Konto? Einloggen'),
    store.state.onboarded ? h('a', { href: '#/pfad' }, 'Später, erst mal lernen') : null));
  frame('Konto erstellen', 'Mit Konto lernst du auf jedem Gerät weiter und kannst Freunde hinzufügen.', form, 'happy');
  name.focus();
}

function renderForgot() {
  const email = input({ type: 'email', autocomplete: 'email', placeholder: 'du@beispiel.de', required: true });
  const err = errorBox();
  const btn = h('button', { type: 'submit', class: 'btn btn-go' }, 'Link schicken');
  const form = h('form', {
    class: 'auth-form',
    onsubmit: async e => {
      e.preventDefault();
      err.hidden = true;
      btn.disabled = true;
      try {
        await sendReset(email.value);
        frame('E-Mail ist unterwegs', 'Falls es für diese Adresse ein Konto gibt, kommt gleich ein Link. Öffne ihn in diesem Browser, dann kannst du ein neues Passwort setzen.',
          h('div', { class: 'auth-actions' }, h('a', { class: 'btn btn-sky', href: '#/konto' }, 'Zum Login')), 'happy');
      } catch (ex) {
        showError(err, ex);
        btn.disabled = false;
      }
    },
  }, field('E-Mail', email), err, h('div', { class: 'auth-actions' }, btn),
  h('p', { class: 'auth-links' }, h('a', { href: '#/konto' }, 'Zurück zum Login')));
  frame('Passwort vergessen', 'Gib deine E-Mail ein. Du bekommst einen Link, mit dem du ein neues Passwort setzt.', form, 'think');
  email.focus();
}

function renderNewPassword() {
  const pw = input({ type: 'password', autocomplete: 'new-password', placeholder: 'mindestens 8 Zeichen', required: true });
  const pw2 = input({ type: 'password', autocomplete: 'new-password', placeholder: 'nochmal', required: true });
  const err = errorBox();
  const btn = h('button', { type: 'submit', class: 'btn btn-go' }, 'Passwort speichern');
  const form = h('form', {
    class: 'auth-form',
    onsubmit: async e => {
      e.preventDefault();
      err.hidden = true;
      if (pw.value !== pw2.value) { showError(err, 'Die beiden Passwörter sind nicht gleich.'); return; }
      btn.disabled = true;
      try {
        await setNewPassword(pw.value);
        done('Neues Passwort gespeichert');
      } catch (ex) {
        showError(err, ex);
        btn.disabled = false;
      }
    },
  }, field('Neues Passwort', pw), field('Wiederholen', pw2), err, h('div', { class: 'auth-actions' }, btn));
  frame('Neues Passwort', currentUser() ? 'Setz jetzt dein neues Passwort.' : 'Öffne den Link aus der E-Mail in diesem Browser. Danach kannst du hier ein neues Passwort setzen.', form);
  pw.focus();
}

export async function renderAccount(sub) {
  if (!CLOUD_ENABLED) { notConfigured(); return; }
  await initCloud();
  if (sub === 'neues-passwort') { renderNewPassword(); return; }
  if (currentUser()) { location.replace('#/profil'); return; }
  if (sub === 'registrieren') renderRegister();
  else if (sub === 'passwort') renderForgot();
  else renderLogin();
}
