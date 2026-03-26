"use client";

import React, { useState, useRef } from "react";
import Draggable from "react-draggable";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { useQuery } from "@apollo/client";
import { GET_HEADER } from "@/graphql/queries";

export default function TextModal({ item, onClose, onMinimizeFolder }) {
  const [isFS, setFS] = useState(false);
  const dragRef = useRef(null);

  const { data: headerData } = useQuery(GET_HEADER);
  const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "";
  const toUrl = (u = "") => (u.startsWith("http") ? u : STRAPI_URL + u);
  const logoUrl = headerData?.header?.logo?.[0]?.url
    ? toUrl(headerData.header.logo[0].url)
    : null;

  const title = item?.title ?? item?.Title ?? "Document";
  const content = item?.richContent ?? "";

  const WindowBody = ({ full }) => (
    <div
      onClick={(e) => e.stopPropagation()}
      className={
        full
          ? "absolute inset-0 flex flex-col overflow-hidden z-40 bg-white"
          : "rounded-lg shadow-lg w-[700px] h-[500px] max-w-[calc(100vw-2rem)] max-h-[90vh] flex flex-col overflow-hidden bg-white"
      }
    >
      {/* Title Bar */}
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
            onClick={() => onMinimizeFolder?.(item)}
            className="w-3 h-3 rounded-full bg-[#FFBD2E] flex-shrink-0"
          />
          <button
            onClick={() => setFS(!isFS)}
            className="w-3 h-3 rounded-full bg-[#28C93F] flex-shrink-0"
          />
        </div>
        <span className="ml-3 font-medium text-white text-sm select-none truncate">
          {title}
        </span>
        {logoUrl && (
          <Image
            src={logoUrl}
            alt="logo"
            width={120}
            height={24}
            unoptimized
            className="ml-auto object-contain h-6 flex-shrink-0"
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 text-sm text-gray-800 prose prose-sm max-w-none">
        {content
          ? <ReactMarkdown>{String(content)}</ReactMarkdown>
          : <p className="text-gray-400 italic">No content yet.</p>
        }
      </div>
    </div>
  );

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 bg-black/50 flex items-center justify-center z-30"
    >
      {isFS ? (
        <WindowBody full />
      ) : (
        <Draggable handle=".title-bar" bounds="parent" nodeRef={dragRef}>
          <div ref={dragRef}>
            <WindowBody full={false} />
          </div>
        </Draggable>
      )}
    </div>
  );
}
