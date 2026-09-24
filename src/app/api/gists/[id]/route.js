import { and, asc, eq, gt } from "drizzle-orm";
import { getDb } from "@/lib/db.js";
import { gistAttachments, gists } from "@/db/schema.js";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    if (!id || id.length !== 4) {
      return Response.json({ success: false, message: "Invalid gist ID format" }, { status: 400 });
    }
    const db = getDb();
    const now = new Date();
    const rows = await db
      .select()
      .from(gists)
      .where(and(eq(gists.id, id.toLowerCase()), gt(gists.expiresAt, now)));
    if (rows.length === 0) {
      return Response.json({ success: false, message: "Code snippet not found or expired" }, { status: 404 });
    }
    const gist = rows[0];
    const atts = await db
      .select({ id: gistAttachments.id, kind: gistAttachments.kind, mime: gistAttachments.mime, name: gistAttachments.name, size: gistAttachments.size })
      .from(gistAttachments)
      .where(eq(gistAttachments.gistId, gist.id))
      .orderBy(asc(gistAttachments.id));

    const shots = atts.filter((a) => a.kind === "screenshot");
    const files = atts.filter((a) => a.kind === "file");

    return Response.json({
      success: true,
      data: {
        id: gist.id,
        code: gist.code,
        fileName: gist.fileName,
        title: gist.title,
        ttlHours: gist.ttlHours,
        screenshots: shots.map((s, index) => ({ index, name: s.name, size: s.size, contentType: s.mime, url: `/api/gists/${gist.id}/screenshots/${index}` })),
        files: files.map((f, index) => ({ index, name: f.name, size: f.size, contentType: f.mime, url: `/api/gists/${gist.id}/files/${index}` })),
        createdAt: gist.createdAt,
        expiresAt: gist.expiresAt,
      },
    });
  } catch (e) {
    return Response.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
