"use client";

import React, { useEffect, useRef, useState } from "react";
import Draggable from "react-draggable";
import { Resizable } from "re-resizable";
import Image from "next/image";
import { useQuery } from "@apollo/client";
import { GET_HEADER } from "@/graphql/queries";
import { useTheme } from "@/context/ThemeContext";
import { FaChevronLeft, FaChevronRight, FaTimes, FaMinus, FaExpand, FaCompress } from "react-icons/fa";

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
  muted:     "#504828",
};
const stoneNoise = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.35' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.9'/%3E%3C%2Fsvg%3E")`;
const CORNERS_ONLY = { top: false, right: false, bottom: false, left: false, topRight: true, bottomRight: true, bottomLeft: true, topLeft: true };
const iconStyle = { display: "block", width: "55%", height: "55%" };

export default function GarmentDesignModal({ folder, onClose, onMinimizeFolder }) {
  const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? "";
  const toUrl = (u = "") => (u.startsWith("http") ? u : `${STRAPI_URL}${u}`);

  const { data } = useQuery(GET_HEADER);
  const { isDark } = useTheme();
  const logoUrl = (() => {
    const lightUrl = data?.header?.logo?.[0]?.url ? toUrl(data.header.logo[0].url) : null;
    const darkUrl  = data?.header?.darkLogo?.url  ? toUrl(data.header.darkLogo.url)  : null;
    return isDark ? (darkUrl || lightUrl) : lightUrl;
  })();

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isFS, setFS] = useState(false);
  const [active, setActive] = useState(null);
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [size, setSize] = useState(() => ({
    width:  typeof window !== "undefined" ? Math.min(900, window.innerWidth - 32) : 900,
    height: typeof window !== "undefined" ? Math.min(600, window.innerHeight - 100) : 600,
  }));
  const dragRef = useRef(null);
  const isResizingRef = useRef(false);

  useEffect(() => { setLoading(true); setProgress(0); setActive(null); setExpandedIdx(null); }, [folder.documentId]);

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => {
      setProgress((p) => { if (p >= 100) { clearInterval(id); setLoading(false); return 100; } return p + 2; });
    }, 100);
    return () => clearInterval(id);
  }, [loading]);

  useEffect(() => {
    const { style } = document.body;
    const prev = style.overflow;
    style.overflow = "hidden";
    return () => { style.overflow = prev; };
  }, []);

  const imageEntries = (active?.subItem || []).flatMap((s) =>
    (s.contentItems?.image || []).map((img) => ({ src: toUrl(img.url), text: s?.text ?? "" }))
  );
  const images = imageEntries.map((e) => e.src);

  useEffect(() => {
    if (expandedIdx === null) return;
    const onKey = (e) => {
      if (e.key === "ArrowLeft") setExpandedIdx((i) => (i - 1 + images.length) % images.length);
      else if (e.key === "ArrowRight") setExpandedIdx((i) => (i + 1) % images.length);
      else if (e.key === "Escape") setExpandedIdx(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expandedIdx, images]);

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
          <span className="text-xs font-serif tracking-widest uppercase select-none truncate px-20" style={{ color: MW.cream, backgroundColor: MW.content, padding: "1px 8px" }}>
            Garment Designs
          </span>
          {logoUrl && <img src={logoUrl} alt="logo" className="absolute right-3 object-contain h-5 flex-shrink-0" />}
        </div>

        {/* sidebar + grid */}
        <div className="flex flex-1 overflow-hidden">
          <aside className="w-52 shrink-0 border-r overflow-y-auto scrollbar-hide" style={{ backgroundColor: MW.goldDim, borderColor: MW.gold }}>
            {(folder.items ?? []).map((it) => (
              <div
                key={it.id}
                onClick={() => { setActive(it); setExpandedIdx(null); }}
                className="flex items-center space-x-3 px-3 py-5 cursor-pointer transition-instant"
                style={{
                  backgroundColor: active?.id === it.id ? MW.gold : "transparent",
                  borderBottom: `1px solid ${MW.gold}`,
                }}
              >
                {it.icon?.[0]?.url
                  ? <img src={toUrl(it.icon[0].url)} alt={it.title} className="w-6 h-6 object-contain" />
                  : <span className="w-6 h-6 rounded" style={{ backgroundColor: MW.muted }} />}
                <span className="text-sm font-serif truncate" style={{ color: active?.id === it.id ? MW.cream : MW.tan }}>{it.title}</span>
              </div>
            ))}
          </aside>

          <main className="flex-1 min-h-0 relative" style={{ backgroundColor: MW.content }}>
            <div className="h-full overflow-y-auto p-4 scrollbar-thin relative" style={{ scrollbarColor: `${MW.gold} ${MW.goldDim}` }}>
              {active && imageEntries.length > 0 && (
                <div className="grid grid-cols-4 gap-4 content-start">
                  {imageEntries.map(({ src, text }, idx) => (
                    <button key={idx} onClick={() => setExpandedIdx(idx)} className="text-left focus:outline-none">
                      <div className="relative overflow-hidden" style={{ border: `1px solid ${MW.gold}` }}>
                        <img src={src} alt={text || "design"} className="w-full h-full object-cover transition-transform duration-300 ease-out hover:scale-110" />
                      </div>
                      <span className="mt-1 text-xs truncate block" style={{ color: MW.tanDim ?? MW.tan }}>{text}</span>
                    </button>
                  ))}
                </div>
              )}
              {(!active || imageEntries.length === 0) && logoUrl && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="perspective-800">
                    <div className="spin-3d">
                      <Image src={logoUrl} alt="logo" width={220} height={60} priority unoptimized draggable={false} className="select-none" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {expandedIdx !== null && (
              <div className="absolute inset-0 flex items-center justify-center z-50" style={{ backgroundColor: "rgba(0,0,0,0.9)" }} onClick={() => setExpandedIdx(null)}>
                <button onClick={(e) => { e.stopPropagation(); setExpandedIdx(null); }} className="absolute top-4 right-4 transition-instant" style={{ color: MW.cream }}>
                  <FaTimes size={22} />
                </button>
                {images.length > 1 && <>
                  <button onClick={(e) => { e.stopPropagation(); setExpandedIdx((i) => (i - 1 + images.length) % images.length); }} className="absolute left-4 transition-instant" style={{ color: MW.cream }}>
                    <FaChevronLeft size={28} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setExpandedIdx((i) => (i + 1) % images.length); }} className="absolute right-4 transition-instant" style={{ color: MW.cream }}>
                    <FaChevronRight size={28} />
                  </button>
                </>}
                <img src={images[expandedIdx]} alt="expanded" className="max-h-full max-w-full object-contain" style={{ border: `1px solid ${MW.gold}` }} onClick={(e) => e.stopPropagation()} />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );

  return (
    <div
      onClick={() => { if (!isResizingRef.current) onMinimizeFolder(folder); }}
      className="absolute inset-0 flex items-center justify-center z-30"
    >
      {loading ? (
        <div onClick={(e) => e.stopPropagation()} className="w-72 h-72 flex flex-col items-center justify-evenly p-6" style={{ backgroundColor: MW.content, backgroundImage: stoneNoise, border: `1px solid ${MW.gold}`, boxShadow: `0 0 0 1px ${MW.goldDim}` }}>
          {folder.icon?.[0]?.url
            ? <img src={toUrl(folder.icon[0].url)} alt={folder.title} className="w-24 h-24 object-contain" />
            : <div className="w-24 h-24 rounded" style={{ backgroundColor: MW.muted }} />}
          <h2 className="font-serif tracking-wider text-sm" style={{ color: MW.cream }}>{folder.title}</h2>
          <div className="w-full h-4 overflow-hidden" style={{ border: `1px solid ${MW.gold}`, backgroundColor: MW.goldDim }}>
            <div
              className="h-full bg-[length:24px_24px] animate-[stripe_600ms_linear_infinite]"
              style={{ width: `${progress}%`, backgroundImage: `linear-gradient(45deg,${MW.frame} 25%,${MW.goldDim} 25%,${MW.goldDim} 50%,${MW.frame} 50%,${MW.frame} 75%,${MW.goldDim} 75%,${MW.goldDim} 100%)` }}
            />
          </div>
        </div>
      ) : isFS ? (
        <div className="absolute inset-0" onClick={(e) => e.stopPropagation()}>
          <WindowBody full />
        </div>
      ) : (
        <Draggable handle=".title-bar" bounds="parent" nodeRef={dragRef} defaultPosition={{ x: 0, y: 0 }}>
          <div ref={dragRef} style={{ display: "inline-block" }} onClick={(e) => e.stopPropagation()}>
            <Resizable size={size} onResizeStart={() => { isResizingRef.current = true; }} onResizeStop={(e, dir, ref) => { setSize({ width: ref.offsetWidth, height: ref.offsetHeight }); setTimeout(() => { isResizingRef.current = false; }, 100); }} minWidth={400} minHeight={300} maxWidth="calc(100vw - 2rem)" maxHeight="90vh" enable={CORNERS_ONLY}>
              <WindowBody full={false} />
            </Resizable>
          </div>
        </Draggable>
      )}

      <style jsx global>{`
        .perspective-800 { perspective: 800px; }
        @keyframes spin3d { from { transform: rotateX(12deg) rotateY(0deg); } to { transform: rotateX(12deg) rotateY(360deg); } }
        .spin-3d { transform-style: preserve-3d; animation: spin3d 25s linear infinite; will-change: transform; }
        @keyframes stripe { 0% { background-position: 0 0; } 100% { background-position: 24px 0; } }
      `}</style>
    </div>
  );
}
