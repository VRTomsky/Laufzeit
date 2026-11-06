// Konto, Cloud-Speicherung und alles Soziale (Freunde, Nachrichten, Anfeuern).
// Technik: Supabase. Die Datenbank prueft selbst, wer was darf (supabase/schema.sql).
// Ohne eingetragene Zugangsdaten (config.js) bleibt Laufzeit wie bisher rein lokal.

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
let counts = { messages: 0, requests: 0, nudges: 0 };

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
  if (/Invalid login credentials/i.test(m)) return 'E-Mail oder Passwort stimmt nicht.';
  if (/already registered|already been registered/i.test(m)) return 'Für diese E-Mail gibt es schon ein Konto. Log dich ein.';
  if (/Email not confirmed/i.test(m)) return 'Bestätige zuerst deine E-Mail. Der Link steht in deinem Postfach (auch im Spam-Ordner nachsehen).';
  if (/Password should be|password.*(short|characters)/i.test(m)) return 'Das Passwort ist zu kurz. Nimm mindestens 8 Zeichen.';
  if (/weak password|pwned/i.test(m)) return 'Dieses Passwort ist zu leicht zu erraten. Nimm ein anderes.';
  if (/Database error saving new user|duplicate key.*username|profiles_username_key/i.test(m)) return 'Dieser Benutzername ist schon vergeben.';
  if (/rate limit|too many/i.test(m)) return 'Zu viele Versuche gerade. Warte ein paar Minuten.';
  if (/invalid.*email|Unable to validate email/i.test(m)) return 'Diese E-Mail-Adresse sieht nicht richtig aus.';
  if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'Keine Verbindung zum Server. Bist du online?';
  if (/row-level security|violates/i.test(m)) return 'Das ist nicht erlaubt (z. B. nur unter Freunden möglich).';
  if (/same_password|different from the old/i.test(m)) return 'Das neue Passwort muss anders sein als das alte.';
  return m || 'Etwas ist schiefgegangen.';
}

const must = ({ data, error }) => { if (error) throw error; return data; };

/* ================================================================ Supabase-Backend */

async function supabaseBackend() {
  const { createClient } = await import(SUPABASE_JS);
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'laufzeit.auth' },
  });
  const uid = () => user?.id;
  const redirect = () => (IS_WEB ? WEB_URL : `${location.origin}/`);
  const self = {
    async session() {
      const { data } = await sb.auth.getSession();
      return data.session?.user ? { id: data.session.user.id, email: data.session.user.email } : null;
    },
    onAuth(cb) {
      sb.auth.onAuthStateChange((event, session) => {
        // Supabase-Hinweis: im Callback nicht direkt weitere Abfragen starten
        setTimeout(() => cb(event, session?.user ? { id: session.user.id, email: session.user.email } : null), 0);
      });
    },
    async signUp(email, password, username, name) {
      const data = must(await sb.auth.signUp({ email, password, options: { data: { username, name }, emailRedirectTo: redirect() } }));
      return { needsConfirm: !data.session };
    },
    async signIn(email, password) { must(await sb.auth.signInWithPassword({ email, password })); },
    async signOut() { await sb.auth.signOut(); },
    async resetPassword(email) { must(await sb.auth.resetPasswordForEmail(email, { redirectTo: redirect() })); },
    async updatePassword(password) { must(await sb.auth.updateUser({ password })); },
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
      const rows = must(await sb.from('messages').select('id,sender,recipient,body,created_at,read_at')
        .or(`and(sender.eq.${uid()},recipient.eq.${otherId}),and(sender.eq.${otherId},recipient.eq.${uid()})`)
        .order('created_at', { ascending: false }).limit(limit));
      return rows.reverse();
    },
    async lastMessages() {
      return must(await sb.from('messages').select('id,sender,recipient,body,created_at,read_at')
        .order('created_at', { ascending: false }).limit(300));
    },
    async send(otherId, body) {
      return must(await sb.from('messages').insert({ sender: uid(), recipient: otherId, body }).select('id,sender,recipient,body,created_at,read_at').single());
    },
    async markRead(otherId) {
      must(await sb.from('messages').update({ read_at: new Date().toISOString() }).eq('recipient', uid()).eq('sender', otherId).is('read_at', null));
    },
    async unread() { return must(await sb.from('messages').select('sender').eq('recipient', uid()).is('read_at', null)); },
    async nudgesUnseen() { return must(await sb.from('nudges').select('id,sender,kind,streak,created_at').eq('recipient', uid()).is('seen_at', null).order('created_at', { ascending: false }).limit(30)); },
    async sendNudge(otherId, kind, streak = null) { must(await sb.from('nudges').insert({ sender: uid(), recipient: otherId, kind, streak })); },
    async markNudgesSeen(ids) { if (ids.length) must(await sb.from('nudges').update({ seen_at: new Date().toISOString() }).in('id', ids)); },

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
    console.warn('Laufzeit: Cloud-Speichern fehlgeschlagen', err);
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
        title: 'Welchen Stand behalten?',
        text: `In deinem Konto sind ${cloud.xp} XP gespeichert, auf diesem Gerät ${local.xp} XP. Welchen Stand willst du weiter benutzen? Der andere wird überschrieben.`,
        ok: `Konto (${cloud.xp} XP)`,
        cancel: `Dieses Gerät (${local.xp} XP)`,
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
  if (!user) { counts = { messages: 0, requests: 0, nudges: 0 }; emit(); return counts; }
  try {
    const [unread, fr, nudges] = await Promise.all([api.unread(), api.friendships(), api.nudgesUnseen()]);
    counts = {
      messages: unread.length,
      requests: fr.filter(f => f.status === 'pending' && f.addressee === user.id).length,
      nudges: nudges.length,
    };
  } catch {
    // offline: alte Zahlen behalten
  }
  emit();
  return counts;
}

let stopLive = null;
function startLive() {
  stopLive?.();
  stopLive = api.live((kind, row) => {
    liveListeners.forEach(l => l(kind, row));
    if (kind === 'nudge') showNudgeToasts();
    refreshCounts();
  });
}

const nudgeText = (n, who) => (n.kind === 'streak'
  ? `${who} teilt die Serie: ${n.streak} ${n.streak === 1 ? 'Tag' : 'Tage'} in Folge.`
  : `${who} feuert dich an. Zeit für eine Lektion!`);
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
      const who = byId[n.sender]?.name || `@${byId[n.sender]?.username || 'Jemand'}`;
      toast(n.kind === 'streak' ? 'Serie geteilt' : 'Du wirst angefeuert', nudgeText(n, who));
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
      console.warn('Laufzeit: Konto-Dienst nicht erreichbar', err);
      api = null;
      return null;
    }
    user = await api.session();
    if (user) {
      try { await syncAfterLogin(); } catch (err) { console.warn(err); }
      startLive();
      refreshCounts();
      setTimeout(showNudgeToasts, 1500);
    }
    api.onAuth(async (event, u) => {
      if (event === 'PASSWORD_RECOVERY') { location.hash = '#/konto/neues-passwort'; return; }
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
  if (!api) throw new Error('Der Konto-Dienst ist gerade nicht erreichbar.');
  return api;
}

/* ================================================================ Konto */

export async function register({ email, password, username, name }) {
  const a = await need();
  if (!USERNAME_RE.test(username)) throw new Error('Benutzername: 3 bis 20 Zeichen, nur Kleinbuchstaben, Zahlen und _.');
  if (password.length < 8) throw new Error('Das Passwort ist zu kurz. Nimm mindestens 8 Zeichen.');
  if (!(await a.usernameAvailable(username))) throw new Error('Dieser Benutzername ist schon vergeben.');
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
  if (pw.length < 8) throw new Error('Das Passwort ist zu kurz. Nimm mindestens 8 Zeichen.');
  await (await need()).updatePassword(pw);
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
    if (!(await a.usernameAvailable(fields.username))) throw new Error('Dieser Benutzername ist schon vergeben.');
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
export async function sendMessage(otherId, body) {
  const text = body.trim().slice(0, 1000);
  if (!text) throw new Error('Leere Nachricht.');
  return (await need()).send(otherId, text);
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
