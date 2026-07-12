"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Brain,
  Key,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Check,
  X,
  Zap,
  Server,
  Globe,
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  Info,
  Shield,
  Wifi,
  Layers,
  Plug,
  ChevronRight,
  Send,
  Sliders,
  Terminal,
  Gauge,
  Cpu,
  Flame,
  TrendingUp,
  LineChart,
  Grid3X3,
  Scale,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/api";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
type ProviderType = "cloud" | "local";
type ProviderStatus = "connected" | "disconnected" | "testing" | "error";

interface LLMProvider {
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

interface ApiKey {
  id: string;
  providerId: string;
  label: string;
  key: string;
  createdAt: string;
  lastUsed: string;
  isActive: boolean;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  modelUsed?: string;
}

interface ModelMetric {
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

// ─── Data ─────────────────────────────────────────────────────────────────────


const WEEKLY_TOKEN_DATA = [
  { day: "Mon", tokens: 210000 },
  { day: "Tue", tokens: 340000 },
  { day: "Wed", tokens: 490000 },
  { day: "Thu", tokens: 320000 },
  { day: "Fri", tokens: 580000 },
  { day: "Sat", tokens: 190000 },
  { day: "Sun", tokens: 350000 },
];

const SIMULATED_RESPONSES: Record<string, string[]> = {
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

const SETUP_INSTRUCTIONS: Record<string, React.ReactNode> = {
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

const COMPARE_METRICS: ModelMetric[] = [
  { id: "gpt-4o", name: "gpt-4o", provider: "OpenAI", providerLogo: "OA", costIn: 5.00, costOut: 15.00, throughput: 85, latency: 280, context: "128k", mmlu: 88.7 },
  { id: "gpt-4o-mini", name: "gpt-4o-mini", provider: "OpenAI", providerLogo: "OA", costIn: 0.15, costOut: 0.60, throughput: 115, latency: 190, context: "128k", mmlu: 82.0 },
  { id: "claude-3-5-sonnet", name: "claude-3.5-sonnet", provider: "Anthropic", providerLogo: "AN", costIn: 3.00, costOut: 15.00, throughput: 75, latency: 310, context: "200k", mmlu: 88.7 },
  { id: "gemini-1.5-pro", name: "gemini-1.5-pro", provider: "Google AI", providerLogo: "GG", costIn: 1.25, costOut: 5.00, throughput: 65, latency: 380, context: "2M", mmlu: 85.9 },
  { id: "gemini-1.5-flash", name: "gemini-1.5-flash", provider: "Google AI", providerLogo: "GG", costIn: 0.075, costOut: 0.30, throughput: 135, latency: 180, context: "1M", mmlu: 78.9 },
  { id: "llama-3.1-70b", name: "llama-3.1-70b (LPU)", provider: "Groq", providerLogo: "GQ", costIn: 0.59, costOut: 0.79, throughput: 280, latency: 45, context: "128k", mmlu: 86.0 },
  { id: "llama3.2-local", name: "llama3.2 (local)", provider: "Ollama", providerLogo: "OL", costIn: 0.00, costOut: 0.00, throughput: 45, latency: 18, context: "8k", mmlu: 65.4 },
];

function ShimmerBorder() {
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

function statusDot(status: ProviderStatus) {
  return (
    <span className={cn("inline-block size-1.5 rounded-full shrink-0",
      status === "connected"  ? "bg-emerald-500" :
      status === "error"      ? "bg-destructive" :
      status === "testing"    ? "bg-blue-400 animate-ping" :
                                "bg-muted-foreground/25"
    )} />
  );
}

function StatusChip({ status }: { status: ProviderStatus }) {
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

function ProviderLogo({ logo, active, size = "md" }: { logo: string; active: boolean; size?: "sm" | "md" }) {
  return (
    <div className={cn(
      "flex shrink-0 items-center justify-center rounded-lg border font-bold transition-all",
      size === "sm" ? "size-7 text-[10px]" : "size-10 text-[12px]",
      active
        ? "bg-foreground text-background border-foreground/10 shadow-sm"
        : "bg-muted text-muted-foreground border-border"
    )}>
      {logo}
    </div>
  );
}

export function BrainDashboard() {
  const [activeTab,          setActiveTab]          = useState<"cloud" | "local">("cloud");
  const [selectedProviderId, setSelectedProviderId] = useState<string>("openai");
  const [cloudProviders,     setCloudProviders]     = useState<LLMProvider[]>([]);
  const [localProviders,     setLocalProviders]     = useState<LLMProvider[]>([]);
  const [apiKeys,            setApiKeys]            = useState<ApiKey[]>([]);
  const [isLoading,          setIsLoading]          = useState(true);

  // Tabs: configure | playground | matrix
  const [mainTab, setMainTab] = useState<"configure" | "playground" | "matrix">("configure");

  // Advanced configurations
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens,   setMaxTokens]   = useState<number>(2048);
  const [topP,        setTopP]        = useState<number>(0.9);
  const [systemPrompt, setSystemPrompt] = useState<string>("You are an advanced AI assistant powered by TriVisionX.");

  // Playground Chat State
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedText, setStreamedText] = useState("");

  // Benchmark speed states
  const [benchmarkStatus, setBenchmarkStatus] = useState<"idle" | "running" | "done">("idle");
  const [benchmarkSpeed, setBenchmarkSpeed] = useState(0);
  const [benchmarkLatency, setBenchmarkLatency] = useState(0);
  const [benchmarkProgress, setBenchmarkProgress] = useState(0);

  // Metrics Matrix State
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>(["gpt-4o", "claude-3-5-sonnet"]);
  const [matrixSortBy, setMatrixSortBy] = useState<keyof ModelMetric>("throughput");
  const [matrixSortOrder, setMatrixSortOrder] = useState<"asc" | "desc">("desc");

  // Key adding states
  const [addKeyMode,  setAddKeyMode]  = useState(false);
  const [newLabel,    setNewLabel]    = useState("");
  const [newKeyVal,   setNewKeyVal]   = useState("");
  const [showKey,     setShowKey]     = useState(false);
  const [testingId,   setTestingId]   = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [localEndpoint,  setLocalEndpoint]  = useState("");
  const [endpointEdited, setEndpointEdited] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const allProviders = [...cloudProviders, ...localProviders];
  const listProviders = activeTab === "cloud" ? cloudProviders : localProviders;
  const provider = allProviders.find((p) => p.id === selectedProviderId) ?? allProviders[0] ?? {
    id: "openai",
    name: "OpenAI",
    type: "cloud",
    logo: "OA",
    description: "",
    models: ["gpt-4o"],
    status: "disconnected" as ProviderStatus,
    isActive: false,
    endpoint: "",
    usageTokens: 0,
    usageCost: 0,
    latency: 0,
    tokensPerSec: 0
  };
  const providerKeys = apiKeys.filter((k) => k.providerId === selectedProviderId);
  const activeProvider = allProviders.find((p) => p.isActive);

  const totalTokens = cloudProviders.reduce((a, p) => a + (p.usageTokens ?? 0), 0);
  const totalCost   = cloudProviders.reduce((a, p) => a + (p.usageCost   ?? 0), 0);
  const endpoint    = endpointEdited ? localEndpoint : (provider?.endpoint ?? "");


  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      
      const [resProviders, resKeys, resMessages] = await Promise.all([
        fetch(`${API_BASE_URL}/brain/providers`, { headers }),
        fetch(`${API_BASE_URL}/brain/keys`, { headers }),
        fetch(`${API_BASE_URL}/brain/playground/messages`, { headers })
      ]);

      if (resProviders.ok) {
        const data = await resProviders.json();
        setCloudProviders(data.filter((p: any) => p.type === "cloud"));
        setLocalProviders(data.filter((p: any) => p.type === "local"));
      }
      if (resKeys.ok) {
        const data = await resKeys.json();
        setApiKeys(data);
      }
      if (resMessages.ok) {
        const data = await resMessages.json();
        setChatMessages(data);
      }
    } catch (e) {
      console.error("Failed to fetch brain configs", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto scroll playground chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, streamedText]);

  // Handle active provider selection
  const activateProvider = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      };
      // Optimistically update frontend
      setCloudProviders((p) => p.map((x) => ({ ...x, isActive: x.id === id })));
      setLocalProviders((p) => p.map((x) => ({ ...x, isActive: x.id === id })));

      // Sync active state to DB
      await Promise.all(allProviders.map(p => 
        fetch(`${API_BASE_URL}/brain/providers/${p.id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({ isActive: p.id === id })
        })
      ));
    } catch (e) {
      console.error("Failed to sync provider active state", e);
    }
  };

  // Simulated Connection Ping
  const testConnection = async (id: string) => {
    setTestingId(id);
    const setT = (p: LLMProvider) => p.id === id ? { ...p, status: "testing" as ProviderStatus } : p;
    setCloudProviders((p) => p.map(setT));
    setLocalProviders((p) => p.map(setT));
    
    // Simulate connection check, then update in DB & UI
    setTimeout(async () => {
      setTestingId(null);
      const hasKey = apiKeys.some((k) => k.providerId === id && k.isActive);
      const prov   = allProviders.find((p) => p.id === id);
      const ok     = prov?.type === "local" ? true : hasKey;
      const status: ProviderStatus = ok ? "connected" : "error";
      
      try {
        const token = localStorage.getItem("token");
        await fetch(`${API_BASE_URL}/brain/providers/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status })
        });
      } catch (e) {
        console.error("Failed to sync connection status", e);
      }

      const setF = (p: LLMProvider) => p.id === id ? { ...p, status } : p;
      setCloudProviders((p) => p.map(setF));
      setLocalProviders((p) => p.map(setF));
    }, 1200);
  };

  // Speed test / benchmark simulation
  const runSpeedBenchmark = () => {
    setBenchmarkStatus("running");
    setBenchmarkProgress(0);
    setBenchmarkSpeed(0);
    setBenchmarkLatency(0);

    const duration = 2000;
    const intervalTime = 50;
    const steps = duration / intervalTime;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = Math.round((currentStep / steps) * 100);
      setBenchmarkProgress(progress);

      setBenchmarkSpeed(Math.floor(40 + Math.random() * 50));
      setBenchmarkLatency(Math.floor(180 + Math.random() * 150));

      if (currentStep >= steps) {
        clearInterval(interval);
        setBenchmarkStatus("done");
        const finalLatency = provider.id === "groq" ? 45 : (provider.type === "local" ? 18 : 220);
        const finalSpeed = provider.id === "groq" ? 280 : (provider.type === "local" ? 45 : 85);
        setBenchmarkSpeed(finalSpeed);
        setBenchmarkLatency(finalLatency);
        
        // Sync final values back to DB
        const token = localStorage.getItem("token");
        fetch(`${API_BASE_URL}/brain/providers/${provider.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ latency: finalLatency, tokensPerSec: finalSpeed })
        });

        const updateP = (p: LLMProvider) => p.id === provider.id ? { ...p, latency: finalLatency, tokensPerSec: finalSpeed } : p;
        setCloudProviders(c => c.map(updateP));
        setLocalProviders(l => l.map(updateP));
      }
    }, intervalTime);
  };

  // Playground Chat - Real Functional Streaming
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isGenerating) return;
    const userPrompt = inputMessage.trim();
    setInputMessage("");

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { role: "user" as const, content: userPrompt, timestamp };
    let currentChatHistory = [...chatMessages];

    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      };
      
      // Save User Message to DB
      const resUser = await fetch(`${API_BASE_URL}/brain/playground/messages`, {
        method: "POST",
        headers,
        body: JSON.stringify(userMsg)
      });
      if (resUser.ok) {
        const savedUserMsg = await resUser.json();
        currentChatHistory = [...chatMessages, savedUserMsg];
        setChatMessages(currentChatHistory);
      } else {
        currentChatHistory = [...chatMessages, userMsg];
        setChatMessages(currentChatHistory);
      }
    } catch (e) {
      console.error(e);
      currentChatHistory = [...chatMessages, userMsg];
      setChatMessages(currentChatHistory);
    }

    setIsGenerating(true);
    setStreamedText("");

    try {
      const token = localStorage.getItem("token");
      
      // Convert history to payload schema
      const messagesPayload = currentChatHistory.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch(`${API_BASE_URL}/brain/playground/completion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          provider: provider.id,
          model: selectedModel,
          messages: messagesPayload,
          temperature,
          max_tokens: maxTokens,
          system_prompt: systemPrompt
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Playground request failed");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body reader available");

      const decoder = new TextDecoder();
      let done = false;
      let accumulatedText = "";
      let buffer = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine.startsWith("data: ")) continue;

            const jsonStr = cleanLine.slice(6);
            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.type === "token" && parsed.data) {
                accumulatedText += parsed.data;
                setStreamedText(accumulatedText);
              } else if (parsed.type === "error") {
                throw new Error(parsed.data || "In-stream error occurred");
              } else if (parsed.done) {
                done = true;
                break;
              }
            } catch (jsonErr) {
              // Ignore partial chunk syntax errors
            }
          }
        }
      }

      const assistantMsg = { 
        role: "assistant" as const, 
        content: accumulatedText, 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel 
      };

      // Save Assistant Message to DB
      const resAssistant = await fetch(`${API_BASE_URL}/brain/playground/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(assistantMsg)
      });

      if (resAssistant.ok) {
        const savedAssistantMsg = await resAssistant.json();
        setChatMessages(prev => [...prev, savedAssistantMsg]);
      } else {
        setChatMessages(prev => [...prev, assistantMsg]);
      }

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to generate playground completion");
      
      const errorMsg = {
        role: "assistant" as const,
        content: `Error: ${err.message || "Could not connect to the model."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setStreamedText("");
      setIsGenerating(false);
    }
  };

  const clearPlaygroundLogs = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/brain/playground/messages`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        setChatMessages([{ role: "assistant", content: "Playground console cleared.", timestamp: "Just now" }]);
        toast.success("Playground history cleared successfully");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to clear playground history");
    }
  };

  const saveKey = async () => {
    if (!newLabel.trim() || !newKeyVal.trim()) return;
    const payload = {
      providerId: selectedProviderId,
      label: newLabel.trim(),
      key: newKeyVal.trim(),
      isActive: true
    };
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/brain/keys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const createdKey = await res.json();
        setApiKeys((prev) => [...prev, createdKey]);
        setNewLabel("");
        setNewKeyVal("");
        setAddKeyMode(false);

        // Update provider status to connected in DB & UI
        await fetch(`${API_BASE_URL}/brain/providers/${selectedProviderId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status: "connected" })
        });
        const setC = (p: LLMProvider) => p.id === selectedProviderId ? { ...p, status: "connected" as ProviderStatus } : p;
        setCloudProviders((p) => p.map(setC));
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to save key");
    }
  };

  const deleteKey = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/brain/keys/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        setApiKeys((prev) => prev.filter((k) => k.id !== id));
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete key");
    }
  };

  const toggleKey = async (id: string) => {
    const target = apiKeys.find((k) => k.id === id);
    if (!target) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/brain/keys/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !target.isActive })
      });
      if (res.ok) {
        const updatedKey = await res.json();
        setApiKeys((prev) => prev.map((k) => k.id === id ? updatedKey : k));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectProvider = (id: string, type: ProviderType) => {
    setSelectedProviderId(id);
    setActiveTab(type);
    setAddKeyMode(false);
    setEndpointEdited(false);
    const p = allProviders.find((x) => x.id === id);
    if (p) setSelectedModel(p.models[0]);
  };

  const toggleCompareId = (id: string) => {
    setSelectedCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSort = (field: keyof ModelMetric) => {
    if (matrixSortBy === field) {
      setMatrixSortOrder(matrixSortOrder === "asc" ? "desc" : "asc");
    } else {
      setMatrixSortBy(field);
      setMatrixSortOrder("desc");
    }
  };

  const sortedCompareMetrics = [...COMPARE_METRICS].sort((a, b) => {
    const valA = a[matrixSortBy];
    const valB = b[matrixSortBy];
    if (typeof valA === "number" && typeof valB === "number") {
      return matrixSortOrder === "asc" ? valA - valB : valB - valA;
    }
    return 0;
  });

  const selectedMetrics = COMPARE_METRICS.filter((x) => selectedCompareIds.includes(x.id));

  // Determine top models in checked comparisons
  const fastestComparedModel = [...selectedMetrics].sort((a, b) => b.throughput - a.throughput)[0];
  const cheapestComparedModel = [...selectedMetrics].sort((a, b) => a.costIn - b.costIn)[0];
  const highestQualityComparedModel = [...selectedMetrics].sort((a, b) => b.mmlu - a.mmlu)[0];

  function ApiKeyRow({ apiKey, onDelete, onToggle }: { apiKey: ApiKey; onDelete: (id: string) => void; onToggle: (id: string) => void }) {
    const [visible, setVisible] = useState(false);
    const [copied, setCopied]   = useState(false);

    const masked = apiKey.key.slice(0, 14) + "•".repeat(22) + apiKey.key.slice(-4);
    const display = visible ? apiKey.key : masked;

    const copy = () => {
      navigator.clipboard.writeText(apiKey.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className={cn(
        "flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3 transition-all",
        apiKey.isActive ? "border-border" : "border-border/40 opacity-55"
      )}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-md border",
            apiKey.isActive ? "bg-muted border-border text-foreground" : "bg-muted/50 border-border/40 text-muted-foreground"
          )}>
            <Key className="size-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-semibold text-foreground truncate">{apiKey.label}</span>
              {apiKey.isActive && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-px text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="size-1 rounded-full bg-emerald-500 animate-pulse" /> ACTIVE
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <code className="text-[10px] font-mono text-muted-foreground bg-muted/60 rounded px-1.5 py-0.5 truncate max-w-[260px]">
                {display}
              </code>
              <button onClick={() => setVisible(!visible)} className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors">
                {visible ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
              </button>
              <button onClick={copy} className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors">
                {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Added {apiKey.createdAt} · Last used {apiKey.lastUsed}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onToggle(apiKey.id)}>
                {apiKey.isActive
                  ? <CheckCircle2 className="size-3.5 text-emerald-500" />
                  : <X className="size-3.5 text-muted-foreground" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{apiKey.isActive ? "Deactivate" : "Activate"}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => onDelete(apiKey.id)}>
                <Trash2 className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete key</TooltipContent>
          </Tooltip>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-grow flex items-center justify-center h-full min-h-[500px] bg-background">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="size-6 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-semibold">Loading brain configurations...</span>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col overflow-hidden bg-background">

        {/* ── TOP HEADER BAR ────────────────────────────────────────────── */}
        <div className="shrink-0 border-b border-border bg-card">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg border border-border bg-muted shadow-xs">
                <Brain className="size-4 text-foreground" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-foreground leading-none flex items-center gap-1.5">
                  Brain Dashboard
                  <Badge variant="secondary" className="text-[9px] font-mono py-0 px-1 bg-primary/10 text-primary border-none">
                    v2.6 Interactive
                  </Badge>
                </h1>
                <p className="text-[11px] text-muted-foreground mt-0.5">Manage LLM configurations, security keys, benchmark speeds &amp; live playground</p>
              </div>
            </div>
            {activeProvider && (
              <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/40 px-3 py-1.5">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] text-muted-foreground font-medium">Active:</span>
                <span className="text-[11px] font-semibold text-foreground">{activeProvider.name}</span>
                <Badge variant="outline" className="text-[9px] h-4.5 px-1.5 border-border">
                  {activeProvider.type === "local" ? "Local" : "Cloud"}
                </Badge>
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-0 border-t border-border divide-x divide-border bg-muted/20">
            {[
              { icon: Sparkles, label: "Total Tokens Generated", value: `${(totalTokens / 1_000_000).toFixed(2)}M`, note: "Monthly usage" },
              { icon: Activity, label: "Est. Total Cost", value: `$${totalCost.toFixed(2)}`, note: "Based on API pricing" },
              { icon: Clock, label: "Active latency", value: `${activeProvider?.latency || "—"} ms`, note: "Avg latency check" },
              { icon: Gauge, label: "Speed throughput", value: `${activeProvider?.tokensPerSec || "—"} tok/s`, note: "Performance test" },
            ].map(({ icon: Icon, label, value, note }) => (
              <div key={label} className="flex items-center gap-3 px-6 py-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted border border-border shadow-xs">
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
                  <div className="flex items-baseline gap-1">
                    <p className="text-sm font-bold text-foreground leading-tight">{value}</p>
                    <span className="text-[8px] text-muted-foreground/70 font-mono">({note})</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── BODY ──────────────────────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* LEFT NAV */}
          <div className="w-[230px] shrink-0 flex flex-col border-r border-border bg-card">
            <div className="px-3 pt-3 pb-2">
              <div className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5 border border-border">
                {(["cloud", "local"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-semibold transition-all",
                      activeTab === tab
                        ? "bg-background text-foreground shadow-sm border border-border"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab === "cloud" ? <Globe className="size-3" /> : <Server className="size-3" />}
                    {tab === "cloud" ? "Cloud" : "Local"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin min-h-0 px-2 pb-3">
              <div className="space-y-1">
                {listProviders.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => selectProvider(p.id, p.type)}
                    className={cn(
                      "group w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left border transition-all",
                      selectedProviderId === p.id
                        ? "bg-accent border-border/80 text-foreground"
                        : "border-transparent hover:bg-accent/40 text-muted-foreground hover:text-foreground"
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
                      {p.isActive && <Badge variant="outline" className="text-[8px] h-3 px-1 border-emerald-500/20 text-emerald-600 bg-emerald-500/5">Active</Badge>}
                      {statusDot(p.status)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* MAIN CONFIGURATION / PLAYGROUND / MATRIX COMPARATOR AREA */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card shrink-0">
              <div className="flex items-center gap-3">
                <ProviderLogo logo={provider.logo} active={provider.isActive} size="sm" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xs font-bold text-foreground">{provider.name} Settings</h2>
                    <StatusChip status={provider.status} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg border border-border">
                <button
                  onClick={() => setMainTab("configure")}
                  className={cn(
                    "px-3 py-1 text-[11px] font-semibold rounded-md transition-all",
                    mainTab === "configure"
                      ? "bg-background text-foreground shadow-xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Sliders className="size-3 inline-block mr-1 -mt-0.5" />
                  Configure
                </button>
                <button
                  onClick={() => setMainTab("playground")}
                  className={cn(
                    "px-3 py-1 text-[11px] font-semibold rounded-md transition-all",
                    mainTab === "playground"
                      ? "bg-background text-foreground shadow-xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Terminal className="size-3 inline-block mr-1 -mt-0.5" />
                  Playground
                </button>
                <button
                  onClick={() => setMainTab("matrix")}
                  className={cn(
                    "px-3 py-1 text-[11px] font-semibold rounded-md transition-all",
                    mainTab === "matrix"
                      ? "bg-background text-foreground shadow-xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Grid3X3 className="size-3 inline-block mr-1 -mt-0.5" />
                  Metrics Matrix
                </button>
              </div>
            </div>

            {mainTab === "configure" ? (
              <div className="flex-1 overflow-y-auto scrollbar-thin min-h-0">
                <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">

                  {/* Provider Setup Controls */}
                  <div className="rounded-xl border border-border bg-card p-5 space-y-5 relative overflow-hidden">
                    <ShimmerBorder />
                    <div className="flex items-start justify-between relative z-20">
                      <div>
                        <h3 className="text-xs font-bold text-foreground">API Connection</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Control connectivity and endpoints</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm" variant="outline"
                          className="h-8 text-xs gap-1.5 border-border"
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
                          className={cn("h-8 text-xs gap-1.5",
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
                  <div className="rounded-xl border border-border bg-card p-5 space-y-4 relative overflow-hidden">
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
                        className="h-8 text-xs border-border"
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

                  {/* Local URLs or API Keys */}
                  {provider.type === "local" ? (
                    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
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
                          className="h-9 text-xs gap-1.5 shrink-0 border-border"
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
                    <div className="rounded-xl border border-border bg-card p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-xs font-bold text-foreground">API Credentials</h3>
                          <p className="text-[11px] text-muted-foreground mt-0.5">Configure authentication headers</p>
                        </div>
                        <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1 border-border" onClick={() => setAddKeyMode(true)}>
                          <Plus className="size-3" /> Add Key
                        </Button>
                      </div>

                      {addKeyMode && (
                        <div className="mb-4 rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                          <p className="text-[11px] font-semibold text-foreground">New API key</p>
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
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="h-8 text-xs flex-1 bg-foreground text-background hover:bg-foreground/90"
                              disabled={!newLabel.trim() || !newKeyVal.trim()}
                              onClick={saveKey}
                            >
                              <Check className="size-3 mr-1" /> Save Key
                            </Button>
                            <Button
                              size="sm" variant="outline"
                              className="h-8 text-xs border-border"
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
                            <ApiKeyRow key={k.id} apiKey={k} onDelete={deleteKey} onToggle={toggleKey} />
                          ))}
                        </div>
                      ) : !addKeyMode ? (
                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 py-8 text-center">
                          <Key className="size-6 text-muted-foreground/40 mx-auto mb-2" />
                          <p className="text-xs font-semibold text-foreground">Credentials Missing</p>
                          <p className="text-[11px] text-muted-foreground mt-1 mb-3">
                            Connect {provider.name} to start generating playground tokens.
                          </p>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-border" onClick={() => setAddKeyMode(true)}>
                            <Plus className="size-3" /> Add Key
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  )}

                </div>
              </div>
            ) : mainTab === "playground" ? (
              /* LIVE INTERACTIVE PLAYGROUND */
              <div className="flex-1 flex flex-col min-h-0 bg-muted/10">
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex flex-col max-w-[85%] rounded-xl px-4 py-3 border text-xs leading-relaxed",
                        msg.role === "user"
                          ? "ml-auto bg-foreground text-background border-foreground/10 shadow-xs"
                          : "mr-auto bg-card text-foreground border-border shadow-xs"
                      )}
                    >
                      {msg.role === "assistant" && (
                        <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-mono text-muted-foreground">
                          <Brain className="size-3" />
                          <span>{msg.modelUsed || selectedModel}</span>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <span className={cn(
                        "text-[9px] mt-1.5 block text-right font-mono",
                        msg.role === "user" ? "text-background/70" : "text-muted-foreground/70"
                      )}>
                        {msg.timestamp}
                      </span>
                    </div>
                  ))}

                  {isGenerating && streamedText && (
                    <div className="mr-auto bg-card text-foreground border border-border rounded-xl px-4 py-3 text-xs leading-relaxed max-w-[85%] shadow-xs">
                      <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-mono text-muted-foreground">
                        <Brain className="size-3" />
                        <span>{selectedModel} (Streaming…)</span>
                      </div>
                      <p className="whitespace-pre-wrap">{streamedText}</p>
                      <span className="inline-block animate-pulse font-bold text-foreground">|</span>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-border bg-card">
                  <div className="flex items-center gap-2">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder={`Send test prompt to ${selectedModel} (temp=${temperature})…`}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSendMessage(); }}
                      className="text-xs border-border bg-background h-10"
                      disabled={isGenerating}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isGenerating}
                      size="icon"
                      className="h-10 w-10 shrink-0"
                    >
                      {isGenerating ? (
                        <RefreshCw className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex justify-between items-center mt-2 px-1 text-[10px] text-muted-foreground">
                    <span>Press Enter to send. Playground utilizes configured Temperature, System Prompt, and Parameters.</span>
                    <button
                      className="hover:text-foreground underline transition-colors"
                      onClick={clearPlaygroundLogs}
                    >
                      Clear Playground Logs
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* INTERACTIVE METRICS COMPARATOR MATRIX */
              <div className="flex-1 overflow-y-auto scrollbar-thin min-h-0">
                <div className="px-6 py-6 space-y-6 max-w-4xl mx-auto">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Scale className="size-4 text-primary" />
                        LLM Performance Matrix
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Toggle checkboxes to perform side-by-side benchmarking</p>
                    </div>
                  </div>

                  {/* Comparative Matrix Table */}
                  <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs relative">
                    <ShimmerBorder />
                    <table className="w-full text-left border-collapse text-xs relative z-20">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="p-3 w-10">Compare</th>
                          <th className="p-3 font-semibold text-foreground cursor-pointer" onClick={() => handleSort("name")}>Model</th>
                          <th className="p-3 font-semibold text-foreground cursor-pointer" onClick={() => handleSort("provider")}>Provider</th>
                          <th className="p-3 font-semibold text-foreground cursor-pointer text-right" onClick={() => handleSort("throughput")}>Throughput (t/s)</th>
                          <th className="p-3 font-semibold text-foreground cursor-pointer text-right" onClick={() => handleSort("latency")}>Latency (TTFT)</th>
                          <th className="p-3 font-semibold text-foreground cursor-pointer text-right" onClick={() => handleSort("mmlu")}>MMLU Score</th>
                          <th className="p-3 font-semibold text-foreground cursor-pointer text-right" onClick={() => handleSort("costIn")}>Cost / 1M Input</th>
                          <th className="p-3 font-semibold text-foreground cursor-pointer text-center" onClick={() => handleSort("context")}>Context</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {sortedCompareMetrics.map((m) => {
                          const isChecked = selectedCompareIds.includes(m.id);
                          return (
                            <tr key={m.id} className={cn("hover:bg-accent/20 transition-colors", isChecked && "bg-primary/5")}>
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
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-bold border border-border">{m.providerLogo}</span>
                                  <span>{m.provider}</span>
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
                      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
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
                      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
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
                      <div className="col-span-2 rounded-xl border border-border bg-card p-5 space-y-4">
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
            )}

          </div>

          {/* RIGHT: Advanced Usage Stats Visualizations */}
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
                    <div className="h-full bg-primary" style={{ width: "80%" }} title="OpenAI (80%)" />
                    <div className="h-full bg-primary/50" style={{ width: "15%" }} title="Mistral (15%)" />
                    <div className="h-full bg-primary/20" style={{ width: "5%" }} title="Others (5%)" />
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3">
                    <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
                      <span className="size-1.5 rounded-full bg-primary" />
                      <span>OpenAI (80%)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
                      <span className="size-1.5 rounded-full bg-primary/50" />
                      <span>Mistral (15%)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
                      <span className="size-1.5 rounded-full bg-primary/20" />
                      <span>Others (5%)</span>
                    </div>
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

        </div>
      </div>
    </TooltipProvider>
  );
}
