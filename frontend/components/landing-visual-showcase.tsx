"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Cpu,
  Database,
  GitBranch,
  Zap,
  TrendingUp,
  ShieldCheck,
  Server,
  RefreshCw,
  Sliders,
  CheckCircle2
} from "lucide-react";

export function LandingVisualShowcase() {
  const [activeTab, setActiveTab] = useState<"throughput" | "vectors" | "routing" | "nodes">("throughput");
  const [isLive, setIsLive] = useState(true);
  const [telemetryTick, setTelemetryTick] = useState(0);

  // Simulated metrics tick for real-time visual realism
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setTelemetryTick((prev) => prev + 1);
    }, 1800);
    return () => clearInterval(interval);
  }, [isLive]);

  // Dynamic values that subtly shift on tick
  const currentTps = (142.4 + Math.sin(telemetryTick * 0.8) * 12.5).toFixed(1);
  const avgLatency = (48 + Math.cos(telemetryTick * 0.5) * 4).toFixed(0);
  const vectorAccuracy = (99.84 + Math.sin(telemetryTick) * 0.08).toFixed(2);
  const activeAgentsCount = 12 + (telemetryTick % 3);

  return (
    <section className="py-24 px-4 bg-zinc-950 relative overflow-hidden border-t border-zinc-900">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-xs font-mono font-semibold text-purple-400 mb-4 tracking-wider uppercase shadow-[0_0_15px_rgba(168,85,247,0.15)]"
          >
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            Live Observability & Visual Insights
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4"
          >
            Real-Time Agent Matrix & Vector Intelligence
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-zinc-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed"
          >
            Monitor high-concurrency multi-agent workloads, inspect Pinecone vector similarity clusters, and track multi-model routing latencies with sub-millisecond precision.
          </motion.p>
        </div>

        {/* Outer Dashboard Showcase Box */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative rounded-3xl border border-zinc-800 bg-zinc-950/80 shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden"
        >
          {/* Top Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-zinc-900/90 border-b border-zinc-800 select-none">
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-xs font-mono text-zinc-400 border-l border-zinc-800 pl-4 font-semibold">
                trivisionx_telemetry_v2.4.0
              </span>
            </div>

            {/* View Selector Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-zinc-950 rounded-xl border border-zinc-800/80">
              <button
                onClick={() => setActiveTab("throughput")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "throughput"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Throughput
              </button>
              <button
                onClick={() => setActiveTab("vectors")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "vectors"
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                Vector RAG
              </button>
              <button
                onClick={() => setActiveTab("routing")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "routing"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                LLM Gateways
              </button>
              <button
                onClick={() => setActiveTab("nodes")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "nodes"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                Node Topology
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsLive(!isLive)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  isLive
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : "bg-zinc-800 text-zinc-400 border-zinc-700"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isLive ? "bg-emerald-400 animate-ping" : "bg-zinc-500"}`} />
                {isLive ? "LIVE TELEMETRY" : "PAUSED"}
              </button>
            </div>
          </div>

          {/* Main Content Area with ASYMMETRIC ONE-SIDE BLUR EFFECT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
            
            {/* LEFT SIDE: Frosted One-Side Blur Glass Panel */}
            <div className="lg:col-span-4 relative p-6 bg-gradient-to-b from-purple-950/35 via-zinc-950/80 to-zinc-950/95 backdrop-blur-2xl border-b lg:border-b-0 lg:border-r border-purple-500/20 flex flex-col justify-between z-20 shadow-[10px_0_30px_rgba(139,92,246,0.08)]">
              {/* Decorative side glowing beam line */}
              <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 via-blue-500 to-emerald-500 opacity-80" />

              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-purple-400 font-bold uppercase tracking-wider mb-2">
                    <Sliders className="w-4 h-4" />
                    Agent Engine Controls
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">Live Telemetry Panel</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Real-time operational health and mock vector routing parameters.
                  </p>
                </div>

                {/* Key Live Metric Cards inside side blur panel */}
                <div className="space-y-3 font-mono">
                  <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/90 backdrop-blur-md">
                    <div className="flex justify-between items-center text-xs text-zinc-400 mb-1">
                      <span className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        Requests / Sec
                      </span>
                      <span className="text-emerald-400 font-bold text-[10px]">+14.2%</span>
                    </div>
                    <div className="text-2xl font-extrabold text-white flex items-baseline gap-1">
                      {currentTps} <span className="text-xs text-zinc-400 font-normal">req/s</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/90 backdrop-blur-md">
                    <div className="flex justify-between items-center text-xs text-zinc-400 mb-1">
                      <span className="flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
                        Avg Node Latency
                      </span>
                      <span className="text-purple-400 font-bold text-[10px]">OPTIMAL</span>
                    </div>
                    <div className="text-2xl font-extrabold text-white flex items-baseline gap-1">
                      {avgLatency} <span className="text-xs text-zinc-400 font-normal">ms</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/90 backdrop-blur-md">
                    <div className="flex justify-between items-center text-xs text-zinc-400 mb-1">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Vector Precision Rate
                      </span>
                      <span className="text-emerald-400 font-bold text-[10px]">MMR Active</span>
                    </div>
                    <div className="text-2xl font-extrabold text-emerald-400 flex items-baseline gap-1">
                      {vectorAccuracy}%
                    </div>
                  </div>
                </div>

                {/* Active Worker Status List */}
                <div className="space-y-2 pt-2 border-t border-zinc-800/80 font-mono text-xs">
                  <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                    Worker Thread Health
                  </div>
                  <div className="flex items-center justify-between text-zinc-300 text-[11px] p-2 rounded bg-zinc-900/40">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      LangGraph Worker #1
                    </span>
                    <span className="text-zinc-500 text-[10px]">100% capacity</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-300 text-[11px] p-2 rounded bg-zinc-900/40">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                      Pinecone Indexer #3
                    </span>
                    <span className="text-zinc-500 text-[10px]">1,024 vector/s</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                <span>Cluster: us-east-1a</span>
                <span className="text-purple-400">{activeAgentsCount} Agents Live</span>
              </div>
            </div>

            {/* RIGHT SIDE: Main Interactive Mock Visual Graphic Canvas */}
            <div className="lg:col-span-8 p-6 bg-zinc-950 flex flex-col justify-between relative overflow-hidden">
              {/* Background grid pattern */}
              <div
                className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{
                  backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
                  backgroundSize: "24px 24px"
                }}
              />

              <AnimatePresence mode="wait">
                {/* TAB 1: Throughput Chart Visual */}
                {activeTab === "throughput" && (
                  <motion.div
                    key="throughput"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-bold text-white">Agent Execution Velocity</h4>
                        <p className="text-xs text-zinc-400">High-frequency prompt synthesis & sub-agent token rates</p>
                      </div>
                      <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
                        Peak: 184 req/s
                      </span>
                    </div>

                    {/* Mock SVG Wave Line Chart */}
                    <div className="h-64 w-full relative bg-zinc-900/40 rounded-2xl border border-zinc-800 p-4 flex flex-col justify-end overflow-hidden">
                      <svg viewBox="0 0 500 150" className="w-full h-full text-purple-500 overflow-visible">
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        {/* Grid lines */}
                        <line x1="0" y1="30" x2="500" y2="30" stroke="#27272a" strokeDasharray="4 4" />
                        <line x1="0" y1="75" x2="500" y2="75" stroke="#27272a" strokeDasharray="4 4" />
                        <line x1="0" y1="120" x2="500" y2="120" stroke="#27272a" strokeDasharray="4 4" />

                        {/* Area under curve */}
                        <path
                          d="M 0 120 Q 70 40 140 80 T 280 50 T 420 90 T 500 30 L 500 150 L 0 150 Z"
                          fill="url(#chartGradient)"
                        />
                        {/* Curve line */}
                        <motion.path
                          d="M 0 120 Q 70 40 140 80 T 280 50 T 420 90 T 500 30"
                          fill="none"
                          stroke="#c084fc"
                          strokeWidth="3"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 1.5, ease: "easeInOut" }}
                        />

                        {/* Data points with pulse */}
                        <circle cx="140" cy="80" r="5" fill="#a855f7" />
                        <circle cx="280" cy="50" r="5" fill="#3b82f6" />
                        <circle cx="420" cy="90" r="5" fill="#10b981" />
                        <circle cx="500" cy="30" r="6" fill="#ec4899" className="animate-ping" />
                      </svg>

                      {/* Floating tooltip preview */}
                      <div className="absolute top-8 right-12 bg-zinc-900 border border-purple-500/40 p-2.5 rounded-lg shadow-xl font-mono text-[10px] text-zinc-300">
                        <div className="text-purple-400 font-bold">Node #4 LangGraph Router</div>
                        <div>Concurrency: 48 parallel agents</div>
                        <div>TTFT: 14ms (Streaming)</div>
                      </div>
                    </div>

                    {/* Telemetry Breakdown Cards */}
                    <div className="grid grid-cols-3 gap-3 font-mono text-xs">
                      <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
                        <span className="text-zinc-500 text-[10px] block">Tokens / Sec</span>
                        <span className="text-white font-bold text-base">4,820 t/s</span>
                      </div>
                      <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
                        <span className="text-zinc-500 text-[10px] block">Cache Hit Ratio</span>
                        <span className="text-emerald-400 font-bold text-base">94.8%</span>
                      </div>
                      <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
                        <span className="text-zinc-500 text-[10px] block">Active Pipelines</span>
                        <span className="text-purple-400 font-bold text-base">36 Active</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB 2: Vector RAG Intelligence */}
                {activeTab === "vectors" && (
                  <motion.div
                    key="vectors"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-bold text-white">Pinecone Vector Similarity Clusters</h4>
                        <p className="text-xs text-zinc-400">Maximal Marginal Relevance (MMR) high-dimensional embedding space</p>
                      </div>
                      <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                        1536-dim Cohere Embed
                      </span>
                    </div>

                    {/* Vector Scatter Visual Matrix */}
                    <div className="h-64 w-full bg-zinc-900/40 rounded-2xl border border-zinc-800 p-4 relative overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-48 h-48 rounded-full border border-blue-500/20 animate-spin-slow" />
                        <div className="w-32 h-32 rounded-full border border-purple-500/30 absolute" />
                        <div className="w-16 h-16 rounded-full border border-emerald-500/40 absolute" />
                      </div>

                      {/* Mock Vector Dots */}
                      <div className="relative z-10 w-full h-full flex flex-wrap items-center justify-around">
                        {[
                          { score: "0.98", label: "Agentic Loop Spec", color: "bg-purple-400", top: "20%", left: "25%" },
                          { score: "0.94", label: "Pinecone Index Config", color: "bg-blue-400", top: "60%", left: "30%" },
                          { score: "0.91", label: "LangGraph State Schema", color: "bg-emerald-400", top: "35%", left: "70%" },
                          { score: "0.89", label: "DeepSeek R1 Benchmark", color: "bg-amber-400", top: "75%", left: "65%" },
                          { score: "0.86", label: "Python Sandbox Security", color: "bg-pink-400", top: "15%", left: "80%" },
                        ].map((vec, i) => (
                          <motion.div
                            key={i}
                            style={{ position: "absolute", top: vec.top, left: vec.left }}
                            animate={{ scale: [1, 1.15, 1] }}
                            transition={{ repeat: Infinity, duration: 2 + i }}
                            className="flex items-center gap-2 p-1.5 rounded-lg bg-zinc-900/90 border border-zinc-700 shadow-lg font-mono text-[9.5px] cursor-pointer hover:border-purple-500 transition-colors"
                          >
                            <span className={`w-2 h-2 rounded-full ${vec.color}`} />
                            <span className="text-zinc-200">{vec.label}</span>
                            <span className="text-emerald-400 font-bold">{vec.score}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                      <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800 flex items-center justify-between">
                        <span className="text-zinc-400">Total Vectors Indexed:</span>
                        <span className="text-blue-400 font-bold">1,420,890</span>
                      </div>
                      <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800 flex items-center justify-between">
                        <span className="text-zinc-400">Query Latency:</span>
                        <span className="text-emerald-400 font-bold">12.4ms</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB 3: LLM Gateway Distribution */}
                {activeTab === "routing" && (
                  <motion.div
                    key="routing"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-bold text-white">Dynamic Model Load Balancing</h4>
                        <p className="text-xs text-zinc-400">Intelligent model routing based on cost, context window & latency</p>
                      </div>
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                        Zero Downtime
                      </span>
                    </div>

                    <div className="space-y-4 bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800 font-mono">
                      {[
                        { name: "Google Gemini 1.5 Pro / Flash", usage: 45, latency: "110ms", color: "bg-purple-500" },
                        { name: "Claude 3.7 Sonnet (Reasoning)", usage: 30, latency: "180ms", color: "bg-blue-500" },
                        { name: "DeepSeek R1 (Reinforcement)", usage: 15, latency: "140ms", color: "bg-pink-500" },
                        { name: "OpenAI GPT-4o Agent Hub", usage: 10, latency: "160ms", color: "bg-emerald-500" },
                      ].map((model, i) => (
                        <div key={i} className="space-y-1.5">
                          <div className="flex justify-between text-xs text-zinc-300">
                            <span className="font-bold flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${model.color}`} />
                              {model.name}
                            </span>
                            <span className="text-zinc-400">{model.usage}% Traffic ({model.latency})</span>
                          </div>
                          <div className="h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${model.usage}%` }}
                              transition={{ duration: 1, delay: i * 0.1 }}
                              className={`h-full ${model.color}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* TAB 4: Node Topology */}
                {activeTab === "nodes" && (
                  <motion.div
                    key="nodes"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-bold text-white">LangGraph Node Execution Map</h4>
                        <p className="text-xs text-zinc-400">5-Agent state graph with parallel branching logic</p>
                      </div>
                      <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                        Self-Healing
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                      {[
                        { title: "Smart Intent Router", status: "Healthy", time: "4ms", type: "Entry Node" },
                        { title: "Pinecone Context Fetch", status: "Active", time: "18ms", type: "RAG Node" },
                        { title: "Python Sandbox Exec", status: "Active", time: "62ms", type: "Tool Node" },
                        { title: "Multi-Model Synthesizer", status: "Healthy", time: "120ms", type: "LLM Node" },
                        { title: "Citation Validator", status: "Healthy", time: "14ms", type: "Audit Node" },
                        { title: "Markdown Publisher", status: "Standby", time: "2ms", type: "Output Node" },
                      ].map((node, i) => (
                        <div key={i} className="p-3.5 bg-zinc-900/60 rounded-xl border border-zinc-800 hover:border-purple-500/50 transition-all">
                          <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1.5">
                            <span>{node.type}</span>
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              {node.status}
                            </span>
                          </div>
                          <div className="font-bold text-zinc-100 mb-1 text-[11px] truncate">{node.title}</div>
                          <div className="text-[10px] text-purple-400 font-mono">{node.time} avg</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom Telemetry Footer */}
              <div className="mt-6 pt-4 border-t border-zinc-900 flex flex-wrap items-center justify-between text-[11px] font-mono text-zinc-500">
                <span className="flex items-center gap-2">
                  <Server className="w-3.5 h-3.5 text-purple-400" />
                  Cluster Status: Operational (99.99% Uptime)
                </span>
                <span>Active Model Gateway: Gemini 1.5 Pro + Pinecone MMR</span>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  );
}
