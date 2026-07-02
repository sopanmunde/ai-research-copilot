"use client";
import { useState, useEffect } from "react";
import {
  Globe,
  HelpCircle,
  Crown,
  BookOpen,
  LogOut,
  ChevronRight,
  Settings,
  Sparkles,
  Zap,
  Palette,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { UserProfileModal } from "./UserProfileModal";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { AnimatedThemeToggler } from "./ui/animated-theme-toggler";
import { API_BASE_URL } from "@/lib/api";
import { cn } from "@/lib/utils";

function ShimmerBorder({ className = "" }) {
  return (
    <span
      className={`pointer-events-none absolute inset-0 rounded-[inherit] ${className}`}
      style={{
        background:
          "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)",
        backgroundSize: "200% 100%",
        animation: "shimmer-border 3s linear infinite",
      }}
    />
  );
}

function MenuItem({
  icon: Icon,
  label,
  iconBg = "bg-muted",
  iconColor = "text-muted-foreground",
  badge,
  badgeColor = "bg-muted text-muted-foreground",
  suffix,
  onClick,
  danger = false,
  as: Component = motion.button,
  className = "",
}) {
  const motionProps = Component === motion.button ? { whileHover: { x: 2 }, transition: { duration: 0.15 } } : {};

  return (
    <Component
      onClick={onClick}
      {...motionProps}
      className={`group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-[12.5px] text-left transition-all duration-150 ${Component === motion.button ? "active:scale-[0.98]" : ""}
        ${danger
          ? "text-destructive hover:bg-destructive/10"
          : "text-foreground hover:bg-accent"
        } ${className}`}
    >
      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${danger ? "bg-destructive/10" : iconBg}`}
      >
        <Icon
          className={`h-3.5 w-3.5 ${danger ? "text-destructive" : iconColor}`}
        />
      </div>
      <span className="font-medium flex-1">{label}</span>
      {badge && (
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${badgeColor}`}
        >
          {badge}
        </span>
      )}
      {suffix}
    </Component>
  );
}

export default function SettingsPopover({ children, onUserUpdate = () => { } }) {
  const [open, setOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState(null);

  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const resolvedTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;
    fetch(
      `${API_BASE_URL}/me`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setUser(data))
      .catch(() => { });
  }, [open]);

  const initials = user
    ? (
      (user.first_name?.[0] || "") + (user.last_name?.[0] || "")
    ).toUpperCase() ||
    user.username?.[0]?.toUpperCase() ||
    "U"
    : "U";
  const displayName = user
    ? `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
    user.username ||
    "User"
    : "User";
  const email = user?.email || "";

  return (
    <>
      <style>{`
        @keyframes shimmer-border {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{children}</PopoverTrigger>

        <PopoverContent
          className="w-64 p-0 overflow-hidden rounded-2xl border-border bg-popover shadow-xl"
          align="start"
          side="top"
          sideOffset={10}
          collisionPadding={16}
        >
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                {/* ── Profile header ── */}
                <div className="px-3.5 py-4 border-b border-border/80 bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-[14px] font-bold text-primary-foreground shadow-sm border border-border">
                        {initials}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-semibold text-foreground leading-none mb-1">
                        {displayName}
                      </div>
                      {email && (
                        <div className="truncate text-[11px] text-muted-foreground font-medium leading-none">
                          {email}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3.5 flex items-center gap-2 rounded-xl border-border/60 bg-card px-3 py-2 shadow-sm">
                    <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />
                    <span className="text-[11px] font-semibold text-foreground">
                      Free plan
                    </span>
                    <button className="ml-auto text-[10px] font-bold text-primary-foreground bg-primary px-2 py-0.5 rounded-lg hover:bg-primary/90 transition-colors">
                      Upgrade
                    </button>
                  </div>
                </div>

                {/* ── Menu sections ── */}
                <div className="p-1.5 space-y-0.5">
                  <MenuItem
                    icon={Settings}
                    label="Settings"
                    onClick={() => {
                      setOpen(false);
                      setIsProfileOpen(true);
                    }}
                  />
                  {/* Appearance Theme Selector Panel */}
                  <div className="px-2.5 py-1.5 space-y-1.5">
                    <div className="flex items-center gap-2 px-1 text-[11px] font-semibold text-muted-foreground">
                      <Palette className="h-3.5 w-3.5" />
                      <span>Appearance</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 p-1 bg-muted/60 rounded-lg border border-border/40">
                      {[
                        { id: "light", label: "Light", icon: Sun },
                        { id: "dark", label: "Dark", icon: Moon },
                        { id: "system", label: "System", icon: Monitor },
                      ].map((t) => {
                        const Icon = t.icon;
                        const active = theme === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setTheme(t.id)}
                            className={cn(
                              "flex items-center justify-center gap-1.5 rounded-md py-1.5 text-center transition-all duration-150 select-none text-[11px] font-medium leading-none cursor-pointer",
                              active
                                ? "bg-card text-card-foreground shadow-sm border border-border"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                            )}
                          >
                            <Icon className="h-3.5 w-3.5 shrink-0" />
                            <span>{t.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <MenuItem
                    icon={Globe}
                    label="Language"
                    suffix={<ChevronRight className="h-3 w-3 text-muted-foreground" />}
                  />
                  <MenuItem
                    icon={HelpCircle}
                    label="Get help"
                    suffix={<ChevronRight className="h-3 w-3 text-muted-foreground" />}
                  />
                </div>

                <div className="mx-3 h-px bg-border/80" />

                <div className="p-1.5 space-y-0.5">
                  <div className="relative overflow-hidden rounded-xl">
                    <button className="group relative flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-[12.5px] text-left transition-all duration-150 hover:bg-amber-500/10 active:scale-[0.98]">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                        <Crown className="h-3.5 w-3.5 text-amber-500" />
                      </div>
                      <span className="font-medium text-foreground">
                        Upgrade plan
                      </span>
                      <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground shadow-sm">
                        PRO
                      </span>
                    </button>
                  </div>

                  <MenuItem
                    icon={BookOpen}
                    label="Learn more"
                    suffix={<ChevronRight className="h-3 w-3 text-muted-foreground" />}
                  />
                </div>

                <div className="mx-3 h-px bg-border/80" />

                <div className="p-1.5">
                  <MenuItem
                    icon={LogOut}
                    label="Log out"
                    danger
                    onClick={() => {
                      localStorage.removeItem("token");
                      document.cookie = "auth_token=; path=/; max-age=0";
                      window.location.href = "/login";
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </PopoverContent>

        <UserProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          onUpdate={onUserUpdate}
        />
      </Popover>
    </>
  );
}
