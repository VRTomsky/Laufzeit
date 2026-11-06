-- =====================================================================
-- Laufzeit: Datenbank fuer Konten, Profile, Freunde, Nachrichten
-- Einmal komplett im Supabase SQL Editor ausfuehren (New query, einfuegen, Run).
-- Kann gefahrlos erneut ausgefuehrt werden.
--
-- Grundregel: Row Level Security (RLS) ist auf jeder Tabelle an.
-- Die Datenbank selbst entscheidet, wer was lesen und schreiben darf,
-- nicht die Webseite. Der oeffentliche "anon key" kann also nichts verraten.
-- =====================================================================

-- ---------------------------------------------------------------- Tabellen

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  name        text not null default '' check (char_length(name) <= 40),
  bio         text not null default '' check (char_length(bio) <= 160),
  avatar      text check (avatar is null or (char_length(avatar) < 150000 and avatar ~ '^data:image/jpeg;base64,[A-Za-z0-9+/=]+$')),
  banner      text check (banner is null or (char_length(banner) < 600000 and banner ~ '^data:image/jpeg;base64,[A-Za-z0-9+/=]+$')),
  xp          integer not null default 0 check (xp >= 0),
  streak      integer not null default 0 check (streak >= 0),
  last_active date,
  summary     jsonb not null default '{}'::jsonb check (pg_column_size(summary) < 16000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Kompletter Lernstand, nur fuer den Besitzer
create table if not exists public.progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  state      jsonb not null check (pg_column_size(state) < 3000000),
  updated_at timestamptz not null default now()
);

create table if not exists public.friendships (
  requester  uuid not null references public.profiles (id) on delete cascade,
  addressee  uuid not null references public.profiles (id) on delete cascade,
  status     text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  primary key (requester, addressee),
  check (requester <> addressee)
);
-- pro Paar nur eine Zeile, egal wer angefragt hat
create unique index if not exists friendships_pair
  on public.friendships (least(requester, addressee), greatest(requester, addressee));

create table if not exists public.blocks (
  blocker    uuid not null references public.profiles (id) on delete cascade,
  blocked    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked),
  check (blocker <> blocked)
);

create table if not exists public.messages (
  id         bigint generated always as identity primary key,
  sender     uuid not null references public.profiles (id) on delete cascade,
  recipient  uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now(),
  read_at    timestamptz
);
create index if not exists messages_pair on public.messages (sender, recipient, created_at desc);
create index if not exists messages_inbox on public.messages (recipient, read_at);

-- Anfeuern und Serie teilen
create table if not exists public.nudges (
  id         bigint generated always as identity primary key,
  sender     uuid not null references public.profiles (id) on delete cascade,
  recipient  uuid not null references public.profiles (id) on delete cascade,
  kind       text not null check (kind in ('cheer', 'streak')),
  streak     integer check (streak is null or streak between 0 and 100000),
  created_at timestamptz not null default now(),
  seen_at    timestamptz
);
create index if not exists nudges_inbox on public.nudges (recipient, seen_at);

-- Meldungen landen hier. Lesen kann sie nur der Admin im Supabase-Dashboard.
create table if not exists public.reports (
  id         bigint generated always as identity primary key,
  reporter   uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  reported   uuid not null references public.profiles (id) on delete cascade,
  reason     text not null check (char_length(reason) between 1 and 500),
  message_id bigint references public.messages (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- Hilfsfunktionen

create or replace function public.is_blocked(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.blocks
    where (blocker = a and blocked = b) or (blocker = b and blocked = a)
  );
$$;

create or replace function public.are_friends(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.friendships
    where status = 'accepted'
      and ((requester = a and addressee = b) or (requester = b and addressee = a))
  );
$$;

-- Fuer die Registrierung: ist der Benutzername frei? (auch ohne Login aufrufbar)
create or replace function public.username_available(name text) returns boolean
language sql stable security definer set search_path = public as $$
  select name ~ '^[a-z0-9_]{3,20}$'
     and not exists (select 1 from public.profiles where username = name);
$$;

-- Neues Konto: Profil mit dem Benutzernamen aus der Registrierung anlegen
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, name)
  values (
    new.id,
    lower(new.raw_user_meta_data ->> 'username'),
    coalesce(left(new.raw_user_meta_data ->> 'name', 40), '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at automatisch setzen
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
drop trigger if exists progress_touch on public.progress;
create trigger progress_touch before update on public.progress
  for each row execute function public.touch_updated_at();

-- Spam-Bremse: hoechstens 20 Nachrichten pro Minute
create or replace function public.limit_messages() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.messages
      where sender = new.sender and created_at > now() - interval '1 minute') >= 20 then
    raise exception 'Zu viele Nachrichten. Warte kurz.';
  end if;
  return new;
end;
$$;
drop trigger if exists messages_limit on public.messages;
create trigger messages_limit before insert on public.messages
  for each row execute function public.limit_messages();

-- Anfeuern: dieselbe Art hoechstens einmal pro Stunde an dieselbe Person
create or replace function public.limit_nudges() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.nudges
             where sender = new.sender and recipient = new.recipient and kind = new.kind
               and created_at > now() - interval '1 hour') then
    raise exception 'Schon geschickt. In einer Stunde wieder.';
  end if;
  return new;
end;
$$;
drop trigger if exists nudges_limit on public.nudges;
create trigger nudges_limit before insert on public.nudges
  for each row execute function public.limit_nudges();

-- Blockieren beendet die Freundschaft
create or replace function public.block_cleanup() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from public.friendships
  where (requester = new.blocker and addressee = new.blocked)
     or (requester = new.blocked and addressee = new.blocker);
  return new;
end;
$$;
drop trigger if exists blocks_cleanup on public.blocks;
create trigger blocks_cleanup after insert on public.blocks
  for each row execute function public.block_cleanup();

-- Konto komplett loeschen (Profil, Stand, Nachrichten, Freunde)
create or replace function public.delete_account() returns void
language sql security definer set search_path = public as $$
  delete from auth.users where id = auth.uid();
$$;

-- ---------------------------------------------------------------- Zugriffsregeln

alter table public.profiles    enable row level security;
alter table public.progress    enable row level security;
alter table public.friendships enable row level security;
alter table public.blocks      enable row level security;
alter table public.messages    enable row level security;
alter table public.nudges      enable row level security;
alter table public.reports     enable row level security;

-- Profile: eingeloggte Nutzer sehen Profile (fuer Suche und Freunde), ausser bei Blockierung
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated
  using (not public.is_blocked(auth.uid(), id));
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Lernstand: nur der Besitzer
drop policy if exists progress_own on public.progress;
create policy progress_own on public.progress for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Freundschaften
drop policy if exists friends_read on public.friendships;
create policy friends_read on public.friendships for select to authenticated
  using (auth.uid() in (requester, addressee));
drop policy if exists friends_request on public.friendships;
create policy friends_request on public.friendships for insert to authenticated
  with check (requester = auth.uid() and status = 'pending' and not public.is_blocked(requester, addressee));
drop policy if exists friends_accept on public.friendships;
create policy friends_accept on public.friendships for update to authenticated
  using (addressee = auth.uid() and status = 'pending')
  with check (addressee = auth.uid() and status = 'accepted');
drop policy if exists friends_remove on public.friendships;
create policy friends_remove on public.friendships for delete to authenticated
  using (auth.uid() in (requester, addressee));

-- Blockieren: nur die eigene Liste
drop policy if exists blocks_own on public.blocks;
create policy blocks_own on public.blocks for all to authenticated
  using (blocker = auth.uid()) with check (blocker = auth.uid());

-- Nachrichten: nur zwischen Freunden, lesen nur Absender und Empfaenger
drop policy if exists messages_read on public.messages;
create policy messages_read on public.messages for select to authenticated
  using (auth.uid() in (sender, recipient));
drop policy if exists messages_send on public.messages;
create policy messages_send on public.messages for insert to authenticated
  with check (sender = auth.uid() and public.are_friends(sender, recipient) and not public.is_blocked(sender, recipient));
drop policy if exists messages_mark_read on public.messages;
create policy messages_mark_read on public.messages for update to authenticated
  using (recipient = auth.uid()) with check (recipient = auth.uid());

-- Anfeuern: genauso
drop policy if exists nudges_read on public.nudges;
create policy nudges_read on public.nudges for select to authenticated
  using (auth.uid() in (sender, recipient));
drop policy if exists nudges_send on public.nudges;
create policy nudges_send on public.nudges for insert to authenticated
  with check (sender = auth.uid() and public.are_friends(sender, recipient) and not public.is_blocked(sender, recipient));
drop policy if exists nudges_mark_seen on public.nudges;
create policy nudges_mark_seen on public.nudges for update to authenticated
  using (recipient = auth.uid()) with check (recipient = auth.uid());

-- Melden: jeder darf melden, niemand darf Meldungen ueber die Webseite lesen
drop policy if exists reports_send on public.reports;
create policy reports_send on public.reports for insert to authenticated
  with check (reporter = auth.uid());

-- ---------------------------------------------------------------- Rechte pro Spalte

-- Nicht eingeloggte Besucher duerfen nichts ausser den Benutzernamen pruefen
revoke all on public.profiles, public.progress, public.friendships, public.blocks,
  public.messages, public.nudges, public.reports from anon;

-- Beim Bearbeiten nur die freigegebenen Spalten (z. B. nicht id oder created_at)
revoke update on public.profiles from authenticated;
grant update (username, name, bio, avatar, banner, xp, streak, last_active, summary) on public.profiles to authenticated;
-- Annehmen aendert nur den Status, nicht wer mit wem befreundet ist
revoke update on public.friendships from authenticated;
grant update (status) on public.friendships to authenticated;
-- Gelesen-Markierung ist das einzige, was der Empfaenger aendern darf
revoke update on public.messages from authenticated;
grant update (read_at) on public.messages to authenticated;
revoke update on public.nudges from authenticated;
grant update (seen_at) on public.nudges to authenticated;
revoke update, delete on public.reports from authenticated;

revoke execute on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
grant execute on function public.username_available(text) to anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ---------------------------------------------------------------- Live-Updates

-- Neue Nachrichten, Anfragen und Anfeuern sofort anzeigen (Realtime beachtet die Regeln oben)
do $$
begin
  begin alter publication supabase_realtime add table public.messages;    exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.nudges;      exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.friendships; exception when duplicate_object then null; end;
end;
$$;
