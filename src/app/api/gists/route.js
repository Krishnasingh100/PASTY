import dbConnect from "@/lib/db.js";
import Gist, { MAX_TTL_HOURS } from "@/models/Gist.js";
import { generateUniqueGistId } from "@/lib/ids.js";
import { parseUploadForm } from "@/lib/upload.js";

export async function POST(req) {
  try {
    await dbConnect();
    const formData = await req.formData();
    const { code, title, ttlHours, screenshots, files } = await parseUploadForm(formData);

    const codeContent = code.trim();
    if (!codeContent && screenshots.length === 0 && files.length === 0) {
      return Response.json({ success: false, message: "Please provide code, screenshots, or files" }, { status: 400 });
    }
    if (codeContent.length > 100000) {
      return Response.json({ success: false, message: "Code content too large (max 100KB)" }, { status: 400 });
    }

    const id = await generateUniqueGistId();
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
    const fileName = (formData.get("fileName") || "untitled.txt").toString().slice(0, 50);

    const gist = new Gist({
      id,
      code: codeContent,
      title: title.trim().slice(0, 100) || "Untitled",
      fileName,
      screenshots,
      files,
      ttlHours,
      expiresAt,
    });
    await gist.save();

    return Response.json(
      {
        success: true,
        data: {
          id: gist.id,
          title: gist.title,
          fileName: gist.fileName,
          ttlHours: gist.ttlHours,
          screenshotCount: gist.screenshots.length,
          fileCount: gist.files.length,
          createdAt: gist.createdAt,
          expiresAt: gist.expiresAt,
        },
        message: "Code snippet created successfully",
      },
      { status: 201 }
    );
  } catch (e) {
    const msg = e.message || "Internal server error";
    const status = msg.startsWith("Max") || msg.startsWith("Blocked") || msg.startsWith("Invalid") || msg.startsWith("Total") ? 400 : 500;
    return Response.json({ success: false, message: msg }, { status });
  }
}

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10) || 1;
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10) || 20, 50);
    const skip = (page - 1) * limit;
    const now = new Date();

    const gists = await Gist.find({ expiresAt: { $gt: now } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("id title fileName ttlHours createdAt expiresAt")
      .lean();
    const total = await Gist.countDocuments({ expiresAt: { $gt: now } });

    return Response.json({ success: true, data: gists, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (e) {
    return Response.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
