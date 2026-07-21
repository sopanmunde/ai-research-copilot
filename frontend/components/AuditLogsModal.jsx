"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Search,
  X,
  FileText,
  Download,
  RefreshCw,
  Cpu,
  BarChart2,
  Layers,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="flex flex-col h-[85vh] w-full max-w-6xl rounded-2xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                Explainable AI Audit Logs
                <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  Enterprise Compliance
                </Badge>
              </h2>
              <p className="text-xs text-muted-foreground">
                Immutable query execution step logs, citation confidence scoring, and source heatmaps stored in MongoDB.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAuditLogs}
              className="h-8 gap-1.5 text-xs font-semibold shadow-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Metrics Banner */}
        <div className="grid grid-cols-4 divide-x divide-border border-b border-border bg-muted/20">
          <div className="p-3.5 px-6">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Audited Queries</p>
            <p className="text-xl font-extrabold text-foreground mt-0.5">{totalLogs}</p>
          </div>
          <div className="p-3.5 px-6">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Compliance Reliability Rate</p>
            <p className="text-xl font-extrabold text-emerald-500 mt-0.5">{successRate}%</p>
          </div>
          <div className="p-3.5 px-6">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Avg Citations Per Query</p>
            <p className="text-xl font-extrabold text-foreground mt-0.5">{avgCitations}</p>
          </div>
          <div className="p-3.5 px-6">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Audit Storage Target</p>
            <p className="text-xs font-semibold text-foreground mt-1 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              MongoDB audit_logs
            </p>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex flex-1 min-h-0">
          {/* Left Column: Log List */}
          <div className="w-5/12 flex flex-col border-r border-border bg-card">
            {/* Search */}
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search queries, models, providers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 h-8 text-xs font-medium"
                />
              </div>
            </div>

            {/* List */}
            <ScrollArea className="flex-1">
              <div className="divide-y divide-border/50">
                {logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                    <FileText className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-xs font-semibold text-foreground">No audit logs found</p>
                    <p className="text-[11px] mt-1 text-muted-foreground">Queries submitted in agent/quick mode will appear here.</p>
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
                            ? "bg-emerald-500/10 border-l-4 border-emerald-500"
                            : "hover:bg-accent/50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <Badge variant="secondary" className="text-[10px] font-mono uppercase tracking-wider">
                            {log.mode?.toUpperCase() || "AGENT"} · {log.workflow_type || "research"}
                          </Badge>
                          <Badge
                            className={`text-[10px] font-semibold border-none ${
                              isSuccess
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-destructive/10 text-destructive"
                            }`}
                          >
                            {isSuccess ? "Success" : "Failed"}
                          </Badge>
                        </div>

                        <p className="text-xs font-bold text-foreground line-clamp-2 leading-relaxed">
                          {log.query}
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2 font-mono">
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
            </ScrollArea>
          </div>

          {/* Right Column: Audit Detail Inspector */}
          <ScrollArea className="w-7/12 flex-1 bg-muted/20 p-6">
            {selectedLog ? (
              <div className="space-y-6">
                {/* Detail Header */}
                <div className="flex items-start justify-between border-b border-border pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold font-mono text-muted-foreground">
                        AUDIT LOG ID: {selectedLog.id}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-foreground leading-snug">
                      "{selectedLog.query}"
                    </h3>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportJson(selectedLog)}
                    className="gap-1.5 h-8 text-xs font-semibold shrink-0 shadow-xs"
                  >
                    <Download className="h-3.5 w-3.5 text-emerald-500" />
                    Export Audit JSON
                  </Button>
                </div>

                {/* Metadata Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="border-border bg-card text-card-foreground shadow-xs">
                    <CardContent className="p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Model & Provider</p>
                      <p className="text-xs font-bold text-foreground mt-0.5 flex items-center gap-1.5">
                        <Cpu className="h-3.5 w-3.5 text-blue-500" />
                        {selectedLog.provider || "default"} / {selectedLog.model || "default"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-border bg-card text-card-foreground shadow-xs">
                    <CardContent className="p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Execution Mode</p>
                      <p className="text-xs font-bold text-foreground mt-0.5 flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-purple-500" />
                        {selectedLog.mode?.toUpperCase()} ({selectedLog.workflow_type || "research"})
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Execution Pathway Steps */}
                <Card className="border-border bg-card text-card-foreground shadow-xs">
                  <CardContent className="p-4">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Layers className="h-4 w-4 text-emerald-500" />
                      Agent Step Execution Log ({selectedLog.steps?.length || 0} Nodes)
                    </h4>

                    <div className="space-y-3 pl-2 border-l border-border">
                      {selectedLog.steps && selectedLog.steps.length > 0 ? (
                        selectedLog.steps.map((step, idx) => (
                          <div key={idx} className="relative pl-4 flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-foreground flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                {step.node}
                              </span>
                              <span className="text-[10px] font-mono text-muted-foreground">
                                {step.started_at ? new Date(step.started_at).toLocaleTimeString() : ""}
                              </span>
                            </div>
                            <p className="text-xs font-mono text-muted-foreground bg-muted p-2 rounded-md border border-border">
                              {step.output || "Completed successfully."}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No node steps recorded for this execution.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Citation Confidence Scores */}
                {selectedLog.citations && selectedLog.citations.length > 0 && (
                  <Card className="border-border bg-card text-card-foreground shadow-xs">
                    <CardContent className="p-4">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        Citation Confidence Match Scores
                      </h4>

                      <div className="space-y-2">
                        {selectedLog.citations.map((cit, idx) => {
                          const confPct = cit.confidence ? Math.round(cit.confidence * 100) : 85;
                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2.5 rounded-lg bg-muted border border-border text-xs"
                            >
                              <span className="font-semibold text-foreground truncate max-w-[70%]">
                                {idx + 1}. {cit.filename || cit.source || "Document"} {cit.page ? `(Page ${cit.page})` : ""}
                              </span>
                              <Badge className="text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                {confPct}% Confidence Match
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Source Impact Heatmap */}
                {selectedLog.source_heatmap && selectedLog.source_heatmap.length > 0 && (
                  <Card className="border-border bg-card text-card-foreground shadow-xs">
                    <CardContent className="p-4">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                        <BarChart2 className="h-4 w-4 text-purple-500" />
                        Source Impact Heatmap
                      </h4>

                      <div className="space-y-2">
                        {selectedLog.source_heatmap.map((item, idx) => (
                          <div key={idx} className="flex flex-col gap-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-foreground truncate">{item.source}</span>
                              <span className="text-muted-foreground font-mono text-[11px]">{item.count} hit(s)</span>
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" style={{ width: `${Math.min(item.count * 25, 100)}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center text-center text-muted-foreground py-12">
                <p className="text-xs font-semibold">Select an audit log entry on the left to inspect detailed explainability metadata.</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
