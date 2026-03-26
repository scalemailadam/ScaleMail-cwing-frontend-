"use client";

import React, { useState, useRef } from "react";
import Draggable from "react-draggable";
import Image from "next/image";
import { useQuery } from "@apollo/client";
import { GET_HEADER } from "@/graphql/queries";

const renderRichTextNode = (node, i) => {
  if (node.type === "text" || !node.type) {
    let el = node.text ?? "";
    if (!el) return null;
    if (node.bold)          el = <strong key={i}>{el}</strong>;
    if (node.italic)        el = <em key={i}>{el}</em>;
    if (node.underline)     el = <u key={i}>{el}</u>;
    if (node.strikethrough) el = <s key={i}>{el}</s>;
    if (node.code)          el = <code key={i} className="bg-gray-100 px-1 rounded text-xs font-mono">{el}</code>;
    return <span key={i}>{el}</span>;
  }
  const children = node.children?.map(renderRichTextNode);
  switch (node.type) {
    case "paragraph":   return <p key={i} className="mb-3 leading-relaxed">{children}</p>;
    case "heading": {
      const Tag = `h${node.level ?? 2}`;
      const sizes = { 1:"text-2xl", 2:"text-xl", 3:"text-lg", 4:"text-base", 5:"text-sm", 6:"text-xs" };
      return <Tag key={i} className={`${sizes[node.level ?? 2]} font-bold mb-2`}>{children}</Tag>;
    }
    case "list":
      return node.format === "ordered"
        ? <ol key={i} className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>
        : <ul key={i} className="list-disc pl-5 mb-3 space-y-1">{children}</ul>;
    case "list-item":   return <li key={i}>{children}</li>;
    case "quote":       return <blockquote key={i} className="border-l-4 border-gray-400 pl-3 italic mb-3 text-gray-600">{children}</blockquote>;
    case "code":        return <pre key={i} className="bg-gray-100 rounded p-3 text-xs font-mono overflow-x-auto mb-3">{children}</pre>;
    case "link":        return <a key={i} href={node.url} target="_blank" rel="noreferrer" className="underline text-blue-600">{children}</a>;
    default:            return <span key={i}>{children}</span>;
  }
};

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
  const raw = item?.richContent;
  // Strapi may return richtext as a JSON string or a parsed array
  let content = raw;
  if (typeof raw === "string") {
    try { content = JSON.parse(raw); } catch { content = raw; }
  }

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
      <div className="flex-1 overflow-auto p-6 text-sm text-gray-800">
        {Array.isArray(content)
          ? content.map(renderRichTextNode)
          : content
          ? <p>{String(content)}</p>
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
