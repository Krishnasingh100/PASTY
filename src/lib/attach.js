import { toast } from "react-toastify";
import { formatSize } from "./format.js";

export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
export const BLOCKED = [".exe", ".msi", ".bat", ".cmd", ".com", ".scr", ".pif"];

export function addIncoming(screenshots, files, incoming, opts = {}) {
  const { maxTotal = 10 * 1024 * 1024, maxShots = 5, maxFiles = 5 } = opts;
  let running = [...screenshots, ...files].reduce((s, f) => s + f.size, 0);
  const ss = [];
  const ff = [];
  for (const file of Array.from(incoming || [])) {
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (BLOCKED.includes(ext)) {
      toast.error(`${file.name}: blocked file type`);
      continue;
    }
    if (running + file.size > maxTotal) {
      toast.error(`${file.name}: exceeds ${formatSize(maxTotal)} total`);
      break;
    }
    const isImg = IMAGE_TYPES.includes(file.type);
    if (isImg && screenshots.length + ss.length < maxShots) ss.push(file);
    else if (!isImg && files.length + ff.length < maxFiles) ff.push(file);
    else {
      toast.error(`${file.name}: limit reached`);
      continue;
    }
    running += file.size;
  }
  return { screenshots: [...screenshots, ...ss], files: [...files, ...ff] };}
