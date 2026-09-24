import mongoose from "mongoose";

export const MIN_TTL_HOURS = 1;
export const MAX_TTL_HOURS = 168;

const FileSchema = new mongoose.Schema(
  {
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true },
    name: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { _id: false }
);

const GistSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, minlength: 4, maxlength: 4 },
  code: { type: String, default: "", maxLength: 100000 },
  title: { type: String, default: "Untitled", maxLength: 100, trim: true },
  fileName: { type: String, default: "untitled.txt", maxLength: 50, trim: true },
  screenshots: { type: [FileSchema], default: [] },
  files: { type: [FileSchema], default: [] },
  ttlHours: { type: Number, min: MIN_TTL_HOURS, max: MAX_TTL_HOURS, default: MAX_TTL_HOURS },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

GistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Gist || mongoose.model("Gist", GistSchema);
