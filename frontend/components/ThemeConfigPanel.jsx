"use client";

import { useState, useEffect } from "react";
import {
  X,
  Palette,
  Sun,
  Moon,
  Laptop,
  Check,
  RotateCcw,
  Sparkles,
  Sliders,
  Layers,
  Wand2,
  Filter,
  CheckCircle2,
  MessageSquare,
  Bot,
  User,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const COLOR_THEMES = [
  {
    id: "obsidian",
    name: "Obsidian Noir",
    category: "Monochrome",
    filterTag: "Cyber & Dark",
    previewColor: "#18181b",
    swatchColors: ["#18181b", "#27272a", "#f4f4f5"],
    gradient: "from-zinc-900 via-zinc-800 to-zinc-700",
    light: {
      primary: "240 5.9% 10%",
      primaryForeground: "0 0% 98%",
      accent: "240 4.8% 95.9%",
      ring: "240 5.9% 10%",
    },
    dark: {
      primary: "0 0% 98%",
      primaryForeground: "240 5.9% 10%",
      accent: "240 3.7% 15.9%",
      ring: "240 4.9% 83.9%",
    },
  },
  {
    id: "amethyst",
    name: "Amethyst Violet",
    category: "Cyber Violet",
    filterTag: "Vibrant",
    previewColor: "#8b5cf6",
    swatchColors: ["#8b5cf6", "#a855f7", "#c084fc"],
    gradient: "from-violet-600 via-purple-600 to-indigo-600",
    light: {
      primary: "262.1 83.3% 57.8%",
      primaryForeground: "210 20% 98%",
      accent: "262 80% 96%",
      ring: "262.1 83.3% 57.8%",
    },
    dark: {
      primary: "263.4 70% 66%",
      primaryForeground: "210 20% 98%",
      accent: "263.4 45% 18%",
      ring: "263.4 70% 66%",
    },
  },
  {
    id: "emerald",
    name: "Cyber Emerald",
    category: "Cyberpunk",
    filterTag: "Nature & Warm",
    previewColor: "#10b981",
    swatchColors: ["#10b981", "#14b8a6", "#06b6d4"],
    gradient: "from-emerald-600 via-teal-600 to-cyan-600",
    light: {
      primary: "158.1 64.4% 41.6%",
      primaryForeground: "0 0% 100%",
      accent: "152 76% 95%",
      ring: "158.1 64.4% 41.6%",
    },
    dark: {
      primary: "160 84% 39%",
      primaryForeground: "0 0% 100%",
      accent: "160 50% 15%",
      ring: "160 84% 39%",
    },
  },
  {
    id: "sapphire",
    name: "Oceanic Sapphire",
    category: "Corporate Navy",
    filterTag: "Vibrant",
    previewColor: "#3b82f6",
    swatchColors: ["#3b82f6", "#6366f1", "#0284c7"],
    gradient: "from-blue-600 via-indigo-600 to-sky-500",
    light: {
      primary: "221.2 83.2% 53.3%",
      primaryForeground: "210 20% 98%",
      accent: "214 95% 93%",
      ring: "221.2 83.2% 53.3%",
    },
    dark: {
      primary: "217.2 91.2% 59.8%",
      primaryForeground: "222.2 47.4% 11.2%",
      accent: "217.2 40% 18%",
      ring: "217.2 91.2% 59.8%",
    },
  },
  {
    id: "amber",
    name: "Sunset Amber",
    category: "Warm Gold",
    filterTag: "Nature & Warm",
    previewColor: "#f59e0b",
    swatchColors: ["#f59e0b", "#f97316", "#ef4444"],
    gradient: "from-amber-500 via-orange-500 to-red-500",
    light: {
      primary: "37.7 92.1% 50.2%",
      primaryForeground: "0 0% 100%",
      accent: "45 100% 94%",
      ring: "37.7 92.1% 50.2%",
    },
    dark: {
      primary: "37.7 92.1% 50.2%",
      primaryForeground: "0 0% 100%",
      accent: "38 60% 18%",
      ring: "37.7 92.1% 50.2%",
    },
  },
  {
    id: "rose",
    name: "Rose Velvet",
    category: "Crimson Red",
    filterTag: "Vibrant",
    previewColor: "#f43f5e",
    swatchColors: ["#f43f5e", "#ec4899", "#d946ef"],
    gradient: "from-rose-600 via-pink-600 to-fuchsia-600",
    light: {
      primary: "346.8 77.2% 49.8%",
      primaryForeground: "355.7 100% 97.3%",
      accent: "346 100% 96%",
      ring: "346.8 77.2% 49.8%",
    },
    dark: {
      primary: "346.8 77.2% 49.8%",
      primaryForeground: "355.7 100% 97.3%",
      accent: "346 50% 18%",
      ring: "346.8 77.2% 49.8%",
    },
  },
  {
    id: "cyberpunk",
    name: "Neon Cyberpunk",
    category: "Neon Flash",
    filterTag: "Cyber & Dark",
    previewColor: "#06b6d4",
    swatchColors: ["#06b6d4", "#ec4899", "#8b5cf6"],
    gradient: "from-cyan-500 via-fuchsia-500 to-violet-600",
    light: {
      primary: "189 94% 43%",
      primaryForeground: "0 0% 100%",
      accent: "189 100% 94%",
      ring: "189 94% 43%",
    },
    dark: {
      primary: "189 94% 53%",
      primaryForeground: "222.2 47.4% 11.2%",
      accent: "189 75% 18%",
      ring: "189 94% 53%",
    },
  },
  {
    id: "forest",
    name: "Midnight Forest",
    category: "Pine Sage",
    filterTag: "Nature & Warm",
    previewColor: "#059669",
    swatchColors: ["#059669", "#15803d", "#84cc16"],
    gradient: "from-emerald-700 via-green-700 to-lime-600",
    light: {
      primary: "160 84% 39%",
      primaryForeground: "0 0% 100%",
      accent: "150 60% 94%",
      ring: "160 84% 39%",
    },
    dark: {
      primary: "158 70% 48%",
      primaryForeground: "0 0% 100%",
      accent: "158 50% 16%",
      ring: "158 70% 48%",
    },
  },
  {
    id: "lava",
    name: "Volcanic Lava",
    category: "Magma Orange",
    filterTag: "Vibrant",
    previewColor: "#ea580c",
    swatchColors: ["#ea580c", "#dc2626", "#b91c1c"],
    gradient: "from-orange-600 via-red-600 to-rose-700",
    light: {
      primary: "20.5 90.2% 48.2%",
      primaryForeground: "0 0% 100%",
      accent: "20 100% 94%",
      ring: "20.5 90.2% 48.2%",
    },
    dark: {
      primary: "20.5 90.2% 54.2%",
      primaryForeground: "0 0% 100%",
      accent: "20 60% 18%",
      ring: "20.5 90.2% 54.2%",
    },
  },
  {
    id: "nebula",
    name: "Cosmic Nebula",
    category: "Space Magenta",
    filterTag: "Cyber & Dark",
    previewColor: "#d946ef",
    swatchColors: ["#d946ef", "#a855f7", "#6366f1"],
    gradient: "from-fuchsia-600 via-purple-600 to-indigo-600",
    light: {
      primary: "292 84% 61%",
      primaryForeground: "0 0% 100%",
      accent: "292 100% 96%",
      ring: "292 84% 61%",
    },
    dark: {
      primary: "292 84% 66%",
      primaryForeground: "0 0% 100%",
      accent: "292 50% 18%",
      ring: "292 84% 66%",
    },
  },
  {
    id: "espresso",
    name: "Espresso Roast",
    category: "Warm Terracotta",
    filterTag: "Nature & Warm",
    previewColor: "#9a3412",
    swatchColors: ["#9a3412", "#78350f", "#d97706"],
    gradient: "from-amber-800 via-amber-900 to-stone-800",
    light: {
      primary: "17.4 88.4% 33.7%",
      primaryForeground: "0 0% 100%",
      accent: "24 80% 94%",
      ring: "17.4 88.4% 33.7%",
    },
    dark: {
      primary: "24.6 95% 53.1%",
      primaryForeground: "0 0% 100%",
      accent: "24 50% 16%",
      ring: "24.6 95% 53.1%",
    },
  },
  {
    id: "nordic",
    name: "Nordic Frost",
    category: "Arctic Teal",
    filterTag: "Cyber & Dark",
    previewColor: "#0284c7",
    swatchColors: ["#0284c7", "#0d9488", "#38bdf8"],
    gradient: "from-sky-600 via-teal-600 to-cyan-500",
    light: {
      primary: "199 89% 48%",
      primaryForeground: "0 0% 100%",
      accent: "199 100% 94%",
      ring: "199 89% 48%",
    },
    dark: {
      primary: "199 89% 56%",
      primaryForeground: "222.2 47.4% 11.2%",
      accent: "199 60% 18%",
      ring: "199 89% 56%",
    },
  },
];

export const RADIUS_PRESETS = [
  { id: "0", label: "Sharp", value: "0rem" },
  { id: "0.3", label: "Compact", value: "0.3rem" },
  { id: "0.5", label: "Default", value: "0.5rem" },
  { id: "0.75", label: "Soft", value: "0.75rem" },
  { id: "1.0", label: "Rounded", value: "1.0rem" },
];

export function applyThemeVariables(themeId, mode = "dark", radius = "0.5rem") {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const theme = COLOR_THEMES.find((t) => t.id === themeId) || COLOR_THEMES[0];
  const isDark =
    mode === "dark" ||
    (mode === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const vars = isDark ? theme.dark : theme.light;

  // Apply CSS HSL variables
  root.style.setProperty("--primary", `hsl(${vars.primary})`);
  root.style.setProperty("--primary-foreground", `hsl(${vars.primaryForeground})`);
  root.style.setProperty("--accent", `hsl(${vars.accent})`);
  root.style.setProperty("--ring", `hsl(${vars.ring})`);
  root.style.setProperty("--sidebar-primary", `hsl(${vars.primary})`);
  root.style.setProperty("--radius", radius);

  if (isDark) {
    root.classList.add("dark");
    root.setAttribute("data-theme", "dark");
  } else {
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
  }

  // Save in local storage
  localStorage.setItem("app-color-theme", themeId);
  localStorage.setItem("theme", mode);
  localStorage.setItem("app-radius", radius);
}

export default function ThemeConfigPanel({ isOpen, onClose }) {
  const [selectedThemeId, setSelectedThemeId] = useState("obsidian");
  const [selectedMode, setSelectedMode] = useState("dark");
  const [selectedRadius, setSelectedRadius] = useState("0.5rem");
  const [filterCategory, setFilterCategory] = useState("All");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedTheme = localStorage.getItem("app-color-theme") || "obsidian";
    const savedMode = localStorage.getItem("theme") || "dark";
    const savedRadius = localStorage.getItem("app-radius") || "0.5rem";

    setSelectedThemeId(savedTheme);
    setSelectedMode(savedMode);
    setSelectedRadius(savedRadius);
  }, []);

  const handleSelectTheme = (themeId) => {
    setSelectedThemeId(themeId);
    applyThemeVariables(themeId, selectedMode, selectedRadius);
    const themeName = COLOR_THEMES.find((t) => t.id === themeId)?.name;
    toast.success(`Applied ${themeName} theme`);
  };

  const handleSelectMode = (mode) => {
    setSelectedMode(mode);
    applyThemeVariables(selectedThemeId, mode, selectedRadius);
  };

  const handleSelectRadius = (radiusVal) => {
    setSelectedRadius(radiusVal);
    applyThemeVariables(selectedThemeId, selectedMode, radiusVal);
  };

  const handleReset = () => {
    setSelectedThemeId("obsidian");
    setSelectedMode("dark");
    setSelectedRadius("0.5rem");
    setFilterCategory("All");
    applyThemeVariables("obsidian", "dark", "0.5rem");
    toast.success("Theme restored to default settings");
  };

  const filteredThemes = filterCategory === "All"
    ? COLOR_THEMES
    : COLOR_THEMES.filter((t) => t.filterTag === filterCategory);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg rounded-2xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white/95 dark:bg-[#0C0C0D]/95 backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-50 text-foreground"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/80 bg-muted/20">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-xs">
                <Palette className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-foreground leading-none">
                    Theme & Color Studio
                  </h3>
                  <Badge variant="secondary" className="text-[8.5px] font-extrabold px-1.5 py-0.5 bg-primary/10 text-primary border-primary/20">
                    12 PALETTES
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Customize theme colors, appearance mode, and border radius.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-7 gap-1 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer px-2"
                title="Reset default theme"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {/* 1. Mode Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                Appearance Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "light", label: "Light ☀️" },
                  { id: "dark", label: "Dark 🌙" },
                  { id: "system", label: "System 💻" },
                ].map((mode) => {
                  const isSelected = selectedMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => handleSelectMode(mode.id)}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-2 border text-[11px] font-bold transition-all cursor-pointer select-none",
                        isSelected
                          ? "border-primary bg-primary/10 text-primary shadow-2xs ring-1 ring-primary/30"
                          : "border-border/80 bg-card hover:bg-accent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span>{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Color Theme Combination Filter & Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                  <Filter className="h-3 w-3 text-primary" />
                  <span>Color Presets</span>
                </label>

                {/* Filter Pills */}
                <div className="flex items-center gap-0.5 bg-muted/40 p-0.5 rounded-lg border border-border/60">
                  {["All", "Vibrant", "Cyber & Dark", "Nature & Warm"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={cn(
                        "px-2 py-0.5 rounded-md text-[9.5px] font-extrabold transition-all cursor-pointer select-none",
                        filterCategory === cat
                          ? "bg-primary text-primary-foreground shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filteredThemes.map((theme) => {
                  const isSelected = selectedThemeId === theme.id;
                  return (
                    <motion.div
                      key={theme.id}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectTheme(theme.id)}
                      className={cn(
                        "group relative flex flex-col justify-between rounded-xl border p-2.5 cursor-pointer transition-all duration-200 backdrop-blur-md select-none overflow-hidden",
                        isSelected
                          ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30"
                          : "border-border/80 bg-card/60 hover:border-border hover:bg-card"
                      )}
                    >
                      {/* Gradient Bar Header */}
                      <div
                        className={cn(
                          "h-1.5 w-full rounded-full bg-gradient-to-r mb-2 shadow-2xs",
                          theme.gradient
                        )}
                      />

                      <div className="flex items-start justify-between gap-1.5">
                        <div className="space-y-0.5 min-w-0">
                          <h4 className="text-[11.5px] font-bold text-foreground group-hover:text-primary transition-colors leading-tight truncate">
                            {theme.name}
                          </h4>
                          <span className="text-[9px] text-muted-foreground leading-none block truncate">
                            {theme.category}
                          </span>

                          {/* Dual/Triple Swatch Dots */}
                          <div className="flex items-center gap-1 pt-1">
                            {theme.swatchColors.map((col, idx) => (
                              <span
                                key={idx}
                                className="h-2.5 w-2.5 rounded-full border border-black/20 dark:border-white/20 shadow-2xs"
                                style={{ backgroundColor: col }}
                              />
                            ))}
                          </div>
                        </div>

                        {isSelected && (
                          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs shrink-0">
                            <Check className="h-2.5 w-2.5" />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* 3. Corner Curvature Radius Presets */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                Corner Curvature (Border Radius)
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {RADIUS_PRESETS.map((rad) => {
                  const isSelected = selectedRadius === rad.value;
                  return (
                    <button
                      key={rad.id}
                      onClick={() => handleSelectRadius(rad.value)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer select-none",
                        isSelected
                          ? "border-primary bg-primary/10 text-primary shadow-2xs ring-1 ring-primary/30"
                          : "border-border/80 bg-card hover:bg-accent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {rad.label} ({rad.value})
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/80 bg-muted/20">
            <span className="text-[10px] text-muted-foreground font-medium">
              Saved automatically to workspace.
            </span>
            <Button
              onClick={onClose}
              className="h-7 text-xs font-bold px-4 cursor-pointer"
            >
              Done
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
