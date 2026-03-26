"use client";

import React, { useState, useRef } from "react";
import Draggable from "react-draggable";
import Image from "next/image";
import { useQuery, gql } from "@apollo/client";
import { GET_HEADER } from "@/graphql/queries";
import { FaTimes } from "react-icons/fa";

// Inline query updated to include rows and placementGallery
const GET_BROWSER_MODAL = gql`
  query GetBrowserModal {
    browserModal {
      title
      backgroundColor
      textColor
      content {
        __typename

        ... on ComponentSectionsSectionGroup {
          id
          backgroundColor
        }
        ... on ComponentSectionsRichTextSection {
          id
          paragraphText
          backgroundColor
          placementRich: placement
        }
        ... on ComponentSectionsHeadingSection {
          id
          heading
          textSize
          color
          backgroundColor
          placementHeading: placement
        }
        ... on ComponentSectionsImageSection {
          id
          image {
            url
          }
          width
          height
          backgroundColor
          placementImage: placement
        }
        ... on ComponentSectionsGallerySection {
          id
          images {
            url
          }
          columns
          rows
          gap
          backgroundColor
          placementGallery: placement
        }
      }
    }
  }
`;

export default function BrowserModal({ folder, onClose, onMinimizeFolder }) {
  const [isFS, setFS] = useState(false);
  const dragRef = useRef(null);

  const { data: headerData } = useQuery(GET_HEADER);
  const { data: pageData, loading, error } = useQuery(GET_BROWSER_MODAL);

  if (loading) return null;
  if (error)
    return (
      <div className="p-4 text-red-600">
        Error loading page: {error.message}
      </div>
    );
  if (!pageData?.browserModal)
    return (
      <div className="p-4 text-red-600">No browser modal data returned.</div>
    );

  const {
    title,
    backgroundColor: defaultBg,
    textColor,
    content,
  } = pageData.browserModal;
  const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "";
  const toUrl = (u = "") => (u.startsWith("http") ? u : STRAPI_URL + u);
  const logoUrl = headerData?.header?.logo?.[0]?.url
    ? toUrl(headerData.header.logo[0].url)
    : null;

  // Group sections by SectionGroup background
  const groupSections = () => {
    const groups = [];
    let currentBg = defaultBg;
    let currentItems = [];
    content.forEach((sec) => {
      if (sec.__typename === "ComponentSectionsSectionGroup") {
        if (currentItems.length)
          groups.push({ background: currentBg, items: currentItems });
        currentBg = sec.backgroundColor;
        currentItems = [];
      } else {
        currentItems.push(sec);
      }
    });
    if (currentItems.length)
      groups.push({ background: currentBg, items: currentItems });
    return groups;
  };

  // Render Strapi rich text nodes recursively
  const renderRichTextNode = (node, i) => {
    // leaf text node
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

  // Render each section type
  const renderSection = (sec) => {
    switch (sec.__typename) {
      case "ComponentSectionsRichTextSection":
        return (
          <div
            key={sec.id}
            className={`mb-4 flex justify-${sec.placementRich}`}
          >
            <div
              className="prose prose-sm max-w-none w-full"
              style={{ backgroundColor: sec.backgroundColor }}
            >
              {Array.isArray(sec.paragraphText)
                ? sec.paragraphText.map(renderRichTextNode)
                : <p>{String(sec.paragraphText ?? "")}</p>}
            </div>
          </div>
        );
      case "ComponentSectionsHeadingSection": {
        const Tag = sec.textSize || "h2";
        return (
          <div
            key={sec.id}
            className={`mb-2 flex justify-${sec.placementHeading}`}
          >
            <Tag style={{ color: sec.color }}>{sec.heading}</Tag>
          </div>
        );
      }
      case "ComponentSectionsImageSection":
        return (
          <div
            key={sec.id}
            className={`mb-4 flex justify-${sec.placementImage}`}
          >
            <Image
              src={toUrl(sec.image.url)}
              width={sec.width}
              height={sec.height}
              alt=""
              unoptimized
              className="object-cover"
            />
          </div>
        );
      case "ComponentSectionsGallerySection":
        return (
          <div
            key={sec.id}
            className={`mb-4 flex justify-${sec.placementGallery}`}
          >
            <div
              className={`grid grid-cols-${sec.columns || 3} ${
                sec.rows ? `grid-rows-${sec.rows}` : ""
              } gap-${sec.gap}`}
              style={{ backgroundColor: sec.backgroundColor }}
            >
              {sec.images.map((img, i) => (
                <Image
                  key={i}
                  src={toUrl(img.url)}
                  width={300}
                  height={200}
                  alt=""
                  unoptimized
                  className="object-cover"
                />
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const WindowBody = ({ full }) => (
    <div
      onClick={(e) => e.stopPropagation()}
      className={
        full
          ? "absolute inset-0 flex flex-col overflow-hidden z-40"
          : "rounded-lg shadow-lg w-[900px] h-[600px] max-w-[calc(100vw-2rem)] max-h-[90vh] flex flex-col overflow-hidden"
      }
      style={{ backgroundColor: defaultBg, color: textColor }}
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
            onClick={() => onMinimizeFolder(folder)}
            className="w-3 h-3 rounded-full bg-[#FFBD2E]"
          />
          <button
            onClick={() => setFS(!isFS)}
            className="w-3 h-3 rounded-full bg-[#28C93F]"
          />
        </div>
        <span className="ml-2 font-medium text-white select-none">{title}</span>
        {logoUrl && (
          <Image
            src={logoUrl}
            alt="logo"
            width={120}
            height={24}
            unoptimized
            className="ml-auto object-contain h-6"
          />
        )}
      </div>
      {/* URL Bar */}
      <div className="flex items-center px-3 py-2 bg-gray-200 border-b border-gray-300">
        <button className="p-1 hover:bg-gray-300 rounded">&#8592;</button>
        <button className="p-1 hover:bg-gray-300 rounded ml-1">&#8594;</button>
        <input
          type="text"
          readOnly
          value="www.scalemail.com"
          className="flex-1 mx-3 px-2 py-1 border border-gray-400 rounded bg-white text-sm"
        />
      </div>
      {/* Dynamic Content with background grouping */}
      <div className="flex-1 overflow-auto p-0 text-sm">
        {groupSections().map((group, idx) => (
          <div
            key={idx}
            style={{ backgroundColor: group.background }}
            className="p-4"
          >
            {group.items.map((sec) => renderSection(sec))}
          </div>
        ))}
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
