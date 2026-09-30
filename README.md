# LetsMove Coach Desk

A desktop-friendly coach portal for the existing LetsMove Supabase backend. Coaches can review their active athlete roster, inspect training zones and planned sessions, and create, edit, or remove planned workouts.

## Run locally

```bash
cp .env.example .env
```

Set either `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, or their `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` equivalents, in `.env`, then run:

```bash
npm install
npm run dev
```

Use the Supabase anon public key only. Do not add a `service_role` key to this website. Coach accounts and athlete assignments must be provisioned in Supabase; this portal does not grant coach access or create assignments.

Apply `supabase/migrations/20260930_coach_portal_profiles.sql` to allow an active coach to read profiles only for athletes with an active assignment. Existing workout row-level security remains responsible for planned-workout access and writes.

## Admin console

Deploy `supabase/functions/admin-portal/index.ts` as an Edge Function named `admin-portal`. In Supabase Dashboard, open **Edge Functions → Secrets** and set `ADMIN_USER_ID` to the one administrator's Auth user UUID. Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are available to the function; the service-role key must remain a server-side secret and must never be added to `.env` or the browser app.

After deploying the function, sign in to the portal with that administrator account. The admin console lists all Auth users, lets the administrator activate or deactivate coach access, and create or remove coach-user assignments. No SQL is needed for these admin actions.

## Coach messaging

Apply `supabase/migrations/20260930_coach_messages.sql` to create the `coach_messages` table, restrict message access to participants in active coach-athlete assignments, and enable Realtime updates. The coach portal's Messages tab shows conversations for the signed-in coach's assigned athletes. To show and send these messages in the mobile app, have it query `coach_messages` as the signed-in athlete and subscribe to changes for that athlete; the mobile app source is not included in this repository.