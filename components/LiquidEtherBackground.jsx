"use client";

import React from "react";
import LiquidEther from "@/components/LiquidEther";
import { useTheme } from "@/context/ThemeContext";

// Full-viewport, click-through liquid-fluid background. Sits at -z-10 with
// pointer-events-none so desktop icons, dock, modals, and the drag-select
// rubber band keep receiving clicks. The fluid still reacts to the cursor
// because LiquidEther listens for mouse/touch moves on `window` (not on the
// canvas) and tests the pointer against the container bounds. The backdrop is
// ALWAYS solid black; only the fluid palette is theme-driven via `colors`
// (see ThemeContext / the SystemSettings appearance switcher).
const FALLBACK_COLORS = ["#5a8fb3", "#2b5876", "#102630"];

export default function LiquidEtherBackground() {
  const { colors } = useTheme();
  const palette = colors && colors.length ? colors : FALLBACK_COLORS;

  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ backgroundColor: "#000000" }}
    >
      <LiquidEther
        style={{ width: "100%", height: "100%" }}
        colors={palette}
        mouseForce={24}
        cursorSize={120}
        isViscous={false}
        viscous={36}
        iterationsViscous={32}
        iterationsPoisson={32}
        resolution={0.5}
        isBounce={false}
        autoDemo
        autoSpeed={0.5}
        autoIntensity={2.2}
        takeoverDuration={0.25}
        autoResumeDelay={3000}
        autoRampDuration={0.6}
      />
    </div>
  );
}
