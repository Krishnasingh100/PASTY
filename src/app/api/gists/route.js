import { and, desc, eq, gt, sql } from "drizzle-orm";
import { getDb } from "@/lib/db.js";
import { gistAttachments, gists } from "@/db/schema.js";
import { generateUniqueGistId } from "@/lib/ids.js";
import { parseUploadForm } from "@/lib/upload.js";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const { code, title, ttlHours, screenshots, files } = await parseUploadForm(formData);

    const codeContent = code.trim();
    if (!codeContent && screenshots.length === 0 && files.length === 0) {
      return Response.json({ success: false, message: "Please provide code, screenshots, or files" }, { status: 400 });
    }
    if (codeContent.length > 100000) {
      return Response.json({ success: false, message: "Code content too large (max 100KB)" }, { status: 400 });
    }

    const db = getDb();
    const id = await generateUniqueGistId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);
    const fileName = (formData.get("fileName") || "untitled.txt").toString().slice(0, 50);

    await db.insert(gists).values({
      id,
      code: codeContent,
      title: title.trim().slice(0, 100) || "Untitled",
      fileName,
      ttlHours,
      expiresAt,
    });

    const rows = [
      ...screenshots.map((f) => ({
        gistId: id,
        kind: "screenshot",
        dataBase64: f.data.toString("base64"),
        mime: f.contentType,
        name: f.name.slice(0, 255),
        size: f.size,
      })),
      ...files.map((f) => ({
        gistId: id,
        kind: "file",
        dataBase64: f.data.toString("base64"),
        mime: f.contentType,
        name: f.name.slice(0, 255),
        size: f.size,
      })),
    ];
    if (rows.length > 0) await db.insert(gistAttachments).values(rows);

    const saved = await db.select().from(gists).where(eq(gists.id, id));

    return Response.json(
      {
        success: true,
        data: {
          id,
          title: saved[0]?.title,
          fileName: saved[0]?.fileName,
          ttlHours,
          screenshotCount: screenshots.length,
          fileCount: files.length,
          createdAt: saved[0]?.createdAt,
          expiresAt: saved[0]?.expiresAt,
        },
        message: "Code snippet created successfully",
      },
      { status: 201 }
    );
  } catch (e) {
    const msg = e.message || "Internal server error";
    const status =
      msg.startsWith("Max") || msg.startsWith("Blocked") || msg.startsWith("Invalid") || msg.startsWith("Total") || msg.startsWith("Missing")
        ? 400
        : 500;
    return Response.json({ success: false, message: msg }, { status });
  }
}

export async function GET(req) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10) || 1;
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10) || 20, 50);
    const offset = (page - 1) * limit;
    const now = new Date();

    const rows = await db
      .select({
        id: gists.id,
        title: gists.title,
        fileName: gists.fileName,
        ttlHours: gists.ttlHours,
        createdAt: gists.createdAt,
        expiresAt: gists.expiresAt,
      })
      .from(gists)
      .where(gt(gists.expiresAt, now))
      .orderBy(desc(gists.createdAt))
      .limit(limit)
      .offset(offset);
    const totalRows = await db
      .select({ n: sql`count(*)` })
      .from(gists)
      .where(gt(gists.expiresAt, now));

    const total = Number(totalRows[0]?.n || 0);
    return Response.json({ success: true, data: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (e) {
    return Response.json({ success: false, message: e.message || "Internal server error" }, { status: 500 });
  }
}
