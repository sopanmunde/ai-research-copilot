"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Brain,
  Sparkles,
  Activity,
  Sliders,
  Terminal,
  Grid3X3,
  Scale,
  RefreshCw,
  Clock,
  Gauge,
  Plug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/api";
import { toast } from "sonner";
import { ExportModal } from "./ExportModal";
import {
  LLMProvider,
  ApiKey,
  Message,
  ModelMetric,
  TelemetryLog,
  ProviderType,
  ProviderStatus,
  MainTabType,
  COMPARE_METRICS,
} from "./dashboards/brain/types";
import { BrainProviderSidebar } from "./dashboards/brain/BrainProviderSidebar";
import { BrainOverviewTab } from "./dashboards/brain/BrainOverviewTab";
import { BrainTelemetryTab } from "./dashboards/brain/BrainTelemetryTab";
import { BrainConfigTab } from "./dashboards/brain/BrainConfigTab";
import { BrainPlaygroundTab } from "./dashboards/brain/BrainPlaygroundTab";
import { BrainMatrixTab } from "./dashboards/brain/BrainMatrixTab";
import { BrainUsageSidebar } from "./dashboards/brain/BrainUsageSidebar";

export function BrainDashboard() {
  const [activeTab, setActiveTab] = useState<ProviderType>("cloud");
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("openai");

  const [cloudProviders, setCloudProviders] = useState<LLMProvider[]>([]);
  const [localProviders, setLocalProviders] = useState<LLMProvider[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Main Tabs: overview | telemetry | configure | playground | matrix
  const [mainTab, setMainTab] = useState<MainTabType>("overview");

  // Real-Time Telemetry State
  const [telemetryLive, setTelemetryLive] = useState(true);
  const [telemetryInterval, setTelemetryInterval] = useState<number>(2);
  const [telemetryWindow, setTelemetryWindow] = useState<"1m" | "5m" | "1h" | "24h">("5m");

  const [liveTokensPerSec, setLiveTokensPerSec] = useState(148.5);
  const [liveTtft, setLiveTtft] = useState(185);
  const [liveP95, setLiveP95] = useState(340);
  const [liveReqPerMin, setLiveReqPerMin] = useState(48);
  const [liveVectorLatency, setLiveVectorLatency] = useState(18.2);

  const [telemetryStreamLogs, setTelemetryStreamLogs] = useState<TelemetryLog[]>([
    { id: "req-101", timestamp: "20:15:42", model: "gpt-4o", tokensIn: 342, tokensOut: 1280, latency: 245, status: 200, traceId: "tr-9a8f7c6b", cost: 0.0210, cacheHit: false },
    { id: "req-102", timestamp: "20:15:40", model: "claude-3-5-sonnet", tokensIn: 512, tokensOut: 890, latency: 310, status: 200, traceId: "tr-3e4f5a6b", cost: 0.0148, cacheHit: false },
    { id: "req-103", timestamp: "20:15:38", model: "gemini-1.5-flash", tokensIn: 180, tokensOut: 450, latency: 175, status: 304, traceId: "tr-1b2c3d4e", cost: 0.0001, cacheHit: true },
    { id: "req-104", timestamp: "20:15:35", model: "llama-3.1-70b", tokensIn: 640, tokensOut: 2100, latency: 48, status: 200, traceId: "tr-5f6e7d8c", cost: 0.0020, cacheHit: false },
    { id: "req-105", timestamp: "20:15:31", model: "llama3.2-local", tokensIn: 95, tokensOut: 320, latency: 18, status: 200, traceId: "tr-9d8c7b6a", cost: 0.0000, cacheHit: false },
    { id: "req-106", timestamp: "20:15:28", model: "gpt-4o-mini", tokensIn: 1200, tokensOut: 0, latency: 1120, status: 429, traceId: "tr-4a3b2c1d", cost: 0.0002, error: "Rate limit exceeded (429): Token quota exhausted for current minute window" },
    { id: "req-107", timestamp: "20:15:22", model: "gemini-1.5-pro", tokensIn: 840, tokensOut: 0, latency: 2400, status: 500, traceId: "tr-7f8e9d0c", cost: 0.0000, error: "500 Internal Server Error: Provider upstream connection timeout during generation" }
  ]);

  const [throughputGraph, setThroughputGraph] = useState<number[]>([
    120, 145, 130, 165, 180, 155, 190, 210, 175, 195, 220, 185, 160, 205, 190
  ]);

  // Live Telemetry Loop
  useEffect(() => {
    if (!telemetryLive) return;
    const timer = setInterval(() => {
      const deltaTokens = (Math.random() - 0.5) * 20;
      const deltaTtft = (Math.random() - 0.5) * 15;
      setLiveTokensPerSec(prev => Math.max(80, Math.min(320, parseFloat((prev + deltaTokens).toFixed(1)))));
      setLiveTtft(prev => Math.max(20, Math.min(600, Math.round(prev + deltaTtft))));
      setLiveP95(prev => Math.max(100, Math.min(900, Math.round(prev + deltaTtft * 1.2))));
      setLiveReqPerMin(prev => Math.max(10, Math.min(150, Math.round(prev + (Math.random() - 0.5) * 4))));
      setLiveVectorLatency(prev => Math.max(5, Math.min(45, parseFloat((prev + (Math.random() - 0.5) * 2).toFixed(1)))));

      setThroughputGraph(prev => [...prev.slice(1), Math.floor(100 + Math.random() * 120)]);

      const modelsList = ["gpt-4o", "claude-3-5-sonnet", "gemini-1.5-flash", "llama-3.1-70b", "llama3.2-local", "gpt-4o-mini", "gemini-1.5-pro"];
      const randModel = modelsList[Math.floor(Math.random() * modelsList.length)];
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      // Diverse HTTP Status Simulation (mostly 200, occasional 304, 429, 500)
      const randVal = Math.random();
      let status = 200;
      let error: string | undefined = undefined;
      let cacheHit = false;

      if (randVal > 0.92) {
        status = 500;
        error = `500 Internal Error: ${randModel} API gateway failed to respond within threshold.`;
      } else if (randVal > 0.82) {
        status = 429;
        error = `429 Rate Limit: Request throttled on provider endpoint for ${randModel}.`;
      } else if (randVal > 0.70) {
        status = 304;
        cacheHit = true;
      }

      const tokensIn = Math.floor(100 + Math.random() * 800);
      const tokensOut = status >= 400 ? 0 : Math.floor(150 + Math.random() * 1500);
      const latency = cacheHit ? Math.floor(8 + Math.random() * 25) : Math.floor(35 + Math.random() * 450);
      const cost = cacheHit ? 0.0001 : parseFloat(((tokensIn * 0.000003) + (tokensOut * 0.000015)).toFixed(5));
      const traceId = `tr-${Math.random().toString(36).substring(2, 10)}`;

      const newLog: TelemetryLog = {
        id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: timeStr,
        model: randModel,
        tokensIn,
        tokensOut,
        latency,
        status,
        traceId,
        cost,
        error,
        cacheHit
      };
      setTelemetryStreamLogs(prev => [newLog, ...prev.slice(0, 49)]);
    }, telemetryInterval * 1000);

    return () => clearInterval(timer);
  }, [telemetryLive, telemetryInterval]);

  // Advanced configurations
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(2048);
  const [topP, setTopP] = useState<number>(0.9);
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
  const [addKeyMode, setAddKeyMode] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newKeyVal, setNewKeyVal] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [localEndpoint, setLocalEndpoint] = useState("");
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
  const totalCost = cloudProviders.reduce((a, p) => a + (p.usageCost ?? 0), 0);
  const endpoint = endpointEdited ? localEndpoint : (provider?.endpoint ?? "");

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [resProviders, resKeys, resMessages, resTelemetry] = await Promise.all([
        fetch(`${API_BASE_URL}/brain/providers`, { headers }),
        fetch(`${API_BASE_URL}/brain/keys`, { headers }),
        fetch(`${API_BASE_URL}/brain/playground/messages`, { headers }),
        fetch(`${API_BASE_URL}/brain/telemetry/stats`, { headers })
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
      if (resTelemetry.ok) {
        const stats = await resTelemetry.json();
        if (stats.recentLogs && stats.recentLogs.length > 0) {
          setTelemetryStreamLogs(stats.recentLogs);
        }
        if (stats.liveTokensPerSec) setLiveTokensPerSec(stats.liveTokensPerSec);
        if (stats.liveTtft) setLiveTtft(stats.liveTtft);
        if (stats.liveP95) setLiveP95(stats.liveP95);
        if (stats.liveReqPerMin) setLiveReqPerMin(stats.liveReqPerMin);
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
      setCloudProviders((p) => p.map((x) => ({ ...x, isActive: x.id === id })));
      setLocalProviders((p) => p.map((x) => ({ ...x, isActive: x.id === id })));

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

  // Real Connection Ping
  const testConnection = async (id: string) => {
    setTestingId(id);
    const setT = (p: LLMProvider) => p.id === id ? { ...p, status: "testing" as ProviderStatus } : p;
    setCloudProviders((p) => p.map(setT));
    setLocalProviders((p) => p.map(setT));

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/brain/providers/${id}/ping`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      let status: ProviderStatus = "error";
      let latency = 0;

      if (res.ok) {
        const data = await res.json();
        if (data.status === "connected") {
          status = "connected";
          latency = data.latency;
          toast.success(`${allProviders.find(p => p.id === id)?.name || "Provider"} is connected! Latency: ${latency}ms`);
        } else {
          toast.error(`Connection check failed: ${data.detail || "Unknown error"}`);
        }
      } else {
        toast.error("Failed to contact the backend verification service.");
      }

      await fetch(`${API_BASE_URL}/brain/providers/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, latency })
      });

      const setF = (p: LLMProvider) => p.id === id ? { ...p, status, latency } : p;
      setCloudProviders((p) => p.map(setF));
      setLocalProviders((p) => p.map(setF));
    } catch (e) {
      console.error("Failed connection ping", e);
      toast.error("Connection failed.");

      const setErr = (p: LLMProvider) => p.id === id ? { ...p, status: "error" as ProviderStatus } : p;
      setCloudProviders((p) => p.map(setErr));
      setLocalProviders((p) => p.map(setErr));
    } finally {
      setTestingId(null);
    }
  };

  // Real Performance Benchmark
  const runSpeedBenchmark = async () => {
    const id = provider.id;
    setBenchmarkStatus("running");
    setBenchmarkProgress(15);
    setBenchmarkSpeed(0);
    setBenchmarkLatency(0);

    const progressTimer = setInterval(() => {
      setBenchmarkProgress((prev) => (prev < 85 ? prev + Math.floor(Math.random() * 8) + 2 : prev));
    }, 150);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/brain/providers/${id}/benchmark`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      clearInterval(progressTimer);
      setBenchmarkProgress(100);

      if (res.ok) {
        const data = await res.json();
        const finalLatency = data.latency;
        const finalSpeed = data.tokensPerSec;

        setBenchmarkSpeed(finalSpeed);
        setBenchmarkLatency(finalLatency);
        setBenchmarkStatus("done");

        const updateP = (p: LLMProvider) => p.id === id ? { ...p, latency: finalLatency, tokensPerSec: finalSpeed } : p;
        setCloudProviders(c => c.map(updateP));
        setLocalProviders(l => l.map(updateP));
        toast.success(`Speed test complete: ${finalSpeed} tok/s at ${finalLatency}ms latency!`);
      } else {
        const err = await res.json();
        throw new Error(err.detail || "Server error");
      }
    } catch (e: any) {
      clearInterval(progressTimer);
      setBenchmarkProgress(0);
      setBenchmarkStatus("idle");
      console.error("Benchmark failed", e);
      toast.error(`Benchmark failed: ${e.message || "Ensure a valid API key is set."}`);
    }
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
      fetchData();

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
        headers: { Authorization: `Bearer ${token}` }
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
        headers: { Authorization: `Bearer ${token}` }
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
  const fastestComparedModel = [...selectedMetrics].sort((a, b) => b.throughput - a.throughput)[0];
  const cheapestComparedModel = [...selectedMetrics].sort((a, b) => a.costIn - b.costIn)[0];
  const highestQualityComparedModel = [...selectedMetrics].sort((a, b) => b.mmlu - a.mmlu)[0];

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

  const workspaceModes: { id: MainTabType; label: string; icon: any; color: string }[] = [
    { id: "overview", label: "CMD Center", icon: Sparkles, color: "text-primary" },
    { id: "telemetry", label: "Tracking", icon: Activity, color: "text-emerald-400" },
    { id: "configure", label: "Config", icon: Sliders, color: "text-blue-400" },
    { id: "playground", label: "Playground", icon: Terminal, color: "text-purple-400" },
    { id: "matrix", label: "Metrics", icon: Scale, color: "text-amber-400" },
  ];

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col overflow-hidden bg-background">
        {/* ── TOP HEADER BAR ────────────────────────────────────────────── */}
        <div className="shrink-0 border-b border-border bg-card shadow-xs">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3.5">
              <div className="flex size-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 shadow-xs">
                <Brain className="size-5 text-primary" />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-foreground leading-none flex items-center gap-2">
                  Brain Dashboard
                  <Badge variant="secondary" className="text-[10px] font-mono font-bold py-0.5 px-2 bg-primary/15 text-primary border border-primary/20">
                    v2.6 Real-Time
                  </Badge>
                </h1>
                <p className="text-xs font-medium text-muted-foreground mt-1">LLM provider engine controls, security API keys, performance benchmarks &amp; real-time telemetry</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {activeProvider && (
                <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 shadow-2xs">
                  <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Active Engine:</span>
                  <span className="text-xs font-extrabold text-foreground">{activeProvider.name}</span>
                  <Badge variant="outline" className="text-[10px] font-semibold h-5 px-2 border-emerald-500/40 text-emerald-400">
                    {activeProvider.type === "local" ? "Local Hardware" : "Cloud API"}
                  </Badge>
                </div>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsExportOpen(true)}
                className="h-9 text-xs font-bold gap-2 border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/20 shadow-xs cursor-pointer"
              >
                <Plug className="h-4 w-4" />
                Export &amp; Integrations Hub
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-0 border-t border-border divide-x divide-border bg-muted/30">
            {[
              { icon: Sparkles, label: "Total Tokens Generated", value: `${(totalTokens / 1_000_000).toFixed(2)}M`, note: "Monthly usage" },
              { icon: Activity, label: "Est. Total Cost", value: `$${totalCost.toFixed(2)}`, note: "API pricing" },
              { icon: Clock, label: "Active Latency", value: `${activeProvider?.latency || "—"} ms`, note: "TTFT Ping" },
              { icon: Gauge, label: "Throughput Speed", value: `${activeProvider?.tokensPerSec || "—"} tok/s`, note: "Generation rate" },
            ].map(({ icon: Icon, label, value, note }) => (
              <div key={label} className="flex items-center gap-3.5 px-6 py-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted border border-border/80 shadow-xs">
                  <Icon className="size-4.5 text-primary" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider leading-tight">{label}</p>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <p className="text-base font-extrabold font-mono text-foreground leading-tight">{value}</p>
                    <span className="text-[9.5px] text-muted-foreground font-mono font-medium">({note})</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── BODY ──────────────────────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* LEFT PROVIDER RAIL */}
          <BrainProviderSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            listProviders={listProviders}
            selectedProviderId={selectedProviderId}
            selectProvider={selectProvider}
          />

          {/* MAIN CONFIGURATION / PLAYGROUND / TELEMETRY / MATRIX AREA */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* UNIFIED TOP TAB NAVIGATION BAR */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card shrink-0">
              <div className="flex items-center gap-2">
                {mainTab === "overview" && <Sparkles className="size-4 text-primary animate-pulse" />}
                {mainTab === "telemetry" && <Activity className="size-4 text-emerald-400 animate-pulse" />}
                {mainTab === "configure" && <Sliders className="size-4 text-blue-400" />}
                {mainTab === "playground" && <Terminal className="size-4 text-purple-400" />}
                {mainTab === "matrix" && <Scale className="size-4 text-amber-400" />}
                <h2 className="text-sm font-extrabold text-foreground capitalize">
                  {mainTab === "overview" ? "Command Center" :
                    mainTab === "telemetry" ? "Real-Time Telemetry" :
                      mainTab === "configure" ? `${provider.name} Settings` :
                        mainTab === "playground" ? "Interactive Playground" : "LLM Metrics Matrix"}
                </h2>
              </div>

              <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg border border-border">
                {workspaceModes.map((item) => {
                  const Icon = item.icon;
                  const isActive = mainTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setMainTab(item.id)}
                      className={cn(
                        "px-3 py-1 text-[11px] font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer",
                        isActive
                          ? "bg-background text-foreground shadow-xs border border-border"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className={cn("size-3", item.color, isActive && "animate-pulse")} />
                      {item.label}
                      {item.id === "telemetry" && (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/20 text-emerald-400 text-[8px] font-extrabold px-1 py-0 border border-emerald-500/30">LIVE</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TAB CONTENT VIEWS */}
            <div className="flex-1 flex min-h-0 relative">
              {mainTab === "overview" && (
                <BrainOverviewTab
                  provider={provider}
                  selectedModel={selectedModel}
                  liveTtft={liveTtft}
                  liveTokensPerSec={liveTokensPerSec}
                  liveReqPerMin={liveReqPerMin}
                  liveVectorLatency={liveVectorLatency}
                  inputMessage={inputMessage}
                  setInputMessage={setInputMessage}
                  handleSendMessage={handleSendMessage}
                  isGenerating={isGenerating}
                  streamedText={streamedText}
                  fastestComparedModel={fastestComparedModel}
                  cheapestComparedModel={cheapestComparedModel}
                  highestQualityComparedModel={highestQualityComparedModel}
                  setMainTab={setMainTab}
                />
              )}

              {mainTab === "telemetry" && (
                <BrainTelemetryTab
                  telemetryLive={telemetryLive}
                  setTelemetryLive={setTelemetryLive}
                  telemetryInterval={telemetryInterval}
                  setTelemetryInterval={setTelemetryInterval}
                  telemetryWindow={telemetryWindow}
                  setTelemetryWindow={setTelemetryWindow}
                  liveTtft={liveTtft}
                  liveP95={liveP95}
                  liveTokensPerSec={liveTokensPerSec}
                  setLiveTokensPerSec={setLiveTokensPerSec}
                  liveReqPerMin={liveReqPerMin}
                  setLiveReqPerMin={setLiveReqPerMin}
                  liveVectorLatency={liveVectorLatency}
                  throughputGraph={throughputGraph}
                  telemetryStreamLogs={telemetryStreamLogs}
                  setTelemetryStreamLogs={setTelemetryStreamLogs}
                />
              )}

              {mainTab === "configure" && (
                <BrainConfigTab
                  provider={provider}
                  activateProvider={activateProvider}
                  testConnection={testConnection}
                  testingId={testingId}
                  selectedModel={selectedModel}
                  setSelectedModel={setSelectedModel}
                  temperature={temperature}
                  setTemperature={setTemperature}
                  maxTokens={maxTokens}
                  setMaxTokens={setMaxTokens}
                  topP={topP}
                  setTopP={setTopP}
                  systemPrompt={systemPrompt}
                  setSystemPrompt={setSystemPrompt}
                  benchmarkStatus={benchmarkStatus}
                  runSpeedBenchmark={runSpeedBenchmark}
                  benchmarkProgress={benchmarkProgress}
                  benchmarkSpeed={benchmarkSpeed}
                  benchmarkLatency={benchmarkLatency}
                  endpoint={endpoint}
                  setLocalEndpoint={setLocalEndpoint}
                  setEndpointEdited={setEndpointEdited}
                  providerKeys={providerKeys}
                  addKeyMode={addKeyMode}
                  setAddKeyMode={setAddKeyMode}
                  newLabel={newLabel}
                  setNewLabel={setNewLabel}
                  newKeyVal={newKeyVal}
                  setNewKeyVal={setNewKeyVal}
                  showKey={showKey}
                  setShowKey={setShowKey}
                  saveKey={saveKey}
                  deleteKey={deleteKey}
                  toggleKey={toggleKey}
                />
              )}

              {mainTab === "playground" && (
                <BrainPlaygroundTab
                  scrollRef={scrollRef}
                  chatMessages={chatMessages}
                  selectedModel={selectedModel}
                  isGenerating={isGenerating}
                  streamedText={streamedText}
                  inputMessage={inputMessage}
                  setInputMessage={setInputMessage}
                  handleSendMessage={handleSendMessage}
                  temperature={temperature}
                  clearPlaygroundLogs={clearPlaygroundLogs}
                />
              )}

              {mainTab === "matrix" && (
                <BrainMatrixTab
                  sortedCompareMetrics={sortedCompareMetrics}
                  selectedCompareIds={selectedCompareIds}
                  toggleCompareId={toggleCompareId}
                  handleSort={handleSort}
                  selectedMetrics={selectedMetrics}
                  fastestComparedModel={fastestComparedModel}
                  cheapestComparedModel={cheapestComparedModel}
                  highestQualityComparedModel={highestQualityComparedModel}
                />
              )}
            </div>
          </div>

          {/* RIGHT: Usage Stats Visualization Drawer */}
          {mainTab !== "telemetry" && mainTab !== "overview" && (
            <BrainUsageSidebar providers={allProviders} />
          )}

        </div>

        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          query="AI Model & Brain Playground Session"
        />
      </div>
    </TooltipProvider>
  );
}

export default BrainDashboard;
