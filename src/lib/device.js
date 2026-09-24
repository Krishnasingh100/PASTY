export function getDeviceId() {
  if (typeof window === "undefined") return "server";
  let id = null;
  try {
    id = window.localStorage.getItem("pasty-device");
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      window.localStorage.setItem("pasty-device", id);
    }
  } catch {
    id = "anon";
  }
  return id;
}

export function markOwn(entryId) {
  try {
    const raw = window.localStorage.getItem("pasty-own") || "[]";
    const list = JSON.parse(raw);
    list.push(String(entryId));
    window.localStorage.setItem("pasty-own", JSON.stringify(list.slice(-200)));
  } catch {}
}

export function isOwn(entryId) {
  try {
    const raw = window.localStorage.getItem("pasty-own") || "[]";
    return JSON.parse(raw).includes(String(entryId));
  } catch {
    return false;
  }
}
