"use client";

import React from "react";
import {
  Sparkles,
  Terminal,
  Activity,
  Sliders,
  Send,
  RefreshCw,
  Clock,
  Zap,
  Gauge,
  Layers,
  Award,
  ChevronRight,
  LineChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ModelMetric,
  WEEKLY_TOKEN_DATA,
  ShimmerBorder,
  MainTabType,
} from "./types";

interface BrainOverviewTabProps {
  liveTtft: number;
  liveTokensPerSec: number;
  liveReqPerMin: number;
  liveVectorLatency: number;
  fastestComparedModel?: ModelMetric;
  cheapestComparedModel?: ModelMetric;
  highestQualityComparedModel?: ModelMetric;
  setMainTab: (tab: MainTabType) => void;
}

export function BrainOverviewTab({
  liveTtft,
  liveTokensPerSec,
  liveReqPerMin,
  liveVectorLatency,
  fastestComparedModel,
  cheapestComparedModel,
  highestQualityComparedModel,
  setMainTab,
}: BrainOverviewTabProps) {
  return (
    <div className="flex-1 p-6 overflow-y-auto scrollbar-thin space-y-6 bg-background/50">
      {/* Banner: Command Center Welcome & Quick Actions */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-card to-background p-6 shadow-xs">
        <ShimmerBorder />
        <div className="relative z-20 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs font-bold px-2.5 py-0.5">
                UNIFIED COMMAND CENTER
              </Badge>
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
              <span className="text-xs font-bold text-emerald-400">All Engines Operational</span>
            </div>
            <h2 className="text-xl font-extrabold text-foreground tracking-tight">
              TriVisionX Brain Intelligence Command Center
            </h2>
            <p className="text-xs font-medium text-muted-foreground leading-relaxed">
              Orchestrate active AI models, monitor live token streaming, and evaluate benchmarks from a single unified workspace.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setMainTab("telemetry")}
              className="h-9 text-xs font-bold gap-2 border-emerald-500/40 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 shadow-xs cursor-pointer"
            >
              <Activity className="size-4" /> Open Live Telemetry
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setMainTab("configure")}
              className="h-9 text-xs font-bold gap-2 border-blue-500/40 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 shadow-xs cursor-pointer"
            >
              <Sliders className="size-4" /> Configs
            </Button>
          </div>
        </div>
      </div>

      {/* Section 1.5: Real-Time Telemetry Live Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border/80 bg-card flex items-center justify-between shadow-xs hover:border-emerald-500/40 transition-all cursor-pointer" onClick={() => setMainTab("telemetry")}>
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
              <Clock className="size-3.5 text-emerald-400" /> Active Latency (TTFT)
            </p>
            <p className="text-2xl font-black font-mono text-foreground mt-1">{liveTtft} <span className="text-xs font-semibold text-muted-foreground">ms</span></p>
          </div>
          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-bold">Fast</Badge>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card flex items-center justify-between shadow-xs hover:border-blue-500/40 transition-all cursor-pointer" onClick={() => setMainTab("telemetry")}>
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
              <Zap className="size-3.5 text-blue-400" /> Token Stream Speed
            </p>
            <p className="text-2xl font-black font-mono text-foreground mt-1">{liveTokensPerSec} <span className="text-xs font-semibold text-muted-foreground">tok/s</span></p>
          </div>
          <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-[10px] font-bold">Realtime</Badge>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card flex items-center justify-between shadow-xs hover:border-indigo-500/40 transition-all cursor-pointer" onClick={() => setMainTab("telemetry")}>
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
              <Gauge className="size-3.5 text-indigo-400" /> Active Throughput
            </p>
            <p className="text-2xl font-black font-mono text-foreground mt-1">{liveReqPerMin} <span className="text-xs font-semibold text-muted-foreground">req/min</span></p>
          </div>
          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-bold">99.85%</Badge>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card flex items-center justify-between shadow-xs hover:border-purple-500/40 transition-all cursor-pointer" onClick={() => setMainTab("telemetry")}>
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
              <Layers className="size-3.5 text-purple-400" /> Vector RAG Search
            </p>
            <p className="text-2xl font-black font-mono text-foreground mt-1">{liveVectorLatency} <span className="text-xs font-semibold text-muted-foreground">ms</span></p>
          </div>
          <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/30 text-[10px] font-bold">94.2% Cache</Badge>
        </div>
      </div>

      {/* Section 2: Performance Matrix Winners & Allocation Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Head-to-Head Winner Badges */}
        <div className="p-5 rounded-xl border border-border/80 bg-card space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Award className="size-4 text-amber-400" />
              <h3 className="text-sm font-extrabold text-foreground">Engine Benchmark Highlights</h3>
            </div>
            <Button size="sm" variant="ghost" className="h-6 text-xs p-0 text-muted-foreground hover:text-foreground font-semibold cursor-pointer" onClick={() => setMainTab("matrix")}>
              Full Matrix <ChevronRight className="size-3" />
            </Button>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-lg border border-border bg-muted/20 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Fastest Engine</p>
                <p className="text-xs font-extrabold font-mono text-foreground mt-0.5">{fastestComparedModel?.name}</p>
              </div>
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs font-mono font-bold">
                {fastestComparedModel?.throughput} t/s
              </Badge>
            </div>

            <div className="p-3 rounded-lg border border-border bg-muted/20 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Most Cost Effective</p>
                <p className="text-xs font-extrabold font-mono text-foreground mt-0.5">{cheapestComparedModel?.name}</p>
              </div>
              <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-xs font-mono font-bold">
                ${cheapestComparedModel?.costIn.toFixed(2)} / 1M
              </Badge>
            </div>

            <div className="p-3 rounded-lg border border-border bg-muted/20 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Highest Accuracy</p>
                <p className="text-xs font-extrabold font-mono text-foreground mt-0.5">{highestQualityComparedModel?.name}</p>
              </div>
              <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/30 text-xs font-mono font-bold">
                {highestQualityComparedModel?.mmlu}% MMLU
              </Badge>
            </div>
          </div>
        </div>

        {/* Provider Allocation & Token Load Overview (2 Cols) */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-border/80 bg-card space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <LineChart className="size-4 text-indigo-400" />
              <h3 className="text-sm font-extrabold text-foreground">Weekly Token Usage &amp; Distribution Overview</h3>
            </div>
            <span className="text-xs font-mono text-muted-foreground font-bold">5.37M Cumulative Tokens</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
            {/* Weekly Token Load Bars */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground">Weekly Token Load Timeline</p>
              <div className="h-36 flex items-end justify-between gap-1.5 pt-2">
                {WEEKLY_TOKEN_DATA.map((d) => {
                  const maxVal = Math.max(...WEEKLY_TOKEN_DATA.map(x => x.tokens));
                  const percent = (d.tokens / maxVal) * 100;
                  return (
                    <div key={d.day} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                      <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-white text-[9px] font-mono px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-20">
                        {d.tokens.toLocaleString()}
                      </div>
                      <div
                        className="w-full bg-gradient-to-t from-primary/30 to-primary rounded-t-sm transition-all duration-200 group-hover:bg-emerald-400"
                        style={{ height: `${percent}%` }}
                      />
                      <span className="text-[10px] text-muted-foreground font-mono font-semibold">{d.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Provider Share */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-muted-foreground">Active Provider Share Distribution</p>
              <div className="h-3.5 w-full rounded-full overflow-hidden flex bg-muted/60 border border-border/60 p-0.5">
                <div className="h-full bg-emerald-500 rounded-l-full" style={{ width: "42%" }} title="OpenAI (42%)" />
                <div className="h-full bg-purple-500" style={{ width: "28%" }} title="Anthropic (28%)" />
                <div className="h-full bg-blue-500" style={{ width: "18%" }} title="Google (18%)" />
                <div className="h-full bg-amber-500" style={{ width: "8%" }} title="Groq (8%)" />
                <div className="h-full bg-cyan-500 rounded-r-full" style={{ width: "4%" }} title="Local (4%)" />
              </div>
              <div className="space-y-2 pt-1 font-mono text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center gap-1.5 text-foreground font-semibold"><span className="size-2.5 rounded-full bg-emerald-500" /> OpenAI GPT-4o</span>
                  <span className="font-bold text-emerald-400">42%</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center gap-1.5 text-foreground font-semibold"><span className="size-2.5 rounded-full bg-purple-500" /> Anthropic Claude</span>
                  <span className="font-bold text-purple-400">28%</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center gap-1.5 text-foreground font-semibold"><span className="size-2.5 rounded-full bg-blue-500" /> Google AI Gemini</span>
                  <span className="font-bold text-blue-400">18%</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center gap-1.5 text-foreground font-semibold"><span className="size-2.5 rounded-full bg-cyan-500" /> Local Ollama</span>
                  <span className="font-bold text-cyan-400">4%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
