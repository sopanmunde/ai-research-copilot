"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  Search,
  Trash2,
  Database,
  Loader2,
  UploadCloud,
  File as FileIcon,
  Image as ImageIcon,
  FileCode,
  FileSpreadsheet,
  Presentation,
  FileJson,
  FileType,
  Archive,
  CheckCircle2,
  LayoutGrid,
  List,
  Eye,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";
import { createPortal } from "react-dom";
import RagPipelineVisualizer from "./RagPipelineVisualizer";
import ModernConfirmDialog from "./ModernConfirmDialog";

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

const MAX_FILE_SIZE_MB = 100;

function RealisticDocIcon({ filename, className }) {
  const ext = filename?.split(".").pop()?.toLowerCase() || ""

  let theme = {
    badge: "PDF",
    bg: "from-red-500/20 via-red-500/10 to-rose-600/20",
    border: "border-red-500/40",
    headerBg: "bg-red-600 text-white",
    linesColor: "bg-red-400/50",
    IconComponent: FileText,
    accent: "text-red-400",
  }

  if (["pdf"].includes(ext)) {
    theme = {
      badge: "PDF",
      bg: "from-red-500/20 via-red-500/10 to-rose-600/20",
      border: "border-red-500/40",
      headerBg: "bg-red-600 text-white",
      linesColor: "bg-red-400/50",
      IconComponent: FileType,
      accent: "text-red-400",
    }
  } else if (["doc", "docx", "rtf", "odt"].includes(ext)) {
    theme = {
      badge: "DOCX",
      bg: "from-blue-500/20 via-blue-500/10 to-indigo-600/20",
      border: "border-blue-500/40",
      headerBg: "bg-blue-600 text-white",
      linesColor: "bg-blue-400/50",
      IconComponent: FileText,
      accent: "text-blue-400",
    }
  } else if (["xls", "xlsx", "csv"].includes(ext)) {
    theme = {
      badge: "XLS",
      bg: "from-emerald-500/20 via-emerald-500/10 to-teal-600/20",
      border: "border-emerald-500/40",
      headerBg: "bg-emerald-600 text-white",
      linesColor: "bg-emerald-400/50",
      IconComponent: FileSpreadsheet,
      accent: "text-emerald-400",
    }
  } else if (["ppt", "pptx"].includes(ext)) {
    theme = {
      badge: "PPT",
      bg: "from-orange-500/20 via-orange-500/10 to-amber-600/20",
      border: "border-orange-500/40",
      headerBg: "bg-orange-600 text-white",
      linesColor: "bg-orange-400/50",
      IconComponent: Presentation,
      accent: "text-orange-400",
    }
  } else if (["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(ext)) {
    theme = {
      badge: ext.toUpperCase().slice(0, 4),
      bg: "from-purple-500/20 via-purple-500/10 to-pink-600/20",
      border: "border-purple-500/40",
      headerBg: "bg-purple-600 text-white",
      linesColor: "bg-purple-400/50",
      IconComponent: ImageIcon,
      accent: "text-purple-400",
    }
  } else if (["json", "jsonl"].includes(ext)) {
    theme = {
      badge: "JSON",
      bg: "from-amber-500/20 via-amber-500/10 to-yellow-600/20",
      border: "border-amber-500/40",
      headerBg: "bg-amber-600 text-white",
      linesColor: "bg-amber-400/50",
      IconComponent: FileJson,
      accent: "text-amber-400",
    }
  } else if (["py", "js", "ts", "jsx", "tsx", "java", "cpp", "c", "cs", "go", "rs", "html", "css", "sh", "sql"].includes(ext)) {
    theme = {
      badge: ext.toUpperCase().slice(0, 4),
      bg: "from-cyan-500/20 via-cyan-500/10 to-blue-600/20",
      border: "border-cyan-500/40",
      headerBg: "bg-cyan-600 text-white",
      linesColor: "bg-cyan-400/50",
      IconComponent: FileCode,
      accent: "text-cyan-400",
    }
  } else if (["zip", "rar", "7z"].includes(ext)) {
    theme = {
      badge: "ZIP",
      bg: "from-amber-600/20 via-amber-600/10 to-yellow-700/20",
      border: "border-amber-600/40",
      headerBg: "bg-amber-700 text-white",
      linesColor: "bg-amber-500/50",
      IconComponent: Archive,
      accent: "text-amber-500",
    }
  } else {
    theme = {
      badge: ext.toUpperCase().slice(0, 4) || "TXT",
      bg: "from-zinc-500/20 via-zinc-500/10 to-slate-600/20",
      border: "border-zinc-500/40",
      headerBg: "bg-zinc-600 text-white",
      linesColor: "bg-zinc-400/50",
      IconComponent: FileIcon,
      accent: "text-zinc-400",
    }
  }

  return (
    <div className={cn("relative shrink-0 select-none w-7 h-8.5 text-[6.5px] group/docicon", className)}>
      <div className={cn(
        "relative w-full h-full rounded bg-gradient-to-b border shadow-xs flex flex-col overflow-hidden transition-all duration-300 group-hover/docicon:scale-105",
        theme.bg,
        theme.border
      )}>
        {/* Folded Corner */}
        <div className="absolute top-0 right-0 w-2 h-2 bg-zinc-700/80 rounded-bl-sm border-l border-b border-white/20 z-10" />

        {/* Ribbon Header Badge */}
        <div className={cn("px-0.5 py-0.2 font-bold tracking-tight flex items-center justify-between shadow-xs leading-none", theme.headerBg)}>
          <span>{theme.badge}</span>
        </div>

        {/* Document Body */}
        <div className="flex-1 p-1 flex flex-col justify-between items-center opacity-90">
          <theme.IconComponent className={cn("w-3.5 h-3.5 mt-0.5", theme.accent)} />
          <div className="w-full space-y-0.5 mb-0.5">
            <div className={cn("h-0.5 w-full rounded-full", theme.linesColor)} />
            <div className={cn("h-0.5 w-3/4 rounded-full", theme.linesColor)} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DocumentLibrary({ open, onClose }) {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [uploadingStage, setUploadingStage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadChunks, setUploadChunks] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = React.useRef(null);

  const [mounted, setMounted] = useState(false);
  const [deleteDocConfirmOpen, setDeleteDocConfirmOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);
  const [uploadFileName, setUploadFileName] = useState("");
  const [viewMode, setViewMode] = useState("grid");

  useEffect(() => {
    setMounted(true);
    if (open) {
      fetchDocuments();
    }
  }, [open]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const apiUrl = API_BASE_URL;
      const res = await fetch(`${apiUrl}/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerDeleteConfirm = (doc) => {
    setDocToDelete(doc);
    setDeleteDocConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!docToDelete) return;
    const doc = docToDelete;
    setDeleteDocConfirmOpen(false);
    setDocToDelete(null);

    const token = localStorage.getItem("token");
    try {
      const apiUrl = API_BASE_URL;
      const res = await fetch(`${apiUrl}/documents/${doc.id}?filename=${encodeURIComponent(doc.filename)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
        toast.success("Document deleted");
      } else {
        toast.error("Failed to delete document");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting document");
    }
  };

  const handleUpload = useCallback(async (file) => {
    if (!file) return;

    const ext = "." + (file.name.split(".").pop()?.toLowerCase() || "");
    if (!ACCEPTED_TYPES.includes(ext)) {
      toast.error(`Unsupported file type "${ext}". Please check the allowed formats.`);
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }

    setUploadFileName(file.name);
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);

    setUploadingStage("parsing");
    setUploadProgress(10);
    setUploadChunks(0);

    try {
      const apiUrl = API_BASE_URL;
      const res = await fetch(`${apiUrl}/documents/upload/stream`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.stage) {
                  setUploadingStage(data.stage);
                  setUploadProgress(data.progress || 0);
                  if (data.chunks) setUploadChunks(data.chunks);
                }
                if (data.error) throw new Error(data.error);

                if (data.stage === "done") {
                  setTimeout(() => {
                    setUploadingStage(null);
                    fetchDocuments();
                    toast.success("Document indexed successfully.");
                  }, 2000);
                }
              } catch (e) {
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload document");
      setUploadingStage(null);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleInputChange = (event) => {
    handleUpload(event.target.files?.[0]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);

  const filteredDocs = documents.filter((d) =>
    d.filename.toLowerCase().includes(query.toLowerCase())
  );

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex justify-end">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          />

          {/* Sheet Content */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            className="fixed inset-y-0 right-0 z-50 h-full w-full sm:w-[400px] sm:max-w-[400px] gap-4 p-4 sm:p-6 transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right flex flex-col border-l-[2px] border-border bg-card/70 backdrop-blur-xl shadow-[-4px_0_24px_rgba(0,0,0,0.12),_inset_1px_0_2px_rgba(0,0,0,0.05),_inset_-1px_0_1px_rgba(255,255,255,0.8)]"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-lg opacity-70 transition-opacity hover:opacity-100 hover:bg-accent p-1.5 focus:outline-none"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>

            {/* Header */}
            <div className="flex flex-col space-y-1 text-left">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Document Library
              </h2>
              <p className="text-xs text-muted-foreground">
                Upload any file — PDFs, images, spreadsheets, code, and more.
              </p>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto py-4">
              {uploadingStage && (
                <div className="mb-6">
                  <RagPipelineVisualizer
                    currentStage={uploadingStage}
                    progress={uploadProgress}
                    chunks={uploadChunks}
                  />
                </div>
              )}

              {/* Actions & View Mode Toggle */}
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex h-9 w-full rounded-xl border border-border bg-card/50 px-3 py-1 pl-8 text-[13px] font-medium text-foreground shadow-sm transition-all placeholder:text-muted-foreground focus-visible:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 disabled:opacity-50"
                  />
                </div>

                <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-xl border border-border/60 h-9">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "h-7.5 w-7.5 rounded-lg flex items-center justify-center transition-all cursor-pointer",
                      viewMode === "grid" ? "bg-background shadow-xs text-foreground font-bold" : "text-muted-foreground hover:text-foreground"
                    )}
                    title="Card View"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "h-7.5 w-7.5 rounded-lg flex items-center justify-center transition-all cursor-pointer",
                      viewMode === "list" ? "bg-background shadow-xs text-foreground font-bold" : "text-muted-foreground hover:text-foreground"
                    )}
                    title="List View"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!!uploadingStage}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-[13px] font-semibold transition-all disabled:opacity-50 bg-primary text-white shadow-sm hover:bg-primary/90 h-9 px-3.5 py-2 gap-1.5 cursor-pointer"
                >
                  <UploadCloud className="h-4 w-4" />
                  Upload
                </button>
                <input
                  type="file"
                  accept={ACCEPTED_TYPES.join(",")}
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleInputChange}
                />
              </div>

              {/* Drag & Drop Zone */}
              <motion.div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => !uploadingStage && fileInputRef.current?.click()}
                animate={{ borderColor: isDragOver ? "hsl(var(--primary)/0.6)" : "hsl(var(--border))", backgroundColor: isDragOver ? "hsl(var(--primary)/0.06)" : "transparent" }}
                className={cn(
                  "mb-5 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-center transition-colors cursor-pointer select-none",
                  uploadingStage && "pointer-events-none opacity-50"
                )}
              >
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-full border transition-colors", isDragOver ? "border-primary/50 bg-primary/10" : "border-border bg-muted")}>
                  <UploadCloud className={cn("h-4 w-4 transition-colors", isDragOver ? "text-primary" : "text-muted-foreground")} />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{isDragOver ? "Drop to upload" : "Drag & drop or click to browse"}</p>
                  <p className="text-[10.5px] text-muted-foreground mt-0.5">PDF, DOCX, XLSX, PPTX, Images, Code, JSON, CSV & more · up to {MAX_FILE_SIZE_MB} MB</p>
                </div>
              </motion.div>

              {/* Document Display (Cards or List) */}
              {isLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-8 text-center animate-in fade-in-50 bg-muted/20">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted shadow-inner">
                    <UploadCloud className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-[13px] font-semibold text-foreground">No files uploaded yet</h3>
                  <p className="mt-1 text-[11px] text-muted-foreground max-w-[240px]">
                    Upload any file type — documents, images, spreadsheets, code — to use them in Deep Research mode.
                  </p>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-2 gap-3">
                  {filteredDocs.map((doc) => {
                    const ext = doc.filename.split(".").pop()?.toLowerCase() || "";
                    const formattedSize = doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : "0 KB";
                    return (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="group relative flex flex-col justify-between p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-950/85 hover:border-white/50 hover:shadow-[0_0_20px_rgba(255,255,255,0.12)] transition-all duration-300 shadow-sm overflow-hidden select-none"
                      >
                        {/* Glowing White Top Shine Beam */}
                        <div className="absolute inset-x-0 -top-px h-[1.5px] bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <RealisticDocIcon filename={doc.filename} />
                            <div className="overflow-hidden">
                              <h4 className="truncate text-xs font-semibold text-foreground group-hover:text-primary transition-colors" title={doc.filename}>
                                {doc.filename}
                              </h4>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerDeleteConfirm(doc);
                            }}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                            title="Delete file"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-end text-[10.5px] font-mono text-muted-foreground">
                          <a
                            href={`${API_BASE_URL}/documents/${doc.id}/download`}
                            target="_blank"
                            rel="noreferrer"
                            download={doc.filename}
                            className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                            title="Download file"
                          >
                            <Download className="h-3 w-3" />
                            Save
                          </a>
                        </div>
                      </motion.div>
                    );
                  })}
                  {filteredDocs.length === 0 && (
                    <p className="col-span-2 text-center text-[12px] font-medium text-muted-foreground py-8">
                      No documents match your search.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredDocs.map((doc) => {
                    return (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group flex items-center justify-between rounded-xl border border-border/60 bg-card/50 p-3 transition-all hover:bg-accent/30 hover:border-border"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <RealisticDocIcon filename={doc.filename} />
                          <div className="overflow-hidden">
                            <h4 className="truncate text-[13px] font-semibold text-foreground leading-none" title={doc.filename}>
                              {doc.filename}
                            </h4>
                            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : "0 KB"}
                              </span>
                              <span>•</span>
                              <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => triggerDeleteConfirm(doc)}
                          className="inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-all cursor-pointer focus:outline-none"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </button>
                      </motion.div>
                    )
                  })}
                  {filteredDocs.length === 0 && (
                    <p className="text-center text-[12px] font-medium text-muted-foreground py-8">
                      No documents match your search.
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          <ModernConfirmDialog
            isOpen={deleteDocConfirmOpen}
            onClose={() => { setDeleteDocConfirmOpen(false); setDocToDelete(null); }}
            onConfirm={confirmDelete}
            title="Delete Document?"
            description={`Are you sure you want to permanently delete "${docToDelete?.filename || "this document"}"? This will remove all parsed document data.`}
            confirmText="Delete"
            variant="destructive"
          />
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
