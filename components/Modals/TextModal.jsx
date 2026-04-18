"use client";

import React, { useState, useRef } from "react";
import Draggable from "react-draggable";
import { Resizable } from "re-resizable";
import { useQuery } from "@apollo/client";
import { GET_HEADER } from "@/graphql/queries";
import { useTheme } from "@/context/ThemeContext";
import ReactMarkdown from "react-markdown";
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

const CORNERS_ONLY = {
  top: false, right: false, bottom: false, left: false,
  topRight: true, bottomRight: true, bottomLeft: true, topLeft: true,
};

const iconStyle = { display: "block", width: "55%", height: "55%" };

export default function TextModal({ item, folder, onClose, onMinimizeFolder }) {
  const [isFS, setFS] = useState(false);
  const [size, setSize] = useState(() => ({
    width: typeof window !== "undefined" ? Math.min(700, window.innerWidth - 32) : 700,
    height: 500,
  }));
  const dragRef = useRef(null);
  const isResizingRef = useRef(false);

  const { data: headerData } = useQuery(GET_HEADER);
  const { isDark } = useTheme();
  const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "";
  const toUrl = (u = "") => (u.startsWith("http") ? u : STRAPI_URL + u);
  const lightLogoUrl = headerData?.header?.logo?.[0]?.url ? toUrl(headerData.header.logo[0].url) : null;
  const darkLogoUrl  = headerData?.header?.darkLogo?.url  ? toUrl(headerData.header.darkLogo.url)  : null;
  const logoUrl = isDark ? (darkLogoUrl || lightLogoUrl) : lightLogoUrl;

  const data    = item ?? folder;
  const title   = data?.title ?? data?.Title ?? "Document";
  const content = data?.richContent ?? "";

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
      <div
        className="flex flex-col overflow-hidden"
        style={{ flex: 1, minHeight: 0, backgroundColor: MW.content, border: full ? "none" : `1px solid ${MW.gold}` }}
      >
        {/* Title Bar */}
        <div
          className={"title-bar relative flex items-center justify-center flex-shrink-0 h-8 px-3" + (full ? "" : " cursor-move")}
          style={{ backgroundColor: MW.frameDark, backgroundImage: stoneNoise, borderBottom: `1px solid ${MW.gold}` }}
        >
          <div className="absolute left-3 flex items-center space-x-1.5">
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); onClose(); }}
              onClick={onClose}
              className="w-5 h-5 md:w-3 md:h-3 rounded-full flex-shrink-0 transition-instant flex items-center justify-center"
              style={{ backgroundColor: MW.frame, border: `1px solid ${MW.gold}` }}
            >
              <FaTimes style={{ ...iconStyle, color: MW.content }} />
            </button>
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); onMinimizeFolder?.(data); }}
              onClick={(e) => { e.stopPropagation(); onMinimizeFolder?.(data); }}
              className="w-5 h-5 md:w-3 md:h-3 rounded-full flex-shrink-0 transition-instant flex items-center justify-center"
              style={{ backgroundColor: MW.frame, border: `1px solid ${MW.gold}` }}
            >
              <FaMinus style={{ ...iconStyle, color: MW.content }} />
            </button>
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); setFS(!isFS); }}
              onClick={(e) => { e.stopPropagation(); setFS(!isFS); }}
              className="w-5 h-5 md:w-3 md:h-3 rounded-full flex-shrink-0 transition-instant flex items-center justify-center"
              style={{ backgroundColor: MW.frame, border: `1px solid ${MW.gold}` }}
            >
              {isFS
                ? <FaCompress style={{ ...iconStyle, color: MW.content }} />
                : <FaExpand   style={{ ...iconStyle, color: MW.content }} />}
            </button>
          </div>

          <span
            className="text-xs font-serif tracking-widest uppercase select-none truncate px-20"
            style={{ color: MW.cream, backgroundColor: MW.content, padding: "1px 8px" }}
          >
            {title}
          </span>

          {logoUrl && (
            <img src={logoUrl} alt="logo" className="absolute right-3 object-contain h-5 flex-shrink-0" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 text-sm" style={{ minHeight: 0, fontFamily: 'Georgia, "Times New Roman", serif' }}>
          {content ? (
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="text-2xl font-bold mb-3 mt-4 font-serif" style={{ color: MW.cream }}>{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-bold mb-2 mt-3 font-serif" style={{ color: MW.cream }}>{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg font-semibold mb-2 mt-3" style={{ color: MW.goldText }}>{children}</h3>,
                h4: ({ children }) => <h4 className="text-base font-semibold mb-2 mt-2" style={{ color: MW.goldText }}>{children}</h4>,
                h5: ({ children }) => <h5 className="text-sm font-semibold mb-1 mt-2" style={{ color: MW.goldText }}>{children}</h5>,
                h6: ({ children }) => <h6 className="text-xs font-semibold mb-1 mt-2" style={{ color: MW.gold }}>{children}</h6>,
                p:  ({ children }) => <p className="mb-3 leading-relaxed" style={{ color: MW.tan }}>{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1" style={{ color: MW.tan }}>{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1" style={{ color: MW.tan }}>{children}</ol>,
                li: ({ children }) => <li style={{ color: MW.tan }}>{children}</li>,
                blockquote: ({ children }) => (
                  <blockquote className="pl-3 italic mb-3" style={{ borderLeft: `4px solid ${MW.gold}`, color: MW.tanDim }}>
                    {children}
                  </blockquote>
                ),
                code: ({ inline, children }) =>
                  inline ? (
                    <code className="px-1 text-xs font-mono" style={{ backgroundColor: "#0e0c04", color: MW.gold }}>{children}</code>
                  ) : (
                    <pre className="p-3 text-xs font-mono overflow-x-auto mb-3" style={{ backgroundColor: "#0e0c04", border: `1px solid rgba(200,160,48,0.3)`, color: MW.gold }}>
                      <code>{children}</code>
                    </pre>
                  ),
                a:      ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" className="underline transition-instant" style={{ color: MW.blue }}>{children}</a>,
                strong: ({ children }) => <strong className="font-bold" style={{ color: MW.cream }}>{children}</strong>,
                em:     ({ children }) => <em className="italic" style={{ color: MW.goldText }}>{children}</em>,
                hr:     () => <hr className="my-4" style={{ borderColor: "rgba(200,160,48,0.4)" }} />,
              }}
            >
              {String(content)}
            </ReactMarkdown>
          ) : (
            <p className="italic" style={{ color: MW.muted }}>No content yet.</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div
      onClick={() => { if (!isResizingRef.current) onMinimizeFolder?.(data); }}
      className="absolute inset-0 flex items-center justify-center z-30"
    >
      {isFS ? (
        <div className="absolute inset-0" onClick={(e) => e.stopPropagation()}>
          <WindowBody full />
        </div>
      ) : (
        <Draggable handle=".title-bar" bounds="parent" nodeRef={dragRef}>
          <div ref={dragRef} style={{ display: "inline-block" }} onClick={(e) => e.stopPropagation()}>
            <Resizable
              size={size}
              onResizeStart={() => { isResizingRef.current = true; }}
              onResizeStop={(e, dir, ref) => {
                setSize({ width: ref.offsetWidth, height: ref.offsetHeight });
                setTimeout(() => { isResizingRef.current = false; }, 100);
              }}
              minWidth={320}
              minHeight={220}
              maxWidth="calc(100vw - 2rem)"
              maxHeight="90vh"
              enable={CORNERS_ONLY}
            >
              <WindowBody full={false} />
            </Resizable>
          </div>
        </Draggable>
      )}
    </div>
  );
}
