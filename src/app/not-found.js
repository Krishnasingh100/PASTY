import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="mb-2 text-2xl font-bold" style={{ color: "var(--foreground)" }}>Page not found</h1>
      <p className="mb-4 text-sm" style={{ color: "var(--muted-foreground)" }}>This link never existed or expired.</p>
      <Link href="/" className="inline-block rounded-md px-4 py-2 text-sm font-medium" style={{ backgroundColor: "var(--primary-color)", color: "#fff", textDecoration: "none" }}>
        Go home
      </Link>
    </div>
  );
}
