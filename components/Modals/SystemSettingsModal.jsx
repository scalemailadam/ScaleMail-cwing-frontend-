"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import Draggable from "react-draggable";
import { Resizable } from "re-resizable";
import { useQuery } from "@apollo/client";
import { GET_SYSTEM_SETTINGS, GET_HEADER } from "@/graphql/queries";
import { useTheme } from "@/context/ThemeContext";
import * as FaIcons from "react-icons/fa";
import * as IoIcons from "react-icons/io5";
import * as GiIcons from "react-icons/gi";
import * as SiIcons from "react-icons/si";
import { FaTimes, FaMinus, FaExpand, FaCompress } from "react-icons/fa";
import ReactMarkdown from "react-markdown";

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
const CORNERS_ONLY = { top: false, right: false, bottom: false, left: false, topRight: true, bottomRight: true, bottomLeft: true, topLeft: true };
const iconStyle = { display: "block", width: "55%", height: "55%" };

const DEFAULT_SIDEBAR = [
  { id: 1, label: "Appearance", reactIcon: "FaPaintBrush", slug: "appearance" },
  { id: 2, label: "Desktop & Dock", reactIcon: "FaDesktop", slug: "desktop-dock" },
  { id: 3, label: "Displays", reactIcon: "FaTv", slug: "displays" },
  { id: 4, label: "General", reactIcon: "FaCog", slug: "general" },
  { id: 5, label: "Accessibility", reactIcon: "FaUniversalAccess", slug: "accessibility" },
];

const DEFAULT_BG_OPTIONS = [
  { id: 1, label: "Dark Blue",  themeKey: "dark-blue",  tipColor: "#355566", baseColor: "#102630", strokeColor: "#2a0e0e" },
  { id: 2, label: "Light Red",  themeKey: "light-red",  tipColor: "#c45555", baseColor: "#5a1a1a", strokeColor: "#3a0e0e" },
  { id: 3, label: "White",      themeKey: "white",      tipColor: "#e8e8e8", baseColor: "#b0b0b0", strokeColor: "#999999" },
  { id: 4, label: "Black",      themeKey: "black",      tipColor: "#2a2a2a", baseColor: "#0a0a0a", strokeColor: "#050505" },
];

export default function SystemSettingsModal({ folder, onClose, onMinimizeFolder }) {
  const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? "";
  const toUrl = (u = "") => (u?.startsWith("http") ? u : `${STRAPI_URL}${u}`);

  const { data } = useQuery(GET_SYSTEM_SETTINGS);
  const { data: headerData } = useQuery(GET_HEADER);

  const lightLogoUrl = headerData?.header?.logo?.[0]?.url ? toUrl(headerData.header.logo[0].url) : null;
  const darkLogoUrl  = headerData?.header?.darkLogo?.url  ? toUrl(headerData.header.darkLogo.url)  : null;

  const settings   = data?.systemSettings;
  const about      = settings?.about || "";
  const sidebarItems = settings?.sidebarItems?.length ? settings.sidebarItems : DEFAULT_SIDEBAR;
  const bgOptions    = settings?.backgroundOptions?.length ? settings.backgroundOptions : DEFAULT_BG_OPTIONS;

  const { themeKey, setTheme, isDark } = useTheme();
  const logoUrl = isDark ? (darkLogoUrl || lightLogoUrl) : lightLogoUrl;

  const [isFS, setFS] = useState(false);
  const [size, setSize] = useState(() => ({
    width:  typeof window !== "undefined" ? Math.min(800, window.innerWidth - 32) : 800,
    height: typeof window !== "undefined" ? Math.min(560, window.innerHeight - 100) : 560,
  }));
  const [activeSlug, setActiveSlug] = useState("appearance");
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dragRef = useRef(null);
  const searchRef = useRef(null);
  const isResizingRef = useRef(false);

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

  const getIcon = (name) => FaIcons[name] || IoIcons[name] || GiIcons[name] || SiIcons[name] || FaIcons.FaCog;

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return sidebarItems;
    const q = searchQuery.toLowerCase();
    return sidebarItems.filter((i) => i.label.toLowerCase().includes(q));
  }, [sidebarItems, searchQuery]);

  const pageTitle = activeSlug === "profile" ? "Account" : (sidebarItems.find((i) => i.slug === activeSlug)?.label || activeSlug);

  // ── Sidebar ──────────────────────────────────────────────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ backgroundColor: MW.goldDim }}>
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center px-2 py-1.5" style={{ backgroundColor: MW.gold, border: `1px solid ${MW.frame}` }}>
          <FaIcons.FaSearch className="text-xs mr-2 flex-shrink-0" style={{ color: MW.tanDim }} />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none text-xs flex-1 font-serif"
            style={{ color: MW.cream }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="ml-1 text-xs" style={{ color: MW.tanDim }}>
              <FaIcons.FaTimes />
            </button>
          )}
        </div>
      </div>

      <button
        onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); setActiveSlug("profile"); if (isMobile) setMobileSidebarOpen(false); }}
        onClick={() => { setActiveSlug("profile"); if (isMobile) setMobileSidebarOpen(false); }}
        className="flex items-center justify-center mx-2 px-2 py-4 mb-1 transition-instant"
        style={{ backgroundColor: activeSlug === "profile" ? MW.gold : "transparent", border: activeSlug === "profile" ? `1px solid ${MW.frame}` : "1px solid transparent" }}
      >
        {logoUrl
          ? <img src={logoUrl} alt="Logo" className="h-10 object-contain" />
          : <FaIcons.FaCog className="text-2xl" style={{ color: MW.tanDim }} />}
      </button>

      <div className="mx-3 my-1" style={{ borderBottom: `1px solid ${MW.gold}` }} />

      <div className="flex-1 overflow-y-auto px-1 py-1">
        {filteredItems.length === 0 && (
          <p className="text-xs px-3 py-2 italic font-serif" style={{ color: MW.muted }}>No results</p>
        )}
        {filteredItems.map((item) => {
          const Icon = getIcon(item.reactIcon);
          const isActive = activeSlug === item.slug;
          return (
            <button
              key={item.id}
              onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); setActiveSlug(item.slug); if (isMobile) setMobileSidebarOpen(false); }}
              onClick={() => { setActiveSlug(item.slug); if (isMobile) setMobileSidebarOpen(false); }}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-left mb-0.5 transition-instant font-serif text-sm"
              style={{
                backgroundColor: isActive ? MW.gold : "transparent",
                color: isActive ? MW.cream : MW.tan,
                border: isActive ? `1px solid ${MW.frame}` : "1px solid transparent",
              }}
            >
              <Icon className="text-base flex-shrink-0" style={{ color: isActive ? MW.frame : MW.muted }} />
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  // ── Appearance Page ───────────────────────────────────────────────────────
  const AppearancePage = () => (
    <div className="p-5 overflow-y-auto h-full" style={{ backgroundColor: MW.content }}>
      <h1 className="text-xl font-bold font-serif mb-5" style={{ color: MW.cream }}>Appearance</h1>

      <div className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest mb-3 font-serif" style={{ color: MW.muted }}>Background</h2>
        <div className="p-4" style={{ backgroundColor: MW.gold, border: `1px solid ${MW.frame}` }}>
          <p className="text-sm font-serif mb-3" style={{ color: MW.tan }}>Background Color</p>
          <div className="grid grid-cols-4 gap-3">
            {bgOptions.map((opt) => {
              const isActive = themeKey === opt.themeKey;
              return (
                <button
                  key={opt.id}
                  onClick={() => setTheme(opt.themeKey, { tipColor: opt.tipColor, baseColor: opt.baseColor, strokeColor: opt.strokeColor })}
                  className="flex flex-col items-center gap-1.5 group transition-instant"
                >
                  <div
                    className="w-full aspect-[4/3] relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${opt.tipColor} 0%, ${opt.baseColor} 100%)`,
                      border: isActive ? `2px solid ${MW.frame}` : `2px solid ${MW.muted}`,
                      boxShadow: isActive ? `0 0 8px ${MW.frame}` : "none",
                    }}
                  >
                    <div className="absolute inset-0 opacity-30">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="absolute rounded-full" style={{ width: "30%", height: "40%", left: `${(i % 3) * 33 + (Math.floor(i / 3) % 2 ? 16 : 0)}%`, top: `${Math.floor(i / 3) * 35}%`, background: `radial-gradient(ellipse at 50% 30%, ${opt.tipColor}88 0%, transparent 70%)`, border: `1px solid ${opt.strokeColor}44` }} />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs font-serif" style={{ color: isActive ? MW.cream : MW.tanDim }}>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest mb-3 font-serif" style={{ color: MW.muted }}>Windows</h2>
        <div style={{ backgroundColor: MW.gold, border: `1px solid ${MW.frame}` }}>
          {[["Scale animation", "Enabled"], ["Sidebar icon size", "Medium"]].map(([label, val], i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3" style={{ borderBottom: i === 0 ? `1px solid ${MW.muted}` : "none" }}>
              <span className="text-sm font-serif" style={{ color: MW.tan }}>{label}</span>
              <span className="text-sm font-serif" style={{ color: MW.muted }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Profile Page ──────────────────────────────────────────────────────────
  const ProfilePage = () => (
    <div className="p-5 overflow-y-auto h-full" style={{ backgroundColor: MW.content }}>
      <div className="flex flex-col items-center py-8">
        {logoUrl
          ? <img src={logoUrl} alt="Logo" className="h-16 object-contain mb-4" />
          : <div className="w-20 h-20 flex items-center justify-center mb-3" style={{ backgroundColor: MW.gold, border: `1px solid ${MW.frame}` }}><FaIcons.FaCog className="text-2xl" style={{ color: MW.frame }} /></div>}
        <h1 className="text-xl font-bold font-serif" style={{ color: MW.cream }}>Adam Judkiewicz</h1>
        <p className="text-sm font-serif" style={{ color: MW.tan }}>AAADM Account</p>
      </div>

      <div className="mb-6" style={{ backgroundColor: MW.gold, border: `1px solid ${MW.frame}` }}>
        {[["Name", "Adam Judkiewicz"], ["Account", "AAADM"]].map(([label, val], i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3" style={{ borderBottom: i === 0 ? `1px solid ${MW.muted}` : "none" }}>
            <span className="text-sm font-serif" style={{ color: MW.tan }}>{label}</span>
            <span className="text-sm font-serif" style={{ color: MW.muted }}>{val}</span>
          </div>
        ))}
      </div>

      {about && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-3 font-serif" style={{ color: MW.muted }}>About</h2>
          <div className="p-4" style={{ backgroundColor: MW.gold, border: `1px solid ${MW.frame}` }}>
            <div className="text-sm font-serif leading-relaxed prose prose-sm max-w-none" style={{ color: MW.tan }}>
              <ReactMarkdown>{String(about)}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const PlaceholderPage = ({ title }) => (
    <div className="p-5 overflow-y-auto h-full" style={{ backgroundColor: MW.content }}>
      <h1 className="text-xl font-bold font-serif mb-5" style={{ color: MW.cream }}>{title}</h1>
      <div className="p-6 flex flex-col items-center justify-center min-h-[200px]" style={{ backgroundColor: MW.gold, border: `1px solid ${MW.frame}` }}>
        <FaIcons.FaCog className="text-4xl mb-3" style={{ color: MW.muted, animation: "spin 8s linear infinite" }} />
        <p className="text-sm font-serif italic" style={{ color: MW.muted }}>Settings coming soon</p>
      </div>
    </div>
  );

  const renderPage = () => {
    if (activeSlug === "appearance") return <AppearancePage />;
    if (activeSlug === "profile") return <ProfilePage />;
    return <PlaceholderPage title={pageTitle} />;
  };

  // ── WindowBody ────────────────────────────────────────────────────────────
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
          className={"title-bar relative flex items-center justify-center flex-shrink-0 h-9 px-3" + (full ? "" : " cursor-move")}
          style={{ backgroundColor: MW.frameDark, backgroundImage: stoneNoise, borderBottom: `1px solid ${MW.gold}` }}
        >
          <div className="absolute left-3 flex items-center space-x-1.5">
            <button onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()} onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); onClose(); }} onClick={onClose} className="w-5 h-5 md:w-3 md:h-3 rounded-full flex-shrink-0 transition-instant flex items-center justify-center" style={{ backgroundColor: MW.frame, border: `1px solid ${MW.gold}` }}>
              <FaTimes style={{ ...iconStyle, color: MW.content }} />
            </button>
            <button onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()} onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); onMinimizeFolder?.(folder); }} onClick={() => onMinimizeFolder?.(folder)} className="w-5 h-5 md:w-3 md:h-3 rounded-full flex-shrink-0 transition-instant flex items-center justify-center" style={{ backgroundColor: MW.frame, border: `1px solid ${MW.gold}` }}>
              <FaMinus style={{ ...iconStyle, color: MW.content }} />
            </button>
            <button onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()} onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); setFS(!isFS); }} onClick={(e) => { e.stopPropagation(); setFS(!isFS); }} className="w-5 h-5 md:w-3 md:h-3 rounded-full flex-shrink-0 transition-instant flex items-center justify-center" style={{ backgroundColor: MW.frame, border: `1px solid ${MW.gold}` }}>
              {isFS ? <FaCompress style={{ ...iconStyle, color: MW.content }} /> : <FaExpand style={{ ...iconStyle, color: MW.content }} />}
            </button>
          </div>
          <span className="text-xs font-serif tracking-widest uppercase select-none" style={{ color: MW.cream, backgroundColor: MW.content, padding: "1px 8px" }}>{pageTitle}</span>
          {isMobile && (
            <button onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); setMobileSidebarOpen((o) => !o); }} onClick={() => setMobileSidebarOpen((o) => !o)} className="absolute right-3 p-1 transition-instant" style={{ color: MW.goldText }}>
              <FaIcons.FaBars />
            </button>
          )}
        </div>

        {/* body */}
        <div className="flex flex-1 overflow-hidden relative">
          {!isMobile && (
            <aside className="w-[200px] flex-shrink-0 overflow-y-auto" style={{ borderRight: `1px solid ${MW.gold}` }}>
              <SidebarContent />
            </aside>
          )}

          {isMobile && mobileSidebarOpen && (
            <>
              <div className="absolute inset-0 z-10" style={{ backgroundColor: "rgba(0,0,0,0.7)" }} onClick={() => setMobileSidebarOpen(false)} />
              <aside className="absolute left-0 top-0 bottom-0 w-[220px] overflow-y-auto z-20 mobile-sidebar-slide-in" style={{ borderRight: `1px solid ${MW.gold}` }}>
                <SidebarContent />
              </aside>
            </>
          )}

          <main className="flex-1 overflow-hidden">
            {renderPage()}
          </main>
        </div>
      </div>
    </div>
  );

  return (
    <div
      onClick={() => { if (!isResizingRef.current) onMinimizeFolder?.(folder); }}
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
              minWidth={400}
              minHeight={360}
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
