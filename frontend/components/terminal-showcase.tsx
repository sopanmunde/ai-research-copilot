"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal as TerminalIcon,
  Play,
  Copy,
  Check,
  Cpu,
  Layers,
  Sparkles,
  Zap,
  Activity,
  HardDrive,
  Code2,
  Maximize2,
  RefreshCw
} from "lucide-react";

interface CommandPreset {
  id: string;
  command: string;
  title: string;
  description: string;
  output: Array<{
    type: "prompt" | "info" | "success" | "warning" | "agent" | "tree" | "table" | "metric";
    text: string;
    delay?: number;
  }>;
}

const COMMAND_PRESETS: CommandPreset[] = [
  {
    id: "run-pipeline",
    command: "trivisionx run --workflow=deep_research --model=gemini-1.5-pro",
    title: "Multi-Agent Research Pipeline",
    description: "Orchestrate 5 parallel LangGraph sub-agents with Pinecone MMR retrieval and citation verification.",
    output: [
      { type: "prompt", text: "sopan@trivisionx:~/projects/agent-matrix (main*)$ trivisionx run --workflow=deep_research --model=gemini-1.5-pro" },
      { type: "info", text: "[00:00.001] [SYSTEM] Initializing LangGraph state graph v2.4 (5 nodes registered)" },
      { type: "agent", text: "├─ [NODE:ROUTER] Query intent classified -> 'Comparative Analysis: DeepSeek R1 vs Claude 3.7'" },
      { type: "agent", text: "├─ [NODE:PINECONE] Querying vector namespace 'trivisionx-mmr' (top_k=5, mmr_lambda=0.75)" },
      { type: "success", text: "│  └─ [MMR_MATCH] 5 dense chunks retrieved in 18ms (avg similarity score: 0.948)" },
      { type: "agent", text: "├─ [NODE:SANDBOX] Spawning Python 3.12 Docker isolation container (ID: sbx_4920)" },
      { type: "success", text: "│  └─ [AST_EVAL] Pytest assertion test passed: test_agent_graph() -> PASS (0 failures)" },
      { type: "agent", text: "├─ [NODE:LLM_GATEWAY] Dispatching prompt to Gemini 1.5 Pro (streaming 4,096 max tokens)" },
      { type: "success", text: "└─ [NODE:CITATION_AUDITOR] 100% reference sources verified against Pinecone vector hashes" },
      { type: "metric", text: "\n✔ Pipeline executed cleanly in 142ms | Tokens: 3,420 t/s | Memory: 42MB | Cost: $0.0004" }
    ]
  },
  {
    id: "vector-query",
    command: "trivisionx vector search --index=docs-mmr --query=\"DeepSeek R1 reasoning\"",
    title: "Pinecone Vector MMR Shell",
    description: "Query high-dimensional document vectors with maximal marginal relevance filtering.",
    output: [
      { type: "prompt", text: "sopan@trivisionx:~/projects/agent-matrix (main*)$ trivisionx vector search --index=docs-mmr --query=\"DeepSeek R1 reasoning\"" },
      { type: "info", text: "[PINECONE_CLI] Connecting to index 'trivisionx-mmr-v2' [us-east-1a]" },
      { type: "table", text: "ID            SIMILARITY  VECTOR_DIM  CHUNK_SOURCE" },
      { type: "table", text: "----------------------------------------------------------------------" },
      { type: "success", text: "chunk_8812    0.962       1536-dim    docs/architecture/reasoning_loops.md#L42" },
      { type: "success", text: "chunk_4901    0.914       1536-dim    docs/benchmarks/deepseek_vs_claude.md#L18" },
      { type: "success", text: "chunk_1042    0.887       1536-dim    docs/agents/langgraph_router.md#L102" },
      { type: "info", text: "[MMR_FILTER] Filtered 12 redundant chunks (Diversity delta: 0.18)" },
      { type: "metric", text: "\n✔ Pinecone search complete in 12.4ms | 3 unique contexts returned" }
    ]
  },
  {
    id: "system-top",
    command: "trivisionx monitor --top --interval=1s",
    title: "Terminal Process Monitor (htop)",
    description: "Live ASCII worker thread monitoring, memory allocation, and agent concurrency.",
    output: [
      { type: "prompt", text: "sopan@trivisionx:~/projects/agent-matrix (main*)$ trivisionx monitor --top --interval=1s" },
      { type: "info", text: "TriVisionX Agent Matrix Process Monitor v2.4 | Uptime: 14d 06h 12m" },
      { type: "metric", text: "CPU  [████████████████████░░░░░░░░░░] 64.2%  | 8 Cores Active" },
      { type: "metric", text: "RAM  [████████████░░░░░░░░░░░░░░░░░░] 3.2GB / 16.0GB" },
      { type: "metric", text: "TPS  [████████████████████████████░░] 142.8 req/sec [PEAK]" },
      { type: "tree", text: "PID   WORKER_THREAD       STATUS    LATENCY   AGENT_TYPE" },
      { type: "tree", text: "---------------------------------------------------------------" },
      { type: "success", text: "4102  langgraph_worker_1  RUNNING   14ms      Router Node" },
      { type: "success", text: "4103  pinecone_indexer_3  RUNNING   18ms      Vector MMR" },
      { type: "success", text: "4104  python_sandbox_0    RUNNING   62ms      Code Sandbox" },
      { type: "success", text: "4105  gemini_gateway_2    STREAMING 110ms     LLM Router" }
    ]
  }
];

export function TerminalShowcase() {
  const [selectedPreset, setSelectedPreset] = useState<CommandPreset>(COMMAND_PRESETS[0]);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"cli" | "topology" | "stats">("cli");
  const [renderedLines, setRenderedLines] = useState<number>(0);

  // Typewriter line animation whenever preset changes
  useEffect(() => {
    setRenderedLines(0);
    const interval = setInterval(() => {
      setRenderedLines((prev) => {
        if (prev < selectedPreset.output.length) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [selectedPreset]);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedPreset.command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-24 px-4 bg-background relative border-t border-border overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-mono font-semibold text-primary mb-4 tracking-wider uppercase shadow-xs"
          >
            <TerminalIcon className="w-3.5 h-3.5 animate-pulse" />
            Developer-First CLI & Terminal Matrix
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight mb-4"
          >
            Handcrafted Interactive Terminal Interface
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base leading-relaxed"
          >
            Execute agent workflows directly from your command line. Inspect real-time execution outputs, sub-second vector queries, and system process telemetry.
          </motion.p>
        </div>

        {/* Outer Terminal Container with ONE-SIDE BLUR GLASS EFFECT */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="rounded-3xl border border-border bg-card/90 shadow-2xl overflow-hidden"
        >
          {/* Top Mac/Linux Window Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-muted/60 border-b border-border select-none">
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <span className="w-3 h-3 rounded-full bg-destructive/80 hover:bg-destructive cursor-pointer transition-colors" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 hover:bg-amber-500 cursor-pointer transition-colors" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 hover:bg-emerald-500 cursor-pointer transition-colors" />
              </div>
              <div className="flex items-center gap-2 border-l border-border pl-4 font-mono text-xs text-muted-foreground">
                <TerminalIcon className="w-4 h-4 text-primary" />
                <span className="font-bold text-foreground">trivisionx-cli v2.4.0</span>
                <span className="text-muted-foreground/60">— bash 120x34</span>
              </div>
            </div>

            {/* Quick Action Copy Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-mono text-foreground hover:bg-accent hover:text-accent-foreground transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-primary" />}
                <span>{copied ? "Copied to Clipboard!" : "Copy Command"}</span>
              </button>
            </div>
          </div>

          {/* Grid Layout: LEFT Frosted Blur Sidebar & RIGHT Live Terminal Output */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
            
            {/* LEFT SIDE: Asymmetrical Frosted Blur Command Selector Sidebar */}
            <div className="lg:col-span-4 relative p-6 bg-card/60 backdrop-blur-2xl border-b lg:border-b-0 lg:border-r border-border flex flex-col justify-between z-20">
              {/* Decorative side accent line */}
              <div className="absolute top-0 left-0 bottom-0 w-1 bg-primary opacity-90" />

              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-wider block mb-1">
                    CLI Command Presets
                  </span>
                  <h3 className="text-lg font-bold text-foreground mb-1">Select Execution Script</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Click any preset below to trigger the interactive terminal execution.
                  </p>
                </div>

                {/* Preset List */}
                <div className="space-y-3 font-mono text-xs">
                  {COMMAND_PRESETS.map((preset) => {
                    const isSelected = selectedPreset.id === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => setSelectedPreset(preset)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer group ${
                          isSelected
                            ? "bg-primary/10 border-primary/40 shadow-xs"
                            : "bg-muted/40 border-border hover:bg-accent/60 hover:border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`font-bold text-[11px] ${isSelected ? "text-primary" : "text-foreground"}`}>
                            {preset.title}
                          </span>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                          )}
                        </div>
                        <p className="text-[10.5px] text-muted-foreground line-clamp-2 leading-relaxed mb-2">
                          {preset.description}
                        </p>
                        <code className="text-[9.5px] text-primary block truncate bg-background p-1.5 rounded border border-border">
                          $ {preset.command}
                        </code>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar Footer Stats */}
              <div className="pt-4 border-t border-border flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                <span>Shell: ZSH / Bash</span>
                <span className="text-primary font-bold">Node runtime: v2.4</span>
              </div>
            </div>

            {/* RIGHT SIDE: Handcrafted Interactive Terminal Display */}
            <div className="lg:col-span-8 p-6 bg-card font-mono text-xs flex flex-col justify-between relative overflow-hidden">
              {/* Subtle CRT matrix scanlines */}
              <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: "linear-gradient(to bottom, transparent 50%, rgba(255, 255, 255, 0.25) 51%)",
                  backgroundSize: "100% 4px"
                }}
              />

              <div className="space-y-3 relative z-10 overflow-x-auto scrollbar-thin pb-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedPreset.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-2 leading-relaxed"
                  >
                    {selectedPreset.output.slice(0, renderedLines).map((line, idx) => {
                      if (line.type === "prompt") {
                        return (
                          <div key={idx} className="text-emerald-400 font-bold flex items-center gap-2">
                            <span>{line.text}</span>
                            <span className="w-2 h-4 bg-emerald-400 inline-block animate-pulse" />
                          </div>
                        );
                      }
                      if (line.type === "info") {
                        return (
                          <div key={idx} className="text-blue-400">
                            {line.text}
                          </div>
                        );
                      }
                      if (line.type === "agent") {
                        return (
                          <div key={idx} className="text-purple-300 font-semibold pl-2">
                            {line.text}
                          </div>
                        );
                      }
                      if (line.type === "success") {
                        return (
                          <div key={idx} className="text-emerald-300 pl-4 font-semibold">
                            {line.text}
                          </div>
                        );
                      }
                      if (line.type === "table") {
                        return (
                          <div key={idx} className="text-zinc-400 font-mono">
                            {line.text}
                          </div>
                        );
                      }
                      if (line.type === "metric") {
                        return (
                          <div key={idx} className="text-amber-400 font-bold pt-2 border-t border-zinc-800/80">
                            {line.text}
                          </div>
                        );
                      }
                      return (
                        <div key={idx} className="text-zinc-300">
                          {line.text}
                        </div>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Terminal Bottom Status Ribbon */}
              <div className="pt-4 border-t border-zinc-900 flex flex-wrap items-center justify-between text-[10px] text-zinc-500 font-mono relative z-10">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    CLI READY
                  </span>
                  <span>Exit Code: 0 (OK)</span>
                </div>
                <span className="text-zinc-600">Type 'trivisionx --help' for options</span>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  );
}
