"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Cpu,
  Database,
  TrendingUp,
  Server,
  CheckCircle2,
  Terminal as TerminalIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TextAnimate } from "@/components/ui/text-animate";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis } from "recharts";


const chartData = [
  { time: "00:00", tps: 110, tokens: 3200 },
  { time: "00:02", tps: 132, tokens: 3900 },
  { time: "00:04", tps: 125, tokens: 3700 },
  { time: "00:06", tps: 168, tokens: 4600 },
  { time: "00:08", tps: 142, tokens: 4200 },
  { time: "00:10", tps: 184, tokens: 5100 },
  { time: "00:12", tps: 175, tokens: 4820 },
];

const chartConfig = {
  tps: {
    label: "Requests / Sec",
    color: "#10b981",
  },
  tokens: {
    label: "Tokens / Sec",
    color: "#22c55e",
  },
} satisfies ChartConfig;

/* =========================================================================
   LOG ENTRY INTERFACE & MOCK DATA FOR SECTION 4
   ========================================================================= */
interface LogEntry {
  id: string;
  timestamp: string;
  category: "ROUTER" | "RAG_VECTOR" | "LLM_CALL" | "CODE_EXEC" | "CITATIONS";
  level: "INFO" | "SUCCESS" | "WARN" | "EXEC";
  agent: string;
  message: string;
  latency: string;
  payload?: Record<string, any>;
}

const MOCK_LOGS: Omit<LogEntry, "id" | "timestamp">[] = [
  {
    category: "ROUTER",
    level: "INFO",
    agent: "LangGraph Intent Router",
    message: "Evaluating query intent: 'Compare DeepSeek R1 vs Claude 3.7'",
    latency: "+2ms",
    payload: { confidence: 0.98, target_agents: ["retriever", "coder"] }
  },
  {
    category: "RAG_VECTOR",
    level: "EXEC",
    agent: "Pinecone MMR Engine",
    message: "Querying index 'trivisionx-mmr' with diversity lambda = 0.75",
    latency: "+18ms",
    payload: { top_k: 5, similarity_avg: 0.942 }
  },
  {
    category: "RAG_VECTOR",
    level: "SUCCESS",
    agent: "Vector Context Assembly",
    message: "Retrieved 5 dense context chunks (1,024 tokens)",
    latency: "+6ms",
    payload: { chunk_ids: ["doc_881", "doc_902", "doc_411"] }
  },
  {
    category: "LLM_CALL",
    level: "EXEC",
    agent: "Gemini 1.5 Gateway",
    message: "Initiating stream request with temperature=0.2",
    latency: "+110ms",
    payload: { model: "gemini-1.5-pro", prompt_tokens: 1420 }
  },
  {
    category: "CODE_EXEC",
    level: "SUCCESS",
    agent: "Unit Test Executor",
    message: "Pytest suite passed: test_agent_graph() -> PASS (0 errors)",
    latency: "+84ms",
    payload: { exit_code: 0 }
  },
  {
    category: "CITATIONS",
    level: "SUCCESS",
    agent: "Citation Auditor",
    message: "100% reference sources verified against Pinecone vector hashes",
    latency: "+14ms",
    payload: { verified_references: 8, score: 0.992 }
  }
];

export function FeatureShowcaseSections() {
  /* Dynamic telemetry tick for live visual metrics */
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((prev) => prev + 1), 1800);
    return () => clearInterval(interval);
  }, []);

  const currentTps = (142.4 + Math.sin(tick * 0.8) * 12.5).toFixed(1);
  const avgLatency = (48 + Math.cos(tick * 0.5) * 4).toFixed(0);

  /* Logs stream state for Section 4 */
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const poolIdxRef = useRef(0);
  const logBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initial: LogEntry[] = MOCK_LOGS.slice(0, 3).map((item, idx) => ({
      ...item,
      id: `log-${Date.now()}-${idx}`,
      timestamp: new Date(Date.now() - (3 - idx) * 1500).toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }) + `.${Math.floor(Math.random() * 900 + 100)}`
    }));
    setLogs(initial);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const template = MOCK_LOGS[poolIdxRef.current % MOCK_LOGS.length];
      poolIdxRef.current += 1;
      const now = new Date();
      const timeStr =
        now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }) +
        `.${Math.floor(Math.random() * 900 + 100)}`;
      const newLog: LogEntry = {
        ...template,
        id: `log-${Date.now()}-${Math.random()}`,
        timestamp: timeStr,
      };
      setLogs((prev) => [...prev.slice(-25), newLog]);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logBoxRef.current) {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-background text-foreground space-y-0 selection:bg-primary/20">

      {/* =========================================================================
         SECTION 1: AGENT EXECUTION VELOCITY (FIXED HYDRATION NESTED P TAG)
         ========================================================================= */}
      <section className="py-24 px-4 bg-background border-t border-border overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* LEFT SIDE: Description & Metrics */}
          <div className="lg:col-span-6 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="secondary" className="font-mono gap-1.5 py-1 px-3">
                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                REAL-TIME EXECUTION VELOCITY
              </Badge>
            </motion.div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
              <TextAnimate animation="blurInUp" by="word" startOnView once>
                Sub-Second Agent Concurrency & Throughput
              </TextAnimate>
            </h2>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-muted-foreground text-base sm:text-lg leading-relaxed"
            >
              <TextAnimate animation="fadeIn" by="line" startOnView once delay={0.2} as="div">
                Orchestrate high-frequency multi-agent state machines with zero latency bottlenecks. Monitor real-time execution speeds, sub-agent token throughput, and parallel execution pipelines.
              </TextAnimate>
            </motion.div>

            {/* BORDERLESS STATS ROW WITH TEXT ANIMATIONS */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="grid grid-cols-3 gap-6 font-mono pt-4 border-t border-border"
            >
              <div>
                <span className="text-muted-foreground text-xs block mb-1">Requests / Sec</span>
                <span className="text-3xl font-extrabold text-foreground">{currentTps}</span>
                <Badge variant="outline" className="mt-1.5 text-[10px] border-emerald-500/30 text-emerald-500 bg-emerald-500/10 font-mono">
                  +14.2% peak
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground text-xs block mb-1">Tokens / Sec</span>
                <span className="text-3xl font-extrabold text-emerald-500">
                  4,820
                </span>
                <span className="text-[10px] text-muted-foreground block mt-1">streaming</span>
              </div>
              <div>
                <span className="text-muted-foreground text-xs block mb-1">Avg Latency</span>
                <span className="text-3xl font-extrabold text-emerald-500">
                  {avgLatency}ms
                </span>
                <Badge variant="outline" className="mt-1.5 text-[10px] border-emerald-500/30 text-emerald-500 bg-emerald-500/10 font-mono">
                  optimal
                </Badge>
              </div>
            </motion.div>
          </div>

          {/* RIGHT SIDE: VIBRANT GREEN SHADCN CHART VISUAL */}
          <div className="lg:col-span-6 relative w-full h-[340px] flex flex-col justify-end">
            <div className="w-full h-full flex flex-col justify-between font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-foreground font-bold flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <TextAnimate animation="fadeIn" by="character" startOnView once as="span">
                    Execution Telemetry Stream
                  </TextAnimate>
                </span>
                <Badge variant="secondary" className="font-mono text-emerald-500 border-emerald-500/30 bg-emerald-500/10">
                  142 REQ/S LIVE
                </Badge>
              </div>

              {/* SHADCN CHART CONTAINER */}
              <div className="h-64 w-full relative">
                <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillGreenTps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} domain={['dataMin - 20', 'dataMax + 20']} />
                    <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                    <Area type="monotone" dataKey="tps" stroke="#10b981" strokeWidth={3} fill="url(#fillGreenTps)" />
                  </AreaChart>
                </ChartContainer>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
         SECTION 2: VECTOR RAG INTELLIGENCE (TEXT ANIMATIONS)
         ========================================================================= */}
      <section className="py-24 px-4 bg-background border-t border-border overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* LEFT SIDE: VECTOR MATRIX */}
          <div className="lg:col-span-6 relative w-full h-[340px] flex items-center justify-center order-2 lg:order-1">
            <div className="w-full h-full flex flex-col justify-between font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-foreground font-bold flex items-center gap-2 text-sm">
                  <Database className="w-4 h-4 text-emerald-500" />
                  <TextAnimate animation="fadeIn" by="character" startOnView once as="span">
                    Pinecone MMR Embedding Space
                  </TextAnimate>
                </span>
                <Badge variant="secondary" className="font-mono">
                  1536-DIM COHERE
                </Badge>
              </div>

              {/* FLOATING SCATTER MATRIX */}
              <div className="h-64 w-full relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-56 h-56 rounded-full border border-border" />
                  <div className="w-36 h-36 rounded-full border border-border absolute" />
                </div>

                <div className="relative z-10 w-full h-full flex items-center justify-center">
                  {[
                    { score: "0.98", label: "Agentic Loop Spec", color: "#10b981", top: "15%", left: "15%" },
                    { score: "0.94", label: "Pinecone Index Config", color: "#3b82f6", top: "60%", left: "20%" },
                    { score: "0.91", label: "LangGraph State Schema", color: "#22c55e", top: "30%", left: "60%" },
                    { score: "0.89", label: "DeepSeek R1 Benchmark", color: "#f59e0b", top: "70%", left: "55%" },
                  ].map((vec, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.1 }}
                      style={{ position: "absolute", top: vec.top, left: vec.left }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-card-foreground text-[10.5px] shadow-sm font-mono"
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: vec.color }} />
                      <span className="text-foreground">{vec.label}</span>
                      <span className="font-bold text-emerald-500">{vec.score}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Description & Metrics */}
          <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Badge variant="secondary" className="font-mono gap-1.5 py-1 px-3">
                <Database className="w-3.5 h-3.5 text-emerald-500" />
                AUTONOMOUS VECTOR RAG
              </Badge>
            </motion.div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
              <TextAnimate animation="blurInUp" by="word" startOnView once>
                Semantic Context Injection with Pinecone MMR
              </TextAnimate>
            </h2>

            <div className="text-muted-foreground text-base sm:text-lg leading-relaxed">
              <TextAnimate animation="fadeIn" by="line" startOnView once delay={0.2} as="div">
                Eliminate hallucinations with dense semantic context injection. Our retriever agent applies Maximal Marginal Relevance (MMR) over Pinecone vector indexes to filter noise and surface pristine document chunks.
              </TextAnimate>
            </div>

            <div className="space-y-3 font-mono text-sm pt-4 border-t border-border">
              <div className="flex items-center gap-3 text-foreground">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>1,420,890+ high-dimensional document vectors indexed</span>
              </div>
              <div className="flex items-center gap-3 text-foreground">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Sub-15ms vector query latency with MMR lambda = 0.75</span>
              </div>
              <div className="flex items-center gap-3 text-foreground">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Automated source hashing & citation audit verification</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
         SECTION 3: DYNAMIC MULTI-LLM GATEWAY (TEXT ANIMATIONS)
         ========================================================================= */}
      <section className="py-24 px-4 bg-background border-t border-border overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* LEFT SIDE: Description & Metrics */}
          <div className="lg:col-span-6 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Badge variant="secondary" className="font-mono gap-1.5 py-1 px-3">
                <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                DYNAMIC MODEL GATEWAY
              </Badge>
            </motion.div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
              <TextAnimate animation="blurInUp" by="word" startOnView once>
                Intelligent Multi-Model Load Balancing
              </TextAnimate>
            </h2>

            <div className="text-muted-foreground text-base sm:text-lg leading-relaxed">
              <TextAnimate animation="fadeIn" by="line" startOnView once delay={0.2} as="div">
                Dynamically route sub-agent prompts to the optimal LLM runtime based on reasoning complexity, latency requirements, and cost thresholds—switching seamlessly between Gemini 1.5, Claude 3.7, DeepSeek R1, and GPT-4o.
              </TextAnimate>
            </div>

            <div className="grid grid-cols-2 gap-6 font-mono text-xs pt-4 border-t border-border">
              <div>
                <span className="font-bold block mb-1 text-sm text-emerald-500">
                  Gemini 1.5 Pro
                </span>
                <span className="text-muted-foreground text-xs">45% Traffic (110ms avg)</span>
              </div>
              <div>
                <span className="font-bold block mb-1 text-sm text-foreground">
                  Claude 3.7 Sonnet
                </span>
                <span className="text-muted-foreground text-xs">30% Traffic (180ms avg)</span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: SHADCN PROGRESS BARS USING HIGH CONTRAST COLORS */}
          <div className="lg:col-span-6 relative w-full h-[340px] flex flex-col justify-center">
            <div className="w-full space-y-6 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-foreground font-bold flex items-center gap-2 text-sm">
                  <Server className="w-4 h-4 text-emerald-500" />
                  <TextAnimate animation="fadeIn" by="character" startOnView once as="span">
                    Model Traffic Distribution
                  </TextAnimate>
                </span>
                <Badge variant="secondary" className="font-mono">
                  ACTIVE ROUTER
                </Badge>
              </div>

              {[
                { name: "Google Gemini 1.5 Pro", usage: 45, latency: "110ms", color: "#10b981" },
                { name: "Claude 3.7 Sonnet", usage: 30, latency: "180ms", color: "#3b82f6" },
                { name: "DeepSeek R1 Reasoning", usage: 15, latency: "140ms", color: "#ec4899" },
                { name: "OpenAI GPT-4o Gateway", usage: 10, latency: "160ms", color: "#22c55e" },
              ].map((model, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-xs text-foreground">
                    <span className="font-bold flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: model.color }} />
                      {model.name}
                    </span>
                    <span className="text-muted-foreground">{model.usage}% ({model.latency})</span>
                  </div>
                  <Progress value={model.usage} className="h-2 bg-muted border border-border" style={{ "--primary": model.color } as React.CSSProperties} />
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
         SECTION 4: REAL-TIME LOGS & OBSERVABILITY (TEXT ANIMATIONS)
         ========================================================================= */}
      <section className="py-24 px-4 bg-background border-t border-border overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* LEFT SIDE: STREAMING LOG LINES */}
          <div className="lg:col-span-6 relative w-full h-[340px] font-mono text-xs order-2 lg:order-1 flex flex-col justify-between">
            <div className="w-full h-full flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-foreground font-bold flex items-center gap-2 text-sm">
                  <TerminalIcon className="w-4 h-4 text-emerald-500" />
                  <TextAnimate animation="fadeIn" by="character" startOnView once as="span">
                    Live Event Telemetry Stream
                  </TextAnimate>
                </span>
                <Badge variant="secondary" className="font-mono text-emerald-500 border-emerald-500/30 bg-emerald-500/10">
                  LIVE LOGS
                </Badge>
              </div>

              {/* STREAMING LOG LINES WITH NEUTRAL SHADCN THEME */}
              <div ref={logBoxRef} className="h-64 overflow-y-auto space-y-2 scrollbar-thin">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="py-2 px-3 rounded-lg border-l-2 border-l-emerald-500 border border-border bg-card text-card-foreground cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <div className="flex items-center justify-between text-[10.5px]">
                      <span className="text-muted-foreground">{log.timestamp}</span>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-border text-emerald-500">
                        {log.category}
                      </Badge>
                    </div>
                    <div className="text-foreground font-bold text-[11px] mt-0.5">{log.agent}</div>
                    <div className="text-muted-foreground text-[10.5px] truncate">{log.message}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Description & Metrics */}
          <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Badge variant="secondary" className="font-mono gap-1.5 py-1 px-3">
                <TerminalIcon className="w-3.5 h-3.5 text-emerald-500" />
                REAL-TIME OBSERVABILITY
              </Badge>
            </motion.div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
              <TextAnimate animation="blurInUp" by="word" startOnView once>
                Full-Stack Tracing & Live Event Log Telemetry
              </TextAnimate>
            </h2>

            <div className="text-muted-foreground text-base sm:text-lg leading-relaxed">
              <TextAnimate animation="fadeIn" by="line" startOnView once delay={0.2} as="div">
                Gain full observability into every sub-agent step. Track prompt inputs, tool invocations, vector similarity hits, and execution logs in real time with interactive inspection.
              </TextAnimate>
            </div>

            <div className="space-y-3 font-mono text-sm pt-4 border-t border-border">
              <div className="flex items-center gap-3 text-foreground">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Real-time streaming log feed with millisecond timestamps</span>
              </div>
              <div className="flex items-center gap-3 text-foreground">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Click-to-inspect structured JSON payloads</span>
              </div>
              <div className="flex items-center gap-3 text-foreground">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Automated self-healing error detection & alerts</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* JSON Inspection Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card text-card-foreground border border-border rounded-2xl p-6 max-w-lg w-full font-mono text-xs space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="font-bold text-foreground text-sm">Log Event Details</span>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-muted-foreground hover:text-foreground px-2 py-1 bg-muted rounded text-xs cursor-pointer"
              >
                Close [ESC]
              </button>
            </div>
            <div className="space-y-1.5">
              <div><span className="text-muted-foreground">Agent:</span> <span className="text-foreground font-bold">{selectedLog.agent}</span></div>
              <div><span className="text-muted-foreground">Category:</span> <span className="text-emerald-500 font-bold">{selectedLog.category}</span></div>
              <div><span className="text-muted-foreground">Message:</span> <span className="text-foreground">{selectedLog.message}</span></div>
            </div>
            <pre className="p-3 bg-muted rounded-xl border border-border text-foreground text-[10px] overflow-x-auto font-mono">
              {JSON.stringify(selectedLog.payload || { message: selectedLog.message }, null, 2)}
            </pre>
          </div>
        </div>
      )}

    </div>
  );
}
