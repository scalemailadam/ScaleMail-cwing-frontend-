"use client";
import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import * as FaIcons from "react-icons/fa";
import * as SiIcons from "react-icons/si";
import * as ImIcons from "react-icons/im";
import * as GiIcons from "react-icons/gi";
import * as IoIcons from "react-icons/io5";
import { GET_DOCK } from "@/graphql/queries";

export default function Dock({
  activeFolder,
  minimizedFolders,
  onRestoreFolder,
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const { data, loading, error } = useQuery(GET_DOCK);

  if (loading) return null;
  if (error) return <p>Error: {error.message}</p>;
  const canonicalSlug = (slug = "") =>
    slug === "fileBrowser" ? "openFolder" : slug;
  /* ─────────── 1. data sets ─────────── */
  const staticItems = data?.dock?.dockItem ?? [];

  const staticSlugs = new Set( // ★ NEW
    staticItems.map((s) => canonicalSlug(s.modalSlug)).filter(Boolean)
  );

  const windowItems = [
    ...(activeFolder ? [activeFolder] : []),
    ...minimizedFolders,
  ]
    .filter(
      (f, i, arr) => arr.findIndex((x) => x.documentId === f.documentId) === i
    ) // dedupe
    .filter(
      (f) =>
        f && // ← guard against undefined
        f.documentId && // ← guard against nulls
        !staticSlugs.has(canonicalSlug(f.modalSlug))
    );

  /* ─────────── 2. helpers ─────────── */
  const iconCls = (idx, base = "text-4xl") => {
    let scale = "scale-100";
    if (hoveredIndex === idx) scale = "scale-[1.75]";
    else if (hoveredIndex !== null && Math.abs(hoveredIndex - idx) === 1)
      scale = "scale-[1.35]";
    return `transform ${scale} origin-bottom transition-transform duration-200 ease-out ${base}`;
  };

  const pickIcon = (name) =>
    FaIcons[name] ||
    SiIcons[name] ||
    ImIcons[name] ||
    GiIcons[name] ||
    IoIcons[name] ||
    FaIcons.FaQuestion;

  const renderStaticIcon = ({ title, icon, reactIconName, reactIconColor }) => {
    const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL ?? "";
    const imgUrl = icon?.[0]?.url;
    if (imgUrl) {
      return (
        <img
          src={imgUrl.startsWith("http") ? imgUrl : `${STRAPI}${imgUrl}`}
          alt={title}
          className="w-10 h-10 object-cover"
        />
      );
    }
    const Icon = pickIcon(reactIconName);
    return (
      <Icon
        className="w-10 h-10"
        style={{ color: reactIconColor ?? "#7DD3FC" }}
      />
    );
  };

  const renderFolderIcon = (folder) => {
    const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL ?? "";
    const imgUrl = folder.icon?.[0]?.url;
    if (imgUrl) {
      return (
        <img
          src={imgUrl.startsWith("http") ? imgUrl : `${STRAPI}${imgUrl}`}
          alt={folder.title}
          className="w-10 h-10 object-contain"
        />
      );
    }
    const Icon = folder.reactIcon
      ? pickIcon(folder.reactIcon)
      : FaIcons.FaFolderOpen;
    return (
      <Icon
        className="w-10 h-10"
        style={{ color: folder.reactIconColor ?? "#7DD3FC" }}
      />
    );
  };

  /* ─────────── 3. JSX ─────────── */
  return (
    <div className="fixed bottom-5 inset-x-0 flex justify-center z-50">
      <div className="inline-flex relative px-6 py-3 rounded-t-xl shadow-2xl">
        <div className="absolute inset-0 rounded-xl bg-gray-400/10 border border-gray-200/30 backdrop-blur-md z-0" />

        <div
          className="relative flex items-end gap-10 z-10"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* pinned icons */}
          {staticItems.map((item, idx) => {
            const isActive =
              canonicalSlug(item.modalSlug) ===
              canonicalSlug(activeFolder?.modalSlug);
            const isMinimized = minimizedFolders.some(
              (m) =>
                canonicalSlug(m.modalSlug) === canonicalSlug(item.modalSlug)
            );

            const isInternal = item.modalSlug && !item.url; // ★ NEW
            const Wrapper = isInternal ? "button" : "a"; // ★ NEW

            return (
              <Wrapper // ★ NEW
                key={`static-${idx}`}
                {...(!isInternal && {
                  href: item.url ?? "#",
                  target: item.url ? "_blank" : undefined,
                  rel: item.url ? "noopener noreferrer" : undefined,
                })}
                onClick={() => isInternal && onRestoreFolder(item)} // ★ NEW
                onMouseEnter={() => setHoveredIndex(idx)}
                className={iconCls(idx)}
              >
                <div className="relative">
                  {hoveredIndex === idx && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none">
                      <div className="relative bg-gray-800/90 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-md whitespace-nowrap shadow-lg">
                        {item.title}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-gray-800/90" />
                      </div>
                    </div>
                  )}
                  {renderStaticIcon(item)}
                  {(isActive || isMinimized) && ( // ★ NEW
                    <span className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-1 rounded-full bg-white" />
                  )}
                </div>
              </Wrapper>
            );
          })}

          {/* separator */}
          {windowItems.length > 0 && (
            <div className="h-8 w-px bg-gray-500/40 rounded-sm" />
          )}

          {/* windows that aren’t already pinned */}
          {windowItems.map((folder, i) => {
            const hoverIdx = staticItems.length + i;
            const isActive =
              activeFolder && folder.documentId === activeFolder.documentId;

            return (
              <button
                key={folder.documentId}
                onClick={() => onRestoreFolder(folder)}
                onMouseEnter={() => setHoveredIndex(hoverIdx)}
                className={iconCls(hoverIdx)}
              >
                <div className="relative">
                  {hoveredIndex === hoverIdx && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none">
                      <div className="relative bg-gray-800/90 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-md whitespace-nowrap shadow-lg">
                        {folder.title}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-gray-800/90" />
                      </div>
                    </div>
                  )}
                  {renderFolderIcon(folder)}
                  <span className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-1 h-1 rounded-full bg-white" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
