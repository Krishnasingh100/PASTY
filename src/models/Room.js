import mongoose from "mongoose";

export const MAX_ROOM_SIZE = 50 * 1024 * 1024;

const RoomSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, minlength: 6, maxlength: 6 },
  name: { type: String, default: "Untitled Room", maxLength: 100, trim: true },
  ttlHours: { type: Number, min: 1, max: 168, default: 168 },
  totalSize: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

RoomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Room || mongoose.model("Room", RoomSchema);
