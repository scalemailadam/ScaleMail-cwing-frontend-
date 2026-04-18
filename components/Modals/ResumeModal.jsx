"use client";

import React, { useEffect, useRef, useState } from "react";
import Draggable from "react-draggable";
import { Resizable } from "re-resizable";
import { useQuery } from "@apollo/client";
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
  goldText:  "#c8be78",
  muted:     "#504828",
};
const stoneNoise = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.35' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.9'/%3E%3C%2Fsvg%3E")`;
const CORNERS_ONLY = { top: false, right: false, bottom: false, left: false, topRight: true, bottomRight: true, bottomLeft: true, topLeft: true };
const iconStyle = { display: "block", width: "55%", height: "55%" };

export default function ResumeModal({ folder, onClose, onMinimizeFolder }) {
  const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? "";
  const toUrl = (u = "") => (u?.startsWith("http") ? u : `${STRAPI_URL}${u}`);

  const { data } = useQuery(GET_HEADER);
  const { isDark } = useTheme();
  const lightLogoUrl = data?.header?.logo?.[0]?.url ? toUrl(data.header.logo[0].url) : null;
  const darkLogoUrl  = data?.header?.darkLogo?.url  ? toUrl(data.header.darkLogo.url)  : null;
  const logoUrl = isDark ? (darkLogoUrl || lightLogoUrl) : lightLogoUrl;

  const images =
    folder?.items
      ?.flatMap((it) => it?.subItem ?? [])
      ?.flatMap((si) => si?.image ?? [])
      ?.filter((img) => img?.url)
      ?.map((img) => toUrl(img.url)) ?? [];

  const [idx, setIdx] = useState(0);
  const [isFS, setFS] = useState(false);
  const [size, setSize] = useState(() => ({
    width:  typeof window !== "undefined" ? Math.min(500, window.innerWidth - 32) : 500,
    height: typeof window !== "undefined" ? Math.min(Math.floor(window.innerHeight * 0.85), window.innerHeight - 100) : 600,
  }));
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const dragRef = useRef(null);
  const isResizingRef = useRef(false);

  useEffect(() => {
    const url = images[idx];
    if (!url?.toLowerCase().endsWith(".pdf")) { setPdfBlobUrl(null); return; }
    let objectUrl;
    fetch(url).then((r) => r.blob()).then((blob) => {
      objectUrl = URL.createObjectURL(blob);
      setPdfBlobUrl(objectUrl);
    }).catch(() => setPdfBlobUrl(null));
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [images[idx]]);

  useEffect(() => {
    const h = (e) => {
      if (!images.length) return;
      if (e.key === "ArrowLeft")  setIdx((i) => (i - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % images.length);
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [images, onClose]);

  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => void (document.body.style.overflow = overflow);
  }, []);

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
        {/* title bar */}
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
              onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); onMinimizeFolder(folder); }}
              onClick={() => onMinimizeFolder(folder)}
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
              {isFS ? <FaCompress style={{ ...iconStyle, color: MW.content }} /> : <FaExpand style={{ ...iconStyle, color: MW.content }} />}
            </button>
          </div>
          <span className="text-xs font-serif tracking-widest uppercase select-none truncate px-20" style={{ color: MW.cream, backgroundColor: MW.content, padding: "1px 8px" }}>
            {folder.title?.replace(".exe", "")}
          </span>
          {logoUrl && <img src={logoUrl} alt="logo" className="absolute right-3 object-contain h-5 flex-shrink-0" />}
        </div>

        {/* toolbar */}
        <div className="flex items-center h-9 px-3 border-b text-xs gap-2" style={{ backgroundColor: MW.goldDim, borderColor: MW.gold }}>
          {images.length > 1 && (
            <div className="flex items-center gap-3">
              <button
                onTouchEnd={(e) => { e.stopPropagation(); setIdx((i) => (i - 1 + images.length) % images.length); }}
                onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
                className="px-2 py-1 text-base transition-instant"
                style={{ color: MW.cream }}
              >‹</button>
              <span style={{ color: MW.tan }}>{idx + 1} / {images.length}</span>
              <button
                onTouchEnd={(e) => { e.stopPropagation(); setIdx((i) => (i + 1) % images.length); }}
                onClick={() => setIdx((i) => (i + 1) % images.length)}
                className="px-2 py-1 text-base transition-instant"
                style={{ color: MW.cream }}
              >›</button>
            </div>
          )}
          <span className="ml-auto">
            {images.length > 0 && (
              <a href={images[idx]} download className="font-serif text-xs tracking-wide transition-instant hover:underline" style={{ color: MW.goldText }}>
                Download
              </a>
            )}
          </span>
        </div>

        {/* content */}
        <div className="flex-1 overflow-auto relative" style={{ backgroundColor: MW.content }}>
          {!images.length ? (
            <div className="h-full flex items-center justify-center">
              <p className="italic text-sm" style={{ color: MW.muted }}>No résumé image found.</p>
            </div>
          ) : images[idx]?.toLowerCase().endsWith(".pdf") ? (
            pdfBlobUrl ? (
              <iframe src={pdfBlobUrl} className="w-full h-full border-0" title="Resume PDF" />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="italic text-sm" style={{ color: MW.muted }}>Loading PDF…</p>
              </div>
            )
          ) : (
            <div className="py-0 flex justify-center">
              <img src={images[idx]} alt="Resume" className="max-h-full max-w-full object-contain scale-95 shadow-xl rounded" style={{ border: `1px solid ${MW.gold}` }} />
            </div>
          )}
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
        <Draggable handle=".title-bar" bounds="parent" nodeRef={dragRef} defaultPosition={{ x: 0, y: 0 }}>
          <div ref={dragRef} style={{ display: "inline-block" }} onClick={(e) => e.stopPropagation()}>
            <Resizable
              size={size}
              onResizeStart={() => { isResizingRef.current = true; }}
              onResizeStop={(e, dir, ref) => {
                setSize({ width: ref.offsetWidth, height: ref.offsetHeight });
                setTimeout(() => { isResizingRef.current = false; }, 100);
              }}
              minWidth={320}
              minHeight={300}
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
