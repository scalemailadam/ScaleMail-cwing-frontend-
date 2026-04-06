"use client";

import React, { useState, useRef } from "react";
import Draggable from "react-draggable";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { useQuery } from "@apollo/client";
import { GET_HEADER } from "@/graphql/queries";

export default function TextModal({ item, folder, onClose, onMinimizeFolder }) {
  const [isFS, setFS] = useState(false);
  const dragRef = useRef(null);

  const { data: headerData } = useQuery(GET_HEADER);
  const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "";
  const toUrl = (u = "") => (u.startsWith("http") ? u : STRAPI_URL + u);
  const logoUrl = headerData?.header?.logo?.[0]?.url
    ? toUrl(headerData.header.logo[0].url)
    : null;

  const data = item ?? folder;
  const title = data?.title ?? data?.Title ?? "Document";
  const content = data?.richContent ?? "";

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
        {content
          ? <ReactMarkdown
              components={{
                h1: ({children}) => <h1 className="text-2xl font-bold mb-3 mt-4">{children}</h1>,
                h2: ({children}) => <h2 className="text-xl font-bold mb-2 mt-3">{children}</h2>,
                h3: ({children}) => <h3 className="text-lg font-semibold mb-2 mt-3">{children}</h3>,
                h4: ({children}) => <h4 className="text-base font-semibold mb-2 mt-2">{children}</h4>,
                h5: ({children}) => <h5 className="text-sm font-semibold mb-1 mt-2">{children}</h5>,
                h6: ({children}) => <h6 className="text-xs font-semibold mb-1 mt-2">{children}</h6>,
                p:  ({children}) => <p className="mb-3 leading-relaxed">{children}</p>,
                ul: ({children}) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
                ol: ({children}) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
                li: ({children}) => <li>{children}</li>,
                blockquote: ({children}) => <blockquote className="border-l-4 border-gray-400 pl-3 italic mb-3 text-gray-500">{children}</blockquote>,
                code: ({inline, children}) => inline
                  ? <code className="bg-gray-100 px-1 rounded text-xs font-mono">{children}</code>
                  : <pre className="bg-gray-100 rounded p-3 text-xs font-mono overflow-x-auto mb-3"><code>{children}</code></pre>,
                a: ({href, children}) => <a href={href} target="_blank" rel="noreferrer" className="underline text-blue-600">{children}</a>,
                strong: ({children}) => <strong className="font-bold">{children}</strong>,
                em: ({children}) => <em className="italic">{children}</em>,
                hr: () => <hr className="my-4 border-gray-300" />,
              }}
            >{String(content)}</ReactMarkdown>
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
