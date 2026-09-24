export function formatTTL(hours) {
  if (!hours) return "";
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  const rem = hours % 24;
  return rem === 0 ? `${days}d` : `${days}d ${rem}h`;
}

export function formatSize(bytes) {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export function timeRemaining(expiresAt) {
  const diff = new Date(expiresAt) - new Date();
  if (diff <= 0) return "Expired";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m remaining`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m remaining`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h remaining`;
}

export function extractId(value) {
  const trimmed = (value || "").trim();
  const urlMatch = trimmed.match(/\/code\/([a-zA-Z0-9]{4})\s*$/);
  if (urlMatch) return urlMatch[1].toLowerCase();
  return trimmed.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toLowerCase();
}

export function deriveTitle(code = "", screenshots = [], files = []) {
  const line = (code || "").split("\n").map((s) => s.trim()).find(Boolean);
  if (line) return line.slice(0, 60);
  const all = [...screenshots, ...files];
  if (all.length === 1) return (all[0].name || "File").slice(0, 60);
  if (all.length > 1) return `${(all[0].name || "File").slice(0, 40)} +${all.length - 1} more`;
  return "Untitled";
}

export async function copyText(text) {
  const { toast } = await import("react-toastify");
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    toast.error("Copy failed");
  }
}
