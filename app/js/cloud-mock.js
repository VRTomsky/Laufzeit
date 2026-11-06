// Nur zum Testen der Oberflaeche ohne echtes Supabase: Adresse mit ?mock oeffnen.
// Speichert alles im Browser (localStorage 'laufzeit.mockdb'). Erfundene Test-Nutzer.

const KEY = 'laufzeit.mockdb';
const LIGHT = ['id', 'username', 'name', 'avatar', 'xp', 'streak', 'last_active', 'summary'];
const day = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };

function seed() {
  const recent = n => Array.from({ length: n }, (_, i) => day(i));
  const sum = (lang, unit, done, title, week, r) => ({ active: lang, langs: { [lang]: { done, total: 45, unit, units: 15, unitTitle: title, gold: 2, goldUnits: 0, xp: week * 3 } }, recent: r, weekXp: week, best: 9, badges: 6, today: r[0] === day(0) });
  const users = {
    u_mia: { id: 'u_mia', email: 'mia@test.local', password: 'testtest', username: 'mia_codet', name: 'Mia', bio: 'Will ein eigenes Jump and Run bauen.', avatar: null, banner: null, xp: 340, streak: 6, last_active: day(0), summary: sum('python', 5, 14, 'Listen', 120, recent(6)) },
    u_jonas: { id: 'u_jonas', email: 'jonas@test.local', password: 'testtest', username: 'jonas_dev', name: 'Jonas', bio: '', avatar: null, banner: null, xp: 95, streak: 2, last_active: day(1), summary: sum('cpp', 2, 4, 'Variablen und Typen', 60, [day(1), day(2)]) },
    u_lena: { id: 'u_lena', email: 'lena@test.local', password: 'testtest', username: 'lena_lernt', name: 'Lena', bio: 'Schule: Informatik', avatar: null, banner: null, xp: 20, streak: 1, last_active: day(0), summary: sum('python', 1, 1, 'Erste Schritte', 20, [day(0)]) },
  };
  return {
    users,
    progress: {},
    friendships: [
      { requester: 'u_jonas', addressee: 'u_mia', status: 'accepted', created_at: day(5) },
    ],
    blocks: [],
    messages: [],
    nudges: [],
    reports: [],
    seq: 1,
    session: null,
  };
}

export function createMockBackend() {
  let db;
  try { db = JSON.parse(localStorage.getItem(KEY)) || seed(); } catch { db = seed(); }
  const save = () => localStorage.setItem(KEY, JSON.stringify(db));
  const authCbs = [];
  const live = [];
  const uid = () => db.session;
  const light = u => Object.fromEntries(LIGHT.map(k => [k, u[k]]));
  const full = u => (u ? { ...light(u), bio: u.bio, banner: u.banner, created_at: u.created_at || day(30) } : null);
  const fire = (ev, u) => authCbs.forEach(cb => setTimeout(() => cb(ev, u), 0));
  const me = () => db.users[uid()];
  const pair = (a, b) => f => (f.requester === a && f.addressee === b) || (f.requester === b && f.addressee === a);
  const friends = (a, b) => db.friendships.some(f => f.status === 'accepted' && pair(a, b)(f));
  const blocked = (a, b) => db.blocks.some(x => (x.blocker === a && x.blocked === b) || (x.blocker === b && x.blocked === a));
  const delay = v => new Promise(r => setTimeout(() => r(v), 60));

  // Test-Helfer: Mia antwortet automatisch und feuert an
  function botReply(to, from) {
    setTimeout(() => {
      const m = { id: db.seq++, sender: from, recipient: to, body: 'Cool! Ich mach heute auch noch eine Lektion.', created_at: new Date().toISOString(), read_at: null };
      db.messages.push(m);
      save();
      live.forEach(fn => fn('message', m));
    }, 1500);
  }

  return {
    async session() { const u = me(); return delay(u ? { id: u.id, email: u.email } : null); },
    onAuth(cb) { authCbs.push(cb); },
    async signUp(email, password, username, name) {
      if (Object.values(db.users).some(u => u.email === email)) throw new Error('User already registered');
      const id = `u_${Math.random().toString(36).slice(2, 8)}`;
      db.users[id] = { id, email, password, username, name, bio: '', avatar: null, banner: null, xp: 0, streak: 0, last_active: null, summary: {}, created_at: day(0) };
      // die Test-Nutzer schicken gleich eine Anfrage bzw. sind schon befreundet
      db.friendships.push({ requester: 'u_mia', addressee: id, status: 'accepted', created_at: day(0) });
      db.friendships.push({ requester: 'u_jonas', addressee: id, status: 'pending', created_at: day(0) });
      db.messages.push({ id: db.seq++, sender: 'u_mia', recipient: id, body: 'Hey, willkommen bei Laufzeit!', created_at: new Date().toISOString(), read_at: null });
      db.nudges.push({ id: db.seq++, sender: 'u_mia', recipient: id, kind: 'cheer', streak: null, created_at: new Date().toISOString(), seen_at: null });
      db.session = id;
      save();
      fire('SIGNED_IN', { id, email });
      return delay({ needsConfirm: false });
    },
    async signIn(email, password) {
      const u = Object.values(db.users).find(x => x.email === email && x.password === password);
      if (!u) throw new Error('Invalid login credentials');
      db.session = u.id;
      save();
      fire('SIGNED_IN', { id: u.id, email });
      return delay();
    },
    async signOut() { db.session = null; save(); fire('SIGNED_OUT', null); },
    async resetPassword() { return delay(); },
    async updatePassword(pw) { me().password = pw; save(); },
    async deleteAccount() {
      const id = uid();
      delete db.users[id];
      db.friendships = db.friendships.filter(f => f.requester !== id && f.addressee !== id);
      db.messages = db.messages.filter(m => m.sender !== id && m.recipient !== id);
      db.session = null;
      save();
    },
    async usernameAvailable(name) { return delay(/^[a-z0-9_]{3,20}$/.test(name) && !Object.values(db.users).some(u => u.username === name)); },
    async getProgress() { return delay(db.progress[uid()] || null); },
    async putProgress(state) { db.progress[uid()] = { state, updated_at: new Date().toISOString() }; save(); },
    async getProfile(id) { return delay(full(db.users[id])); },
    async getProfileByUsername(username) {
      const u = Object.values(db.users).find(x => x.username === username);
      return delay(u && !blocked(uid(), u.id) ? full(u) : null);
    },
    async updateProfile(fields) {
      if (fields.username && Object.values(db.users).some(u => u.username === fields.username && u.id !== uid())) throw new Error('duplicate key value violates unique constraint "profiles_username_key"');
      Object.assign(me(), fields);
      save();
    },
    async search(q) {
      const clean = q.toLowerCase();
      return delay(Object.values(db.users).filter(u => u.id !== uid() && u.username.includes(clean) && !blocked(uid(), u.id)).map(light));
    },
    async profilesByIds(ids) { return delay(ids.map(id => db.users[id]).filter(Boolean).map(light)); },
    async friendships() { return delay(db.friendships.filter(f => f.requester === uid() || f.addressee === uid())); },
    async request(id) {
      if (blocked(uid(), id) || db.friendships.some(pair(uid(), id))) throw new Error('violates row-level security');
      db.friendships.push({ requester: uid(), addressee: id, status: 'pending', created_at: new Date().toISOString() });
      // Test: Lena nimmt sofort an
      if (id === 'u_lena') setTimeout(() => { const f = db.friendships.find(pair(uid(), id)); if (f) { f.status = 'accepted'; save(); live.forEach(fn => fn('friendship', f)); } }, 1200);
      save();
    },
    async accept(requesterId) { const f = db.friendships.find(x => x.requester === requesterId && x.addressee === uid()); if (f) f.status = 'accepted'; save(); },
    async removeFriend(otherId) { db.friendships = db.friendships.filter(f => !pair(uid(), otherId)(f)); save(); },
    async blocks() { return db.blocks.filter(b => b.blocker === uid()).map(b => b.blocked); },
    async block(id) { db.blocks.push({ blocker: uid(), blocked: id }); db.friendships = db.friendships.filter(f => !pair(uid(), id)(f)); save(); },
    async unblock(id) { db.blocks = db.blocks.filter(b => !(b.blocker === uid() && b.blocked === id)); save(); },
    async report(id, reason, messageId) { db.reports.push({ reporter: uid(), reported: id, reason, message_id: messageId }); save(); },
    async messages(otherId) { return delay(db.messages.filter(m => pair(uid(), otherId)({ requester: m.sender, addressee: m.recipient }))); },
    async lastMessages() { return delay(db.messages.filter(m => m.sender === uid() || m.recipient === uid()).slice().reverse()); },
    async send(otherId, body) {
      if (!friends(uid(), otherId) || blocked(uid(), otherId)) throw new Error('new row violates row-level security policy');
      const m = { id: db.seq++, sender: uid(), recipient: otherId, body, created_at: new Date().toISOString(), read_at: null };
      db.messages.push(m);
      save();
      if (otherId === 'u_mia') botReply(uid(), 'u_mia');
      return delay(m);
    },
    async markRead(otherId) { db.messages.forEach(m => { if (m.recipient === uid() && m.sender === otherId && !m.read_at) m.read_at = new Date().toISOString(); }); save(); },
    async unread() { return delay(db.messages.filter(m => m.recipient === uid() && !m.read_at).map(m => ({ sender: m.sender }))); },
    async nudgesUnseen() { return delay(db.nudges.filter(n => n.recipient === uid() && !n.seen_at).reverse()); },
    async sendNudge(otherId, kind, streak) {
      if (!friends(uid(), otherId)) throw new Error('violates row-level security');
      const hour = Date.now() - 3600e3;
      if (db.nudges.some(n => n.sender === uid() && n.recipient === otherId && n.kind === kind && Date.parse(n.created_at) > hour)) throw new Error('Schon geschickt. In einer Stunde wieder.');
      db.nudges.push({ id: db.seq++, sender: uid(), recipient: otherId, kind, streak, created_at: new Date().toISOString(), seen_at: null });
      save();
    },
    async markNudgesSeen(ids) { db.nudges.forEach(n => { if (ids.includes(n.id)) n.seen_at = new Date().toISOString(); }); save(); },
    live(fn) { live.push(fn); return () => { const i = live.indexOf(fn); if (i >= 0) live.splice(i, 1); }; },
  };
}
