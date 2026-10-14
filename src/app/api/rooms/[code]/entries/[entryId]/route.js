import { and, eq, gt, sql } from "drizzle-orm";
import { getDb } from "@/lib/db.js";
import { roomAttachments, roomEntries, rooms } from "@/db/schema.js";

export async function DELETE(req, { params }) {
  try {
    const { code, entryId } = await params;
    const id = parseInt(entryId, 10);
    if (!code || code.length !== 6 || !Number.isInteger(id)) {
      return Response.json({ success: false, message: "Invalid room code or entry" }, { status: 400 });
    }
    const db = getDb();
    const key = code.toLowerCase();
    const roomRows = await db
      .select()
      .from(rooms)
      .where(and(eq(rooms.code, key), gt(rooms.expiresAt, new Date())));
    if (roomRows.length === 0) {
      return Response.json({ success: false, message: "Room not found or expired" }, { status: 404 });
    }
    const rows = await db
      .select()
      .from(roomEntries)
      .where(and(eq(roomEntries.id, id), eq(roomEntries.roomCode, key)));
    if (rows.length === 0) {
      return Response.json({ success: false, message: "Message not found" }, { status: 404 });
    }
    const freed = rows[0].entrySize || 0;
    await db.delete(roomAttachments).where(eq(roomAttachments.entryId, id));
    await db.delete(roomEntries).where(eq(roomEntries.id, id));
    if (freed > 0) {
      await db
        .update(rooms)
        .set({ totalSize: sql`GREATEST(0, ${rooms.totalSize} - ${freed})` })
        .where(eq(rooms.code, key));
    }
    return Response.json({ success: true, data: { id } });
  } catch (e) {
    return Response.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
