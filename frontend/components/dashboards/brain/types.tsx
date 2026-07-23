"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type ProviderType = "cloud" | "local";
export type ProviderStatus = "connected" | "disconnected" | "testing" | "error";
export type MainTabType = "overview" | "telemetry" | "configure" | "playground" | "matrix";

export interface LLMProvider {
  id: string;
  name: string;
  type: ProviderType;
  logo: string;
  description: string;
  models: string[];
  status: ProviderStatus;
  isActive: boolean;
  endpoint?: string;
  usageTokens?: number;
  usageCost?: number;
  latency?: number;
  tokensPerSec?: number;
}

export interface ApiKey {
  id: string;
  providerId: string;
  label: string;
  key: string;
  createdAt: string;
  lastUsed: string;
  isActive: boolean;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  modelUsed?: string;
}

export interface ModelMetric {
  id: string;
  name: string;
  provider: string;
  providerLogo: string;
  costIn: number;
  costOut: number;
  throughput: number;
  latency: number;
  context: string;
  mmlu: number;
}

export interface TelemetryLog {
  id: string;
  timestamp: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  latency: number;
  status: number;
  traceId?: string;
  cost?: number;
  error?: string;
  cacheHit?: boolean;
}

export const WEEKLY_TOKEN_DATA = [
  { day: "Mon", tokens: 210000 },
  { day: "Tue", tokens: 340000 },
  { day: "Wed", tokens: 490000 },
  { day: "Thu", tokens: 320000 },
  { day: "Fri", tokens: 580000 },
  { day: "Sat", tokens: 190000 },
  { day: "Sun", tokens: 350000 },
];

export const SIMULATED_RESPONSES: Record<string, string[]> = {
  general: [
    "Sure! As an AI model running via selected provider, I'm fully initialized and responding with the exact parameters you configured.",
    "This is a live stream demonstration from the playground. Your model configuration looks solid!",
    "Here is a code snippet matching your system settings:\n\n```python\nimport openai\n\nresponse = openai.ChatCompletion.create(\n    model=\"{model}\",\n    temperature={temp},\n    max_tokens={maxTokens}\n)\n```",
  ],
  openai: [
    "Greeting from GPT-4o! I am currently processing prompts using OpenAI's high-speed endpoint. TTFT is sitting comfortably under 300ms.",
    "Using OpenAI reasoning models, we can leverage complex system instructions to solve coding, writing, and structured output tasks.",
  ],
  anthropic: [
    "Hello. This is Claude 3.5 Sonnet. With Anthropic's advanced context limits, I can analyze entire folders and documents uploaded in your workspace.",
  ],
  ollama: [
    "Hello from your local Ollama instance! I'm running Llama 3.2 on local hardware. Zero latency charges, 100% privacy guaranteed.",
  ],
};

export const SETUP_INSTRUCTIONS: Record<string, React.ReactNode> = {
  ollama: (
    <ol className="text-[11px] text-muted-foreground space-y-1.5 list-decimal list-inside leading-relaxed">
      <li>Install Ollama from <span className="font-mono text-foreground">ollama.ai</span></li>
      <li>Run <code className="font-mono bg-muted border border-border rounded px-1.5 py-0.5 text-[10px]">ollama pull llama3.2</code></li>
      <li>Ollama auto-starts at <span className="font-mono text-foreground">localhost:11434</span></li>
      <li>Click <strong>Ping</strong> to verify the connection</li>
    </ol>
  ),
  lmstudio: (
    <ol className="text-[11px] text-muted-foreground space-y-1.5 list-decimal list-inside leading-relaxed">
      <li>Download LM Studio from <span className="font-mono text-foreground">lmstudio.ai</span></li>
      <li>Load a GGUF model inside the app</li>
      <li>Enable the local server on port 1234</li>
      <li>Click <strong>Ping</strong> to verify the connection</li>
    </ol>
  ),
  vllm: (
    <ol className="text-[11px] text-muted-foreground space-y-1.5 list-decimal list-inside leading-relaxed">
      <li>Install: <code className="font-mono bg-muted border border-border rounded px-1.5 py-0.5 text-[10px]">pip install vllm</code></li>
      <li>Serve: <code className="font-mono bg-muted border border-border rounded px-1.5 py-0.5 text-[10px]">vllm serve meta-llama/Meta-Llama-3-8B</code></li>
      <li>Server starts automatically on port 8000</li>
      <li>Click <strong>Ping</strong> to verify the connection</li>
    </ol>
  ),
  custom: (
    <p className="text-[11px] text-muted-foreground leading-relaxed">
      Enter any OpenAI-compatible base URL. The server must expose a
      {" "}<code className="font-mono bg-muted border border-border rounded px-1">/chat/completions</code> endpoint.
    </p>
  ),
};

export const COMPARE_METRICS: ModelMetric[] = [
  { id: "gpt-4o", name: "gpt-4o", provider: "OpenAI", providerLogo: "OA", costIn: 5.00, costOut: 15.00, throughput: 85, latency: 280, context: "128k", mmlu: 88.7 },
  { id: "gpt-4o-mini", name: "gpt-4o-mini", provider: "OpenAI", providerLogo: "OA", costIn: 0.15, costOut: 0.60, throughput: 115, latency: 190, context: "128k", mmlu: 82.0 },
  { id: "claude-3-5-sonnet", name: "claude-3.5-sonnet", provider: "Anthropic", providerLogo: "AN", costIn: 3.00, costOut: 15.00, throughput: 75, latency: 310, context: "200k", mmlu: 88.7 },
  { id: "gemini-1.5-pro", name: "gemini-1.5-pro", provider: "Google AI", providerLogo: "GG", costIn: 1.25, costOut: 5.00, throughput: 65, latency: 380, context: "2M", mmlu: 85.9 },
  { id: "gemini-1.5-flash", name: "gemini-1.5-flash", provider: "Google AI", providerLogo: "GG", costIn: 0.075, costOut: 0.30, throughput: 135, latency: 180, context: "1M", mmlu: 78.9 },
  { id: "llama-3.1-70b", name: "llama-3.1-70b (LPU)", provider: "Groq", providerLogo: "GQ", costIn: 0.59, costOut: 0.79, throughput: 280, latency: 45, context: "128k", mmlu: 86.0 },
  { id: "llama3.2-local", name: "llama3.2 (local)", provider: "Ollama", providerLogo: "OL", costIn: 0.00, costOut: 0.00, throughput: 45, latency: 18, context: "8k", mmlu: 65.4 },
];

export function ShimmerBorder() {
  return (
    <div className="absolute inset-0 pointer-events-none rounded-[inherit] overflow-hidden z-10">
      <div
        className="absolute inset-0 animate-shimmer-border"
        style={{
          background: "linear-gradient(120deg, transparent 35%, hsl(var(--primary)/0.12) 50%, transparent 65%)",
          backgroundSize: "200% 100%"
        }}
      />
    </div>
  );
}

export function statusDot(status: ProviderStatus) {
  return (
    <span className={cn("inline-block size-1.5 rounded-full shrink-0",
      status === "connected" ? "bg-emerald-500" :
      status === "error"     ? "bg-destructive" :
      status === "testing"   ? "bg-blue-400 animate-ping" :
                               "bg-muted-foreground/25"
    )} />
  );
}

export function StatusChip({ status }: { status: ProviderStatus }) {
  const cfg = {
    connected:    { label: "Connected",     cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
    disconnected: { label: "Not connected", cls: "bg-muted text-muted-foreground border-border" },
    testing:      { label: "Testing…",      cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
    error:        { label: "Error",         cls: "bg-destructive/10 text-destructive border-destructive/20" },
  }[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium", cfg.cls)}>
      {statusDot(status)}
      {cfg.label}
    </span>
  );
}

export function getProviderSvg(key: string, sizeCls: string = "size-4") {
  const normKey = (key || "").toLowerCase().trim();

  // OpenAI (Official Brand Green #10a37f)
  if (normKey.includes("oa") || normKey.includes("openai") || normKey.includes("gpt")) {
    return (
      <svg className={cn(sizeCls, "fill-[#10a37f]")} viewBox="0 0 24 24">
        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0813 4.7792-2.7582a.7944.7944 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.5045 4.5045 0 0 1-4.4954 4.4954zm-9.643-3.6934a4.4707 4.4707 0 0 1-.5355-3.0016l.142.0858 4.7839 2.7582a.7944.7944 0 0 0 .7854 0l5.8336-3.3686v2.3372a.071.071 0 0 1-.0332.0617L9.897 20.301a4.5045 4.5045 0 0 1-6.2796-1.565zm-1.0028-10.37a4.48 4.48 0 0 1 2.3409-1.9608v5.6823a.7944.7944 0 0 0 .3927.6813l5.8336 3.3686-2.02 1.1686a.071.071 0 0 1-.0665.0047l-4.836-2.7915a4.5045 4.5045 0 0 1-1.6447-6.1533zm16.5925 3.8631l-5.8336-3.3686 2.02-1.1686a.071.071 0 0 1 .0665-.0047l4.836 2.7915a4.5045 4.5045 0 0 1 1.6447 6.1533 4.48 4.48 0 0 1-2.3409 1.9608v-5.6823a.7944.7944 0 0 0-.3927-.6813zm2.022-3.1368l-.142-.0858-4.7839-2.7582a.7944.7944 0 0 0-.7854 0l-5.8336 3.3686v-2.3372a.071.071 0 0 1 .0332-.0617l4.836-2.7915a4.5045 4.5045 0 0 1 6.6757 4.6658zm-11.458-7.9866a4.4755 4.4755 0 0 1 2.8764 1.0408l-.1419.0813-4.7792 2.7582a.7944.7944 0 0 0-.3927.6813v6.7369l-2.02-1.1686a.071.071 0 0 1-.038-.052v-5.5826a4.5045 4.5045 0 0 1 4.4954-4.4954zm.6447 8.354l2.7677 1.5979v3.1958l-2.7677 1.5979-2.7677-1.5979v-3.1958l2.7677-1.5979z" />
      </svg>
    );
  }

  // Anthropic / Claude (Official Terracotta #cc785c)
  if (normKey.includes("an") || normKey.includes("anthropic") || normKey.includes("claude")) {
    return (
      <svg className={cn(sizeCls, "fill-[#d97757]")} viewBox="0 0 24 24">
        <path d="M13.827 3.536h3.646L24 20.464h-3.646l-6.527-16.928zM3.646 20.464H0L6.527 3.536h3.646L3.646 20.464zm8.683-9.529l-2.483-6.44h.023l4.943 12.836h-2.483z" />
      </svg>
    );
  }

  // Google AI / Gemini (Official Spark Multi-Color Gradient)
  if (normKey.includes("gg") || normKey.includes("google") || normKey.includes("gemini")) {
    return (
      <svg className={sizeCls} viewBox="0 0 24 24" fill="none">
        <path d="M12 0C12 6.627 6.627 12 0 12c6.627 0 12 5.373 12 12 0-6.627 5.373-12 12-12-6.627 0-12-5.373-12-12z" fill="url(#gemini-spark-grad)" />
        <defs>
          <linearGradient id="gemini-spark-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1A73E8" />
            <stop offset="0.5" stopColor="#8AB4F8" />
            <stop offset="1" stopColor="#C5221F" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  // Groq LPU (Official Groq Red-Orange #f55036)
  if (normKey.includes("gq") || normKey.includes("groq")) {
    return (
      <svg className={cn(sizeCls, "fill-none stroke-[#f55036]")} viewBox="0 0 24 24" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    );
  }

  // Ollama / Llama
  if (normKey.includes("ol") || normKey.includes("ollama") || normKey.includes("llama")) {
    return (
      <svg className={cn(sizeCls, "fill-foreground")} viewBox="0 0 24 24">
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8zm-2-9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm-2 5a3.5 3.5 0 0 1-3.5-3.5h7A3.5 3.5 0 0 1 12 16z" />
      </svg>
    );
  }

  // LM Studio (Official Purple #a855f7)
  if (normKey.includes("lm") || normKey.includes("lmstudio")) {
    return (
      <svg className={cn(sizeCls, "fill-none stroke-[#a855f7]")} viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="4" />
        <path d="M7 8h10M7 12h10M7 16h6" />
      </svg>
    );
  }

  // vLLM (Yellow Engine #eab308)
  if (normKey.includes("vl") || normKey.includes("vllm")) {
    return (
      <svg className={cn(sizeCls, "fill-[#eab308]")} viewBox="0 0 24 24">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    );
  }

  // DeepSeek (Official Blue #4d6bfe)
  if (normKey.includes("ds") || normKey.includes("deepseek")) {
    return (
      <svg className={cn(sizeCls, "fill-[#4d6bfe]")} viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
      </svg>
    );
  }

  return <span className="font-extrabold uppercase text-[10px] text-foreground">{key ? key.slice(0, 2) : "AI"}</span>;
}

export function ProviderLogo({ logo, active, size = "md" }: { logo: string; active: boolean; size?: "sm" | "md" }) {
  const normKey = (logo || "").toLowerCase().trim();

  // Support direct image URLs if provided
  if (logo && (logo.startsWith("http") || logo.startsWith("/") || logo.startsWith("data:"))) {
    return (
      <div className={cn(
        "flex shrink-0 items-center justify-center rounded-lg border overflow-hidden p-1 shadow-2xs transition-all",
        size === "sm" ? "size-7" : "size-9",
        active ? "border-primary bg-primary/10" : "bg-card border-border/80"
      )}>
        <img src={logo} alt="Provider Logo" className="size-full object-contain" />
      </div>
    );
  }

  const brandBg = normKey.includes("oa") || normKey.includes("openai") ? "bg-emerald-500/10 border-emerald-500/30" :
                  normKey.includes("an") || normKey.includes("anthropic") ? "bg-amber-500/10 border-amber-500/30" :
                  normKey.includes("gg") || normKey.includes("google") || normKey.includes("gemini") ? "bg-blue-500/10 border-blue-500/30" :
                  normKey.includes("gq") || normKey.includes("groq") ? "bg-orange-500/10 border-orange-500/30" :
                  normKey.includes("ol") || normKey.includes("ollama") ? "bg-muted/80 border-border" :
                  normKey.includes("lm") || normKey.includes("lmstudio") ? "bg-purple-500/10 border-purple-500/30" :
                  normKey.includes("vl") || normKey.includes("vllm") ? "bg-yellow-500/10 border-yellow-500/30" :
                  normKey.includes("ds") || normKey.includes("deepseek") ? "bg-indigo-500/10 border-indigo-500/30" :
                  "bg-card border-border/80";

  return (
    <div className={cn(
      "flex shrink-0 items-center justify-center rounded-lg border transition-all shadow-2xs",
      size === "sm" ? "size-7" : "size-9",
      active
        ? "bg-foreground text-background border-foreground/20 shadow-xs"
        : brandBg
    )}>
      {getProviderSvg(logo, size === "sm" ? "size-4" : "size-5")}
    </div>
  );
}
