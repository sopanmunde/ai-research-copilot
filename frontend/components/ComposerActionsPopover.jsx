"use client";

import { useState, useRef } from "react";
import {
  Paperclip,
  Bot,
  Palette,
  BookOpen,
  MoreHorizontal,
  Globe,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  HardDrive,
  Cloud,
  Users,
  Sparkles,
  Zap,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";

function ActionRow({ action, index, onAction }) {
  const Icon = action.icon;
  return (
    <motion.button
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025, duration: 0.15 }}
      whileHover={{ x: 2, backgroundColor: "rgba(120, 120, 120, 0.08)" }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onAction(action.action)}
      className="group flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-all duration-150 cursor-pointer border border-transparent hover:border-zinc-200/50 dark:hover:border-zinc-800/50 select-none"
    >
      <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105", action.iconBg)}>
        <Icon className={cn("h-3.5 w-3.5 transition-colors", action.iconColor)} />
      </div>
      <div className="flex items-center justify-between flex-1 min-w-0">
        <span className="text-[12.5px] font-bold text-zinc-800 dark:text-zinc-100 group-hover:text-zinc-950 dark:group-hover:text-white leading-none">
          {action.label}
        </span>
        {action.badge && (
          <Badge
            variant="secondary"
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[8.5px] font-extrabold shadow-none border leading-none shrink-0",
              action.badgeStyle
            )}
          >
            {action.badge}
          </Badge>
        )}
      </div>
    </motion.button>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="px-2 pt-2.5 pb-1">
      <p className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500/80">
        {children}
      </p>
    </div>
  );
}

function Divider() {
  return <div className="mx-2 my-1.5 h-px bg-zinc-200/60 dark:bg-zinc-800/60" />;
}

export default function ComposerActionsPopover({ children, onFileSelect, activeAction = null, setMode = () => { } }) {
  const [open, setOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onFileSelect) onFileSelect(file);
    setOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const ACCEPTED_TYPES = [
    ".pdf", ".docx", ".doc", ".txt", ".rtf", ".odt",
    ".xlsx", ".xls", ".csv",
    ".pptx", ".ppt",
    ".html", ".htm", ".md", ".mdx", ".rst",
    ".json", ".jsonl", ".xml", ".yaml", ".yml",
    ".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".cpp", ".c", ".cs",
    ".go", ".rs", ".rb", ".php", ".sh", ".sql",
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".tiff", ".svg",
    ".zip",
  ];

  const mainActions = [
    {
      icon: Paperclip,
      label: "Add files",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      action: () => { setOpen(false); fileInputRef.current?.click(); },
    },
    {
      icon: Bot,
      label: "Agent mode",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      badge: activeAction === "agent" ? "ACTIVE" : "GRAPH",
      badgeStyle: activeAction === "agent"
        ? "bg-primary/20 text-primary border-primary/40"
        : "bg-primary/10 text-primary border-primary/20",
      action: () => {
        setMode("agent");
        toast.success("Agent mode activated");
      },
    },
    {
      icon: FlaskConical,
      label: "Deep search",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      badge: activeAction === "research" ? "ACTIVE" : "RAG",
      badgeStyle: activeAction === "research"
        ? "bg-primary/20 text-primary border-primary/40"
        : "bg-primary/10 text-primary border-primary/20",
      action: () => {
        setMode("research");
        toast.success("Deep search mode activated");
      },
    },
    {
      icon: Palette,
      label: "Create image",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      badge: activeAction === "image" ? "ACTIVE" : null,
      badgeStyle: "bg-primary/20 text-primary border-primary/40",
      action: () => {
        setMode("image");
        toast.success("Create image mode activated");
      },
    },
    {
      icon: BookOpen,
      label: "Study & learn",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      badge: activeAction === "study" ? "ACTIVE" : null,
      badgeStyle: "bg-primary/20 text-primary border-primary/40",
      action: () => {
        setMode("study");
        toast.success("Study & learn mode activated");
      },
    },
  ];

  const moreActions = [
    {
      icon: Globe,
      label: "Web search",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      badge: activeAction === "web" ? "ACTIVE" : null,
      badgeStyle: "bg-primary/20 text-primary border-primary/40",
      action: () => {
        setMode("web");
        toast.success("Web search mode activated");
      },
    },
    {
      icon: Palette,
      label: "Canvas",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      badge: activeAction === "canvas" ? "ACTIVE" : null,
      badgeStyle: "bg-primary/20 text-primary border-primary/40",
      action: () => {
        setMode("canvas");
        toast.success("Canvas mode activated");
      },
    },
    {
      icon: HardDrive,
      label: "Google Drive",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      icon: Cloud,
      label: "OneDrive",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      icon: Users,
      label: "SharePoint",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
  ];

  const handleAction = (action) => {
    action?.();
    setOpen(false);
    setShowMore(false);
  };

  const handleOpenChange = (newOpen) => {
    setOpen(newOpen);
    if (!newOpen) setShowMore(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>

      <PopoverContent
        className="p-1.5 w-[210px] overflow-hidden rounded-2xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white/90 dark:bg-[#0C0C0D]/95 backdrop-blur-2xl shadow-2xl z-50 transition-all"
        align="start"
        side="top"
        sideOffset={10}
      >
        <AnimatePresence mode="wait">
          {!showMore ? (
            <motion.div
              key="main"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col space-y-0.5"
            >
              <SectionLabel>Actions & Modes</SectionLabel>

              <div className="space-y-0.5">
                {mainActions.map((action, i) => (
                  <ActionRow
                    key={i}
                    action={action}
                    index={i}
                    onAction={handleAction}
                  />
                ))}
              </div>

              <Divider />

              {/* More button */}
              <motion.button
                whileHover={{ x: 2, backgroundColor: "rgba(120, 120, 120, 0.08)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowMore(true)}
                className="group flex w-full items-center gap-3 rounded-xl p-2 text-left transition-all duration-150 cursor-pointer border border-transparent hover:border-zinc-200/50 dark:hover:border-zinc-800/50 select-none"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                  <MoreHorizontal className="h-4 w-4" />
                </div>
                <div className="flex flex-1 items-center justify-between">
                  <span className="text-[12.5px] font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors">
                    More integrations
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-transform group-hover:translate-x-0.5" />
                </div>
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="more"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col space-y-0.5"
            >
              {/* Back */}
              <button
                onClick={() => setShowMore(false)}
                className="mb-1 flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all duration-150 active:scale-[0.97] cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Back to actions
              </button>

              <SectionLabel>Web & Cloud Extensions</SectionLabel>

              <div className="space-y-0.5">
                {moreActions.map((action, i) => (
                  <ActionRow
                    key={i}
                    action={action}
                    index={i}
                    onAction={handleAction}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </PopoverContent>

      <input
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
    </Popover>
  );
}
