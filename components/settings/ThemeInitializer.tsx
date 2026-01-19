"use client";

import { useEffect } from "react";

interface CoffeeTheme {
  baseHue: number;
  saturation: number;
  lightness: number;
}

export function ThemeInitializer() {
  useEffect(() => {
    try {
      const saved = localStorage.getItem("coffeetime_theme");
      if (saved) {
        const theme = JSON.parse(saved) as CoffeeTheme;
        const { baseHue, saturation, lightness } = theme;

        // Apply to CSS variables
        const root = document.documentElement;
        root.style.setProperty("--accent", `${baseHue} ${saturation}% ${lightness}%`);
        root.style.setProperty("--accent-foreground", `${baseHue} ${saturation}% ${lightness < 50 ? 95 : 5}%`);
        root.style.setProperty("--primary", `${baseHue} ${saturation}% ${lightness}%`);
        root.style.setProperty("--primary-foreground", `${baseHue} ${saturation}% ${lightness < 50 ? 95 : 5}%`);
      }
    } catch {
      // Use default theme
    }
  }, []);

  return null;
}
