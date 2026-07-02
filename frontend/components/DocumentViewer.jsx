"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  FileCode,
  FileImage,
  FileVideo,
  FileAudio,
  FileJson,
  FileSpreadsheet,
  File as FileIcon,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { Skeleton } from "./ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";

const EXT_MAP = {
  image: ["png", "jpg", "jpeg", "gif", "webp", "bmp", "tiff", "svg", "ico", "avif"],
  pdf: ["pdf"],
  markdown: ["md", "mdx", "rst"],
  text: [
    "txt", "log", "ini", "cfg", "conf", "env", "gitignore", "htaccess",
    "py", "js", "ts", "jsx", "tsx", "java", "cpp", "c", "cs", "go", "rs",
    "rb", "php", "sh", "bash", "zsh", "sql", "r", "swift", "kt", "dart",
    "scala", "lua", "pl", "asm", "html", "htm", "css", "scss", "sass", "less",
    "xml", "yaml", "yml", "toml",
  ],
  json: ["json", "jsonl"],
  csv: ["csv", "tsv"],
  video: ["mp4", "webm", "ogg", "mov", "avi", "mkv"],
  audio: ["mp3", "wav", "ogg", "aac", "flac", "m4a"],
};

function getFileType(filename) {
  const ext = (filename?.split(".").pop() || "").toLowerCase();
  for (const [type, exts] of Object.entries(EXT_MAP)) {
    if (exts.includes(ext)) return type;
  }
  return "unknown";
}

function getFileIcon(type) {
  switch (type) {
    case "image":   return { Icon: FileImage,      color: "text-purple-500", bg: "bg-purple-500/10 border-purple-500/20" };
    case "pdf":     return { Icon: FileText,       color: "text-red-500",    bg: "bg-red-500/10 border-red-500/20" };
    case "markdown":return { Icon: FileText,       color: "text-blue-500",   bg: "bg-blue-500/10 border-blue-500/20" };
    case "json":    return { Icon: FileJson,       color: "text-yellow-500", bg: "bg-yellow-500/10 border-yellow-500/20" };
    case "csv":     return { Icon: FileSpreadsheet,color: "text-green-500",  bg: "bg-green-500/10 border-green-500/20" };
    case "text":    return { Icon: FileCode,       color: "text-indigo-500", bg: "bg-indigo-500/10 border-indigo-500/20" };
    case "video":   return { Icon: FileVideo,      color: "text-pink-500",   bg: "bg-pink-500/10 border-pink-500/20" };
    case "audio":   return { Icon: FileAudio,      color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/20" };
    default:        return { Icon: FileIcon,       color: "text-zinc-500",   bg: "bg-zinc-500/10 border-zinc-500/20" };
  }
}

function formatBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function parseCsv(text) {
  const lines = text.trim().split("\n");
  if (!lines.length) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map(l => l.split(",").map(c => c.trim().replace(/^"|"$/g, "")));
  return { headers, rows };
}


function ImageViewer({ src, name }) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.max(0.25, z - 0.25))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom out</TooltipContent>
        </Tooltip>
        <span className="text-xs font-semibold text-zinc-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.min(5, z + 0.25))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom in</TooltipContent>
        </Tooltip>
        <Separator orientation="vertical" className="h-4 mx-1" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRotation(r => (r + 90) % 360)}>
              <RotateCw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Rotate</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setZoom(1); setRotation(0); }}>
              <Minimize2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reset</TooltipContent>
        </Tooltip>
      </div>
      {/* Canvas */}
      <ScrollArea className="flex-1">
        <div className="flex items-center justify-center min-h-full p-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={name}
            style={{ transform: `scale(${zoom}) rotate(${rotation}deg)`, transformOrigin: "center" }}
            className="max-w-full rounded-lg shadow-md transition-transform duration-200 object-contain"
          />
        </div>
      </ScrollArea>
    </div>
  );
}

function PdfViewer({ src, name }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0 text-xs text-zinc-500">
        <FileText className="h-3.5 w-3.5 text-red-500" />
        <span>PDF Document</span>
        <div className="ml-auto flex gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <a href={src} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </TooltipTrigger>
            <TooltipContent>Open in new tab</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <iframe
        src={src + "#toolbar=1&navpanes=1"}
        className="flex-1 w-full border-0"
        title={name}
      />
    </div>
  );
}

function TextViewer({ content, type }) {
  const [copied, setCopied] = useState(false);
  const isMarkdown = type === "markdown";
  const [view, setView] = useState(isMarkdown ? "rendered" : "raw");

  async function handleCopy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
        {isMarkdown ? (
          <Tabs value={view} onValueChange={setView} className="w-full">
            <div className="flex items-center justify-between">
              <TabsList className="h-7 p-0.5">
                <TabsTrigger value="rendered" className="h-6 px-2.5 text-[11px] gap-1">
                  <Eye className="h-3 w-3" /> Preview
                </TabsTrigger>
                <TabsTrigger value="raw" className="h-6 px-2.5 text-[11px] gap-1">
                  <Code2 className="h-3 w-3" /> Raw
                </TabsTrigger>
              </TabsList>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy content</TooltipContent>
              </Tooltip>
            </div>
          </Tabs>
        ) : (
          <>
            <span className="text-xs font-semibold text-zinc-500 flex-1">Source</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy content</TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
      <ScrollArea className="flex-1">
        {isMarkdown && view === "rendered" ? (
          <div className="px-6 py-6 prose prose-sm dark:prose-invert max-w-none break-words prose-p:my-2.5 prose-p:leading-relaxed prose-headings:font-semibold prose-headings:tracking-tight prose-li:my-1 prose-code:rounded-md prose-code:bg-zinc-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-zinc-800 prose-code:font-mono prose-code:text-[12px] dark:prose-code:bg-zinc-800 dark:prose-code:text-zinc-200 prose-table:text-[13px]">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <pre className="p-4 text-[13px] font-mono leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap break-all">
            <code>{content}</code>
          </pre>
        )}
      </ScrollArea>
    </div>
  );
}

function CsvViewer({ content }) {
  const { headers, rows } = parseCsv(content);
  return (
    <ScrollArea className="flex-1">
      <div className="p-4">
        <div className="rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/50">
                {headers.map((h, i) => (
                  <th key={i} className="px-3 py-2 text-left font-semibold text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className="border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-1.5 text-zinc-700 dark:text-zinc-400 max-w-[200px] truncate">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div className="py-12 text-center text-sm text-zinc-500">No data rows</div>
          )}
        </div>
        <p className="mt-2 text-xs text-zinc-400">{rows.length} rows · {headers.length} columns</p>
      </div>
    </ScrollArea>
  );
}

function VideoViewer({ src, name }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0 text-xs text-zinc-500">
        <FileVideo className="h-3.5 w-3.5 text-pink-500" />
        <span>Video file</span>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 bg-zinc-950">
        <video controls className="max-h-full max-w-full rounded-xl shadow-xl" src={src}>
          Your browser does not support video playback.
        </video>
      </div>
    </div>
  );
}

function AudioViewer({ src, name }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0 text-xs text-zinc-500">
        <FileAudio className="h-3.5 w-3.5 text-orange-500" />
        <span>Audio file</span>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-4">
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-orange-500/20 blur-2xl animate-pulse" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center shadow-xl">
                <FileAudio className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          <p className="text-center text-sm font-semibold text-zinc-700 dark:text-zinc-300 truncate">{name}</p>
          <audio controls className="w-full rounded-lg">
            <source src={src} />
            Your browser does not support audio playback.
          </audio>
        </div>
      </div>
    </div>
  );
}

function UnsupportedViewer({ name, src, size }) {
  const ext = (name?.split(".").pop() || "").toUpperCase();
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
      <div className="w-20 h-20 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
        <FileIcon className="h-9 w-9 text-zinc-400" />
      </div>
      <div className="text-center space-y-1">
        <p className="font-semibold text-zinc-800 dark:text-zinc-200">{name}</p>
        <p className="text-sm text-zinc-500">Preview not available for <Badge variant="secondary" className="text-[10px]">.{ext}</Badge> files</p>
        {size && <p className="text-xs text-zinc-400">{formatBytes(size)}</p>}
      </div>
      {src && (
        <a href={src} download={name}>
          <Button variant="outline" className="gap-2 rounded-xl">
            <Download className="h-4 w-4" />
            Download file
          </Button>
        </a>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex-1 p-6 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-32 w-full mt-4" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
    </div>
  );
}

export default function DocumentViewer({ open, onClose, file }) {
  const [textContent, setTextContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const type = file ? getFileType(file.name) : "unknown";
  const { Icon, color, bg } = getFileIcon(type);
  const ext = (file?.name?.split(".").pop() || "").toUpperCase();

  const needsTextFetch = file && ["text", "markdown", "json", "csv"].includes(type) && !file.content && file.url;

  useEffect(() => {
    if (!open || !needsTextFetch) return;
    if (file?.content) { setTextContent(file.content); return; }

    setLoading(true);
    setError(null);
    fetch(file.url)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then(text => { setTextContent(text); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [open, file?.url, needsTextFetch]);

  useEffect(() => {
    setTextContent(null);
    setError(null);
  }, [file?.name]);

  const resolvedContent = file?.content || textContent;

  function renderViewer() {
    if (!file) return null;

    if (loading) return <LoadingSkeleton />;
    if (error) return (
      <div className="flex-1 flex items-center justify-center flex-col gap-3 p-8 text-center">
        <div className="text-4xl">⚠️</div>
        <p className="font-semibold text-zinc-700 dark:text-zinc-300">Failed to load file</p>
        <p className="text-sm text-zinc-500">{error}</p>
        {file.url && (
          <a href={file.url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="gap-2 rounded-xl mt-2">
              <ExternalLink className="h-4 w-4" /> Open directly
            </Button>
          </a>
        )}
      </div>
    );

    switch (type) {
      case "image":   return <ImageViewer src={file.url} name={file.name} />;
      case "pdf":     return <PdfViewer src={file.url} name={file.name} />;
      case "video":   return <VideoViewer src={file.url} name={file.name} />;
      case "audio":   return <AudioViewer src={file.url} name={file.name} />;
      case "csv":     return resolvedContent ? <CsvViewer content={resolvedContent} /> : <LoadingSkeleton />;
      case "markdown":
      case "json":
      case "text":    return resolvedContent ? <TextViewer content={resolvedContent} type={type} /> : <LoadingSkeleton />;
      default:        return <UnsupportedViewer name={file.name} src={file.url} size={file.size} />;
    }
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose?.()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl lg:max-w-4xl p-0 gap-0 flex flex-col overflow-hidden border-l border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950"
      >
        {/* Header */}
        <SheetHeader className="flex flex-row items-center gap-3 px-4 py-3 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/50 backdrop-blur-sm shrink-0 space-y-0">
          {/* File type icon */}
          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border", bg)}>
            <Icon className={cn("h-4.5 w-4.5", color)} />
          </div>

          {/* File info */}
          <div className="flex-1 min-w-0">
            <SheetTitle className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100 truncate leading-tight">
              {file?.name || "Document"}
            </SheetTitle>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0.5 font-bold tracking-wider">
                {ext || "FILE"}
              </Badge>
              {file?.size && (
                <span className="text-[11px] text-zinc-400">{formatBytes(file.size)}</span>
              )}
              {file?.uploadedAt && (
                <span className="text-[11px] text-zinc-400">
                  · {new Date(file.uploadedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {file?.url && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a href={file.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>Open in new tab</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a href={file.url} download={file.name}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>Download</TooltipContent>
                </Tooltip>
              </>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Close</TooltipContent>
            </Tooltip>
          </div>
        </SheetHeader>

        {/* Content area */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <AnimatePresence mode="wait">
            {open && file && (
              <motion.div
                key={file.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="flex-1 flex flex-col min-h-0 overflow-hidden"
              >
                {renderViewer()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}
