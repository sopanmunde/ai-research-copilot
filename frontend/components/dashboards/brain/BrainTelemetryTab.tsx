"use client";

import React, { useState, useMemo } from "react";
import {
  Activity,
  Clock,
  Zap,
  Gauge,
  Layers,
  TrendingUp,
  LineChart,
  Terminal,
  Sparkles,
  X,
  Search,
  Trash2,
  Download,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ShieldAlert,
  Pause,
  Play,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TelemetryLog } from "./types";

interface BrainTelemetryTabProps {
  telemetryLive: boolean;
  setTelemetryLive: (val: boolean) => void;
  telemetryInterval: number;
  setTelemetryInterval: (val: number) => void;
  telemetryWindow: "1m" | "5m" | "1h" | "24h";
  setTelemetryWindow: (val: "1m" | "5m" | "1h" | "24h") => void;
  liveTtft: number;
  liveP95: number;
  liveTokensPerSec: number;
  setLiveTokensPerSec: (val: number) => void;
  liveReqPerMin: number;
  setLiveReqPerMin: (val: number) => void;
  liveVectorLatency: number;
  throughputGraph: number[];
  telemetryStreamLogs: TelemetryLog[];
  setTelemetryStreamLogs?: React.Dispatch<React.SetStateAction<TelemetryLog[]>>;
}

export function BrainTelemetryTab({
  telemetryLive,
  setTelemetryLive,
  telemetryInterval,
  setTelemetryInterval,
  telemetryWindow,
  setTelemetryWindow,
  liveTtft,
  liveP95,
  liveTokensPerSec,
  setLiveTokensPerSec,
  liveReqPerMin,
  setLiveReqPerMin,
  liveVectorLatency,
  throughputGraph,
  telemetryStreamLogs,
  setTelemetryStreamLogs,
}: BrainTelemetryTabProps) {
  // Live Telemetry Event Log Filtering & Search State
  const [logSearchQuery, setLogSearchQuery] = useState("");
  const [logStatusFilter, setLogStatusFilter] = useState<"ALL" | "200" | "304" | "429" | "500">("ALL");
  const [selectedInspectorLog, setSelectedInspectorLog] = useState<TelemetryLog | null>(null);
  const [copiedTraceId, setCopiedTraceId] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [isExpandedLogView, setIsExpandedLogView] = useState(false);

  // Compute Filtered Logs
  const filteredLogs = useMemo(() => {
    return telemetryStreamLogs.filter((log) => {
      // Status filter check
      if (logStatusFilter !== "ALL" && String(log.status) !== logStatusFilter) {
        return false;
      }
      // Search query check
      if (logSearchQuery.trim()) {
        const query = logSearchQuery.toLowerCase();
        const matchModel = log.model.toLowerCase().includes(query);
        const matchTrace = log.traceId?.toLowerCase().includes(query) ?? false;
        const matchStatus = String(log.status).includes(query);
        const matchError = log.error?.toLowerCase().includes(query) ?? false;
        const matchTimestamp = log.timestamp.includes(query);
        return matchModel || matchTrace || matchStatus || matchError || matchTimestamp;
      }
      return true;
    });
  }, [telemetryStreamLogs, logStatusFilter, logSearchQuery]);

  // Export logs to JSON
  const handleExportLogs = () => {
    try {
      const jsonStr = JSON.stringify(telemetryStreamLogs, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `telemetry-event-logs-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Exported telemetry logs to JSON");
    } catch {
      toast.error("Failed to export logs");
    }
  };

  // Clear all logs
  const handleClearLogs = () => {
    if (setTelemetryStreamLogs) {
      setTelemetryStreamLogs([]);
      toast.success("Telemetry event logs cleared");
    }
  };

  // Render Status Badge
  const renderStatusBadge = (status: number, cacheHit?: boolean) => {
    if (cacheHit || status === 304) {
      return (
        <span className="inline-flex items-center gap-1 rounded text-[9.5px] px-1.5 py-0.5 border border-cyan-500/40 text-cyan-400 font-mono font-bold bg-cyan-500/10">
          <CheckCircle2 className="size-2.5 text-cyan-400" /> 304 CACHE
        </span>
      );
    }
    if (status === 200) {
      return (
        <span className="inline-flex items-center gap-1 rounded text-[9.5px] px-1.5 py-0.5 border border-emerald-500/40 text-emerald-400 font-mono font-bold bg-emerald-500/10">
          <CheckCircle2 className="size-2.5 text-emerald-400" /> 200 OK
        </span>
      );
    }
    if (status === 429) {
      return (
        <span className="inline-flex items-center gap-1 rounded text-[9.5px] px-1.5 py-0.5 border border-amber-500/40 text-amber-400 font-mono font-bold bg-amber-500/10">
          <AlertTriangle className="size-2.5 text-amber-400" /> 429 LIMIT
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded text-[9.5px] px-1.5 py-0.5 border border-rose-500/40 text-rose-400 font-mono font-bold bg-rose-500/10">
        <XCircle className="size-2.5 text-rose-400" /> {status} ERR
      </span>
    );
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto scrollbar-thin space-y-6 bg-background/50">
      {/* Telemetry Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Activity className="size-5 text-emerald-500 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-foreground">Real-Time Brain Telemetry Engine</h3>
              <span className="inline-flex items-center rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[9.5px] font-bold px-2 py-0.5">
                {telemetryLive ? "LIVE STREAMING" : "PAUSED"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Active metrics tracking for model tokens, active latency, vector memory &amp; throughput</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Time Window Buttons */}
          <div className="flex items-center rounded-lg bg-muted p-0.5 border border-border text-[11px]">
            {(["1m", "5m", "1h", "24h"] as const).map((tw) => (
              <button
                key={tw}
                onClick={() => setTelemetryWindow(tw)}
                className={cn(
                  "px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer",
                  telemetryWindow === tw
                    ? "bg-background text-foreground shadow-xs border border-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tw}
              </button>
            ))}
          </div>

          {/* Refresh Frequency Select */}
          <Select
            value={String(telemetryInterval)}
            onValueChange={(val) => setTelemetryInterval(Number(val))}
          >
            <SelectTrigger className="h-8 text-xs font-semibold w-28 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1s refresh</SelectItem>
              <SelectItem value="2">2s refresh</SelectItem>
              <SelectItem value="5">5s refresh</SelectItem>
            </SelectContent>
          </Select>

          {/* Pause/Play Toggle */}
          <Button
            size="sm"
            variant={telemetryLive ? "outline" : "default"}
            onClick={() => setTelemetryLive(!telemetryLive)}
            className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
          >
            {telemetryLive ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
            {telemetryLive ? "Pause Feed" : "Resume Feed"}
          </Button>

          {/* Pulse Benchmark Load Trigger */}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setLiveTokensPerSec(285);
              setLiveReqPerMin(92);
              toast.info("Simulated telemetry load spike triggered!");
            }}
            className="h-8 text-xs font-semibold gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 cursor-pointer"
          >
            <Zap className="size-3.5 text-primary" />
            Test Pulse Spike
          </Button>
        </div>
      </div>

      {/* Key Telemetry Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4.5">
        {/* 1. Active Latency Card */}
        <div className="p-5 rounded-xl border border-border/80 bg-card relative overflow-hidden shadow-xs hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-foreground flex items-center gap-2">
              <Clock className="size-4 text-emerald-400" /> Active Latency (TTFT)
            </span>
            <span className="size-2.5 rounded-full bg-emerald-500 animate-ping shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-foreground tracking-tight">{liveTtft} <span className="text-sm font-semibold text-muted-foreground">ms</span></span>
            <span className="inline-flex items-center rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-1.5 py-0.5">Fast</span>
          </div>
        </div>

        {/* 2. Model Tokens Generation Rate */}
        <div className="p-5 rounded-xl border border-border/80 bg-card relative overflow-hidden shadow-xs hover:border-blue-500/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-foreground flex items-center gap-2">
              <Zap className="size-4 text-blue-400" /> Token Stream Speed
            </span>
            <span className="inline-flex items-center rounded text-[10px] font-mono font-bold px-1.5 py-0.5 border border-blue-500/40 text-blue-400 bg-blue-500/10">
              Realtime
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-foreground tracking-tight">{liveTokensPerSec}</span>
            <span className="text-xs text-muted-foreground font-mono font-semibold">tokens / sec</span>
          </div>
        </div>

        {/* 3. Request Throughput & Success Rate */}
        <div className="p-5 rounded-xl border border-border/80 bg-card relative overflow-hidden shadow-xs hover:border-indigo-500/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-foreground flex items-center gap-2">
              <Gauge className="size-4 text-indigo-400" /> Active Throughput
            </span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">99.85% Success</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-foreground tracking-tight">{liveReqPerMin}</span>
            <span className="text-xs text-muted-foreground font-mono font-semibold">requests / min</span>
          </div>
        </div>

        {/* 4. Vector Search & RAG Speed */}
        <div className="p-5 rounded-xl border border-border/80 bg-card relative overflow-hidden shadow-xs hover:border-purple-500/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-foreground flex items-center gap-2">
              <Layers className="size-4 text-purple-400" /> Vector RAG Search
            </span>
            <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/30">94.2% Cache</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-foreground tracking-tight">{liveVectorLatency} <span className="text-sm font-semibold text-muted-foreground">ms</span></span>
            <span className="text-xs text-muted-foreground font-mono font-semibold">query speed</span>
          </div>
        </div>
      </div>

      {/* Section 2: Visual Data Telemetry Bars & Latency Spectrum */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visual Telemetry Bars: Model Token Allocation */}
        <div className="p-5.5 rounded-xl border border-border bg-card space-y-4.5 shadow-xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-muted border border-border">
                <TrendingUp className="size-4.5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-foreground">Model Token Consumption Breakdown</h4>
                <p className="text-xs text-muted-foreground">Token allocation ratio by active provider engine</p>
              </div>
            </div>
            <span className="text-xs font-mono text-foreground font-bold bg-muted px-2.5 py-1 rounded-md border border-border">5.37M Total Tokens</span>
          </div>

          <div className="space-y-4 pt-1">
            {[
              { model: "gpt-4o (OpenAI)", pct: 42, tokens: "2.25M", color: "bg-emerald-500", labelColor: "text-emerald-400" },
              { model: "claude-3-5-sonnet (Anthropic)", pct: 28, tokens: "1.50M", color: "bg-purple-500", labelColor: "text-purple-400" },
              { model: "gemini-1.5-flash (Google)", pct: 18, tokens: "960K", color: "bg-blue-500", labelColor: "text-blue-400" },
              { model: "llama-3.1-70b (Groq LPU)", pct: 8, tokens: "420K", color: "bg-amber-500", labelColor: "text-amber-400" },
              { model: "llama3.2 (Ollama Local)", pct: 4, tokens: "210K", color: "bg-cyan-500", labelColor: "text-cyan-400" },
            ].map((item) => (
              <div key={item.model} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-foreground flex items-center gap-2 text-xs">
                    <span className={cn("size-2.5 rounded-full shadow-xs", item.color)} />
                    {item.model}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground font-medium">{item.tokens}</span>
                    <span className={cn("font-extrabold text-xs w-10 text-right", item.labelColor)}>{item.pct}%</span>
                  </div>
                </div>
                <div className="h-3 w-full rounded-full bg-muted/80 overflow-hidden border border-border/60 p-0.5">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500 shadow-xs", item.color)}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Latency Spectrum & Provider Response Speed Bars */}
        <div className="p-5.5 rounded-xl border border-border bg-card space-y-4.5 shadow-xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-muted border border-border">
                <Activity className="size-4.5 text-blue-400" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-foreground">Active Latency Spectrum (TTFT)</h4>
                <p className="text-xs text-muted-foreground">Real-time response latency benchmark per model endpoint</p>
              </div>
            </div>
            <span className="inline-flex items-center rounded-md border text-xs font-mono font-bold border-emerald-500/40 text-emerald-400 bg-emerald-500/10 px-2 py-0.5">
              Groq LPU Top Speed
            </span>
          </div>

          <div className="space-y-4 pt-1">
            {[
              { provider: "Ollama (Llama 3.2 Local)", latency: 18, rating: "Zero Network", barPct: 6, color: "bg-emerald-500" },
              { provider: "Groq LPU (Llama 3.1 70B)", latency: 45, rating: "Ultra Fast", barPct: 12, color: "bg-emerald-400" },
              { provider: "Google AI (Gemini 1.5 Flash)", latency: 180, rating: "Fast", barPct: 40, color: "bg-cyan-400" },
              { provider: "OpenAI (GPT-4o-mini)", latency: 190, rating: "Fast", barPct: 44, color: "bg-blue-400" },
              { provider: "OpenAI (GPT-4o)", latency: 280, rating: "Standard", barPct: 62, color: "bg-indigo-400" },
              { provider: "Anthropic (Claude 3.5 Sonnet)", latency: 310, rating: "Standard", barPct: 70, color: "bg-purple-400" },
            ].map((item) => (
              <div key={item.provider} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-foreground truncate max-w-[240px] text-xs">{item.provider}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-sans font-medium">{item.rating}</span>
                    <span className="font-extrabold text-foreground w-16 text-right text-xs">{item.latency} ms</span>
                  </div>
                </div>
                <div className="h-3 w-full rounded-full bg-muted/80 overflow-hidden border border-border/60 p-0.5">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500 shadow-xs", item.color)}
                    style={{ width: `${item.barPct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 3: Live Throughput Spectrum Graph & Live Stream Log */}
      <div className={cn("grid gap-6 transition-all duration-300", isExpandedLogView ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3")}>
        {/* Live Throughput Bar Spectrum (Hidden if Log view is expanded to full width) */}
        {!isExpandedLogView && (
          <div className="lg:col-span-2 p-4.5 rounded-xl border border-border bg-card shadow-xs flex flex-col justify-between h-[380px]">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-muted border border-border">
                  <LineChart className="size-4.5 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-foreground">Real-Time Throughput Bar Spectrum</h4>
                  <p className="text-[11px] text-muted-foreground">Tokens generated per second timeline ({telemetryWindow} window)</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-emerald-400 font-extrabold bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/30 text-[11px]">
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" /> Peak: 220 tok/s
                </span>
              </div>
            </div>

            {/* Dynamic Animated Bar Visualizer */}
            <div className="h-52 pt-3 pb-2 flex items-end justify-between gap-2 border-b border-border/60 px-2 bg-muted/20 rounded-lg">
              {throughputGraph.map((val, idx) => {
                const heightPct = Math.min(100, Math.max(15, (val / 220) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                    {/* Hover Tooltip */}
                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-xs font-bold font-mono px-2 py-0.5 rounded shadow-lg pointer-events-none whitespace-nowrap z-20 border border-border">
                      {val} tok/s
                    </div>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-primary/30 via-primary/70 to-emerald-400 transition-all duration-300 group-hover:bg-emerald-300 group-hover:shadow-[0_0_12px_rgba(52,211,153,0.8)]"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono font-semibold text-muted-foreground pt-1">
              <span>- {telemetryWindow} ago</span>
              <span>Live Ticker ({telemetryInterval}s interval)</span>
              <span className="text-emerald-400 font-bold">Now</span>
            </div>
          </div>
        )}

        {/* Live Stream Telemetry Log Component */}
        <div className={cn(
          "p-4.5 rounded-xl border border-border bg-card shadow-xs flex flex-col gap-3 transition-all duration-300 overflow-hidden",
          isExpandedLogView ? "col-span-1 h-[520px]" : "lg:col-span-1 h-[380px]"
        )}>
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 shrink-0 border-b border-border/60 pb-2.5">
            <div className="flex items-center gap-2">
              <Terminal className="size-4.5 text-cyan-400" />
              <h4 className="text-xs font-extrabold text-foreground">Live Telemetry Event Log</h4>
              <span className="text-[10.5px] font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border font-bold">
                {filteredLogs.length}/{telemetryStreamLogs.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Expand/Collapse View Toggle */}
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                title={isExpandedLogView ? "Collapse View" : "Expand Full Width"}
                onClick={() => setIsExpandedLogView(!isExpandedLogView)}
              >
                <Maximize2 className="size-3.5" />
              </Button>

              {/* Clear Logs Button */}
              {setTelemetryStreamLogs && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                  title="Clear Log Stream"
                  onClick={handleClearLogs}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}

              {/* Export JSON Button */}
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Export Logs as JSON"
                onClick={handleExportLogs}
              >
                <Download className="size-3.5" />
              </Button>

              {/* Pulse Indicator */}
              <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.9)] ml-1" />
            </div>
          </div>

          {/* Search & Status Filter Controls Bar */}
          <div className="flex flex-col gap-2 shrink-0">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search model, trace ID, status or error..."
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                className="h-8 text-xs pl-8 pr-7 bg-muted/30 border-border focus-visible:ring-1"
              />
              {logSearchQuery && (
                <button
                  onClick={() => setLogSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5 text-[10.5px] font-mono">
              {(["ALL", "200", "304", "429", "500"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setLogStatusFilter(st)}
                  className={cn(
                    "px-2 py-0.5 rounded font-bold transition-all cursor-pointer shrink-0 border",
                    logStatusFilter === st
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                  )}
                >
                  {st === "ALL" ? "All Logs" : st === "200" ? "200 OK" : st === "304" ? "304 Cache" : st === "429" ? "429 Limit" : "500 Err"}
                </button>
              ))}
            </div>
          </div>

          {/* Terminal Console Logs Container (Strict bounded inner container) */}
          <div className="flex-1 min-h-0 bg-card rounded-lg border border-border p-2 flex flex-col overflow-hidden shadow-inner">
            {/* Console Container Header Bar */}
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-border text-[10px] font-mono text-muted-foreground shrink-0 px-1">
              <span className="flex items-center gap-1.5 font-bold text-foreground">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                $ tail -f /var/log/telemetry.stream
              </span>
              <span className="text-muted-foreground">LIVE FEED</span>
            </div>

            {/* Log Stream Scroll Area */}
            <ScrollArea className="flex-1 pr-1.5">
              {filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground space-y-2">
                  <Terminal className="size-8 text-muted-foreground" />
                  <p className="text-xs font-semibold text-foreground font-sans">No telemetry event logs found</p>
                  <p className="text-[11px] text-muted-foreground font-sans">Try clearing your search query or status filter criteria.</p>
                </div>
              ) : (
                <div className="space-y-2 font-mono text-xs">
                  {filteredLogs.map((log, idx) => (
                    <div
                      key={`${log.id}-${idx}`}
                      onClick={() => setSelectedInspectorLog(log)}
                      className="group p-2.5 rounded-md bg-muted/40 border border-border hover:border-primary/40 hover:bg-accent flex items-center justify-between gap-2.5 transition-all cursor-pointer shadow-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-semibold text-muted-foreground">{log.timestamp}</span>
                          <span className="font-bold text-foreground truncate max-w-[130px] text-xs group-hover:text-primary transition-colors">
                            {log.model}
                          </span>
                          {log.traceId && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-muted text-foreground font-mono border border-border">
                              {log.traceId}
                            </span>
                          )}
                        </div>

                        <div className="text-[10.5px] text-muted-foreground font-medium mt-1 flex items-center gap-2 flex-wrap">
                          <span>In: {log.tokensIn}t · Out: {log.tokensOut}t</span>
                          {log.cost !== undefined && (
                            <span className="text-muted-foreground">· ${(log.cost).toFixed(4)}</span>
                          )}
                        </div>

                        {log.error && (
                          <div className="text-[10px] text-destructive font-semibold truncate mt-1 flex items-center gap-1">
                            <AlertTriangle className="size-3 shrink-0" /> {log.error}
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0 flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center rounded text-[9.5px] px-1.5 py-0.5 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-mono font-bold bg-emerald-500/10">
                            {log.latency}ms
                          </span>
                          {renderStatusBadge(log.status, log.cacheHit)}
                        </div>
                        <span className="text-[10px] text-muted-foreground group-hover:text-foreground flex items-center gap-0.5 font-sans font-medium transition-colors">
                          Inspect <ChevronRight className="size-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Event Log Details Inspector Dialog Modal */}
      <Dialog open={!!selectedInspectorLog} onOpenChange={(open) => !open && setSelectedInspectorLog(null)}>
        <DialogContent className="max-w-xl bg-card border-border shadow-2xl p-6 text-foreground font-sans">
          {selectedInspectorLog && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                      <Terminal className="size-5 text-primary" />
                    </div>
                    <div>
                      <DialogTitle className="text-base font-extrabold flex items-center gap-2">
                        Telemetry Request Inspector
                      </DialogTitle>
                      <DialogDescription className="text-xs text-muted-foreground">
                        {selectedInspectorLog.id} · Logged at {selectedInspectorLog.timestamp}
                      </DialogDescription>
                    </div>
                  </div>
                  {renderStatusBadge(selectedInspectorLog.status, selectedInspectorLog.cacheHit)}
                </div>
              </DialogHeader>

              {/* Event Key Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-muted/50 border border-border">
                  <span className="text-[10px] text-muted-foreground font-sans block mb-0.5">Model Endpoint</span>
                  <span className="font-bold text-foreground text-xs">{selectedInspectorLog.model}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/50 border border-border">
                  <span className="text-[10px] text-muted-foreground font-sans block mb-0.5">Response Speed</span>
                  <span className="font-bold text-emerald-400 text-xs">{selectedInspectorLog.latency} ms</span>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/50 border border-border">
                  <span className="text-[10px] text-muted-foreground font-sans block mb-0.5">Total Tokens</span>
                  <span className="font-bold text-foreground text-xs">
                    {selectedInspectorLog.tokensIn + selectedInspectorLog.tokensOut} t
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/50 border border-border">
                  <span className="text-[10px] text-muted-foreground font-sans block mb-0.5">Est. API Cost</span>
                  <span className="font-bold text-blue-400 text-xs">
                    ${(selectedInspectorLog.cost ?? 0).toFixed(4)}
                  </span>
                </div>
              </div>

              {/* Distributed Trace & Error Info */}
              <div className="space-y-2 text-xs">
                {selectedInspectorLog.traceId && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground font-sans text-xs">Trace ID:</span>
                      <span className="font-bold text-cyan-400">{selectedInspectorLog.traceId}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-[10px] gap-1 cursor-pointer"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedInspectorLog.traceId!);
                        setCopiedTraceId(true);
                        toast.success("Trace ID copied to clipboard");
                        setTimeout(() => setCopiedTraceId(false), 2000);
                      }}
                    >
                      {copiedTraceId ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                      {copiedTraceId ? "Copied" : "Copy Trace ID"}
                    </Button>
                  </div>
                )}

                {selectedInspectorLog.error && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono text-xs flex items-start gap-2">
                    <ShieldAlert className="size-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-rose-400 block mb-0.5 font-sans font-medium">Error Exception</span>
                      {selectedInspectorLog.error}
                    </div>
                  </div>
                )}
              </div>

              {/* JSON Payload Inspection Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
                    Raw JSON Event Schema
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-[10.5px] gap-1 cursor-pointer"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(selectedInspectorLog, null, 2));
                      setCopiedJson(true);
                      toast.success("Event JSON copied to clipboard");
                      setTimeout(() => setCopiedJson(false), 2000);
                    }}
                  >
                    {copiedJson ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                    {copiedJson ? "Copied JSON" : "Copy Payload"}
                  </Button>
                </div>

                <div className="p-3.5 rounded-lg bg-muted border border-border font-mono text-xs overflow-x-auto max-h-48 scrollbar-thin text-foreground">
                  <pre>{JSON.stringify(selectedInspectorLog, null, 2)}</pre>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
