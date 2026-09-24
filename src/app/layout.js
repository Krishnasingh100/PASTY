import "./globals.css";
import Navbar from "@/components/Navbar.jsx";
import Toasts from "@/components/Toasts.jsx";

export const metadata = {
  title: "Pasty — share code with a short link",
  description: "Paste code, get a short ID, share with friends. Links expire automatically.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="mx-auto w-full max-w-5xl px-4 py-6">{children}</main>
        <footer className="mx-auto w-full max-w-5xl px-4 pb-8 text-center text-xs" style={{ color: "var(--muted-foreground)" }}>
          Pasty · links expire automatically ·{" "}
          <a href="/api/health" style={{ color: "var(--muted-foreground)" }}>
            health
          </a>
        </footer>
        <Toasts />
      </body>
    </html>
  );
}
