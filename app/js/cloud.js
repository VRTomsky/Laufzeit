// Konto, Cloud-Speicherung und alles Soziale (Freunde, Nachrichten, Anfeuern).
// Technik: Supabase. Die Datenbank prueft selbst, wer was darf (supabase/schema.sql).
// Ohne eingetragene Zugangsdaten (config.js) bleibt Bitweg wie bisher rein lokal.

import { t, locale } from './i18n.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, WEB_URL } from './config.js';
import { IS_WEB } from './env.js';
import { store } from './store.js';
import { COURSES } from './content/index.js';
import { currentStreak, courseProgress, todayKey } from './gamification.js';
import { dayKey, addDays, confirmDialog, toast } from './util.js';

const SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/+esm';
const OWNER_KEY = 'laufzeit.owner';           // wessen Stand liegt gerade im Browser?
const LIGHT = 'id,username,name,avatar,xp,streak,last_active,summary';
const FULL = `${LIGHT},bio,banner,created_at`;
export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
const IMG_RE = /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/;

const MOCK = new URLSearchParams(location.search).has('mock');
export const CLOUD_ENABLED = MOCK || Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let api = null;           // Backend (echtes Supabase oder Test-Attrappe)
let user = null;          // { id, email }
let me = null;            // eigenes Profil aus der Datenbank
let ready = null;
const listeners = new Set();
const liveListeners = new Set();
let counts = { messages: 0, requests: 0, nudges: 0, groups: 0 };

export const currentUser = () => user;
export const myProfile = () => me;
export const socialCounts = () => counts;
export function onCloudChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function onLive(fn) { liveListeners.add(fn); return () => liveListeners.delete(fn); }
const emit = () => listeners.forEach(l => l({ user, me, counts }));

/** Sicheres Bild aus der Datenbank (nur JPEG als data-URL) */
export const safeImg = src => (typeof src === 'string' && IMG_RE.test(src) ? src : null);

/* ================================================================ Fehlermeldungen */

export function germanError(err) {
  const m = String(err?.message || err || '');
  if (/Invalid login credentials/i.test(m)) return t('E-Mail oder Passwort stimmt nicht.', 'Email or password is wrong.');
  if (/already registered|already been registered/i.test(m)) return t('Für diese E-Mail gibt es schon ein Konto. Log dich ein.', 'There\'s already an account for this email. Log in.');
  if (/Email not confirmed/i.test(m)) return t('Bestätige zuerst deine E-Mail. Der Link steht in deinem Postfach (auch im Spam-Ordner nachsehen).', 'Confirm your email first. The link is in your inbox (also check the spam folder).');
  if (/Password should be|password.*(short|characters)/i.test(m)) return t('Das Passwort ist zu kurz. Nimm mindestens 8 Zeichen.', 'The password is too short. Use at least 8 characters.');
  if (/weak password|pwned/i.test(m)) return t('Dieses Passwort ist zu leicht zu erraten. Nimm ein anderes.', 'This password is too easy to guess. Pick another one.');
  if (/Database error saving new user|duplicate key.*username|profiles_username_key/i.test(m)) return t('Dieser Benutzername ist schon vergeben.', 'This username is already taken.');
  if (/rate limit|too many/i.test(m)) return t('Zu viele Versuche gerade. Warte ein paar Minuten.', 'Too many attempts right now. Wait a few minutes.');
  if (/invalid.*email|Unable to validate email/i.test(m)) return t('Diese E-Mail-Adresse sieht nicht richtig aus.', 'This email address doesn\'t look right.');
  if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return t('Keine Verbindung zum Server. Bist du online?', 'No connection to the server. Are you online?');
  if (/row-level security|violates/i.test(m)) return t('Das ist nicht erlaubt (z. B. nur unter Freunden möglich).', 'That\'s not allowed (e.g. only possible between friends).');
  if (/same_password|different from the old/i.test(m)) return t('Das neue Passwort muss anders sein als das alte.', 'The new password must be different from the old one.');
  return m || t('Etwas ist schiefgegangen.', 'Something went wrong.');
}

const must = ({ data, error }) => { if (error) throw error; return data; };

/** Bricht ab, wenn der Server zu lange nicht antwortet (statt endlos zu warten) */
function withTimeout(promise, ms, msg) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(msg || t('Keine Antwort vom Server. Prüf dein Internet und versuch es nochmal.', 'No answer from the server. Check your internet and try again.'))), ms); }),
  ]).finally(() => clearTimeout(timer));
}

// Safari (vor allem am iPhone) bleibt mit navigator.locks manchmal haengen, dann tut kein Knopf mehr etwas.
// Deshalb eine einfache Sperre nur innerhalb dieses Tabs.
let lockChain = Promise.resolve();
function tabLock(_name, _timeout, fn) {
  const run = lockChain.then(() => fn());
  lockChain = run.catch(() => {});
  return run;
}

/* ================================================================ Supabase-Backend */

async function supabaseBackend() {
  const { createClient } = await withTimeout(import(SUPABASE_JS), 25000);
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'laufzeit.auth', lock: tabLock },
  });
  const uid = () => user?.id;
  let msgCols = 'id,sender,recipient,body,created_at,read_at,attachment';
  async function withCols(query) {
    let res = await query(msgCols);
    if (res.error && /attachment/.test(res.error.message || '') && msgCols.includes('attachment')) {
      msgCols = 'id,sender,recipient,body,created_at,read_at';
      attachmentsReady = false;
      res = await query(msgCols);
    }
    return must(res);
  }
  const redirect = () => (IS_WEB ? WEB_URL : `${location.origin}/`);
  const self = {
    async session() {
      const { data } = await withTimeout(sb.auth.getSession(), 15000);
      return data.session?.user ? { id: data.session.user.id, email: data.session.user.email } : null;
    },
    onAuth(cb) {
      sb.auth.onAuthStateChange((event, session) => {
        // Supabase-Hinweis: im Callback nicht direkt weitere Abfragen starten
        setTimeout(() => cb(event, session?.user ? { id: session.user.id, email: session.user.email } : null), 0);
      });
    },
    async signUp(email, password, username, name) {
      const data = must(await withTimeout(sb.auth.signUp({ email, password, options: { data: { username, name }, emailRedirectTo: redirect() } }), 25000));
      return { needsConfirm: !data.session };
    },
    async signIn(email, password) { must(await withTimeout(sb.auth.signInWithPassword({ email, password }), 25000)); },
    async signOut() { await sb.auth.signOut(); },
    async resetPassword(email) { must(await sb.auth.resetPasswordForEmail(email, { redirectTo: redirect() })); },
    async updatePassword(password) { must(await withTimeout(sb.auth.updateUser({ password }), 25000)); },
    async verifyPassword(password) { must(await withTimeout(sb.auth.signInWithPassword({ email: user.email, password }), 25000)); },
    async updateEmail(email) { must(await withTimeout(sb.auth.updateUser({ email }, { emailRedirectTo: redirect() }), 25000)); },
    async deleteAccount() { must(await sb.rpc('delete_account')); await sb.auth.signOut(); },
    async usernameAvailable(name) { return Boolean(must(await sb.rpc('username_available', { name }))); },

    async getProgress() { return must(await sb.from('progress').select('state,updated_at').eq('user_id', uid()).maybeSingle()); },
    async putProgress(state) { must(await sb.from('progress').upsert({ user_id: uid(), state })); },
    async getProfile(id) { return must(await sb.from('profiles').select(FULL).eq('id', id).maybeSingle()); },
    async getProfileByUsername(username) { return must(await sb.from('profiles').select(FULL).eq('username', username).maybeSingle()); },
    async updateProfile(fields) { must(await sb.from('profiles').update(fields).eq('id', uid())); },
    async search(q) {
      const clean = q.toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (clean.length < 2) return [];
      return must(await sb.from('profiles').select(LIGHT).ilike('username', `%${clean}%`).neq('id', uid()).limit(12));
    },
    async profilesByIds(ids) {
      if (!ids.length) return [];
      return must(await sb.from('profiles').select(LIGHT).in('id', ids));
    },
    async friendships() { return must(await sb.from('friendships').select('requester,addressee,status,created_at')); },
    async request(id) { must(await sb.from('friendships').insert({ requester: uid(), addressee: id })); },
    async accept(requesterId) { must(await sb.from('friendships').update({ status: 'accepted' }).eq('requester', requesterId).eq('addressee', uid())); },
    async removeFriend(otherId) {
      must(await sb.from('friendships').delete().or(`and(requester.eq.${uid()},addressee.eq.${otherId}),and(requester.eq.${otherId},addressee.eq.${uid()})`));
    },
    async blocks() { return must(await sb.from('blocks').select('blocked')).map(r => r.blocked); },
    async block(id) { must(await sb.from('blocks').insert({ blocker: uid(), blocked: id })); },
    async unblock(id) { must(await sb.from('blocks').delete().eq('blocker', uid()).eq('blocked', id)); },
    async report(id, reason, messageId = null) { must(await sb.from('reports').insert({ reporter: uid(), reported: id, reason, message_id: messageId })); },

    async messages(otherId, limit = 150) {
      const rows = await withCols(cols => sb.from('messages').select(cols)
        .or(`and(sender.eq.${uid()},recipient.eq.${otherId}),and(sender.eq.${otherId},recipient.eq.${uid()})`)
        .order('created_at', { ascending: false }).limit(limit));
      return rows.reverse();
    },
    async lastMessages() {
      return withCols(cols => sb.from('messages').select(cols)
        .order('created_at', { ascending: false }).limit(300));
    },
    async send(otherId, body, attachment = null) {
      const row = { sender: uid(), recipient: otherId, body };
      if (attachment) row.attachment = attachment;
      return withCols(cols => sb.from('messages').insert(row).select(cols).single());
    },
    async upload(otherId, file, name) {
      const rand = Math.random().toString(36).slice(2, 10);
      const path = `${uid()}/${otherId}/${Date.now()}-${rand}-${name}`;
      must(await sb.storage.from('chat').upload(path, file, { contentType: file.type, upsert: false }));
      return path;
    },
    async fileUrl(path, download = null) {
      const data = must(await sb.storage.from('chat').createSignedUrl(path, 3600, download ? { download } : undefined));
      return data.signedUrl;
    },
    async markRead(otherId) {
      must(await sb.from('messages').update({ read_at: new Date().toISOString() }).eq('recipient', uid()).eq('sender', otherId).is('read_at', null));
    },
    async unread() { return must(await sb.from('messages').select('sender').eq('recipient', uid()).is('read_at', null)); },
    async nudgesUnseen() { return must(await sb.from('nudges').select('id,sender,kind,streak,created_at').eq('recipient', uid()).is('seen_at', null).order('created_at', { ascending: false }).limit(30)); },
    async sendNudge(otherId, kind, streak = null) { must(await sb.from('nudges').insert({ sender: uid(), recipient: otherId, kind, streak })); },
    async markNudgesSeen(ids) { if (ids.length) must(await sb.from('nudges').update({ seen_at: new Date().toISOString() }).in('id', ids)); },

    /* ---------- Gruppen (supabase/03-gruppen.sql, Bild/Bio/Admins aus 04-gruppen-profil.sql) */
    async g04(run) {
      let res = await run();
      if (res.error && groupProfileReady && /avatar|banner|bio|role|column/i.test(res.error.message || '')) {
        groupProfileReady = false;
        res = await run();
      }
      return res;
    },
    async groups() {
      const mem = must(await sb.from('group_members').select('group_id,last_read_at').eq('user_id', uid()));
      if (!mem.length) return [];
      const ids = mem.map(m => m.group_id);
      const [gs, last] = await Promise.all([
        self.g04(() => sb.from('groups').select(groupProfileReady ? 'id,name,owner,created_at,avatar' : 'id,name,owner,created_at').in('id', ids)),
        sb.from('group_messages').select('id,group_id,sender,body,attachment,created_at').in('group_id', ids).order('created_at', { ascending: false }).limit(400),
      ]);
      const msgs = must(last);
      return must(gs).map(g => ({ ...g, last_read_at: mem.find(m => m.group_id === g.id)?.last_read_at, messages: msgs.filter(m => m.group_id === g.id) }));
    },
    async groupInfo(gid) { return must(await self.g04(() => sb.from('groups').select(groupProfileReady ? 'id,name,owner,created_at,bio,avatar,banner' : 'id,name,owner,created_at').eq('id', gid).maybeSingle())); },
    async groupMembers(gid) { return must(await self.g04(() => sb.from('group_members').select(groupProfileReady ? 'user_id,joined_at,added_by,role' : 'user_id,joined_at,added_by').eq('group_id', gid))); },
    async updateGroup(gid, fields) {
      const rows = must(await sb.from('groups').update(fields).eq('id', gid).select('id'));
      if (!rows.length) throw new Error(t('Das dürfen nur Admins der Gruppe.', 'Only group admins can do that.'));
    },
    async setGroupRole(gid, userId, role) {
      const rows = must(await sb.from('group_members').update({ role }).eq('group_id', gid).eq('user_id', userId).select('user_id'));
      if (!rows.length) throw new Error(t('Admins ernennen darf nur, wer die Gruppe gegründet hat.', 'Only the group founder can choose admins.'));
    },
    async createGroup(name) { return must(await sb.from('groups').insert({ name, owner: uid() }).select('id,name,owner,created_at').single()); },
    async addGroupMembers(gid, ids) { if (ids.length) must(await sb.from('group_members').insert(ids.map(user_id => ({ group_id: gid, user_id, added_by: uid() })))); },
    async removeGroupMember(gid, userId) { must(await sb.from('group_members').delete().eq('group_id', gid).eq('user_id', userId)); },
    async groupMessages(gid, limit = 200) {
      const rows = must(await sb.from('group_messages').select('id,group_id,sender,body,attachment,created_at').eq('group_id', gid).order('created_at', { ascending: false }).limit(limit));
      return rows.reverse();
    },
    async sendGroup(gid, body, attachment = null) {
      const row = { group_id: gid, sender: uid(), body };
      if (attachment) row.attachment = attachment;
      return must(await sb.from('group_messages').insert(row).select('id,group_id,sender,body,attachment,created_at').single());
    },
    async uploadGroup(gid, file, name) {
      const rand = Math.random().toString(36).slice(2, 10);
      const path = `g/${gid}/${uid()}/${Date.now()}-${rand}-${name}`;
      must(await sb.storage.from('chat').upload(path, file, { contentType: file.type, upsert: false }));
      return path;
    },
    async markGroupRead(gid) { must(await sb.from('group_members').update({ last_read_at: new Date().toISOString() }).eq('group_id', gid).eq('user_id', uid())); },
    liveGroups(onEvent) {
      const ch = sb.channel(`bitweg-groups-${uid()}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages' }, p => onEvent('group_message', p.new))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members' }, p => onEvent('group', p.new || p.old))
        .subscribe();
      return () => sb.removeChannel(ch);
    },

    live(onEvent) {
      const ch = sb.channel(`laufzeit-${uid()}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `recipient=eq.${uid()}` }, p => onEvent('message', p.new))
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'nudges', filter: `recipient=eq.${uid()}` }, p => onEvent('nudge', p.new))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, p => onEvent('friendship', p.new || p.old))
        .subscribe();
      return () => sb.removeChannel(ch);
    },
  };
  return self;
}

/* ================================================================ Zusammenfassung fuer Freunde */

/** Was Freunde ueber deinen Stand sehen: Kurs, Abschnitt, Lektionen, letzte Lerntage */
export function buildSummary(s = store.state) {
  const langs = {};
  for (const id of s.courses.length ? s.courses : [s.activeLang]) {
    const units = COURSES[id].units;
    const done = l => s.langs[id].lessons[l.id]?.done;
    let current = units.findIndex(u => !u.lessons.every(done));
    if (current < 0) current = units.length - 1;
    const p = courseProgress(id, s);
    langs[id] = {
      done: p.done,
      total: p.total,
      unit: current + 1,
      units: units.length,
      unitTitle: units[current].title,
      gold: Object.values(s.langs[id].lessons).filter(r => r.gold).length,
      goldUnits: Object.keys(s.langs[id].gold || {}).length,
      xp: s.langs[id].xp,
    };
  }
  const recent = [];
  let week = 0;
  for (let i = 0; i < 60; i++) {
    const k = dayKey(addDays(new Date(), -i));
    if ((s.days[k] || 0) > 0) recent.push(k);
    if (i < 7) week += s.days[k] || 0;
  }
  return {
    active: s.activeLang,
    langs,
    recent,
    weekXp: week,
    best: s.streak.best,
    badges: Object.keys(s.badges).length,
    today: (s.days[todayKey()] || 0) > 0,
  };
}

/** Gemeinsame Serie: Tage in Folge, an denen beide gelernt haben */
export function jointStreak(mineRecent, theirRecent) {
  const a = new Set(mineRecent || []);
  const b = new Set(theirRecent || []);
  let n = 0;
  let i = a.has(todayKey()) && b.has(todayKey()) ? 0 : 1;
  for (; i < 60; i++) {
    const k = dayKey(addDays(new Date(), -i));
    if (a.has(k) && b.has(k)) n++;
    else break;
  }
  return n;
}

/* ================================================================ Abgleich */

const strip = s => {
  const copy = JSON.parse(JSON.stringify(s));
  copy.profile.avatar = null;
  copy.profile.banner = null;
  return copy;
};
const lessonCount = s => Object.values(s.langs || {}).reduce((n, l) => n + Object.keys(l.lessons || {}).length, 0);
const hasProgress = s => Boolean(s && (s.xp > 0 || lessonCount(s) > 0));

let pushTimer = null;
let pushing = false;
let lastProfilePush = '';
let applying = false;
let manualAuth = false;     // login()/register() laufen gerade selbst
let syncing = null;

function profileFields() {
  const s = store.state;
  const p = s.profile;
  return {
    name: (p.name || '').slice(0, 40),
    bio: (p.bio || '').slice(0, 160),
    avatar: safeImg(p.avatar),
    banner: safeImg(p.banner),
    xp: s.xp,
    streak: currentStreak(s),
    last_active: s.streak.last || null,
    summary: buildSummary(s),
  };
}

export async function pushNow() {
  if (!user || pushing || applying) return;
  pushing = true;
  try {
    await api.putProgress(strip(store.state));
    const fields = profileFields();
    const key = JSON.stringify(fields);
    if (key !== lastProfilePush) {
      // Bilder nur mitschicken, wenn sie sich geaendert haben
      const send = { ...fields };
      if (me && me.avatar === fields.avatar) delete send.avatar;
      if (me && me.banner === fields.banner) delete send.banner;
      await api.updateProfile(send);
      lastProfilePush = key;
      me = { ...me, ...fields };
    }
  } catch (err) {
    console.warn('Bitweg: Cloud-Speichern fehlgeschlagen', err);
  } finally {
    pushing = false;
  }
}

function schedulePush() {
  if (!user) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(pushNow, 4000);
}

/** Nach dem Einloggen: Stand aus der Cloud und vom Geraet zusammenbringen */
function syncAfterLogin() {
  if (!syncing) syncing = doSync().finally(() => { syncing = null; });
  return syncing;
}

async function doSync() {
  applying = true;
  try {
    const [row, prof] = await Promise.all([api.getProgress(), api.getProfile(user.id)]);
    me = prof;
    const owner = localStorage.getItem(OWNER_KEY);
    const local = store.state;
    const cloud = row?.state && row.state.version === 1 ? row.state : null;
    let use;
    if (owner === user.id) {
      use = cloud && (cloud.xp > local.xp || (!local.onboarded && cloud.onboarded)) ? 'cloud' : 'local';
    } else if (owner && owner !== user.id) {
      use = cloud ? 'cloud' : 'fresh';      // Stand eines anderen Kontos nie uebernehmen
    } else if (!hasProgress(local)) {
      use = cloud ? 'cloud' : 'local';
    } else if (!cloud || !hasProgress(cloud)) {
      use = 'local';                        // erster Login: Stand von diesem Geraet mitnehmen
    } else {
      const keepCloud = await confirmDialog({
        title: t('Welchen Stand behalten?', 'Which progress do you want to keep?'),
        text: t(`In deinem Konto sind ${cloud.xp} XP gespeichert, auf diesem Gerät ${local.xp} XP. Welchen Stand willst du weiter benutzen? Der andere wird überschrieben.`, `Your account has ${cloud.xp} XP saved, this device ${local.xp} XP. Which progress do you want to keep using? The other one will be overwritten.`),
        ok: t(`Konto (${cloud.xp} XP)`, `Account (${cloud.xp} XP)`),
        cancel: t(`Dieses Gerät (${local.xp} XP)`, `This device (${local.xp} XP)`),
      });
      use = keepCloud ? 'cloud' : 'local';
    }

    if (use === 'cloud') {
      store.replace(cloud);
    } else if (use === 'fresh') {
      store.reset();
    }
    // Profil: Benutzername kommt immer aus dem Konto
    store.update(s => {
      const p = s.profile;
      p.username = prof?.username || p.username;
      if (use === 'local') {
        // eigene Angaben vom Geraet behalten, Luecken aus dem Konto fuellen
        p.name = p.name || prof?.name || '';
        p.bio = p.bio || prof?.bio || '';
        p.avatar = safeImg(p.avatar) || safeImg(prof?.avatar);
        p.banner = safeImg(p.banner) || safeImg(prof?.banner);
      } else {
        p.name = prof?.name || p.name || '';
        p.bio = prof?.bio || '';
        p.avatar = safeImg(prof?.avatar);
        p.banner = safeImg(prof?.banner);
      }
    });
    localStorage.setItem(OWNER_KEY, user.id);
    if (use !== 'local') replacedView = true;
  } finally {
    applying = false;
  }
  await pushNow();
  if (replacedView) {
    replacedView = false;
    // Seite mit dem geladenen Stand neu aufbauen (nicht mitten in einer Lektion)
    if (!/^#\/(lektion|test|training\/los|projekt|aufgabe)/.test(location.hash)) window.dispatchEvent(new HashChangeEvent('hashchange'));
  }
}
let replacedView = false;

/* ================================================================ Zaehler und Live */

export async function refreshCounts() {
  if (!user) { counts = { messages: 0, requests: 0, nudges: 0, groups: 0 }; emit(); return counts; }
  try {
    const [unread, fr, nudges, groups] = await Promise.all([api.unread(), api.friendships(), api.nudgesUnseen(), safeGroups()]);
    counts = {
      messages: unread.length,
      requests: fr.filter(f => f.status === 'pending' && f.addressee === user.id).length,
      nudges: nudges.length,
      groups: groups.reduce((n, g) => n + groupUnread(g), 0),
    };
  } catch {
    // offline: alte Zahlen behalten
  }
  emit();
  return counts;
}

let stopLive = null;
let stopGroupLive = null;
function startLive() {
  stopLive?.();
  stopGroupLive?.();
  const handler = (kind, row) => {
    liveListeners.forEach(l => l(kind, row));
    if (kind === 'nudge') showNudgeToasts();
    refreshCounts();
  };
  stopLive = api.live(handler);
  // Gruppen in eigenem Kanal: fehlen die Tabellen noch, bleibt der normale Chat davon unberuehrt
  if (groupsReady && api.liveGroups) {
    try { stopGroupLive = api.liveGroups(handler); } catch { stopGroupLive = null; }
  }
}

const nudgeText = (n, who) => (n.kind === 'streak'
  ? t(`${who} teilt die Serie: ${n.streak} ${n.streak === 1 ? 'Tag' : 'Tage'} in Folge.`, `${who} shares their streak: ${n.streak} ${n.streak === 1 ? 'day' : 'days'} in a row.`)
  : t(`${who} feuert dich an. Zeit für eine Lektion!`, `${who} is cheering you on. Time for a lesson!`));
export { nudgeText };

async function showNudgeToasts() {
  try {
    const list = await api.nudgesUnseen();
    const fresh = list.filter(n => !shownNudges.has(n.id));
    if (!fresh.length) return;
    const people = await api.profilesByIds([...new Set(fresh.map(n => n.sender))]);
    const byId = Object.fromEntries(people.map(p => [p.id, p]));
    fresh.slice(0, 3).forEach(n => {
      shownNudges.add(n.id);
      const who = byId[n.sender]?.name || t(`@${byId[n.sender]?.username || 'Jemand'}`, `@${byId[n.sender]?.username || 'Someone'}`);
      toast(n.kind === 'streak' ? t('Serie geteilt', 'Streak shared') : t('Du wirst angefeuert', 'You\'re being cheered on'), nudgeText(n, who));
    });
  } catch {
    // egal
  }
}
const shownNudges = new Set();

/* ================================================================ Start */

export function initCloud() {
  if (ready) return ready;
  if (!CLOUD_ENABLED) { ready = Promise.resolve(null); return ready; }
  ready = (async () => {
    try {
      api = MOCK ? (await import('./cloud-mock.js')).createMockBackend() : await supabaseBackend();
    } catch (err) {
      console.warn('Bitweg: Konto-Dienst nicht erreichbar', err);
      api = null;
      ready = null; // naechster Versuch darf neu laden
      return null;
    }
    try {
      user = await api.session();
    } catch (err) {
      console.warn('Bitweg: Sitzung nicht lesbar', err);
      user = null;
    }
    if (user) {
      try { await syncAfterLogin(); } catch (err) { console.warn(err); }
      startLive();
      refreshCounts();
      setTimeout(showNudgeToasts, 1500);
    }
    api.onAuth(async (event, u) => {
      if (event === 'PASSWORD_RECOVERY') { location.hash = '#/konto/neues-passwort'; return; }
      if (event === 'USER_UPDATED' && u && u.id === user?.id) { user = u; emit(); return; }
      if (event === 'SIGNED_IN' && u && !manualAuth && u.id !== user?.id) {
        user = u;
        try { await syncAfterLogin(); } catch (err) { console.warn(err); }
        startLive();
        refreshCounts();
        emit();
      } else if (event === 'SIGNED_OUT') {
        user = null;
        me = null;
        stopLive?.();
        emit();
      }
    });
    store.subscribe(() => { if (!applying) schedulePush(); });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') pushNow(); });
    // PKCE-Rueckkehr (E-Mail bestaetigt, Passwort vergessen): ?code= aus der Adresse entfernen
    if (new URLSearchParams(location.search).has('code')) {
      const url = new URL(location.href);
      url.searchParams.delete('code');
      history.replaceState(null, '', url.pathname + url.search + url.hash);
    }
    emit();
    return api;
  })();
  return ready;
}

async function need() {
  await initCloud();
  if (!api) throw new Error(t('Der Konto-Dienst ist gerade nicht erreichbar.', 'The account service isn\'t reachable right now.'));
  return api;
}

/* ================================================================ Konto */

export async function register({ email, password, username, name }) {
  const a = await need();
  if (!USERNAME_RE.test(username)) throw new Error(t('Benutzername: 3 bis 20 Zeichen, nur Kleinbuchstaben, Zahlen und _.', 'Username: 3 to 20 characters, only lowercase letters, numbers and _.'));
  if (password.length < 8) throw new Error(t('Das Passwort ist zu kurz. Nimm mindestens 8 Zeichen.', 'The password is too short. Use at least 8 characters.'));
  if (!(await a.usernameAvailable(username))) throw new Error(t('Dieser Benutzername ist schon vergeben.', 'This username is already taken.'));
  manualAuth = true;
  try {
    const res = await a.signUp(email.trim(), password, username, name.trim());
    if (!res.needsConfirm) {
      user = await a.session();
      await syncAfterLogin();
      startLive();
      refreshCounts();
      emit();
    }
    return res;
  } finally {
    manualAuth = false;
  }
}

export async function login(email, password) {
  const a = await need();
  manualAuth = true;
  try {
    await a.signIn(email.trim(), password);
    user = await a.session();
    await syncAfterLogin();
    startLive();
    refreshCounts();
    emit();
  } finally {
    manualAuth = false;
  }
}

export async function logout() {
  const a = await need();
  await pushNow();
  await a.signOut();
  user = null;
  me = null;
  stopLive?.();
  localStorage.removeItem(OWNER_KEY);
  store.reset();
  emit();
}

export async function sendReset(email) { await (await need()).resetPassword(email.trim()); }
export async function setNewPassword(pw) {
  if (pw.length < 8) throw new Error(t('Das Passwort ist zu kurz. Nimm mindestens 8 Zeichen.', 'The password is too short. Use at least 8 characters.'));
  await (await need()).updatePassword(pw);
}

const BAD_LOGIN = /invalid login credentials|invalid_credentials/i;

/** Passwort aendern, wenn man das alte kennt */
export async function changePassword(current, next) {
  if (next.length < 8) throw new Error(t('Das neue Passwort ist zu kurz. Nimm mindestens 8 Zeichen.', 'The new password is too short. Use at least 8 characters.'));
  if (next === current) throw new Error(t('Das neue Passwort muss anders sein als das alte.', 'The new password must be different from the old one.'));
  const a = await need();
  try { await a.verifyPassword(current); } catch (err) {
    if (BAD_LOGIN.test(String(err?.message || err?.code))) throw new Error(t('Das aktuelle Passwort stimmt nicht.', 'Your current password is wrong.'));
    throw err;
  }
  await a.updatePassword(next);
}

/** E-Mail aendern: Supabase schickt Bestaetigungs-Links, erst danach gilt die neue Adresse */
export async function changeEmail(email, current) {
  const clean = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) throw new Error(t('Das sieht nicht nach einer E-Mail-Adresse aus.', 'That doesn\'t look like an email address.'));
  if (clean === (user?.email || '').toLowerCase()) throw new Error(t('Das ist schon deine E-Mail-Adresse.', 'That already is your email address.'));
  const a = await need();
  try { await a.verifyPassword(current); } catch (err) {
    if (BAD_LOGIN.test(String(err?.message || err?.code))) throw new Error(t('Das Passwort stimmt nicht.', 'The password is wrong.'));
    throw err;
  }
  await a.updateEmail(clean);
  return clean;
}

export async function deleteAccount() {
  const a = await need();
  await a.deleteAccount();
  user = null;
  me = null;
  stopLive?.();
  localStorage.removeItem(OWNER_KEY);
  store.reset();
  emit();
}

/** Profil aus dem Editor speichern (Benutzername wird auf Vergabe geprueft) */
export async function saveProfile(fields) {
  const a = await need();
  if (fields.username && fields.username !== me?.username) {
    if (!(await a.usernameAvailable(fields.username))) throw new Error(t('Dieser Benutzername ist schon vergeben.', 'This username is already taken.'));
  }
  const send = {
    username: fields.username,
    name: fields.name,
    bio: fields.bio,
    avatar: safeImg(fields.avatar),
    banner: safeImg(fields.banner),
  };
  await a.updateProfile(send);
  me = { ...me, ...send };
  emit();
}

/* ================================================================ Freunde */

/** Alle Beziehungen mit Profil: { friends, incoming, outgoing } */
export async function loadFriends() {
  const a = await need();
  const rows = await a.friendships();
  const otherId = r => (r.requester === user.id ? r.addressee : r.requester);
  const people = await a.profilesByIds([...new Set(rows.map(otherId))]);
  const byId = Object.fromEntries(people.map(p => [p.id, p]));
  const out = { friends: [], incoming: [], outgoing: [] };
  for (const r of rows) {
    const p = byId[otherId(r)];
    if (!p) continue;
    if (r.status === 'accepted') out.friends.push(p);
    else if (r.addressee === user.id) out.incoming.push(p);
    else out.outgoing.push(p);
  }
  return out;
}

export async function relationTo(otherId) {
  const a = await need();
  const rows = await a.friendships();
  const r = rows.find(x => (x.requester === otherId && x.addressee === user.id) || (x.addressee === otherId && x.requester === user.id));
  if (!r) return 'none';
  if (r.status === 'accepted') return 'friends';
  return r.addressee === user.id ? 'incoming' : 'outgoing';
}

export const searchPeople = async q => (await need()).search(q);
export async function profilesById(ids) {
  const list = await (await need()).profilesByIds(ids);
  return Object.fromEntries(list.map(p => [p.id, p]));
}
export const profileByUsername = async u => (await need()).getProfileByUsername(u);

export async function addFriend(id) {
  const rel = await relationTo(id);
  if (rel === 'incoming') return acceptFriend(id);
  if (rel !== 'none') return;
  await (await need()).request(id);
  refreshCounts();
}
export async function acceptFriend(id) { await (await need()).accept(id); refreshCounts(); }
export async function removeFriend(id) { await (await need()).removeFriend(id); refreshCounts(); }
export async function blockUser(id) { await (await need()).block(id); refreshCounts(); }
export async function unblockUser(id) { await (await need()).unblock(id); }
export async function blockedIds() { return (await need()).blocks(); }
export async function reportUser(id, reason, messageId = null) { await (await need()).report(id, reason.slice(0, 500), messageId); }

/* ================================================================ Nachrichten */

export const loadThread = async otherId => (await need()).messages(otherId);
export async function sendMessage(otherId, body, attachment = null) {
  const text = body.trim().slice(0, 1000);
  if (!text && !attachment) throw new Error(t('Leere Nachricht.', 'Empty message.'));
  return (await need()).send(otherId, text, attachment);
}

/* ================================================================ Anhaenge */

export const ATTACH_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/zip'];
export const ATTACH_MAX = 5 * 1024 * 1024;
let attachmentsReady = true;
export const attachmentsAvailable = () => attachmentsReady;

/** Grosse Fotos vor dem Hochladen verkleinern (max. 1600 px, JPEG) */
async function shrinkImage(file) {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size < 1.5 * 1024 * 1024) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.85));
    return blob ? new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }) : file;
  } catch {
    return file;
  }
}

const safeName = n => (n || 'datei').normalize('NFKD').replace(/[^\w.\-]+/g, '_').replace(/^_+|_+$/g, '').slice(-80) || 'datei';

/** Datei hochladen und als Nachricht schicken */
export async function sendAttachment(otherId, file, body = '') {
  if (!ATTACH_TYPES.includes(file.type)) throw new Error(t('Dieser Dateityp geht nicht. Erlaubt: Bilder, PDF, Text und ZIP.', 'This file type is not allowed. Allowed: images, PDF, text and ZIP.'));
  const ready = await shrinkImage(file);
  if (ready.size > ATTACH_MAX) throw new Error(t('Die Datei ist größer als 5 MB.', 'The file is larger than 5 MB.'));
  const a = await need();
  const name = safeName(ready.name);
  const path = await a.upload(otherId, ready, name);
  return sendMessage(otherId, body, { path, name: (ready.name || name).slice(0, 120), type: ready.type, size: ready.size });
}

const urlCache = new Map();
/** Kurzlebiger Link zu einer Datei (nur Absender und Empfaenger duerfen ihn holen) */
export async function attachmentUrl(path, downloadName = null) {
  const key = `${path}|${downloadName || ''}`;
  const hit = urlCache.get(key);
  if (hit && hit.until > Date.now()) return hit.url;
  const url = await (await need()).fileUrl(path, downloadName);
  urlCache.set(key, { url, until: Date.now() + 50 * 60 * 1000 });
  return url;
}
export async function markThreadRead(otherId) { await (await need()).markRead(otherId); refreshCounts(); }

/** Letzte Nachricht und ungelesene Zahl pro Person */
export async function conversations() {
  const rows = await (await need()).lastMessages();
  const map = {};
  for (const m of rows) {
    const other = m.sender === user.id ? m.recipient : m.sender;
    if (!map[other]) map[other] = { last: m, unread: 0 };
    if (m.recipient === user.id && !m.read_at) map[other].unread += 1;
  }
  return map;
}

/* ================================================================ Anfeuern */

export async function cheer(otherId) { await (await need()).sendNudge(otherId, 'cheer'); }
export async function shareStreak(otherId) { await (await need()).sendNudge(otherId, 'streak', currentStreak()); }
export async function unseenNudges() {
  const a = await need();
  const list = await a.nudgesUnseen();
  const people = await a.profilesByIds([...new Set(list.map(n => n.sender))]);
  const byId = Object.fromEntries(people.map(p => [p.id, p]));
  return list.map(n => ({ ...n, from: byId[n.sender] })).filter(n => n.from);
}
export async function markNudgesSeen(ids) { await (await need()).markNudgesSeen(ids); refreshCounts(); }

/* ================================================================ Gruppen */

let groupsReady = true;
let groupProfileReady = true;   // false, solange 04-gruppen-profil.sql fehlt
export const groupsAvailable = () => groupsReady;
export const groupProfileAvailable = () => groupProfileReady;
const missingTable = err => /group|relation .* does not exist|PGRST20[05]|42P01|schema cache/i.test(String(err?.message || err?.code || err));

/** Eigene Gruppen; fehlen die Tabellen (03-gruppen.sql noch nicht ausgefuehrt), leere Liste */
async function safeGroups() {
  if (!groupsReady) return [];
  try {
    return await api.groups();
  } catch (err) {
    if (missingTable(err)) { groupsReady = false; return []; }
    throw err;
  }
}

/** Ungelesene Nachrichten einer Gruppe (von anderen, nach dem letzten Lesen) */
export function groupUnread(g) {
  const since = Date.parse(g.last_read_at || 0);
  return (g.messages || []).filter(m => m.sender !== user?.id && Date.parse(m.created_at) > since).length;
}

export async function loadGroups() {
  await need();
  const list = await safeGroups();
  return list.sort((a, b) => Date.parse(b.messages?.[0]?.created_at || b.created_at) - Date.parse(a.messages?.[0]?.created_at || a.created_at));
}

export async function createGroup(name, memberIds) {
  const a = await need();
  const clean = name.trim().slice(0, 40);
  if (!clean) throw new Error(t('Gib der Gruppe einen Namen.', 'Give the group a name.'));
  const g = await a.createGroup(clean);
  if (memberIds.length) await a.addGroupMembers(g.id, memberIds);
  refreshCounts();
  return g;
}

export async function groupDetails(gid) {
  const a = await need();
  const [info, members] = await Promise.all([a.groupInfo(gid), a.groupMembers(gid)]);
  if (!info) return null;
  const people = await a.profilesByIds(members.map(m => m.user_id));
  const byId = Object.fromEntries(people.map(p => [p.id, p]));
  return { ...info, members: members.map(m => ({ ...m, profile: byId[m.user_id] })).filter(m => m.profile) };
}

export async function addGroupMembers(gid, ids) { await (await need()).addGroupMembers(gid, ids); }
export async function removeGroupMember(gid, userId) { await (await need()).removeGroupMember(gid, userId); refreshCounts(); }
export async function leaveGroup(gid) { await (await need()).removeGroupMember(gid, user.id); refreshCounts(); }
/** Name, Bio, Gruppenbild und Banner (Bilder als verkleinerte JPEG-data-URL wie beim Profil) */
export async function updateGroupProfile(gid, { name, bio, avatar, banner }) {
  const clean = String(name || '').trim().slice(0, 40);
  if (!clean) throw new Error(t('Gib der Gruppe einen Namen.', 'Give the group a name.'));
  const fields = { name: clean };
  if (groupProfileReady) Object.assign(fields, { bio: String(bio || '').trim().slice(0, 160), avatar: avatar || null, banner: banner || null });
  await (await need()).updateGroup(gid, fields);
}
export const renameGroup = (gid, name) => updateGroupProfile(gid, { name });
export async function setGroupRole(gid, userId, role) {
  if (!groupProfileReady) throw new Error(t('Admins gehen erst, wenn der Betreiber supabase/04-gruppen-profil.sql ausgeführt hat.', 'Admins only work once the operator has run supabase/04-gruppen-profil.sql.'));
  await (await need()).setGroupRole(gid, userId, role === 'admin' ? 'admin' : 'member');
}
export const loadGroupThread = async gid => (await need()).groupMessages(gid);
export async function sendGroupMessage(gid, body, attachment = null) {
  const text = body.trim().slice(0, 1000);
  if (!text && !attachment) throw new Error(t('Leere Nachricht.', 'Empty message.'));
  return (await need()).sendGroup(gid, text, attachment);
}
export async function sendGroupAttachment(gid, file, body = '') {
  if (!ATTACH_TYPES.includes(file.type)) throw new Error(t('Dieser Dateityp geht nicht. Erlaubt: Bilder, PDF, Text und ZIP.', 'This file type is not allowed. Allowed: images, PDF, text and ZIP.'));
  const ready = await shrinkImage(file);
  if (ready.size > ATTACH_MAX) throw new Error(t('Die Datei ist größer als 5 MB.', 'The file is larger than 5 MB.'));
  const a = await need();
  const name = safeName(ready.name);
  const path = await a.uploadGroup(gid, ready, name);
  return sendGroupMessage(gid, body, { path, name: (ready.name || name).slice(0, 120), type: ready.type, size: ready.size });
}
export async function markGroupRead(gid) { await (await need()).markGroupRead(gid); refreshCounts(); }
