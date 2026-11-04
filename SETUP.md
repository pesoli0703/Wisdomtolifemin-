# Setup and operations

## 1. Supabase project and schema

The SQL migrations are in `supabase/migrations/`:

- `0001_initial_schema.sql` creates the namespaced `wtlm_*` tables, functions, RLS policies and Storage policies/bucket.
- `0002_seed.sql` inserts editable starter content and clearly marked placeholders.

They have already been applied to Supabase project `xwqmfdsfmalxsirojuwi` (region `eu-west-1`). **This is currently an existing shared project**, not a dedicated project for this site: the organization's free-project limit blocked project creation. Everything created for this site uses `wtlm_` names and bucket `wtlm-gallery`; do not rename, drop, or modify unprefixed tables/functions or other apps' data. The site uses no shared auth trigger.

If installing into a dedicated Supabase project later, apply both migrations in order using the SQL editor or Supabase CLI (`supabase db push` after linking the new project). Check the SQL and project ref before applying. Supabase Auth email/password provider must be enabled. Add the production website's URLs under Authentication → URL Configuration and configure SMTP if you want Supabase auth emails.

## 2. Environment variables

Copy `.env.example` to `.env.local` and fill values. Never commit `.env.local` or put the service role, Resend secret, Flutterwave secret or webhook hash in a `NEXT_PUBLIC_` variable.

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: browser-safe project URL and anon/publishable key.
- `SUPABASE_SERVICE_ROLE_KEY`: server-side-only service role key; needed by contact/prayer/newsletter/payment routes. It bypasses RLS, so never expose it in browser code.
- `MINISTRY_EMAIL`: defaults to `Wisdomtolifemin@gmail.com`.
- `RESEND_API_KEY`, `EMAIL_FROM`: Resend key and a sender verified in Resend. The recipient is the official ministry email by default. Resend must be configured before email notifications actually deliver.
- `FLW_SECRET_KEY`: Flutterwave secret key (server only); `FLW_WEBHOOK_HASH`: webhook verification secret; `NEXT_PUBLIC_FLW_PUBLIC_KEY`: public key if client-side Flutterwave functionality is ever added (current flow uses hosted checkout).
- `NEXT_PUBLIC_SITE_URL`: canonical public origin. For production callback URLs set this to the Vercel domain.

For Vercel, add these under Project → Settings → Environment Variables for Preview/Production. Do not assume local `.env.local` values are available in Vercel.

## 3. Admin account

An initial Auth account has been created for `Wisdomtolifemin@gmail.com` and manually added to `public.wtlm_admins` (there is intentionally no auth user trigger). The temporary password was provided during setup. **Sign in at `/admin/login` and change it immediately** using Supabase Auth / the Supabase dashboard; use a long unique password. In a dedicated future project, create the auth user first, then insert that exact `auth.users.id` into `public.wtlm_admins` with an optional full name. Do not add users to the admin table unless authorized.

Admin pages require both a valid Supabase session and membership in `wtlm_admins`. Admin data operations use RLS; public visitor queries cannot read private prayer requests or contact records.

## 4. Resend email

1. Create a Resend account and verify the ministry's sending domain.
2. Create an API key; set `RESEND_API_KEY` server-side.
3. Set `EMAIL_FROM` to a sender on the verified domain (for example `Wisdom To Life Ministry <website@yourdomain.org>`).
4. Keep `MINISTRY_EMAIL` as `Wisdomtolifemin@gmail.com` unless the ministry directs otherwise.
5. Test contact and prayer forms after deployment. The site stores these in Supabase before attempting email. If Resend is not configured, forms report the item was stored, not that email was delivered.

## 5. Flutterwave donations

1. Configure a Flutterwave merchant and obtain the appropriate test credentials.
2. Set `FLW_SECRET_KEY` and `FLW_WEBHOOK_HASH`. Never put the secret key in a browser variable.
3. Set the webhook URL in Flutterwave to `https://YOUR_DOMAIN/api/webhooks/flutterwave` and use the same webhook secret hash.
4. Set `NEXT_PUBLIC_SITE_URL` to the deployed canonical URL. Donation initiation records a pending record, then directs donors to Flutterwave-hosted checkout. The callback and webhook verify the reference with Flutterwave and compare status, currency and amount before a record is marked completed.
5. Test in Flutterwave test mode, including cancelled, failed, amount-mismatch and duplicate webhook cases. Use live credentials only after the ministry approves going live.

Donations are **not operational** until merchant credentials and webhook are configured and a complete test has passed. No test/fake donation success is created by this website.

## 6. Content and media

Log in and use Admin → Site settings to replace `[bracketed placeholders]` with confirmed information. Update the pastor welcome, ministry history, doctrinal statement, contact phone/address/maps, social links, service schedule and giving note. Other admin sections provide CRUD for ministries, events, sermons, gallery, leaders and inboxes. Gallery images/videos upload to `wtlm-gallery` (25 MB app-side limit); ensure your Supabase Storage plan and allowed MIME types suit the media you intend to upload.

The seeded ministry descriptions and vision/mission/objectives are generic starter copy, editable by administrators. Pastor's name, history, address, contact numbers, schedule, social accounts and faith statement remain explicit placeholders.

## 7. Deploy to Vercel

1. Import the repository/branch into Vercel.
2. Add production environment variables from `.env.example`.
3. Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS URL.
4. Deploy with the default Next.js build (`npm run build`).
5. Add the production URL and auth callback URLs in Supabase Auth settings.
6. Set Flutterwave webhook URL and verify the Resend sender.
7. Confirm a fresh visitor can browse public pages, submit contact/prayer (only admins can access prayer records), and that unauthorized users are redirected from `/admin`.

## 8. Testing checklist

- `npm run build` and `npx tsc --noEmit`.
- Public navigation, mobile menu, page titles, event calendar/list, sermon search, media lightbox.
- Sign in as authorized admin; verify an ordinary account is refused; test CRUD and Storage upload/delete.
- Submit contact, prayer, newsletter and event registration; verify database rows, email status and private RLS.
- Test Flutterwave hosted checkout and server verification in test mode; verify failed/cancelled/mismatched payments are never completed.
- Test Vercel preview and production URLs (Supabase Auth and Flutterwave callback must use the deployed origin).

## Dedicated project migration later

Once a separate Supabase project is available, create it through the Supabase dashboard/organization when permitted, apply the two migrations, create new project keys, add the same schema, create the initial admin + `wtlm_admins` membership, configure Storage and Auth URLs, copy the relevant content/media if needed, then update Vercel variables. Do not repurpose or delete the existing shared project's objects to achieve separation.
