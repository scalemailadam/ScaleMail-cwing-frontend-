"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// Default theme definitions (fallback if CMS data hasn't loaded yet).
// Each theme is a 3-stop color palette fed to the LiquidEther fluid
// background (low-velocity stop → high-velocity stop). The CMS exposes the
// same three stops as color1/color2/color3 on each Background Option.
const DEFAULT_THEMES = {
  "dark-blue":   { colors: ["#160d3a", "#3d5cff", "#8be9ff"] }, // Arcane Magic
  "light-red":   { colors: ["#3a0d07", "#e23d11", "#ffd24a"] }, // Molten Lava
  "white":       { colors: ["#4a5560", "#b8c2cf", "#f5f9ff"] }, // Platinum Chrome
  "black":       { colors: ["#070709", "#20202e", "#58506f"] }, // Obsidian Void
  "antigravity": { colors: ["#06140d", "#2f8f57", "#9dffb0"] }, // Verdant Aurora
  "amethyst":    { colors: ["#1e0b35", "#7b2ff7", "#d59bff"] }, // Royal Amethyst
  "ember-gold":  { colors: ["#2a1602", "#c8881a", "#ffe08a"] }, // Ember Gold
};

const DEFAULT_KEY = "dark-blue";

// Back-compat helper: legacy consumers still read tipColor/baseColor/strokeColor.
// Derive them from the palette (tip = brightest/last stop, base = first stop,
// stroke = middle stop).
function legacyFromColors(colors) {
  const c = colors && colors.length ? colors : DEFAULT_THEMES[DEFAULT_KEY].colors;
  return {
    tipColor: c[c.length - 1],
    baseColor: c[0],
    strokeColor: c[Math.floor(c.length / 2)] || c[0],
  };
}

const ThemeContext = createContext({
  themeKey: DEFAULT_KEY,
  colors: DEFAULT_THEMES[DEFAULT_KEY].colors,
  ...legacyFromColors(DEFAULT_THEMES[DEFAULT_KEY].colors),
  colorMode: "dark",
  isDark: true,
  setTheme: () => {},
  setColorMode: () => {},
});

export function ThemeProvider({ children }) {
  const [themeKey, setThemeKey] = useState(DEFAULT_KEY);
  const [colors, setColors] = useState(DEFAULT_THEMES[DEFAULT_KEY].colors);
  const colorMode = "light";
  const isDark = false;

  useEffect(() => {
    try {
      const saved = localStorage.getItem("scalemail-theme");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.themeKey && Array.isArray(parsed.colors) && parsed.colors.length) {
          setThemeKey(parsed.themeKey);
          setColors(parsed.colors);
        }
      }
    } catch {}
  }, []);

  const setTheme = (key, themeColors) => {
    const c =
      (Array.isArray(themeColors) && themeColors.length && themeColors) ||
      DEFAULT_THEMES[key]?.colors ||
      DEFAULT_THEMES[DEFAULT_KEY].colors;
    setThemeKey(key);
    setColors(c);
    try {
      localStorage.setItem("scalemail-theme", JSON.stringify({ themeKey: key, colors: c }));
    } catch {}
  };

  const setColorMode = () => {};

  return (
    <ThemeContext.Provider
      value={{
        themeKey,
        colors,
        ...legacyFromColors(colors),
        colorMode,
        isDark,
        setTheme,
        setColorMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export default ThemeContext;
