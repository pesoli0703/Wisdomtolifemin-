# Wisdom To Life Ministry

A responsive, multi-page church website built with Next.js 15, React 19, TypeScript, Tailwind CSS v4, Supabase, Lucide icons, Resend and Flutterwave.

## Pages and features

- Home, About, Ministries, Events (list and calendar), event details/registration, Sermons (search and individual video/audio pages), Gallery (category filtering/lightbox), Give/verified payment callback, Contact, private Prayer Request.
- Admin area for settings/content, ministries, events, sermons, gallery, leadership, contact enquiries, private prayer requests and donation records.
- Supabase Auth + `wtlm_admins` membership check; RLS policies; `wtlm-gallery` Storage bucket.
- Server-side email delivery using Resend and server-side Flutterwave initiation/verification/webhook handling. No successful payment is recorded without a server-side verification response that matches reference, amount and currency.
- Content gracefully falls back to editable sample defaults. Bracketed content is a placeholder, not a claim of real church details.

## Run locally

```bash
npm install
cp .env.example .env.local
# Fill in environment values (see SETUP.md)
npm run dev
```

## Important project separation note

The Supabase organization had reached its free-project limit when this site was provisioned. The initial schema and seed content were therefore applied inside an existing shared Supabase project using exclusively `wtlm_`-prefixed database tables/functions/policies and a `wtlm-gallery` bucket. The site does not use or modify the other application's tables or shared auth hooks. See `SETUP.md` for how to move to a dedicated project later.

## Before production

Set real contact/location/service information, ministry leadership, statement of faith and history through **Admin → Site settings**. Configure Resend with an approved sender/domain and Flutterwave with live credentials and webhook URL before representing those integrations as operational. The current repository environment is local only; production must be configured independently in Vercel.

See [SETUP.md](./SETUP.md) for database, credentials, admin login, deployment and testing guidance.
