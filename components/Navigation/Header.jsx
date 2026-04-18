"use client";
import React, { useEffect, useState } from "react";
import { Menu } from "@headlessui/react";
import * as FaIcons from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { useQuery } from "@apollo/client";
import { GET_HEADER } from "@/graphql/queries";
import { useTheme } from "@/context/ThemeContext";
import NavMenu from "./NavMenu";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? "";
const MW = {
  frameDark: "#a07820",
  content:   "#060604",
  gold:      "#1e1808",
  cream:     "#d4c880",
  goldText:  "#c8be78",
};
const stoneNoise = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.35' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.9'/%3E%3C%2Fsvg%3E")`;

const getLogoUrl = (logoArr = []) => {
  const url = logoArr?.[0]?.url ?? "";
  if (!url) return null;
  return url.startsWith("http") ? url : `${STRAPI_URL}${url}`;
};

export default function Header({ onMenuItemClick }) {
  const [now, setNow] = useState(new Date());
  const { data, loading, error } = useQuery(GET_HEADER);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(t);
  }, []);

  const formatDate = (date) =>
    date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).replace(",", "");
  const formatTime = (date) =>
    date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  if (loading) return null;
  if (error) return <p className="text-red-500">Failed to load header: {error.message}</p>;

  const { logo, darkLogo, menus = [], socialLinks = [] } = data?.header ?? {};
  const lightLogoUrl = getLogoUrl(logo);
  const darkLogoUrl = darkLogo?.url ? (darkLogo.url.startsWith("http") ? darkLogo.url : `${STRAPI_URL}${darkLogo.url}`) : null;
  const { isDark } = useTheme();
  const logoUrl = isDark ? (darkLogoUrl || lightLogoUrl) : lightLogoUrl;

  const getSocialIcon = (iconName) => {
    if (iconName.toLowerCase() === "x") return FaXTwitter;
    const name = `Fa${iconName.charAt(0).toUpperCase()}${iconName.slice(1)}`;
    return FaIcons[name] || FaIcons.FaLink;
  };

  return (
    <nav
      className="text-sm flex items-center justify-between px-4 lg:py-0 py-2 z-50"
      style={{
        backgroundColor: MW.frameDark,
        backgroundImage: stoneNoise,
        borderBottom: `1px solid ${MW.gold}`,
        boxShadow: `0 2px 8px rgba(0,0,0,0.8)`,
      }}
    >
      <div className="flex items-center space-x-4">
        {logoUrl && (
          <img src={logoUrl} alt="Company logo" className="object-contain h-6 md:h-8" />
        )}
        <div className="hidden md:flex items-center space-x-2">
          {menus.map((menu) => (
            <NavMenu key={menu.label} menu={menu} onItemClick={onMenuItemClick} />
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="hidden md:flex items-center space-x-3">
          {socialLinks.map((link) => {
            const Icon = getSocialIcon(link.iconName);
            return (
              <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">
                <Icon className="w-4 h-4 transition-instant" style={{ color: MW.goldText }} />
              </a>
            );
          })}
        </div>
        <span
          className="text-xs font-serif tracking-wide select-none flex items-center gap-3"
          style={{ color: MW.cream, backgroundColor: MW.content, padding: "1px 8px" }}
        >
          <span>{formatDate(now)}</span>
          <span>{formatTime(now)}</span>
        </span>
      </div>
    </nav>
  );
}
