import mongoose from "mongoose";

const FileSchema = new mongoose.Schema(
  {
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true },
    name: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { _id: false }
);

const RoomEntrySchema = new mongoose.Schema({
  roomCode: { type: String, required: true, index: true },
  title: { type: String, default: "Untitled", maxLength: 100, trim: true },
  code: { type: String, default: "", maxLength: 100000 },
  screenshots: { type: [FileSchema], default: [] },
  files: { type: [FileSchema], default: [] },
  entrySize: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

RoomEntrySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.RoomEntry || mongoose.model("RoomEntry", RoomEntrySchema);
