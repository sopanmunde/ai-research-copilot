"use client";

import React from "react";
import { Globe, Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LLMProvider, ProviderType, ProviderLogo, statusDot } from "./types";

interface BrainProviderSidebarProps {
  activeTab: ProviderType;
  setActiveTab: (tab: ProviderType) => void;
  listProviders: LLMProvider[];
  selectedProviderId: string;
  selectProvider: (id: string, type: ProviderType) => void;
}

export function BrainProviderSidebar({
  activeTab,
  setActiveTab,
  listProviders,
  selectedProviderId,
  selectProvider,
}: BrainProviderSidebarProps) {
  return (
    <div data-slot="sidebar" data-sidebar="sidebar" className="w-full md:w-[230px] shrink-0 flex flex-col border-b md:border-b-0 md:border-r border-sidebar-border bg-sidebar text-sidebar-foreground max-h-[180px] md:max-h-none">
      <div data-slot="sidebar-header" className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-0.5 rounded-lg bg-sidebar-accent/50 p-0.5 border border-sidebar-border">
          {(["cloud", "local"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-semibold transition-all cursor-pointer",
                activeTab === tab
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-2xs border border-sidebar-border"
                  : "text-muted-foreground hover:text-sidebar-foreground"
              )}
            >
              {tab === "cloud" ? <Globe className="size-3" /> : <Server className="size-3" />}
              {tab === "cloud" ? "Cloud" : "Local"}
            </button>
          ))}
        </div>
      </div>

      <div data-slot="sidebar-content" className="flex-1 overflow-y-auto scrollbar-thin min-h-0 px-2 pb-3">
        <div className="space-y-1">
          {listProviders.map((p) => (
            <button
              key={p.id}
              onClick={() => selectProvider(p.id, p.type)}
              className={cn(
                "group w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left border transition-all cursor-pointer",
                selectedProviderId === p.id
                  ? "bg-sidebar-accent border-sidebar-border text-sidebar-accent-foreground shadow-2xs font-semibold"
                  : "border-transparent hover:bg-sidebar-accent/50 text-muted-foreground hover:text-sidebar-foreground"
              )}
            >
              <ProviderLogo logo={p.logo} active={p.isActive} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-[11.5px] font-semibold truncate leading-none text-foreground">
                  {p.name}
                </p>
                <p className="text-[9px] text-muted-foreground mt-1 truncate">
                  {p.models[0]}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {p.isActive && (
                  <Badge variant="outline" className="text-[8px] h-3.5 px-1 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 font-mono">
                    Active
                  </Badge>
                )}
                {statusDot(p.status)}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
