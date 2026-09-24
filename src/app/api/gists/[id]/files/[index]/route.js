import { and, asc, eq, gt } from "drizzle-orm";
import { getDb } from "@/lib/db.js";
import { gistAttachments, gists } from "@/db/schema.js";

export async function GET(req, { params }) {
  try {
    const { id, index } = await params;
    const idx = parseInt(index, 10);
    if (!id || id.length !== 4 || Number.isNaN(idx) || idx < 0 || idx > 4) {
      return Response.json({ success: false, message: "Invalid request" }, { status: 400 });
    }
    const db = getDb();
    const live = await db
      .select({ id: gists.id })
      .from(gists)
      .where(and(eq(gists.id, id.toLowerCase()), gt(gists.expiresAt, new Date())));
    if (live.length === 0) {
      return Response.json({ success: false, message: "File not found" }, { status: 404 });
    }
    const files = await db
      .select()
      .from(gistAttachments)
      .where(and(eq(gistAttachments.gistId, live[0].id), eq(gistAttachments.kind, "file")))
      .orderBy(asc(gistAttachments.id));
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
