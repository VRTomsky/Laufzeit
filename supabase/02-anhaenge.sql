-- =====================================================================
-- Laufzeit, Erweiterung 2: Bilder und Dateien im Chat
-- Einmal im Supabase SQL Editor ausfuehren (nach schema.sql). Kann erneut laufen.
--
-- Dateien liegen im privaten Speicher-Bucket "chat" unter
--   <absender-id>/<empfaenger-id>/<zufall>-<dateiname>
-- Hochladen duerfen nur Freunde, lesen nur Absender und Empfaenger.
-- Hoechstens 5 MB, nur Bilder, PDF, Text und ZIP.
-- =====================================================================

-- Nachrichten bekommen ein optionales Anhang-Feld
alter table public.messages add column if not exists attachment jsonb;

-- Text darf leer sein, wenn ein Anhang dabei ist
alter table public.messages drop constraint if exists messages_body_check;
alter table public.messages drop constraint if exists messages_content_check;
alter table public.messages add constraint messages_content_check check (
  char_length(body) <= 1000
  and (char_length(btrim(body)) >= 1 or attachment is not null)
);

alter table public.messages drop constraint if exists messages_attachment_check;
alter table public.messages add constraint messages_attachment_check check (
  attachment is null or (
    attachment ? 'path' and attachment ? 'name' and attachment ? 'type' and attachment ? 'size'
    and (attachment ->> 'size')::bigint between 1 and 5242880
    and char_length(attachment ->> 'name') <= 120
    and (attachment ->> 'type') in ('image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/zip')
    and (attachment ->> 'path') like (sender::text || '/' || recipient::text || '/%')
  )
);

-- Privater Bucket mit Groessen- und Typgrenze
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat', 'chat', false, 5242880,
        array['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/zip'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Ordnername als UUID lesen, ohne bei Unsinn einen Fehler zu werfen
create or replace function public.try_uuid(t text) returns uuid
language plpgsql immutable as $$
begin
  return t::uuid;
exception when others then
  return null;
end;
$$;

drop policy if exists chat_upload on storage.objects;
create policy chat_upload on storage.objects for insert to authenticated
  with check (
    bucket_id = 'chat'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.are_friends(auth.uid(), public.try_uuid((storage.foldername(name))[2]))
    and not public.is_blocked(auth.uid(), public.try_uuid((storage.foldername(name))[2]))
  );

drop policy if exists chat_read on storage.objects;
create policy chat_read on storage.objects for select to authenticated
  using (
    bucket_id = 'chat'
    and auth.uid()::text in ((storage.foldername(name))[1], (storage.foldername(name))[2])
  );

drop policy if exists chat_delete on storage.objects;
create policy chat_delete on storage.objects for delete to authenticated
  using (bucket_id = 'chat' and (storage.foldername(name))[1] = auth.uid()::text);
