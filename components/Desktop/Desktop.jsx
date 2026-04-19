"use client";

import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@apollo/client";
import Draggable from "react-draggable";
import { Resizable } from "re-resizable";
import * as FaIcons from "react-icons/fa";
import { FaTimes, FaMinus, FaExpand, FaCompress } from "react-icons/fa";
import * as SiIcons from "react-icons/si";
import * as IoIcons from "react-icons/io5";
import * as GiIcons from "react-icons/gi";
import dynamic from "next/dynamic";
import { GET_FOLDER } from "@/graphql/queries";
import { useTheme } from "@/context/ThemeContext";

const ArmorBackground = dynamic(() => import("@/components/ArmorBackground"), {
  ssr: false,
});

const MW = {
  frame:     "#c8a030",
  frameDark: "#a07820",
  content:   "#060604",
  gold:      "#1e1808",
  goldDim:   "#0e0c04",
  cream:     "#d4c880",
  tan:       "#b8a868",
  goldText:  "#c8be78",
  muted:     "#504828",
};
const stoneNoise = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.35' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.9'/%3E%3C%2Fsvg%3E")`;
const iconStyle = { display: "block", width: "55%", height: "55%" };

// Wraps children in Resizable only when `condition` is true.
// Avoids duplicating Finder JSX for windowed vs fullscreen.
function ConditionalResizable({ condition, size, onResizeStart, onResizeStop, minWidth, minHeight, enable, children }) {
  if (!condition) return <>{children}</>;
  return (
    <Resizable size={size} onResizeStart={onResizeStart} onResizeStop={onResizeStop} minWidth={minWidth} minHeight={minHeight} enable={enable}>
      {children}
    </Resizable>
  );
}

import GarmentDesignModal from "../Modals/GarmentDesignModal";
import ResumeModal from "../Modals/ResumeModal";

import BrowserModal from "../Modals/BrowserModal";
import TextModal from "../Modals/TextModal";
import SystemSettingsModal from "../Modals/SystemSettingsModal";
const GhoulsGameModal = dynamic(() => import("../Modals/GhoulsGameModal"), { ssr: false });

const MODAL_COMPONENTS = {
  garmentdesignmodal: GarmentDesignModal,
  resumemodal: ResumeModal,
  browsermodal: BrowserModal,
  textmodal: TextModal,
  systemsettingsmodal: SystemSettingsModal,
  ghoulsgamemodal: GhoulsGameModal,
};

// Normalize slugs so "text modal", "Text Modal", "textModal" all match
const normalizeSlug = (s) => (s || "").replace(/[\s_-]+/g, "").toLowerCase();

export default function Desktop({
  openFolder,
  onOpenFolder,
  onCloseFolder,
  onMinimizeFolder,
  onToggleFullscreen,
  isFullscreen,
  navModalSlug,
  onNavModalHandled,
}) {
  const { data, loading, error } = useQuery(GET_FOLDER);
  const { isDark } = useTheme();
  const iconRefs = useRef([]);
  const modalRef = useRef(null);
  const desktopRef = useRef(null);
  const [finderViewFolder, setFinderViewFolder] = useState(null);

  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [finderSize, setFinderSize] = useState({ width: 800, height: 520 });
  const isFinderResizingRef = useRef(false);
  const [customModal, setCustomModal] = useState(null);
  const [openImageFolder, setOpenImageFolder] = useState(null);
  const [openPicture, setOpenPicture] = useState(null);
  const [openTextItem, setOpenTextItem] = useState(null);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [backStack, setBackStack] = useState([]);
  const [forwardStack, setForwardStack] = useState([]);

  // Mobile Finder navigation state
  const [mobileNavLevel, setMobileNavLevel] = useState("categories");
  const [activeCategoryFolders, setActiveCategoryFolders] = useState(null);
  const [activeCategoryName, setActiveCategoryName] = useState("");
  const [mobileBackStack, setMobileBackStack] = useState([]);
  const [slideDirection, setSlideDirection] = useState("right");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const swipeRef = useRef({ x: 0, y: 0 });

  // Multi-select state
  const [iconPositions, setIconPositions] = useState({});
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selBox, setSelBox] = useState(null);

  // Refs to avoid stale closures in document event listeners
  const iconPosRef = useRef({});
  const foldersRef = useRef([]);
  const dragStartRef = useRef({});

  useEffect(() => { iconPosRef.current = iconPositions; }, [iconPositions]);

  useEffect(() => {
    setIsTouchDevice(
      typeof window !== "undefined" &&
        ("ontouchstart" in window || navigator.maxTouchPoints > 0)
    );
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Initialize icon positions once data loads (re-runs when isMobile resolves)
  useEffect(() => {
    if (!data?.folderCategories) return;
    const dc = data.folderCategories.find((c) => c.name === "Desktop");
    const folders = dc?.desktop_folders || [];
    setIconPositions(() => {
      const next = {};
      const col = isMobile ? 10 : 40;
      const row = isMobile ? 90 : 100;
      const perCol = isMobile ? 5 : 999;
      folders.forEach((f, i) => {
        const c = Math.floor(i / perCol);
        const r = i % perCol;
        next[f.documentId] = { x: col + c * 80, y: 20 + r * row };
      });
      return next;
    });
  }, [data, isMobile]);

  useEffect(() => {
    if (openFolder && openFolder.modalSlug !== "openFolder") {
      setCustomModal(openFolder);
      setSelectedFolderId(openFolder.documentId);
    } else {
      setCustomModal(null);
    }
  }, [openFolder]);

  useEffect(() => {
    if (normalizeSlug(openFolder?.modalSlug) === "openfolder") {
      setFinderViewFolder(null);
      setSelectedFolderId(null);
      setBackStack([]);
      setForwardStack([]);
      setMobileNavLevel("categories");
      setActiveCategoryFolders(null);
      setActiveCategoryName("");
      setMobileBackStack([]);
    }
  }, [openFolder]);

  useEffect(() => {
    if (navModalSlug) {
      setCustomModal({ modalSlug: navModalSlug });
      if (onNavModalHandled) onNavModalHandled();
    }
  }, [navModalSlug]);

  if (loading) return null;
  if (error) return <p>Error loading folders: {error.message}</p>;

  const categories = data.folderCategories || [];
  const desktopCategory = categories.find((c) => c.name === "Desktop");
  const desktopFolders = desktopCategory?.desktop_folders || [];
  foldersRef.current = desktopFolders;
  const finderFolder = desktopFolders.find((f) => normalizeSlug(f.modalSlug) === "openfolder");
  iconRefs.current = desktopFolders.map(
    (_, i) => iconRefs.current[i] ?? React.createRef()
  );
  const finderItems = desktopFolders
    .flatMap((folder) => folder.items ?? [])
    .filter((item) => item && (item.title || item.Title));
  const finderCategories = categories
    .filter((c) => c.name !== "Desktop")
    .map((c) => ({ name: c.name, folders: c.desktop_folders, reactIcon: c.reactIcon, reactIconColor: c.reactIconColor, icon: c.icon }));

  const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? "";
  const toUrl = (u = "") => (u.startsWith("http") ? u : `${STRAPI_URL}${u}`);

  const openFolderOrModal = (folder) => {
    if (folder.url) {
      window.open(folder.url, "_blank", "noopener,noreferrer");
      return;
    }
    onOpenFolder(folder);
    if (normalizeSlug(folder.modalSlug) === "openfolder") {
      setFinderViewFolder(null);
      setSelectedFolderId(null);
      setBackStack([]);
      setForwardStack([]);
      setCustomModal(null);
    } else {
      setCustomModal(folder);
      setSelectedFolderId(folder.documentId);
    }
  };

  const minimizeCustomModal = (folder) => {
    onMinimizeFolder(folder);
    setCustomModal(null);
  };

  const handleSidebarClick = (folder) => {
    const finder = desktopFolders.find((f) => normalizeSlug(f.modalSlug) === "openfolder");
    if (finder && openFolder?.modalSlug !== "openFolder") {
      onOpenFolder(finder);
    }
    setSelectedFolderId(folder.documentId);
    setFinderViewFolder(folder);
    setBackStack([]);
    setForwardStack([]);
  };

  const finderSubItems = desktopFolders.flatMap((folder) => folder.items);

  const goBack = () => {
    if (backStack.length === 0) return;
    const prev = backStack[backStack.length - 1];
    setBackStack(backStack.slice(0, -1));
    setForwardStack([...forwardStack, finderViewFolder]);
    setFinderViewFolder(prev);
  };

  const goForward = () => {
    if (forwardStack.length === 0) return;
    const next = forwardStack[forwardStack.length - 1];
    setForwardStack(forwardStack.slice(0, -1));
    setBackStack([...backStack, finderViewFolder]);
    setFinderViewFolder(next);
  };

  // ── Mobile Finder navigation ─────────────────────────────────────────────
  const mobileNavigateTo = (level, data) => {
    setSlideDirection("right");
    setMobileBackStack((prev) => [
      ...prev,
      { level: mobileNavLevel, categoryFolders: activeCategoryFolders, categoryName: activeCategoryName, folder: finderViewFolder },
    ]);
    if (level === "folders") {
      setMobileNavLevel("folders");
      setActiveCategoryFolders(data.folders);
      setActiveCategoryName(data.name);
      setFinderViewFolder(null);
    } else if (level === "items") {
      setMobileNavLevel("items");
      setFinderViewFolder(data.folder);
      setSelectedFolderId(data.folder?.documentId);
    }
  };

  const mobileGoBack = () => {
    if (mobileBackStack.length === 0) { onCloseFolder(); return; }
    setSlideDirection("left");
    const prev = mobileBackStack[mobileBackStack.length - 1];
    setMobileBackStack((s) => s.slice(0, -1));
    setMobileNavLevel(prev.level);
    setActiveCategoryFolders(prev.categoryFolders);
    setActiveCategoryName(prev.categoryName);
    setFinderViewFolder(prev.folder);
  };

  const handleSwipeStart = (e) => {
    swipeRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleSwipeEnd = (e) => {
    const dx = e.changedTouches[0].clientX - swipeRef.current.x;
    const dy = Math.abs(e.changedTouches[0].clientY - swipeRef.current.y);
    if (swipeRef.current.x < 30 && dx > 60 && dy < 100) mobileGoBack();
  };

  const mobileHandleItemTap = (item) => {
    const slug = normalizeSlug(item.modalSlug);
    const title = item.title ?? item.text;
    const thumbUrl = item.icon?.[0]?.url ?? item.image?.[0]?.url;

    if (item.url) { window.open(item.url, "_blank", "noopener,noreferrer"); return; }
    if (slug === "textmodal") {
      setCustomModal({ ...item, documentId: item.documentId || `text-${item.id}` });
      return;
    }
    if (slug === "imagefoldermodal") { setOpenImageFolder(item); return; }
    if (slug === "picturemodal") { if (thumbUrl) setOpenPicture({ url: toUrl(thumbUrl), title }); return; }
    if (slug && MODAL_COMPONENTS[slug]) { setCustomModal({ ...item, items: item.items ?? [item] }); return; }

    // Navigate into sub-items
    if (item.subItem?.length) {
      mobileNavigateTo("items", { folder: item });
      return;
    }
    // Fallback: image
    const fullUrl = item.contentItems?.image?.[0]?.url;
    if (fullUrl) setOpenPicture({ url: toUrl(fullUrl), title });
  };

  // Extracted grid item click handler (used by both onClick and onTouchEnd)
  const handleGridItemClick = (item, thumbUrl, title) => {
    const slug = normalizeSlug(item.modalSlug);
    if (slug === "textmodal") {
      // Route through customModal so minimize works correctly
      setCustomModal({ ...item, documentId: item.documentId || `text-${item.id}` });
      return;
    }
    if (slug === "imagefoldermodal") { setOpenImageFolder(item); return; }
    if (slug === "picturemodal") { if (thumbUrl) setOpenPicture({ url: toUrl(thumbUrl), title }); return; }

    // Generic: any slug that maps to a registered modal component
    if (slug && MODAL_COMPONENTS[slug]) {
      // Wrap item so modals that expect folder.items (like ResumeModal) still work
      setCustomModal({ ...item, items: item.items ?? [item] });
      return;
    }

    if (normalizeSlug(openFolder?.modalSlug) === "openfolder") {
      if (!finderViewFolder) {
        setBackStack((prev) => [...prev, finderViewFolder]);
        setFinderViewFolder(item);
        setForwardStack([]);
        return;
      }
      const fullUrl = item.contentItems?.image?.[0]?.url;
      if (fullUrl) setOpenPicture({ url: toUrl(fullUrl), title });
    } else {
      if (item.url) window.open(item.url, "_blank");
    }
  };

  // ── Icon drag handlers ──────────────────────────────────────────────────────

  const handleIconDrag = (documentId, data) => {
    const { deltaX, deltaY } = data;
    setIconPositions((prev) => {
      const next = { ...prev };
      const ids =
        selectedIds.has(documentId) && selectedIds.size > 1
          ? [...selectedIds]
          : [documentId];
      ids.forEach((id) => {
        const cur = prev[id] ?? { x: 0, y: 0 };
        next[id] = { x: cur.x + deltaX, y: cur.y + deltaY };
      });
      return next;
    });
  };

  const handleIconDragStart = (documentId) => {
    dragStartRef.current[documentId] = iconPosRef.current[documentId] ?? { x: 0, y: 0 };
  };

  const handleIconStop = (documentId) => {
    if (isTouchDevice) {
      const start = dragStartRef.current[documentId];
      const end = iconPosRef.current[documentId] ?? { x: 0, y: 0 };
      const dist = Math.abs((end.x - (start?.x ?? end.x))) + Math.abs((end.y - (start?.y ?? end.y)));
      if (dist < 10) {
        const folder = foldersRef.current.find((f) => f.documentId === documentId);
        if (folder) openFolderOrModal(folder);
      }
    }
  };

  // ── Rubber-band selection ───────────────────────────────────────────────────

  const handleDesktopMouseDown = (e) => {
    // Only fire when clicking the bare desktop (not an icon or modal)
    if (e.target !== desktopRef.current) return;
    e.preventDefault();

    const rect = desktopRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;

    setSelBox({ x: startX, y: startY, w: 0, h: 0 });
    setSelectedIds(new Set());

    const onMove = (e) => {
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const x = Math.min(startX, cx);
      const y = Math.min(startY, cy);
      const w = Math.abs(cx - startX);
      const h = Math.abs(cy - startY);
      setSelBox({ x, y, w, h });

      // Check which icons intersect the selection box
      const hit = new Set();
      foldersRef.current.forEach((f) => {
        const pos = iconPosRef.current[f.documentId];
        if (!pos) return;
        if (
          pos.x < x + w &&
          pos.x + 64 > x &&
          pos.y < y + h &&
          pos.y + 80 > y
        ) {
          hit.add(f.documentId);
        }
      });
      setSelectedIds(hit);
    };

    const onUp = () => {
      setSelBox(null);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  // ── Icon rendering ──────────────────────────────────────────────────────────

  const renderFolderIcon = (folder, cls = "w-16 h-16 object-cover", tint = false) => {
    const imgUrl = folder.icon?.[0]?.url;
    if (imgUrl) {
      return (
        <img
          src={toUrl(imgUrl)}
          alt={folder.title}
          draggable="false"
          className={`${cls} object-contain`}
          style={tint ? { filter: "sepia(0.8) saturate(1.8) hue-rotate(-5deg) brightness(0.68)" } : undefined}
        />
      );
    }
    const Icon =
      FaIcons[folder.reactIcon] ||
      IoIcons[folder.reactIcon] ||
      GiIcons[folder.reactIcon] ||
      SiIcons[folder.reactIcon] ||
      FaIcons.FaFolder;
    return (
      <Icon
        className={cls}
        style={{ color: tint ? MW.frameDark : (folder.reactIconColor ?? "#7DD3FC") }}
      />
    );
  };

  const renderItemThumb = (item, cls = "w-12 h-12") => {
    const imgUrl = item.icon?.[0]?.url;
    return imgUrl ? (
      <img src={toUrl(imgUrl)} className={`${cls} object-contain`} />
    ) : (
      renderFolderIcon(item, cls)
    );
  };

  return (
    <div
      ref={desktopRef}
      className="relative flex-1"
      onMouseDown={handleDesktopMouseDown}
    >
      {/* Desktop icons */}
      {desktopFolders.map((folder, i) => {
        const ref = iconRefs.current[i];
        const pos = iconPositions[folder.documentId] ?? { x: 40, y: 20 + i * 100 };
        const isSelected = selectedIds.has(folder.documentId);

        return (
          <Draggable
            key={folder.documentId}
            bounds="parent"
            nodeRef={ref}
            position={pos}
            onStart={() => handleIconDragStart(folder.documentId)}
            onDrag={(e, data) => handleIconDrag(folder.documentId, data)}
            onStop={() => handleIconStop(folder.documentId)}
          >
            <div
              ref={ref}
              className="absolute cursor-pointer select-none"
              style={isSelected ? { outline: "2px solid rgba(100,149,237,0.8)", outlineOffset: "3px" } : {}}
              onMouseDown={(e) => {
                e.stopPropagation();
                if (!e.ctrlKey && !e.metaKey) {
                  setSelectedIds(new Set([folder.documentId]));
                } else {
                  setSelectedIds((prev) => {
                    const next = new Set(prev);
                    next.has(folder.documentId)
                      ? next.delete(folder.documentId)
                      : next.add(folder.documentId);
                    return next;
                  });
                }
              }}
              onDoubleClick={() => !isTouchDevice && openFolderOrModal(folder)}
            >
              <div className="w-16 flex flex-col items-center">
                {renderFolderIcon(folder, "w-16 h-16 object-cover", false)}
                <span className="mt-2 text-white text-center">
                  {folder.title}
                </span>
              </div>
            </div>
          </Draggable>
        );
      })}

      {/* Rubber-band selection box */}
      {selBox && selBox.w > 3 && selBox.h > 3 && (
        <div
          className="absolute pointer-events-none z-10 border border-blue-400 bg-blue-400/20"
          style={{ left: selBox.x, top: selBox.y, width: selBox.w, height: selBox.h }}
        />
      )}

      {/* ——— Finder (first‑level modal) ——— */}
      {normalizeSlug(openFolder?.modalSlug) === "openfolder" && (
        isMobile ? (
          /* ═══ MOBILE FINDER (Mac-style window) ═══ */
          <div
            className="absolute inset-0 flex items-center justify-center z-30"
            onClick={() => onMinimizeFolder(openFolder)}
          >
            <Draggable handle=".title-bar" bounds="parent" nodeRef={modalRef} disabled={isFullscreen}>
            <div
              ref={modalRef}
              onClick={(e) => e.stopPropagation()}
              className={`flex flex-col overflow-hidden ${isFullscreen ? "w-full h-full" : "w-[calc(100%-1rem)] h-[calc(100%-6rem)] max-w-[500px]"}`}
              style={{
                padding: "5px",
                backgroundColor: MW.frame,
                backgroundImage: stoneNoise,
                border: `1px solid ${MW.gold}`,
                boxShadow: `0 0 0 1px ${MW.goldDim}, 0 24px 72px rgba(0,0,0,0.95)`,
              }}
            >
              <div className="flex flex-col overflow-hidden" style={{ flex: 1, minHeight: 0, backgroundColor: MW.content, border: `1px solid ${MW.gold}` }}>
              {/* ── Title bar ── */}
              <div
                className="title-bar relative flex items-center justify-center flex-shrink-0 h-8 px-3 cursor-move"
                style={{ backgroundColor: MW.frameDark, backgroundImage: stoneNoise, borderBottom: `1px solid ${MW.gold}` }}
              >
                <div className="absolute left-3 flex items-center space-x-1.5">
                <button onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()} onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); onCloseFolder(); }} onClick={onCloseFolder} className="w-5 h-5 md:w-3 md:h-3 rounded-full flex-shrink-0 transition-instant flex items-center justify-center" style={{ backgroundColor: MW.frame, border: `1px solid ${MW.gold}` }}>
                  <FaTimes style={{ ...iconStyle, color: MW.content }} />
                </button>
                <button onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()} onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); onMinimizeFolder(openFolder); }} onClick={() => onMinimizeFolder(openFolder)} className="w-5 h-5 md:w-3 md:h-3 rounded-full flex-shrink-0 transition-instant flex items-center justify-center" style={{ backgroundColor: MW.frame, border: `1px solid ${MW.gold}` }}>
                  <FaMinus style={{ ...iconStyle, color: MW.content }} />
                </button>
                <button onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()} onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); onToggleFullscreen(); }} onClick={(e) => { e.stopPropagation(); onToggleFullscreen(); }} className="w-5 h-5 md:w-3 md:h-3 rounded-full flex-shrink-0 transition-instant flex items-center justify-center" style={{ backgroundColor: MW.frame, border: `1px solid ${MW.gold}` }}>
                  {isFullscreen ? <FaCompress style={{ ...iconStyle, color: MW.content }} /> : <FaExpand style={{ ...iconStyle, color: MW.content }} />}
                </button>
                <button onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); goBack(); }} onClick={(e) => { e.stopPropagation(); goBack(); }} disabled={backStack.length === 0} className="disabled:opacity-30 ml-1 transition-instant">
                  <FaIcons.FaChevronLeft className="text-xs" style={{ color: MW.goldText }} />
                </button>
                <button onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); goForward(); }} onClick={(e) => { e.stopPropagation(); goForward(); }} disabled={forwardStack.length === 0} className="disabled:opacity-30 transition-instant">
                  <FaIcons.FaChevronRight className="text-xs" style={{ color: MW.goldText }} />
                </button>
                </div>
                <span className="text-xs font-serif tracking-widest uppercase select-none truncate" style={{ color: MW.cream, backgroundColor: MW.content, padding: "1px 8px" }}>
                  {finderViewFolder ? finderViewFolder.title : "Finder"}
                </span>
                <button onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); setMobileSidebarOpen((o) => !o); }} onClick={() => setMobileSidebarOpen((o) => !o)} className="absolute right-3 transition-instant" style={{ color: MW.goldText }}>
                  <FaIcons.FaBars className="text-sm" />
                </button>
              </div>

              {/* ── Body: sidebar + main content ── */}
              <div className="flex flex-1 overflow-hidden relative" style={{ backgroundColor: MW.content }}>
                {mobileSidebarOpen && (
                  <>
                    <div className="absolute inset-0 z-10" style={{ backgroundColor: "rgba(0,0,0,0.7)" }} onClick={() => setMobileSidebarOpen(false)} onTouchEnd={(e) => { e.stopPropagation(); setMobileSidebarOpen(false); }} />
                    <aside className="absolute left-0 top-0 bottom-0 w-3/5 max-w-[220px] overflow-y-auto z-20 mobile-sidebar-slide-in" style={{ backgroundColor: MW.goldDim, borderRight: `1px solid ${MW.gold}` }}>
                      <div className="px-3 py-1 text-[10px] font-semibold uppercase font-serif" style={{ color: MW.muted }}>Finder</div>
                      <div
                        onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); onOpenFolder(finderFolder); setFinderViewFolder(null); setSelectedFolderId(null); setBackStack([]); setForwardStack([]); setMobileSidebarOpen(false); }}
                        onClick={() => { onOpenFolder(finderFolder); setFinderViewFolder(null); setSelectedFolderId(null); setBackStack([]); setForwardStack([]); setMobileSidebarOpen(false); }}
                        className="flex items-center px-3 py-2.5 cursor-pointer transition-instant"
                        style={{ backgroundColor: selectedFolderId === null ? MW.gold : "transparent", color: selectedFolderId === null ? MW.cream : MW.tan }}
                      >
                        {finderFolder && renderFolderIcon(finderFolder, "w-5 h-5 mr-2")}
                        <span className="text-sm font-serif">Finder</span>
                      </div>
                      {finderCategories.map(({ name, folders, reactIcon, reactIconColor, icon }) => {
                        const CatIcon = (reactIcon && (FaIcons[reactIcon] || IoIcons[reactIcon] || GiIcons[reactIcon] || SiIcons[reactIcon])) || FaIcons.FaFolder;
                        const iconUrl = icon?.url;
                        return (
                          <div key={name} className="mb-2">
                            <div className="px-3 py-1 text-[10px] font-semibold uppercase font-serif flex items-center gap-1" style={{ color: MW.muted }}>
                              {iconUrl ? <img src={toUrl(iconUrl)} className="w-3 h-3 object-contain" /> : <CatIcon className="w-3 h-3" style={{ color: reactIconColor || MW.frame }} />}
                              {name}
                            </div>
                            {folders.map((f) => {
                              const isActive = f.documentId === selectedFolderId;
                              return (
                                <div key={f.documentId} onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); handleSidebarClick(f); setMobileSidebarOpen(false); }} onClick={() => { handleSidebarClick(f); setMobileSidebarOpen(false); }} className="flex items-center px-3 py-2.5 cursor-pointer transition-instant" style={{ backgroundColor: isActive ? MW.gold : "transparent", color: isActive ? MW.cream : MW.tan }}>
                                  {renderFolderIcon(f, "w-5 h-5 mr-2")}
                                  <span className="text-sm font-serif truncate">{f.title}</span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </aside>
                  </>
                )}

                <main className="flex-1 p-3 overflow-y-auto" style={{ backgroundColor: MW.content }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "0.75rem" }}>
                    {(finderViewFolder ? finderViewFolder.items ?? finderViewFolder.subItem ?? [] : finderItems).map((item) => {
                      const title = item.title ?? item.text;
                      const thumbUrl = item.icon?.[0]?.url ?? item.image?.[0]?.url;
                      if (item.url) {
                        return (
                          <a key={item.id || item.documentId} href={item.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center p-2 cursor-pointer transition-instant">
                            {thumbUrl ? <img src={toUrl(thumbUrl)} className="w-10 h-10 object-contain" /> : renderFolderIcon(item, "w-10 h-10")}
                            <span className="mt-1 text-xs text-center leading-tight font-serif" style={{ color: MW.tan }}>{title}</span>
                          </a>
                        );
                      }
                      return (
                        <div key={item.id || item.documentId} className="flex flex-col items-center p-2 cursor-pointer transition-instant" onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); handleGridItemClick(item, thumbUrl, title); }} onClick={() => handleGridItemClick(item, thumbUrl, title)}>
                          {thumbUrl ? <img src={toUrl(thumbUrl)} className="w-10 h-10 object-contain" /> : renderFolderIcon(item, "w-10 h-10")}
                          <span className="mt-1 text-xs text-center leading-tight font-serif" style={{ color: MW.tan }}>{title}</span>
                        </div>
                      );
                    })}
                  </div>
                </main>
              </div>
              </div>
            </div>
            </Draggable>
          </div>
        ) : (
          /* ═══ DESKTOP FINDER ═══ */
          <div
            className="absolute inset-0 flex items-center justify-center z-30"
            onClick={() => { if (!isFinderResizingRef.current) onMinimizeFolder(openFolder); }}
          >
            <Draggable handle=".title-bar" bounds="parent" nodeRef={modalRef} disabled={isFullscreen}>
              <div
                ref={modalRef}
                className={isFullscreen ? "absolute inset-0" : ""}
                style={{ display: isFullscreen ? "block" : "inline-block" }}
                onClick={(e) => e.stopPropagation()}
              >
              <ConditionalResizable
                condition={!isFullscreen}
                size={finderSize}
                onResizeStart={() => { isFinderResizingRef.current = true; }}
                onResizeStop={(e, dir, ref) => {
                  setFinderSize({ width: ref.offsetWidth, height: ref.offsetHeight });
                  setTimeout(() => { isFinderResizingRef.current = false; }, 100);
                }}
                minWidth={400}
                minHeight={300}
                enable={{ top: false, right: false, bottom: false, left: false, topRight: true, bottomRight: true, bottomLeft: true, topLeft: true }}
              >
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full h-full flex flex-col overflow-hidden"
                style={{ backgroundColor: MW.frame, backgroundImage: stoneNoise, padding: "5px" }}
              >
                <div className="flex flex-col overflow-hidden" style={{ flex: 1, minHeight: 0, backgroundColor: MW.content, border: `1px solid ${MW.gold}` }}>
                {/* title bar */}
                <div className="title-bar relative flex items-center justify-center flex-shrink-0 h-8 px-3 cursor-move" style={{ backgroundColor: MW.frameDark, backgroundImage: stoneNoise, borderBottom: `1px solid ${MW.gold}` }}>
                  <div className="absolute left-3 flex items-center space-x-1.5">
                    <button onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()} onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); onCloseFolder(); }} onClick={onCloseFolder} className="w-5 h-5 md:w-3 md:h-3 rounded-full flex-shrink-0 transition-instant flex items-center justify-center" style={{ backgroundColor: MW.frame, border: `1px solid ${MW.gold}` }}>
                      <FaTimes style={{ ...iconStyle, color: MW.content }} />
                    </button>
                    <button onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()} onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); onMinimizeFolder(openFolder); }} onClick={() => onMinimizeFolder(openFolder)} className="w-5 h-5 md:w-3 md:h-3 rounded-full flex-shrink-0 transition-instant flex items-center justify-center" style={{ backgroundColor: MW.frame, border: `1px solid ${MW.gold}` }}>
                      <FaMinus style={{ ...iconStyle, color: MW.content }} />
                    </button>
                    <button onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()} onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); onToggleFullscreen(); }} onClick={(e) => { e.stopPropagation(); onToggleFullscreen(); }} className="w-5 h-5 md:w-3 md:h-3 rounded-full flex-shrink-0 transition-instant flex items-center justify-center" style={{ backgroundColor: MW.frame, border: `1px solid ${MW.gold}` }}>
                      {isFullscreen ? <FaCompress style={{ ...iconStyle, color: MW.content }} /> : <FaExpand style={{ ...iconStyle, color: MW.content }} />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); goBack(); }} disabled={backStack.length === 0} className="disabled:opacity-30 ml-1">
                      <FaIcons.FaChevronLeft className="text-xs" style={{ color: MW.goldText }} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); goForward(); }} disabled={forwardStack.length === 0} className="disabled:opacity-30">
                      <FaIcons.FaChevronRight className="text-xs" style={{ color: MW.goldText }} />
                    </button>
                  </div>
                  <span className="text-xs font-serif tracking-widest uppercase select-none" style={{ color: MW.cream, backgroundColor: MW.content, padding: "1px 8px" }}>
                    {finderViewFolder ? finderViewFolder.title : "Finder"}
                  </span>
                </div>

                <div className="flex flex-1 overflow-hidden">
                  <aside className="w-1/4 overflow-y-auto" style={{ backgroundColor: MW.goldDim, borderRight: `1px solid ${MW.gold}` }}>
                    <div className="px-4 py-1 text-xs font-semibold uppercase font-serif" style={{ color: MW.muted }}>Finder</div>
                    <div onClick={() => { onOpenFolder(finderFolder); setFinderViewFolder(null); setSelectedFolderId(null); setBackStack([]); setForwardStack([]); }} className="flex items-center px-4 py-2 cursor-pointer transition-instant" style={{ backgroundColor: selectedFolderId === null ? MW.gold : "transparent", color: selectedFolderId === null ? MW.cream : MW.tan }}>
                      {renderFolderIcon(finderFolder, "w-5 h-5 mr-2")}
                      <span className="font-serif text-sm">Finder</span>
                    </div>
                    {finderCategories.map(({ name, folders, reactIcon, reactIconColor, icon }) => {
                      const CatIcon = (reactIcon && (FaIcons[reactIcon] || IoIcons[reactIcon] || GiIcons[reactIcon] || SiIcons[reactIcon])) || FaIcons.FaFolder;
                      const iconUrl = icon?.url;
                      return (
                        <div key={name} className="mb-4">
                          <div className="px-4 py-1 text-xs font-semibold uppercase font-serif flex items-center gap-1" style={{ color: MW.muted }}>
                            {iconUrl ? <img src={toUrl(iconUrl)} className="w-3 h-3 object-contain" /> : <CatIcon className="w-3 h-3" style={{ color: reactIconColor || MW.frame }} />}
                            {name}
                          </div>
                          {folders.map((f) => {
                            const isActive = f.documentId === selectedFolderId;
                            return (
                              <div key={f.documentId} onClick={() => handleSidebarClick(f)} className="flex items-center px-4 py-2 cursor-pointer transition-instant" style={{ backgroundColor: isActive ? MW.gold : "transparent", color: isActive ? MW.cream : MW.tan }}>
                                {renderFolderIcon(f, "w-5 h-5 mr-2")}
                                <span className="font-serif text-sm">{f.title}</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </aside>

                  <main className="flex-1 p-4 overflow-y-auto" style={{ backgroundColor: MW.content }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: "1rem" }}>
                      {(finderViewFolder ? finderViewFolder.items ?? finderViewFolder.subItem ?? [] : finderItems).map((item) => {
                        const title = item.title ?? item.text;
                        const thumbUrl = item.icon?.[0]?.url ?? item.image?.[0]?.url;
                        if (item.url) {
                          return (
                            <a key={item.id || item.documentId} href={item.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center p-2 cursor-pointer transition-instant">
                              {thumbUrl ? <img src={toUrl(thumbUrl)} className="w-12 h-12 object-contain" /> : renderFolderIcon(item, "w-12 h-12")}
                              <span className="mt-2 text-xs text-center font-serif" style={{ color: MW.tan }}>{title}</span>
                            </a>
                          );
                        }
                        return (
                          <div key={item.id || item.documentId} className="flex flex-col items-center p-2 cursor-pointer transition-instant" onClick={() => handleGridItemClick(item, thumbUrl, title)}>
                            {thumbUrl ? <img src={toUrl(thumbUrl)} className="w-12 h-12 object-contain" /> : renderFolderIcon(item, "w-12 h-12")}
                            <span className="mt-2 text-xs text-center font-serif" style={{ color: MW.tan }}>{title}</span>
                          </div>
                        );
                      })}
                    </div>
                  </main>
                </div>
                </div>
              </div>
              </ConditionalResizable>
              </div>
            </Draggable>
          </div>
        )
      )}

      {customModal &&
        (() => {
          const Modal = MODAL_COMPONENTS[normalizeSlug(customModal.modalSlug)];
          return Modal ? (
            <Modal
              folder={customModal}
              onClose={() => {
                setCustomModal(null);
                if (normalizeSlug(openFolder?.modalSlug) !== "openfolder") {
                  onCloseFolder();
                }
              }}
              onMinimizeFolder={() => minimizeCustomModal(customModal)}
            />
          ) : (
            <div
              className="fixed inset-0 flex items-center justify-center"
              onClick={() => setCustomModal(null)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className={`border rounded-lg p-6 ${isDark ? "bg-[#201e25] border-gray-900 text-white" : "bg-white border-gray-300 text-gray-800"}`}
              >
                <p>
                  🚧 No modal defined for <code>{customModal.modalSlug}</code>{" "}
                  yet.
                </p>
              </div>
            </div>
          );
        })()}

      {/* ——— Image‑folder (second‑level Finder) ——— */}
      {openImageFolder && (
        <div className="fixed inset-0 flex items-center justify-center z-40" onClick={() => setOpenImageFolder(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full h-full md:w-2/3 md:h-2/3 flex flex-col overflow-hidden" style={{ padding: "5px", backgroundColor: MW.frame, backgroundImage: stoneNoise, border: `1px solid ${MW.gold}`, boxShadow: `0 0 0 1px ${MW.goldDim}` }}>
            <div className="flex flex-col overflow-hidden" style={{ flex: 1, backgroundColor: MW.content, border: `1px solid ${MW.gold}` }}>
            <div className="relative flex items-center justify-center h-8 px-3" style={{ backgroundColor: MW.frameDark, backgroundImage: stoneNoise, borderBottom: `1px solid ${MW.gold}` }}>
              <div className="absolute left-3 flex items-center space-x-1.5">
                <button onMouseDown={(e) => e.stopPropagation()} onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); setOpenImageFolder(null); }} onClick={() => setOpenImageFolder(null)} className="w-5 h-5 md:w-3 md:h-3 rounded-full flex-shrink-0 transition-instant flex items-center justify-center" style={{ backgroundColor: MW.frame, border: `1px solid ${MW.gold}` }}>
                  <FaTimes style={{ ...iconStyle, color: MW.content }} />
                </button>
              </div>
              <span className="text-xs font-serif tracking-widest uppercase select-none" style={{ color: MW.cream, backgroundColor: MW.content, padding: "1px 8px" }}>{openImageFolder.title}</span>
            </div>

            <main className="flex-1 p-4 overflow-y-auto" style={{ backgroundColor: MW.content }}>
              <div className="grid grid-cols-4 gap-4">
                {openImageFolder.subItem.map((sub) => {
                  const firstImg = sub.contentItems?.image?.[0]?.url;

                  return (
                    <div
                      key={sub.id}
                      onClick={() => firstImg && setOpenPicture({ url: toUrl(firstImg), title: sub.text })}
                      className="flex flex-col items-center p-2 cursor-pointer transition-instant"
                    >
                      {firstImg ? (
                        <img src={toUrl(firstImg)} className="w-12 h-12 object-contain" />
                      ) : (
                        <FaIcons.FaRegFile className="w-12 h-12" style={{ color: MW.muted }} />
                      )}
                      <span className="mt-2 text-xs text-center font-serif" style={{ color: MW.tan }}>
                        {sub.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </main>
            </div>
          </div>
        </div>
      )}

      {/* ——— full‑screen picture viewer ——— */}
      {openPicture && (
        <div
          className="absolute left-0 right-0 top-1 bottom-22 max-w-screen flex flex-col overflow-hidden z-50"
          style={{ backgroundColor: MW.content, border: `1px solid ${MW.gold}` }}
          onClick={() => setOpenPicture(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex items-center justify-center h-8 px-3 flex-shrink-0"
            style={{ backgroundColor: MW.frameDark, backgroundImage: stoneNoise, borderBottom: `1px solid ${MW.gold}` }}
          >
            <div className="absolute left-3 flex items-center space-x-1.5">
              <button onMouseDown={(e) => e.stopPropagation()} onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); setOpenPicture(null); }} onClick={() => setOpenPicture(null)} className="w-5 h-5 md:w-3 md:h-3 rounded-full flex-shrink-0 transition-instant flex items-center justify-center" style={{ backgroundColor: MW.frame, border: `1px solid ${MW.gold}` }}>
                <FaTimes style={{ ...iconStyle, color: MW.content }} />
              </button>
            </div>
            <span className="text-xs font-serif tracking-widest uppercase select-none" style={{ color: MW.cream, backgroundColor: MW.content, padding: "1px 8px" }}>{openPicture.title}</span>
          </div>

          <div onClick={(e) => e.stopPropagation()} className="flex-1 flex items-center justify-center overflow-auto" style={{ backgroundColor: MW.content }}>
            <img src={openPicture.url} alt={openPicture.title} className="max-w-full max-h-full object-contain" style={{ border: `1px solid ${MW.gold}` }} />
          </div>
        </div>
      )}

      {/* text modals now route through customModal for proper minimize support */}
    </div>
  );
}
