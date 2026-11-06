// Profil: Kopf mit Titel- und Profilbild, Stand, Verlauf, Abzeichen, Einstellungen, Sicherung

import { h, dayKey, addDays, toast, confirmDialog, showModal } from '../util.js';
import { icon, solidIcon, langLogo } from '../icons.js';
import { bit } from '../mascot.js';
import { store } from '../store.js';
import { COURSES, LANG_IDS } from '../content/index.js';
import { BADGES, levelInfo, currentStreak, courseProgress } from '../gamification.js';
import { applyTheme } from '../theme.js';
import { GOALS } from '../personalize.js';
import { cropImage } from '../cropper.js';
import { backupNow, backupInfo, listBackups, loadBackup, onBackupChange } from '../backup.js';
import { IS_WEB } from '../env.js';
import { CLOUD_ENABLED, currentUser, myProfile, saveProfile, logout, deleteAccount, blockedIds, unblockUser, germanError, initCloud, profilesById } from '../cloud.js';

const AGE_LABEL = { u13: 'Unter 13', '13-15': '13 bis 15', '16-18': '16 bis 18', '19+': '19 oder älter' };
const PRIOR_LABEL = { none: 'Noch nie programmiert', blocks: 'Blöcke, z. B. Scratch', python: 'Python', cfamily: 'C++, C# oder Java', other: 'Andere Sprache' };
const LEVEL_LABEL = ['', 'neu', 'ein paar Befehle', 'einfache Programme', 'Schleifen und Funktionen', 'fortgeschritten'];

/** Profilbild: eigenes Bild oder Bit als Platzhalter */
export function avatarEl(size = 120, cls = '') {
  const p = store.state.profile;
  return p.avatar
    ? h('img', { class: `avatar ${cls}`, src: p.avatar, alt: p.name ? `Profilbild von ${p.name}` : 'Profilbild', width: size, height: size })
    : h('span', { class: `avatar is-bit ${cls}`, style: { width: `${size}px`, height: `${size}px` }, html: bit({ size: Math.round(size * 0.72), mood: 'happy', label: 'Kein Profilbild' }) });
}

function joinedText() {
  const d = new Date(store.state.profile.joined || Date.now());
  return `Dabei seit ${d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}`;
}

/* ---------------------------------------------------------------- Kopf */

function profileHeader() {
  const s = store.state;
  const p = s.profile;
  const lvl = levelInfo(s.xp);
  const banner = h('div', { class: 'prof-banner', style: p.banner ? { backgroundImage: `url("${p.banner}")` } : null },
    p.banner ? null : h('span', { class: 'prof-banner-empty' }, 'Kein Titelbild'));
  return h('section', { class: 'prof-card' },
    banner,
    h('div', { class: 'prof-body' },
      h('div', { class: 'prof-avatar' }, avatarEl(128)),
      h('div', { class: 'prof-id' },
        h('h1', {}, p.name || 'Dein Name'),
        h('p', { class: 'prof-user' }, p.username ? `@${p.username}` : 'Noch kein Benutzername'),
        h('p', { class: 'prof-joined' }, joinedText()),
        p.bio ? h('p', { class: 'prof-bio' }, p.bio) : null,
        h('div', { class: 'prof-courses' }, s.courses.map(l => h('span', { class: 'prof-course', title: COURSES[l].name, html: langLogo(l, 30) })))),
      h('button', { type: 'button', class: 'btn btn-sky prof-edit', onclick: openEditor }, 'Profil bearbeiten')),
    h('div', { class: 'prof-stats' },
      h('div', {}, h('span', { html: solidIcon(currentStreak(s) > 0 ? 'flame' : 'flameCold', 30) }), h('b', {}, currentStreak(s)), h('small', {}, 'Tage in Folge')),
      h('div', {}, h('span', { html: solidIcon('bolt', 30) }), h('b', {}, s.xp), h('small', {}, 'XP gesamt')),
      h('div', {}, h('span', { html: solidIcon('trophy', 30) }), h('b', {}, lvl.level), h('small', {}, `Stufe, noch ${lvl.need - lvl.into} XP`)),
      h('div', {}, h('span', { html: solidIcon('quest', 30) }), h('b', {}, BADGES.filter(b => s.badges[b.id]).length), h('small', {}, 'Abzeichen'))));
}

/* ---------------------------------------------------------------- Bearbeiten */

function openEditor() {
  const p = store.state.profile;
  const draft = { name: p.name, username: p.username, bio: p.bio, avatar: p.avatar, banner: p.banner };

  const bannerPrev = h('div', { class: 'prof-banner is-small' });
  const avatarPrev = h('div', { class: 'edit-avatar' });
  function paint() {
    bannerPrev.style.backgroundImage = draft.banner ? `url("${draft.banner}")` : '';
    bannerPrev.classList.toggle('is-empty', !draft.banner);
    avatarPrev.innerHTML = '';
    avatarPrev.append(draft.avatar ? h('img', { class: 'avatar', src: draft.avatar, alt: 'Vorschau Profilbild', width: 96, height: 96 }) : h('span', { class: 'avatar is-bit', style: { width: '96px', height: '96px' }, html: bit({ size: 70 }) }));
  }

  function picker(label, w, hgt, key) {
    const input = h('input', {
      type: 'file', accept: 'image/*', class: 'sr-only',
      onchange: async e => {
        try {
          const result = await cropImage(e.target.files[0], w, hgt, { round: key === 'avatar', title: key === 'avatar' ? 'Profilbild zuschneiden' : 'Titelbild zuschneiden' });
          if (result) {
            draft[key] = result;
            paint();
          }
        } catch (err) {
          toast('Bild nicht übernommen', err.message);
        }
        e.target.value = '';
      },
    });
    return h('div', { class: 'row-actions' },
      h('label', { class: 'btn btn-small' }, label, input),
      h('button', { type: 'button', class: 'btn btn-small btn-ghost', onclick: () => { draft[key] = null; paint(); } }, 'Entfernen'));
  }

  const nameIn = h('input', { class: 'text-input', value: draft.name, maxlength: '40', placeholder: 'z. B. Tom', 'aria-label': 'Name' });
  const userIn = h('input', { class: 'text-input', value: draft.username, maxlength: '20', placeholder: 'z. B. tom_codet', 'aria-label': 'Benutzername', spellcheck: 'false', autocapitalize: 'off' });
  const bioIn = h('textarea', { class: 'text-input', maxlength: '160', rows: '3', placeholder: 'Was baust du gerade? Was ist dein Ziel?', 'aria-label': 'Über mich' });
  bioIn.value = draft.bio;
  const userHint = h('small', { class: 'muted' }, 'Kleinbuchstaben, Zahlen und Unterstrich, 3 bis 20 Zeichen.');

  let release = () => {};
  const dlg = h('dialog', { class: 'confirm prof-dialog' },
    h('h2', {}, 'Profil bearbeiten'),
    h('div', { class: 'field' }, h('span', {}, 'Titelbild'), bannerPrev, picker('Titelbild wählen', 1200, 320, 'banner')),
    h('div', { class: 'field' }, h('span', {}, 'Profilbild'), h('div', { class: 'edit-avatar-row' }, avatarPrev, picker('Profilbild wählen', 256, 256, 'avatar'))),
    h('label', { class: 'field' }, h('span', {}, 'Name'), nameIn),
    h('label', { class: 'field' }, h('span', {}, 'Benutzername'), userIn, userHint),
    h('label', { class: 'field' }, h('span', {}, 'Über mich'), bioIn),
    h('p', { class: 'muted', style: { fontSize: 'var(--text-sm)' } }, currentUser()
      ? 'Name, Benutzername, Bilder und „Über mich“ sehen alle eingeloggten Nutzer, z. B. wenn sie dich suchen.'
      : 'Alles bleibt in diesem Browser und landet mit in der Sicherung.'),
    h('div', { class: 'row-actions' },
      h('button', { type: 'button', class: 'btn', onclick: () => close() }, 'Abbrechen'),
      h('button', { type: 'button', class: 'btn btn-go', onclick: save }, 'Speichern')));

  function close() {
    dlg.close();
    release();
    dlg.remove();
  }
  async function save(e) {
    const username = userIn.value.trim().toLowerCase();
    if ((username || currentUser()) && !/^[a-z0-9_]{3,20}$/.test(username)) {
      userHint.textContent = 'Nur Kleinbuchstaben, Zahlen und _, 3 bis 20 Zeichen.';
      userHint.classList.add('is-bad');
      userIn.focus();
      return;
    }
    if (currentUser()) {
      const btn = e?.currentTarget;
      if (btn) btn.disabled = true;
      try {
        await saveProfile({ username, name: nameIn.value.trim(), bio: bioIn.value.trim(), avatar: draft.avatar, banner: draft.banner });
      } catch (err) {
        if (btn) btn.disabled = false;
        userHint.textContent = germanError(err);
        userHint.classList.add('is-bad');
        return;
      }
    }
    store.update(s => {
      Object.assign(s.profile, {
        name: nameIn.value.trim(),
        username,
        bio: bioIn.value.trim(),
        avatar: draft.avatar,
        banner: draft.banner,
      });
    });
    close();
    toast('Profil gespeichert');
    location.hash = '#/profil';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }
  dlg.addEventListener('cancel', e => { e.preventDefault(); close(); });
  paint();
  release = showModal(dlg);
  nameIn.focus();
}

/* ---------------------------------------------------------------- Ueber dich */

/** Ziele als Mehrfachauswahl, wirken auf Lernpfad und Werkstatt */
function goalToggles() {
  const group = h('div', { class: 'seg', role: 'group', 'aria-label': 'Deine Ziele' });
  Object.entries(GOALS).forEach(([id, label]) => group.append(h('button', {
    type: 'button',
    'aria-pressed': String(store.state.profile.reasons.includes(id)),
    onclick: e => {
      store.update(s => {
        const r = s.profile.reasons;
        s.profile.reasons = r.includes(id) ? r.filter(x => x !== id) : [...r, id];
      });
      e.currentTarget.setAttribute('aria-pressed', String(store.state.profile.reasons.includes(id)));
    },
  }, label)));
  return group;
}

function aboutSection() {
  const p = store.state.profile;
  const rows = [
    ['Alter', AGE_LABEL[p.age] || 'keine Angabe'],
    ['Vorkenntnisse', p.prior.length ? p.prior.map(x => PRIOR_LABEL[x]).join(', ') : 'keine Angabe'],
    ...store.state.courses.map(l => [`Start-Level ${COURSES[l].name}`, p.level[l] ? `Stufe ${p.level[l]} von 5, ${LEVEL_LABEL[p.level[l]]}` : 'keine Angabe']),
  ];
  const missing = LANG_IDS.filter(l => !store.state.courses.includes(l));
  return h('section', { class: 'section' },
    h('h2', {}, 'Über dich'),
    h('div', { class: 'field' }, h('span', {}, 'Deine Ziele'), goalToggles(),
      h('small', { class: 'muted' }, 'Mehrere möglich. Passende Abschnitte werden im Lernpfad markiert, passende Anleitungen in der Werkstatt aufgeklappt.')),
    h('div', { class: 'onb-summary', style: { marginBottom: 'var(--s4)' } }, rows.map(([k, v]) => h('div', {}, h('span', {}, k), h('b', {}, v)))),
    missing.length ? h('div', { class: 'row-actions' }, missing.map(l => h('a', { class: 'btn btn-sky btn-small', href: `#/start/kurs/${l}` }, `${COURSES[l].name} hinzufügen`))) : null);
}

function segmented(options, value, onPick, label) {
  const group = h('div', { class: 'seg', role: 'group', 'aria-label': label });
  options.forEach(([v, text]) => group.append(h('button', {
    type: 'button',
    'aria-pressed': String(v === value),
    onclick: e => {
      onPick(v);
      group.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === e.currentTarget)));
    },
  }, text)));
  return group;
}

function history() {
  const s = store.state;
  const goal = s.settings.dailyGoal;
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = addDays(new Date(), -i);
    days.push({ d, xp: s.days[dayKey(d)] || 0, today: i === 0 });
  }
  const max = Math.max(goal, ...days.map(x => x.xp));
  return h('div', { class: 'bars', role: 'img', 'aria-label': `XP der letzten 14 Tage, Tagesziel ${goal} XP` },
    days.map(x => h('div', { class: `bar${x.today ? ' is-today' : ''}`, title: `${x.d.toLocaleDateString('de-DE')}: ${x.xp} XP` },
      h('i', { style: { height: `${(x.xp / max) * 100}%` } }),
      h('small', {}, x.d.getDate()))),
    h('div', { class: 'bars-goal', style: { bottom: `calc(22px + ${(goal / max) * (140 - 22)}px)` }, title: `Tagesziel ${goal} XP` }));
}

/* ---------------------------------------------------------------- Sicherung */

function fmtTime(ms) {
  const d = new Date(ms);
  const today = new Date().toDateString() === d.toDateString();
  return today ? `heute um ${d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr` : d.toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' });
}

function backupSection() {
  const status = h('p', { class: 'backup-status' });
  const list = h('ul', { class: 'backup-list' });

  function paintStatus(info = backupInfo()) {
    status.className = `backup-status${info.error ? ' is-bad' : info.last ? ' is-ok' : ''}`;
    status.innerHTML = '';
    if (info.error) status.append(h('span', { html: icon('cross', 18) }), info.error);
    else if (info.last) status.append(h('span', { html: icon('check', 18) }), `Zuletzt gesichert ${fmtTime(info.last)}`, info.dir ? h('small', {}, info.dir) : null);
    else status.append('Noch keine Sicherung auf dem Desktop.');
  }

  async function paintList() {
    const res = await listBackups();
    list.innerHTML = '';
    if (!res.ok) { list.append(h('li', { class: 'muted' }, res.error)); return; }
    if (!res.files.length) { list.append(h('li', { class: 'muted' }, 'Noch keine Dateien im Ordner.')); return; }
    res.files.forEach(f => list.append(h('li', {},
      h('span', {}, h('b', {}, new Date(f.name.slice(19, 29)).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })), h('small', {}, `${f.name.includes('-vorher-') ? 'älterer Stand vom selben Tag · ' : ''}${Math.max(1, Math.round(f.size / 1024))} KB`)),
      h('button', { type: 'button', class: 'btn btn-small', onclick: () => restore(f.name) }, 'Laden'))));
  }

  async function restore(name) {
    const ok = await confirmDialog({ title: 'Diese Sicherung laden?', text: 'Dein aktueller Stand wird durch die Sicherung ersetzt. Der aktuelle Stand wird vorher noch als heutige Sicherung gespeichert, falls die geladene älter ist.', ok: 'Laden' });
    if (!ok) return;
    try {
      const data = await loadBackup(name);
      if (!name.includes(dayKey())) await backupNow();
      store.importJSON(JSON.stringify(data));
      applyTheme();
      toast('Sicherung geladen', name);
      location.hash = '#/pfad';
    } catch (err) {
      toast('Laden fehlgeschlagen', err.message);
    }
  }

  const unsub = onBackupChange(info => {
    if (!document.body.contains(status)) { unsub(); return; }
    paintStatus(info);
    paintList();
  });
  paintStatus();
  paintList();

  return h('section', { class: 'section' },
    h('h2', {}, 'Sicherung auf dem Desktop'),
    h('p', {}, 'Laufzeit speichert deinen kompletten Stand automatisch im Ordner „Laufzeit-Sicherungen“ auf deinem Desktop: nach dem Lernen, beim Schließen und einmal am Tag. Pro Tag eine Datei, die letzten 14 Tage bleiben.'),
    h('div', { class: 'field' }, h('span', {}, 'Automatisch sichern'),
      segmented([[true, 'An'], [false, 'Aus']], store.state.settings.autoBackup !== false, v => store.update(s => { s.settings.autoBackup = v; }), 'Automatisch sichern')),
    status,
    h('div', { class: 'row-actions', style: { margin: 'var(--s3) 0 var(--s5)' } },
      h('button', { type: 'button', class: 'btn btn-go', onclick: async e => { e.currentTarget.disabled = true; const r = await backupNow(); e.currentTarget.disabled = false; toast(r.ok ? 'Gesichert' : 'Sicherung fehlgeschlagen', r.ok ? r.name : r.error); } }, 'Jetzt sichern')),
    h('p', { class: 'eyebrow' }, 'Vorhandene Sicherungen'),
    list,
    h('div', { class: 'row-actions', style: { marginTop: 'var(--s5)' } },
      h('button', { type: 'button', class: 'btn btn-small', onclick: exportData }, h('span', { html: icon('copy', 16) }), 'Als Datei herunterladen'),
      h('label', { class: 'btn btn-small' }, 'Datei laden', h('input', { type: 'file', accept: 'application/json,.json', class: 'sr-only', onchange: importData })),
      h('button', { type: 'button', class: 'btn btn-small btn-bad', onclick: resetData }, 'Alles zurücksetzen')));
}

/* ---------------------------------------------------------------- Konto */

function accountSection() {
  if (!CLOUD_ENABLED) return null;
  const sec = h('section', { class: 'section' }, h('h2', {}, 'Konto'));
  const user = currentUser();
  if (!user) {
    sec.append(
      h('p', {}, 'Mit einem Konto ist dein Fortschritt auf jedem Gerät da, und du kannst Freunde hinzufügen, ihnen schreiben und sie anfeuern.'),
      h('div', { class: 'row-actions' },
        h('a', { class: 'btn btn-go', href: '#/konto/registrieren' }, 'Konto erstellen'),
        h('a', { class: 'btn btn-ghost', href: '#/konto' }, 'Einloggen')));
    return sec;
  }
  const blockedList = h('ul', { class: 'blocked-list' });
  async function paintBlocked() {
    blockedList.innerHTML = '';
    try {
      const ids = await blockedIds();
      if (!ids.length) { blockedList.append(h('li', { class: 'muted' }, 'Niemand blockiert.')); return; }
      const people = await profilesById(ids);
      ids.forEach(id => {
        const p = people[id];
        blockedList.append(h('li', {}, h('span', {}, p ? `@${p.username}` : 'Gelöschtes Konto'),
          h('button', {
            type: 'button', class: 'btn btn-small btn-ghost',
            onclick: async () => {
              try { await unblockUser(id); toast('Blockierung aufgehoben'); paintBlocked(); } catch (err) { toast('Hat nicht geklappt', germanError(err)); }
            },
          }, 'Aufheben')));
      });
    } catch (err) {
      blockedList.append(h('li', { class: 'muted' }, germanError(err)));
    }
  }
  sec.append(
    h('p', { class: 'account-line' }, h('span', { html: icon('check', 18) }), `Eingeloggt als ${user.email}`, myProfile() ? h('b', {}, ` · @${myProfile().username}`) : null),
    h('p', { class: 'muted' }, 'Dein Fortschritt wird automatisch im Konto gespeichert. Auf einem anderen Gerät einfach einloggen.'),
    h('div', { class: 'row-actions' },
      h('a', { class: 'btn btn-sky', href: '#/freunde' }, 'Freunde'),
      h('a', { class: 'btn', href: '#/konto/neues-passwort' }, 'Passwort ändern'),
      h('button', {
        type: 'button', class: 'btn btn-ghost',
        onclick: async () => {
          if (!(await confirmDialog({ title: 'Ausloggen?', text: 'Dein Stand ist im Konto gespeichert. Auf diesem Gerät wird danach alles geleert, bis du dich wieder einloggst.', ok: 'Ausloggen' }))) return;
          await logout();
          toast('Ausgeloggt');
          location.hash = '#/konto';
        },
      }, h('span', { html: icon('logout', 16) }), 'Ausloggen')),
    h('details', { class: 'account-more', ontoggle: e => { if (e.currentTarget.open) paintBlocked(); } },
      h('summary', {}, 'Blockierte Nutzer und Konto löschen'),
      h('p', { class: 'eyebrow' }, 'Blockiert'),
      blockedList,
      h('div', { class: 'row-actions', style: { marginTop: 'var(--s4)' } },
        h('button', {
          type: 'button', class: 'btn btn-small btn-bad',
          onclick: async () => {
            if (!(await confirmDialog({ title: 'Konto wirklich löschen?', text: 'Profil, Fortschritt im Konto, Freundschaften und Nachrichten werden endgültig gelöscht. Das kann niemand rückgängig machen.', ok: 'Endgültig löschen', danger: true }))) return;
            try {
              await deleteAccount();
              toast('Konto gelöscht');
              location.hash = '#/start';
            } catch (err) {
              toast('Löschen fehlgeschlagen', germanError(err));
            }
          },
        }, 'Konto löschen'))));
  return sec;
}

/** Online: keine Desktop-Sicherung, aber Datei-Export */
function webDataSection() {
  return h('section', { class: 'section' },
    h('h2', {}, 'Deine Daten'),
    h('p', {}, currentUser()
      ? 'Dein Stand liegt in diesem Browser und in deinem Konto. Zusätzlich kannst du ihn als Datei speichern.'
      : 'Ohne Konto liegt dein Stand nur in diesem Browser. Speicher ihn ab und zu als Datei, oder erstell ein Konto.'),
    h('div', { class: 'row-actions' },
      h('button', { type: 'button', class: 'btn btn-small', onclick: exportData }, h('span', { html: icon('copy', 16) }), 'Als Datei herunterladen'),
      h('label', { class: 'btn btn-small' }, 'Datei laden', h('input', { type: 'file', accept: 'application/json,.json', class: 'sr-only', onchange: importData })),
      h('button', { type: 'button', class: 'btn btn-small btn-bad', onclick: resetData }, 'Alles zurücksetzen')));
}

/* ---------------------------------------------------------------- Seite */

export function renderProfile(main) {
  const s = store.state;
  const unlocked = BADGES.filter(b => s.badges[b.id]).length;
  const page = h('div', { class: 'page page-wide' });
  main.append(page);

  page.append(
    profileHeader(),

    h('div', { class: 'facts' },
      ...LANG_IDS.filter(id => s.courses.includes(id)).map(id => {
        const p = courseProgress(id);
        return h('div', { class: 'fact' }, h('b', {}, `${p.done}/${p.total}`), h('span', {}, `${COURSES[id].name}-Lektionen, ${s.langs[id].xp} XP`));
      }),
      h('div', { class: 'fact' }, h('b', {}, s.streak.best), h('span', {}, 'längste Serie'))),

    aboutSection(),

    h('section', { class: 'section' }, h('h2', {}, 'Letzte 14 Tage'), history()),

    h('section', { class: 'section' },
      h('h2', {}, `Abzeichen ${unlocked}/${BADGES.length}`),
      h('ul', { class: 'badge-list' }, BADGES.map(b => {
        const got = s.badges[b.id];
        return h('li', { class: got ? '' : 'is-locked' },
          h('span', { class: `seal${got ? '' : ' is-locked'}`, 'aria-hidden': 'true' }, b.mark),
          h('div', {}, h('strong', {}, b.name), h('span', {}, got ? `${b.desc} Erhalten am ${new Date(got).toLocaleDateString('de-DE')}.` : b.desc)));
      }))),

    h('section', { class: 'section' },
      h('h2', {}, 'Einstellungen'),
      h('div', { class: 'field' }, h('span', {}, 'Darstellung'),
        segmented([['auto', 'Wie System'], ['light', 'Hell'], ['dark', 'Dunkel']], s.settings.theme,
          v => { store.update(st => { st.settings.theme = v; }); applyTheme(); }, 'Darstellung')),
      h('div', { class: 'field' }, h('span', {}, 'Tagesziel'),
        segmented([[10, '10 XP'], [30, '30 XP'], [50, '50 XP'], [100, '100 XP']], s.settings.dailyGoal,
          v => store.update(st => { st.settings.dailyGoal = v; }), 'Tagesziel'),
        h('small', { class: 'muted' }, 'Eine Lektion bringt etwa 15 bis 22 XP.'))),

    accountSection(),
    IS_WEB ? webDataSection() : backupSection());
  // Konto-Infos kommen evtl. erst nach dem Laden der Seite
  if (CLOUD_ENABLED && !currentUser()) {
    initCloud().then(() => {
      if (currentUser() && document.body.contains(page)) { main.innerHTML = ''; renderProfile(main); }
    });
  }
}

function exportData() {
  const blob = new Blob([store.exportJSON()], { type: 'application/json' });
  const a = h('a', { href: URL.createObjectURL(blob), download: `laufzeit-sicherung-${dayKey()}.json` });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function importData(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const ok = await confirmDialog({ title: 'Sicherung laden?', text: 'Dein aktueller Fortschritt wird durch die Sicherung ersetzt.', ok: 'Laden' });
    if (!ok) return;
    store.importJSON(text);
    applyTheme();
    toast('Sicherung geladen');
    location.hash = '#/pfad';
  } catch (err) {
    toast('Laden fehlgeschlagen', err.message);
  } finally {
    e.target.value = '';
  }
}

async function resetData() {
  const ok = await confirmDialog({
    title: 'Wirklich alles zurücksetzen?',
    text: IS_WEB
      ? `XP, Serie, Abzeichen und alle abgeschlossenen Lektionen werden gelöscht${currentUser() ? ', auch im Konto' : ''}. Lad dir vorher eine Datei herunter, wenn du den Stand behalten willst.`
      : 'XP, Serie, Abzeichen, Profil und alle abgeschlossenen Lektionen werden gelöscht. Vorher wird der aktuelle Stand noch auf dem Desktop gesichert.',
    ok: 'Zurücksetzen',
    danger: true,
  });
  if (!ok) return;
  if (!IS_WEB) await backupNow();
  const keep = currentUser() ? { ...store.state.profile } : null;
  store.reset();
  if (keep) store.update(s => { Object.assign(s.profile, { name: keep.name, username: keep.username, bio: keep.bio, avatar: keep.avatar, banner: keep.banner }); });
  toast('Zurückgesetzt', IS_WEB ? 'Alles auf Anfang.' : 'Alles auf Anfang. Die Sicherung liegt auf dem Desktop.');
  location.hash = '#/start';
}
