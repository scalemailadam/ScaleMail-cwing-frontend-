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

const MODAL_COMPONENTS = {
  garmentDesignModal: GarmentDesignModal,
  resumeModal: ResumeModal,

  browserModal: BrowserModal,
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
  const [finderViewFolder, setFinderViewFolder] = useState(null);

  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [customModal, setCustomModal] = useState(null);
  const [openImageFolder, setOpenImageFolder] = useState(null);
  const [openPicture, setOpenPicture] = useState(null);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [backStack, setBackStack] = useState([]); // previous views
  const [forwardStack, setForwardStack] = useState([]);

  useEffect(() => {
    setIsTouchDevice(
      typeof window !== "undefined" &&
        ("ontouchstart" in window || navigator.maxTouchPoints > 0)
    );
  }, []);

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
      // 1) go back to top-level Finder
      setFinderViewFolder(null);
      // 2) clear any highlighted category
      setSelectedFolderId(null);
      // 3) clear history
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
  const finderFolder = desktopFolders.find((f) => f.modalSlug === "openFolder");
  // generate refs for each desktop icon
  iconRefs.current = desktopFolders.map(
    (_, i) => iconRefs.current[i] ?? React.createRef()
  );
  const finderItems = desktopFolders.flatMap((folder) => folder.items);
  // categories for the Finder sidebar (exclude Desktop)
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
      // • you’ve clicked the Finder icon → show root
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
    // 1) make sure Finder is open
    const finder = desktopFolders.find((f) => f.modalSlug === "openFolder");
    if (finder && openFolder?.modalSlug !== "openFolder") {
      onOpenFolder(finder);
    }
    // 2) highlight this category
    setSelectedFolderId(folder.documentId);
    // 3) set the Finder view to this folder’s own items
    setFinderViewFolder(folder);
    // clear any back/forward stacks
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
      className="
    relative
    flex-1
  "
    >
      {/* Desktop icons */}
      {desktopFolders.map((folder, i) => {
        const ref = iconRefs.current[i];
        return (
          <Draggable
            key={folder.documentId}
            bounds="parent"
            nodeRef={ref}
            onStop={(e, d) => {
              if (
                isTouchDevice &&
                Math.abs(d.deltaX) < 5 &&
                Math.abs(d.deltaY) < 5
              ) {
                openFolderOrModal(folder);
              }
            }}
          >
            <div
              ref={ref}
              className="absolute cursor-pointer select-none"
              style={{ left: 40, top: 20 + i * 100 }}
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

      {/* ——— Finder (first‑level modal) ——— */}
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
                    ? // We’re in Finder:
                      finderViewFolder
                      ? // 1) Drilled-in view → show that folder’s title
                        finderViewFolder.title
                      : // 2) Root Finder → always show “Finder” literally
                        "Finder"
                    : // Not in Finder mode at all → show whatever modal you opened (Resume, Browser…)
                      openFolder.title}
                </span>
              </div>

              <div className="flex flex-1">
                {/* sidebar */}
                <aside className="w-1/4 bg-[#201e25] border-r border-black overflow-y-auto">
                  {/* ← new “All” entry */}
                  <div className="px-4 py-1 text-xs font-semibold uppercase text-gray-500">
                    Finder
                  </div>
                  <div
                    onClick={() => {
                      onOpenFolder(finderFolder);
                      // reset to root Finder view
                      setFinderViewFolder(null);
                      setSelectedFolderId(null);
                      setBackStack([]);
                      setForwardStack([]);
                    }}
                    className={`flex items-center px-4 py-2 cursor-pointer ${
                      // “active” when no sub-folder is selected
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
                        ? // if this is a desktop-folder, show its .items, else (true leaf) show its .subItem
                          finderViewFolder.items ??
                          finderViewFolder.subItem ??
                          []
                        : finderItems
                      : openFolder.items || []
                    ).map((item) => {
                      // determine title & thumbnail
                      const title = item.title ?? item.text;
                      const thumbUrl =
                        item.icon?.[0]?.url ?? item.image?.[0]?.url;

                      if (item.url) {
                        // External link: wrap in <a>
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

                      // All other items: your existing onClick logic
                      return (
                        <div
                          key={item.id || item.documentId}
                          className="flex flex-col items-center p-2 hover:bg-[#464746] rounded cursor-pointer"
                          onClick={() => {
                            if (openFolder?.modalSlug === "openFolder") {
                              // 1) first click → drill into that folder.item
                              if (!finderViewFolder) {
                                setBackStack([...backStack, finderViewFolder]);
                                setFinderViewFolder(item);
                                setForwardStack([]);
                                return;
                              }
                              // 2) second click on a subItem → open its image
                              const fullUrl =
                                item.contentItems?.image?.[0]?.url;
                              if (fullUrl) {
                                setOpenPicture({ url: toUrl(fullUrl), title });
                              }
                            } else {
                              // non-Finder modal (Applications, Resume, etc.)
                              if (item.modalSlug === "imageFolderModal") {
                                setOpenImageFolder(item);
                              } else if (item.modalSlug === "pictureModal") {
                                if (thumbUrl)
                                  setOpenPicture({
                                    url: toUrl(thumbUrl),
                                    title,
                                  });
                              } else if (item.url) {
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
                onCloseFolder(); /* remove white dot on close */
              }}
              onMinimizeFolder={() => minimizeCustomModal(customModal)}
            />
          ) : (
            /* fallback */
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

      {/* ——— Image‑folder (second‑level Finder) ——— */}
      {openImageFolder && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-40"
          onClick={() => setOpenImageFolder(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#201e25] border border-gray-900 rounded-lg shadow-2xl w-2/3 h-2/3 flex flex-col overflow-hidden"
          >
            {/* title bar */}
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

      {/* ——— full‑screen picture viewer ——— */}
      {openPicture && (
        <div
          className="absolute left-0 right-0 top-1 bottom-22 max-w-screen bg-[#201e25] border border-gray-900 flex flex-col overflow-hidden z-50"
          onClick={() => setOpenPicture(null)}
        >
          {/* title bar */}
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

          {/* image */}
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
    </div>
  );
}
