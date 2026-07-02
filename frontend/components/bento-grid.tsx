"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import {
  Bot, Search, Brain, FileText, Code, Sparkles, Cpu, Database,
  GitMerge, Terminal, FileCheck, Activity, Play, CheckCircle2
} from "lucide-react";

function AgentWorkflowVisual() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 6);
    }, 2000);
    return () => clearInterval(interval);
  }, []);


  const nodes = [
    { id: "planner", label: "Router", x: 40, y: 50, color: "text-purple-400" },
    { id: "retriever", label: "Retriever", x: 120, y: 20, color: "text-blue-400" },
    { id: "coder", label: "Code Dev", x: 120, y: 80, color: "text-rose-400" },
    { id: "summarizer", label: "Summarizer", x: 200, y: 50, color: "text-amber-400" },
    { id: "reporter", label: "Reporter", x: 280, y: 50, color: "text-emerald-400" },
  ];

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-background/90 rounded-2xl border border-border/80 w-full max-w-lg mx-auto shadow-2xl">
      <div className="relative w-full aspect-[320/120]">
        <svg viewBox="0 0 320 120" className="w-full h-full">
          {/* Base Connection Lines */}
          <path d="M 40 60 L 120 30" stroke="#27272a" strokeWidth="2" fill="none" />
          <path d="M 40 60 L 120 90" stroke="#27272a" strokeWidth="2" fill="none" />
          <path d="M 120 30 L 200 60" stroke="#27272a" strokeWidth="2" fill="none" />
          <path d="M 120 90 L 200 60" stroke="#27272a" strokeWidth="2" fill="none" />
          <path d="M 200 60 L 280 60" stroke="#27272a" strokeWidth="2" fill="none" />

          {/* Glowing Animated Flows */}
          {step === 2 && (
            <motion.path
              d="M 40 60 L 120 30"
              stroke="url(#purpleGlow)"
              strokeWidth="2.5"
              fill="none"
              strokeDasharray="10 5"
              animate={{ strokeDashoffset: [-30, 0] }}
              transition={{ repeat: Infinity, ease: "linear", duration: 1 }}
            />
          )}
          {step === 3 && (
            <motion.path
              d="M 40 60 L 120 90"
              stroke="url(#purpleGlow)"
              strokeWidth="2.5"
              fill="none"
              strokeDasharray="10 5"
              animate={{ strokeDashoffset: [-30, 0] }}
              transition={{ repeat: Infinity, ease: "linear", duration: 1 }}
            />
          )}
          {step === 4 && (
            <>
              <motion.path
                d="M 120 30 L 200 60"
                stroke="url(#purpleGlow)"
                strokeWidth="2.5"
                fill="none"
                strokeDasharray="10 5"
                animate={{ strokeDashoffset: [-30, 0] }}
                transition={{ repeat: Infinity, ease: "linear", duration: 1 }}
              />
              <motion.path
                d="M 120 90 L 200 60"
                stroke="url(#purpleGlow)"
                strokeWidth="2.5"
                fill="none"
                strokeDasharray="10 5"
                animate={{ strokeDashoffset: [-30, 0] }}
                transition={{ repeat: Infinity, ease: "linear", duration: 1 }}
              />
            </>
          )}
          {step === 5 && (
            <motion.path
              d="M 200 60 L 280 60"
              stroke="url(#purpleGlow)"
              strokeWidth="2.5"
              fill="none"
              strokeDasharray="10 5"
              animate={{ strokeDashoffset: [-30, 0] }}
              transition={{ repeat: Infinity, ease: "linear", duration: 1 }}
            />
          )}

          {/* Definitions for gradients */}
          <defs>
            <linearGradient id="purpleGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>

          {/* Node Circles and Labels */}
          {nodes.map((node) => {
            const isActive =
              (node.id === "planner" && step === 1) ||
              (node.id === "retriever" && step === 2) ||
              (node.id === "coder" && step === 3) ||
              (node.id === "summarizer" && step === 4) ||
              (node.id === "reporter" && step === 5);

            return (
              <g key={node.id}>
                {/* Node outer glow */}
                {isActive && (
                  <motion.circle
                    cx={node.x}
                    cy={node.y}
                    r="14"
                    fill="none"
                    stroke="rgba(167, 139, 250, 0.4)"
                    strokeWidth="1.5"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                )}
                {/* Node main circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="8"
                  fill={isActive ? "#a78bfa" : "#18181b"}
                  stroke={isActive ? "#c084fc" : "#27272a"}
                  strokeWidth="2"
                  className="transition-colors duration-300"
                />
                {/* Text Label */}
                <text
                  x={node.x}
                  y={node.y + 20}
                  textAnchor="middle"
                  className={`text-[9px] font-mono select-none font-medium transition-colors duration-300 ${isActive ? node.color + " font-bold" : "fill-zinc-500"
                    }`}
                  fill={isActive ? "currentColor" : "#71717a"}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Dynamic Status Text */}
      <div className="h-6 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.span
            key={step}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="text-[10px] font-mono text-muted-foreground bg-card/60 px-3 py-1 rounded-full border border-border/80"
          >
            {step === 0 && "System Idle â€” Awaiting research prompt..."}
            {step === 1 && "Smart Router: Analyzing query & selecting optimal workflow..."}
            {step === 2 && "Retrieval Agent: Querying vector chunks via Pinecone MMR..."}
            {step === 3 && "Code Dev Agent: Generating clean technical algorithms..."}
            {step === 4 && "Summary Agent: Synthesizing data into markdown answer..."}
            {step === 5 && "Report Agent: Constructing finalized citations & report..."}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}

function RetrievalVisual() {
  const [queryText, setQueryText] = useState("");
  const fullQueryText = "Query: 'DeepSeek R1 vs Claude 3.7'";
  const [active, setActive] = useState(0);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setQueryText(fullQueryText.substring(0, index));
      index++;
      if (index > fullQueryText.length + 8) {
        index = 0;
      }
    }, 120);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % 3);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const chunks = [
    { id: "doc_chunk_1", score: 0.96, text: "DeepSeek R1 uses reinforcement learning..." },
    { id: "doc_chunk_2", score: 0.89, text: "Claude 3.7 provides agentic reasoning loops..." },
    { id: "doc_chunk_3", score: 0.74, text: "Comparative benchmark tests show..." },
  ];

  return (
    <div className="space-y-3 font-mono text-xs w-full">
      {/* Mock Search Bar */}
      <div className="flex items-center gap-2 p-2 bg-background rounded-lg border border-border/80 text-[10px] text-muted-foreground">
        <Search className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
        <span className="text-muted-foreground font-bold whitespace-nowrap">{queryText}</span>
        <span className="w-1 h-3.5 bg-purple-400 animate-pulse-glow" />
      </div>

      {/* Retrieved results */}
      <div className="space-y-1.5">
        {chunks.map((chunk, i) => (
          <motion.div
            key={chunk.id}
            animate={active === i ? { opacity: 1, x: 4 } : { opacity: 0.4, x: 0 }}
            className={`p-2 rounded border transition-all ${active === i
                ? "border-purple-500/30 bg-purple-500/5 text-purple-400"
                : "border-border bg-transparent text-muted-foreground"
              }`}
          >
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-bold flex items-center gap-1">
                <Database className="w-3 h-3 text-purple-500/70" />
                {chunk.id}
              </span>
              <span className="text-emerald-400 font-bold">{chunk.score * 100}% sim</span>
            </div>
            <div className="text-[10px] mt-1 truncate">{chunk.text}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function MultiLlmVisual() {
  const [queryIndex, setQueryIndex] = useState(0);

  const queries = [
    { text: "Synthesize 100k docs", model: "Gemini", color: "text-purple-400 border-purple-500/20 bg-purple-500/5" },
    { text: "Optimize AST parser", model: "DeepSeek", color: "text-pink-400 border-pink-500/20 bg-pink-500/5" },
    { text: "Entity extraction", model: "GPT-4o", color: "text-indigo-400 border-indigo-500/20 bg-indigo-500/5" },
    { text: "Complex reasoning step", model: "Claude", color: "text-fuchsia-400 border-fuchsia-500/20 bg-fuchsia-500/5" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setQueryIndex((prev) => (prev + 1) % queries.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [queries.length]);

  const activeQuery = queries[queryIndex];

  return (
    <div className="bg-background/80 p-3 rounded-xl border border-zinc-900/60 space-y-2.5 font-mono text-[9px] w-full shadow-lg">
      <div className="flex justify-between items-center text-muted-foreground text-[8px] pb-1.5 border-b border-zinc-900">
        <span>ACTIVE LLM GATEWAY ROUTER</span>
        <span className="flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
          LIVE
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 py-1.5">
        <div className="flex-1 bg-card/40 border border-zinc-900 p-2.5 rounded truncate text-muted-foreground font-bold">
          "{activeQuery.text}"
        </div>
        <div className="text-muted-foreground font-bold animate-pulse text-[11px]">âžœ</div>
        <div className={`px-3 py-2 rounded-xl border font-bold text-center w-20 transition-all duration-300 text-[10px] ${activeQuery.color} shadow-sm`}>
          {activeQuery.model}
        </div>
      </div>
    </div>
  );
}

function ReportVisual() {
  return (
    <div className="p-3 bg-background/80 rounded-xl border border-border/80 space-y-2.5 font-mono text-[10px] text-muted-foreground shadow-lg">
      <div className="flex justify-between items-center border-b border-border pb-1.5">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <FileText className="w-3.5 h-3.5 text-purple-400" />
          report_generator.md
        </span>
        <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
          <CheckCircle2 className="w-2.5 h-2.5" />
          SUCCESS
        </span>
      </div>
      <div className="space-y-1.5 text-[9px]">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Sections compiled</span>
          <span>100% (4/4)</span>
        </div>
        <div className="h-1 bg-card rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5 }}
            className="h-full bg-purple-500"
          />
        </div>
        <div className="flex flex-wrap gap-1 mt-2 pt-1 border-t border-zinc-900">
          <span className="px-1.5 py-0.5 bg-accent/60 rounded border border-border/50 text-muted-foreground flex items-center gap-1">
            <FileCheck className="w-2.5 h-2.5 text-purple-400" /> Citations
          </span>
          <span className="px-1.5 py-0.5 bg-accent/60 rounded border border-border/50 text-muted-foreground flex items-center gap-1">
            <GitMerge className="w-2.5 h-2.5 text-purple-400" /> Markdown
          </span>
          <span className="px-1.5 py-0.5 bg-accent/60 rounded border border-border/50 text-muted-foreground flex items-center gap-1">
            <Activity className="w-2.5 h-2.5 text-purple-400" /> Metrics
          </span>
        </div>
      </div>
    </div>
  );
}

function CodingLoopVisual() {
  const [step, setStep] = useState(0);
  const [codeSnippet, setCodeSnippet] = useState("");
  const fullCode = "def test_agent_graph():\n  # build graph\n  graph = get_graph()\n  assert graph.nodes > 0";

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setCodeSnippet(fullCode.substring(0, index));
      index++;
      if (index > fullCode.length + 15) {
        index = 0;
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 4);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-2.5 font-mono text-[9px] w-full bg-background/90 p-3 rounded-xl border border-border/80 shadow-lg">
      {/* Code Editor Mockup */}
      <div className="border border-zinc-900 bg-background p-2 rounded text-muted-foreground select-none">
        <div className="flex gap-1 mb-1.5 border-b border-zinc-900 pb-1 text-[8px] text-muted-foreground">
          <Terminal className="w-2.5 h-2.5 text-purple-400" />
          agent_test.py
        </div>
        <pre className="text-purple-400/90 whitespace-pre leading-relaxed h-[56px]">{codeSnippet}</pre>
        <span className="w-1 h-3 bg-purple-400 inline-block animate-pulse" />
      </div>

      {/* Compiler Terminal logs */}
      <div className="space-y-1.5 border-t border-zinc-900 pt-2 text-[8px]">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground flex items-center gap-1">
            <Play className="w-2.5 h-2.5 text-purple-500" />
            pytest test_agents.py
          </span>
          <span className={step === 3 ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
            {step === 0 && "initializing"}
            {step === 1 && "running planner"}
            {step === 2 && "executing tests"}
            {step === 3 && "PASS (4 passed)"}
          </span>
        </div>
      </div>
    </div>
  );
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export function BentoGrid() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features" className="py-24 px-4 bg-background text-foreground transition-colors">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 tracking-tight">
            Enterprise-Grade Agentic Automation
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
            Streamline complex workflows with self-correcting agent systems, semantic memory retrieval, and autonomous code execution loops.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {/* 1. Large Card: Multi-Agent Orchestration */}
          <motion.div
            variants={itemVariants}
            className="md:col-span-2 group relative p-5 md:p-6 rounded-2xl bg-card/40 border border-border/80 hover:border-border backdrop-blur-sm hover:scale-[1.01] transition-all duration-300 overflow-hidden"
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background:
                  "radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(167,139,250,0.06), transparent 40%)",
              }}
            />
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="flex-1">
                <div className="p-2 rounded-lg bg-accent/50 w-fit mb-4">
                  <Bot className="w-5 h-5 text-purple-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  Agentic Workflow Orchestration
                </h3>
                <p className="text-muted-foreground text-xs max-w-md mb-4 leading-relaxed">
                  Autonomous orchestration of specialized AI agents built with LangGraph. Intelligently routes and schedules tasks across planning, semantic querying, logic synthesis, and reporter agents.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>State-Machine loops (LangGraph backend)</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Dynamic task routing with parallel execution</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Self-healing cyclic planning loops</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 w-full flex items-center justify-center md:justify-end">
                <AgentWorkflowVisual />
              </div>
            </div>
          </motion.div>

          {/* 2. Semantic MMR Retrieval */}
          <motion.div
            variants={itemVariants}
            className="group relative p-5 rounded-2xl bg-card/40 border border-border/80 hover:border-border backdrop-blur-sm hover:scale-[1.01] transition-all duration-300 overflow-hidden flex flex-col justify-between"
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background:
                  "radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(167,139,250,0.06), transparent 40%)",
              }}
            />
            <div>
              <div className="p-2 rounded-lg bg-accent/50 w-fit mb-3">
                <Search className="w-4 h-4 text-purple-400" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1.5">Autonomous Context Retrieval</h3>
              <p className="text-muted-foreground text-xs mb-4 leading-relaxed">
                Automated semantic memory extraction using MMR over Pinecone vector stores, providing agents with contextually dense and noise-filtered local knowledge.
              </p>
            </div>
            <RetrievalVisual />
          </motion.div>

          {/* 3. Multi-LLM Gateway */}
          <motion.div
            variants={itemVariants}
            className="group relative p-5 rounded-2xl bg-card/40 border border-border/80 hover:border-border backdrop-blur-sm hover:scale-[1.01] transition-all duration-300 overflow-hidden flex flex-col justify-between"
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background:
                  "radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(167,139,250,0.06), transparent 40%)",
              }}
            />
            <div>
              <div className="p-2 rounded-lg bg-accent/50 w-fit mb-3">
                <Cpu className="w-4 h-4 text-purple-400" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1.5">Dynamic Model Routing</h3>
              <p className="text-muted-foreground text-xs mb-4 leading-relaxed">
                Automated routing of model calls across Gemini, Claude, OpenAI, and DeepSeek, dynamically matching individual agent tasks to the most efficient LLM runtime.
              </p>
            </div>
            <MultiLlmVisual />
          </motion.div>

          {/* 4. Structured Reports */}
          <motion.div
            variants={itemVariants}
            className="group relative p-5 rounded-2xl bg-card/40 border border-border/80 hover:border-border backdrop-blur-sm hover:scale-[1.01] transition-all duration-300 overflow-hidden flex flex-col justify-between"
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background:
                  "radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(167,139,250,0.06), transparent 40%)",
              }}
            />
            <div>
              <div className="p-2 rounded-lg bg-accent/50 w-fit mb-3">
                <FileText className="w-4 h-4 text-purple-400" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1.5">Automated Report Synthesis</h3>
              <p className="text-muted-foreground text-xs mb-4 leading-relaxed">
                Hands-free compilation of verified research reports, complete with auto-generated tables, references, and inline citation mapping.
              </p>
            </div>
            <ReportVisual />
          </motion.div>

          {/* 5. Autonomous Coding Loop */}
          <motion.div
            variants={itemVariants}
            className="group relative p-5 rounded-2xl bg-card/40 border border-border/80 hover:border-border backdrop-blur-sm hover:scale-[1.01] transition-all duration-300 overflow-hidden flex flex-col justify-between"
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background:
                  "radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(167,139,250,0.06), transparent 40%)",
              }}
            />
            <div>
              <div className="p-2 rounded-lg bg-accent/50 w-fit mb-3">
                <Code className="w-4 h-4 text-purple-400" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1.5">Self-Correcting Coding Loop</h3>
              <p className="text-muted-foreground text-xs mb-4 leading-relaxed">
                An autonomous loop that generates, executes, audits, and debugs code scripts until all unit tests pass successfully without human intervention.
              </p>
            </div>
            <CodingLoopVisual />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
