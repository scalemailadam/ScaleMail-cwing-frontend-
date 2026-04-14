"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// Default theme definitions (fallback if CMS data hasn't loaded yet)
const DEFAULT_THEMES = {
  "dark-blue": { tipColor: "#355566", baseColor: "#102630", strokeColor: "#2a0e0e" },
  "light-red": { tipColor: "#c45555", baseColor: "#5a1a1a", strokeColor: "#3a0e0e" },
  "white":     { tipColor: "#e8e8e8", baseColor: "#b0b0b0", strokeColor: "#999999" },
  "black":     { tipColor: "#2a2a2a", baseColor: "#0a0a0a", strokeColor: "#050505" },
};

const ThemeContext = createContext({
  themeKey: "dark-blue",
  tipColor: "#355566",
  baseColor: "#102630",
  strokeColor: "#2a0e0e",
  colorMode: "dark",
  isDark: true,
  setTheme: () => {},
  setColorMode: () => {},
});

export function ThemeProvider({ children }) {
  const [themeKey, setThemeKey] = useState("dark-blue");
  const [colors, setColors] = useState(DEFAULT_THEMES["dark-blue"]);
  const [colorMode, setColorModeState] = useState("dark");

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("scalemail-theme");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.themeKey && parsed.tipColor) {
          setThemeKey(parsed.themeKey);
          setColors({
            tipColor: parsed.tipColor,
            baseColor: parsed.baseColor,
            strokeColor: parsed.strokeColor,
          });
        }
        if (parsed.colorMode) {
          setColorModeState(parsed.colorMode);
        }
      }
    } catch {}
  }, []);

  const persistAll = (key, c, mode) => {
    try {
      localStorage.setItem(
        "scalemail-theme",
        JSON.stringify({ themeKey: key, ...c, colorMode: mode })
      );
    } catch {}
  };

  const setTheme = (key, themeColors) => {
    const c = themeColors || DEFAULT_THEMES[key] || DEFAULT_THEMES["dark-blue"];
    setThemeKey(key);
    setColors(c);
    persistAll(key, c, colorMode);
  };

  const setColorMode = (mode) => {
    setColorModeState(mode);
    persistAll(themeKey, colors, mode);
  };

  const isDark = colorMode === "dark";

  return (
    <ThemeContext.Provider
      value={{
        themeKey,
        tipColor: colors.tipColor,
        baseColor: colors.baseColor,
        strokeColor: colors.strokeColor,
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
