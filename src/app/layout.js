import "./globals.css";
import Navbar from "@/components/Navbar.jsx";
import Toasts from "@/components/Toasts.jsx";

export const metadata = {
  title: "Pasty — share code with a short link",
  description: "Paste code, get a short ID, share with friends. Links expire automatically.",
};

const themeInit = `(function(){try{var t=localStorage.getItem("pasty-theme");if(t==="light"||t==="ocean")document.documentElement.dataset.theme=t;else document.documentElement.dataset.theme="dark";}catch(e){document.documentElement.dataset.theme="dark";}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <Navbar />
        <main className="wrap" style={{ maxWidth: "56rem" }}>{children}</main>
        <footer className="wrap text-center text-xs muted" style={{ maxWidth: "56rem", paddingTop: 0 }}>
          Pasty · links expire automatically ·{" "}
          <a href="/api/health" className="muted">
            health
          </a>
        </footer>
        <Toasts />
      </body>
    </html>
  );
}
