const KEY = "pasty-rooms";

export function getVisited() {
  try {
    const raw = window.localStorage.getItem(KEY) || "[]";
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function addVisited(code, name) {
  try {
    const list = getVisited().filter((r) => r.code !== code);
    list.unshift({ code, name: name || code, at: Date.now() });
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, 20)));
  } catch {}
}

export function pingLists() {
  try {
    window.dispatchEvent(new Event("pasty:update"));
  } catch {}
}

export function removeVisited(code) {
  try {
    const list = getVisited().filter((r) => r.code !== code);
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
}

// Own pastes, per device. Sidebar + recent show only these — a visitor who
// opens your shared link never sees your history.
const PKEY = "pasty-pastes";

export function getPastes() {
  try {
    const list = JSON.parse(window.localStorage.getItem(PKEY) || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function addPaste(id, title) {
  try {
    const list = getPastes().filter((p) => p.id !== id);
    list.unshift({ id, title: title || "Untitled", at: Date.now() });
    window.localStorage.setItem(PKEY, JSON.stringify(list.slice(0, 30)));
  } catch {}
}

export function removePaste(id) {
  try {
    window.localStorage.setItem(PKEY, JSON.stringify(getPastes().filter((p) => p.id !== id)));
  } catch {}
}

function readSeq(key) {
  try {
    return parseInt(window.localStorage.getItem(key) || "0", 10) || 0;
  } catch {
    return 0;
  }
}

// Numbered names: Paste 1, Paste 2… / Room 1, Room 2…
// Peek a number for the create request, commit it only on success — no gaps.
export function peekPasteNum() {
  return readSeq("pasty-paste-seq") + 1;
}

export function commitPasteNum(n) {
  try {
    if (n > readSeq("pasty-paste-seq")) window.localStorage.setItem("pasty-paste-seq", String(n));
  } catch {}
}

export function peekRoomNum() {
  return readSeq("pasty-room-seq") + 1;
}

export function commitRoomNum(n) {
  try {
    if (n > readSeq("pasty-room-seq")) window.localStorage.setItem("pasty-room-seq", String(n));
  } catch {}
}
