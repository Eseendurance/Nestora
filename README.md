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

### Neon on Vercel

1. Create a Neon project and database. In Neon, copy the **pooled** connection
   string into Vercel's `DATABASE_URL` environment variable. Use the pooled
   hostname (it includes `-pooler`) and keep `sslmode=require`.
2. Copy Neon's **direct, non-pooled** connection string into Vercel's
   `DIRECT_URL` variable. Prisma uses this direct URL for schema changes.
3. Set `AUTH_SECRET` to a cryptographically random value of at least 32
   characters, and set `NEXT_PUBLIC_APP_URL` to the deployed HTTPS origin.
   Apply these variables to Production and Preview as appropriate.
4. With `DATABASE_URL` and `DIRECT_URL` set in your local environment, create
   the database tables:

```bash
npm run db:postgres
```

5. Redeploy on Vercel. Vercel selects the PostgreSQL Prisma schema automatically;
   local development continues to use SQLite.
6. Register through the site to create your first account. To grant that account
   administrator access, run this statement in the Neon SQL Editor after
   replacing the email with your account's address:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

Do not commit either Neon connection string or the auth secret. If the deployed
site reports a server-side exception, check the Vercel Function Logs and confirm
both database variables are set for the deployment's environment.

## Deploy

See [Neon on Vercel](#neon-on-vercel) for database configuration.
