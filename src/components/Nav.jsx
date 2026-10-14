"use client";

import { useState } from "react";
import MobileBar from "./MobileBar.jsx";
import Sidebar from "./Sidebar.jsx";

// Shell nav: desktop sidebar inline, mobile sidebar as slide-in drawer.
export default function Nav({ children }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <MobileBar onMenu={() => setOpen(true)} />
      <div className="shell">
        <div className={`drawer${open ? " open" : ""}`}>
          <div className="drawer-backdrop" onClick={close} aria-hidden="true" />
          <Sidebar onNavigate={close} />
        </div>
        <main className="thread-pane">{children}</main>
      </div>
    </>
  );
}
