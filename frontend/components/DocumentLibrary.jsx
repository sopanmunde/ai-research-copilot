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

function getFileIcon(filename) {
  const ext = filename?.split(".").pop()?.toLowerCase() || "";
  if (["pdf"].includes(ext))
    return { icon: FileType, color: "text-red-400", bg: "bg-red-950/40 border-red-900/50" };
  if (["docx", "doc", "rtf", "odt"].includes(ext))
    return { icon: FileText, color: "text-blue-400", bg: "bg-blue-950/40 border-blue-900/50" };
  if (["xlsx", "xls", "csv"].includes(ext))
    return { icon: FileSpreadsheet, color: "text-green-400", bg: "bg-green-950/40 border-green-900/50" };
  if (["pptx", "ppt"].includes(ext))
    return { icon: Presentation, color: "text-orange-400", bg: "bg-orange-950/40 border-orange-900/50" };
  if (["png", "jpg", "jpeg", "gif", "webp", "bmp", "tiff", "svg"].includes(ext))
    return { icon: ImageIcon, color: "text-purple-400", bg: "bg-purple-950/40 border-purple-900/50" };
  if (["json", "jsonl", "xml", "yaml", "yml"].includes(ext))
    return { icon: FileJson, color: "text-yellow-400", bg: "bg-yellow-950/40 border-yellow-900/50" };
  if (["html", "htm", "md", "mdx", "rst"].includes(ext))
    return { icon: FileCode, color: "text-cyan-400", bg: "bg-cyan-950/40 border-cyan-900/50" };
  if (["py", "js", "ts", "jsx", "tsx", "java", "cpp", "c", "cs", "go", "rs", "rb", "php", "sh", "sql"].includes(ext))
    return { icon: FileCode, color: "text-indigo-400", bg: "bg-indigo-950/40 border-indigo-900/50" };
  if (["zip"].includes(ext))
    return { icon: Archive, color: "text-muted-foreground", bg: "bg-muted/30 border-border/50" };
  return { icon: FileIcon, color: "text-muted-foreground", bg: "bg-muted/30 border-border/50" };
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
                    toast.success(`Indexed ${data.chunks} chunks successfully.`);
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

              {/* Actions */}
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
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!!uploadingStage}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-[13px] font-semibold transition-all disabled:opacity-50 bg-primary text-white shadow-sm hover:bg-primary/90 h-9 px-4 py-2 gap-2"
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
                  "mb-5 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 text-center transition-colors cursor-pointer select-none",
                  uploadingStage && "pointer-events-none opacity-50"
                )}
              >
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-full border transition-colors", isDragOver ? "border-primary/50 bg-primary/10" : "border-border bg-muted")}>
                  <UploadCloud className={cn("h-4 w-4 transition-colors", isDragOver ? "text-primary" : "text-muted-foreground")} />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{isDragOver ? "Drop to upload" : "Drag & drop or click to browse"}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">PDF, DOCX, XLSX, PPTX, Images, Code files, JSON, CSV and more · up to {MAX_FILE_SIZE_MB} MB</p>
                </div>
              </motion.div>

              {/* Document List */}
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
              ) : (
                <div className="space-y-2">
                  {filteredDocs.map((doc) => {
                    const { icon: DocIcon, color, bg } = getFileIcon(doc.filename);
                    return (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group flex items-center justify-between rounded-xl border border-border/60 bg-card/50 p-3 transition-all hover:bg-accent/30 hover:border-border"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border", bg)}>
                            <DocIcon className={cn("h-4 w-4", color)} />
                          </div>
                          <div className="overflow-hidden">
                            <h4 className="truncate text-[13px] font-semibold text-foreground leading-none" title={doc.filename}>
                              {doc.filename}
                            </h4>
                            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Database className="h-3 w-3" />
                                {doc.chunk_count} chunks
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
            description={`Are you sure you want to permanently delete "${docToDelete?.filename || "this document"}"? This will remove all parsed text chunks.`}
            confirmText="Delete"
            variant="destructive"
          />
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
