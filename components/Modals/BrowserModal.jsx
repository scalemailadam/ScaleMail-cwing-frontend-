"use client";

import React, { useRef, useState } from "react";
import Draggable from "react-draggable";
import { Resizable } from "re-resizable";
import Image from "next/image";
import { useQuery, gql } from "@apollo/client";
import { GET_HEADER } from "@/graphql/queries";
import { useTheme } from "@/context/ThemeContext";
import { FaTimes, FaMinus, FaExpand, FaCompress } from "react-icons/fa";

const MW = {
  frame:     "#c8a030",
  frameDark: "#a07820",
  content:   "#060604",
  gold:      "#1e1808",
  goldDim:   "#0e0c04",
  cream:     "#d4c880",
  tan:       "#b8a868",
  tanDim:    "#8a7848",
  goldText:  "#c8be78",
  blue:      "#5ab4ff",
  muted:     "#504828",
};
const stoneNoise = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.35' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.9'/%3E%3C%2Fsvg%3E")`;
const CORNERS_ONLY = { top: false, right: false, bottom: false, left: false, topRight: true, bottomRight: true, bottomLeft: true, topLeft: true };
const iconStyle = { display: "block", width: "55%", height: "55%" };

const GET_BROWSER_MODAL = gql`
  query GetBrowserModal {
    browserModal {
      title backgroundColor textColor
      content {
        __typename
        ... on ComponentSectionsSectionGroup { id backgroundColor }
        ... on ComponentSectionsRichTextSection { id paragraphText backgroundColor placementRich: placement }
        ... on ComponentSectionsHeadingSection { id heading textSize color backgroundColor placementHeading: placement }
        ... on ComponentSectionsImageSection { id image { url } width height backgroundColor placementImage: placement }
        ... on ComponentSectionsGallerySection { id images { url } columns rows gap backgroundColor placementGallery: placement }
      }
    }
  }
`;

export default function BrowserModal({ folder, onClose, onMinimizeFolder }) {
  const [isFS, setFS] = useState(false);
  const [size, setSize] = useState(() => ({
    width:  typeof window !== "undefined" ? Math.min(900, window.innerWidth - 32) : 900,
    height: typeof window !== "undefined" ? Math.min(600, window.innerHeight - 100) : 600,
  }));
  const dragRef = useRef(null);
  const isResizingRef = useRef(false);

  const { data: headerData } = useQuery(GET_HEADER);
  const { data: pageData, loading, error } = useQuery(GET_BROWSER_MODAL);
  const { isDark } = useTheme();

  if (loading) return null;
  if (error) return <div className="p-4" style={{ color: MW.cream }}>Error loading page: {error.message}</div>;
  if (!pageData?.browserModal) return <div className="p-4" style={{ color: MW.cream }}>No browser modal data.</div>;

  const { title, backgroundColor: defaultBg, textColor, content } = pageData.browserModal;
  const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "";
  const toUrl = (u = "") => (u.startsWith("http") ? u : STRAPI_URL + u);

  const logoUrl = (() => {
    const lightUrl = headerData?.header?.logo?.[0]?.url ? toUrl(headerData.header.logo[0].url) : null;
    const darkUrl  = headerData?.header?.darkLogo?.url  ? toUrl(headerData.header.darkLogo.url)  : null;
    return isDark ? (darkUrl || lightUrl) : lightUrl;
  })();

  const groupSections = () => {
    const groups = [];
    let currentBg = defaultBg;
    let currentItems = [];
    content.forEach((sec) => {
      if (sec.__typename === "ComponentSectionsSectionGroup") {
        if (currentItems.length) groups.push({ background: currentBg, items: currentItems });
        currentBg = sec.backgroundColor;
        currentItems = [];
      } else {
        currentItems.push(sec);
      }
    });
    if (currentItems.length) groups.push({ background: currentBg, items: currentItems });
    return groups;
  };

  const renderRichTextNode = (node, i) => {
    if (node.type === "text" || !node.type) {
      let el = node.text ?? "";
      if (!el) return null;
      if (node.bold)          el = <strong key={i} style={{ color: MW.cream }}>{el}</strong>;
      if (node.italic)        el = <em key={i} style={{ color: MW.goldText }}>{el}</em>;
      if (node.underline)     el = <u key={i}>{el}</u>;
      if (node.strikethrough) el = <s key={i}>{el}</s>;
      if (node.code)          el = <code key={i} className="px-1 text-xs font-mono" style={{ backgroundColor: MW.goldDim, color: MW.goldText }}>{el}</code>;
      return <span key={i} style={{ color: MW.tan }}>{el}</span>;
    }
    const children = node.children?.map(renderRichTextNode);
    switch (node.type) {
      case "paragraph": return <p key={i} className="mb-3 leading-relaxed" style={{ color: MW.tan }}>{children}</p>;
      case "heading": {
        const Tag = `h${node.level ?? 2}`;
        const sizes = { 1:"text-2xl", 2:"text-xl", 3:"text-lg", 4:"text-base", 5:"text-sm", 6:"text-xs" };
        return <Tag key={i} className={`${sizes[node.level ?? 2]} font-bold font-serif mb-2`} style={{ color: MW.cream }}>{children}</Tag>;
      }
      case "list": return node.format === "ordered"
        ? <ol key={i} className="list-decimal pl-5 mb-3 space-y-1" style={{ color: MW.tan }}>{children}</ol>
        : <ul key={i} className="list-disc pl-5 mb-3 space-y-1" style={{ color: MW.tan }}>{children}</ul>;
      case "list-item": return <li key={i}>{children}</li>;
      case "quote": return <blockquote key={i} className="pl-3 italic mb-3" style={{ borderLeft: `4px solid ${MW.gold}`, color: MW.tanDim }}>{children}</blockquote>;
      case "code": return <pre key={i} className="p-3 text-xs font-mono overflow-x-auto mb-3" style={{ backgroundColor: MW.goldDim, border: `1px solid rgba(200,160,48,0.3)`, color: MW.goldText }}>{children}</pre>;
      case "link": return <a key={i} href={node.url} target="_blank" rel="noreferrer" className="underline transition-instant" style={{ color: MW.blue }}>{children}</a>;
      default: return <span key={i}>{children}</span>;
    }
  };

  const renderSection = (sec) => {
    switch (sec.__typename) {
      case "ComponentSectionsRichTextSection":
        return (
          <div key={sec.id} className={`mb-4 flex justify-${sec.placementRich}`}>
            <div className="max-w-none w-full" style={{ backgroundColor: sec.backgroundColor }}>
              {Array.isArray(sec.paragraphText) ? sec.paragraphText.map(renderRichTextNode) : <p style={{ color: MW.tan }}>{String(sec.paragraphText ?? "")}</p>}
            </div>
          </div>
        );
      case "ComponentSectionsHeadingSection": {
        const Tag = sec.textSize || "h2";
        return <div key={sec.id} className={`mb-2 flex justify-${sec.placementHeading}`}><Tag style={{ color: sec.color || MW.cream }}>{sec.heading}</Tag></div>;
      }
      case "ComponentSectionsImageSection":
        return <div key={sec.id} className={`mb-4 flex justify-${sec.placementImage}`}><Image src={toUrl(sec.image.url)} width={sec.width} height={sec.height} alt="" unoptimized className="object-cover" /></div>;
      case "ComponentSectionsGallerySection":
        return (
          <div key={sec.id} className={`mb-4 flex justify-${sec.placementGallery}`}>
            <div className={`grid grid-cols-${sec.columns || 3} ${sec.rows ? `grid-rows-${sec.rows}` : ""} gap-${sec.gap}`} style={{ backgroundColor: sec.backgroundColor }}>
              {sec.images.map((img, i) => <Image key={i} src={toUrl(img.url)} width={300} height={200} alt="" unoptimized className="object-cover" />)}
            </div>
          </div>
        );
      default: return null;
    }
  };

  const WindowBody = ({ full }) => (
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-full h-full flex flex-col"
      style={{
        padding: full ? 0 : "5px",
        backgroundColor: MW.frame,
        backgroundImage: stoneNoise,
        border: full ? "none" : `1px solid ${MW.gold}`,
        boxShadow: full ? "none" : `0 0 0 1px ${MW.goldDim}, 0 24px 72px rgba(0,0,0,0.95)`,
      }}
    >
      <div className="flex flex-col overflow-hidden" style={{ flex: 1, minHeight: 0, backgroundColor: MW.content, border: full ? "none" : `1px solid ${MW.gold}` }}>
        {/* title bar */}
        <div
          className={"title-bar relative flex items-center justify-center flex-shrink-0 h-8 px-3" + (full ? "" : " cursor-move")}
          style={{ backgroundColor: MW.frameDark, backgroundImage: stoneNoise, borderBottom: `1px solid ${MW.gold}` }}
        >
          <div className="absolute left-3 flex items-center space-x-1.5">
            <button onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()} onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); onClose(); }} onClick={onClose} className="w-5 h-5 md:w-3 md:h-3 rounded-full flex-shrink-0 transition-instant flex items-center justify-center" style={{ backgroundColor: MW.frame, border: `1px solid ${MW.gold}` }}>
              <FaTimes style={{ ...iconStyle, color: MW.content }} />
            </button>
            <button onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()} onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); onMinimizeFolder(folder); }} onClick={() => onMinimizeFolder(folder)} className="w-5 h-5 md:w-3 md:h-3 rounded-full flex-shrink-0 transition-instant flex items-center justify-center" style={{ backgroundColor: MW.frame, border: `1px solid ${MW.gold}` }}>
              <FaMinus style={{ ...iconStyle, color: MW.content }} />
            </button>
            <button onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()} onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); setFS(!isFS); }} onClick={(e) => { e.stopPropagation(); setFS(!isFS); }} className="w-5 h-5 md:w-3 md:h-3 rounded-full flex-shrink-0 transition-instant flex items-center justify-center" style={{ backgroundColor: MW.frame, border: `1px solid ${MW.gold}` }}>
              {isFS ? <FaCompress style={{ ...iconStyle, color: MW.content }} /> : <FaExpand style={{ ...iconStyle, color: MW.content }} />}
            </button>
          </div>
          <span className="text-xs font-serif tracking-widest uppercase select-none truncate px-20" style={{ color: MW.cream, backgroundColor: MW.content, padding: "1px 8px" }}>{title}</span>
          {logoUrl && <img src={logoUrl} alt="logo" className="absolute right-3 object-contain h-5 flex-shrink-0" />}
        </div>

        {/* URL bar */}
        <div className="flex items-center px-3 py-1.5 border-b gap-2" style={{ backgroundColor: MW.goldDim, borderColor: MW.gold }}>
          <button className="px-1 transition-instant" style={{ color: MW.tan }}>&#8592;</button>
          <button className="px-1 transition-instant" style={{ color: MW.tan }}>&#8594;</button>
          <div className="flex-1 mx-2 px-2 py-0.5 text-xs font-mono" style={{ backgroundColor: MW.content, border: `1px solid ${MW.gold}`, color: MW.goldText }}>
            www.scalemail.com
          </div>
        </div>

        {/* content */}
        <div className="flex-1 overflow-auto text-sm" style={{ backgroundColor: defaultBg || MW.content, color: textColor || MW.tan }}>
          {groupSections().map((group, idx) => (
            <div key={idx} style={{ backgroundColor: group.background }} className="p-4">
              {group.items.map((sec) => renderSection(sec))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div
      onClick={() => { if (!isResizingRef.current) onMinimizeFolder(folder); }}
      className="absolute inset-0 flex items-center justify-center z-30"
    >
      {isFS ? (
        <div className="absolute inset-0" onClick={(e) => e.stopPropagation()}>
          <WindowBody full />
        </div>
      ) : (
        <Draggable handle=".title-bar" bounds="parent" nodeRef={dragRef}>
          <div ref={dragRef} style={{ display: "inline-block" }} onClick={(e) => e.stopPropagation()}>
            <Resizable size={size} onResizeStart={() => { isResizingRef.current = true; }} onResizeStop={(e, dir, ref) => { setSize({ width: ref.offsetWidth, height: ref.offsetHeight }); setTimeout(() => { isResizingRef.current = false; }, 100); }} minWidth={400} minHeight={300} maxWidth="calc(100vw - 2rem)" maxHeight="90vh" enable={CORNERS_ONLY}>
              <WindowBody full={false} />
            </Resizable>
          </div>
        </Draggable>
      )}
    </div>
  );
}
