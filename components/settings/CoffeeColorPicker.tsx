"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// Coffee color schemes - named after coffee drinks/roasts
const COFFEE_SCHEMES = {
  espresso: { name: "Espresso", hues: [0] }, // Single dark
  cortado: { name: "Cortado", hues: [0, 30] }, // Dark + caramel
  latte: { name: "Latte", hues: [-15, 0, 25] }, // Cream, dark, caramel
  mocha: { name: "Mocha", hues: [0, 20, 45] }, // Dark, brown, amber
  cappuccino: { name: "Cappuccino", hues: [0, 15, 30, 50] }, // Full spectrum
};

type CoffeeScheme = keyof typeof COFFEE_SCHEMES;

// Coffee hue range: 20-50 degrees (brown/amber range)
// We map 0-360 interactions to this narrow range
const COFFEE_HUE_MIN = 15;
const COFFEE_HUE_MAX = 55;
const COFFEE_HUE_RANGE = COFFEE_HUE_MAX - COFFEE_HUE_MIN;

// Convert coffee hue (0-360 interaction) to actual hue (coffee range)
const mapToCoffeeHue = (angle: number): number => {
  const normalized = ((angle % 360) + 360) % 360;
  return COFFEE_HUE_MIN + (normalized / 360) * COFFEE_HUE_RANGE;
};

// Convert actual hue back to wheel position
const mapFromCoffeeHue = (hue: number): number => {
  return ((hue - COFFEE_HUE_MIN) / COFFEE_HUE_RANGE) * 360;
};

// HSL to Hex conversion
const hslToHex = (h: number, s: number, l: number): string => {
  h = ((h % 360) + 360) % 360;
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

// Generate scheme hues based on base hue and scheme type
const generateCoffeeScheme = (baseHue: number, schemeType: CoffeeScheme): number[] => {
  const scheme = COFFEE_SCHEMES[schemeType];
  return scheme.hues.map((offset) => {
    const newHue = baseHue + offset;
    // Keep within coffee range
    return Math.max(COFFEE_HUE_MIN, Math.min(COFFEE_HUE_MAX, newHue));
  });
};

interface CoffeeTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  cardBg: string;
  baseHue: number;
  saturation: number;
  lightness: number;
  scheme: CoffeeScheme;
}

const DEFAULT_COFFEE_THEME: CoffeeTheme = {
  primary: "#D4A574",
  secondary: "#8B6914",
  accent: "#D4A574",
  background: "#1a1512",
  cardBg: "#2a2420",
  baseHue: 30,
  saturation: 55,
  lightness: 55,
  scheme: "mocha",
};

interface CoffeeColorPickerProps {
  onThemeChange?: (theme: CoffeeTheme) => void;
}

export function CoffeeColorPicker({ onThemeChange }: CoffeeColorPickerProps) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Load saved theme or use defaults
  const [baseHue, setBaseHue] = useState(DEFAULT_COFFEE_THEME.baseHue);
  const [saturation, setSaturation] = useState(DEFAULT_COFFEE_THEME.saturation);
  const [lightness, setLightness] = useState(DEFAULT_COFFEE_THEME.lightness);
  const [selectedScheme, setSelectedScheme] = useState<CoffeeScheme>(DEFAULT_COFFEE_THEME.scheme);

  // Load saved theme on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("coffeetime_theme");
      if (saved) {
        const theme = JSON.parse(saved) as CoffeeTheme;
        setBaseHue(theme.baseHue);
        setSaturation(theme.saturation);
        setLightness(theme.lightness);
        setSelectedScheme(theme.scheme);
      }
    } catch {
      // Use defaults
    }
  }, []);

  // Apply theme to CSS variables
  const applyTheme = useCallback(() => {
    const hues = generateCoffeeScheme(baseHue, selectedScheme);
    const primary = hslToHex(hues[0], saturation, lightness);
    const secondary = hues[1] ? hslToHex(hues[1], saturation - 10, lightness - 10) : primary;
    const accent = primary;

    // Dark background based on hue
    const background = hslToHex(baseHue, 20, 8);
    const cardBg = hslToHex(baseHue, 15, 12);

    const theme: CoffeeTheme = {
      primary,
      secondary,
      accent,
      background,
      cardBg,
      baseHue,
      saturation,
      lightness,
      scheme: selectedScheme,
    };

    // Apply to CSS
    const root = document.documentElement;
    root.style.setProperty("--accent", `${baseHue} ${saturation}% ${lightness}%`);
    root.style.setProperty("--accent-foreground", `${baseHue} ${saturation}% ${lightness < 50 ? 95 : 5}%`);
    root.style.setProperty("--primary", `${baseHue} ${saturation}% ${lightness}%`);
    root.style.setProperty("--primary-foreground", `${baseHue} ${saturation}% ${lightness < 50 ? 95 : 5}%`);

    // Save to localStorage
    localStorage.setItem("coffeetime_theme", JSON.stringify(theme));

    onThemeChange?.(theme);
  }, [baseHue, saturation, lightness, selectedScheme, onThemeChange]);

  // Apply theme when values change
  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  // Get current scheme colors
  const schemeHues = generateCoffeeScheme(baseHue, selectedScheme);
  const previewColors = schemeHues.map((h) => hslToHex(h, saturation, lightness));

  // Wheel interaction
  const handleWheelInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left - centerX;
    const y = clientY - rect.top - centerY;

    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    // Map the wheel angle to coffee hue range
    const coffeeHue = mapToCoffeeHue(angle);
    setBaseHue(Math.round(coffeeHue));
  };

  const size = 200;
  const radius = size / 2;
  const innerRadius = radius * 0.5;
  const markerRadius = radius * 0.75;

  // Get marker position for a hue
  const getMarkerPosition = (hue: number) => {
    // Map coffee hue back to wheel position
    const wheelAngle = mapFromCoffeeHue(hue);
    const rad = (wheelAngle - 90) * (Math.PI / 180);
    return {
      x: radius + Math.cos(rad) * markerRadius,
      y: radius + Math.sin(rad) * markerRadius,
    };
  };

  const markerPositions = schemeHues.map((h) => ({ hue: h, ...getMarkerPosition(h) }));

  // Generate connection path for multi-color schemes
  const generateConnectionPath = () => {
    if (markerPositions.length < 2) return "";
    const points = markerPositions.map((p) => `${p.x},${p.y}`);
    return `M ${points.join(" L ")} Z`;
  };

  const resetToDefault = () => {
    setBaseHue(DEFAULT_COFFEE_THEME.baseHue);
    setSaturation(DEFAULT_COFFEE_THEME.saturation);
    setLightness(DEFAULT_COFFEE_THEME.lightness);
    setSelectedScheme(DEFAULT_COFFEE_THEME.scheme);
  };

  return (
    <div className="space-y-6">
      {/* Color Wheel */}
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: size, height: size }}>
          {/* Coffee gradient wheel */}
          <div
            ref={wheelRef}
            className="w-full h-full rounded-full cursor-crosshair relative"
            style={{
              background: `conic-gradient(from 0deg,
                hsl(${COFFEE_HUE_MIN}, ${saturation}%, ${lightness}%),
                hsl(${COFFEE_HUE_MIN + COFFEE_HUE_RANGE * 0.25}, ${saturation}%, ${lightness}%),
                hsl(${COFFEE_HUE_MIN + COFFEE_HUE_RANGE * 0.5}, ${saturation}%, ${lightness}%),
                hsl(${COFFEE_HUE_MIN + COFFEE_HUE_RANGE * 0.75}, ${saturation}%, ${lightness}%),
                hsl(${COFFEE_HUE_MAX}, ${saturation}%, ${lightness}%),
                hsl(${COFFEE_HUE_MIN}, ${saturation}%, ${lightness}%)
              )`,
              boxShadow: `inset 0 0 30px rgba(0,0,0,0.4), 0 0 20px ${hslToHex(baseHue, saturation / 2, lightness / 2)}`,
            }}
            onMouseDown={(e) => {
              setIsDragging(true);
              handleWheelInteraction(e);
            }}
            onMouseMove={(e) => isDragging && handleWheelInteraction(e)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onTouchStart={(e) => {
              setIsDragging(true);
              handleWheelInteraction(e);
            }}
            onTouchMove={(e) => isDragging && handleWheelInteraction(e)}
            onTouchEnd={() => setIsDragging(false)}
          />

          {/* SVG Overlay */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={size}
            height={size}
            style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))" }}
          >
            {/* Connection path */}
            {markerPositions.length > 1 && (
              <path
                d={generateConnectionPath()}
                fill={`${hslToHex(baseHue, saturation * 0.6, lightness)}33`}
                stroke={hslToHex(baseHue, saturation, lightness + 5)}
                strokeWidth="2"
                strokeLinejoin="round"
              />
            )}

            {/* Lines from center to markers */}
            {markerPositions.map((pos, i) => (
              <line
                key={`line-${i}`}
                x1={radius}
                y1={radius}
                x2={pos.x}
                y2={pos.y}
                stroke={hslToHex(pos.hue, saturation, lightness + 5)}
                strokeWidth="2"
                strokeDasharray={i === 0 ? "none" : "4,4"}
                opacity={i === 0 ? 1 : 0.6}
              />
            ))}

            {/* Inner circle */}
            <circle
              cx={radius}
              cy={radius}
              r={innerRadius}
              fill="hsl(var(--card))"
              stroke="hsl(var(--border))"
              strokeWidth="1"
            />

            {/* Markers */}
            {markerPositions.map((pos, i) => (
              <g key={`marker-${i}`}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={i === 0 ? 12 : 8}
                  fill={hslToHex(pos.hue, saturation, lightness)}
                  opacity="0.3"
                  style={{ filter: "blur(4px)" }}
                />
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={i === 0 ? 10 : 6}
                  fill={hslToHex(pos.hue, saturation, lightness)}
                  stroke="white"
                  strokeWidth={i === 0 ? 3 : 2}
                />
              </g>
            ))}
          </svg>

          {/* Center display */}
          <div
            className="absolute flex flex-col items-center justify-center pointer-events-none"
            style={{
              top: radius - innerRadius,
              left: radius - innerRadius,
              width: innerRadius * 2,
              height: innerRadius * 2,
            }}
          >
            <div className="flex gap-1">
              {previewColors.map((color, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full border-2 border-white/30"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">
              {COFFEE_SCHEMES[selectedScheme].name}
            </span>
          </div>
        </div>
      </div>

      {/* Scheme Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Color Scheme</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(COFFEE_SCHEMES) as CoffeeScheme[]).map((scheme) => (
            <button
              key={scheme}
              onClick={() => setSelectedScheme(scheme)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedScheme === scheme
                  ? "bg-accent text-accent-foreground"
                  : "bg-card border border-border hover:bg-card/80"
              }`}
            >
              {COFFEE_SCHEMES[scheme].name}
            </button>
          ))}
        </div>
      </div>

      {/* Saturation Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-muted-foreground">Richness</label>
          <span className="text-xs text-muted-foreground">{saturation}%</span>
        </div>
        <div className="relative h-8 flex items-center">
          <div
            className="absolute inset-y-1 left-0 right-0 rounded-full"
            style={{
              background: `linear-gradient(to right, hsl(${baseHue}, 0%, ${lightness}%), hsl(${baseHue}, 100%, ${lightness}%))`,
            }}
          />
          <input
            type="range"
            min={20}
            max={100}
            value={saturation}
            onChange={(e) => setSaturation(parseInt(e.target.value))}
            className="color-slider relative w-full h-8"
          />
        </div>
      </div>

      {/* Lightness Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-muted-foreground">Brightness</label>
          <span className="text-xs text-muted-foreground">{lightness}%</span>
        </div>
        <div className="relative h-8 flex items-center">
          <div
            className="absolute inset-y-1 left-0 right-0 rounded-full"
            style={{
              background: `linear-gradient(to right, hsl(${baseHue}, ${saturation}%, 20%), hsl(${baseHue}, ${saturation}%, 50%), hsl(${baseHue}, ${saturation}%, 80%))`,
            }}
          />
          <input
            type="range"
            min={30}
            max={75}
            value={lightness}
            onChange={(e) => setLightness(parseInt(e.target.value))}
            className="color-slider relative w-full h-8"
          />
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={resetToDefault}
        className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Reset to Default
      </button>
    </div>
  );
}
