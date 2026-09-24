import { inArray, lte } from "drizzle-orm";
import { getDb } from "@/lib/db.js";
import { gistAttachments, gists, roomAttachments, roomEntries, rooms } from "@/db/schema.js";

// Vercel Cron hits this daily. Deletes expired rows.
// FK cascades clear attachments, but we delete attachments first to free space fast.
export async function GET(req) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  try {
    const db = getDb();
    const now = new Date();

    const oldGists = await db.select({ id: gists.id }).from(gists).where(lte(gists.expiresAt, now));
    const oldRooms = await db.select({ code: rooms.code }).from(rooms).where(lte(rooms.expiresAt, now));
    const oldEntries = await db.select({ id: roomEntries.id }).from(roomEntries).where(lte(roomEntries.expiresAt, now));

    let gistFiles = 0;
    let roomFiles = 0;
    if (oldGists.length > 0) {
      const r = await db.delete(gistAttachments).where(
        inArray(
          gistAttachments.gistId,
          oldGists.map((g) => g.id)
        )
      );
      gistFiles = r.rowCount || 0;
    }
    if (oldEntries.length > 0) {
      const r = await db.delete(roomAttachments).where(
        inArray(
          roomAttachments.entryId,
          oldEntries.map((e) => e.id)
        )
      );
      roomFiles = r.rowCount || 0;
    }

    const delGists = oldGists.length > 0 ? await db.delete(gists).where(inArray(gists.id, oldGists.map((g) => g.id))) : { rowCount: 0 };
    const delEntries = oldEntries.length > 0 ? await db.delete(roomEntries).where(inArray(roomEntries.id, oldEntries.map((e) => e.id))) : { rowCount: 0 };
    const delRooms = oldRooms.length > 0 ? await db.delete(rooms).where(inArray(rooms.code, oldRooms.map((r) => r.code))) : { rowCount: 0 };

    return Response.json({
      success: true,
      deleted: {
        gists: delGists.rowCount || 0,
        gistAttachments: gistFiles,
        rooms: delRooms.rowCount || 0,
        roomEntries: delEntries.rowCount || 0,
        roomAttachments: roomFiles,
      },
    });
  } catch (e) {
    return Response.json({ success: false, message: e.message || "Internal server error" }, { status: 500 });
  }
}
