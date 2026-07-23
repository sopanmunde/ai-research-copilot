"use client";

import React from "react";
import { TrendingUp, Flame, Cpu, Shield } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { WEEKLY_TOKEN_DATA, LLMProvider } from "./types";

interface BrainUsageSidebarProps {
  providers?: LLMProvider[];
}

export function BrainUsageSidebar({ providers = [] }: BrainUsageSidebarProps) {
  const totalTokens = providers.reduce((acc, p) => acc + (p.usageTokens || 0), 0);
  const activeProvidersWithUsage = providers.filter((p) => (p.usageTokens || 0) > 0);

  let allocationList = activeProvidersWithUsage
    .map((p) => {
      const percent = totalTokens > 0 ? Math.round(((p.usageTokens || 0) / totalTokens) * 100) : 0;
      return { name: p.name, percent };
    })
    .filter((x) => x.percent > 0)
    .sort((a, b) => b.percent - a.percent);

  if (allocationList.length === 0) {
    allocationList = [
      { name: "OpenAI", percent: 80 },
      { name: "Mistral", percent: 15 },
      { name: "Others", percent: 5 }
    ];
  }

  const barColors = ["bg-primary", "bg-primary/60", "bg-primary/30", "bg-primary/10"];

  return (
    <div className="w-[260px] shrink-0 flex flex-col border-l border-border bg-card">
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-muted-foreground" />
          <h3 className="text-xs font-bold text-foreground">Usage Visualization</h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin min-h-0">
        <div className="p-4 space-y-6">
          {/* Token Chart */}
          <div>
            <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Weekly token load</h4>
            <div className="h-32 flex items-end justify-between gap-1 pt-2 px-1">
              {WEEKLY_TOKEN_DATA.map((d) => {
                const maxVal = Math.max(...WEEKLY_TOKEN_DATA.map(x => x.tokens));
                const percent = (d.tokens / maxVal) * 100;
                return (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="w-full bg-gradient-to-t from-primary/30 to-primary rounded-t-sm transition-all duration-200 cursor-pointer hover:opacity-90 shadow-xs"
                          style={{ height: `${percent}%` }}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-[10px]">
                        {d.tokens.toLocaleString()} tokens
                      </TooltipContent>
                    </Tooltip>
                    <span className="text-[9px] text-muted-foreground font-mono leading-none">{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Provider share distribution bar */}
          <div>
            <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Provider allocation</h4>
            <div className="h-2 w-full rounded-full overflow-hidden flex bg-muted/40">
              {allocationList.map((item, idx) => (
                <div
                  key={item.name}
                  className={`h-full ${barColors[idx % barColors.length]}`}
                  style={{ width: `${item.percent}%` }}
                  title={`${item.name} (${item.percent}%)`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3">
              {allocationList.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
                  <span className={`size-1.5 rounded-full ${barColors[idx % barColors.length]}`} />
                  <span>{item.name} ({item.percent}%)</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Parameter Details Guide */}
          <div>
            <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Configuration Tips</h4>
            <div className="space-y-3">
              {[
                { icon: Flame, title: "Low Temperature (0.1 - 0.4)", text: "Ideal for syntax check, database querying, structured JSON results." },
                { icon: Cpu, title: "Model Token Costs", text: "GPT-4o-mini reduces costs by 90% compared to standard GPT-4-turbo." },
                { icon: Shield, title: "Security Protocols", text: "Keys stored strictly in client memory. Never transmitted outside CORS endpoints." },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-2 text-[10px] text-muted-foreground">
                  <Icon className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">{title}</p>
                    <p className="leading-normal mt-0.5">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
