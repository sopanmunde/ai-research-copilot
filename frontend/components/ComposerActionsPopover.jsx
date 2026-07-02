"use client";
import { useState, useRef } from "react";
import {
  Paperclip,
  Bot,
  Search,
  Palette,
  BookOpen,
  MoreHorizontal,
  Globe,
  ChevronLeft,
  Zap,
  ChevronRight,
  FlaskConical,
  HardDrive,
  Cloud,
  Users
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import RagPipelineVisualizer from "./RagPipelineVisualizer";

function ActionIcon({ icon: Icon, customIcon }) {
  if (customIcon) return customIcon;
  return <Icon className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400 group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400 transition-colors" />;
}

function ActionRow({ action, index, onAction }) {
  const Icon = action.icon;
  return (
    <motion.button
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.15 }}
      onClick={() => onAction(action.action)}
      className="group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-[12px] text-left text-zinc-700 dark:text-zinc-300 transition-all duration-200 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 active:scale-[0.98]"
    >
      <ActionIcon icon={Icon} customIcon={action.customIcon} />
      <span className="font-medium flex-1 leading-none transition-colors">{action.label}</span>
      {action.badge && (
        <Badge
          variant="secondary"
          className={cn(
            "rounded-sm px-1 py-0 text-[9px] font-bold shadow-none hover:bg-transparent",
            action.badgeStyle
          )}
        >
          {action.badge}
        </Badge>
      )}
    </motion.button>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="px-3 pt-3 pb-1.5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        {children}
      </p>
    </div>
  );
}

function Divider() {
  return <div className="mx-2.5 my-1.5 h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-700 to-transparent opacity-50" />;
}

export default function ComposerActionsPopover({ children, onFileSelect, activeAction = null, setMode = () => {} }) {
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
      color: "text-blue-500 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-500/10",
      action: () => { setOpen(false); fileInputRef.current?.click(); },
    },
    {
      icon: Bot,
      label: "Agent mode",
      color: "text-fuchsia-500 dark:text-fuchsia-400",
      bg: "bg-fuchsia-50 dark:bg-fuchsia-500/10",
      badge: activeAction === "agent" ? "ACTIVE" : "NEW",
      badgeStyle: activeAction === "agent"
        ? "bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-500/20 dark:text-fuchsia-400 border-fuchsia-200 dark:border-fuchsia-700/50"
        : "bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-500/20 dark:text-fuchsia-400",
      action: () => {
        setMode("agent");
        toast.success("Agent mode activated");
      },
    },
    {
      icon: FlaskConical,
      label: "Deep search",
      color: "text-emerald-500 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      badge: activeAction === "research" ? "ACTIVE" : null,
      badgeStyle: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700/50",
      action: () => {
        setMode("research");
        toast.success("Deep search mode activated");
      },
    },
    {
      icon: Palette,
      label: "Create image",
      color: "text-orange-500 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-500/10",
      badge: activeAction === "image" ? "ACTIVE" : null,
      badgeStyle: "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 border-orange-200 dark:border-orange-700/50",
      action: () => {
        setMode("image");
        toast.success("Create image mode activated");
      },
    },
    {
      icon: BookOpen,
      label: "Study and learn",
      color: "text-pink-500 dark:text-pink-400",
      bg: "bg-pink-50 dark:bg-pink-500/10",
      badge: activeAction === "study" ? "ACTIVE" : null,
      badgeStyle: "bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400 border-pink-200 dark:border-pink-700/50",
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
      badge: activeAction === "web" ? "ACTIVE" : null,
      badgeStyle: "bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-500/20 dark:text-fuchsia-400 border-fuchsia-200 dark:border-fuchsia-700/50",
      action: () => {
        setMode("web");
        toast.success("Web search mode activated");
      },
    },
    {
      icon: Palette,
      label: "Canvas",
      badge: activeAction === "canvas" ? "ACTIVE" : null,
      badgeStyle: "bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-500/20 dark:text-fuchsia-400 border-fuchsia-200 dark:border-fuchsia-700/50",
      action: () => {
        setMode("canvas");
        toast.success("Canvas mode activated");
      },
    },
    {
      icon: HardDrive,
      label: "Google Drive",
    },
    {
      icon: Cloud,
      label: "OneDrive",
    },
    {
      icon: Users,
      label: "SharePoint",
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
        className="p-1.5 w-auto min-w-[160px] overflow-hidden rounded-xl border border-zinc-200 bg-white/70 backdrop-blur-xl dark:border-zinc-800 dark:bg-[#0B0B0C] shadow-[0_8px_30px_rgba(0,0,0,0.12),_inset_1px_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5),_inset_1px_1px_1px_rgba(255,255,255,0.05)]"
        align="start"
        side="top"
        sideOffset={12}
      >
        <AnimatePresence mode="wait">
          {!showMore ? (
            <motion.div
              key="main"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col space-y-0.5"
            >
              <SectionLabel>Actions</SectionLabel>

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
                whileHover={{ x: 2 }}
                onClick={() => setShowMore(true)}
                className="group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-[12px] text-left text-zinc-700 dark:text-zinc-300 transition-all duration-200 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 active:scale-[0.98]"
              >
                <MoreHorizontal className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400 group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400 transition-colors" />
                <span className="font-medium flex-1 transition-colors">More</span>
                <ChevronRight className="h-3 w-3 text-zinc-400 group-hover:text-zinc-500 dark:group-hover:text-zinc-300 transition-colors" />
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="more"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col space-y-0.5"
            >
              {/* Back */}
              <button
                onClick={() => setShowMore(false)}
                className="mb-1 flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all duration-200 active:scale-[0.97]"
              >
                <ChevronLeft className="h-3 w-3" />
                Back
              </button>

              <SectionLabel>Integrations</SectionLabel>

              <div className="space-y-px">
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

      {/* No upload progress modal here â€” handled in Composer */}
    </Popover>
  );
}
