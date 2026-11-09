-- =====================================================================
-- Bitweg, Erweiterung 3: Gruppenchats (Text, Bilder, Dateien)
-- Einmal im Supabase SQL Editor ausfuehren (nach schema.sql und 02-anhaenge.sql).
-- Kann gefahrlos erneut ausgefuehrt werden.
--
-- Regeln:
--  - Eine Gruppe gruendet man selbst und ist dann ihr Besitzer.
--  - Mitglieder duerfen nur eigene FREUNDE hinzufuegen.
--  - Lesen und schreiben duerfen nur Mitglieder.
--  - Jeder kann austreten. Der Besitzer kann Mitglieder entfernen und umbenennen.
--  - Dateien liegen im Bucket "chat" unter g/<gruppe>/<absender>/...
-- =====================================================================

create table if not exists public.groups (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(btrim(name)) between 1 and 40),
  owner      uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id     uuid not null references public.groups (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  added_by     uuid references public.profiles (id) on delete set null,
  joined_at    timestamptz not null default now(),
  last_read_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index if not exists group_members_user on public.group_members (user_id);

create table if not exists public.group_messages (
  id         bigint generated always as identity primary key,
  group_id   uuid not null references public.groups (id) on delete cascade,
  sender     uuid not null references public.profiles (id) on delete cascade,
  body       text not null default '',
  attachment jsonb,
  created_at timestamptz not null default now(),
  check (char_length(body) <= 1000 and (char_length(btrim(body)) >= 1 or attachment is not null)),
  check (attachment is null or (
    attachment ? 'path' and attachment ? 'name' and attachment ? 'type' and attachment ? 'size'
    and (attachment ->> 'size')::bigint between 1 and 5242880
    and char_length(attachment ->> 'name') <= 120
    and (attachment ->> 'type') in ('image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/zip')
    and (attachment ->> 'path') like ('g/' || group_id::text || '/' || sender::text || '/%')
  ))
);
create index if not exists group_messages_group on public.group_messages (group_id, created_at desc);

-- ---------------------------------------------------------------- Hilfsfunktionen

create or replace function public.is_group_member(g uuid, u uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.group_members where group_id = g and user_id = u);
$$;

create or replace function public.is_group_owner(g uuid, u uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.groups where id = g and owner = u);
$$;

-- Wer eine Gruppe anlegt, ist automatisch Mitglied
create or replace function public.group_add_owner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.group_members (group_id, user_id, added_by) values (new.id, new.owner, new.owner);
  return new;
end;
$$;
drop trigger if exists groups_add_owner on public.groups;
create trigger groups_add_owner after insert on public.groups
  for each row execute function public.group_add_owner();

-- Hoechstens 30 Mitglieder pro Gruppe
create or replace function public.group_limit_members() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.group_members where group_id = new.group_id) >= 30 then
    raise exception 'Die Gruppe ist voll (30 Mitglieder).';
  end if;
  return new;
end;
$$;
drop trigger if exists group_members_limit on public.group_members;
create trigger group_members_limit before insert on public.group_members
  for each row execute function public.group_limit_members();

-- Spam-Bremse: hoechstens 20 Gruppennachrichten pro Minute
create or replace function public.limit_group_messages() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.group_messages
      where sender = new.sender and created_at > now() - interval '1 minute') >= 20 then
    raise exception 'Zu viele Nachrichten. Warte kurz.';
  end if;
  return new;
end;
$$;
drop trigger if exists group_messages_limit on public.group_messages;
create trigger group_messages_limit before insert on public.group_messages
  for each row execute function public.limit_group_messages();

-- Verlaesst der Besitzer die Gruppe, wird das aelteste andere Mitglied Besitzer.
-- Ist niemand mehr da, wird die Gruppe geloescht.
create or replace function public.group_after_leave() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  nxt uuid;
begin
  if exists (select 1 from public.groups where id = old.group_id and owner = old.user_id) then
    select user_id into nxt from public.group_members where group_id = old.group_id order by joined_at limit 1;
    if nxt is null then
      delete from public.groups where id = old.group_id;
    else
      update public.groups set owner = nxt where id = old.group_id;
    end if;
  elsif not exists (select 1 from public.group_members where group_id = old.group_id) then
    delete from public.groups where id = old.group_id;
  end if;
  return old;
end;
$$;
drop trigger if exists group_members_after_leave on public.group_members;
create trigger group_members_after_leave after delete on public.group_members
  for each row execute function public.group_after_leave();

-- ---------------------------------------------------------------- Zugriffsregeln

alter table public.groups         enable row level security;
alter table public.group_members  enable row level security;
alter table public.group_messages enable row level security;

drop policy if exists groups_read on public.groups;
create policy groups_read on public.groups for select to authenticated
  using (public.is_group_member(id, auth.uid()) or owner = auth.uid());
drop policy if exists groups_create on public.groups;
create policy groups_create on public.groups for insert to authenticated
  with check (owner = auth.uid());
drop policy if exists groups_rename on public.groups;
create policy groups_rename on public.groups for update to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid());
drop policy if exists groups_delete on public.groups;
create policy groups_delete on public.groups for delete to authenticated
  using (owner = auth.uid());

drop policy if exists group_members_read on public.group_members;
create policy group_members_read on public.group_members for select to authenticated
  using (public.is_group_member(group_id, auth.uid()));
drop policy if exists group_members_add on public.group_members;
create policy group_members_add on public.group_members for insert to authenticated
  with check (
    added_by = auth.uid()
    and public.is_group_member(group_id, auth.uid())
    and public.are_friends(auth.uid(), user_id)
    and not public.is_blocked(auth.uid(), user_id)
  );
drop policy if exists group_members_leave on public.group_members;
create policy group_members_leave on public.group_members for delete to authenticated
  using (user_id = auth.uid() or public.is_group_owner(group_id, auth.uid()));
drop policy if exists group_members_read_mark on public.group_members;
create policy group_members_read_mark on public.group_members for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists group_messages_read on public.group_messages;
create policy group_messages_read on public.group_messages for select to authenticated
  using (public.is_group_member(group_id, auth.uid()));
drop policy if exists group_messages_send on public.group_messages;
create policy group_messages_send on public.group_messages for insert to authenticated
  with check (sender = auth.uid() and public.is_group_member(group_id, auth.uid()));

-- Spalten-Rechte: nur Name aendern, nur eigene Gelesen-Markierung
revoke all on public.groups, public.group_members, public.group_messages from anon;
revoke update on public.groups from authenticated;
grant update (name) on public.groups to authenticated;
revoke update on public.group_members from authenticated;
grant update (last_read_at) on public.group_members to authenticated;
revoke update, delete on public.group_messages from authenticated;

-- ---------------------------------------------------------------- Dateien im Bucket "chat"

drop policy if exists group_files_upload on storage.objects;
create policy group_files_upload on storage.objects for insert to authenticated
  with check (
    bucket_id = 'chat'
    and (storage.foldername(name))[1] = 'g'
    and (storage.foldername(name))[3] = auth.uid()::text
    and public.is_group_member(public.try_uuid((storage.foldername(name))[2]), auth.uid())
  );

drop policy if exists group_files_read on storage.objects;
create policy group_files_read on storage.objects for select to authenticated
  using (
    bucket_id = 'chat'
    and (storage.foldername(name))[1] = 'g'
    and public.is_group_member(public.try_uuid((storage.foldername(name))[2]), auth.uid())
  );

-- ---------------------------------------------------------------- Live-Updates

do $$
begin
  begin alter publication supabase_realtime add table public.group_messages; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.group_members;  exception when duplicate_object then null; end;
end;
$$;
