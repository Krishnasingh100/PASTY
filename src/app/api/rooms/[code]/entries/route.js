import dbConnect from "@/lib/db.js";
import Room, { MAX_ROOM_SIZE } from "@/models/Room.js";
import RoomEntry from "@/models/RoomEntry.js";
import { parseUploadForm } from "@/lib/upload.js";

export async function POST(req, { params }) {
  try {
    await dbConnect();
    const { code } = await params;
    const formData = await req.formData();
    const { code: codeContentRaw, title, screenshots, files, totalSize } = await parseUploadForm(formData);
    const codeContent = codeContentRaw.trim();

    const room = await Room.findOne({ code: (code || "").toLowerCase(), expiresAt: { $gt: new Date() } });
    if (!room) {
      return Response.json({ success: false, message: "Room not found or expired" }, { status: 404 });
    }
    if (!codeContent && screenshots.length === 0 && files.length === 0) {
      return Response.json({ success: false, message: "Please provide code, screenshots, or files" }, { status: 400 });
    }
    if (room.totalSize + totalSize > MAX_ROOM_SIZE) {
      const remaining = MAX_ROOM_SIZE - room.totalSize;
      return Response.json(
        { success: false, message: `Room storage full. ${(remaining / 1024 / 1024).toFixed(1)}MB remaining.` },
        { status: 400 }
      );
    }

    const entry = new RoomEntry({
      roomCode: room.code,
      title: title.trim().slice(0, 100) || "Untitled",
      code: codeContent,
      screenshots,
      files,
      entrySize: totalSize,
      expiresAt: room.expiresAt,
    });
    await entry.save();

    room.totalSize += totalSize;
    await room.save();

    return Response.json(
      {
        success: true,
        data: {
          id: entry._id,
          title: entry.title,
          entrySize: entry.entrySize,
          screenshotCount: entry.screenshots.length,
          fileCount: entry.files.length,
          createdAt: entry.createdAt,
        },
        roomTotalSize: room.totalSize,
      },
      { status: 201 }
    );
  } catch (e) {
    const msg = e.message || "Internal server error";
    const status = msg.startsWith("Max") || msg.startsWith("Blocked") || msg.startsWith("Invalid") || msg.startsWith("Total") ? 400 : 500;
    return Response.json({ success: false, message: msg }, { status });
  }
}
