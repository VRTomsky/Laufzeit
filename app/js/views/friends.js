// Freunde: Anfragen, Suche, Liste mit Fortschritt, Rangliste, Anfeuern,
// fremde Profile (#/nutzer/name) und Nachrichten (#/chat/name)

import { h, toast, confirmDialog, showModal } from '../util.js';
import { icon, solidIcon, langLogo } from '../icons.js';
import { bit } from '../mascot.js';
import { store } from '../store.js';
import { COURSES } from '../content/index.js';
import { levelInfo, currentStreak } from '../gamification.js';
import {
  CLOUD_ENABLED, initCloud, currentUser, myProfile, safeImg, germanError, buildSummary, jointStreak,
  loadFriends, searchPeople, profileByUsername, relationTo, addFriend, acceptFriend, removeFriend,
  blockUser, reportUser, loadThread, sendMessage, markThreadRead, conversations,
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
  if (!lang) return 'Hat noch nicht angefangen';
  const l = s.langs[lang];
  return `${COURSES[lang]?.name || lang} · Abschnitt ${l.unit}: ${l.unitTitle}`;
}

function lastSeen(p) {
  if (p.summary?.today || p.last_active === new Date().toISOString().slice(0, 10)) return 'heute gelernt';
  if (!p.last_active) return 'noch nie gelernt';
  const days = Math.round((Date.now() - Date.parse(p.last_active)) / 864e5);
  return days <= 1 ? 'gestern gelernt' : `zuletzt vor ${days} Tagen`;
}

const mySummary = () => buildSummary(store.state);

async function guard(fn, okMsg) {
  try {
    await fn();
    if (okMsg) toast(okMsg);
    return true;
  } catch (err) {
    toast('Hat nicht geklappt', germanError(err));
    return false;
  }
}

function loading(main, text = 'Lädt ...') {
  const el = h('p', { class: 'muted social-loading' }, text);
  main.append(el);
  return el;
}

/** Seite fuer Nicht-Eingeloggte */
function signedOut(main) {
  main.append(h('div', { class: 'page' },
    h('header', { class: 'page-head' }, h('p', { class: 'eyebrow' }, 'Freunde'), h('h1', { class: 'display' }, 'Zusammen lernen')),
    h('section', { class: 'social-empty' },
      h('div', { html: bit({ size: 120, mood: 'wave' }) }),
      CLOUD_ENABLED
        ? [h('p', {}, 'Mit einem Konto siehst du, was deine Freunde gerade lernen, schreibst ihnen Nachrichten und feuerst sie an. Dein Fortschritt ist dann auf jedem Gerät da.'),
          h('div', { class: 'row-actions' },
            h('a', { class: 'btn btn-go', href: '#/konto/registrieren' }, 'Konto erstellen'),
            h('a', { class: 'btn btn-ghost', href: '#/konto' }, 'Einloggen'))]
        : h('p', {}, 'Konten und Freunde sind für diese Version noch nicht eingerichtet. Du kannst ganz normal weiterlernen.'))));
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
      h('span', { class: 'chip-mini is-flame', title: `${p.streak} Tage in Folge` }, h('span', { html: solidIcon(p.streak > 0 ? 'flame' : 'flameCold', 18) }), p.streak),
      joint > 0 ? h('span', { class: 'chip-mini is-joint', title: `${joint} Tage habt ihr beide gelernt` }, h('span', { html: solidIcon('heart', 18) }), joint) : null),
    h('span', { class: 'friend-actions' },
      h('a', { class: 'icon-btn has-badge', href: `#/chat/${p.username}`, 'aria-label': `Nachricht an ${displayName(p)}`, title: 'Nachricht' },
        h('span', { html: icon('chat', 22) }), unread ? h('i', { class: 'badge-dot' }, unread) : null),
      h('button', { type: 'button', class: 'icon-btn', title: 'Anfeuern', 'aria-label': `${displayName(p)} anfeuern`, onclick: () => guard(() => cheer(p.id), `${displayName(p)} angefeuert`) },
        h('span', { html: solidIcon('bolt', 22) }))));
}

function leaderboard(friends) {
  const meP = { ...myProfile(), summary: mySummary(), xp: store.state.xp, isMe: true };
  const list = [meP, ...friends].sort((a, b) => (b.summary?.weekXp || 0) - (a.summary?.weekXp || 0));
  return h('section', { class: 'section' },
    h('h2', {}, 'Rangliste diese Woche'),
    h('ol', { class: 'ranking' }, list.map((p, i) => h('li', { class: p.isMe ? 'is-me' : '' },
      h('span', { class: 'rank-no' }, i + 1),
      personAvatar(p, 36),
      h('span', { class: 'rank-name' }, p.isMe ? 'Du' : displayName(p)),
      h('b', {}, `${p.summary?.weekXp || 0} XP`)))),
    h('p', { class: 'muted social-note' }, 'XP der letzten 7 Tage. Wer am Sonntag vorne liegt, hat gewonnen.'));
}

function searchBox(onChange) {
  const results = h('ul', { class: 'search-results' });
  const q = h('input', { class: 'text-input', type: 'search', placeholder: 'Benutzername suchen, z. B. mia_codet', 'aria-label': 'Benutzername suchen', autocapitalize: 'off', spellcheck: 'false' });
  let timer = null;
  q.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const text = q.value.trim();
      results.innerHTML = '';
      if (text.length < 2) return;
      try {
        const found = await searchPeople(text);
        if (!found.length) { results.append(h('li', { class: 'muted' }, 'Niemand gefunden.')); return; }
        for (const p of found) {
          const rel = await relationTo(p.id);
          const label = { none: 'Hinzufügen', incoming: 'Annehmen', outgoing: 'Angefragt', friends: 'Befreundet' }[rel];
          const btn = h('button', { type: 'button', class: `btn btn-small ${rel === 'none' || rel === 'incoming' ? 'btn-sky' : 'btn-ghost'}`, disabled: rel === 'outgoing' || rel === 'friends' }, label);
          btn.onclick = async () => {
            btn.disabled = true;
            if (await guard(() => addFriend(p.id), rel === 'incoming' ? 'Ihr seid jetzt Freunde' : 'Anfrage geschickt')) {
              btn.textContent = rel === 'incoming' ? 'Befreundet' : 'Angefragt';
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
    h('h2', {}, 'Freunde finden'),
    q, results,
    h('p', { class: 'muted social-note' }, myProfile() ? `Dein Benutzername ist @${myProfile().username}. Den gibst du deinen Freunden.` : ''));
}

export async function renderFriends(main) {
  if (!CLOUD_ENABLED) { signedOut(main); return; }
  await initCloud();
  if (!currentUser()) { signedOut(main); return; }

  const page = h('div', { class: 'page' });
  main.append(page);
  page.append(h('header', { class: 'page-head' }, h('p', { class: 'eyebrow' }, 'Freunde'), h('h1', { class: 'display' }, 'Zusammen lernen')));
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
        h('h2', {}, 'Neu für dich'),
        h('ul', { class: 'nudges' }, nudges.map(n => h('li', {},
          personAvatar(n.from, 40),
          h('span', { class: 'nudge-text' }, nudgeText(n, displayName(n.from))),
          h('button', { type: 'button', class: 'btn btn-small btn-sky', onclick: e => { e.currentTarget.disabled = true; guard(() => cheer(n.from.id), 'Zurück angefeuert'); } }, 'Zurück anfeuern'))))));
      markNudgesSeen(nudges.map(n => n.id)).catch(() => {});
    }

    if (data.incoming.length) {
      body.append(h('section', { class: 'section' },
        h('h2', {}, `Anfragen (${data.incoming.length})`),
        h('ul', { class: 'requests' }, data.incoming.map(p => h('li', {},
          h('a', { class: 'search-person', href: `#/nutzer/${p.username}` }, personAvatar(p, 44), h('span', {}, h('b', {}, displayName(p)), h('small', {}, `@${p.username} · ${activity(p)}`))),
          h('span', { class: 'row-actions' },
            h('button', { type: 'button', class: 'btn btn-small btn-go', onclick: async () => { if (await guard(() => acceptFriend(p.id), `Du bist jetzt mit ${displayName(p)} befreundet`)) repaint(); } }, 'Annehmen'),
            h('button', { type: 'button', class: 'btn btn-small btn-ghost', onclick: async () => { if (await guard(() => removeFriend(p.id))) repaint(); } }, 'Ablehnen')))))));
    }

    const friends = data.friends.sort((a, b) => (b.summary?.today ? 1 : 0) - (a.summary?.today ? 1 : 0) || b.xp - a.xp);
    body.append(h('section', { class: 'section' },
      h('h2', {}, `Deine Freunde (${friends.length})`),
      friends.length
        ? h('ul', { class: 'friends' }, friends.map(p => friendRow(p, convo[p.id]?.unread || 0)))
        : h('p', { class: 'muted' }, 'Noch keine Freunde. Such unten nach dem Benutzernamen deiner Kollegen.'),
      friends.length ? h('div', { class: 'row-actions social-share' },
        h('button', { type: 'button', class: 'btn btn-small', onclick: () => shareWithAll(friends) }, h('span', { html: solidIcon('flame', 18) }), `Serie an alle teilen (${currentStreak()} ${currentStreak() === 1 ? 'Tag' : 'Tage'})`)) : null));

    if (friends.length) body.append(leaderboard(friends));
    body.append(searchBox(repaint));

    if (data.outgoing.length) {
      body.append(h('section', { class: 'section' },
        h('h2', {}, 'Gesendete Anfragen'),
        h('ul', { class: 'requests' }, data.outgoing.map(p => h('li', {},
          h('a', { class: 'search-person', href: `#/nutzer/${p.username}` }, personAvatar(p, 40), h('span', {}, h('b', {}, displayName(p)), h('small', {}, `@${p.username}`))),
          h('button', { type: 'button', class: 'btn btn-small btn-ghost', onclick: async () => { if (await guard(() => removeFriend(p.id), 'Anfrage zurückgezogen')) repaint(); } }, 'Zurückziehen'))))));
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
    if (kind === 'friendship' || kind === 'message') repaint();
  });
  paint();
}

async function shareWithAll(friends) {
  let ok = 0;
  for (const f of friends) {
    try { await shareStreak(f.id); ok++; } catch { /* schon geschickt */ }
  }
  toast(ok ? 'Serie geteilt' : 'Schon geteilt', ok ? `${ok} ${ok === 1 ? 'Freund sieht' : 'Freunde sehen'} jetzt deine Serie: ${currentStreak()} ${currentStreak() === 1 ? 'Tag' : 'Tage'}.` : 'Du kannst sie in einer Stunde wieder teilen.');
}

/* ---------------------------------------------------------------- Fremdes Profil */

function reportDialog(p, messageId = null) {
  return new Promise(resolve => {
    const reason = h('textarea', { class: 'text-input', rows: '3', maxlength: '500', placeholder: 'Was ist passiert?' });
    let release = () => {};
    const dlg = h('dialog', { class: 'confirm' },
      h('h2', {}, `${displayName(p)} melden`),
      h('p', { class: 'muted' }, 'Die Meldung sieht nur der Betreiber von Laufzeit. Bei Beleidigungen oder Belästigung zusätzlich: blockieren und einem Erwachsenen Bescheid sagen.'),
      reason,
      h('div', { class: 'row-actions' },
        h('button', { type: 'button', class: 'btn', onclick: () => close(false) }, 'Abbrechen'),
        h('button', {
          type: 'button', class: 'btn btn-bad',
          onclick: async () => {
            if (!reason.value.trim()) { reason.focus(); return; }
            const ok = await guard(() => reportUser(p.id, reason.value.trim(), messageId), 'Gemeldet. Danke!');
            if (ok) close(true);
          },
        }, 'Melden')));
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
    page.append(h('section', { class: 'social-empty' }, h('div', { html: bit({ size: 110, mood: 'think' }) }), h('p', {}, `Kein Profil mit dem Namen @${username} gefunden.`), h('a', { class: 'btn btn-sky', href: '#/freunde' }, 'Zu den Freunden')));
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
      h('a', { class: 'btn btn-go', href: `#/chat/${p.username}` }, h('span', { html: icon('chat', 18) }), 'Nachricht'),
      h('button', { type: 'button', class: 'btn btn-sky', onclick: () => guard(() => cheer(p.id), `${displayName(p)} angefeuert`) }, h('span', { html: solidIcon('bolt', 18) }), 'Anfeuern'),
      h('button', { type: 'button', class: 'btn', onclick: () => guard(() => shareStreak(p.id), 'Serie geteilt') }, h('span', { html: solidIcon('flame', 18) }), 'Serie teilen'));
  } else if (rel === 'incoming') {
    actions.append(h('button', { type: 'button', class: 'btn btn-go', onclick: async () => { if (await guard(() => acceptFriend(p.id), 'Ihr seid jetzt Freunde')) rerender(); } }, 'Anfrage annehmen'));
  } else if (rel === 'outgoing') {
    actions.append(h('button', { type: 'button', class: 'btn btn-ghost', disabled: true }, 'Anfrage gesendet'));
  } else {
    actions.append(h('button', { type: 'button', class: 'btn btn-sky', onclick: async () => { if (await guard(() => addFriend(p.id), 'Anfrage geschickt')) rerender(); } }, 'Als Freund hinzufügen'));
  }

  const more = h('div', { class: 'row-actions prof-more' },
    rel === 'friends' ? h('button', {
      type: 'button', class: 'btn btn-small btn-ghost',
      onclick: async () => {
        if (await confirmDialog({ title: 'Freundschaft beenden?', text: `${displayName(p)} wird aus deiner Liste entfernt. Ihr könnt euch dann keine Nachrichten mehr schreiben.`, ok: 'Entfernen', danger: true })
          && await guard(() => removeFriend(p.id), 'Entfernt')) rerender();
      },
    }, 'Freund entfernen') : null,
    h('button', {
      type: 'button', class: 'btn btn-small btn-ghost',
      onclick: async () => {
        if (await confirmDialog({ title: `${displayName(p)} blockieren?`, text: 'Ihr seht euch dann gegenseitig nicht mehr, könnt euch nicht schreiben und keine Anfragen schicken. Aufheben geht im Profil unter „Konto“.', ok: 'Blockieren', danger: true })
          && await guard(() => blockUser(p.id), 'Blockiert')) location.hash = '#/freunde';
      },
    }, 'Blockieren'),
    h('button', { type: 'button', class: 'btn btn-small btn-ghost', onclick: () => reportDialog(p) }, 'Melden'));

  const langs = Object.entries(s.langs || {});
  page.append(
    h('section', { class: 'prof-card' },
      h('div', { class: 'prof-banner', style: banner ? { backgroundImage: `url("${banner}")` } : null }, banner ? null : h('span', { class: 'prof-banner-empty' }, '')),
      h('div', { class: 'prof-body' },
        h('div', { class: 'prof-avatar' }, personAvatar(p, 128)),
        h('div', { class: 'prof-id' },
          h('h1', {}, displayName(p)),
          h('p', { class: 'prof-user' }, `@${p.username}`),
          h('p', { class: 'prof-joined' }, `${lastSeen(p)} · dabei seit ${new Date(p.created_at || Date.now()).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}`),
          p.bio ? h('p', { class: 'prof-bio' }, p.bio) : null,
          h('div', { class: 'prof-courses' }, langs.map(([l]) => h('span', { class: 'prof-course', title: COURSES[l]?.name, html: langLogo(l, 30) })))),
        actions),
      h('div', { class: 'prof-stats' },
        h('div', {}, h('span', { html: solidIcon(p.streak > 0 ? 'flame' : 'flameCold', 30) }), h('b', {}, p.streak), h('small', {}, 'Tage in Folge')),
        h('div', {}, h('span', { html: solidIcon('bolt', 30) }), h('b', {}, p.xp), h('small', {}, 'XP gesamt')),
        h('div', {}, h('span', { html: solidIcon('trophy', 30) }), h('b', {}, lvl.level), h('small', {}, 'Stufe')),
        rel === 'friends'
          ? h('div', {}, h('span', { html: solidIcon('heart', 30) }), h('b', {}, joint), h('small', {}, 'gemeinsame Tage'))
          : h('div', {}, h('span', { html: solidIcon('quest', 30) }), h('b', {}, s.badges || 0), h('small', {}, 'Abzeichen')))),
    h('section', { class: 'section' },
      h('h2', {}, 'Lernt gerade'),
      langs.length
        ? h('div', { class: 'course-cards' }, langs.map(([l, v]) => h('div', { class: `course-card${s.active === l ? ' is-active' : ''}` },
          h('span', { html: langLogo(l, 40) }),
          h('div', {},
            h('b', {}, COURSES[l]?.name || l),
            h('p', {}, `Abschnitt ${v.unit} von ${v.units}: ${v.unitTitle}`),
            h('div', { class: 'qbar is-accent' }, h('span', { style: { width: `${Math.round((v.done / Math.max(1, v.total)) * 100)}%` } }), h('b', {}, `${v.done} / ${v.total} Lektionen`)),
            h('small', { class: 'muted' }, `${v.xp} XP${v.gold ? ` · ${v.gold} Gold-Lektionen` : ''}${v.goldUnits ? ` · ${v.goldUnits} goldene Abschnitte` : ''}`)))))
        : h('p', { class: 'muted' }, 'Noch kein Kurs angefangen.'),
      h('p', { class: 'muted social-note' }, `Diese Woche ${s.weekXp || 0} XP · längste Serie ${s.best || 0} Tage`)),
    more);
}

/* ---------------------------------------------------------------- Nachrichten */

function timeText(iso) {
  const d = new Date(iso);
  const today = d.toDateString() === new Date().toDateString();
  return today ? d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : d.toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

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
  if (!p) { page.append(h('p', { class: 'muted' }, 'Diese Person gibt es nicht.')); return; }

  const list = h('ol', { class: 'chat-list', 'aria-live': 'polite' });
  const seen = new Set();
  const meId = currentUser().id;

  function addMsg(m) {
    if (seen.has(m.id)) return;
    seen.add(m.id);
    const mine = m.sender === meId;
    list.append(h('li', { class: `msg${mine ? ' is-mine' : ''}` },
      h('p', {}, m.body),
      h('small', {}, timeText(m.created_at),
        mine ? null : h('button', { type: 'button', class: 'msg-report', title: 'Nachricht melden', onclick: () => reportDialog(p, m.id) }, 'melden'))));
  }
  const scroll = () => { list.scrollTop = list.scrollHeight; };

  const text = h('textarea', { class: 'text-input chat-input', rows: '1', maxlength: '1000', placeholder: rel === 'friends' ? `Nachricht an ${displayName(p)}` : 'Nur unter Freunden möglich', disabled: rel !== 'friends', 'aria-label': 'Nachricht' });
  const sendBtn = h('button', { type: 'submit', class: 'btn btn-go', disabled: rel !== 'friends' }, 'Senden');
  async function send(e) {
    e?.preventDefault();
    const body = text.value.trim();
    if (!body) return;
    sendBtn.disabled = true;
    try {
      const m = await sendMessage(p.id, body);
      text.value = '';
      addMsg(m);
      scroll();
    } catch (err) {
      toast('Nicht gesendet', germanError(err));
    }
    sendBtn.disabled = false;
    text.focus();
  }
  text.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) send(e); });

  page.append(
    h('header', { class: 'chat-head' },
      h('a', { class: 'icon-btn', href: '#/freunde', 'aria-label': 'Zurück zu den Freunden', html: icon('back', 22) }),
      h('a', { class: 'search-person', href: `#/nutzer/${p.username}` }, personAvatar(p, 44), h('span', {}, h('b', {}, displayName(p)), h('small', {}, `@${p.username} · ${activity(p)}`))),
      rel === 'friends' ? h('button', { type: 'button', class: 'icon-btn', title: 'Anfeuern', 'aria-label': 'Anfeuern', onclick: () => guard(() => cheer(p.id), `${displayName(p)} angefeuert`), html: solidIcon('bolt', 22) }) : null),
    list,
    h('form', { class: 'chat-form', onsubmit: send }, text, sendBtn),
    h('p', { class: 'muted social-note' }, 'Nachrichten sehen nur ihr beide. Sei nett. Wenn dich jemand belästigt: melden, blockieren und einem Erwachsenen Bescheid sagen.'));

  try {
    (await loadThread(p.id)).forEach(addMsg);
    if (!list.children.length) list.append(h('li', { class: 'chat-empty muted' }, rel === 'friends' ? 'Noch keine Nachrichten. Schreib als Erstes!' : 'Ihr müsst befreundet sein, um euch zu schreiben.'));
    scroll();
    markThreadRead(p.id).catch(() => {});
  } catch (err) {
    list.append(h('li', { class: 'muted' }, germanError(err)));
  }
  const stop = onLive((kind, row) => {
    if (!document.body.contains(list)) { stop(); return; }
    if (kind === 'message' && row.sender === p.id) {
      list.querySelector('.chat-empty')?.remove();
      addMsg(row);
      scroll();
      markThreadRead(p.id).catch(() => {});
    }
  });
  text.focus();
}
