# Pasty Next

Simple code share. Full Next.js monolith. No Express. No blob. Same idea as old MERN zip.

- Single paste: 4-letter ID, code + screenshots + files, TTL 1h-7d, 10MB cap
- Room: 6-char code, multi entries, 50MB total cap, 5s poll refresh
- MongoDB Atlas inline binary, TTL auto delete

GitHub About suggestion: `Minimal code sharing app built with Next.js and MongoDB — share code with a 4-letter ID or collaborate in rooms.`

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
  lib/
    db.js
    ids.js
    upload.js
  models/
    Gist.js
    Room.js
    RoomEntry.js
```

Backend lives in `src/app/api`. Frontend pages live in `src/app`. Shared code lives in `src/lib`. Schemas live in `src/models`.

## Run

```bash
npm install
cp .env.example .env
# edit MONGODB_URI
npm run dev
```

Open http://localhost:3000
Health: http://localhost:3000/api/health
