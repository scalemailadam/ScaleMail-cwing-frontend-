"use client";

import React, { useEffect, useRef, useState } from "react";
import Draggable from "react-draggable";
import Image from "next/image";
import { useQuery } from "@apollo/client";
import { GET_HEADER } from "@/graphql/queries";

export default function ResumeModal({ folder, onClose, onMinimizeFolder }) {
  const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? "";
  const toUrl = (u = "") => (u?.startsWith("http") ? u : `${STRAPI_URL}${u}`);

  /* header logo */
  const { data } = useQuery(GET_HEADER);
  const logoUrl = data?.header?.logo?.[0]?.url
    ? toUrl(data.header.logo[0].url)
    : null;

  /* résumé images */
  const images =
    folder?.items
      ?.flatMap((it) => it?.subItem ?? [])
      ?.flatMap((si) => si?.image ?? [])
      ?.filter((img) => img?.url)
      ?.map((img) => toUrl(img.url)) ?? [];

  /* state */
  const [idx, setIdx] = useState(0);
  const [isFS, setFS] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const dragRef = useRef(null);

  /* fetch PDF as blob to avoid X-Frame-Options cross-origin restriction */
  useEffect(() => {
    const url = images[idx];
    if (!url?.toLowerCase().endsWith(".pdf")) { setPdfBlobUrl(null); return; }
    let objectUrl;
    fetch(url)
      .then((r) => r.blob())
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setPdfBlobUrl(objectUrl);
      })
      .catch(() => setPdfBlobUrl(null));
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [images[idx]]);

  /* keyboard arrows */
  useEffect(() => {
    const h = (e) => {
      if (!images.length) return;
      if (e.key === "ArrowLeft")
        setIdx((i) => (i - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % images.length);
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [images, onClose]);

  /* lock scroll */
  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => void (document.body.style.overflow = overflow);
  }, []);

  /* ─ window body ─ */
  const WindowBody = ({ full }) => (
    <div
      onClick={(e) => e.stopPropagation()}
      className={
        full
          ? "absolute inset-x-0 top-1 bottom-22 flex flex-col border border-gray-900 bg-gray-300 z-40"
          : "w-[500px] h-[85vh] max-w-[calc(100vw-2rem)] max-h-[90vh] md:w-[40vw] rounded-lg shadow-2xl border border-gray-900 bg-gray-300 flex flex-col overflow-hidden"
      }
    >
      {/* title bar */}
      <div
        className={
          "title-bar flex items-center h-8 px-3 bg-[#363539] border-b border-black" +
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
            className="w-3 h-3 rounded-full bg-[#FFBD2E] flex-shrink-0"
          />
          <button
            onClick={() => setFS(!isFS)}
            className="w-3 h-3 rounded-full bg-[#28C93F] flex-shrink-0"
          />
        </div>
        <span className="absolute left-1/2 -translate-x-1/2 font-medium text-white select-none text-sm">
          {folder.title.replace(".exe", "")}
        </span>
        {logoUrl && (
          <Image
            src={logoUrl}
            alt="logo"
            width={140}
            height={28}
            priority
            unoptimized
            className="ml-auto object-contain h-6"
          />
        )}
      </div>
      {/* toolbar: page nav + download */}
      <div className="flex items-center h-9 px-3 bg-black border-b border-gray-800 text-xs gap-2">
        {images.length > 1 && (
          <div className="flex items-center gap-3">
            <button
              onTouchEnd={(e) => { e.stopPropagation(); setIdx((i) => (i - 1 + images.length) % images.length); }}
              onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
              className="text-white px-2 py-1 text-base"
            >
              ‹
            </button>
            <span className="text-gray-400">{idx + 1} / {images.length}</span>
            <button
              onTouchEnd={(e) => { e.stopPropagation(); setIdx((i) => (i + 1) % images.length); }}
              onClick={() => setIdx((i) => (i + 1) % images.length)}
              className="text-white px-2 py-1 text-base"
            >
              ›
            </button>
          </div>
        )}
        <span className="ml-auto">
          {images.length > 0 && (
            <a
              href={images[idx]}
              download
              className="font-bold text-md text-white rounded-lg p-1 hover:underline"
            >
              Download
            </a>
          )}
        </span>
      </div>

      {/* résumé image or PDF */}
      <div className="flex-1 overflow-auto relative">
        {!images.length ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-700 italic">No résumé image found.</p>
          </div>
        ) : images[idx]?.toLowerCase().endsWith(".pdf") ? (
          pdfBlobUrl ? (
            <iframe
              src={pdfBlobUrl}
              className="w-full h-full border-0"
              title="Resume PDF"
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500 italic text-sm">Loading PDF…</p>
            </div>
          )
        ) : (
          <div className="py-0 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[idx]}
              alt="Resume"
              className="max-h-full max-w-full object-contain scale-95 bg-white shadow-xl border border-gray-300 rounded"
            />
          </div>
        )}

      </div>
    </div>
  );

  /* ─ root render ─ */
  return (
    <div
      onClick={onClose}
      className="absolute inset-0 bg-black/50 flex items-center justify-center z-30"
    >
      {isFS ? (
        <WindowBody full />
      ) : (
        <Draggable
          handle=".title-bar"
          bounds="parent"
          nodeRef={dragRef}
          /* ↑ start 80 px higher than exact centre */
          defaultPosition={{ x: 0, y: 0 }}
        >
          <div ref={dragRef}>
            <WindowBody full={false} />
          </div>
        </Draggable>
      )}
    </div>
  );
}
