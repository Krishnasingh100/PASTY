"use client";

export default function Error({ error, reset }) {
  return (
    <div className="py-16 text-center">
      <h1 className="mb-2 text-2xl font-bold" style={{ color: "var(--foreground)" }}>Something broke</h1>
      <p className="mb-4 text-sm" style={{ color: "var(--muted-foreground)" }}>{error?.message || "Unexpected error"}</p>
      <button onClick={() => reset()} className="rounded-md px-4 py-2 text-sm font-medium" style={{ backgroundColor: "var(--primary-color)", color: "#fff", border: "none", cursor: "pointer" }}>
        Try again
      </button>
    </div>
  );
}
