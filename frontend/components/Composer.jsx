"use client";

import {
  useRef, useState, forwardRef, useImperativeHandle, useEffect, useCallback,
} from "react";
import {
  Loader2, Plus, StopCircle, ChevronDown,
  FlaskConical, Zap, Check, BrainCircuit,
  FileText, FileType, FileSpreadsheet, FileCode, FileJson,
  Archive, File as FileIcon, X, Presentation,
  Bot, Globe, BookOpen, Palette, ArrowUp, Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ComposerActionsPopover from "./ComposerActionsPopover";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";
import { Spinner } from "./ui/spinner";

const ACCEPTED_TYPES = [
  ".pdf", ".docx", ".doc", ".txt", ".rtf", ".odt",
  ".xlsx", ".xls", ".csv", ".pptx", ".ppt",
  ".html", ".htm", ".md", ".mdx", ".rst",
  ".json", ".jsonl", ".xml", ".yaml", ".yml",
  ".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".cpp", ".c", ".cs",
  ".go", ".rs", ".rb", ".php", ".sh", ".sql",
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".tiff", ".svg", ".zip",
];
const MAX_FILE_SIZE_MB = 5;

function getFileInfo(filename) {
  const ext = filename?.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf") return { icon: FileType, color: "text-red-400", bg: "bg-red-500", label: "PDF" };
  if (["docx", "doc", "rtf", "odt"].includes(ext)) return { icon: FileText, color: "text-blue-400", bg: "bg-blue-500", label: ext.toUpperCase() };
  if (["xlsx", "xls", "csv"].includes(ext)) return { icon: FileSpreadsheet, color: "text-green-400", bg: "bg-green-500", label: ext.toUpperCase() };
  if (["pptx", "ppt"].includes(ext)) return { icon: Presentation, color: "text-orange-400", bg: "bg-orange-500", label: ext.toUpperCase() };
  if (["png", "jpg", "jpeg", "gif", "webp", "bmp", "tiff", "svg"].includes(ext)) return { icon: FileIcon, color: "text-purple-400", bg: "bg-purple-500", label: "Image" };
  if (["json", "jsonl", "xml", "yaml", "yml"].includes(ext)) return { icon: FileJson, color: "text-yellow-400", bg: "bg-yellow-500", label: ext.toUpperCase() };
  if (["html", "htm", "md", "mdx", "rst"].includes(ext)) return { icon: FileCode, color: "text-cyan-400", bg: "bg-cyan-500", label: ext.toUpperCase() };
  if (["py", "js", "ts", "jsx", "tsx", "java", "cpp", "c", "cs", "go", "rs", "rb", "php", "sh", "sql"].includes(ext)) return { icon: FileCode, color: "text-indigo-400", bg: "bg-indigo-500", label: ext.toUpperCase() };
  if (ext === "zip") return { icon: Archive, color: "text-zinc-400", bg: "bg-zinc-600", label: "ZIP" };
  return { icon: FileIcon, color: "text-zinc-400", bg: "bg-zinc-600", label: ext.toUpperCase() || "File" };
}

function AttachedFilePill({ file, uploading, onRemove }) {
  const info = getFileInfo(file.name);
  const Icon = info.icon;
  const shortName = file.name.length > 28 ? file.name.slice(0, 26) + "..." : file.name;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.88, y: 4 }} transition={{ duration: 0.18 }}
      className="flex items-center gap-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 shadow-sm max-w-[280px] relative"
    >
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", info.bg)}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="overflow-hidden flex-1">
        <p className="text-[13px] font-medium text-zinc-800 dark:text-zinc-100 truncate leading-snug">{shortName}</p>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
          {uploading ? (
            <span className="flex items-center gap-1"><Loader2 className="h-2.5 w-2.5 animate-spin" /> Indexing...</span>
          ) : info.label}
        </p>
      </div>
      {!uploading && (
        <button onClick={onRemove}
          className="shrink-0 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-300/80 dark:bg-zinc-700 hover:bg-zinc-400 dark:hover:bg-zinc-600 transition-colors"
          title="Remove attachment">
          <X className="h-2.5 w-2.5 text-zinc-700 dark:text-zinc-300" />
        </button>
      )}
    </motion.div>
  );
}



function getActionLabel(action) {
  const map = { research: "Deep search", agent: "Agent", image: "Image", study: "Study", web: "Web search", canvas: "Canvas", calendar: "Calendar" };
  return map[action] || action;
}

function getActionIcon(action) {
  if (action === "research") return <FlaskConical className="h-3.5 w-3.5" />;
  if (action === "agent") return <Bot className="h-3.5 w-3.5" />;
  if (action === "image") return <Palette className="h-3.5 w-3.5" />;
  if (action === "study") return <BookOpen className="h-3.5 w-3.5" />;
  if (action === "web") return <Globe className="h-3.5 w-3.5" />;
  if (action === "canvas") return <Palette className="h-3.5 w-3.5" />;
  if (action === "calendar") return <Calendar className="h-3.5 w-3.5" />;
  return null;
}

const Composer = forwardRef(function Composer({ onSend, busy, defaultMode = "research", selectedBot = "Fast" }, ref) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [mode, setMode] = useState(defaultMode);
  const [activeAction, setActiveAction] = useState(null);
  const [attachedFile, setAttachedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!inputRef.current) return;
    const ta = inputRef.current;
    const lineHeight = 24;
    ta.style.height = "auto";
    const lines = Math.max(1, Math.ceil(ta.scrollHeight / lineHeight));
    if (lines <= 12) {
      ta.style.height = `${Math.max(24, ta.scrollHeight)}px`;
      ta.style.overflowY = "hidden";
    } else {
      ta.style.height = `${12 * lineHeight}px`;
      ta.style.overflowY = "auto";
    }
  }, [value]);

  useImperativeHandle(ref, () => ({
    insertTemplate: (templateContent) => {
      setValue((prev) => {
        const next = prev ? `${prev}\n\n${templateContent}` : templateContent;
        setTimeout(() => { inputRef.current?.focus(); inputRef.current?.setSelectionRange(next.length, next.length); }, 0);
        return next;
      });
    },
    setValue: (text) => { setValue(text); setTimeout(() => inputRef.current?.focus(), 0); },
    focus: () => inputRef.current?.focus(),
    getMode: () => mode,
  }), [mode]);

  const uploadFileToRag = useCallback(async (file) => {
    const ext = "." + (file.name.split(".").pop()?.toLowerCase() || "");
    if (!ACCEPTED_TYPES.includes(ext)) { toast.error(`Unsupported file type "${ext}".`); return; }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) { toast.error(`File too large. Max ${MAX_FILE_SIZE_MB} MB.`); return; }
    setAttachedFile({ name: file.name, ext: ext.slice(1) });
    setUploading(true);
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const apiUrl = API_BASE_URL;
      const res = await fetch(`${apiUrl}/documents/upload`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");
      toast.success(`"${file.name}" indexed (${data.chunks} chunks)`);
    } catch (err) {
      toast.error(err.message || "Upload failed");
      setAttachedFile(null);
    } finally {
      setUploading(false);
    }
  }, []);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) uploadFileToRag(file);
    e.target.value = "";
  }, [uploadFileToRag]);

  const hasContent = value.trim().length > 0 || !!attachedFile;

  const handleSend = useCallback(async () => {
    if (busy) {
      await onSend?.("", mode, null);
      return;
    }
    if (!hasContent || uploading) return;
    const text = value.trim();
    const currentMode = mode;
    const fileRef = attachedFile ? { name: attachedFile.name } : null;
    setValue("");
    setAttachedFile(null);
    setSending(true);
    try { await onSend?.(text, currentMode, fileRef); } finally { setSending(false); }
  }, [busy, hasContent, uploading, value, mode, attachedFile, onSend]);

  return (
    <div className="px-3 pb-2 pt-1">
      {/* Active action badge above composer */}
      <AnimatePresence>
        {activeAction && (
          <div className="flex justify-center mb-1.5">
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }} transition={{ duration: 0.15 }}
            >
              <Badge variant="secondary"
                className="flex items-center gap-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-800/80 px-2.5 py-1 text-[11px] font-medium text-zinc-900 dark:text-zinc-50 shadow-none cursor-default">
                <span className="text-zinc-500">{getActionIcon(activeAction)}</span>
                <span className="truncate capitalize font-semibold">{getActionLabel(activeAction)}</span>
                <button type="button"
                  onClick={() => { setActiveAction(null); setMode(defaultMode); }}
                  className="ml-1 shrink-0 flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
                  title="Clear action">
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className={cn(
        "mx-auto max-w-3xl rounded-2xl border bg-white dark:bg-[#0B0B0C] border-zinc-200 dark:border-zinc-800/80 shadow-sm transition-all duration-200",
        isFocused && "border-zinc-300 dark:border-zinc-700"
      )}>
        {/* Attached file row (only visible when file attached) */}
        <AnimatePresence>
          {attachedFile && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="flex items-center px-3 pt-2.5 pb-0"
            >
              <AttachedFilePill file={attachedFile} uploading={uploading} onRemove={() => setAttachedFile(null)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Textarea */}
        <div className="px-4 pt-2.5 pb-1">
          <textarea
            ref={inputRef} value={value} onChange={(e) => setValue(e.target.value)}
            onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
            placeholder={`Message ${selectedBot || "TriVisionX"} ...`} rows={1}
            className="w-full resize-none bg-transparent text-[14.5px] leading-relaxed text-zinc-800 dark:text-zinc-100 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600 scrollbar-thin"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between px-2.5 pb-2 pt-1 gap-2">
          {/* Left: + (actions) */}
          <div className="flex items-center gap-1.5">
            <Tooltip>
              <ComposerActionsPopover
                onFileSelect={uploadFileToRag} mode={mode}
                setMode={(m) => { setMode(m); setActiveAction(m); }}
                activeAction={activeAction}
              >
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="group h-7 w-7 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 shrink-0 cursor-pointer">
                    <Plus className="h-4 w-4 transition-transform duration-300 ease-in-out group-data-[state=open]:rotate-90" />
                  </Button>
                </TooltipTrigger>
              </ComposerActionsPopover>
              <TooltipContent side="top">Actions Menu</TooltipContent>
            </Tooltip>
          </div>

          {/* Right: Agent/Chat segment + Mic + Send */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-0.5 bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-200/50 dark:border-zinc-800/80">
              <button type="button"
                onClick={() => { setActiveAction("agent"); setMode("agent"); }}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer select-none leading-none",
                  activeAction === "agent"
                    ? "bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 shadow-sm border border-zinc-200 dark:border-zinc-800"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                )}>Agent</button>
              <button type="button"
                onClick={() => { setActiveAction(null); setMode(defaultMode); }}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer select-none leading-none",
                  !activeAction || activeAction !== "agent"
                    ? "bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 shadow-sm border border-zinc-200 dark:border-zinc-800"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                )}>Chat</button>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative flex items-center justify-center">
                  {isListening && (
                    <>
                      <span className="absolute inset-0 rounded-lg animate-ping bg-red-500/40" />
                      <span className="absolute -inset-1 rounded-lg animate-pulse bg-red-500/20" />
                    </>
                  )}
                  <Button variant="ghost" size="icon"
                    onClick={() => setIsListening(!isListening)}
                    className={cn(
                      "relative h-7 w-7 rounded-lg transition-all duration-300",
                      isListening ? "bg-red-500 text-white hover:bg-red-600 shadow-md" : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    )}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("h-4 w-4", isListening && "animate-pulse")}>
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" x2="12" y1="19" y2="22" />
                    </svg>
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">Voice input</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={handleSend} disabled={(!hasContent && !busy) || uploading} size="icon"
                  className={cn(
                    "h-7 w-7 rounded-lg transition-all duration-200",
                    hasContent || busy
                      ? "bg-zinc-950 text-white hover:bg-zinc-900 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 shadow-sm cursor-pointer"
                      : "bg-muted text-muted-foreground cursor-not-allowed opacity-50",
                  )}>
                  {sending || busy ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <ArrowUp className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">{busy ? "Stop" : "Send message"}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      <input type="file" accept={ACCEPTED_TYPES.join(",")} className="hidden" ref={fileInputRef} onChange={handleFileChange} />
    </div>
  );
});

export default Composer;