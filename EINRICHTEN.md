# Konten einrichten (einmalig, ca. 10 Minuten)

Damit Registrieren, Freunde und Nachrichten funktionieren, braucht Bitweg eine Datenbank. Dafür nutzen wir **Supabase** (kostenlos für kleine Projekte).

## 1. Supabase-Konto und Projekt

1. Geh auf **https://supabase.com** und klick **Start your project**.
2. **Continue with GitHub** (mit deinem GitHub-Konto VRTomsky).
3. **New project**:
   - Name: `laufzeit`
   - Database Password: auf **Generate a password** klicken. Das Passwort brauchst du für Bitweg nicht, gib es niemandem.
   - Region: **Central EU (Frankfurt)**
   - Plan: **Free**
4. **Create new project**, dann 1 bis 2 Minuten warten.

## 2. Datenbank anlegen

1. Links **SQL Editor** öffnen, **New query**.
2. Den kompletten Inhalt der Datei `supabase/schema.sql` hineinkopieren.
3. **Run** klicken. Unten muss stehen: *Success. No rows returned*.

## 3. Anmeldung einstellen

1. Links **Authentication**, dann **Sign In / Providers**, dann **Email**:
   - **Enable Email provider**: an
   - **Confirm email**: **aus** (empfohlen)
   - Speichern.

   Warum aus? Supabase schickt kostenlos nur sehr wenige E-Mails pro Stunde. Mit „aus“ funktioniert die Registrierung sofort, ohne Bestätigungsmail. „Passwort vergessen“ schickt trotzdem eine E-Mail.
2. **Authentication**, dann **URL Configuration**:
   - **Site URL**: `https://bitweg.de/`
   - **Redirect URLs** hinzufügen:
     - `https://bitweg.de/`
     - `http://127.0.0.1:5741/`

## 4. Zugangsdaten an Claude geben

1. Links **Project Settings** (Zahnrad), dann **API Keys** bzw. **Data API**.
2. Diese zwei Werte kopieren:
   - **Project URL**, sieht aus wie `https://abcdefgh.supabase.co`
   - **anon public** Key (unter „Legacy API Keys“) oder **Publishable key** (`sb_publishable_...`)
3. Beide Claude schicken. Die trägt Claude in `app/js/config.js` ein.

**Niemals** den Key **service_role** oder **secret** weitergeben oder irgendwo eintragen. Der hat alle Rechte. Der „anon“- bzw. „publishable“-Key ist dagegen für Webseiten gedacht und darf öffentlich sein. Was er darf, regeln die Zugriffsregeln aus `schema.sql`.

## 5. Bilder und Dateien im Chat (Erweiterung)

1. **SQL Editor**, **New query**.
2. Inhalt von `supabase/02-anhaenge.sql` einfügen, **Run**.
3. Fertig. Der private Speicher „chat“ wird dabei automatisch angelegt (max. 5 MB pro Datei, nur Bilder, PDF, Text, ZIP). Dateien sehen nur Absender und Empfänger.

## 6. Gruppenchats (Erweiterung)

Erst nach Schritt 5 ausführen, die Gruppen nutzen denselben Speicher.

1. **SQL Editor**, **New query**.
2. Inhalt von `supabase/03-gruppen.sql` einfügen, **Run**.
3. Fertig. Unter **Freunde** erscheint oben „Gruppen“ mit dem Knopf „Neue Gruppe“. Regeln: nur eigene Freunde hinzufügen, höchstens 30 Mitglieder, lesen und schreiben nur Mitglieder. Wer eine Gruppe gründet, kann sie umbenennen und Mitglieder entfernen.

Solange 03 nicht ausgeführt ist, zeigt die App statt der Gruppen einen Hinweis. Der normale Chat läuft trotzdem.

## 7. Gruppenbild, Banner, Bio und Admins (Erweiterung)

Erst nach Schritt 6 ausführen.

1. **SQL Editor**, **New query**.
2. Inhalt von `supabase/04-gruppen-profil.sql` einfügen, **Run**.
3. Fertig. In einer Gruppe oben auf den Namen tippen: Wer die Gruppe gegründet hat, kann Mitglieder **zum Admin** machen. Gründer und Admins können Gruppenbild, Banner, Name und Bio ändern. Admins können normale Mitglieder entfernen, Admins entfernen kann nur der Gründer.

Ohne 04 laufen Gruppen weiter wie bisher, nur ohne Bild, Bio und Admins.

## E-Mail und Passwort ändern

Geht in der App unter **Profil → Konto**, jeweils mit dem aktuellen Passwort. Bei einer neuen E-Mail schickt Supabase Bestätigungs-Links (meist an alte und neue Adresse). Wie viele Mails pro Stunde rausgehen, hängt am E-Mail-Versand: Mit dem eingebauten Supabase-Versand sind es nur wenige, mit eigenem SMTP (Authentication → Emails → SMTP Settings) deutlich mehr.

## Danach: Admin-Aufgaben

- **Meldungen ansehen:** Supabase, **Table Editor**, Tabelle `reports`. Dort steht, wer wen warum gemeldet hat.
- **Nutzer sperren oder löschen:** **Authentication**, **Users**, beim Nutzer auf die drei Punkte.
- **Passwort für jemanden zurücksetzen:** Bei **Authentication**, **Users** „Send password recovery“.
