"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import Draggable from "react-draggable";
import Image from "next/image";
import { useQuery } from "@apollo/client";
import { GET_SYSTEM_SETTINGS, GET_HEADER } from "@/graphql/queries";
import { useTheme } from "@/context/ThemeContext";
import * as FaIcons from "react-icons/fa";
import * as IoIcons from "react-icons/io5";
import * as GiIcons from "react-icons/gi";
import * as SiIcons from "react-icons/si";
import ReactMarkdown from "react-markdown";

/**
 * SystemSettingsModal — macOS System Settings UI.
 * Sidebar with logo + nav, main content pane with Appearance settings.
 */

// Default sidebar items fallback
const DEFAULT_SIDEBAR = [
  { id: 1, label: "Appearance", reactIcon: "FaPaintBrush", slug: "appearance" },
  { id: 2, label: "Desktop & Dock", reactIcon: "FaDesktop", slug: "desktop-dock" },
  { id: 3, label: "Displays", reactIcon: "FaTv", slug: "displays" },
  { id: 4, label: "General", reactIcon: "FaCog", slug: "general" },
  { id: 5, label: "Accessibility", reactIcon: "FaUniversalAccess", slug: "accessibility" },
];

// Default background options fallback
const DEFAULT_BG_OPTIONS = [
  { id: 1, label: "Dark Blue", themeKey: "dark-blue", tipColor: "#355566", baseColor: "#102630", strokeColor: "#2a0e0e", previewColor: "#1e3a4a" },
  { id: 2, label: "Light Red", themeKey: "light-red", tipColor: "#c45555", baseColor: "#5a1a1a", strokeColor: "#3a0e0e", previewColor: "#8e3232" },
  { id: 3, label: "White", themeKey: "white", tipColor: "#e8e8e8", baseColor: "#b0b0b0", strokeColor: "#999999", previewColor: "#d0d0d0" },
  { id: 4, label: "Black", themeKey: "black", tipColor: "#2a2a2a", baseColor: "#0a0a0a", strokeColor: "#050505", previewColor: "#151515" },
];

export default function SystemSettingsModal({ folder, onClose, onMinimizeFolder }) {
  const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? "";
  const toUrl = (u = "") => (u?.startsWith("http") ? u : `${STRAPI_URL}${u}`);

  // CMS data
  const { data } = useQuery(GET_SYSTEM_SETTINGS);
  const { data: headerData } = useQuery(GET_HEADER);

  // logos
  const lightLogoUrl = headerData?.header?.logo?.[0]?.url
    ? toUrl(headerData.header.logo[0].url) : null;
  const darkLogoUrl = headerData?.header?.darkLogo?.url
    ? toUrl(headerData.header.darkLogo.url) : null;

  const settings = data?.systemSettings;
  const profileName = settings?.profileName || "Adam Judkiewicz";
  const about = settings?.about || "";
  const sidebarItems = settings?.sidebarItems?.length
    ? settings.sidebarItems
    : DEFAULT_SIDEBAR;
  const bgOptions = settings?.backgroundOptions?.length
    ? settings.backgroundOptions
    : DEFAULT_BG_OPTIONS;

  // Theme
  const { themeKey, setTheme, colorMode, isDark, setColorMode } = useTheme();
  const logoUrl = isDark ? (darkLogoUrl || lightLogoUrl) : lightLogoUrl;

  // State
  const [isFS, setFS] = useState(false);
  const [activeSlug, setActiveSlug] = useState("appearance");
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dragRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => void (document.body.style.overflow = overflow);
  }, []);

  // Icon resolver
  const getIcon = (name) =>
    FaIcons[name] || IoIcons[name] || GiIcons[name] || SiIcons[name] || FaIcons.FaCog;

  // Filter sidebar items by search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return sidebarItems;
    const q = searchQuery.toLowerCase();
    return sidebarItems.filter((i) => i.label.toLowerCase().includes(q));
  }, [sidebarItems, searchQuery]);

  // ── Color helpers ────────────────────────────
  const bg = isDark ? "bg-[#1c1c1e]" : "bg-white";
  const sidebarBg = isDark ? "bg-[#252527]" : "bg-[#f2f2f7]";
  const titleBarBg = isDark ? "bg-[#2c2c2e]" : "bg-[#e8e8ed]";
  const titleBarBorder = isDark ? "border-[#1a1a1a]" : "border-gray-300";
  const cardBg = isDark ? "bg-[#2c2c2e]" : "bg-[#e5e5ea]";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-500";
  const textMuted = isDark ? "text-gray-300" : "text-gray-700";
  const dividerColor = isDark ? "border-gray-700" : "border-gray-300";
  const searchBg = isDark ? "bg-[#3a3a3c]" : "bg-gray-200";
  const hoverBg = isDark ? "hover:bg-[#3a3a3c]/50" : "hover:bg-gray-200";
  const activeBg = isDark ? "bg-[#3a3a3c]" : "bg-gray-300";

  // ── Sidebar ──────────────────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="px-3 pt-3 pb-2">
        <div className={`flex items-center ${searchBg} rounded-md px-2 py-1.5`}>
          <FaIcons.FaSearch className={`${textSecondary} text-xs mr-2`} />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`bg-transparent outline-none text-xs flex-1 ${textPrimary} placeholder:${textSecondary}`}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className={`${textSecondary} text-xs ml-1`}>
              <FaIcons.FaTimes />
            </button>
          )}
        </div>
      </div>

      {/* Logo section — full width, not rounded */}
      <button
        onClick={() => { setActiveSlug("profile"); if (isMobile) setMobileSidebarOpen(false); }}
        className={`flex items-center justify-center mx-2 px-2 py-3 rounded-lg mb-1 ${
          activeSlug === "profile" ? activeBg : hoverBg
        }`}
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Logo"
            className="h-8 object-contain"
          />
        ) : (
          <div className="h-8 flex items-center justify-center">
            <FaIcons.FaCog className={`text-xl ${textSecondary}`} />
          </div>
        )}
      </button>

      <div className={`border-b ${dividerColor} mx-3 my-1`} />

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto px-1 py-1">
        {filteredItems.length === 0 && (
          <p className={`text-xs ${textSecondary} px-3 py-2 italic`}>No results</p>
        )}
        {filteredItems.map((item) => {
          const Icon = getIcon(item.reactIcon);
          const isActive = activeSlug === item.slug;
          return (
            <button
              key={item.id}
              onClick={() => { setActiveSlug(item.slug); if (isMobile) setMobileSidebarOpen(false); }}
              className={`flex items-center gap-2.5 w-full px-3 py-1.5 rounded-lg text-left mb-0.5 transition-colors ${
                isActive ? activeBg : hoverBg
              }`}
            >
              <Icon className="text-sm flex-shrink-0" style={{ color: isActive ? "#0a84ff" : (isDark ? "#999" : "#666") }} />
              <span className={`text-sm ${isActive ? textPrimary : textMuted}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  // ── Appearance Page ──────────────────────────
  const AppearancePage = () => (
    <div className="p-5 overflow-y-auto h-full">
      <h1 className={`text-xl font-semibold ${textPrimary} mb-5`}>Appearance</h1>

      {/* ── Appearance Mode (Light / Dark) ── */}
      <div className="mb-6">
        <h2 className={`text-sm font-medium ${textSecondary} mb-3 uppercase tracking-wider`}>Appearance</h2>
        <div className={`${cardBg} rounded-xl p-4`}>
          <div className="flex gap-4 justify-center">
            {[
              { label: "Light", icon: "☀️", mode: "light" },
              { label: "Dark", icon: "🌙", mode: "dark" },
            ].map((m) => {
              const isActive = colorMode === m.mode;
              return (
                <button
                  key={m.label}
                  onClick={() => setColorMode(m.mode)}
                  className={`flex flex-col items-center gap-1.5 px-6 py-3 rounded-lg transition-all ${
                    isActive
                      ? "bg-[#0a84ff]/20 ring-2 ring-[#0a84ff]"
                      : isDark ? "hover:bg-[#3a3a3c]" : "hover:bg-gray-300"
                  }`}
                >
                  <span className="text-2xl">{m.icon}</span>
                  <span
                    className={`text-xs ${
                      isActive ? "text-[#0a84ff] font-medium" : textSecondary
                    }`}
                  >
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Background / Theme Section ── */}
      <div className="mb-6">
        <h2 className={`text-sm font-medium ${textSecondary} mb-3 uppercase tracking-wider`}>Background</h2>
        <div className={`${cardBg} rounded-xl p-4`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-sm ${textPrimary}`}>Background Color</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {bgOptions.map((opt) => {
              const isActive = themeKey === opt.themeKey;
              return (
                <button
                  key={opt.id}
                  onClick={() =>
                    setTheme(opt.themeKey, {
                      tipColor: opt.tipColor,
                      baseColor: opt.baseColor,
                      strokeColor: opt.strokeColor,
                    })
                  }
                  className="flex flex-col items-center gap-1.5 group"
                >
                  {/* Swatch */}
                  <div
                    className={`w-full aspect-[4/3] rounded-xl border-2 transition-all relative overflow-hidden ${
                      isActive
                        ? "border-[#0a84ff] ring-2 ring-[#0a84ff]/40"
                        : "border-transparent hover:border-gray-500"
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${opt.tipColor} 0%, ${opt.baseColor} 100%)`,
                    }}
                  >
                    {/* Mini scale pattern overlay */}
                    <div className="absolute inset-0 opacity-30">
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute rounded-full"
                          style={{
                            width: "30%",
                            height: "40%",
                            left: `${(i % 3) * 33 + (Math.floor(i / 3) % 2 ? 16 : 0)}%`,
                            top: `${Math.floor(i / 3) * 35}%`,
                            background: `radial-gradient(ellipse at 50% 30%, ${opt.tipColor}88 0%, transparent 70%)`,
                            border: `1px solid ${opt.strokeColor}44`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <span
                    className={`text-[11px] ${
                      isActive ? "text-[#0a84ff] font-medium" : textSecondary
                    }`}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Windows Section ── */}
      <div className="mb-6">
        <h2 className={`text-sm font-medium ${textSecondary} mb-3 uppercase tracking-wider`}>Windows</h2>
        <div className={`${cardBg} rounded-xl divide-y ${dividerColor}`}>
          <div className="flex items-center justify-between px-4 py-3">
            <span className={`text-sm ${textPrimary}`}>Scale animation</span>
            <span className={`text-sm ${textSecondary}`}>Enabled</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className={`text-sm ${textPrimary}`}>Sidebar icon size</span>
            <span className={`text-sm ${textSecondary}`}>Medium</span>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Profile / Account Page ──────────────────
  const ProfilePage = () => (
    <div className="p-5 overflow-y-auto h-full">
      <div className="flex flex-col items-center py-8">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Logo"
            className="h-16 object-contain mb-4"
          />
        ) : (
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-3 rounded-xl">
            <FaIcons.FaCog className="text-white text-2xl" />
          </div>
        )}
        <h1 className={`text-xl font-semibold ${textPrimary}`}>Adam Judkiewicz</h1>
        <p className={`${textSecondary} text-sm`}>AAADM Account</p>
      </div>

      <div className={`${cardBg} rounded-xl divide-y ${dividerColor} mb-6`}>
        <div className="flex items-center justify-between px-4 py-3">
          <span className={`text-sm ${textPrimary}`}>Name</span>
          <span className={`text-sm ${textSecondary}`}>Adam Judkiewicz</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <span className={`text-sm ${textPrimary}`}>Account</span>
          <span className={`text-sm ${textSecondary}`}>AAADM</span>
        </div>
      </div>

      {/* About section from CMS */}
      {about && (
        <div className="mb-6">
          <h2 className={`text-sm font-medium ${textSecondary} mb-3 uppercase tracking-wider`}>About</h2>
          <div className={`${cardBg} rounded-xl p-4`}>
            <div className={`text-sm ${textMuted} prose prose-sm max-w-none ${isDark ? "prose-invert" : ""}`}>
              <ReactMarkdown>{String(about)}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ── Placeholder Page ──────────────────────────
  const PlaceholderPage = ({ title }) => (
    <div className="p-5 overflow-y-auto h-full">
      <h1 className={`text-xl font-semibold ${textPrimary} mb-5`}>{title}</h1>
      <div className={`${cardBg} rounded-xl p-6 flex flex-col items-center justify-center min-h-[200px]`}>
        <FaIcons.FaCog className={`text-4xl ${isDark ? "text-gray-600" : "text-gray-400"} mb-3 animate-spin`} style={{ animationDuration: "8s" }} />
        <p className={`${textSecondary} text-sm`}>Settings coming soon</p>
      </div>
    </div>
  );

  // Resolve active page
  const activeItem = sidebarItems.find((i) => i.slug === activeSlug);
  const pageTitle = activeSlug === "profile" ? "Account" : (activeItem?.label || activeSlug);

  const renderPage = () => {
    if (activeSlug === "appearance") return <AppearancePage />;
    if (activeSlug === "profile") return <ProfilePage />;
    return <PlaceholderPage title={pageTitle} />;
  };

  // ── WindowBody ──────────────────────────────────
  const WindowBody = ({ full }) => (
    <div
      onClick={(e) => e.stopPropagation()}
      className={
        full
          ? `absolute inset-x-0 top-1 bottom-22 flex flex-col border z-40 overflow-hidden ${bg} ${isDark ? "border-gray-900" : "border-gray-300"}`
          : isMobile
          ? `${bg} border rounded-xl shadow-2xl w-[calc(100vw-1rem)] h-[calc(100vh-7rem)] max-w-[500px] flex flex-col overflow-hidden ${isDark ? "border-gray-900" : "border-gray-300"}`
          : `${bg} border rounded-xl shadow-2xl w-[800px] h-[560px] max-w-[calc(100vw-2rem)] max-h-[85vh] flex flex-col overflow-hidden ${isDark ? "border-gray-900" : "border-gray-300"}`
      }
    >
      {/* ── Title bar ── */}
      <div
        className={
          `title-bar flex items-center h-9 px-3 ${titleBarBg} border-b ${titleBarBorder} flex-shrink-0` +
          (full ? "" : " cursor-move")
        }
      >
        <div className="flex items-center space-x-2">
          <button
            onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); onClose(); }}
            onClick={onClose}
            className="w-3 h-3 rounded-full bg-[#FF5F57] flex-shrink-0 hover:brightness-110"
          />
          <button
            onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); onMinimizeFolder?.(folder); }}
            onClick={() => onMinimizeFolder?.(folder)}
            className="w-3 h-3 rounded-full bg-[#FFBD2E] flex-shrink-0 hover:brightness-110"
          />
          <button
            onClick={() => setFS(!isFS)}
            className="w-3 h-3 rounded-full bg-[#28C93F] flex-shrink-0 hover:brightness-110"
          />
        </div>
        <div className="flex items-center ml-3 gap-1.5">
          <button disabled className="disabled:opacity-30">
            <FaIcons.FaChevronLeft className={`${textPrimary} text-xs`} />
          </button>
          <button disabled className="disabled:opacity-30">
            <FaIcons.FaChevronRight className={`${textPrimary} text-xs`} />
          </button>
        </div>
        <span className={`ml-3 font-medium text-sm select-none ${textPrimary}`}>{pageTitle}</span>
        {isMobile && (
          <button
            onClick={() => setMobileSidebarOpen((o) => !o)}
            className={`ml-auto ${textSecondary}`}
          >
            <FaIcons.FaBars className="text-sm" />
          </button>
        )}
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop sidebar */}
        {!isMobile && (
          <aside className={`w-[200px] ${sidebarBg} border-r ${titleBarBorder} overflow-y-auto flex-shrink-0`}>
            <SidebarContent />
          </aside>
        )}

        {/* Mobile sidebar overlay */}
        {isMobile && mobileSidebarOpen && (
          <>
            <div
              className="absolute inset-0 bg-black/40 z-10"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <aside className={`absolute left-0 top-0 bottom-0 w-[220px] ${sidebarBg} border-r ${titleBarBorder} overflow-y-auto z-20 mobile-sidebar-slide-in`}>
              <SidebarContent />
            </aside>
          </>
        )}

        {/* Main content */}
        <main className={`flex-1 ${bg} overflow-y-auto`}>
          {renderPage()}
        </main>
      </div>
    </div>
  );

  // ── Root render ──────────────────────────────────
  return (
    <div
      onClick={onClose}
      className="absolute inset-0 flex items-center justify-center z-30"
    >
      {isFS ? (
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
    </div>
  );
}
