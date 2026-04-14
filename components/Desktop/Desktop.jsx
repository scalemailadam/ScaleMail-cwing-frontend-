"use client";

import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@apollo/client";
import Draggable from "react-draggable";
import * as FaIcons from "react-icons/fa";
import * as SiIcons from "react-icons/si";
import * as IoIcons from "react-icons/io5";
import * as GiIcons from "react-icons/gi";
import dynamic from "next/dynamic";
import { GET_FOLDER } from "@/graphql/queries";
import { useTheme } from "@/context/ThemeContext";

const ArmorBackground = dynamic(() => import("@/components/ArmorBackground"), {
  ssr: false,
});

import GarmentDesignModal from "../Modals/GarmentDesignModal";
import ResumeModal from "../Modals/ResumeModal";

import BrowserModal from "../Modals/BrowserModal";
import TextModal from "../Modals/TextModal";
import SystemSettingsModal from "../Modals/SystemSettingsModal";

const MODAL_COMPONENTS = {
  garmentdesignmodal: GarmentDesignModal,
  resumemodal: ResumeModal,
  browsermodal: BrowserModal,
  textmodal: TextModal,
  systemsettingsmodal: SystemSettingsModal,
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

  // Initialize icon positions once data loads
  useEffect(() => {
    if (!data?.folderCategories) return;
    const dc = data.folderCategories.find((c) => c.name === "Desktop");
    const folders = dc?.desktop_folders || [];
    setIconPositions((prev) => {
      const next = { ...prev };
      folders.forEach((f, i) => {
        if (!next[f.documentId]) next[f.documentId] = { x: 40, y: 20 + i * 100 };
      });
      return next;
    });
  }, [data]);

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
    folder.__loaded = true;
    onMinimizeFolder(folder);
    onCloseFolder();
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
    if (slug === "textmodal") { setOpenTextItem(item); return; }
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
    if (slug === "textmodal") { setOpenTextItem(item); return; }
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

  const renderFolderIcon = (folder, cls = "w-16 h-16 object-cover") => {
    const imgUrl = folder.icon?.[0]?.url;
    if (imgUrl) {
      return (
        <img
          src={toUrl(imgUrl)}
          alt={folder.title}
          draggable="false"
          className={`${cls} object-contain`}
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
        style={{ color: folder.reactIconColor ?? "#7DD3FC" }}
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
                {renderFolderIcon(folder)}
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
            onClick={onCloseFolder}
          >
            <Draggable handle=".title-bar" bounds="parent" nodeRef={modalRef} disabled={isFullscreen}>
            <div
              ref={modalRef}
              onClick={(e) => e.stopPropagation()}
              className={`border rounded-lg shadow-2xl flex flex-col overflow-hidden ${
                isFullscreen
                  ? "w-full h-full rounded-none"
                  : "w-[calc(100%-1rem)] h-[calc(100%-6rem)] max-w-[500px]"
              } ${isDark ? "bg-[#201e25] border-gray-900" : "bg-white border-gray-300"}`}
            >
              {/* ── Title bar with stoplights ── */}
              <div className={`title-bar flex items-center space-x-2 h-8 px-3 border-b flex-shrink-0 cursor-move ${isDark ? "bg-[#363539] border-black" : "bg-[#e8e8ed] border-gray-300"}`}>
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); onCloseFolder(); }}
                  onClick={onCloseFolder}
                  className="w-5 h-5 rounded-full bg-[#FF5F57] flex-shrink-0"
                />
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); onMinimizeFolder(openFolder); }}
                  onClick={() => onMinimizeFolder(openFolder)}
                  className="w-5 h-5 rounded-full bg-[#FFBD2E] flex-shrink-0"
                />
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); onToggleFullscreen(); }}
                  onClick={onToggleFullscreen}
                  className="w-5 h-5 rounded-full bg-[#28C93F] flex-shrink-0"
                />
                <button
                  onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); goBack(); }}
                  onClick={(e) => { e.stopPropagation(); goBack(); }}
                  disabled={backStack.length === 0}
                  className="disabled:opacity-50 ml-2"
                >
                  <FaIcons.FaChevronLeft className={`${isDark ? "text-white" : "text-gray-800"} text-xs`} />
                </button>
                <button
                  onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); goForward(); }}
                  onClick={(e) => { e.stopPropagation(); goForward(); }}
                  disabled={forwardStack.length === 0}
                  className="disabled:opacity-50"
                >
                  <FaIcons.FaChevronRight className={`${isDark ? "text-white" : "text-gray-800"} text-xs`} />
                </button>
                <span className={`ml-2 font-medium text-sm truncate ${isDark ? "text-white" : "text-gray-800"}`}>
                  {finderViewFolder ? finderViewFolder.title : "Finder"}
                </span>
                {/* Sidebar toggle */}
                <button
                  onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); setMobileSidebarOpen((o) => !o); }}
                  onClick={() => setMobileSidebarOpen((o) => !o)}
                  className="ml-auto text-gray-400"
                >
                  <FaIcons.FaBars className="text-sm" />
                </button>
              </div>

              {/* ── Body: sidebar + main content ── */}
              <div className="flex flex-1 overflow-hidden relative">
                {/* Sidebar overlay */}
                {mobileSidebarOpen && (
                  <>
                    <div
                      className="absolute inset-0 bg-black/40 z-10"
                      onClick={() => setMobileSidebarOpen(false)}
                      onTouchEnd={(e) => { e.stopPropagation(); setMobileSidebarOpen(false); }}
                    />
                    <aside className={`absolute left-0 top-0 bottom-0 w-3/5 max-w-[220px] border-r overflow-y-auto z-20 mobile-sidebar-slide-in ${isDark ? "bg-[#201e25] border-black" : "bg-[#f2f2f7] border-gray-300"}`}>
                      <div className="px-3 py-1 text-[10px] font-semibold uppercase text-gray-500">
                        Finder
                      </div>
                      <div
                        onTouchEnd={(e) => {
                          e.stopPropagation(); e.preventDefault();
                          onOpenFolder(finderFolder);
                          setFinderViewFolder(null);
                          setSelectedFolderId(null);
                          setBackStack([]); setForwardStack([]);
                          setMobileSidebarOpen(false);
                        }}
                        onClick={() => {
                          onOpenFolder(finderFolder);
                          setFinderViewFolder(null);
                          setSelectedFolderId(null);
                          setBackStack([]); setForwardStack([]);
                          setMobileSidebarOpen(false);
                        }}
                        className={`flex items-center px-3 py-2.5 cursor-pointer ${
                          selectedFolderId === null
                            ? (isDark ? "bg-[#464746]" : "bg-gray-300")
                            : (isDark ? "active:bg-[#464746] bg-[#201e25]" : "active:bg-gray-200 bg-transparent")
                        }`}
                      >
                        {finderFolder && renderFolderIcon(finderFolder, "w-5 h-5 mr-2")}
                        <span className={`text-sm ${isDark ? "text-white" : "text-gray-800"}`}>Finder</span>
                      </div>
                      {finderCategories.map(({ name, folders, reactIcon, reactIconColor, icon }) => {
                        const CatIcon = (reactIcon && (FaIcons[reactIcon] || IoIcons[reactIcon] || GiIcons[reactIcon] || SiIcons[reactIcon])) || FaIcons.FaFolder;
                        const iconUrl = icon?.url;
                        return (
                          <div key={name} className="mb-2">
                            <div className="px-3 py-1 text-[10px] font-semibold uppercase text-gray-500 flex items-center gap-1">
                              {iconUrl
                                ? <img src={toUrl(iconUrl)} className="w-3 h-3 object-contain" />
                                : <CatIcon className="w-3 h-3" style={{ color: reactIconColor || "#7DD3FC" }} />}
                              {name}
                            </div>
                            {folders.map((f) => {
                              const isActive = f.documentId === selectedFolderId;
                              return (
                                <div
                                  key={f.documentId}
                                  onTouchEnd={(e) => {
                                    e.stopPropagation(); e.preventDefault();
                                    handleSidebarClick(f);
                                    setMobileSidebarOpen(false);
                                  }}
                                  onClick={() => {
                                    handleSidebarClick(f);
                                    setMobileSidebarOpen(false);
                                  }}
                                  className={`flex items-center px-3 py-2.5 cursor-pointer ${
                                    isActive
                                      ? (isDark ? "bg-[#464746]" : "bg-gray-300")
                                      : (isDark ? "active:bg-[#464746] bg-[#201e25]" : "active:bg-gray-200 bg-transparent")
                                  }`}
                                >
                                  {renderFolderIcon(f, "w-5 h-5 mr-2")}
                                  <span className={`text-sm truncate ${isDark ? "text-white" : "text-gray-800"}`}>{f.title}</span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </aside>
                  </>
                )}

                {/* Main content grid */}
                <main className="flex-1 p-3 overflow-y-auto">
                  <div className="grid grid-cols-3 gap-3">
                    {(finderViewFolder
                      ? finderViewFolder.items ?? finderViewFolder.subItem ?? []
                      : finderItems
                    ).map((item) => {
                      const title = item.title ?? item.text;
                      const thumbUrl = item.icon?.[0]?.url ?? item.image?.[0]?.url;

                      if (item.url) {
                        return (
                          <a
                            key={item.id || item.documentId}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex flex-col items-center p-2 rounded cursor-pointer ${isDark ? "active:bg-[#464746]" : "active:bg-gray-200"}`}
                          >
                            {thumbUrl ? (
                              <img src={toUrl(thumbUrl)} className="w-10 h-10 object-contain" />
                            ) : (
                              renderFolderIcon(item, "w-10 h-10")
                            )}
                            <span className={`mt-1 text-xs text-center leading-tight ${isDark ? "text-white" : "text-gray-800"}`}>{title}</span>
                          </a>
                        );
                      }

                      return (
                        <div
                          key={item.id || item.documentId}
                          className={`flex flex-col items-center p-2 rounded cursor-pointer ${isDark ? "active:bg-[#464746]" : "active:bg-gray-200"}`}
                          onTouchEnd={(e) => {
                            e.stopPropagation(); e.preventDefault();
                            handleGridItemClick(item, thumbUrl, title);
                          }}
                          onClick={() => handleGridItemClick(item, thumbUrl, title)}
                        >
                          {thumbUrl ? (
                            <img src={toUrl(thumbUrl)} className="w-10 h-10 object-contain" />
                          ) : (
                            renderFolderIcon(item, "w-10 h-10")
                          )}
                          <span className={`mt-1 text-xs text-center leading-tight ${isDark ? "text-white" : "text-gray-800"}`}>{title}</span>
                        </div>
                      );
                    })}
                  </div>
                </main>
              </div>
            </div>
            </Draggable>
          </div>
        ) : (
          /* ═══ DESKTOP FINDER ═══ */
          <div
            className="absolute inset-0 flex items-center justify-center z-30"
            onClick={onCloseFolder}
          >
            <Draggable handle=".title-bar" bounds="parent" nodeRef={modalRef} disabled={isFullscreen}>
              <div
                ref={modalRef}
                onClick={(e) => e.stopPropagation()}
                className={`border rounded-lg shadow-2xl ${
                  isFullscreen ? "w-full h-full" : "md:w-2/3 md:h-2/3"
                } flex flex-col overflow-hidden ${isDark ? "bg-[#201e25] border-gray-900" : "bg-white border-gray-300"}`}
              >
                {/* title bar */}
                <div className={`title-bar flex items-center space-x-2 h-8 px-3 border-b cursor-move ${isDark ? "bg-[#363539] border-black" : "bg-[#e8e8ed] border-gray-300"}`}>
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={onCloseFolder}
                    className="w-3 h-3 rounded-full bg-[#FF5F57] hover:opacity-80"
                  />
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => onMinimizeFolder(openFolder)}
                    className="w-3 h-3 rounded-full bg-[#FFBD2E] hover:opacity-80"
                  />
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={onToggleFullscreen}
                    className="w-3 h-3 rounded-full bg-[#28C93F] hover:opacity-80"
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); goBack(); }}
                    disabled={backStack.length === 0}
                    className="disabled:opacity-50 ml-3"
                  >
                    <FaIcons.FaChevronLeft className={isDark ? "text-white" : "text-gray-800"} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); goForward(); }}
                    disabled={forwardStack.length === 0}
                    className="disabled:opacity-50"
                  >
                    <FaIcons.FaChevronRight className={isDark ? "text-white" : "text-gray-800"} />
                  </button>

                  <span className={`ml-2 font-medium ${isDark ? "text-white" : "text-gray-800"}`}>
                    {finderViewFolder ? finderViewFolder.title : "Finder"}
                  </span>
                </div>

                <div className="flex flex-1">
                  {/* sidebar */}
                  <aside className={`w-1/4 border-r overflow-y-auto ${isDark ? "bg-[#201e25] border-black" : "bg-[#f2f2f7] border-gray-300"}`}>
                    <div className="px-4 py-1 text-xs font-semibold uppercase text-gray-500">
                      Finder
                    </div>
                    <div
                      onClick={() => {
                        onOpenFolder(finderFolder);
                        setFinderViewFolder(null);
                        setSelectedFolderId(null);
                        setBackStack([]);
                        setForwardStack([]);
                      }}
                      className={`flex items-center px-4 py-2 cursor-pointer ${
                        selectedFolderId === null
                          ? (isDark ? "bg-[#464746]" : "bg-gray-300")
                          : (isDark ? "hover:bg-[#464746] bg-[#201e25]" : "hover:bg-gray-200 bg-transparent")
                      }`}
                    >
                      {renderFolderIcon(finderFolder, "w-5 h-5 mr-2")}
                      <span className={isDark ? "text-white" : "text-gray-800"}>Finder</span>
                    </div>
                    {finderCategories.map(({ name, folders, reactIcon, reactIconColor, icon }) => {
                    const CatIcon = (reactIcon && (FaIcons[reactIcon] || IoIcons[reactIcon] || GiIcons[reactIcon] || SiIcons[reactIcon])) || FaIcons.FaFolder;
                    const iconUrl = icon?.url;
                    return (
                      <div key={name} className="mb-4">
                        <div className="px-4 py-1 text-xs font-semibold uppercase text-gray-500 flex items-center gap-1">
                          {iconUrl
                            ? <img src={toUrl(iconUrl)} className="w-3 h-3 object-contain" />
                            : <CatIcon className="w-3 h-3" style={{ color: reactIconColor || "#7DD3FC" }} />}
                          {name}
                        </div>
                        {folders.map((f) => {
                          const isActive = f.documentId === selectedFolderId;
                          return (
                            <div
                              key={f.documentId}
                              onClick={() => handleSidebarClick(f)}
                              className={`flex items-center px-4 py-2 cursor-pointer ${
                                isActive
                                  ? "bg-[#464746]"
                                  : "hover:bg-[#464746] bg-[#201e25]"
                              }`}
                            >
                              {renderFolderIcon(f, "w-5 h-5 mr-2")}
                              <span className="text-white">{f.title}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                  </aside>

                  <main className="flex-1 p-4 overflow-y-auto">
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                      {(finderViewFolder
                        ? finderViewFolder.items ?? finderViewFolder.subItem ?? []
                        : finderItems
                      ).map((item) => {
                        const title = item.title ?? item.text;
                        const thumbUrl = item.icon?.[0]?.url ?? item.image?.[0]?.url;

                        if (item.url) {
                          return (
                            <a
                              key={item.id || item.documentId}
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex flex-col items-center p-2 rounded cursor-pointer ${isDark ? "hover:bg-[#464746]" : "hover:bg-gray-200"}`}
                            >
                              {thumbUrl ? (
                                <img src={toUrl(thumbUrl)} className="w-12 h-12 object-contain" />
                              ) : (
                                renderFolderIcon(item, "w-12 h-12")
                              )}
                              <span className={`mt-2 text-sm text-center ${isDark ? "text-white" : "text-gray-800"}`}>{title}</span>
                            </a>
                          );
                        }

                        return (
                          <div
                            key={item.id || item.documentId}
                            className={`flex flex-col items-center p-2 rounded cursor-pointer ${isDark ? "hover:bg-[#464746]" : "hover:bg-gray-200"}`}
                            onClick={() => handleGridItemClick(item, thumbUrl, title)}
                          >
                            {thumbUrl ? (
                              <img src={toUrl(thumbUrl)} className="w-12 h-12 object-contain" />
                            ) : (
                              renderFolderIcon(item, "w-12 h-12")
                            )}
                            <span className={`mt-2 text-sm text-center ${isDark ? "text-white" : "text-gray-800"}`}>{title}</span>
                          </div>
                        );
                      })}
                    </div>
                  </main>
                </div>
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
                className="bg-[#201e25] border border-gray-900 rounded-lg p-6 text-white"
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
        <div
          className="fixed inset-0 flex items-center justify-center z-40"
          onClick={() => setOpenImageFolder(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#201e25] border border-gray-900 rounded-lg shadow-2xl w-full h-full md:w-2/3 md:h-2/3 flex flex-col overflow-hidden"
          >
            <div className="flex items-center space-x-2 h-8 px-3 bg-[#363539] border-b border-black">
              <button
                onClick={() => setOpenImageFolder(null)}
                className="w-3 h-3 rounded-full bg-[#FF5F57] hover:opacity-80"
              />
              <span className="ml-2 font-medium text-white">
                {openImageFolder.title}
              </span>
            </div>

            <main className="flex-1 p-4 overflow-y-auto">
              <div className="grid grid-cols-4 gap-4">
                {openImageFolder.subItem.map((sub) => {
                  const firstImg = sub.contentItems?.image?.[0]?.url;

                  return (
                    <div
                      key={sub.id}
                      onClick={() =>
                        firstImg &&
                        setOpenPicture({
                          url: toUrl(firstImg),
                          title: sub.text,
                        })
                      }
                      className="flex flex-col items-center p-2 hover:bg-[#464746] rounded cursor-pointer"
                    >
                      {firstImg ? (
                        <img
                          src={toUrl(firstImg)}
                          className="w-12 h-12 object-contain"
                        />
                      ) : (
                        <FaIcons.FaRegFile className="w-12 h-12" />
                      )}
                      <span className="mt-2 text-sm text-white text-center">
                        {sub.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </main>
          </div>
        </div>
      )}

      {/* ——— full‑screen picture viewer ——— */}
      {openPicture && (
        <div
          className="absolute left-0 right-0 top-1 bottom-22 max-w-screen bg-[#201e25] border border-gray-900 flex flex-col overflow-hidden z-50"
          onClick={() => setOpenPicture(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center space-x-2 h-8 px-3 bg-[#363539] border-b border-black"
          >
            <button
              onClick={() => setOpenPicture(null)}
              className="w-3 h-3 rounded-full bg-[#FF5F57] hover:opacity-80"
            />
            <span className="ml-2 font-medium text-white">
              {openPicture.title}
            </span>
          </div>

          <div
            onClick={(e) => e.stopPropagation()}
            className="flex-1 flex items-center justify-center overflow-auto"
          >
            <img
              src={openPicture.url}
              alt={openPicture.title}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* ——— text document modal ——— */}
      {openTextItem && (
        <TextModal
          item={openTextItem}
          onClose={() => setOpenTextItem(null)}
          onMinimizeFolder={() => setOpenTextItem(null)}
        />
      )}
    </div>
  );
}
