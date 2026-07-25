"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import {
  Home, Activity, Play, RotateCcw,
  Sparkles, Sun, Moon, DollarSign, BookOpen,
  LayoutDashboard
} from "lucide-react";

export function GlobalCommandPalette() {
  const [mounted, setMounted] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  // Ensure hydration before rendering router/dialog
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Listen for Cmd+K / Ctrl+K or Shift+? and custom toggle event globally
  React.useEffect(() => {
    if (!mounted) return;

    const down = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA"].includes(target?.tagName)) return;

      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "?") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    const handleToggle = () => setOpen((prev) => !prev);

    document.addEventListener("keydown", down);
    window.addEventListener("toggle-command-palette", handleToggle);
    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener("toggle-command-palette", handleToggle);
    };
  }, [mounted]);

  const navigate = React.useCallback(
    (path: string) => {
      if (typeof window !== "undefined") {
        if (path.includes("#")) {
          window.location.href = path;
        } else {
          router.push(path);
        }
      }
    },
    [router]
  );

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  if (!mounted) return null;

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Global Key Palette">
      <CommandInput placeholder="Type a command or search shortcuts (Cmd+K)..." />
      <CommandList className="max-h-[350px]">
        <CommandEmpty>No matching commands found.</CommandEmpty>

        {/* Navigation Group */}
        <CommandGroup heading="Navigation & Pages">
          <CommandItem
            onSelect={() => runCommand(() => navigate("/"))}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-primary" />
              <span>Go to Home Page</span>
            </div>
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <Kbd>H</Kbd>
            </KbdGroup>
          </CommandItem>

          <CommandItem
            onSelect={() =>
              runCommand(() => navigate("/#automation-graph"))
            }
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <span>Agentic Automation Canvas</span>
            </div>
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <Kbd>A</Kbd>
            </KbdGroup>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => navigate("/dashboard"))}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 text-primary" />
              <span>Dashboard</span>
            </div>
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <Kbd>D</Kbd>
            </KbdGroup>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => navigate("/pricing"))}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <span>Pricing Plans</span>
            </div>
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <Kbd>P</Kbd>
            </KbdGroup>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => navigate("/docs"))}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <span>Documentation</span>
            </div>
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <Kbd>Shift</Kbd>
              <Kbd>D</Kbd>
            </KbdGroup>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Canvas Key Commands */}
        <CommandGroup heading="Agent Workflow Canvas Commands">
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
              })
            }
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-emerald-500" />
              <span>Play / Pause Simulation</span>
            </div>
            <Kbd>Space</Kbd>
          </CommandItem>

          <CommandItem
            onSelect={() =>
              runCommand(() => {
                window.dispatchEvent(new KeyboardEvent("keydown", { key: "n" }));
              })
            }
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <span>Step Forward Next Node</span>
            </div>
            <KbdGroup>
              <Kbd>→</Kbd>
              <Kbd>N</Kbd>
            </KbdGroup>
          </CommandItem>

          <CommandItem
            onSelect={() =>
              runCommand(() => {
                window.dispatchEvent(new KeyboardEvent("keydown", { key: "r" }));
              })
            }
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-primary" />
              <span>Reset Simulation</span>
            </div>
            <Kbd>R</Kbd>
          </CommandItem>

          <CommandItem
            onSelect={() =>
              runCommand(() => {
                window.dispatchEvent(new KeyboardEvent("keydown", { key: "1" }));
              })
            }
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Switch to PR & Code Audit Preset</span>
            </div>
            <Kbd>1</Kbd>
          </CommandItem>

          <CommandItem
            onSelect={() =>
              runCommand(() => {
                window.dispatchEvent(new KeyboardEvent("keydown", { key: "2" }));
              })
            }
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Switch to SecOps Remediation Preset</span>
            </div>
            <Kbd>2</Kbd>
          </CommandItem>

          <CommandItem
            onSelect={() =>
              runCommand(() => {
                window.dispatchEvent(new KeyboardEvent("keydown", { key: "3" }));
              })
            }
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Switch to RAG Pipeline Preset</span>
            </div>
            <Kbd>3</Kbd>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Preferences & System */}
        <CommandGroup heading="Preferences & Theme">
          <CommandItem
            onSelect={() =>
              runCommand(() => setTheme(theme === "dark" ? "light" : "dark"))
            }
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-primary" />}
              <span>Toggle Light / Dark Mode</span>
            </div>
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <Kbd>T</Kbd>
            </KbdGroup>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
