// Prettier chunks load once, in parallel. Old code re-imported 3 chunks
// sequentially on every single send.
let prettierP = null;
function loadPrettier() {
  if (!prettierP) {
    prettierP = Promise.all([import("prettier/standalone"), import("prettier/plugins/babel"), import("prettier/plugins/estree")]).catch((e) => {
      prettierP = null;
      throw e;
    });
  }
  return prettierP;
}

async function formatOrThrow(code) {
  const [prettier, babel, estree] = await loadPrettier();
  const trimmed = code.trim();
  if (/^[\[{]/.test(trimmed)) {
    try {
      return await prettier.format(trimmed, { parser: "json", plugins: [estree] });
    } catch {}
  }
  return await prettier.format(code, { parser: "babel", plugins: [babel, estree] });
}

export async function tryFormat(code) {
  if (!code || !code.trim()) return code;
  const t = code.trim();
  // Fast path: single-line chat chatter never benefits from prettier.
  // JSON (starts with { or [) always goes through.
  if (!/^[\[{]/.test(t) && !t.includes("\n") && t.length < 500) return code;
  try {
    return await formatOrThrow(code);
  } catch {
    return code;
  }
}
