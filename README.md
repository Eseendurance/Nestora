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
npx prisma db push
npm run db:seed
npm run dev
```

Open http://localhost:3000

## Seed accounts

- Admin: admin@nestora.example / Admin12345!
- Agent: agent@nestora.example / Agent12345!

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

For Vercel or a scalable production deployment, set `DATABASE_URL` to a
PostgreSQL connection string in your deployment environment. The Vercel build
automatically generates the PostgreSQL Prisma client. To create or update the
database schema, run:

```bash
npm run db:postgres
```

The same `DATABASE_URL` must be available when running this command. The
PostgreSQL schema is kept separate so local SQLite development remains unchanged.

## Deploy

1. Push to GitHub.
2. Import into Vercel.
3. Add `DATABASE_URL` (PostgreSQL), `AUTH_SECRET` (a long random secret), and
   `NEXT_PUBLIC_APP_URL` (your deployed URL) to the Vercel project settings.
4. Run `npm run db:postgres` against that database to create the tables.
5. Deploy. Vercel uses the PostgreSQL Prisma schema automatically.
