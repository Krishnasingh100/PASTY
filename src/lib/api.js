const BASE = "/api";

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export const api = {
  createGist: async (gistData, screenshots = [], files = []) => {
    const form = new FormData();
    form.append("code", gistData.code || "");
    form.append("title", gistData.title || "Untitled");
    form.append("ttlHours", gistData.ttlHours || 168);
    for (const f of screenshots) form.append("screenshots", f);
    for (const f of files) form.append("files", f);
    return req("/gists", { method: "POST", body: form });
  },

  getGist: (id) => req(`/gists/${id}`),
  searchGist: (id) => req(`/gists/search/${id}`),
  listGists: (page = 1, limit = 20) => req(`/gists?page=${page}&limit=${limit}`),

  gistScreenshotUrl: (id, index) => `/api/gists/${id}/screenshots/${index}`,
  gistFileUrl: (id, index) => `/api/gists/${id}/files/${index}`,

  createRoom: (roomData) =>
    req("/rooms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(roomData) }),

  getRoom: (code) => req(`/rooms/${code}`),

  addRoomEntry: async (code, entryData, screenshots = [], files = []) => {
    const form = new FormData();
    form.append("code", entryData.code || "");
    form.append("title", entryData.title || "Untitled");
    for (const f of screenshots) form.append("screenshots", f);
    for (const f of files) form.append("files", f);
    return req(`/rooms/${code}/entries`, { method: "POST", body: form });
  },

  roomScreenshotUrl: (code, entryId, index) => `/api/rooms/${code}/entries/${entryId}/screenshots/${index}`,
  roomFileUrl: (code, entryId, index) => `/api/rooms/${code}/entries/${entryId}/files/${index}`,
};

export async function downloadUrl(url, filename) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(href), 5000);
}

export default api;
