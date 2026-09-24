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
      return Response.json({ success: false, message: "File not found" }, { status: 404 });
    }
    const files = await db
      .select()
      .from(roomAttachments)
      .where(and(eq(roomAttachments.entryId, entryRows[0].id), eq(roomAttachments.kind, "file")))
      .orderBy(asc(roomAttachments.id));
    const file = files[idx];
    if (!file) {
      return Response.json({ success: false, message: "File not found" }, { status: 404 });
    }
    return new Response(Buffer.from(file.dataBase64, "base64"), {
      headers: {
        "Content-Type": file.mime,
        "Content-Length": String(file.size),
        "Content-Disposition": `attachment; filename="${encodeURIComponent(file.name)}"`,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    return Response.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
