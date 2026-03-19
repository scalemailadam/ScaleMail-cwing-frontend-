import React, { useState } from "react";
import Header from "../components/Navigation/Header";
import Dock from "../components/Dock/Dock";
import Desktop from "../components/Desktop/Desktop";

export default function Home() {
  const [openFolder, setOpenFolder] = useState(null); // the active window
  const [minimized, setMinimized] = useState([]); // array of folders
  const [isFull, setIsFull] = useState(false); // full-screen flag
  const [navModalSlug, setNavModalSlug] = useState(null);

  /* ---------- helpers ---------- */
  const open = (folder) => {
    setOpenFolder(folder);
    setIsFull(false);
    setMinimized((m) => m.filter((f) => f.documentId !== folder.documentId));
  };

  const close = () => setOpenFolder(null);
  const minimize = (folder) => {
    // ① we always know exactly which folder we’re dealing with
    const target = folder || openFolder;
    if (!target) return;

    // ② push it into the tray only if it isn’t there already
    setMinimized((m) =>
      m.some((f) => f.documentId === target.documentId) ? m : [...m, target]
    );

    // ③ if that folder was the active window, hide it
    if (openFolder && target.documentId === openFolder.documentId) {
      setOpenFolder(null);
    }
  };
  const toggleFS = () => openFolder && setIsFull((p) => !p);
  const restore = (folder) => open(folder);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <Header onMenuItemClick={(slug) => setNavModalSlug(slug)} />

      <Desktop
        openFolder={openFolder}
        onOpenFolder={open}
        onCloseFolder={close}
        onMinimizeFolder={minimize}
        onToggleFullscreen={toggleFS}
        isFullscreen={isFull}
        navModalSlug={navModalSlug}
        onNavModalHandled={() => setNavModalSlug(null)}
      />

      <Dock
        activeFolder={openFolder}
        minimizedFolders={minimized}
        onRestoreFolder={restore}
      />
    </div>
  );
}
