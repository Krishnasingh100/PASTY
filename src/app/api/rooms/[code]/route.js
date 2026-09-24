import dbConnect from "@/lib/db.js";
import Room from "@/models/Room.js";
import RoomEntry from "@/models/RoomEntry.js";

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { code } = await params;
    if (!code || code.length !== 6) {
      return Response.json({ success: false, message: "Invalid room code" }, { status: 400 });
    }
    const room = await Room.findOne({ code: code.toLowerCase(), expiresAt: { $gt: new Date() } }).lean();
    if (!room) {
      return Response.json({ success: false, message: "Room not found or expired" }, { status: 404 });
    }
    const entries = await RoomEntry.find({ roomCode: room.code, expiresAt: { $gt: new Date() } })
      .select("-screenshots.data -files.data")
      .sort({ createdAt: -1 })
      .lean();

    const entriesData = entries.map((entry) => ({
      id: entry._id,
      title: entry.title,
      code: entry.code,
      entrySize: entry.entrySize,
      screenshots: (entry.screenshots || []).map((s, i) => ({
        index: i,
        name: s.name,
        size: s.size,
        contentType: s.contentType,
        url: `/api/rooms/${room.code}/entries/${entry._id}/screenshots/${i}`,
      })),
      files: (entry.files || []).map((f, i) => ({
        index: i,
        name: f.name,
        size: f.size,
        contentType: f.contentType,
        url: `/api/rooms/${room.code}/entries/${entry._id}/files/${i}`,
      })),
      createdAt: entry.createdAt,
    }));

    return Response.json({
      success: true,
      data: {
        code: room.code,
        name: room.name,
        ttlHours: room.ttlHours,
        totalSize: room.totalSize,
        maxSize: (await import("@/models/Room.js")).MAX_ROOM_SIZE,
        entries: entriesData,
        createdAt: room.createdAt,
        expiresAt: room.expiresAt,
      },
    });
  } catch (e) {
    return Response.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
