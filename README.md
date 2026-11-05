# Nestora v3 — Self-hosted Intelligent Property Platform

Nestora is a full-stack Next.js real-estate platform with a built-in inbox,
appointment booking, AI assistant, property marketplace, admin workspace, dark mode
and optional PWA support.

## Email without monthly fees

Nestora uses a built-in inbox as the default notification channel.

Optional external email is supported through your own SMTP account:

- Gmail: create an App Password and use `smtp.gmail.com`, port `587`
- SendGrid SMTP: use `smtp.sendgrid.net`, port `587`, with your SendGrid username/API key
- Any SMTP provider you already pay for or use free

If SMTP variables are blank, Nestora does not send external email. It still stores
messages, creates notifications and records automation events.

## Built-in systems

- Contact form API: `/api/contact`
- Admin reply API: `/api/contact/[id]/reply`
- Appointment booking API: `/api/appointments`
- AI chat API: `/api/ai/chat`
- AI listing copy API: `/api/ai/listing-copy`
- Dashboard inbox with Inbox, Bookings and AI Assistant tabs
- Appointment requests with confirm/decline workflow
- AI productivity assistant with local fallback and optional hosted AI
- Dark/light toggle with saved preference
- Installable PWA with offline fallback
- Company workspaces with owner, admin, manager, agent, and viewer roles
- Workspace listings and a shared CRM for property enquiries and viewing requests
- Lead assignment, status pipeline, and activity notes
- Weekly viewing availability with time zones, daily limits, and booking buffers

## Workspaces, CRM, and viewing availability

Sign in and open **Dashboard → Workspaces and team** to create a company workspace.
Workspace owners and admins can add existing Nestora users and manage their roles.
Listings can be assigned to a workspace when they are created or edited. Workspace
members see its leads in **Open team CRM**, where they can update pipeline status,
assign leads to teammates, and keep an activity timeline.

Property enquiries and viewing requests create CRM leads automatically. Agents can
edit weekly availability from **Dashboard → Manage viewing availability**. New
agents without custom hours start with Monday–Friday, 9:00 AM–5:00 PM in
`Africa/Lagos`; save custom hours and an IANA time zone to replace that default.
Bookers see available 30-minute slots for the next 14 days. The server validates
each slot again, applies the agent's booking buffer and daily limit, and rejects
overlapping requests.

## Local setup

```bash
npm install
cp .env.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Put the generated value in AUTH_SECRET in .env
npx prisma db push
npm run db:seed
npm run dev
```

Open http://localhost:3000

The seed command creates local demo accounts and sample data. It is disabled in
production; do not use the local demo credentials on a deployed site.

## Gmail SMTP setup

1. Enable 2-Step Verification on your Google account.
2. Create an App Password.
3. Set:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=yourgmail@gmail.com
SMTP_PASSWORD=your-16-character-app-password
MAIL_FROM="Nestora <yourgmail@gmail.com>"
```

## SendGrid SMTP setup

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
MAIL_FROM="Nestora <verified@yourdomain.com>"
```

## Production database

The downloadable default uses SQLite for simple local self-hosting.

### Supabase on Vercel

1. Create a Supabase project and database. In the Supabase dashboard, open
   **Connect** and copy the **Transaction pooler** connection string (port `6543`)
   into Vercel's `DATABASE_URL` environment variable. Add
   `pgbouncer=true` to its query string if it is not already present.
2. Copy the **Session pooler** connection string (port `5432`) into Vercel's
   `DIRECT_URL` variable. Prisma uses it to apply schema changes during deployment.
   Use the connection strings provided by Supabase so the project reference,
   region, username, password, and SSL options match your project.
3. Set `AUTH_SECRET` to a cryptographically random value of at least 32
   characters, and set `NEXT_PUBLIC_APP_URL` to the deployed HTTPS origin.
   Add these variables to both Preview and Production in Vercel.
4. The Vercel build applies the PostgreSQL Prisma schema with `prisma db push`
   before building the app. To initialize or update the schema manually instead,
   set both database variables in your local environment and run:

```bash
npm run db:postgres
```

5. Redeploy on Vercel. Its `build:vercel` script generates the PostgreSQL Prisma
   Client, applies the schema (including any new tables), and then builds Next.js;
   local development continues to use SQLite.
6. Register through the site to create your first account. To grant that account
   administrator access, run this statement in the Supabase SQL Editor after
   replacing the email with your account's address:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

The Supabase database starts fresh; existing database data is not migrated.
Do not commit either Supabase connection string or the auth secret. If the deployed
site reports a server-side exception, check the Vercel Function Logs and confirm
both database variables are set for the deployment's environment.

## Deploy

See [Supabase on Vercel](#supabase-on-vercel) for database configuration.
