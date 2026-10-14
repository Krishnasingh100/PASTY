import "./globals.css";
import Nav from "@/components/Nav.jsx";
import Toasts from "@/components/Toasts.jsx";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "Pasty — share code with a short link",
  description: "Paste code, get a short ID, share with friends. Links expire automatically.",
  icons: { icon: "/favicon.svg" },
};

const themeInit = `(function(){try{var t=localStorage.getItem("pasty-theme");document.documentElement.dataset.theme=(t==="black")?"black":"light";}catch(e){document.documentElement.dataset.theme="light";}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <Nav>{children}</Nav>
        <Toasts />
      </body>
    </html>
  );
}
