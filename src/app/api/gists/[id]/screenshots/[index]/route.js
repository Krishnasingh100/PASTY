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
    const gist = await Gist.findOne({ id: id.toLowerCase(), expiresAt: { $gt: new Date() } }).select("screenshots");
    if (!gist || !gist.screenshots[idx]) {
      return Response.json({ success: false, message: "Screenshot not found" }, { status: 404 });
    }
    const ss = gist.screenshots[idx];
    return new Response(ss.data, {
      headers: {
        "Content-Type": ss.contentType,
        "Content-Length": String(ss.size),
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    return Response.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
