import dbConnect from "@/lib/db.js";
import Gist from "@/models/Gist.js";

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    if (!id || id.length !== 4) {
      return Response.json({ success: false, message: "Invalid gist ID format" }, { status: 400 });
    }
    const gist = await Gist.findOne({ id: id.toLowerCase(), expiresAt: { $gt: new Date() } })
      .select("-screenshots.data -files.data")
      .lean();
    if (!gist) {
      return Response.json({ success: false, message: "Code snippet not found or expired" }, { status: 404 });
    }

    const screenshots = (gist.screenshots || []).map((s, index) => ({
      index,
      name: s.name,
      size: s.size,
      contentType: s.contentType,
      url: `/api/gists/${gist.id}/screenshots/${index}`,
    }));
    const files = (gist.files || []).map((f, index) => ({
      index,
      name: f.name,
      size: f.size,
      contentType: f.contentType,
      url: `/api/gists/${gist.id}/files/${index}`,
    }));

    return Response.json({
      success: true,
      data: {
        id: gist.id,
        code: gist.code,
        fileName: gist.fileName,
        title: gist.title,
        ttlHours: gist.ttlHours,
        screenshots,
        files,
        createdAt: gist.createdAt,
        expiresAt: gist.expiresAt,
      },
    });
  } catch (e) {
    return Response.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
