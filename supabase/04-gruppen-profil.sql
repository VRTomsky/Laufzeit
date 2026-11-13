-- =====================================================================
-- Bitweg, Erweiterung 4: Gruppenbild, Banner, Bio und Admins
-- Einmal im Supabase SQL Editor ausfuehren (nach 03-gruppen.sql).
-- Kann gefahrlos erneut ausgefuehrt werden.
--
-- Regeln:
--  - Wer die Gruppe gegruendet hat (Besitzer), ernennt und entfernt Admins.
--  - Besitzer und Admins aendern Name, Bio, Gruppenbild und Banner.
--  - Admins entfernen normale Mitglieder. Admins entfernen kann nur der Besitzer.
--  - Verlaesst der Besitzer die Gruppe, wird zuerst ein Admin neuer Besitzer.
-- =====================================================================

alter table public.groups add column if not exists bio text not null default '';
alter table public.groups add column if not exists avatar text;
alter table public.groups add column if not exists banner text;

alter table public.groups drop constraint if exists groups_bio_len;
alter table public.groups add constraint groups_bio_len check (char_length(bio) <= 160);
-- Bilder wie beim Profil: verkleinerte JPEGs als data-URL
alter table public.groups drop constraint if exists groups_avatar_ok;
alter table public.groups add constraint groups_avatar_ok check (avatar is null or (char_length(avatar) < 150000 and avatar ~ '^data:image/jpeg;base64,[A-Za-z0-9+/=]+$'));
alter table public.groups drop constraint if exists groups_banner_ok;
alter table public.groups add constraint groups_banner_ok check (banner is null or (char_length(banner) < 600000 and banner ~ '^data:image/jpeg;base64,[A-Za-z0-9+/=]+$'));

alter table public.group_members add column if not exists role text not null default 'member';
alter table public.group_members drop constraint if exists group_members_role_ok;
alter table public.group_members add constraint group_members_role_ok check (role in ('member', 'admin'));

-- ---------------------------------------------------------------- Hilfsfunktion

create or replace function public.is_group_admin(g uuid, u uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.groups where id = g and owner = u)
      or exists (select 1 from public.group_members where group_id = g and user_id = u and role = 'admin');
$$;

-- Rollen aendert nur der Besitzer (auch nicht die eigene Rolle als Mitglied)
create or replace function public.group_guard_role() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_group_owner(old.group_id, auth.uid()) then
    raise exception 'Admins ernennen darf nur, wer die Gruppe gegruendet hat.';
  end if;
  if new.group_id <> old.group_id or new.user_id <> old.user_id then
    raise exception 'Nicht erlaubt.';
  end if;
  return new;
end;
$$;
drop trigger if exists group_members_guard_role on public.group_members;
create trigger group_members_guard_role before update on public.group_members
  for each row execute function public.group_guard_role();

-- Besitzer geht: zuerst ein Admin, sonst das aelteste Mitglied wird Besitzer
create or replace function public.group_after_leave() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  nxt uuid;
begin
  if exists (select 1 from public.groups where id = old.group_id and owner = old.user_id) then
    select user_id into nxt from public.group_members
      where group_id = old.group_id
      order by (role = 'admin') desc, joined_at
      limit 1;
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

-- ---------------------------------------------------------------- Zugriffsregeln

drop policy if exists groups_rename on public.groups;
create policy groups_rename on public.groups for update to authenticated
  using (public.is_group_admin(id, auth.uid())) with check (public.is_group_admin(id, auth.uid()));

-- Austreten: jeder selbst. Admins entfernen normale Mitglieder, der Besitzer alle.
drop policy if exists group_members_leave on public.group_members;
create policy group_members_leave on public.group_members for delete to authenticated
  using (
    user_id = auth.uid()
    or public.is_group_owner(group_id, auth.uid())
    or (public.is_group_admin(group_id, auth.uid()) and role = 'member' and not public.is_group_owner(group_id, user_id))
  );

-- Gelesen-Markierung: eigene Zeile. Rollen: nur der Besitzer (Trigger oben prueft zusaetzlich).
drop policy if exists group_members_read_mark on public.group_members;
create policy group_members_read_mark on public.group_members for update to authenticated
  using (user_id = auth.uid() or public.is_group_owner(group_id, auth.uid()))
  with check (user_id = auth.uid() or public.is_group_owner(group_id, auth.uid()));

-- Spalten-Rechte
revoke update on public.groups from authenticated;
grant update (name, bio, avatar, banner) on public.groups to authenticated;
revoke update on public.group_members from authenticated;
grant update (last_read_at, role) on public.group_members to authenticated;
