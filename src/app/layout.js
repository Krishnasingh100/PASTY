import "./globals.css";
import MobileBar from "@/components/MobileBar.jsx";
import Sidebar from "@/components/Sidebar.jsx";
import Toasts from "@/components/Toasts.jsx";

export const metadata = {
  title: "Pasty — share code with a short link",
  description: "Paste code, get a short ID, share with friends. Links expire automatically.",
};

const themeInit = `(function(){try{var t=localStorage.getItem("pasty-theme");document.documentElement.dataset.theme=(t==="light"||t==="sunset")?t:"grape";}catch(e){document.documentElement.dataset.theme="grape";}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="grape" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <MobileBar />
        <div className="shell">
          <Sidebar />
          <main className="thread-pane">{children}</main>
        </div>
        <Toasts />
      </body>
    </html>
  );
}
