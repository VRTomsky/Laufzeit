// Gruppenchats: Liste auf der Freunde-Seite, Gruppe anlegen, Gruppenchat, Mitglieder verwalten

import { t } from '../i18n.js';
import { h, toast, confirmDialog, showModal } from '../util.js';
import { icon } from '../icons.js';
import { bit } from '../mascot.js';
import { chatBox, timeText } from './chatbox.js';
import { personAvatar } from './friends.js';
import { imagePicker, pasteImagesInto } from '../imagepick.js';
import {
  CLOUD_ENABLED, initCloud, currentUser, germanError, loadFriends, onLive,
  groupsAvailable, groupProfileAvailable, loadGroups, groupUnread, createGroup, groupDetails, addGroupMembers,
  removeGroupMember, leaveGroup, updateGroupProfile, setGroupRole, loadGroupThread, sendGroupMessage, sendGroupAttachment, markGroupRead,
} from '../cloud.js';

const displayName = p => p?.name || `@${p?.username}`;

/** Bis zu drei Profilbilder uebereinander als Gruppenbild */
function groupAvatar(profiles, size = 48) {
  const shown = profiles.slice(0, 3);
  return h('span', { class: 'group-av', style: { width: `${size}px`, height: `${size}px` } },
    shown.length ? shown.map((p, i) => h('span', { class: `group-av-${i}` }, personAvatar(p, Math.round(size * 0.62)))) : h('span', { html: bit({ size: Math.round(size * 0.7) }) }));
}

/** Eigenes Gruppenbild, sonst die Profilbilder der Mitglieder */
function groupPicture(info, others, size) {
  return info.avatar
    ? h('img', { class: 'group-pic', src: info.avatar, alt: '', width: size, height: size, style: { width: `${size}px`, height: `${size}px` } })
    : groupAvatar(others, size);
}

const NOT_READY = () => t('Gruppenchats sind noch nicht eingerichtet. Der Betreiber muss dafür supabase/03-gruppen.sql ausführen.', 'Group chats are not set up yet. The operator has to run supabase/03-gruppen.sql.');

/* ---------------------------------------------------------------- Neue Gruppe */

function pickFriends(friends, preselected = []) {
  const chosen = new Set(preselected);
  const list = h('ul', { class: 'pick-list' }, friends.map(p => {
    const box = h('input', { type: 'checkbox', checked: chosen.has(p.id) ? true : null });
    box.addEventListener('change', () => { if (box.checked) chosen.add(p.id); else chosen.delete(p.id); });
    return h('li', {}, h('label', { class: 'pick-row' }, box, personAvatar(p, 36), h('span', {}, h('b', {}, displayName(p)), h('small', {}, `@${p.username}`))));
  }));
  return { list, chosen };
}

export async function openNewGroupDialog(onCreated) {
  let friends = [];
  try { friends = (await loadFriends()).friends; } catch (err) { toast(t('Hat nicht geklappt', 'That didn\'t work'), germanError(err)); return; }
  if (!friends.length) { toast(t('Erst Freunde hinzufügen', 'Add friends first'), t('In eine Gruppe kannst du nur Freunde einladen.', 'You can only invite friends to a group.')); return; }
  const name = h('input', { class: 'text-input', maxlength: '40', placeholder: t('z. B. Python-Crew', 'e.g. Python crew') });
  const pick = pickFriends(friends);
  const err = h('p', { class: 'auth-error', hidden: true });
  let release = () => {};
  const create = h('button', { type: 'button', class: 'btn btn-go' }, t('Gruppe erstellen', 'Create group'));
  const dlg = h('dialog', { class: 'confirm group-dialog' },
    h('h2', {}, t('Neue Gruppe', 'New group')),
    h('label', { class: 'field' }, h('span', {}, t('Name der Gruppe', 'Group name')), name),
    h('div', { class: 'field' }, h('span', {}, t('Freunde einladen', 'Invite friends')), pick.list),
    err,
    h('div', { class: 'row-actions' }, h('button', { type: 'button', class: 'btn', onclick: () => close() }, t('Abbrechen', 'Cancel')), create));
  function close() { dlg.close(); release(); dlg.remove(); }
  create.onclick = async () => {
    err.hidden = true;
    if (!name.value.trim()) { err.hidden = false; err.textContent = t('Gib der Gruppe einen Namen.', 'Give the group a name.'); name.focus(); return; }
    if (!pick.chosen.size) { err.hidden = false; err.textContent = t('Wähl mindestens einen Freund aus.', 'Pick at least one friend.'); return; }
    create.disabled = true;
    try {
      const g = await createGroup(name.value, [...pick.chosen]);
      close();
      onCreated?.(g);
    } catch (e) {
      create.disabled = false;
      err.hidden = false;
      err.textContent = germanError(e);
    }
  };
  dlg.addEventListener('cancel', e => { e.preventDefault(); close(); });
  release = showModal(dlg);
  name.focus();
}

/* ---------------------------------------------------------------- Liste auf der Freunde-Seite */

export function groupsSection(hasFriends) {
  const list = h('ul', { class: 'group-list' }, h('li', { class: 'muted' }, t('Lädt ...', 'Loading ...')));
  const newBtn = h('button', { type: 'button', class: 'btn btn-small btn-sky', onclick: () => openNewGroupDialog(g => { location.hash = `#/gruppe/${g.id}`; }) },
    h('span', { html: icon('chat', 16) }), t('Neue Gruppe', 'New group'));
  const sec = h('section', { class: 'section' },
    h('div', { class: 'section-head' }, h('h2', {}, t('Gruppen', 'Groups')), hasFriends ? newBtn : null),
    list);
  (async () => {
    let groups = [];
    try { groups = await loadGroups(); } catch (err) { list.replaceChildren(h('li', { class: 'muted' }, germanError(err))); return; }
    list.innerHTML = '';
    if (!groupsAvailable()) { list.append(h('li', { class: 'muted' }, NOT_READY())); newBtn.disabled = true; return; }
    if (!groups.length) {
      list.append(h('li', { class: 'muted' }, hasFriends
        ? t('Noch keine Gruppe. Mach eine für dich und deine Kollegen auf, dann könnt ihr zusammen schreiben und Bilder teilen.', 'No group yet. Start one for you and your friends, then you can chat and share images together.')
        : t('Sobald du Freunde hast, kannst du Gruppen mit ihnen machen.', 'As soon as you have friends, you can make groups with them.')));
      return;
    }
    for (const g of groups) {
      const last = g.messages?.[0];
      const unread = groupUnread(g);
      const preview = last ? (last.body || (last.attachment ? (/^image\//.test(last.attachment.type) ? t('Bild', 'Image') : last.attachment.name) : '')) : t('Noch keine Nachrichten', 'No messages yet');
      list.append(h('li', {},
        h('a', { class: `group-row${unread ? ' is-unread' : ''}`, href: `#/gruppe/${g.id}` },
          g.avatar ? h('img', { class: 'group-pic', src: g.avatar, alt: '', width: 44, height: 44 }) : h('span', { class: 'group-icon', html: icon('chat', 22) }),
          h('span', { class: 'group-text' }, h('b', {}, g.name), h('small', {}, preview)),
          h('span', { class: 'group-meta' }, last ? h('small', {}, timeText(last.created_at)) : null, unread ? h('i', { class: 'badge-dot is-inline' }, unread > 9 ? '9+' : unread) : null))));
    }
  })();
  return sec;
}

/* ---------------------------------------------------------------- Gruppe bearbeiten */

function openGroupEditor(info, onChange) {
  const full = groupProfileAvailable();
  const draft = { avatar: info.avatar || null, banner: info.banner || null };
  const bannerPrev = h('div', { class: 'prof-banner is-small' });
  const avatarPrev = h('div', { class: 'edit-avatar' });
  function paint() {
    bannerPrev.style.backgroundImage = draft.banner ? `url("${draft.banner}")` : '';
    bannerPrev.classList.toggle('is-empty', !draft.banner);
    avatarPrev.replaceChildren(draft.avatar
      ? h('img', { class: 'avatar', src: draft.avatar, alt: t('Vorschau Gruppenbild', 'Group picture preview'), width: 96, height: 96 })
      : h('span', { class: 'avatar is-bit', style: { width: '96px', height: '96px' }, html: bit({ size: 70 }) }));
  }
  function picker(label, w, hgt, key) {
    return imagePicker({
      label, w, h: hgt, round: key === 'avatar',
      title: key === 'avatar' ? t('Gruppenbild zuschneiden', 'Crop group picture') : t('Banner zuschneiden', 'Crop banner'),
      onPick: url => { draft[key] = url; paint(); },
      onRemove: () => { draft[key] = null; paint(); },
    });
  }
  const bannerPick = picker(t('Banner wählen', 'Choose banner'), 1200, 320, 'banner');
  const avatarPick = picker(t('Bild wählen', 'Choose picture'), 256, 256, 'avatar');
  const bannerZone = h('div', { class: 'field' }, h('span', {}, 'Banner'), bannerPrev, bannerPick.el);
  const avatarZone = h('div', { class: 'field' }, h('span', {}, t('Gruppenbild', 'Group picture')), h('div', { class: 'edit-avatar-row' }, avatarPrev, avatarPick.el));
  const nameIn = h('input', { class: 'text-input', maxlength: '40', value: info.name, 'aria-label': 'Name' });
  const bioIn = h('textarea', { class: 'text-input', maxlength: '160', rows: '3', placeholder: t('Worum geht es in der Gruppe?', 'What is the group about?'), 'aria-label': 'Bio' });
  bioIn.value = info.bio || '';
  const err = h('p', { class: 'auth-error', hidden: true });
  const saveBtn = h('button', { type: 'button', class: 'btn btn-go' }, t('Speichern', 'Save'));
  let release = () => {};
  const close = () => { dlg.close(); release(); dlg.remove(); };
  const dlg = h('dialog', { class: 'confirm prof-dialog' },
    h('h2', {}, t('Gruppe bearbeiten', 'Edit group')),
    full ? bannerZone : null,
    full ? avatarZone : null,
    full ? h('p', { class: 'muted img-paste-hint' }, t('Tipp: Bild kopieren und hier mit Strg+V einfügen. Es landet beim Bereich, über dem die Maus zuletzt war.', 'Tip: copy an image and paste it here with Ctrl+V. It goes to the area your mouse was over last.')) : null,
    h('label', { class: 'field' }, h('span', {}, 'Name'), nameIn),
    full ? h('label', { class: 'field' }, h('span', {}, 'Bio'), bioIn) : h('p', { class: 'muted' }, t('Gruppenbild, Banner, Bio und Admins gibt es, sobald der Betreiber supabase/04-gruppen-profil.sql ausgeführt hat.', 'Group picture, banner, bio and admins become available once the operator has run supabase/04-gruppen-profil.sql.')),
    err,
    h('div', { class: 'row-actions' }, h('button', { type: 'button', class: 'btn', onclick: () => close() }, t('Abbrechen', 'Cancel')), saveBtn));
  saveBtn.onclick = async () => {
    err.hidden = true;
    saveBtn.disabled = true;
    try {
      await updateGroupProfile(info.id, { name: nameIn.value, bio: bioIn.value, avatar: draft.avatar, banner: draft.banner });
      close();
      toast(t('Gruppe gespeichert', 'Group saved'));
      onChange();
    } catch (e) {
      saveBtn.disabled = false;
      err.hidden = false;
      err.textContent = germanError(e);
    }
  };
  dlg.addEventListener('cancel', e => { e.preventDefault(); close(); });
  if (full) pasteImagesInto(dlg, [{ picker: avatarPick, zone: avatarZone }, { picker: bannerPick, zone: bannerZone }]);
  paint();
  release = showModal(dlg);
}

/* ---------------------------------------------------------------- Gruppen-Infos und Mitglieder */

async function openGroupDialog(info, onChange) {
  const me = currentUser().id;
  const roleOf = m => (m.user_id === info.owner ? 'owner' : m.role === 'admin' ? 'admin' : 'member');
  const myRole = roleOf(info.members.find(m => m.user_id === me) || { user_id: me });
  const isOwner = myRole === 'owner';
  const isAdmin = isOwner || myRole === 'admin';
  const full = groupProfileAvailable();
  let friends = [];
  try { friends = (await loadFriends()).friends; } catch { friends = []; }
  const inGroup = new Set(info.members.map(m => m.user_id));
  const addable = friends.filter(f => !inGroup.has(f.id));
  let release = () => {};
  const close = () => { dlg.close(); release(); dlg.remove(); };
  const others = info.members.filter(m => m.user_id !== me).map(m => m.profile);
  const fail = e => toast(t('Hat nicht geklappt', 'That didn\'t work'), germanError(e));
  const act = (label, fn, cls = 'btn-ghost') => h('button', { type: 'button', class: `btn btn-small ${cls}`, onclick: fn }, label);

  const order = { owner: 0, admin: 1, member: 2 };
  const members = info.members.slice().sort((a, b) => order[roleOf(a)] - order[roleOf(b)] || displayName(a.profile).localeCompare(displayName(b.profile)));
  const memberList = h('ul', { class: 'pick-list member-list' }, members.map(m => {
    const role = roleOf(m);
    const self = m.user_id === me;
    const tag = role === 'owner' ? h('em', { class: 'owner-tag' }, t('Gründer', 'Founder')) : role === 'admin' ? h('em', { class: 'owner-tag is-admin' }, 'Admin') : null;
    const buttons = [];
    if (!self && isOwner && full) {
      buttons.push(role === 'admin'
        ? act(t('Admin entfernen', 'Remove admin'), async () => { try { await setGroupRole(info.id, m.user_id, 'member'); close(); onChange(); } catch (e) { fail(e); } })
        : act(t('Zum Admin', 'Make admin'), async () => { try { await setGroupRole(info.id, m.user_id, 'admin'); toast(t(`${displayName(m.profile)} ist jetzt Admin`, `${displayName(m.profile)} is now an admin`)); close(); onChange(); } catch (e) { fail(e); } }, 'btn-sky'));
    }
    if (!self && (isOwner || (isAdmin && role === 'member'))) {
      buttons.push(act(t('Entfernen', 'Remove'), async () => {
        if (!(await confirmDialog({ title: t(`${displayName(m.profile)} entfernen?`, `Remove ${displayName(m.profile)}?`), text: t('Die Person sieht die Gruppe danach nicht mehr.', 'They won\'t see the group any more.'), ok: t('Entfernen', 'Remove'), danger: true }))) return;
        try { await removeGroupMember(info.id, m.user_id); close(); onChange(); } catch (e) { fail(e); }
      }));
    }
    return h('li', {},
      h('div', { class: 'pick-row' }, personAvatar(m.profile, 36),
        h('span', {}, h('b', {}, displayName(m.profile), self ? h('small', { class: 'you-tag' }, t(' (du)', ' (you)')) : null, tag), h('small', {}, `@${m.profile.username}`)),
        buttons.length ? h('span', { class: 'member-actions' }, buttons) : null));
  }));

  const pick = pickFriends(addable);
  const addBtn = h('button', {
    type: 'button', class: 'btn btn-small btn-sky',
    onclick: async () => {
      if (!pick.chosen.size) return;
      addBtn.disabled = true;
      try { await addGroupMembers(info.id, [...pick.chosen]); toast(t('Hinzugefügt', 'Added')); close(); onChange(); } catch (e) { addBtn.disabled = false; fail(e); }
    },
  }, t('Hinzufügen', 'Add'));

  const card = h('div', { class: 'group-card' },
    h('div', { class: 'prof-banner is-small', style: info.banner ? { backgroundImage: `url("${info.banner}")` } : null }),
    h('div', { class: 'group-card-body' },
      h('div', { class: 'group-card-top' },
        h('div', { class: 'group-card-pic' }, groupPicture(info, others, 84)),
        isAdmin ? h('button', { type: 'button', class: 'btn btn-small btn-sky', onclick: () => { close(); openGroupEditor(info, onChange); } }, t('Bearbeiten', 'Edit')) : null),
      h('div', { class: 'group-card-id' },
        h('h2', {}, info.name),
        h('small', { class: 'muted' }, t(`${info.members.length} Mitglieder`, `${info.members.length} members`)),
        info.bio ? h('p', { class: 'prof-bio' }, info.bio) : null)));

  const dlg = h('dialog', { class: 'confirm group-dialog' },
    card,
    h('div', { class: 'field' }, h('span', {}, t(`Mitglieder (${info.members.length})`, `Members (${info.members.length})`)), memberList,
      isOwner && full ? h('small', { class: 'muted' }, t('Admins dürfen die Gruppe bearbeiten und normale Mitglieder entfernen.', 'Admins can edit the group and remove regular members.')) : null),
    addable.length ? h('div', { class: 'field' }, h('span', {}, t('Freunde hinzufügen', 'Add friends')), pick.list, h('div', { class: 'row-actions' }, addBtn)) : null,
    h('div', { class: 'row-actions' },
      h('button', {
        type: 'button', class: 'btn btn-bad btn-small',
        onclick: async () => {
          const text = isOwner && info.members.length > 1
            ? t('Du hast die Gruppe gegründet. Wenn du gehst, wird ein Admin (oder das älteste Mitglied) neuer Gründer.', 'You founded the group. If you leave, an admin (or the longest member) becomes the new founder.')
            : t('Du siehst die Nachrichten danach nicht mehr. Ein Mitglied kann dich wieder einladen.', 'You won\'t see the messages any more. A member can invite you again.');
          if (!(await confirmDialog({ title: t('Gruppe verlassen?', 'Leave group?'), text, ok: t('Verlassen', 'Leave'), danger: true }))) return;
          try { await leaveGroup(info.id); close(); toast(t('Gruppe verlassen', 'Left the group')); location.hash = '#/freunde'; } catch (e) { fail(e); }
        },
      }, t('Gruppe verlassen', 'Leave group')),
      h('button', { type: 'button', class: 'btn', onclick: close }, t('Schließen', 'Close'))));
  dlg.addEventListener('cancel', e => { e.preventDefault(); close(); });
  release = showModal(dlg);
}

/* ---------------------------------------------------------------- Gruppenchat */

export async function renderGroup(main, gid) {
  const page = h('div', { class: 'page chat-page' });
  main.append(page);
  if (!CLOUD_ENABLED) { page.append(h('p', { class: 'muted' }, t('Konten sind noch nicht eingerichtet.', 'Accounts are not set up yet.'))); return; }
  await initCloud();
  if (!currentUser()) { location.replace('#/freunde'); return; }
  const wait = h('p', { class: 'muted social-loading' }, t('Lädt ...', 'Loading ...'));
  page.append(wait);
  let info;
  try { info = await groupDetails(gid); } catch (err) { wait.textContent = groupsAvailable() ? germanError(err) : NOT_READY(); return; }
  wait.remove();
  if (!info) {
    page.append(h('section', { class: 'social-empty' }, h('div', { html: bit({ size: 110, mood: 'think' }) }),
      h('p', {}, t('Diese Gruppe gibt es nicht, oder du bist kein Mitglied mehr.', 'This group doesn\'t exist, or you are no longer a member.')),
      h('a', { class: 'btn btn-sky', href: '#/freunde' }, t('Zu den Freunden', 'Go to friends'))));
    return;
  }
  const byId = Object.fromEntries(info.members.map(m => [m.user_id, m.profile]));
  const others = info.members.filter(m => m.user_id !== currentUser().id).map(m => m.profile);

  const box = chatBox({
    meId: currentUser().id,
    canWrite: true,
    placeholder: t('Nachricht schreiben', 'Write a message'),
    send: body => sendGroupMessage(gid, body),
    sendFile: (file, body) => sendGroupAttachment(gid, file, body),
    senderOf: m => {
      const p = byId[m.sender];
      return { name: p ? displayName(p) : t('Ehemaliges Mitglied', 'Former member'), avatarEl: personAvatar(p, 22) };
    },
  });

  const rerender = () => { main.innerHTML = ''; renderGroup(main, gid); };
  page.append(
    h('header', { class: 'chat-head' },
      h('a', { class: 'icon-btn', href: '#/freunde', 'aria-label': t('Zurück zu den Freunden', 'Back to friends'), html: icon('back', 22) }),
      h('button', { type: 'button', class: 'search-person group-head', onclick: () => openGroupDialog(info, rerender) },
        groupPicture(info, others, 44),
        h('span', {}, h('b', {}, info.name), h('small', {}, t(`${info.members.length} Mitglieder · ${others.map(displayName).slice(0, 3).join(', ')}${others.length > 3 ? ' …' : ''}`, `${info.members.length} members · ${others.map(displayName).slice(0, 3).join(', ')}${others.length > 3 ? ' …' : ''}`)))),
      h('button', { type: 'button', class: 'icon-btn', title: t('Mitglieder', 'Members'), 'aria-label': t('Mitglieder und Einstellungen', 'Members and settings'), onclick: () => openGroupDialog(info, rerender), html: icon('more', 24) })),
    box.list,
    box.form,
    h('p', { class: 'muted social-note' }, t('Nur Mitglieder der Gruppe sehen die Nachrichten. Sei nett zueinander.', 'Only group members see the messages. Be nice to each other.')));

  try {
    (await loadGroupThread(gid)).forEach(m => box.add(m));
    box.empty(t('Noch keine Nachrichten. Sag Hallo!', 'No messages yet. Say hello!'));
    box.toBottom();
    markGroupRead(gid).catch(() => {});
  } catch (err) {
    box.error(germanError(err));
  }
  const stop = onLive((kind, row) => {
    if (!document.body.contains(box.list)) { stop(); return; }
    if (kind === 'group_message' && row.group_id === gid && row.sender !== currentUser().id) {
      if (!byId[row.sender]) { rerender(); return; }
      box.add(row, { live: true });
      markGroupRead(gid).catch(() => {});
    }
  });
  box.focus();
}
