import dbConnect from "@/lib/db.js";
import RoomEntry from "@/models/RoomEntry.js";

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { entryId, index } = await params;
    const idx = parseInt(index, 10);
    const entry = await RoomEntry.findOne({ _id: entryId, expiresAt: { $gt: new Date() } }).select("files");
    if (!entry || !entry.files[idx]) {
      return Response.json({ success: false, message: "File not found" }, { status: 404 });
    }
    const file = entry.files[idx];
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
