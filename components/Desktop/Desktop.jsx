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

const ArmorBackground = dynamic(() => import("@/components/ArmorBackground"), {
  ssr: false,
});

import GarmentDesignModal from "../Modals/GarmentDesignModal";
import ResumeModal from "../Modals/ResumeModal";

import BrowserModal from "../Modals/BrowserModal";
import TextModal from "../Modals/TextModal";

const MODAL_COMPONENTS = {
  garmentDesignModal: GarmentDesignModal,
  resumeModal: ResumeModal,
  browserModal: BrowserModal,
  textModal: TextModal,
};

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
  const iconRefs = useRef([]);
  const modalRef = useRef(null);
  const desktopRef = useRef(null);
  const [finderViewFolder, setFinderViewFolder] = useState(null);

  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [customModal, setCustomModal] = useState(null);
  const [openImageFolder, setOpenImageFolder] = useState(null);
  const [openPicture, setOpenPicture] = useState(null);
  const [openTextItem, setOpenTextItem] = useState(null);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [backStack, setBackStack] = useState([]);
  const [forwardStack, setForwardStack] = useState([]);

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
    if (openFolder?.modalSlug === "openFolder") {
      setFinderViewFolder(null);
      setSelectedFolderId(null);
      setBackStack([]);
      setForwardStack([]);
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
  const finderFolder = desktopFolders.find((f) => f.modalSlug === "openFolder");
  iconRefs.current = desktopFolders.map(
    (_, i) => iconRefs.current[i] ?? React.createRef()
  );
  const finderItems = desktopFolders.flatMap((folder) => folder.items);
  const finderCategories = categories
    .filter((c) => c.name !== "Desktop")
    .map((c) => ({ name: c.name, folders: c.desktop_folders }));

  const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? "";
  const toUrl = (u = "") => (u.startsWith("http") ? u : `${STRAPI_URL}${u}`);

  const openFolderOrModal = (folder) => {
    if (folder.url) {
      window.open(folder.url, "_blank", "noopener,noreferrer");
      return;
    }
    onOpenFolder(folder);
    if (folder.modalSlug === "openFolder") {
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
    const finder = desktopFolders.find((f) => f.modalSlug === "openFolder");
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
      {openFolder?.modalSlug === "openFolder" && (
        <div
          className="absolute inset-0 bg-black/50 flex items-center justify-center z-30"
          onClick={onCloseFolder}
        >
          <Draggable bounds="parent" nodeRef={modalRef} disabled={isFullscreen}>
            <div
              ref={modalRef}
              onClick={(e) => e.stopPropagation()}
              className={`bg-[#201e25] border border-gray-900 rounded-lg shadow-2xl ${
                isFullscreen ? "w-full h-full" : "w-2/3 h-2/3"
              } flex flex-col overflow-hidden`}
            >
              {/* title bar */}
              <div className="flex items-center space-x-2 h-8 px-3 bg-[#363539] border-b border-black">
                <button
                  onClick={onCloseFolder}
                  className="w-3 h-3 rounded-full bg-[#FF5F57] hover:opacity-80"
                />
                <button
                  onClick={() => onMinimizeFolder(openFolder)}
                  className="w-3 h-3 rounded-full bg-[#FFBD2E] hover:opacity-80"
                />
                <button
                  onClick={onToggleFullscreen}
                  className="w-3 h-3 rounded-full bg-[#28C93F] hover:opacity-80"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goBack();
                  }}
                  disabled={backStack.length === 0}
                  className="disabled:opacity-50 ml-3"
                >
                  <FaIcons.FaChevronLeft className="text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goForward();
                  }}
                  disabled={forwardStack.length === 0}
                  className="disabled:opacity-50"
                >
                  <FaIcons.FaChevronRight className="text-white" />
                </button>

                <span className="ml-2 font-medium text-white">
                  {openFolder?.modalSlug === "openFolder"
                    ? finderViewFolder
                      ? finderViewFolder.title
                      : "Finder"
                    : openFolder.title}
                </span>
              </div>

              <div className="flex flex-1">
                {/* sidebar */}
                <aside className="w-1/4 bg-[#201e25] border-r border-black overflow-y-auto">
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
                        ? "bg-[#464746]"
                        : "hover:bg-[#464746] bg-[#201e25]"
                    }`}
                  >
                    {renderFolderIcon(finderFolder, "w-5 h-5 mr-2")}
                    <span className="text-white">Finder</span>
                  </div>
                  {finderCategories.map(({ name, folders }) => (
                    <div key={name} className="mb-4">
                      <div className="px-4 py-1 text-xs font-semibold uppercase text-gray-500">
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
                  ))}
                </aside>

                <main className="flex-1 p-4 overflow-y-auto">
                  <div className="grid grid-cols-4 gap-4">
                    {(openFolder?.modalSlug === "openFolder"
                      ? finderViewFolder
                        ? finderViewFolder.items ??
                          finderViewFolder.subItem ??
                          []
                        : finderItems
                      : openFolder.items || []
                    ).map((item) => {
                      const title = item.title ?? item.text;
                      const thumbUrl =
                        item.icon?.[0]?.url ?? item.image?.[0]?.url;

                      if (item.url) {
                        return (
                          <a
                            key={item.id || item.documentId}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center p-2 hover:bg-[#464746] rounded cursor-pointer"
                          >
                            {thumbUrl ? (
                              <img
                                src={toUrl(thumbUrl)}
                                className="w-12 h-12 object-contain"
                              />
                            ) : (
                              renderFolderIcon(item, "w-12 h-12")
                            )}
                            <span className="mt-2 text-sm text-white text-center">
                              {title}
                            </span>
                          </a>
                        );
                      }

                      return (
                        <div
                          key={item.id || item.documentId}
                          className="flex flex-col items-center p-2 hover:bg-[#464746] rounded cursor-pointer"
                          onClick={() => {
                            // Handle modal slugs first, regardless of Finder context
                            if (item.modalSlug === "textModal") {
                              setOpenTextItem(item);
                              return;
                            }
                            if (item.modalSlug === "imageFolderModal") {
                              setOpenImageFolder(item);
                              return;
                            }
                            if (item.modalSlug === "pictureModal") {
                              if (thumbUrl) setOpenPicture({ url: toUrl(thumbUrl), title });
                              return;
                            }

                            if (openFolder?.modalSlug === "openFolder") {
                              if (!finderViewFolder) {
                                // Navigate into sub-folder
                                setBackStack([...backStack, finderViewFolder]);
                                setFinderViewFolder(item);
                                setForwardStack([]);
                                return;
                              }
                              const fullUrl = item.contentItems?.image?.[0]?.url;
                              if (fullUrl) {
                                setOpenPicture({ url: toUrl(fullUrl), title });
                              }
                            } else {
                              if (item.url) {
                                window.open(item.url, "_blank");
                              }
                            }
                          }}
                        >
                          {thumbUrl ? (
                            <img
                              src={toUrl(thumbUrl)}
                              className="w-12 h-12 object-contain"
                            />
                          ) : (
                            renderFolderIcon(item, "w-12 h-12")
                          )}
                          <span className="mt-2 text-sm text-white text-center">
                            {title}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </main>
              </div>
            </div>
          </Draggable>
        </div>
      )}

      {customModal &&
        (() => {
          const Modal = MODAL_COMPONENTS[customModal.modalSlug];
          return Modal ? (
            <Modal
              folder={customModal}
              onClose={() => {
                setCustomModal(null);
                onCloseFolder();
              }}
              onMinimizeFolder={() => minimizeCustomModal(customModal)}
            />
          ) : (
            <div
              className="fixed inset-0 bg-black/60 flex items-center justify-center"
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
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-40"
          onClick={() => setOpenImageFolder(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#201e25] border border-gray-900 rounded-lg shadow-2xl w-2/3 h-2/3 flex flex-col overflow-hidden"
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
