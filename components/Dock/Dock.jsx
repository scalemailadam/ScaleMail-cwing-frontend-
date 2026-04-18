"use client";
import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import * as FaIcons from "react-icons/fa";
import * as SiIcons from "react-icons/si";
import * as ImIcons from "react-icons/im";
import * as GiIcons from "react-icons/gi";
import * as IoIcons from "react-icons/io5";
import { GET_DOCK } from "@/graphql/queries";

const MW = {
  frame:     "#c8a030",
  frameDark: "#a07820",
  content:   "#060604",
  gold:      "#1e1808",
  goldDim:   "#0e0c04",
  cream:     "#d4c880",
  tan:       "#b8a868",
};
const stoneNoise = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.35' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.9'/%3E%3C%2Fsvg%3E")`;

export default function Dock({ activeFolder, minimizedFolders, onRestoreFolder }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const { data, loading, error } = useQuery(GET_DOCK);

  if (loading) return null;
  if (error) return <p>Error: {error.message}</p>;

  const canonicalSlug = (slug = "") => slug === "fileBrowser" ? "openFolder" : slug;

  const staticItems = data?.dock?.dockItem ?? [];
  const staticSlugs = new Set(staticItems.map((s) => canonicalSlug(s.modalSlug)).filter(Boolean));

  const windowItems = [
    ...(activeFolder ? [activeFolder] : []),
    ...minimizedFolders,
  ]
    .filter((f, i, arr) => arr.findIndex((x) => x.documentId === f.documentId) === i)
    .filter((f) => f && f.documentId && !staticSlugs.has(canonicalSlug(f.modalSlug)));

  const iconCls = (idx) => {
    let scale = "scale-100";
    if (hoveredIndex === idx) scale = "scale-[1.75]";
    else if (hoveredIndex !== null && Math.abs(hoveredIndex - idx) === 1) scale = "scale-[1.35]";
    return `transform ${scale} origin-bottom transition-transform duration-200 ease-out`;
  };

  const pickIcon = (name) =>
    FaIcons[name] || SiIcons[name] || ImIcons[name] || GiIcons[name] || IoIcons[name] || FaIcons.FaQuestion;

  const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL ?? "";
  const toImgUrl = (url = "") => (url.startsWith("http") ? url : `${STRAPI}${url}`);

  const renderStaticIcon = ({ title, icon, reactIcon, reactIconColor }) => {
    const imgUrl = icon?.[0]?.url;
    if (imgUrl) return <img src={toImgUrl(imgUrl)} alt={title} className="w-10 h-10 object-cover" />;
    const Icon = pickIcon(reactIcon);
    return <Icon className="w-10 h-10" style={{ color: reactIconColor ?? MW.frame }} />;
  };

  const renderFolderIcon = (folder) => {
    const imgUrl = folder.icon?.[0]?.url;
    if (imgUrl) return <img src={toImgUrl(imgUrl)} alt={folder.title} className="w-10 h-10 object-contain" />;
    const Icon = folder.reactIcon ? pickIcon(folder.reactIcon) : FaIcons.FaFolderOpen;
    return <Icon className="w-10 h-10" style={{ color: folder.reactIconColor ?? MW.frame }} />;
  };

  const Tooltip = ({ label }) => (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none">
      <div
        className="relative text-xs font-serif tracking-wide px-3 py-1 whitespace-nowrap shadow-lg"
        style={{
          backgroundColor: "#000000",
          border: `1px solid ${MW.cream}`,
          color: MW.cream,
        }}
      >
        {label}
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
          style={{
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: `5px solid ${MW.cream}`,
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="fixed bottom-5 inset-x-0 flex justify-center z-50">
      <div
        className="inline-flex relative px-6 py-3"
        style={{
          backgroundColor: MW.frameDark,
          backgroundImage: stoneNoise,
          border: `1px solid ${MW.gold}`,
          boxShadow: `0 0 0 1px ${MW.goldDim}, 0 8px 32px rgba(0,0,0,0.95)`,
        }}
      >
        <div
          className="relative flex items-end gap-10 z-10"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {staticItems.map((item, idx) => {
            const isActive = canonicalSlug(item.modalSlug) === canonicalSlug(activeFolder?.modalSlug);
            const isMinimized = minimizedFolders.some((m) => canonicalSlug(m.modalSlug) === canonicalSlug(item.modalSlug));
            const isInternal = item.modalSlug && !item.url;
            const Wrapper = isInternal ? "button" : "a";

            return (
              <Wrapper
                key={`static-${idx}`}
                {...(!isInternal && {
                  href: item.url ?? "#",
                  target: item.url ? "_blank" : undefined,
                  rel: item.url ? "noopener noreferrer" : undefined,
                })}
                onClick={() => isInternal && onRestoreFolder(item)}
                onMouseEnter={() => setHoveredIndex(idx)}
                className={iconCls(idx)}
              >
                <div className="relative">
                  {hoveredIndex === idx && <Tooltip label={item.title} />}
                  {renderStaticIcon(item)}
                  {(isActive || isMinimized) && (
                    <span
                      className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-1 rounded-full"
                      style={{ backgroundColor: MW.frame }}
                    />
                  )}
                </div>
              </Wrapper>
            );
          })}

          {windowItems.length > 0 && (
            <div className="h-8 w-px" style={{ backgroundColor: MW.gold }} />
          )}

          {windowItems.map((folder, i) => {
            const hoverIdx = staticItems.length + i;
            return (
              <button
                key={folder.documentId}
                onClick={() => onRestoreFolder(folder)}
                onMouseEnter={() => setHoveredIndex(hoverIdx)}
                className={iconCls(hoverIdx)}
              >
                <div className="relative">
                  {hoveredIndex === hoverIdx && <Tooltip label={folder.title} />}
                  {renderFolderIcon(folder)}
                  <span
                    className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-1 h-1 rounded-full"
                    style={{ backgroundColor: MW.frame }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
