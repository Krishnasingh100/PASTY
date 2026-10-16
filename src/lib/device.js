// Cached Set. Old code ran JSON.parse(localStorage) per entry per render.
let cache = null;

function read() {
  if (cache) return cache;
  try {
    cache = new Set((JSON.parse(window.localStorage.getItem("pasty-own") || "[]") || []).map(String));
  } catch {
    cache = new Set();
  }
  return cache;
}

export function markOwn(entryId) {
  read().add(String(entryId));
  try {
    window.localStorage.setItem("pasty-own", JSON.stringify([...read()].slice(-200)));
  } catch {}
}

export function isOwn(entryId) {
  return read().has(String(entryId));
}
