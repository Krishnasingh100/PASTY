import { and, asc, desc, eq, gt, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db.js";
import { MAX_ROOM_SIZE } from "@/lib/limits.js";
import { roomAttachments, roomEntries, rooms } from "@/db/schema.js";

export { MAX_ROOM_SIZE };

export async function GET(req, { params }) {
  try {
    const { code } = await params;
    if (!code || code.length !== 6) {
      return Response.json({ success: false, message: "Invalid room code" }, { status: 400 });
    }
    const db = getDb();
    const now = new Date();
    const roomRows = await db
      .select()
      .from(rooms)
      .where(and(eq(rooms.code, code.toLowerCase()), gt(rooms.expiresAt, now)));
    if (roomRows.length === 0) {
      return Response.json({ success: false, message: "Room not found or expired" }, { status: 404 });
    }
    const room = roomRows[0];
    const entries = await db
      .select({
        id: roomEntries.id,
        title: roomEntries.title,
        code: roomEntries.code,
        entrySize: roomEntries.entrySize,
        createdAt: roomEntries.createdAt,
      })
      .from(roomEntries)
      .where(and(eq(roomEntries.roomCode, room.code), gt(roomEntries.expiresAt, now)))
      .orderBy(desc(roomEntries.createdAt));

    let atts = [];
    const entryIds = entries.map((e) => e.id);
    if (entryIds.length > 0) {
      atts = await db
        .select({ entryId: roomAttachments.entryId, kind: roomAttachments.kind, mime: roomAttachments.mime, name: roomAttachments.name, size: roomAttachments.size })
        .from(roomAttachments)
        .where(inArray(roomAttachments.entryId, entryIds))
        .orderBy(asc(roomAttachments.id));
    }

    const entriesData = entries.map((entry) => {
      const mine = atts.filter((a) => a.entryId === entry.id);
      const shots = mine.filter((a) => a.kind === "screenshot");
      const files = mine.filter((a) => a.kind === "file");
      return {
        id: entry.id,
        title: entry.title,
        code: entry.code,
        entrySize: entry.entrySize,
        screenshots: shots.map((s, i) => ({
          index: i,
          name: s.name,
          size: s.size,
          contentType: s.mime,
          url: `/api/rooms/${room.code}/entries/${entry.id}/screenshots/${i}`,
        })),
        files: files.map((f, i) => ({
          index: i,
          name: f.name,
          size: f.size,
          contentType: f.mime,
          url: `/api/rooms/${room.code}/entries/${entry.id}/files/${i}`,
        })),
        createdAt: entry.createdAt,
      };
    });

    return Response.json({
      success: true,
      data: {
        code: room.code,
        name: room.name,
        ttlHours: room.ttlHours,
        totalSize: room.totalSize,
        maxSize: MAX_ROOM_SIZE,
        entries: entriesData,
        createdAt: room.createdAt,
        expiresAt: room.expiresAt,
      },
    });
  } catch (e) {
    return Response.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { code } = await params;
    if (!code || code.length !== 6) {
      return Response.json({ success: false, message: "Invalid room code" }, { status: 400 });
    }
    const db = getDb();
    const key = code.toLowerCase();
    const entries = await db
      .select({ id: roomEntries.id })
      .from(roomEntries)
      .where(eq(roomEntries.roomCode, key));
    const entryIds = entries.map((e) => e.id);
    if (entryIds.length > 0) {
      await db.delete(roomAttachments).where(inArray(roomAttachments.entryId, entryIds));
      await db.delete(roomEntries).where(inArray(roomEntries.id, entryIds));
    }
    const deleted = await db.delete(rooms).where(eq(rooms.code, key)).returning({ code: rooms.code });
    if (deleted.length === 0) {
      return Response.json({ success: false, message: "Room not found or expired" }, { status: 404 });
    }
    return Response.json({ success: true, data: { code: key } });
  } catch (e) {
    return Response.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
