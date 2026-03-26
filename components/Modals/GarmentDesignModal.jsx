"use client";

import React, { useEffect, useRef, useState } from "react";
import Draggable from "react-draggable";
import Image from "next/image";
import { useQuery } from "@apollo/client";
import { GET_HEADER } from "@/graphql/queries";
import { FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";

/**
 * GarmentDesignModal – macOS-style window that displays folders of designs.
 * Sidebar = folder.items • Grid = subItem images • Lightbox only over grid.
 */
export default function GarmentDesignModal({
  folder,
  onClose,
  onMinimizeFolder,
}) {
  /* ---------------- helpers ---------------- */
  const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? "";
  const toUrl = (u = "") => (u.startsWith("http") ? u : `${STRAPI_URL}${u}`);

  /* header logo from Strapi */
  const { data } = useQuery(GET_HEADER);
  const logoUrl = (() => {
    const url = data?.header?.logo?.[0]?.url;
    return url ? toUrl(url) : null;
  })();

  /* ---------------- state ---------------- */
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isFS, setFS] = useState(false);
  const [active, setActive] = useState(null); // clicked folder.item
  const [expandedIdx, setExpandedIdx] = useState(null); // light-box index
  const dragRef = useRef(null);

  /* fake splash loader once per folder */
  useEffect(() => {
    // reset whenever this modal gets a new folder
    setLoading(true);
    setProgress(0);
    setActive(null);
    setExpandedIdx(null);
  }, [folder.documentId]);

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(id);
          setLoading(false);
          return 100;
        }
        return p + 2;
      });
    }, 100);
    return () => clearInterval(id);
  }, [loading]);

  /* lock page scroll while modal is mounted */
  useEffect(() => {
    const { style } = document.body;
    const prev = style.overflow;
    style.overflow = "hidden";
    return () => {
      style.overflow = prev;
    };
  }, []);

  /* derive images from active subItem list */
  const imageEntries = (active?.subItem || []).flatMap((s) =>
    (s.contentItems?.image || []).map((img) => ({
      src: toUrl(img.url),
      text: s?.text ?? "",
    }))
  );
  const images = imageEntries.map((e) => e.src);

  /* keyboard nav inside light-box */
  useEffect(() => {
    if (expandedIdx === null) return;
    const onKey = (e) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") closeExpanded();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expandedIdx, images]);

  const closeExpanded = () => setExpandedIdx(null);
  const prev = () =>
    setExpandedIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setExpandedIdx((i) => (i + 1) % images.length);

  /* ---------------- render helpers ---------------- */
  const WindowBody = ({ full }) => (
    <div
      onClick={(e) => e.stopPropagation()}
      className={
        full
          ? "absolute left-0 right-0 top-1 bottom-22 max-w-screen bg-black/50 border border-gray-900 flex flex-col overflow-hidden z-40"
          : "bg-black/50 border border-gray-900 rounded-lg shadow-2xl w-[900px] h-[600px] max-w-[calc(100vw-2rem)] max-h-[90vh] md:w-[70vw] md:h-[75vh] flex flex-col overflow-hidden"
      }
    >
      {/* ── title bar ─────────────────────────────── */}
      <div
        className={
          "title-bar relative flex items-center h-8 px-3 bg-[#363539] border-b border-black" +
          (full ? "" : " cursor-move")
        }
      >
        <div className="flex items-center space-x-2">
          <button
            onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); onClose(); }}
            onClick={onClose}
            className="w-3 h-3 rounded-full bg-[#FF5F57] flex-shrink-0"
          />
          <button
            onClick={() => onMinimizeFolder(folder)}
            className="w-3 h-3 rounded-full bg-[#FFBD2E]"
          />
          <button
            onClick={() => setFS(!isFS)}
            className="w-3 h-3 rounded-full bg-[#28C93F]"
          />
        </div>
        <span className="absolute left-1/2 -translate-x-1/2 font-medium text-white select-none">
          Garment Designs
        </span>
        {logoUrl && (
          <Image
            src={logoUrl}
            alt="logo"
            width={160}
            height={30}
            priority
            unoptimized
            className="ml-auto object-contain h-6 md:h-8"
          />
        )}
      </div>

      {/* ── layout: sidebar + grid ─────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* sidebar */}
        <aside className="w-60 shrink-0 border-r border-black bg-[#201e25] overflow-y-auto scrollbar-hide">
          {(folder.items ?? []).map((it) => (
            <div
              key={it.id}
              onClick={() => {
                setActive(it);
                setExpandedIdx(null);
              }}
              className={`flex items-center space-x-3 px-3 py-6 cursor-pointer ${
                active?.id === it.id
                  ? "bg-[#464746]"
                  : "hover:bg-[#464746] bg-[#201e25]"
              }`}
            >
              {it.icon?.[0]?.url ? (
                <img
                  src={toUrl(it.icon[0].url)}
                  alt={it.title}
                  className="w-6 h-6 object-contain"
                />
              ) : (
                <span className="w-6 h-6 bg-[#444] rounded" />
              )}
              <span className="text-sm text-white truncate">{it.title}</span>
            </div>
          ))}
        </aside>

        {/* grid / scroll view */}
        <main className="flex-1 min-h-0 relative">
          <div className="h-full overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white scrollbar-track-[#262629] relative">
            {/* thumbnails */}
            {active && imageEntries.length > 0 && (
              <div className="grid grid-cols-4 gap-4 content-start">
                {imageEntries.map(({ src, text }, idx) => (
                  <button
                    key={idx}
                    onClick={() => setExpandedIdx(idx)}
                    className="text-left focus:outline-none"
                  >
                    {/* card wrapper */}
                    <div className="relative overflow-hidden rounded-lg">
                      <img
                        src={src}
                        alt={text || "design"}
                        className="w-full h-full object-cover
                       transition-transform duration-300 ease-out
                       hover:scale-110"
                      />
                    </div>

                    {/* caption (optional) */}
                    <span className="mt-1 text-xs text-gray-300 truncate block">
                      {text}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {imageEntries.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="perspective-800">
                  <div className="spin-3d">
                    <Image
                      src={logoUrl}
                      alt="logo"
                      width={220}
                      height={60}
                      priority
                      unoptimized
                      draggable={false}
                      className="select-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* empty-state spinning logo */}
            {!active && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="perspective-800">
                  <div className="spin-3d">
                    <Image
                      src={logoUrl}
                      alt="logo"
                      width={220}
                      height={60}
                      priority
                      unoptimized
                      draggable={false}
                      className="select-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* light-box overlay */}
          {expandedIdx !== null && (
            <div
              className="absolute inset-0 bg-black/80 flex items-center justify-center z-50"
              onClick={closeExpanded}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeExpanded();
                }}
                className="absolute top-4 right-4 text-white hover:opacity-80"
              >
                <FaTimes size={26} />
              </button>
              {images.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prev();
                  }}
                  className="absolute left-4 text-white hover:opacity-80"
                >
                  <FaChevronLeft size={32} />
                </button>
              )}
              <img
                src={images[expandedIdx]}
                alt="expanded"
                className="max-h-full max-w-full object-contain rounded"
                onClick={(e) => e.stopPropagation()}
              />
              {images.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    next();
                  }}
                  className="absolute right-4 text-white hover:opacity-80"
                >
                  <FaChevronRight size={32} />
                </button>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );

  /* ---------------- root render ---------------- */
  return (
    <div
      onClick={onClose}
      className="absolute inset-0 bg-black/50 flex items-center justify-center z-30"
    >
      {loading ? (
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-72 h-72 bg-[#1e1d21] border border-gray-900 rounded-lg p-6 flex flex-col items-center justify-evenly"
        >
          {folder.icon?.[0]?.url ? (
            <img
              src={toUrl(folder.icon[0].url)}
              alt={folder.title}
              className="w-24 h-24 object-contain"
            />
          ) : (
            <div className="w-24 h-24 bg-[#444] rounded" />
          )}
          <h2 className="text-gray-300 font-mono tracking-wider">
            {folder.title}
          </h2>
          <div className="w-full h-4 border border-gray-600 bg-gray-800 overflow-hidden">
            <div
              className="h-full bg-[length:24px_24px] bg-[linear-gradient(45deg,#ff0000_25%,#ffffff_25%,#ffffff_50%,#ff0000_50%,#ff0000_75%,#ffffff_75%,#ffffff_100%)] animate-[stripe_600ms_linear_infinite]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : isFS ? (
        <WindowBody full />
      ) : (
        <Draggable
          handle=".title-bar"
          bounds="parent"
          nodeRef={dragRef}
          defaultPosition={{ x: 0, y: 0 }}
        >
          <div ref={dragRef}>
            <WindowBody full={false} />
          </div>
        </Draggable>
      )}

      <style jsx global>{`
        /* depth + animation utilities (global so keyframes resolve) */
        .perspective-800 {
          perspective: 800px;
        }
        @keyframes spin3d {
          from {
            transform: rotateX(12deg) rotateY(0deg);
          }
          to {
            transform: rotateX(12deg) rotateY(360deg);
          }
        }
        .spin-3d {
          transform-style: preserve-3d;
          animation: spin3d 25s linear infinite;
          will-change: transform;
        }
        @keyframes stripe {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 24px 0;
          }
        }
      `}</style>
    </div>
  );
}
