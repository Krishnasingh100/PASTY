import dbConnect from "@/lib/db.js";
import Gist from "@/models/Gist.js";

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    if (!id || id.length !== 4) {
      return Response.json({ success: false, message: "Invalid gist ID format. ID must be exactly 4 characters long." }, { status: 400 });
    }
    const gist = await Gist.findOne({ id: id.toLowerCase(), expiresAt: { $gt: new Date() } })
      .select("-screenshots.data -files.data")
      .lean();
    if (!gist) {
      return Response.json({ success: false, message: "Code snippet not found or expired" }, { status: 404 });
    }
    return Response.json({
      success: true,
      data: {
        id: gist.id,
        title: gist.title,
        fileName: gist.fileName,
        ttlHours: gist.ttlHours,
        screenshotCount: (gist.screenshots || []).length,
        fileCount: (gist.files || []).length,
        createdAt: gist.createdAt,
        expiresAt: gist.expiresAt,
      },
    });
  } catch (e) {
    return Response.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
