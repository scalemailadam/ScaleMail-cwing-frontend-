"use client";

import React from "react";
import Antigravity from "@/components/Antigravity";
import { useTheme } from "@/context/ThemeContext";

// Full-viewport, click-through particle background. Sits at -z-10 with
// pointer-events-none so desktop icons, dock, modals, and the drag-select
// rubber band keep receiving clicks. The backdrop is ALWAYS solid black; only the
// dash (particle) color is theme-driven via tipColor (see ThemeContext / the
// SystemSettings theme switcher).
export default function AntigravityBackground() {
  const { tipColor } = useTheme();

  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ backgroundColor: "#000000" }}
    >
      <Antigravity
        count={1400}
        magnetRadius={27}
        ringRadius={11}
        waveSpeed={0.4}
        waveAmplitude={1.7}
        particleSize={1.5}
        lerpSpeed={0.05}
        color={tipColor || "#a9b180"}
        autoAnimate
        particleVariance={1}
        depthFactor={2.1}
      />
    </div>
  );
}
