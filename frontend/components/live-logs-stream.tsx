"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal,
  Play,
  Pause,
  Trash2,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
  Cpu,
  Database,
  Code,
  Sparkles,
  ChevronRight,
  Maximize2
} from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: string;
  category: "ROUTER" | "RAG_VECTOR" | "LLM_CALL" | "CODE_EXEC" | "CITATIONS";
  level: "INFO" | "SUCCESS" | "WARN" | "EXEC";
  agent: string;
  message: string;
  latency: string;
  payload?: Record<string, any>;
  isNew?: boolean;
}

const MOCK_LOG_POOL: Omit<LogEntry, "id" | "timestamp" | "isNew">[] = [
  {
    category: "ROUTER",
    level: "INFO",
    agent: "LangGraph Intent Router",
    message: "Evaluating incoming query token intent: 'Compare DeepSeek R1 vs Claude 3.7 Sonnet'",
    latency: "+2ms",
    payload: { state: "INTENT_ANALYSIS", confidence: 0.98, target_agents: ["retriever", "coder"] }
  },
  {
    category: "RAG_VECTOR",
    level: "EXEC",
    agent: "Pinecone MMR Engine",
    message: "Querying index 'trivisionx-docs-v2' with MMR diversity = 0.75",
    latency: "+18ms",
    payload: { top_k: 5, similarity_avg: 0.942, index: "us-east-1-pinecone" }
  },
  {
    category: "RAG_VECTOR",
    level: "SUCCESS",
    agent: "Vector Context Assembly",
    message: "Retrieved 5 relevant context chunks (1,024 tokens total)",
    latency: "+6ms",
    payload: { chunk_ids: ["doc_881", "doc_902", "doc_411"] }
  },
  {
    category: "LLM_CALL",
    level: "EXEC",
    agent: "Gemini 1.5 Gateway",
    message: "Initiating stream request with temperature=0.2, top_p=0.95",
    latency: "+110ms",
    payload: { model: "gemini-1.5-pro", prompt_tokens: 1420, max_completion: 4096 }
  },
  {
    category: "CODE_EXEC",
    level: "INFO",
    agent: "Python Sandbox Isolation",
    message: "Spawning micro-VM container for python ast syntax analysis",
    latency: "+42ms",
    payload: { sandbox_id: "sbx_9942a", memory_limit: "512MB", timeout: "5s" }
  },
  {
    category: "CODE_EXEC",
    level: "SUCCESS",
    agent: "Unit Test Executor",
    message: "Pytest suite execution completed: 4/4 assertions passed cleanly",
    latency: "+84ms",
    payload: { exit_code: 0, stdout: "test_graph_flow PASSED" }
  },
  {
    category: "CITATIONS",
    level: "SUCCESS",
    agent: "Citation Auditor",
    message: "Verified 100% of claims against Pinecone reference source hashes",
    latency: "+14ms",
    payload: { verified_references: 8, confidence_score: 0.992 }
  },
  {
    category: "ROUTER",
    level: "WARN",
    agent: "Rate Limiter Sentinel",
    message: "Burst capacity at 82% threshold - auto-allocating secondary worker thread",
    latency: "+1ms",
    payload: { worker_pool: "pool_us_east_2", scale_factor: 1.5 }
  }
];

export function LiveLogsStream() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const poolIndexRef = useRef(0);

  // Initialize with initial batch of logs
  useEffect(() => {
    const initialLogs: LogEntry[] = MOCK_LOG_POOL.slice(0, 4).map((item, idx) => ({
      ...item,
      id: `log-${Date.now()}-${idx}`,
      timestamp: new Date(Date.now() - (4 - idx) * 1500).toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }) + `.${Math.floor(Math.random() * 900 + 100)}`
    }));
    setLogs(initialLogs);
  }, []);

  // Streaming log generation interval
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      const template = MOCK_LOG_POOL[poolIndexRef.current % MOCK_LOG_POOL.length];
      poolIndexRef.current += 1;

      const now = new Date();
      const timeStr =
        now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        }) + `.${Math.floor(Math.random() * 900 + 100)}`;

      const newLog: LogEntry = {
        ...template,
        id: `log-${Date.now()}-${Math.random()}`,
        timestamp: timeStr,
        isNew: true
      };

      setLogs((prev) => [...prev.slice(-35), newLog]);
    }, 1600);

    return () => clearInterval(interval);
  }, [isStreaming]);

  // Auto-scroll to bottom of log terminal
  useEffect(() => {
    if (logContainerRef.current && isStreaming) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, isStreaming]);

  // Filtered log list
  const filteredLogs = logs.filter((log) => {
    const matchesCategory = filterCategory === "ALL" || log.category === filterCategory;
    const matchesSearch =
      searchQuery === "" ||
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.agent.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryBadge = (category: LogEntry["category"]) => {
    switch (category) {
      case "ROUTER":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "RAG_VECTOR":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "LLM_CALL":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "CODE_EXEC":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "CITATIONS":
        return "bg-rose-500/20 text-rose-300 border-rose-500/30";
      default:
        return "bg-zinc-800 text-zinc-300 border-zinc-700";
    }
  };

  const getLevelIcon = (level: LogEntry["level"]) => {
    switch (level) {
      case "SUCCESS":
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case "WARN":
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case "EXEC":
        return <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0 animate-pulse" />;
      default:
        return <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
    }
  };

  return (
    <section className="py-24 px-4 bg-zinc-950 relative border-t border-zinc-900 overflow-hidden">
      {/* Background terminal matrix glow */}
      <div className="absolute top-1/2 right-10 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono font-semibold text-emerald-400 mb-4 tracking-wider uppercase shadow-[0_0_15px_rgba(16,185,129,0.15)]"
          >
            <Terminal className="w-3.5 h-3.5 animate-pulse" />
            Live System & Sub-Agent Event Logs
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4"
          >
            Real-Time Observability Terminal
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-zinc-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed"
          >
            Trace step-by-step reasoning outputs, vector retrieval hits, and code execution logs with real-time effect streaming.
          </motion.p>
        </div>

        {/* Main Terminal Window */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="rounded-3xl border border-zinc-800 bg-zinc-950/90 shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden font-mono text-xs"
        >
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-zinc-900 border-b border-zinc-800 select-none">
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-zinc-300 font-bold flex items-center gap-2 text-xs border-l border-zinc-800 pl-3">
                <Terminal className="w-4 h-4 text-purple-400" />
                agent_system_logs_stream.log
              </span>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {["ALL", "ROUTER", "RAG_VECTOR", "LLM_CALL", "CODE_EXEC", "CITATIONS"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] transition-all cursor-pointer ${
                    filterCategory === cat
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold"
                      : "text-zinc-400 hover:text-zinc-200 border border-transparent"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Actions: Pause, Search, Clear */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-[11px] text-zinc-200 focus:outline-none focus:border-purple-500/50 w-36 sm:w-48"
                />
              </div>

              <button
                onClick={() => setIsStreaming(!isStreaming)}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isStreaming
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-zinc-800 text-zinc-400 border-zinc-700"
                }`}
                title={isStreaming ? "Pause Live Log Stream" : "Resume Live Log Stream"}
              >
                {isStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setLogs([])}
                className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                title="Clear Logs"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Terminal Logs Viewport */}
          <div
            ref={logContainerRef}
            className="h-[400px] overflow-y-auto p-4 space-y-2 scrollbar-thin bg-zinc-950/95 relative"
          >
            {/* Scanline Overlay */}
            <div
              className="absolute inset-0 opacity-[0.02] pointer-events-none"
              style={{
                backgroundImage: "linear-gradient(to bottom, transparent 50%, rgba(255, 255, 255, 0.2) 51%)",
                backgroundSize: "100% 4px"
              }}
            />

            {filteredLogs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-600 text-xs">
                No log entries matching filter...
              </div>
            ) : (
              filteredLogs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setSelectedLog(log)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    log.isNew
                      ? "bg-purple-500/10 border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.15)] border-l-4 border-l-purple-400"
                      : "bg-zinc-900/40 border-zinc-850 hover:bg-zinc-900/80 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3 overflow-hidden">
                    <span className="text-[10px] text-zinc-500 whitespace-nowrap shrink-0">{log.timestamp}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border shrink-0 ${getCategoryBadge(log.category)}`}>
                      {log.category}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {getLevelIcon(log.level)}
                      <span className="text-zinc-300 font-bold text-[11px] truncate max-w-[140px]">{log.agent}</span>
                    </div>
                    <span className="text-zinc-400 text-[11px] truncate group-hover:text-zinc-200">
                      {log.message}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-3 shrink-0 text-[10px]">
                    <span className="text-purple-400 font-bold">{log.latency}</span>
                    <span className="text-zinc-500 group-hover:text-purple-400 transition-colors">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Footer Status Bar */}
          <div className="px-6 py-3 bg-zinc-900/80 border-t border-zinc-800 flex flex-wrap items-center justify-between text-[10px] text-zinc-400 font-mono">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {isStreaming ? "STREAMING LIVE (48 events/min)" : "STREAM PAUSED"}
              </span>
              <span>Total Logs: {logs.length}</span>
            </div>
            <span className="text-zinc-500">Click any log row to inspect JSON payload</span>
          </div>
        </motion.div>
      </div>

      {/* JSON Payload Modal / Drawer */}
      <AnimatePresence>
        {selectedLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedLog(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl font-mono text-xs text-zinc-200 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-purple-400" />
                  <span className="font-bold text-white text-sm">Log Event Details</span>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-zinc-400 hover:text-white px-2 py-1 bg-zinc-800 rounded text-xs cursor-pointer"
                >
                  Close [ESC]
                </button>
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Agent:</span>
                  <span className="text-purple-300 font-bold">{selectedLog.agent}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Category:</span>
                  <span className="text-emerald-400 font-bold">{selectedLog.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Timestamp:</span>
                  <span className="text-zinc-300">{selectedLog.timestamp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Latency:</span>
                  <span className="text-amber-400">{selectedLog.latency}</span>
                </div>
              </div>

              <div>
                <span className="text-zinc-500 text-[10px] uppercase font-bold block mb-1">
                  Structured Payload:
                </span>
                <pre className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-purple-300 text-[10px] overflow-x-auto">
                  {JSON.stringify(selectedLog.payload || { message: selectedLog.message }, null, 2)}
                </pre>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
