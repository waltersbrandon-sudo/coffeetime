"use client";

import { useEffect } from "react";

interface CoffeeTheme {
  accentHue: number;
  bgHue: number;
  saturation: number;
  lightness: number;
}

export function ThemeInitializer() {
  useEffect(() => {
    try {
      const saved = localStorage.getItem("coffeetime_theme");
      if (saved) {
        const theme = JSON.parse(saved) as CoffeeTheme;
        const { accentHue, bgHue, saturation, lightness } = theme;

        const root = document.documentElement;

        // Accent/Primary colors
        root.style.setProperty("--accent", `${accentHue} ${saturation}% ${lightness}%`);
        root.style.setProperty("--accent-foreground", `${accentHue} ${saturation}% ${lightness < 50 ? 95 : 5}%`);
        root.style.setProperty("--primary", `${accentHue} ${saturation}% ${lightness}%`);
        root.style.setProperty("--primary-foreground", `${accentHue} ${saturation}% ${lightness < 50 ? 95 : 5}%`);
        root.style.setProperty("--ring", `${accentHue} ${saturation}% ${lightness}%`);

        // Background colors (dark roast wheel)
        const bgSat = Math.max(5, saturation * 0.3);
        const bgLight = Math.max(4, lightness * 0.15);
        const cardLight = bgLight + 4;
        const borderLight = bgLight + 12;

        root.style.setProperty("--background", `${bgHue} ${bgSat}% ${bgLight}%`);
        root.style.setProperty("--card", `${bgHue} ${bgSat}% ${cardLight}%`);
        root.style.setProperty("--popover", `${bgHue} ${bgSat}% ${cardLight}%`);
        root.style.setProperty("--muted", `${bgHue} ${bgSat}% ${cardLight + 4}%`);
        root.style.setProperty("--border", `${bgHue} ${bgSat}% ${borderLight}%`);
        root.style.setProperty("--input", `${bgHue} ${bgSat}% ${borderLight}%`);
      }
    } catch {
      // Use default theme from CSS
    }
  }, []);

  return null;
}
