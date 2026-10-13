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
