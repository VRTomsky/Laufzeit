// Freunde: Anfragen, Suche, Liste mit Fortschritt, Rangliste, Anfeuern,
// fremde Profile (#/nutzer/name) und Nachrichten (#/chat/name)

import { t, locale } from '../i18n.js';
import { h, toast, confirmDialog, showModal } from '../util.js';
import { icon, solidIcon, langLogo } from '../icons.js';
import { bit } from '../mascot.js';
import { chatBox } from './chatbox.js';
import { groupsSection } from './groups.js';
import { store } from '../store.js';
import { COURSES } from '../content/index.js';
import { levelInfo, currentStreak } from '../gamification.js';
import {
  CLOUD_ENABLED, initCloud, currentUser, myProfile, safeImg, germanError, buildSummary, jointStreak,
  loadFriends, searchPeople, profileByUsername, relationTo, addFriend, acceptFriend, removeFriend,
  blockUser, reportUser, loadThread, sendMessage, markThreadRead, conversations,
  sendAttachment, attachmentUrl, attachmentsAvailable, ATTACH_TYPES, ATTACH_MAX,
  cheer, shareStreak, unseenNudges, markNudgesSeen, nudgeText, onLive, refreshCounts,
} from '../cloud.js';

/* ---------------------------------------------------------------- Bausteine */

export function personAvatar(p, size = 48) {
  const src = safeImg(p?.avatar);
  return src
    ? h('img', { class: 'avatar', src, alt: '', width: size, height: size, loading: 'lazy' })
    : h('span', { class: 'avatar is-bit', style: { width: `${size}px`, height: `${size}px` }, html: bit({ size: Math.round(size * 0.72), mood: 'happy' }) });
}

const displayName = p => p?.name || `@${p?.username}`;

/** "Python · Abschnitt 5: Listen" */
function activity(p) {
  const s = p.summary || {};
  const lang = s.active && s.langs?.[s.active] ? s.active : Object.keys(s.langs || {})[0];
  if (!lang) return t('Hat noch nicht angefangen', 'Hasn\'t started yet');
  const l = s.langs[lang];
  return t(`${COURSES[lang]?.name || lang} · Abschnitt ${l.unit}: ${l.unitTitle}`, `${COURSES[lang]?.name || lang} · Unit ${l.unit}: ${l.unitTitle}`);
}

function lastSeen(p) {
  if (p.summary?.today || p.last_active === new Date().toISOString().slice(0, 10)) return 'heute gelernt';
  if (!p.last_active) return 'noch nie gelernt';
  const days = Math.round((Date.now() - Date.parse(p.last_active)) / 864e5);
  return days <= 1 ? 'gestern gelernt' : t(`zuletzt vor ${days} Tagen`, `last active ${days} days ago`);
}

const mySummary = () => buildSummary(store.state);

async function guard(fn, okMsg) {
  try {
    await fn();
    if (okMsg) toast(okMsg);
    return true;
  } catch (err) {
    toast(t('Hat nicht geklappt', 'That didn\'t work'), germanError(err));
    return false;
  }
}

function loading(main, text = t('Lädt ...', 'Loading ...')) {
  const el = h('p', { class: 'muted social-loading' }, text);
  main.append(el);
  return el;
}

/** Seite fuer Nicht-Eingeloggte */
function signedOut(main) {
  main.append(h('div', { class: 'page' },
    h('header', { class: 'page-head' }, h('p', { class: 'eyebrow' }, t('Freunde', 'Friends')), h('h1', { class: 'display' }, t('Zusammen lernen', 'Learn together'))),
    h('section', { class: 'social-empty' },
      h('div', { html: bit({ size: 120, mood: 'wave' }) }),
      CLOUD_ENABLED
        ? [h('p', {}, t('Mit einem Konto siehst du, was deine Freunde gerade lernen, schreibst ihnen Nachrichten und feuerst sie an. Dein Fortschritt ist dann auf jedem Gerät da.', 'With an account you can see what your friends are learning, send them messages and cheer them on. Your progress is then on every device.')),
          h('div', { class: 'row-actions' },
            h('a', { class: 'btn btn-go', href: '#/konto/registrieren' }, t('Konto erstellen', 'Create account')),
            h('a', { class: 'btn btn-ghost', href: '#/konto' }, t('Einloggen', 'Log in')))]
        : h('p', {}, t('Konten und Freunde sind für diese Version noch nicht eingerichtet. Du kannst ganz normal weiterlernen.', 'Accounts and friends are not set up for this version yet. You can keep learning as usual.')))));
}

/* ---------------------------------------------------------------- Freunde-Seite */

function friendRow(p, unread = 0) {
  const s = p.summary || {};
  const joint = jointStreak(mySummary().recent, s.recent);
  const lang = s.active && s.langs?.[s.active] ? s.active : Object.keys(s.langs || {})[0];
  return h('li', { class: 'friend' },
    h('a', { class: 'friend-main', href: `#/nutzer/${p.username}` },
      h('span', { class: `friend-av${s.today ? ' is-today' : ''}` }, personAvatar(p, 52)),
      h('span', { class: 'friend-text' },
        h('b', {}, displayName(p), lang ? h('span', { class: 'friend-lang', html: langLogo(lang, 18) }) : null),
        h('small', {}, `@${p.username} · ${lastSeen(p)}`),
        h('small', { class: 'friend-act' }, activity(p)))),
    h('span', { class: 'friend-stats' },
      h('span', { class: 'chip-mini is-flame', title: t(`${p.streak} Tage in Folge`, `${p.streak} days in a row`) }, h('span', { html: solidIcon(p.streak > 0 ? 'flame' : 'flameCold', 18) }), p.streak),
      joint > 0 ? h('span', { class: 'chip-mini is-joint', title: t(`${joint} Tage habt ihr beide gelernt`, `${joint} days you both learned`) }, h('span', { html: solidIcon('heart', 18) }), joint) : null),
    h('span', { class: 'friend-actions' },
      h('a', { class: 'icon-btn has-badge', href: `#/chat/${p.username}`, 'aria-label': t(`Nachricht an ${displayName(p)}`, `Message ${displayName(p)}`), title: t('Nachricht', 'Message') },
        h('span', { html: icon('chat', 22) }), unread ? h('i', { class: 'badge-dot' }, unread) : null),
      h('button', { type: 'button', class: 'icon-btn', title: t('Anfeuern', 'Cheer on'), 'aria-label': t(`${displayName(p)} anfeuern`, `Cheer on ${displayName(p)}`), onclick: () => guard(() => cheer(p.id), t(`${displayName(p)} angefeuert`, `Cheered on ${displayName(p)}`)) },
        h('span', { html: solidIcon('bolt', 22) }))));
}

function leaderboard(friends) {
  const meP = { ...myProfile(), summary: mySummary(), xp: store.state.xp, isMe: true };
  const list = [meP, ...friends].sort((a, b) => (b.summary?.weekXp || 0) - (a.summary?.weekXp || 0));
  return h('section', { class: 'section' },
    h('h2', {}, t('Rangliste diese Woche', 'Leaderboard this week')),
    h('ol', { class: 'ranking' }, list.map((p, i) => h('li', { class: p.isMe ? 'is-me' : '' },
      h('span', { class: 'rank-no' }, i + 1),
      personAvatar(p, 36),
      h('span', { class: 'rank-name' }, p.isMe ? 'Du' : displayName(p)),
      h('b', {}, `${p.summary?.weekXp || 0} XP`)))),
    h('p', { class: 'muted social-note' }, t('XP der letzten 7 Tage. Wer am Sonntag vorne liegt, hat gewonnen.', 'XP of the last 7 days. Whoever leads on Sunday wins.')));
}

function searchBox(onChange) {
  const results = h('ul', { class: 'search-results' });
  const q = h('input', { class: 'text-input', type: 'search', placeholder: t('Benutzername suchen, z. B. mia_codet', 'Search username, e.g. mia_codet'), 'aria-label': t('Benutzername suchen', 'Search username'), autocapitalize: 'off', spellcheck: 'false' });
  let timer = null;
  q.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const text = q.value.trim();
      results.innerHTML = '';
      if (text.length < 2) return;
      try {
        const found = await searchPeople(text);
        if (!found.length) { results.append(h('li', { class: 'muted' }, t('Niemand gefunden.', 'Nobody found.'))); return; }
        for (const p of found) {
          const rel = await relationTo(p.id);
          const label = { none: t('Hinzufügen', 'Add'), incoming: t('Annehmen', 'Accept'), outgoing: t('Angefragt', 'Requested'), friends: t('Befreundet', 'Friends') }[rel];
          const btn = h('button', { type: 'button', class: `btn btn-small ${rel === 'none' || rel === 'incoming' ? 'btn-sky' : 'btn-ghost'}`, disabled: rel === 'outgoing' || rel === 'friends' }, label);
          btn.onclick = async () => {
            btn.disabled = true;
            if (await guard(() => addFriend(p.id), rel === 'incoming' ? t('Ihr seid jetzt Freunde', 'You\'re friends now') : t('Anfrage geschickt', 'Request sent'))) {
              btn.textContent = rel === 'incoming' ? t('Befreundet', 'Friends') : t('Angefragt', 'Requested');
              onChange();
            } else btn.disabled = false;
          };
          results.append(h('li', {},
            h('a', { class: 'search-person', href: `#/nutzer/${p.username}` }, personAvatar(p, 40), h('span', {}, h('b', {}, displayName(p)), h('small', {}, `@${p.username}`))),
            btn));
        }
      } catch (err) {
        results.append(h('li', { class: 'muted' }, germanError(err)));
      }
    }, 300);
  });
  return h('section', { class: 'section' },
    h('h2', {}, t('Freunde finden', 'Find friends')),
    q, results,
    h('p', { class: 'muted social-note' }, myProfile() ? t(`Dein Benutzername ist @${myProfile().username}. Den gibst du deinen Freunden.`, `Your username is @${myProfile().username}. Give it to your friends.`) : ''));
}

export async function renderFriends(main) {
  if (!CLOUD_ENABLED) { signedOut(main); return; }
  await initCloud();
  if (!currentUser()) { signedOut(main); return; }

  const page = h('div', { class: 'page' });
  main.append(page);
  page.append(h('header', { class: 'page-head' }, h('p', { class: 'eyebrow' }, t('Freunde', 'Friends')), h('h1', { class: 'display' }, t('Zusammen lernen', 'Learn together'))));
  const body = h('div');
  page.append(body);

  async function paint() {
    const wait = loading(body);
    let data;
    let convo = {};
    let nudges = [];
    try {
      [data, convo, nudges] = await Promise.all([loadFriends(), conversations(), unseenNudges()]);
    } catch (err) {
      wait.textContent = germanError(err);
      return;
    }
    body.innerHTML = '';

    if (nudges.length) {
      body.append(h('section', { class: 'section nudge-box' },
        h('h2', {}, t('Neu für dich', 'New for you')),
        h('ul', { class: 'nudges' }, nudges.map(n => h('li', {},
          personAvatar(n.from, 40),
          h('span', { class: 'nudge-text' }, nudgeText(n, displayName(n.from))),
          h('button', { type: 'button', class: 'btn btn-small btn-sky', onclick: e => { e.currentTarget.disabled = true; guard(() => cheer(n.from.id), t('Zurück angefeuert', 'Cheered back')); } }, t('Zurück anfeuern', 'Cheer back')))))));
      markNudgesSeen(nudges.map(n => n.id)).catch(() => {});
    }

    if (data.incoming.length) {
      body.append(h('section', { class: 'section' },
        h('h2', {}, t(`Anfragen (${data.incoming.length})`, `Requests (${data.incoming.length})`)),
        h('ul', { class: 'requests' }, data.incoming.map(p => h('li', {},
          h('a', { class: 'search-person', href: `#/nutzer/${p.username}` }, personAvatar(p, 44), h('span', {}, h('b', {}, displayName(p)), h('small', {}, `@${p.username} · ${activity(p)}`))),
          h('span', { class: 'row-actions' },
            h('button', { type: 'button', class: 'btn btn-small btn-go', onclick: async () => { if (await guard(() => acceptFriend(p.id), t(`Du bist jetzt mit ${displayName(p)} befreundet`, `You're now friends with ${displayName(p)}`))) repaint(); } }, t('Annehmen', 'Accept')),
            h('button', { type: 'button', class: 'btn btn-small btn-ghost', onclick: async () => { if (await guard(() => removeFriend(p.id))) repaint(); } }, t('Ablehnen', 'Decline'))))))));
    }

    body.append(groupsSection(data.friends.length > 0));

    const friends = data.friends.sort((a, b) => (b.summary?.today ? 1 : 0) - (a.summary?.today ? 1 : 0) || b.xp - a.xp);
    body.append(h('section', { class: 'section' },
      h('h2', {}, t(`Deine Freunde (${friends.length})`, `Your friends (${friends.length})`)),
      friends.length
        ? h('ul', { class: 'friends' }, friends.map(p => friendRow(p, convo[p.id]?.unread || 0)))
        : h('p', { class: 'muted' }, t('Noch keine Freunde. Such unten nach dem Benutzernamen deiner Kollegen.', 'No friends yet. Search for your friends\' usernames below.')),
      friends.length ? h('div', { class: 'row-actions social-share' },
        h('button', { type: 'button', class: 'btn btn-small', onclick: () => shareWithAll(friends) }, h('span', { html: solidIcon('flame', 18) }), t(`Serie an alle teilen (${currentStreak()} ${currentStreak() === 1 ? 'Tag' : 'Tage'})`, `Share streak with everyone (${currentStreak()} ${currentStreak() === 1 ? 'day' : 'days'})`))) : null));

    if (friends.length) body.append(leaderboard(friends));
    body.append(searchBox(repaint));

    if (data.outgoing.length) {
      body.append(h('section', { class: 'section' },
        h('h2', {}, t('Gesendete Anfragen', 'Sent requests')),
        h('ul', { class: 'requests' }, data.outgoing.map(p => h('li', {},
          h('a', { class: 'search-person', href: `#/nutzer/${p.username}` }, personAvatar(p, 40), h('span', {}, h('b', {}, displayName(p)), h('small', {}, `@${p.username}`))),
          h('button', { type: 'button', class: 'btn btn-small btn-ghost', onclick: async () => { if (await guard(() => removeFriend(p.id), t('Anfrage zurückgezogen', 'Request withdrawn'))) repaint(); } }, t('Zurückziehen', 'Withdraw')))))));
    }
    refreshCounts();
  }

  function repaint() {
    if (!document.body.contains(body)) return;
    body.innerHTML = '';
    paint();
  }

  const stop = onLive(kind => {
    if (!document.body.contains(body)) { stop(); return; }
    if (kind === 'friendship' || kind === 'message' || kind === 'group_message' || kind === 'group') repaint();
  });
  paint();
}

async function shareWithAll(friends) {
  let ok = 0;
  for (const f of friends) {
    try { await shareStreak(f.id); ok++; } catch { /* schon geschickt */ }
  }
  toast(ok ? t('Serie geteilt', 'Streak shared') : t('Schon geteilt', 'Already shared'), ok ? t(`${ok} ${ok === 1 ? 'Freund sieht' : 'Freunde sehen'} jetzt deine Serie: ${currentStreak()} ${currentStreak() === 1 ? 'Tag' : 'Tage'}.`, `${ok} ${ok === 1 ? 'friend now sees' : 'friends now see'} your streak: ${currentStreak()} ${currentStreak() === 1 ? 'day' : 'days'}.`) : t('Du kannst sie in einer Stunde wieder teilen.', 'You can share it again in an hour.'));
}

/* ---------------------------------------------------------------- Fremdes Profil */

function reportDialog(p, messageId = null) {
  return new Promise(resolve => {
    const reason = h('textarea', { class: 'text-input', rows: '3', maxlength: '500', placeholder: t('Was ist passiert?', 'What happened?') });
    let release = () => {};
    const dlg = h('dialog', { class: 'confirm' },
      h('h2', {}, t(`${displayName(p)} melden`, `Report ${displayName(p)}`)),
      h('p', { class: 'muted' }, t('Die Meldung sieht nur der Betreiber von Bitweg. Bei Beleidigungen oder Belästigung zusätzlich: blockieren und einem Erwachsenen Bescheid sagen.', 'Only the operator of Bitweg sees the report. For insults or harassment also: block them and tell an adult.')),
      reason,
      h('div', { class: 'row-actions' },
        h('button', { type: 'button', class: 'btn', onclick: () => close(false) }, t('Abbrechen', 'Cancel')),
        h('button', {
          type: 'button', class: 'btn btn-bad',
          onclick: async () => {
            if (!reason.value.trim()) { reason.focus(); return; }
            const ok = await guard(() => reportUser(p.id, reason.value.trim(), messageId), t('Gemeldet. Danke!', 'Reported. Thank you!'));
            if (ok) close(true);
          },
        }, t('Melden', 'Report'))));
    function close(v) { dlg.close(); release(); dlg.remove(); resolve(v); }
    dlg.addEventListener('cancel', e => { e.preventDefault(); close(false); });
    release = showModal(dlg);
    reason.focus();
  });
}

export async function renderUser(main, username) {
  if (!CLOUD_ENABLED) { signedOut(main); return; }
  await initCloud();
  if (!currentUser()) { signedOut(main); return; }
  if (username === myProfile()?.username) { location.replace('#/profil'); return; }
  const page = h('div', { class: 'page page-wide' });
  main.append(page);
  const wait = loading(page);
  let p;
  let rel;
  try {
    p = await profileByUsername(String(username || '').toLowerCase());
    if (p) rel = await relationTo(p.id);
  } catch (err) {
    wait.textContent = germanError(err);
    return;
  }
  wait.remove();
  if (!p) {
    page.append(h('section', { class: 'social-empty' }, h('div', { html: bit({ size: 110, mood: 'think' }) }), h('p', {}, t(`Kein Profil mit dem Namen @${username} gefunden.`, `No profile named @${username} found.`)), h('a', { class: 'btn btn-sky', href: '#/freunde' }, t('Zu den Freunden', 'Go to friends'))));
    return;
  }

  const s = p.summary || {};
  const lvl = levelInfo(p.xp || 0);
  const joint = jointStreak(mySummary().recent, s.recent);
  const banner = safeImg(p.banner);
  const actions = h('div', { class: 'row-actions prof-actions' });
  const rerender = () => { main.innerHTML = ''; renderUser(main, username); };

  if (rel === 'friends') {
    actions.append(
      h('a', { class: 'btn btn-go', href: `#/chat/${p.username}` }, h('span', { html: icon('chat', 18) }), t('Nachricht', 'Message')),
      h('button', { type: 'button', class: 'btn btn-sky', onclick: () => guard(() => cheer(p.id), t(`${displayName(p)} angefeuert`, `Cheered on ${displayName(p)}`)) }, h('span', { html: solidIcon('bolt', 18) }), t('Anfeuern', 'Cheer on')),
      h('button', { type: 'button', class: 'btn', onclick: () => guard(() => shareStreak(p.id), t('Serie geteilt', 'Streak shared')) }, h('span', { html: solidIcon('flame', 18) }), t('Serie teilen', 'Share streak')));
  } else if (rel === 'incoming') {
    actions.append(h('button', { type: 'button', class: 'btn btn-go', onclick: async () => { if (await guard(() => acceptFriend(p.id), t('Ihr seid jetzt Freunde', 'You\'re friends now'))) rerender(); } }, t('Anfrage annehmen', 'Accept request')));
  } else if (rel === 'outgoing') {
    actions.append(h('button', { type: 'button', class: 'btn btn-ghost', disabled: true }, t('Anfrage gesendet', 'Request sent')));
  } else {
    actions.append(h('button', { type: 'button', class: 'btn btn-sky', onclick: async () => { if (await guard(() => addFriend(p.id), t('Anfrage geschickt', 'Request sent'))) rerender(); } }, t('Als Freund hinzufügen', 'Add as friend')));
  }

  const more = h('div', { class: 'row-actions prof-more' },
    rel === 'friends' ? h('button', {
      type: 'button', class: 'btn btn-small btn-ghost',
      onclick: async () => {
        if (await confirmDialog({ title: t('Freundschaft beenden?', 'End friendship?'), text: t(`${displayName(p)} wird aus deiner Liste entfernt. Ihr könnt euch dann keine Nachrichten mehr schreiben.`, `${displayName(p)} will be removed from your list. You can't message each other any more.`), ok: t('Entfernen', 'Remove'), danger: true })
          && await guard(() => removeFriend(p.id), t('Entfernt', 'Removed'))) rerender();
      },
    }, t('Freund entfernen', 'Remove friend')) : null,
    h('button', {
      type: 'button', class: 'btn btn-small btn-ghost',
      onclick: async () => {
        if (await confirmDialog({ title: t(`${displayName(p)} blockieren?`, `Block ${displayName(p)}?`), text: t('Ihr seht euch dann gegenseitig nicht mehr, könnt euch nicht schreiben und keine Anfragen schicken. Aufheben geht im Profil unter „Konto“.', 'You won\'t see each other any more, can\'t message each other or send requests. You can undo this in your profile under “Account”.'), ok: t('Blockieren', 'Block'), danger: true })
          && await guard(() => blockUser(p.id), t('Blockiert', 'Blocked'))) location.hash = '#/freunde';
      },
    }, t('Blockieren', 'Block')),
    h('button', { type: 'button', class: 'btn btn-small btn-ghost', onclick: () => reportDialog(p) }, t('Melden', 'Report')));

  const langs = Object.entries(s.langs || {});
  page.append(
    h('section', { class: 'prof-card' },
      h('div', { class: 'prof-banner', style: banner ? { backgroundImage: `url("${banner}")` } : null }, banner ? null : h('span', { class: 'prof-banner-empty' }, '')),
      h('div', { class: 'prof-body' },
        h('div', { class: 'prof-avatar' }, personAvatar(p, 128)),
        h('div', { class: 'prof-id' },
          h('h1', {}, displayName(p)),
          h('p', { class: 'prof-user' }, `@${p.username}`),
          h('p', { class: 'prof-joined' }, t(`${lastSeen(p)} · dabei seit ${new Date(p.created_at || Date.now()).toLocaleDateString(locale(), { month: 'long', year: 'numeric' })}`, `${lastSeen(p)} · joined ${new Date(p.created_at || Date.now()).toLocaleDateString(locale(), { month: 'long', year: 'numeric' })}`)),
          p.bio ? h('p', { class: 'prof-bio' }, p.bio) : null,
          h('div', { class: 'prof-courses' }, langs.map(([l]) => h('span', { class: 'prof-course', title: COURSES[l]?.name, html: langLogo(l, 30) })))),
        actions),
      h('div', { class: 'prof-stats' },
        h('div', {}, h('span', { html: solidIcon(p.streak > 0 ? 'flame' : 'flameCold', 30) }), h('b', {}, p.streak), h('small', {}, t('Tage in Folge', 'day streak'))),
        h('div', {}, h('span', { html: solidIcon('bolt', 30) }), h('b', {}, p.xp), h('small', {}, 'XP gesamt')),
        h('div', {}, h('span', { html: solidIcon('trophy', 30) }), h('b', {}, lvl.level), h('small', {}, t('Stufe', 'Level'))),
        rel === 'friends'
          ? h('div', {}, h('span', { html: solidIcon('heart', 30) }), h('b', {}, joint), h('small', {}, t('gemeinsame Tage', 'days together')))
          : h('div', {}, h('span', { html: solidIcon('quest', 30) }), h('b', {}, s.badges || 0), h('small', {}, t('Abzeichen', 'Badges'))))),
    h('section', { class: 'section' },
      h('h2', {}, t('Lernt gerade', 'Currently learning')),
      langs.length
        ? h('div', { class: 'course-cards' }, langs.map(([l, v]) => h('div', { class: `course-card${s.active === l ? ' is-active' : ''}` },
          h('span', { html: langLogo(l, 40) }),
          h('div', {},
            h('b', {}, COURSES[l]?.name || l),
            h('p', {}, t(`Abschnitt ${v.unit} von ${v.units}: ${v.unitTitle}`, `Unit ${v.unit} of ${v.units}: ${v.unitTitle}`)),
            h('div', { class: 'qbar is-accent' }, h('span', { style: { width: `${Math.round((v.done / Math.max(1, v.total)) * 100)}%` } }), h('b', {}, t(`${v.done} / ${v.total} Lektionen`, `${v.done} / ${v.total} lessons`))),
            h('small', { class: 'muted' }, `${v.xp} XP${v.gold ? ` · ${v.gold} ${t('Gold-Lektionen', 'gold lessons')}` : ''}${v.goldUnits ? ` · ${v.goldUnits} ${t('goldene Abschnitte', 'gold units')}` : ''}`)))))
        : h('p', { class: 'muted' }, t('Noch kein Kurs angefangen.', 'No course started yet.')),
      h('p', { class: 'muted social-note' }, t(`Diese Woche ${s.weekXp || 0} XP · längste Serie ${s.best || 0} Tage`, `This week ${s.weekXp || 0} XP · longest streak ${s.best || 0} days`))),
    more);
}

/* ---------------------------------------------------------------- Nachrichten */

export async function renderChat(main, username) {
  if (!CLOUD_ENABLED) { signedOut(main); return; }
  await initCloud();
  if (!currentUser()) { signedOut(main); return; }
  const page = h('div', { class: 'page chat-page' });
  main.append(page);
  const wait = loading(page);
  let p;
  let rel;
  try {
    p = await profileByUsername(String(username || '').toLowerCase());
    if (p) rel = await relationTo(p.id);
  } catch (err) {
    wait.textContent = germanError(err);
    return;
  }
  wait.remove();
  if (!p) { page.append(h('p', { class: 'muted' }, t('Diese Person gibt es nicht.', 'This person doesn\'t exist.'))); return; }

  const friends = rel === 'friends';
  const box = chatBox({
    meId: currentUser().id,
    canWrite: friends,
    placeholder: t('Nachricht schreiben', 'Write a message'),
    lockedText: t('Nur unter Freunden möglich', 'Only possible between friends'),
    send: body => sendMessage(p.id, body),
    sendFile: (file, body) => sendAttachment(p.id, file, body),
    onReport: m => reportDialog(p, m.id),
  });

  page.append(
    h('header', { class: 'chat-head' },
      h('a', { class: 'icon-btn', href: '#/freunde', 'aria-label': t('Zurück zu den Freunden', 'Back to friends'), html: icon('back', 22) }),
      h('a', { class: 'search-person', href: `#/nutzer/${p.username}` }, personAvatar(p, 44), h('span', {}, h('b', {}, displayName(p)), h('small', {}, `@${p.username} · ${activity(p)}`))),
      friends ? h('button', { type: 'button', class: 'icon-btn', title: t('Anfeuern', 'Cheer on'), 'aria-label': t('Anfeuern', 'Cheer on'), onclick: () => guard(() => cheer(p.id), t(`${displayName(p)} angefeuert`, `Cheered on ${displayName(p)}`)), html: solidIcon('bolt', 22) }) : null),
    box.list,
    box.form,
    h('p', { class: 'muted social-note' }, t('Nachrichten sehen nur ihr beide. Sei nett. Wenn dich jemand belästigt: melden, blockieren und einem Erwachsenen Bescheid sagen.', 'Only you two can see the messages. Be nice. If someone harasses you: report, block and tell an adult.')));

  try {
    (await loadThread(p.id)).forEach(m => box.add(m));
    box.empty(friends ? t('Noch keine Nachrichten. Schreib als Erstes!', 'No messages yet. Write first!') : t('Ihr müsst befreundet sein, um euch zu schreiben.', 'You need to be friends to message each other.'));
    box.toBottom();
    markThreadRead(p.id).catch(() => {});
  } catch (err) {
    box.error(germanError(err));
  }
  const stop = onLive((kind, row) => {
    if (!document.body.contains(box.list)) { stop(); return; }
    if (kind === 'message' && row.sender === p.id) {
      box.add(row, { live: true });
      markThreadRead(p.id).catch(() => {});
    }
  });
  box.focus();
}
