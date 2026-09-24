# Pasty Next

Share code with a short link. Friends open link, see code, download files. Links expire automatic.

Pasty lets you share text, pictures, files fast. Create paste, get 4-letter ID. Create room, invite with 6-letter code. Everyone adds entries together.

Simple sharing for classmates. No login. Paste code, attach screenshots, set expiry 1 hour to 7 days. Search by ID anytime.

## Stack

Full Next.js monolith in `src/`. Neon Postgres free tier. Drizzle ORM. No Express. No blob service. Files stored as base64 text in Postgres. Free-tier caps: paste 3MB suggested, room 20MB suggested, default TTL 24h.

## Structure

```
src/
  app/
    page.js
    layout.js
    globals.css
    api/
      health/route.js
      gists/route.js
      gists/[id]/route.js
      gists/search/[id]/route.js
      gists/[id]/screenshots/[index]/route.js
      gists/[id]/files/[index]/route.js
      rooms/route.js
      rooms/[code]/route.js
      rooms/[code]/entries/route.js
      rooms/[code]/entries/[entryId]/screenshots/[index]/route.js
      rooms/[code]/entries/[entryId]/files/[index]/route.js
      cron/cleanup/route.js
  lib/
    db.js
    ids.js
    upload.js
  db/
    schema.js
```

Backend lives in `src/app/api`. Shared code lives in `src/lib`. Tables live in `src/db/schema.js`.

## Run

```bash
npm install
cp .env.example .env
# put pooled Neon string in DATABASE_URL, direct string in DIRECT_URL
npm run db:push
npm run dev
```

Open http://localhost:3000
Health: http://localhost:3000/api/health
Cleanup: `GET /api/cron/cleanup` (daily via `vercel.json`, optional `CRON_SECRET` bearer)
