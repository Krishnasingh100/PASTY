# Pasty Next

Share code with a short link. Friends open link, see code, download files. Links expire automatic.

Pasty lets you share text, pictures, files fast. Create paste, get 4-letter ID. Create room, invite with 6-character code. Everyone adds entries together.

Simple sharing for classmates. No login. Paste code, attach screenshots. Search by ID or full link anytime.

## Stack

Full Next.js monolith in `src/`. Neon Postgres free tier. Drizzle ORM. No Express. No blob service. Files stored as base64 text in Postgres. Free-tier caps: paste 10MB, room 50MB total, links live 24 hours.

## Routes

- `/` landing
- `/new` paste studio (stage many, generate all)
- `/code/[id]` view paste
- `/recent` find paste or room
- `/room/[code]` room chat
- `/api/*` backend + `/api/cron/cleanup` daily expiry sweep

## Structure

```
src/
  app/
    page.js            # landing
    new/page.js        # paste studio
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
