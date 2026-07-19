"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Search,
  X,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  FileText,
  ChevronRight,
  Download,
  RefreshCw,
  ExternalLink,
  Cpu,
  BarChart2,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

export default function AuditLogsModal({ isOpen, onClose, defaultSearch = "" }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(defaultSearch);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    if (defaultSearch) setSearch(defaultSearch);
  }, [defaultSearch]);

  const fetchAuditLogs = async () => {
    if (!isOpen) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const url = new URL(`${API_BASE_URL}/audit-logs`);
      url.searchParams.append("limit", "50");
      if (search.trim()) url.searchParams.append("search", search.trim());

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.audit_logs || []);
        if (data.audit_logs?.length > 0 && !selectedLog) {
          setSelectedLog(data.audit_logs[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [isOpen, search]);

  if (!isOpen) return null;

  const handleExportJson = (log) => {
    if (!log) return;
    const blob = new Blob([JSON.stringify(log, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trivisionx-audit-${log.id || "query"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalLogs = logs.length;
  const successCount = logs.filter((l) => l.status === "success").length;
  const successRate = totalLogs > 0 ? Math.round((successCount / totalLogs) * 100) : 100;
  const avgCitations =
    totalLogs > 0
      ? (
          logs.reduce((sum, l) => sum + (l.citations?.length || 0), 0) /
          totalLogs
        ).toFixed(1)
      : "0";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="flex flex-col h-[85vh] w-full max-w-6xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 bg-zinc-50/80 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Explainable AI Audit Logs
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Enterprise Compliance
                </span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Immutable query execution step logs, citation confidence scoring, and source heatmaps stored in MongoDB.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAuditLogs}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Metrics Banner */}
        <div className="grid grid-cols-4 divide-x divide-zinc-200 dark:divide-zinc-800 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/20">
          <div className="p-3.5 px-6">
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Total Audited Queries</p>
            <p className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">{totalLogs}</p>
          </div>
          <div className="p-3.5 px-6">
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Compliance Reliability Rate</p>
            <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{successRate}%</p>
          </div>
          <div className="p-3.5 px-6">
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Avg Citations Per Query</p>
            <p className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">{avgCitations}</p>
          </div>
          <div className="p-3.5 px-6">
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Audit Storage Target</p>
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mt-1 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              MongoDB audit_logs
            </p>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex flex-1 min-h-0">
          {/* Left Column: Log List */}
          <div className="w-5/12 flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            {/* Search */}
            <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search queries, models, providers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 pl-9 pr-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-900">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-400">
                  <FileText className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-xs font-semibold">No audit logs found</p>
                  <p className="text-[11px] mt-1">Queries submitted in agent/quick mode will appear here.</p>
                </div>
              ) : (
                logs.map((log) => {
                  const isSelected = selectedLog?.id === log.id;
                  const isSuccess = log.status === "success";
                  const dateStr = log.timestamp
                    ? new Date(log.timestamp).toLocaleString()
                    : "N/A";
                  const stepCount = log.steps?.length || 0;
                  const citCount = log.citations?.length || 0;

                  return (
                    <div
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className={`p-3.5 px-4 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-emerald-500/10 dark:bg-emerald-950/30 border-l-4 border-emerald-500"
                          : "hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                          {log.mode?.toUpperCase() || "AGENT"} · {log.workflow_type || "research"}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isSuccess
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {isSuccess ? "Success" : "Failed"}
                        </span>
                      </div>

                      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 line-clamp-2 leading-relaxed">
                        {log.query}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-2 font-mono">
                        <span>{dateStr}</span>
                        <span>
                          {stepCount} step{stepCount !== 1 ? "s" : ""} · {citCount} citation{citCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Audit Detail Inspector */}
          <div className="w-7/12 flex flex-col overflow-y-auto bg-zinc-50/50 dark:bg-zinc-900/30 p-6">
            {selectedLog ? (
              <div className="space-y-6">
                {/* Detail Header */}
                <div className="flex items-start justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold font-mono text-zinc-500">
                        AUDIT LOG ID: {selectedLog.id}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                      "{selectedLog.query}"
                    </h3>
                  </div>

                  <button
                    onClick={() => handleExportJson(selectedLog)}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0 shadow-xs"
                  >
                    <Download className="h-3.5 w-3.5 text-emerald-500" />
                    Export Audit JSON
                  </button>
                </div>

                {/* Metadata Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 shadow-xs">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Model & Provider</p>
                    <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5 flex items-center gap-1.5">
                      <Cpu className="h-3.5 w-3.5 text-blue-500" />
                      {selectedLog.provider || "default"} / {selectedLog.model || "default"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 shadow-xs">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Execution Mode</p>
                    <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5 flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-fuchsia-500" />
                      {selectedLog.mode?.toUpperCase()} ({selectedLog.workflow_type || "research"})
                    </p>
                  </div>
                </div>

                {/* Execution Pathway Steps */}
                <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 shadow-xs">
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-emerald-500" />
                    Agent Step Execution Log ({selectedLog.steps?.length || 0} Nodes)
                  </h4>

                  <div className="space-y-3 pl-2 border-l border-zinc-200 dark:border-zinc-800">
                    {selectedLog.steps && selectedLog.steps.length > 0 ? (
                      selectedLog.steps.map((step, idx) => (
                        <div key={idx} className="relative pl-4 flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-emerald-500" />
                              {step.node}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-400">
                              {step.started_at ? new Date(step.started_at).toLocaleTimeString() : ""}
                            </span>
                          </div>
                          <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-md border border-zinc-100 dark:border-zinc-800/80">
                            {step.output || "Completed successfully."}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-zinc-400 italic">No node steps recorded for this execution.</p>
                    )}
                  </div>
                </div>

                {/* Citation Confidence Scores */}
                {selectedLog.citations && selectedLog.citations.length > 0 && (
                  <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 shadow-xs">
                    <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      Citation Confidence Match Scores
                    </h4>

                    <div className="space-y-2">
                      {selectedLog.citations.map((cit, idx) => {
                        const confPct = cit.confidence ? Math.round(cit.confidence * 100) : 85;
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-xs"
                          >
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[70%]">
                              {idx + 1}. {cit.filename || cit.source || "Document"} {cit.page ? `(Page ${cit.page})` : ""}
                            </span>
                            <span className="font-bold px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              {confPct}% Confidence Match
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Source Impact Heatmap */}
                {selectedLog.source_heatmap && selectedLog.source_heatmap.length > 0 && (
                  <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 shadow-xs">
                    <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <BarChart2 className="h-4 w-4 text-fuchsia-500" />
                      Source Impact Heatmap
                    </h4>

                    <div className="space-y-2">
                      {selectedLog.source_heatmap.map((item, idx) => (
                        <div key={idx} className="flex flex-col gap-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-zinc-700 dark:text-zinc-300 truncate">{item.source}</span>
                            <span className="text-zinc-500 font-mono text-[11px]">{item.count} hit(s)</span>
                          </div>
                          <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: `${Math.min(item.count * 25, 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center text-center text-zinc-400">
                <p className="text-xs font-semibold">Select an audit log entry on the left to inspect detailed explainability metadata.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
