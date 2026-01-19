"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// Coffee color schemes - named after coffee drinks/roasts
const COFFEE_SCHEMES = {
  espresso: { name: "Espresso", hues: [0] },
  cortado: { name: "Cortado", hues: [0, 30] },
  latte: { name: "Latte", hues: [-15, 0, 25] },
  mocha: { name: "Mocha", hues: [0, 20, 45] },
  cappuccino: { name: "Cappuccino", hues: [0, 15, 30, 50] },
};

type CoffeeScheme = keyof typeof COFFEE_SCHEMES;

// Accent wheel: Coffee hue range (browns, tans, ambers)
const ACCENT_HUE_MIN = 15;
const ACCENT_HUE_MAX = 55;
const ACCENT_HUE_RANGE = ACCENT_HUE_MAX - ACCENT_HUE_MIN;

// Background wheel: Dark roast range (blacks, dark browns, creams, greys)
// This uses a wider range with lower saturation for backgrounds
const BG_HUE_MIN = 0;
const BG_HUE_MAX = 60;
const BG_HUE_RANGE = BG_HUE_MAX - BG_HUE_MIN;

// Map wheel angle to hue range
const mapToHueRange = (angle: number, min: number, range: number): number => {
  const normalized = ((angle % 360) + 360) % 360;
  return min + (normalized / 360) * range;
};

// Map hue back to wheel position
const mapFromHueRange = (hue: number, min: number, range: number): number => {
  return ((hue - min) / range) * 360;
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

// Generate scheme hues
const generateSchemeHues = (baseHue: number, schemeType: CoffeeScheme, min: number, max: number): number[] => {
  const scheme = COFFEE_SCHEMES[schemeType];
  return scheme.hues.map((offset) => {
    const newHue = baseHue + offset;
    return Math.max(min, Math.min(max, newHue));
  });
};

interface CoffeeTheme {
  // Accent colors
  accentHue: number;
  // Background colors
  bgHue: number;
  // Shared controls
  saturation: number;
  lightness: number;
  scheme: CoffeeScheme;
}

const DEFAULT_THEME: CoffeeTheme = {
  accentHue: 30,
  bgHue: 25,
  saturation: 55,
  lightness: 55,
  scheme: "mocha",
};

// Shuffle icon
function ShuffleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22" />
      <path d="m18 2 4 4-4 4" />
      <path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2" />
      <path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8" />
      <path d="m18 14 4 4-4 4" />
    </svg>
  );
}

// Reset icon
function ResetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

interface ColorWheelProps {
  size: number;
  baseHue: number;
  saturation: number;
  lightness: number;
  scheme: CoffeeScheme;
  hueMin: number;
  hueMax: number;
  hueRange: number;
  onHueChange: (hue: number) => void;
  label: string;
  isDark?: boolean;
}

function ColorWheel({
  size,
  baseHue,
  saturation,
  lightness,
  scheme,
  hueMin,
  hueMax,
  hueRange,
  onHueChange,
  label,
  isDark = false,
}: ColorWheelProps) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const radius = size / 2;
  const innerRadius = radius * 0.45;
  const markerRadius = radius * 0.73;

  // Adjusted saturation/lightness for dark wheel
  const displaySat = isDark ? Math.max(10, saturation * 0.4) : saturation;
  const displayLight = isDark ? Math.max(5, lightness * 0.25) : lightness;

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

    const newHue = mapToHueRange(angle, hueMin, hueRange);
    onHueChange(Math.round(newHue));
  };

  // Get marker position
  const getMarkerPosition = (hue: number) => {
    const wheelAngle = mapFromHueRange(hue, hueMin, hueRange);
    const rad = (wheelAngle - 90) * (Math.PI / 180);
    return {
      x: radius + Math.cos(rad) * markerRadius,
      y: radius + Math.sin(rad) * markerRadius,
    };
  };

  const schemeHues = generateSchemeHues(baseHue, scheme, hueMin, hueMax);
  const markerPositions = schemeHues.map((h) => ({ hue: h, ...getMarkerPosition(h) }));
  const previewColors = schemeHues.map((h) => hslToHex(h, displaySat, displayLight));

  const generateConnectionPath = () => {
    if (markerPositions.length < 2) return "";
    const points = markerPositions.map((p) => `${p.x},${p.y}`);
    return `M ${points.join(" L ")} Z`;
  };

  // Generate gradient stops for wheel
  const gradientStops = isDark
    ? `hsl(${hueMin}, 15%, 8%),
       hsl(${hueMin + hueRange * 0.25}, 20%, 12%),
       hsl(${hueMin + hueRange * 0.5}, 25%, 18%),
       hsl(${hueMin + hueRange * 0.75}, 15%, 25%),
       hsl(${hueMax}, 10%, 35%),
       hsl(${hueMin}, 15%, 8%)`
    : `hsl(${hueMin}, ${displaySat}%, ${displayLight}%),
       hsl(${hueMin + hueRange * 0.25}, ${displaySat}%, ${displayLight}%),
       hsl(${hueMin + hueRange * 0.5}, ${displaySat}%, ${displayLight}%),
       hsl(${hueMin + hueRange * 0.75}, ${displaySat}%, ${displayLight}%),
       hsl(${hueMax}, ${displaySat}%, ${displayLight}%),
       hsl(${hueMin}, ${displaySat}%, ${displayLight}%)`;

  return (
    <div className="flex flex-col items-center">
      <span className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">{label}</span>
      <div className="relative" style={{ width: size, height: size }}>
        <div
          ref={wheelRef}
          className="w-full h-full rounded-full cursor-crosshair relative"
          style={{
            background: `conic-gradient(from 0deg, ${gradientStops})`,
            boxShadow: `inset 0 0 20px rgba(0,0,0,0.5), 0 0 15px ${hslToHex(baseHue, displaySat / 2, displayLight / 2)}`,
          }}
          onMouseDown={(e) => { setIsDragging(true); handleWheelInteraction(e); }}
          onMouseMove={(e) => isDragging && handleWheelInteraction(e)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onTouchStart={(e) => { setIsDragging(true); handleWheelInteraction(e); }}
          onTouchMove={(e) => isDragging && handleWheelInteraction(e)}
          onTouchEnd={() => setIsDragging(false)}
        />

        <svg
          className="absolute inset-0 pointer-events-none"
          width={size}
          height={size}
          style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.4))" }}
        >
          {markerPositions.length > 1 && (
            <path
              d={generateConnectionPath()}
              fill={`${hslToHex(baseHue, displaySat * 0.5, displayLight)}22`}
              stroke={hslToHex(baseHue, displaySat, displayLight + 10)}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          )}

          {markerPositions.map((pos, i) => (
            <line
              key={`line-${i}`}
              x1={radius}
              y1={radius}
              x2={pos.x}
              y2={pos.y}
              stroke={hslToHex(pos.hue, displaySat, displayLight + 10)}
              strokeWidth="1.5"
              strokeDasharray={i === 0 ? "none" : "3,3"}
              opacity={i === 0 ? 1 : 0.5}
            />
          ))}

          <circle
            cx={radius}
            cy={radius}
            r={innerRadius}
            fill="hsl(var(--card))"
            stroke="hsl(var(--border))"
            strokeWidth="1"
          />

          {markerPositions.map((pos, i) => (
            <g key={`marker-${i}`}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={i === 0 ? 10 : 6}
                fill={hslToHex(pos.hue, displaySat, displayLight)}
                opacity="0.3"
                style={{ filter: "blur(3px)" }}
              />
              <circle
                cx={pos.x}
                cy={pos.y}
                r={i === 0 ? 8 : 5}
                fill={hslToHex(pos.hue, displaySat, displayLight)}
                stroke="white"
                strokeWidth={i === 0 ? 2 : 1.5}
              />
            </g>
          ))}
        </svg>

        <div
          className="absolute flex flex-col items-center justify-center pointer-events-none"
          style={{
            top: radius - innerRadius,
            left: radius - innerRadius,
            width: innerRadius * 2,
            height: innerRadius * 2,
          }}
        >
          <div className="flex gap-0.5">
            {previewColors.map((color, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full border border-white/30"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CoffeeColorPicker() {
  // Load saved theme
  const [accentHue, setAccentHue] = useState(DEFAULT_THEME.accentHue);
  const [bgHue, setBgHue] = useState(DEFAULT_THEME.bgHue);
  const [saturation, setSaturation] = useState(DEFAULT_THEME.saturation);
  const [lightness, setLightness] = useState(DEFAULT_THEME.lightness);
  const [selectedScheme, setSelectedScheme] = useState<CoffeeScheme>(DEFAULT_THEME.scheme);

  // Load saved theme on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("coffeetime_theme");
      if (saved) {
        const theme = JSON.parse(saved) as CoffeeTheme;
        setAccentHue(theme.accentHue ?? DEFAULT_THEME.accentHue);
        setBgHue(theme.bgHue ?? DEFAULT_THEME.bgHue);
        setSaturation(theme.saturation ?? DEFAULT_THEME.saturation);
        setLightness(theme.lightness ?? DEFAULT_THEME.lightness);
        setSelectedScheme(theme.scheme ?? DEFAULT_THEME.scheme);
      }
    } catch {
      // Use defaults
    }
  }, []);

  // Apply theme to CSS variables
  const applyTheme = useCallback(() => {
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

    // Save to localStorage
    const theme: CoffeeTheme = {
      accentHue,
      bgHue,
      saturation,
      lightness,
      scheme: selectedScheme,
    };
    localStorage.setItem("coffeetime_theme", JSON.stringify(theme));
  }, [accentHue, bgHue, saturation, lightness, selectedScheme]);

  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  // Random functions
  const randomizeAccent = () => {
    setAccentHue(ACCENT_HUE_MIN + Math.floor(Math.random() * ACCENT_HUE_RANGE));
  };

  const randomizeBackground = () => {
    setBgHue(BG_HUE_MIN + Math.floor(Math.random() * BG_HUE_RANGE));
  };

  const resetToDefaults = () => {
    setAccentHue(DEFAULT_THEME.accentHue);
    setBgHue(DEFAULT_THEME.bgHue);
    setSaturation(DEFAULT_THEME.saturation);
    setLightness(DEFAULT_THEME.lightness);
    setSelectedScheme(DEFAULT_THEME.scheme);
  };

  const wheelSize = 140;

  return (
    <div className="space-y-6">
      {/* Dual Color Wheels */}
      <div className="flex justify-center gap-4">
        {/* Accent Wheel */}
        <div className="flex flex-col items-center">
          <ColorWheel
            size={wheelSize}
            baseHue={accentHue}
            saturation={saturation}
            lightness={lightness}
            scheme={selectedScheme}
            hueMin={ACCENT_HUE_MIN}
            hueMax={ACCENT_HUE_MAX}
            hueRange={ACCENT_HUE_RANGE}
            onHueChange={setAccentHue}
            label="Accent"
          />
          <button
            onClick={randomizeAccent}
            className="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-accent/10 hover:bg-accent/20 text-accent transition-colors"
          >
            <ShuffleIcon className="w-3.5 h-3.5" />
            Random
          </button>
        </div>

        {/* Background Wheel */}
        <div className="flex flex-col items-center">
          <ColorWheel
            size={wheelSize}
            baseHue={bgHue}
            saturation={saturation}
            lightness={lightness}
            scheme={selectedScheme}
            hueMin={BG_HUE_MIN}
            hueMax={BG_HUE_MAX}
            hueRange={BG_HUE_RANGE}
            onHueChange={setBgHue}
            label="Background"
            isDark
          />
          <button
            onClick={randomizeBackground}
            className="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
          >
            <ShuffleIcon className="w-3.5 h-3.5" />
            Random
          </button>
        </div>
      </div>

      {/* Scheme Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Roast Profile</label>
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

      {/* Body Slider (was Richness/Saturation) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-muted-foreground">Body</label>
          <span className="text-xs text-muted-foreground">{saturation}%</span>
        </div>
        <div className="relative h-8 flex items-center">
          <div
            className="absolute inset-y-1 left-0 right-0 rounded-full"
            style={{
              background: `linear-gradient(to right, hsl(${accentHue}, 10%, ${lightness}%), hsl(${accentHue}, 100%, ${lightness}%))`,
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

      {/* Acidity Slider (was Brightness/Lightness) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-muted-foreground">Acidity</label>
          <span className="text-xs text-muted-foreground">{lightness}%</span>
        </div>
        <div className="relative h-8 flex items-center">
          <div
            className="absolute inset-y-1 left-0 right-0 rounded-full"
            style={{
              background: `linear-gradient(to right, hsl(${accentHue}, ${saturation}%, 25%), hsl(${accentHue}, ${saturation}%, 50%), hsl(${accentHue}, ${saturation}%, 75%))`,
            }}
          />
          <input
            type="range"
            min={35}
            max={75}
            value={lightness}
            onChange={(e) => setLightness(parseInt(e.target.value))}
            className="color-slider relative w-full h-8"
          />
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={resetToDefaults}
        className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-card border border-border rounded-lg hover:bg-card/80 transition-colors"
      >
        <ResetIcon className="w-4 h-4" />
        Reset to Defaults
      </button>
    </div>
  );
}
