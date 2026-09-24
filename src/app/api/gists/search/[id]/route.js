import { and, eq, gt } from "drizzle-orm";
import { getDb } from "@/lib/db.js";
import { gistAttachments, gists } from "@/db/schema.js";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    if (!id || id.length !== 4) {
      return Response.json(
        { success: false, message: "Invalid gist ID format. ID must be exactly 4 characters long." },
        { status: 400 }
      );
    }
    const db = getDb();
    const rows = await db
      .select()
      .from(gists)
      .where(and(eq(gists.id, id.toLowerCase()), gt(gists.expiresAt, new Date())));
    if (rows.length === 0) {
      return Response.json({ success: false, message: "Code snippet not found or expired" }, { status: 404 });
    }
    const gist = rows[0];
    const atts = await db
      .select({ kind: gistAttachments.kind })
      .from(gistAttachments)
      .where(eq(gistAttachments.gistId, gist.id));
    return Response.json({
      success: true,
      data: {
        id: gist.id,
        title: gist.title,
        fileName: gist.fileName,
        ttlHours: gist.ttlHours,
        screenshotCount: atts.filter((a) => a.kind === "screenshot").length,
        fileCount: atts.filter((a) => a.kind === "file").length,
        createdAt: gist.createdAt,
        expiresAt: gist.expiresAt,
      },
    });
  } catch (e) {
    return Response.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
