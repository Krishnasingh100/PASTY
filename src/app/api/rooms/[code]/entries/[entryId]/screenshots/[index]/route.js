import { and, asc, eq, gt } from "drizzle-orm";
import { getDb } from "@/lib/db.js";
import { roomAttachments, roomEntries } from "@/db/schema.js";

export async function GET(req, { params }) {
  try {
    const { entryId, index } = await params;
    const idx = parseInt(index, 10);
    const db = getDb();
    const entryRows = await db
      .select({ id: roomEntries.id })
      .from(roomEntries)
      .where(and(eq(roomEntries.id, Number(entryId)), gt(roomEntries.expiresAt, new Date())));
    if (entryRows.length === 0) {
      return Response.json({ success: false, message: "Screenshot not found" }, { status: 404 });
    }
    const shots = await db
      .select()
      .from(roomAttachments)
      .where(and(eq(roomAttachments.entryId, entryRows[0].id), eq(roomAttachments.kind, "screenshot")))
      .orderBy(asc(roomAttachments.id));
    const ss = shots[idx];
    if (!ss) {
      return Response.json({ success: false, message: "Screenshot not found" }, { status: 404 });
    }
    return new Response(Buffer.from(ss.dataBase64, "base64"), {
      headers: { "Content-Type": ss.mime, "Content-Length": String(ss.size), "Cache-Control": "public, max-age=86400" },
    });
  } catch (e) {
    return Response.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
