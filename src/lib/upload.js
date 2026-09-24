export const MAX_TOTAL_SIZE = 10 * 1024 * 1024;
export const MAX_SCREENSHOTS = 5;
export const MAX_FILES = 5;
export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
export const BLOCKED_EXTENSIONS = [".exe", ".msi", ".bat", ".cmd", ".com", ".scr", ".pif"];

function extOf(name = "") {
  const i = name.toLowerCase().lastIndexOf(".");
  return i >= 0 ? name.toLowerCase().slice(i) : "";
}

export async function parseUploadForm(formData) {
  const code = (formData.get("code") || "").toString();
  const title = (formData.get("title") || "Untitled").toString();
  const ttlHours = parseInt(formData.get("ttlHours") || "168", 10) || 168;

  const screenshots = formData.getAll("screenshots").filter((f) => f && typeof f.arrayBuffer === "function" && f.size > 0);
  const files = formData.getAll("files").filter((f) => f && typeof f.arrayBuffer === "function" && f.size > 0);

  if (screenshots.length > MAX_SCREENSHOTS) throw new Error("Max 5 screenshots");
  if (files.length > MAX_FILES) throw new Error("Max 5 files");

  const all = [...screenshots, ...files];
  for (const f of all) {
    const ext = extOf(f.name);
    if (BLOCKED_EXTENSIONS.includes(ext)) throw new Error(`Blocked file type: ${ext}`);
  }
  for (const f of screenshots) {
    if (!ALLOWED_IMAGE_TYPES.includes(f.type)) throw new Error(`Invalid image type: ${f.type}`);
  }

  const totalSize = all.reduce((s, f) => s + f.size, 0);
  if (totalSize > MAX_TOTAL_SIZE) throw new Error(`Total upload exceeds ${(MAX_TOTAL_SIZE / 1024 / 1024).toFixed(0)}MB`);

  async function toStored(file) {
    const buf = Buffer.from(await file.arrayBuffer());
    return { data: buf, contentType: file.type || "application/octet-stream", name: file.name, size: file.size };
  }

  return {
    code,
    title,
    ttlHours: Math.max(1, Math.min(168, ttlHours)),
    screenshots: await Promise.all(screenshots.map(toStored)),
    files: await Promise.all(files.map(toStored)),
    totalSize,
  };
}
