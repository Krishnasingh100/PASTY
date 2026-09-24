import { and, eq, gt, sql } from "drizzle-orm";
import { getDb } from "@/lib/db.js";
import { roomAttachments, roomEntries, rooms } from "@/db/schema.js";
import { parseUploadForm } from "@/lib/upload.js";

export const MAX_ROOM_SIZE = 50 * 1024 * 1024;

export async function POST(req, { params }) {
  try {
    const { code } = await params;
    const formData = await req.formData();
    const { code: codeContentRaw, title, screenshots, files, totalSize } = await parseUploadForm(formData);
    const codeContent = codeContentRaw.trim();

    const db = getDb();
    const roomRows = await db
      .select()
      .from(rooms)
      .where(and(eq(rooms.code, (code || "").toLowerCase()), gt(rooms.expiresAt, new Date())));
    if (roomRows.length === 0) {
      return Response.json({ success: false, message: "Room not found or expired" }, { status: 404 });
    }
    const room = roomRows[0];
    if (!codeContent && screenshots.length === 0 && files.length === 0) {
      return Response.json({ success: false, message: "Please provide code, screenshots, or files" }, { status: 400 });
    }
    if (room.totalSize + totalSize > MAX_ROOM_SIZE) {
      const remaining = MAX_ROOM_SIZE - room.totalSize;
      return Response.json(
        { success: false, message: `Room storage full. ${(remaining / 1024 / 1024).toFixed(1)}MB remaining.` },
        { status: 400 }
      );
    }

    const inserted = await db
      .insert(roomEntries)
      .values({
        roomCode: room.code,
        title: title.trim().slice(0, 100) || "Untitled",
        code: codeContent,
        entrySize: totalSize,
        expiresAt: room.expiresAt,
      })
      .returning({ id: roomEntries.id, title: roomEntries.title, entrySize: roomEntries.entrySize, createdAt: roomEntries.createdAt });
    const entry = inserted[0];

    const rows = [
      ...screenshots.map((f) => ({ entryId: entry.id, kind: "screenshot", dataBase64: f.data.toString("base64"), mime: f.contentType, name: f.name.slice(0, 255), size: f.size })),
      ...files.map((f) => ({ entryId: entry.id, kind: "file", dataBase64: f.data.toString("base64"), mime: f.contentType, name: f.name.slice(0, 255), size: f.size })),
    ];
    if (rows.length > 0) await db.insert(roomAttachments).values(rows);

    await db
      .update(rooms)
      .set({ totalSize: sql`${rooms.totalSize} + ${totalSize}` })
      .where(eq(rooms.code, room.code));
    const updated = await db.select({ totalSize: rooms.totalSize }).from(rooms).where(eq(rooms.code, room.code));

    return Response.json(
      {
        success: true,
        data: {
          id: entry.id,
          title: entry.title,
          entrySize: entry.entrySize,
          screenshotCount: screenshots.length,
          fileCount: files.length,
          createdAt: entry.createdAt,
        },
        roomTotalSize: updated[0]?.totalSize,
      },
      { status: 201 }
    );
  } catch (e) {
    const msg = e.message || "Internal server error";
    const status = msg.startsWith("Max") || msg.startsWith("Blocked") || msg.startsWith("Invalid") || msg.startsWith("Total") || msg.startsWith("Missing") ? 400 : 500;
    return Response.json({ success: false, message: msg }, { status });
  }
}
