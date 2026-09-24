import dbConnect from "@/lib/db.js";
import Gist from "@/models/Gist.js";

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { id, index } = await params;
    const idx = parseInt(index, 10);
    if (!id || id.length !== 4 || Number.isNaN(idx) || idx < 0 || idx > 4) {
      return Response.json({ success: false, message: "Invalid request" }, { status: 400 });
    }
    const gist = await Gist.findOne({ id: id.toLowerCase(), expiresAt: { $gt: new Date() } }).select("files");
    if (!gist || !gist.files[idx]) {
      return Response.json({ success: false, message: "File not found" }, { status: 404 });
    }
    const file = gist.files[idx];
    return new Response(file.data, {
      headers: {
        "Content-Type": file.contentType,
        "Content-Length": String(file.size),
        "Content-Disposition": `attachment; filename="${encodeURIComponent(file.name)}"`,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    return Response.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
