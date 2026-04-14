"use client";
import React, { useEffect, useState } from "react";
import { Menu } from "@headlessui/react";
import { FiClock } from "react-icons/fi";
import * as FaIcons from "react-icons/fa"; // FontAwesome 5
import { FaXTwitter } from "react-icons/fa6"; // FontAwesome 6 “X / Twitter”
import Image from "next/image";
import { useQuery } from "@apollo/client";
import { GET_HEADER } from "@/graphql/queries";
import { useTheme } from "@/context/ThemeContext";
import NavMenu from "./NavMenu";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? "";

const getLogoUrl = (logoArr = []) => {
  const url = logoArr?.[0]?.url ?? "";
  if (!url) return null;
  return url.startsWith("http") ? url : `${STRAPI_URL}${url}`;
};

// -------- component --------
export default function Header({ onMenuItemClick }) {
  const [now, setNow] = useState(new Date());
  const { data, loading, error } = useQuery(GET_HEADER);

  const formatDateTime = (date) => {
    const datePart = date
      .toLocaleDateString("en-US", {
        weekday: "short", // Wed
        month: "short", // Apr
        day: "numeric", // 23
      })
      .replace(",", ""); // drop the comma after weekday

    const timePart = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true, // 5:11 PM
    });

    return `${datePart} ${timePart}`;
  };

  if (loading) return null;
  if (error)
    return (
      <p className="text-red-500">Failed to load header: {error.message}</p>
    );

  const { logo, darkLogo, menus = [], socialLinks = [] } = data?.header ?? {};
  const lightLogoUrl = getLogoUrl(logo);
  const darkLogoUrl = darkLogo?.url ? (darkLogo.url.startsWith("http") ? darkLogo.url : `${STRAPI_URL}${darkLogo.url}`) : null;

  const { isDark } = useTheme();
  const logoUrl = isDark ? (darkLogoUrl || lightLogoUrl) : lightLogoUrl;

  // choose the right icon for each social link
  const getSocialIcon = (iconName) => {
    if (iconName.toLowerCase() === "x") return FaXTwitter; // FA6
    const dynamicName = `Fa${iconName.charAt(0).toUpperCase()}${iconName.slice(
      1
    )}`;
    return FaIcons[dynamicName] || FaIcons.FaLink; // fallback FA5
  };

  return (
    <nav className={`font-sfpro text-sm flex items-center justify-between px-4 lg:py-0 py-2 z-50 ${
      isDark ? "bg-gray-400/45" : "bg-white/80 backdrop-blur-md border-b border-gray-200"
    }`}>
      {/* left side: logo + (desktop‐only menus) */}
      <div className="flex items-center space-x-4">
        {logoUrl && (
          <Image
            src={logoUrl}
            alt="Company logo"
            width={160}
            height={30}
            unoptimized
            priority
            className="object-contain h-6 md:h-8"
          />
        )}
        <div className="hidden md:flex items-center space-x-2">
          {menus.map((menu) => (
            <NavMenu key={menu.label} menu={menu} onItemClick={onMenuItemClick} />
          ))}
        </div>
      </div>

      {/* right side: (desktop‐only social) + clock always */}
      <div className="flex items-center space-x-4">
        <div className="hidden md:flex items-center space-x-3">
          {socialLinks.map((link) => {
            const Icon = getSocialIcon(link.iconName);
            return (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                <Icon className={`w-5 h-5 ${isDark ? "text-white" : "text-gray-700"}`} />
              </a>
            );
          })}
        </div>
        {/* clock stays visible on all breakpoints */}
        <div className={`flex items-center space-x-1 text-sm ${isDark ? "text-white" : "text-gray-800"}`}>
          <span>{formatDateTime(now)}</span>
        </div>
      </div>
    </nav>
  );
}
