import dbConnect from "@/lib/db.js";
import RoomEntry from "@/models/RoomEntry.js";

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { entryId, index } = await params;
    const idx = parseInt(index, 10);
    const entry = await RoomEntry.findOne({ _id: entryId, expiresAt: { $gt: new Date() } }).select("screenshots");
    if (!entry || !entry.screenshots[idx]) {
      return Response.json({ success: false, message: "Screenshot not found" }, { status: 404 });
    }
    const ss = entry.screenshots[idx];
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
