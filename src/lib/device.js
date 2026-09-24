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
