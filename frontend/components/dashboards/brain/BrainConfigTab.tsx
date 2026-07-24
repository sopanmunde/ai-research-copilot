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
  SlidersHorizontal,
  Sliders,
  ShieldCheck,
  Sparkles,
  Server,
  Globe,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  LLMProvider,
  ApiKey,
  SETUP_INSTRUCTIONS,
  ShimmerBorder,
  StatusChip,
  ProviderLogo,
} from "./types";
import { toast } from "sonner";

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
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("API Key copied to clipboard");
  };

  return (
    <TooltipProvider>
      <div className="flex-1 overflow-y-auto scrollbar-thin min-h-0 bg-background/40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          
          {/* Provider Spotlight Header */}
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-card to-background p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <ProviderLogo logo={provider.logo} active={provider.isActive} size="md" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-foreground">{provider.name}</h2>
                  <StatusChip status={provider.status} />
                  {provider.isActive && (
                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                      ACTIVE ENGINE
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                  {provider.type === "local" ? "Local Hardware Engine" : "Cloud Hosted API Gateway"} • {provider.models?.length || 0} Models Available
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="h-8.5 text-xs font-semibold gap-1.5 border-border cursor-pointer"
                disabled={testingId === provider.id}
                onClick={() => testConnection(provider.id)}
              >
                {testingId === provider.id ? (
                  <RefreshCw className="size-3.5 animate-spin text-primary" />
                ) : (
                  <Plug className="size-3.5 text-muted-foreground" />
                )}
                Test Connection
              </Button>
              <Button
                size="sm"
                className={cn(
                  "h-8.5 text-xs font-semibold gap-1.5 cursor-pointer transition-all",
                  provider.isActive
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs"
                    : "bg-foreground text-background hover:bg-foreground/90"
                )}
                onClick={() => { if (!provider.isActive) activateProvider(provider.id); }}
              >
                {provider.isActive ? (
                  <><CheckCircle2 className="size-3.5" /> Engine Active</>
                ) : (
                  <><Zap className="size-3.5" /> Set as Default</>
                )}
              </Button>
            </div>
          </div>

          {/* Model & Hyperparameter Settings Card */}
          <Card className="relative overflow-hidden border-border/80 shadow-xs">
            <ShimmerBorder />
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Sliders className="size-4 text-primary" />
                    Model Hyperparameters &amp; Prompt Directive
                  </CardTitle>
                  <CardDescription className="text-[11px] text-muted-foreground mt-0.5">
                    Tune inference temperature, context limits, top-P, and active model target
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-5 space-y-5">
              {/* Model & Temperature */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-foreground flex items-center justify-between">
                    <span>Default Model Target</span>
                    <span className="text-[10px] text-muted-foreground font-normal">{provider.models.length} models</span>
                  </label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="h-9 text-xs bg-background border-border font-mono font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent font-mono className="text-xs">
                      {provider.models.map((m) => (
                        <SelectItem key={m} value={m} className="text-xs font-mono">{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-foreground">Temperature</span>
                    <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">{temperature.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <input
                      type="range" min="0" max="2" step="0.05"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full accent-primary bg-primary/20 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-muted-foreground font-mono">
                    <button type="button" onClick={() => setTemperature(0.2)} className="hover:text-foreground">Precise (0.2)</button>
                    <button type="button" onClick={() => setTemperature(0.7)} className="hover:text-foreground">Balanced (0.7)</button>
                    <button type="button" onClick={() => setTemperature(1.2)} className="hover:text-foreground">Creative (1.2)</button>
                  </div>
                </div>
              </div>

              {/* Max Tokens & Top-P */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-foreground">Max Generation Tokens</span>
                    <span className="font-mono text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">{maxTokens} tok</span>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <input
                      type="range" min="256" max="8192" step="256"
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                      className="w-full accent-blue-500 bg-blue-500/20 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-muted-foreground font-mono">
                    <button type="button" onClick={() => setMaxTokens(1024)} className="hover:text-foreground">1k</button>
                    <button type="button" onClick={() => setMaxTokens(2048)} className="hover:text-foreground">2k</button>
                    <button type="button" onClick={() => setMaxTokens(4096)} className="hover:text-foreground">4k</button>
                    <button type="button" onClick={() => setMaxTokens(8192)} className="hover:text-foreground">8k</button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-foreground">Top-P Sampling</span>
                    <span className="font-mono text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">{topP.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <input
                      type="range" min="0.1" max="1.0" step="0.05"
                      value={topP}
                      onChange={(e) => setTopP(parseFloat(e.target.value))}
                      className="w-full accent-purple-500 bg-purple-500/20 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-muted-foreground font-mono">
                    <button type="button" onClick={() => setTopP(0.5)} className="hover:text-foreground">Focused (0.5)</button>
                    <button type="button" onClick={() => setTopP(0.9)} className="hover:text-foreground">Standard (0.9)</button>
                    <button type="button" onClick={() => setTopP(1.0)} className="hover:text-foreground">Full (1.0)</button>
                  </div>
                </div>
              </div>

              {/* System Prompt Override */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold text-foreground flex items-center justify-between">
                  <span>System Directive Prompt</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Global instructions for LLM completions</span>
                </label>
                <Textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Define role and rules for the active AI model..."
                  className="text-xs min-h-[75px] bg-background border-border p-3 leading-relaxed resize-y font-mono"
                />
              </div>
            </CardContent>
          </Card>

          {/* Benchmark Performance Card */}
          <Card className="relative overflow-hidden border-border/80 shadow-xs">
            <ShimmerBorder />
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Gauge className="size-4 text-emerald-400" />
                    Speed &amp; Latency Benchmark
                  </CardTitle>
                  <CardDescription className="text-[11px] text-muted-foreground mt-0.5">
                    Evaluate token generation rate and TTFT latency for {provider.name}
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-bold gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 cursor-pointer"
                  disabled={benchmarkStatus === "running"}
                  onClick={runSpeedBenchmark}
                >
                  {benchmarkStatus === "running" ? (
                    <RefreshCw className="size-3.5 animate-spin" />
                  ) : (
                    <Gauge className="size-3.5" />
                  )}
                  {benchmarkStatus === "running" ? "Testing…" : "Run Benchmark"}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              {benchmarkStatus !== "idle" ? (
                <div className="space-y-3.5 border border-border bg-muted/20 rounded-xl p-4">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">Benchmark Progress</span>
                    <span className="font-mono text-emerald-400">{benchmarkProgress}%</span>
                  </div>
                  <Progress value={benchmarkProgress} className="h-2 bg-muted" />

                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="bg-card rounded-lg border border-border/80 p-3.5 text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Token Throughput Speed</p>
                      <p className="text-xl font-black font-mono text-emerald-400 mt-1">{benchmarkSpeed} <span className="text-xs font-semibold text-muted-foreground">tok/s</span></p>
                    </div>
                    <div className="bg-card rounded-lg border border-border/80 p-3.5 text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Response TTFT Latency</p>
                      <p className="text-xl font-black font-mono text-blue-400 mt-1">{benchmarkLatency} <span className="text-xs font-semibold text-muted-foreground">ms</span></p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-dashed border-border bg-muted/10">
                  <div className="flex items-center gap-3">
                    <Sparkles className="size-5 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-foreground">Ready to Benchmark</p>
                      <p className="text-[11px] text-muted-foreground">Click "Run Benchmark" to measure real-time latency and throughput.</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Credentials / Local Server Settings Card */}
          {provider.type === "local" ? (
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <Server className="size-4 text-cyan-400" />
                      Local Server Endpoint
                    </CardTitle>
                    <CardDescription className="text-[11px] text-muted-foreground mt-0.5">
                      Configure Ollama or LM Studio local host address
                    </CardDescription>
                  </div>
                  <StatusChip status={provider.status} />
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={endpoint}
                    onChange={(e) => { setLocalEndpoint(e.target.value); setEndpointEdited(true); }}
                    placeholder="http://localhost:11434"
                    className="h-9 text-xs font-mono bg-background border-border"
                  />
                  <Button
                    size="sm" variant="outline"
                    className="h-9 text-xs font-semibold gap-1.5 shrink-0 border-border cursor-pointer"
                    disabled={testingId === provider.id}
                    onClick={() => testConnection(provider.id)}
                  >
                    {testingId === provider.id ? (
                      <RefreshCw className="size-3.5 animate-spin" />
                    ) : (
                      <Wifi className="size-3.5" />
                    )}
                    Ping Gateway
                  </Button>
                </div>

                {SETUP_INSTRUCTIONS[provider.id] && (
                  <div className="rounded-xl border border-border bg-muted/20 p-4">
                    <div className="flex items-start gap-2.5">
                      <Info className="size-4 text-cyan-400 mt-0.5 shrink-0" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-foreground">Local Server Instructions</p>
                        <div className="text-[11px] text-muted-foreground leading-relaxed">
                          {SETUP_INSTRUCTIONS[provider.id]}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <ShieldCheck className="size-4 text-indigo-400" />
                      API Credentials &amp; Security Keys
                    </CardTitle>
                    <CardDescription className="text-[11px] text-muted-foreground mt-0.5">
                      Manage authentication headers for {provider.name}
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-bold gap-1 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 cursor-pointer"
                    onClick={() => setAddKeyMode(true)}
                  >
                    <Plus className="size-3.5" /> Add API Key
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-4">
                {addKeyMode && (
                  <div className="mb-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4 space-y-3">
                    <p className="text-xs font-bold text-foreground">Register New API Key</p>
                    <Input
                      placeholder="Label (e.g. Production Key, Staging)"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      className="h-8.5 text-xs bg-background border-border"
                    />
                    <div className="relative">
                      <Input
                        type={showKey ? "text" : "password"}
                        placeholder={`Paste your ${provider.name} API key…`}
                        value={newKeyVal}
                        onChange={(e) => setNewKeyVal(e.target.value)}
                        className="h-8.5 text-xs font-mono bg-background border-border pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        className="h-8 text-xs font-bold flex-1 bg-foreground text-background hover:bg-foreground/90 cursor-pointer"
                        disabled={!newLabel.trim() || !newKeyVal.trim()}
                        onClick={saveKey}
                      >
                        <Check className="size-3.5 mr-1" /> Save Key
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
                  <div className="space-y-2.5">
                    {providerKeys.map((k) => (
                      <div key={k.id} className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-muted/20 text-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-foreground">{k.label}</p>
                            {k.isActive ? (
                              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[9px] font-mono">ACTIVE</Badge>
                            ) : (
                              <Badge variant="outline" className="text-[9px] font-mono text-muted-foreground">INACTIVE</Badge>
                            )}
                          </div>
                          <p className="font-mono text-muted-foreground text-[10.5px]">{k.key}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm" variant="ghost"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                                onClick={() => copyToClipboard(k.key)}
                              >
                                <Copy className="size-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy key</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm" variant="ghost"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-emerald-500 cursor-pointer"
                                onClick={() => toggleKey(k.id)}
                              >
                                <Check className={cn("size-3.5", k.isActive && "text-emerald-500")} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{k.isActive ? "Deactivate" : "Activate"}</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm" variant="ghost"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                                onClick={() => deleteKey(k.id)}
                              >
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
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/10 py-8 text-center">
                    <Key className="size-7 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs font-bold text-foreground">No API Credentials Configured</p>
                    <p className="text-[11px] text-muted-foreground mt-1 mb-3 max-w-sm">
                      Connect your {provider.name} API key to enable live LLM request routing and performance benchmarks.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs font-bold gap-1 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 cursor-pointer"
                      onClick={() => setAddKeyMode(true)}
                    >
                      <Plus className="size-3.5" /> Add Key
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </TooltipProvider>
  );
}
