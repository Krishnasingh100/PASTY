async function formatOrThrow(code) {
  const prettier = await import("prettier/standalone");
  const babel = await import("prettier/plugins/babel");
  const estree = await import("prettier/plugins/estree");
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
  try {
    return await formatOrThrow(code);
  } catch {
    return code;
  }
}
