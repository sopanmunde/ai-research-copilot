"use client";

import React from "react";
import {
  Plug,
  CheckCircle2,
  Zap,
  Gauge,
  Info,
  Plus,
  Eye,
  EyeOff,
  Check,
  Key,
  Trash2,
  RefreshCw,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  LLMProvider,
  ApiKey,
  SETUP_INSTRUCTIONS,
  ShimmerBorder,
  StatusChip,
} from "./types";

interface BrainConfigTabProps {
  provider: LLMProvider;
  activateProvider: (id: string) => void;
  testConnection: (id: string) => void;
  testingId: string | null;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  temperature: number;
  setTemperature: (val: number) => void;
  maxTokens: number;
  setMaxTokens: (val: number) => void;
  topP: number;
  setTopP: (val: number) => void;
  systemPrompt: string;
  setSystemPrompt: (val: string) => void;
  benchmarkStatus: "idle" | "running" | "done";
  runSpeedBenchmark: () => void;
  benchmarkProgress: number;
  benchmarkSpeed: number;
  benchmarkLatency: number;
  endpoint: string;
  setLocalEndpoint: (url: string) => void;
  setEndpointEdited: (val: boolean) => void;
  providerKeys: ApiKey[];
  addKeyMode: boolean;
  setAddKeyMode: (val: boolean) => void;
  newLabel: string;
  setNewLabel: (val: string) => void;
  newKeyVal: string;
  setNewKeyVal: (val: string) => void;
  showKey: boolean;
  setShowKey: (val: boolean) => void;
  saveKey: () => void;
  deleteKey: (id: string) => void;
  toggleKey: (id: string) => void;
}

export function BrainConfigTab({
  provider,
  activateProvider,
  testConnection,
  testingId,
  selectedModel,
  setSelectedModel,
  temperature,
  setTemperature,
  maxTokens,
  setMaxTokens,
  topP,
  setTopP,
  systemPrompt,
  setSystemPrompt,
  benchmarkStatus,
  runSpeedBenchmark,
  benchmarkProgress,
  benchmarkSpeed,
  benchmarkLatency,
  endpoint,
  setLocalEndpoint,
  setEndpointEdited,
  providerKeys,
  addKeyMode,
  setAddKeyMode,
  newLabel,
  setNewLabel,
  newKeyVal,
  setNewKeyVal,
  showKey,
  setShowKey,
  saveKey,
  deleteKey,
  toggleKey,
}: BrainConfigTabProps) {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin min-h-0">
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
        {/* Provider Setup Controls */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-5 relative overflow-hidden shadow-xs">
          <ShimmerBorder />
          <div className="flex items-start justify-between relative z-20">
            <div>
              <h3 className="text-xs font-bold text-foreground">API Connection</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Control connectivity and endpoints</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm" variant="outline"
                className="h-8 text-xs gap-1.5 border-border cursor-pointer"
                disabled={testingId === provider.id}
                onClick={() => testConnection(provider.id)}
              >
                {testingId === provider.id ? (
                  <RefreshCw className="size-3 animate-spin" />
                ) : (
                  <Plug className="size-3" />
                )}
                Test Connection
              </Button>
              <Button
                size="sm"
                className={cn("h-8 text-xs gap-1.5 cursor-pointer",
                  provider.isActive
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : "bg-foreground/10 text-foreground border border-border hover:bg-foreground/20"
                )}
                onClick={() => { if (!provider.isActive) activateProvider(provider.id); }}
              >
                {provider.isActive ? <><CheckCircle2 className="size-3" /> Activated</> : <><Zap className="size-3" /> Set Active</>}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Model & Parameters layout */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-foreground block mb-1.5">Model Selection</label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="h-9 text-xs bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {provider.models.map((m) => (
                    <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-foreground block mb-1.5">Temperature</label>
              <div className="flex items-center gap-3">
                <input
                  type="range" min="0" max="2" step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-primary bg-primary/20 h-1.5 rounded-lg cursor-pointer"
                />
                <span className="text-xs font-mono bg-muted border border-border rounded px-1.5 py-0.5 shrink-0">{temperature.toFixed(1)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-foreground block mb-1.5">Max Tokens</label>
              <div className="flex items-center gap-3">
                <input
                  type="range" min="256" max="8192" step="256"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full accent-primary bg-primary/20 h-1.5 rounded-lg cursor-pointer"
                />
                <span className="text-[11px] font-mono bg-muted border border-border rounded px-1.5 py-0.5 shrink-0">{maxTokens}</span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-foreground block mb-1.5">Top-P</label>
              <div className="flex items-center gap-3">
                <input
                  type="range" min="0.1" max="1.0" step="0.05"
                  value={topP}
                  onChange={(e) => setTopP(parseFloat(e.target.value))}
                  className="w-full accent-primary bg-primary/20 h-1.5 rounded-lg cursor-pointer"
                />
                <span className="text-xs font-mono bg-muted border border-border rounded px-1.5 py-0.5 shrink-0">{topP.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-foreground block mb-1.5">System Prompt Override</label>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Define general instructions for the active brain..."
              className="text-xs min-h-[60px] bg-background border-border"
            />
          </div>
        </div>

        {/* Benchmark Dashboard Card */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 relative overflow-hidden shadow-xs">
          <ShimmerBorder />
          <div className="flex items-center justify-between relative z-20">
            <div>
              <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Gauge className="size-4 text-muted-foreground" />
                Performance Benchmarks
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Run throughput test for the active configuration</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs border-border cursor-pointer"
              disabled={benchmarkStatus === "running"}
              onClick={runSpeedBenchmark}
            >
              {benchmarkStatus === "running" ? "Running Test…" : "Start Speed Test"}
            </Button>
          </div>

          {benchmarkStatus !== "idle" && (
            <div className="space-y-2 border border-border bg-muted/20 rounded-lg p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Speed benchmark progress</span>
                <span className="font-semibold">{benchmarkProgress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-150"
                  style={{ width: `${benchmarkProgress}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-background rounded-md border border-border p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">Tokens per Second</p>
                  <p className="text-lg font-bold text-foreground">{benchmarkSpeed} <span className="text-xs font-normal">t/s</span></p>
                </div>
                <div className="bg-background rounded-md border border-border p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">Response Latency (TTFT)</p>
                  <p className="text-lg font-bold text-foreground">{benchmarkLatency} <span className="text-xs font-normal">ms</span></p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Local Endpoint or API Credentials */}
        {provider.type === "local" ? (
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-foreground">Local Endpoint Settings</h3>
              <StatusChip status={provider.status} />
            </div>
            <div className="flex gap-2">
              <Input
                value={endpoint}
                onChange={(e) => { setLocalEndpoint(e.target.value); setEndpointEdited(true); }}
                placeholder="http://localhost:11434"
                className="h-9 text-xs font-mono bg-background border-border"
              />
              <Button
                size="sm" variant="outline"
                className="h-9 text-xs gap-1.5 shrink-0 border-border cursor-pointer"
                disabled={testingId === provider.id}
                onClick={() => testConnection(provider.id)}
              >
                {testingId === provider.id
                  ? <RefreshCw className="size-3 animate-spin" />
                  : <Wifi className="size-3" />}
                Ping
              </Button>
            </div>

            {SETUP_INSTRUCTIONS[provider.id] && (
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-start gap-2.5">
                  <Info className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] font-semibold text-foreground mb-1.5">Local Server Instructions</p>
                    {SETUP_INSTRUCTIONS[provider.id]}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-foreground">API Credentials</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Configure authentication headers</p>
              </div>
              <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1 border-border cursor-pointer" onClick={() => setAddKeyMode(true)}>
                <Plus className="size-3" /> Add Key
              </Button>
            </div>

            {addKeyMode && (
              <div className="mb-4 rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <p className="text-[11px] font-semibold text-foreground">New API Key</p>
                <Input
                  placeholder="Label (e.g. Production, Development)"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="h-8 text-xs bg-background border-border"
                />
                <div className="relative">
                  <Input
                    type={showKey ? "text" : "password"}
                    placeholder={`Paste your ${provider.name} API key…`}
                    value={newKeyVal}
                    onChange={(e) => setNewKeyVal(e.target.value)}
                    className="h-8 text-xs font-mono bg-background border-border pr-9"
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="h-8 text-xs flex-1 bg-foreground text-background hover:bg-foreground/90 cursor-pointer"
                    disabled={!newLabel.trim() || !newKeyVal.trim()}
                    onClick={saveKey}
                  >
                    <Check className="size-3 mr-1" /> Save Key
                  </Button>
                  <Button
                    size="sm" variant="outline"
                    className="h-8 text-xs border-border cursor-pointer"
                    onClick={() => { setAddKeyMode(false); setNewLabel(""); setNewKeyVal(""); }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {providerKeys.length > 0 ? (
              <div className="space-y-2">
                {providerKeys.map((k) => (
                  <div key={k.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 text-xs">
                    <div>
                      <p className="font-semibold text-foreground">{k.label}</p>
                      <p className="font-mono text-muted-foreground text-[10px] mt-0.5">{k.key}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer" onClick={() => toggleKey(k.id)}>
                            <Check className={cn("size-3.5", k.isActive && "text-emerald-500")} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{k.isActive ? "Deactivate" : "Activate"}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive cursor-pointer" onClick={() => deleteKey(k.id)}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete key</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            ) : !addKeyMode ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 py-8 text-center">
                <Key className="size-6 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs font-semibold text-foreground">Credentials Missing</p>
                <p className="text-[11px] text-muted-foreground mt-1 mb-3">
                  Connect {provider.name} to start generating playground tokens.
                </p>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-border cursor-pointer" onClick={() => setAddKeyMode(true)}>
                  <Plus className="size-3" /> Add Key
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
