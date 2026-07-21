"use client";

import React, { useState } from "react";
import {
  X,
  Download,
  FileText,
  FileSpreadsheet,
  FileCode,
  Share2,
  Send,
  ExternalLink,
  Check,
  RefreshCw,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { API_BASE_URL } from "@/lib/api";
import { toast } from "sonner";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId?: string;
  query?: string;
  citations?: any[];
  type?: "report" | "task";
  taskId?: string;
  taskTitle?: string;
}

export function ExportModal({
  isOpen,
  onClose,
  reportId,
  query,
  citations = [],
  type = "report",
  taskId,
  taskTitle
}: ExportModalProps) {
  const [activeTab, setActiveTab] = useState<"download" | "publish">("download");
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownload = async (format: "pdf" | "docx" | "xlsx" | "md") => {
    try {
      setIsExporting(format);
      const token = localStorage.getItem("token");

      let endpoint = "";
      if (type === "task") {
        if (format === "xlsx") endpoint = `${API_BASE_URL}/tasks/export/excel`;
        else if (format === "pdf") endpoint = `${API_BASE_URL}/tasks/export/pdf`;
        else if (format === "docx") endpoint = `${API_BASE_URL}/tasks/export/docx`;
        else endpoint = `${API_BASE_URL}/tasks/export/md`;
      } else if (reportId) {
        endpoint = `${API_BASE_URL}/reports/${reportId}/export/${format === "md" ? "" : format}`;
      }

      if (endpoint) {
        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = type === "task" ? `task-board.${format}` : `research-report-${reportId || "export"}.${format}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          toast.success(`Exported as ${format.toUpperCase()} successfully!`);
          return;
        }
      }

      // Client-side fallback download if reportId is missing or backend item not persisted
      const contentStr = `# ${query || "TriVisionX AI Session Export"}\n\nGenerated Export: ${new Date().toLocaleString()}\n\n${
        citations && citations.length > 0
          ? "### References & Citations:\n" + citations.map((c: any, i: number) => `[${i + 1}] ${c.title || c.url || c}`).join("\n")
          : "TriVisionX AI Enterprise Copilot Session Export."
      }\n`;
      const fallbackBlob = new Blob([contentStr], { type: "text/markdown;charset=utf-8" });
      const fallbackUrl = window.URL.createObjectURL(fallbackBlob);
      const fallbackA = document.createElement("a");
      fallbackA.href = fallbackUrl;
      fallbackA.download = `export-${Date.now()}.md`;
      document.body.appendChild(fallbackA);
      fallbackA.click();
      window.URL.revokeObjectURL(fallbackUrl);
      document.body.removeChild(fallbackA);

      toast.success(`Exported as Markdown document!`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || `Failed to export ${format.toUpperCase()}`);
    } finally {
      setIsExporting(null);
    }
  };

  const handlePublish = async (platform: "slack" | "teams" | "notion" | "confluence" | "jira") => {
    try {
      setIsPublishing(platform);
      const token = localStorage.getItem("token");

      let endpoint = "";
      if (platform === "jira" && taskId) {
        endpoint = `${API_BASE_URL}/tasks/${taskId}/export/jira`;
      } else if (reportId) {
        endpoint = `${API_BASE_URL}/reports/${reportId}/publish/${platform}`;
      } else {
        toast.error(`Please select or generate a report first before publishing to ${platform.toUpperCase()}.`);
        return;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || `Failed to publish to ${platform}`);
      }

      toast.success(data.message || `Published to ${platform.toUpperCase()} successfully!`);
      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || `Publishing to ${platform.toUpperCase()} failed. Please check Integrations Settings.`);
    } finally {
      setIsPublishing(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-6 border-b border-zinc-200 dark:border-zinc-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Share2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-zinc-900 dark:text-white">
                  Export &amp; Integration Hub
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Export formatted reports or push directly to team workspaces
                </DialogDescription>
              </div>
            </div>
          </div>

          {query && (
            <div className="mt-4 p-2.5 rounded-lg bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">
              <span className="text-zinc-400 font-normal">Topic: </span>
              {query}
            </div>
          )}
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-1">
          <button
            onClick={() => setActiveTab("download")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === "download"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200/80 dark:border-zinc-700/60"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Download className="h-4 w-4 text-indigo-500" />
            File Formats (PDF, DOCX, XLSX)
          </button>
          <button
            onClick={() => setActiveTab("publish")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === "publish"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200/80 dark:border-zinc-700/60"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Send className="h-4 w-4 text-purple-500" />
            Team Integrations (Slack, Notion, Jira)
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {activeTab === "download" ? (
            <div className="grid grid-cols-2 gap-3">
              {/* PDF */}
              <button
                onClick={() => handleDownload("pdf")}
                disabled={isExporting !== null}
                className="group p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50 bg-white dark:bg-zinc-900/50 hover:bg-indigo-500/5 transition-all text-left flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
                    <FileText className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-red-500/5 text-red-600 dark:text-red-400 border-red-500/20">
                    PDF Document
                  </Badge>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-indigo-500 transition-colors">
                    PDF Executive Report
                  </h4>
                  <p className="text-[10px] text-zinc-500 mt-1">Formatted layout with citations, headers &amp; branding</p>
                </div>
                {isExporting === "pdf" && (
                  <div className="flex items-center gap-1.5 text-[10px] text-indigo-500 font-semibold">
                    <RefreshCw className="h-3 w-3 animate-spin" /> Generating PDF...
                  </div>
                )}
              </button>

              {/* DOCX */}
              <button
                onClick={() => handleDownload("docx")}
                disabled={isExporting !== null}
                className="group p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50 bg-white dark:bg-zinc-900/50 hover:bg-indigo-500/5 transition-all text-left flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <FileText className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-blue-500/5 text-blue-600 dark:text-blue-400 border-blue-500/20">
                    Word (.docx)
                  </Badge>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-indigo-500 transition-colors">
                    MS Word Document
                  </h4>
                  <p className="text-[10px] text-zinc-500 mt-1">Editable document file for Office &amp; Google Docs</p>
                </div>
                {isExporting === "docx" && (
                  <div className="flex items-center gap-1.5 text-[10px] text-indigo-500 font-semibold">
                    <RefreshCw className="h-3 w-3 animate-spin" /> Generating DOCX...
                  </div>
                )}
              </button>

              {/* XLSX */}
              <button
                onClick={() => handleDownload("xlsx")}
                disabled={isExporting !== null}
                className="group p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50 bg-white dark:bg-zinc-900/50 hover:bg-indigo-500/5 transition-all text-left flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                    Excel (.xlsx)
                  </Badge>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-indigo-500 transition-colors">
                    Structured Spreadsheet
                  </h4>
                  <p className="text-[10px] text-zinc-500 mt-1">Multi-tab workbook with findings &amp; citations</p>
                </div>
                {isExporting === "xlsx" && (
                  <div className="flex items-center gap-1.5 text-[10px] text-indigo-500 font-semibold">
                    <RefreshCw className="h-3 w-3 animate-spin" /> Generating XLSX...
                  </div>
                )}
              </button>

              {/* Markdown */}
              <button
                onClick={() => handleDownload("md")}
                disabled={isExporting !== null}
                className="group p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50 bg-white dark:bg-zinc-900/50 hover:bg-indigo-500/5 transition-all text-left flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                    <FileCode className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-purple-500/5 text-purple-600 dark:text-purple-400 border-purple-500/20">
                    Markdown (.md)
                  </Badge>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-indigo-500 transition-colors">
                    Raw Markdown File
                  </h4>
                  <p className="text-[10px] text-zinc-500 mt-1">Clean GFM formatted markdown text document</p>
                </div>
                {isExporting === "md" && (
                  <div className="flex items-center gap-1.5 text-[10px] text-indigo-500 font-semibold">
                    <RefreshCw className="h-3 w-3 animate-spin" /> Generating MD...
                  </div>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Slack Webhook */}
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
                    #
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Slack Channel</h4>
                    <p className="text-[10px] text-zinc-500">Push summary card to team Slack channel</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePublish("slack")}
                  disabled={isPublishing !== null}
                  className="h-8 text-xs font-semibold gap-1.5"
                >
                  {isPublishing === "slack" ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Send className="h-3.5 w-3.5 text-emerald-500" />}
                  Push Slack
                </Button>
              </div>

              {/* MS Teams Webhook */}
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold text-xs">
                    T
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Microsoft Teams</h4>
                    <p className="text-[10px] text-zinc-500">Send adaptive card to Teams channel webhook</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePublish("teams")}
                  disabled={isPublishing !== null}
                  className="h-8 text-xs font-semibold gap-1.5"
                >
                  {isPublishing === "teams" ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Send className="h-3.5 w-3.5 text-indigo-500" />}
                  Push Teams
                </Button>
              </div>

              {/* Notion Page */}
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-zinc-500/10 text-zinc-800 dark:text-zinc-200 flex items-center justify-center font-bold text-xs">
                    N
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Notion Workspace</h4>
                    <p className="text-[10px] text-zinc-500">Publish report page directly to Notion knowledge base</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePublish("notion")}
                  disabled={isPublishing !== null}
                  className="h-8 text-xs font-semibold gap-1.5"
                >
                  {isPublishing === "notion" ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Share2 className="h-3.5 w-3.5 text-zinc-500" />}
                  Notion Page
                </Button>
              </div>

              {/* Confluence Space */}
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xs">
                    C
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Confluence Wiki</h4>
                    <p className="text-[10px] text-zinc-500">Publish structured page in Atlassian Confluence</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePublish("confluence")}
                  disabled={isPublishing !== null}
                  className="h-8 text-xs font-semibold gap-1.5"
                >
                  {isPublishing === "confluence" ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Share2 className="h-3.5 w-3.5 text-blue-500" />}
                  Confluence
                </Button>
              </div>

              {/* Jira Integration */}
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold text-xs">
                    J
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Jira Ticket Creation</h4>
                    <p className="text-[10px] text-zinc-500">Create ticket from task item or research finding</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePublish("jira")}
                  disabled={isPublishing !== null}
                  className="h-8 text-xs font-semibold gap-1.5"
                >
                  {isPublishing === "jira" ? <RefreshCw className="h-3 w-3 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5 text-sky-500" />}
                  Create Jira Issue
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <span className="text-[11px] text-zinc-400">
            Configure Webhooks &amp; API credentials in Integrations Settings.
          </span>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-8 text-xs font-semibold">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
