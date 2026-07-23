"use client";

import React from "react";
import { Scale, Gauge, Award, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ModelMetric, COMPARE_METRICS, ShimmerBorder, ProviderLogo } from "./types";

interface BrainMatrixTabProps {
  sortedCompareMetrics: ModelMetric[];
  selectedCompareIds: string[];
  toggleCompareId: (id: string) => void;
  handleSort: (col: keyof ModelMetric) => void;
  selectedMetrics: ModelMetric[];
  fastestComparedModel?: ModelMetric;
  cheapestComparedModel?: ModelMetric;
  highestQualityComparedModel?: ModelMetric;
}

export function BrainMatrixTab({
  sortedCompareMetrics,
  selectedCompareIds,
  toggleCompareId,
  handleSort,
  selectedMetrics,
  fastestComparedModel,
  cheapestComparedModel,
  highestQualityComparedModel,
}: BrainMatrixTabProps) {
  return (
    <div className="flex-1 p-6 overflow-y-auto scrollbar-thin space-y-6 bg-background/50">
      {/* Metrics Matrix Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="size-4 text-amber-400" />
            <h3 className="text-xs font-bold text-foreground">Model Performance Matrix</h3>
          </div>
          <span className="text-xs text-muted-foreground font-mono font-medium">Select models to compare metrics</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b border-border font-mono text-muted-foreground uppercase text-[10px]">
              <tr>
                <th className="p-3 w-10 text-center">Compare</th>
                <th className="p-3 cursor-pointer hover:text-foreground" onClick={() => handleSort("name")}>Model Name</th>
                <th className="p-3 cursor-pointer hover:text-foreground" onClick={() => handleSort("provider")}>Provider</th>
                <th className="p-3 text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("throughput")}>Throughput</th>
                <th className="p-3 text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("latency")}>Latency (TTFT)</th>
                <th className="p-3 text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("mmlu")}>MMLU Score</th>
                <th className="p-3 text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("costIn")}>Input Cost / 1M</th>
                <th className="p-3 text-center cursor-pointer hover:text-foreground" onClick={() => handleSort("context")}>Context Window</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {sortedCompareMetrics.map((m) => {
                const isChecked = selectedCompareIds.includes(m.id);
                return (
                  <tr key={m.id} className={cn("hover:bg-muted/40 transition-colors", isChecked && "bg-primary/5")}>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCompareId(m.id)}
                        className="rounded border-border text-primary accent-primary size-3.5 cursor-pointer"
                      />
                    </td>
                    <td className="p-3 font-mono font-medium text-foreground">{m.name}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <ProviderLogo logo={m.providerLogo} active={false} size="sm" />
                        <span className="font-semibold text-foreground">{m.provider}</span>
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono font-semibold text-foreground">{m.throughput} <span className="text-[10px] text-muted-foreground">t/s</span></td>
                    <td className="p-3 text-right font-mono text-foreground">{m.latency} ms</td>
                    <td className="p-3 text-right font-mono font-medium text-emerald-600 dark:text-emerald-400">{m.mmlu}%</td>
                    <td className="p-3 text-right font-mono text-foreground">${m.costIn.toFixed(2)}</td>
                    <td className="p-3 text-center font-mono text-muted-foreground">{m.context}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Side by Side Comparative Bar Charts */}
        {selectedCompareIds.length >= 2 ? (
          <div className="grid grid-cols-2 gap-4">
            {/* Left: Speed Comparison */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Gauge className="size-4 text-primary" />
                Throughput Comparison
              </h4>
              <div className="space-y-3 pt-2">
                {selectedMetrics.map((m) => {
                  const maxTh = Math.max(...COMPARE_METRICS.map(x => x.throughput));
                  const percent = (m.throughput / maxTh) * 100;
                  return (
                    <div key={m.id} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono text-foreground">{m.name}</span>
                        <span className="font-semibold text-foreground">{m.throughput} t/s</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Accuracy/Quality Compare */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Award className="size-4 text-primary" />
                MMLU Accuracy Comparison
              </h4>
              <div className="space-y-3 pt-2">
                {selectedMetrics.map((m) => {
                  return (
                    <div key={m.id} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono text-foreground">{m.name}</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{m.mmlu}%</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${m.mmlu}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cost Comparison (colspan-2) */}
            <div className="col-span-2 rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Activity className="size-4 text-primary" />
                Cost Comparison (per 1M input tokens)
              </h4>
              <div className="space-y-3 pt-2">
                {selectedMetrics.map((m) => {
                  const maxCost = Math.max(...COMPARE_METRICS.map(x => x.costIn), 1);
                  const percent = (m.costIn / maxCost) * 100;
                  return (
                    <div key={m.id} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono text-foreground">{m.name}</span>
                        <span className="font-semibold text-foreground">${m.costIn.toFixed(3)}</span>
                      </div>
                      <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="bg-primary/60 h-full rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Head-to-Head Winner Badges */}
            <div className="col-span-2 grid grid-cols-3 gap-3">
              <div className="border border-border rounded-lg p-3 bg-muted/20 text-center">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Fastest Option</p>
                <p className="text-xs font-bold text-foreground font-mono truncate">{fastestComparedModel?.name}</p>
                <Badge variant="secondary" className="mt-1 text-[9px] bg-primary/10 text-primary border-none">{fastestComparedModel?.throughput} t/s</Badge>
              </div>
              <div className="border border-border rounded-lg p-3 bg-muted/20 text-center">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Most Cost-Effective</p>
                <p className="text-xs font-bold text-foreground font-mono truncate">{cheapestComparedModel?.name}</p>
                <Badge variant="secondary" className="mt-1 text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none">${cheapestComparedModel?.costIn.toFixed(2)}/1M</Badge>
              </div>
              <div className="border border-border rounded-lg p-3 bg-muted/20 text-center">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Highest Accuracy</p>
                <p className="text-xs font-bold text-foreground font-mono truncate">{highestQualityComparedModel?.name}</p>
                <Badge variant="secondary" className="mt-1 text-[9px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none">{highestQualityComparedModel?.mmlu}% MMLU</Badge>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
            <Scale className="size-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs font-semibold text-foreground">Head-to-Head Comparison</p>
            <p className="text-[11px] text-muted-foreground mt-1">Select at least 2 models using the checkboxes in the matrix table above to plot relative stats.</p>
          </div>
        )}
      </div>
    </div>
  );
}
