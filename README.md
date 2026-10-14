# Pasty Next

Share code with a short link. Friends open link, see code, download files. Links expire automatic.

Pasty lets you share text, pictures, files fast. Create paste, get 4-letter ID. Create room, invite with 6-character code. Everyone adds entries together.

Simple sharing for classmates. No login. Paste code, attach screenshots. Search by ID or full link anytime.

## Stack

Full Next.js monolith in `src/`. Neon Postgres free tier. Drizzle ORM. No Express. No blob service. Files stored as base64 text in Postgres. Free-tier caps: paste 10MB, room 50MB total, links live 24 hours.

## Routes

- `/` paste studio (stage, generate 1 ID)
- `/code/[id]` view paste
- `/recent` find paste or room
- `/room/[code]` room chat
- `/api/*` backend + `/api/cron/cleanup` daily expiry sweep
- `/api/health` health + DB check (200 healthy, 503 DB down)

## Structure

```
src/
  app/
    page.js            # paste studio
    code/[id]/page.js
    recent/page.js
    room/[code]/page.js
    api/               # backend routes
  components/          # chat UI (Composer, CodeBlock, FileBubble, …)
  lib/                 # api client, formatting, uploads, device
  db/schema.js         # 5 Postgres tables
```

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

## Deploy (Vercel)

1. Push repo. Import in Vercel.
2. Set env vars: `DATABASE_URL` (pooled Neon), `DIRECT_URL` (direct Neon), `CRON_SECRET` (long random), `NEXT_PUBLIC_APP_URL` (site URL).
3. Vercel Cron in `vercel.json` hits `/api/cron/cleanup` daily at 04:00. Vercel sends `Authorization: Bearer $CRON_SECRET` automatically.
4. Run once locally: `npm run db:push` to create tables.
5. Deploy. Check `/api/health` — `db: "up"`.

Known limit: Vercel Functions cap request bodies at ~4.5MB. App allows 10MB per paste. Uploads above ~4.5MB work on Docker/self-host, fail on Vercel Hobby.

## Deploy (Docker)

```bash
docker build -t pasty .
docker run -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e DIRECT_URL="..." \
  -e CRON_SECRET="..." \
  -e NEXT_PUBLIC_APP_URL="https://pasty.example.com" \
  pasty
```

Set an external cron (or container cron) to `GET /api/cron/cleanup` with `Authorization: Bearer $CRON_SECRET` daily.
