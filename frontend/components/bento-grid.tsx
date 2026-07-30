"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import {
  Bot, Search, FileText, Code, Cpu, Database,
  GitMerge, Terminal, FileCheck, Activity, Play, CheckCircle2,
  Layers, ArrowRight
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

function AgentWorkflowVisual() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 6);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const nodes = [
    { id: "planner", label: "Router", x: 40, y: 50, color: "text-primary" },
    { id: "retriever", label: "Retriever", x: 120, y: 20, color: "text-primary" },
    { id: "coder", label: "Code Dev", x: 120, y: 80, color: "text-primary" },
    { id: "summarizer", label: "Summarizer", x: 200, y: 50, color: "text-primary" },
    { id: "reporter", label: "Reporter", x: 280, y: 50, color: "text-emerald-500" },
  ];

  return (
    <div className="flex flex-col items-center gap-3 p-3 bg-card border border-border rounded-xl w-full max-w-lg mx-auto shadow-sm">
      <div className="relative w-full aspect-[320/120]">
        <svg viewBox="0 0 320 120" className="w-full h-full">
          {/* Base Connection Lines */}
          <path d="M 40 60 L 120 30" className="stroke-border" strokeWidth="2" fill="none" />
          <path d="M 40 60 L 120 90" className="stroke-border" strokeWidth="2" fill="none" />
          <path d="M 120 30 L 200 60" className="stroke-border" strokeWidth="2" fill="none" />
          <path d="M 120 90 L 200 60" className="stroke-border" strokeWidth="2" fill="none" />
          <path d="M 200 60 L 280 60" className="stroke-border" strokeWidth="2" fill="none" />

          {/* Glowing Animated Flows */}
          {step === 2 && (
            <motion.path
              d="M 40 60 L 120 30"
              className="stroke-primary"
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
              className="stroke-primary"
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
                className="stroke-primary"
                strokeWidth="2.5"
                fill="none"
                strokeDasharray="10 5"
                animate={{ strokeDashoffset: [-30, 0] }}
                transition={{ repeat: Infinity, ease: "linear", duration: 1 }}
              />
              <motion.path
                d="M 120 90 L 200 60"
                className="stroke-primary"
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
              className="stroke-emerald-500"
              strokeWidth="2.5"
              fill="none"
              strokeDasharray="10 5"
              animate={{ strokeDashoffset: [-30, 0] }}
              transition={{ repeat: Infinity, ease: "linear", duration: 1 }}
            />
          )}

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
                    className="stroke-primary/40"
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
                  className={isActive ? "fill-primary stroke-primary" : "fill-muted stroke-border"}
                  strokeWidth="2"
                />
                {/* Text Label */}
                <text
                  x={node.x}
                  y={node.y + 20}
                  textAnchor="middle"
                  className={`text-[9px] font-mono select-none font-medium transition-colors duration-300 ${
                    isActive ? "fill-primary font-bold" : "fill-muted-foreground"
                  }`}
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
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="text-[10px] font-mono text-muted-foreground bg-muted px-3 py-0.5 rounded-full border border-border"
          >
            {step === 0 && "System Idle — Awaiting research prompt..."}
            {step === 1 && "Smart Router: Analyzing query & selecting workflow..."}
            {step === 2 && "Retrieval Agent: Querying vector chunks via Pinecone..."}
            {step === 3 && "Code Dev Agent: Generating clean technical algorithms..."}
            {step === 4 && "Summary Agent: Synthesizing data into markdown answer..."}
            {step === 5 && "Report Agent: Constructing finalized citations..."}
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
    <div className="space-y-2 font-mono text-xs w-full">
      {/* Mock Search Bar */}
      <div className="flex items-center gap-2 p-2 bg-muted/60 rounded-lg border border-border text-[10px]">
        <Search className="w-3.5 h-3.5 text-primary animate-pulse" />
        <span className="text-foreground font-bold whitespace-nowrap">{queryText}</span>
        <span className="w-1 h-3.5 bg-primary animate-pulse" />
      </div>

      {/* Retrieved results */}
      <div className="space-y-1.5">
        {chunks.map((chunk, i) => (
          <motion.div
            key={chunk.id}
            animate={active === i ? { opacity: 1, x: 3 } : { opacity: 0.5, x: 0 }}
            className={`p-2 rounded-lg border transition-all ${
              active === i
                ? "border-primary/50 bg-primary/10 text-foreground"
                : "border-border bg-card/60 text-muted-foreground"
            }`}
          >
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-bold flex items-center gap-1">
                <Database className="w-3 h-3 text-primary" />
                {chunk.id}
              </span>
              <Badge variant="outline" className="text-[8px] font-bold text-emerald-500 border-emerald-500/30 px-1 py-0">
                {chunk.score * 100}% sim
              </Badge>
            </div>
            <div className="text-[9.5px] mt-1 truncate text-muted-foreground">{chunk.text}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function MultiLlmVisual() {
  const [queryIndex, setQueryIndex] = useState(0);

  const queries = [
    { text: "Synthesize 100k docs", model: "Gemini 1.5" },
    { text: "Optimize AST parser", model: "DeepSeek R1" },
    { text: "Entity extraction", model: "GPT-4o" },
    { text: "Complex reasoning", model: "Claude 3.5" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setQueryIndex((prev) => (prev + 1) % queries.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [queries.length]);

  const activeQuery = queries[queryIndex];

  return (
    <div className="bg-card p-3 rounded-xl border border-border space-y-2 font-mono text-[9px] w-full shadow-sm">
      <div className="flex justify-between items-center text-muted-foreground text-[8px] pb-1.5 border-b border-border">
        <span>ACTIVE LLM GATEWAY ROUTER</span>
        <Badge variant="outline" className="text-[8px] text-emerald-500 border-emerald-500/30 gap-1 px-1.5 py-0">
          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
          LIVE
        </Badge>
      </div>

      <div className="flex items-center justify-between gap-2 py-1">
        <div className="flex-1 bg-muted p-2 rounded border border-border truncate text-foreground font-bold text-[10px]">
          "{activeQuery.text}"
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0 animate-pulse" />
        <Badge variant="secondary" className="px-2.5 py-1 text-[10px] font-bold shrink-0">
          {activeQuery.model}
        </Badge>
      </div>
    </div>
  );
}

function ReportVisual() {
  return (
    <div className="p-3 bg-card rounded-xl border border-border space-y-2.5 font-mono text-[10px] shadow-sm">
      <div className="flex justify-between items-center border-b border-border pb-1.5">
        <span className="flex items-center gap-1.5 text-foreground font-bold">
          <FileText className="w-3.5 h-3.5 text-primary" />
          report_generator.md
        </span>
        <Badge variant="outline" className="text-[8px] text-emerald-500 border-emerald-500/30 gap-1 px-1.5 py-0 font-bold">
          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
          SUCCESS
        </Badge>
      </div>
      <div className="space-y-1.5 text-[9px]">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Sections compiled</span>
          <span className="text-foreground font-bold">100% (4/4)</span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5 }}
            className="h-full bg-primary"
          />
        </div>
        <div className="flex flex-wrap gap-1 mt-2 pt-1 border-t border-border">
          <Badge variant="secondary" className="text-[8px] gap-1 px-1.5 py-0.5">
            <FileCheck className="w-2.5 h-2.5 text-primary" /> Citations
          </Badge>
          <Badge variant="secondary" className="text-[8px] gap-1 px-1.5 py-0.5">
            <GitMerge className="w-2.5 h-2.5 text-primary" /> Markdown
          </Badge>
          <Badge variant="secondary" className="text-[8px] gap-1 px-1.5 py-0.5">
            <Activity className="w-2.5 h-2.5 text-primary" /> Metrics
          </Badge>
        </div>
      </div>
    </div>
  );
}

function CodingLoopVisual() {
  const [step, setStep] = useState(0);
  const [codeSnippet, setCodeSnippet] = useState("");
  const fullCode = "def test_agent_graph():\n  graph = get_graph()\n  assert graph.nodes > 0";

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
    <div className="space-y-2 font-mono text-[9px] w-full bg-card p-3 rounded-xl border border-border shadow-sm">
      {/* Code Editor Mockup */}
      <div className="border border-border bg-muted/60 p-2 rounded text-muted-foreground select-none">
        <div className="flex items-center gap-1 mb-1 border-b border-border/60 pb-1 text-[8px] text-foreground font-bold">
          <Terminal className="w-2.5 h-2.5 text-primary" />
          agent_test.py
        </div>
        <pre className="text-primary font-mono whitespace-pre leading-relaxed h-[42px]">{codeSnippet}</pre>
      </div>

      {/* Compiler Terminal logs */}
      <div className="space-y-1 border-t border-border pt-1.5 text-[8.5px]">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground flex items-center gap-1">
            <Play className="w-2.5 h-2.5 text-primary" />
            pytest test_agents.py
          </span>
          <span className={step === 3 ? "text-emerald-500 font-bold" : "text-primary font-bold"}>
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
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base mb-6">
            Streamline complex workflows with self-correcting agent systems, semantic memory retrieval, and autonomous code execution loops.
          </p>
          <Button asChild variant="outline" size="sm" className="gap-2 font-mono text-xs">
            <a href="#automation-graph">
              <span>Explore Interactive Agent Canvas</span>
              <span className="text-sm">→</span>
            </a>
          </Button>
        </motion.div>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {/* 1. Large Card: Agentic Workflow Orchestration */}
          <motion.div variants={itemVariants} className="md:col-span-2">
            <Card className="h-full border-border bg-card/60 hover:bg-card hover:border-primary/40 backdrop-blur-sm transition-all duration-300 p-6 flex flex-col justify-between">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="p-2 rounded-lg bg-accent text-accent-foreground w-fit mb-4">
                    <Bot className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    Agentic Workflow Orchestration
                  </h3>
                  <p className="text-muted-foreground text-xs max-w-md mb-4 leading-relaxed">
                    Autonomous orchestration of specialized AI agents built with LangGraph. Intelligently routes and schedules tasks across planning, semantic querying, logic synthesis, and reporter agents.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>State-Machine loops (LangGraph backend)</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Dynamic task routing with parallel execution</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Self-healing cyclic planning loops</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 w-full flex items-center justify-center md:justify-end">
                  <AgentWorkflowVisual />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* 2. Autonomous Context Retrieval */}
          <motion.div variants={itemVariants}>
            <Card className="h-full border-border bg-card/60 hover:bg-card hover:border-primary/40 backdrop-blur-sm transition-all duration-300 p-5 flex flex-col justify-between">
              <div className="mb-4">
                <div className="p-2 rounded-lg bg-accent text-accent-foreground w-fit mb-3">
                  <Search className="w-4 h-4 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-bold text-foreground mb-1.5">Autonomous Context Retrieval</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Automated semantic memory extraction using MMR over Pinecone vector stores, providing agents with contextually dense and noise-filtered local knowledge.
                </p>
              </div>
              <RetrievalVisual />
            </Card>
          </motion.div>

          {/* 3. Dynamic Model Routing */}
          <motion.div variants={itemVariants}>
            <Card className="h-full border-border bg-card/60 hover:bg-card hover:border-primary/40 backdrop-blur-sm transition-all duration-300 p-5 flex flex-col justify-between">
              <div className="mb-4">
                <div className="p-2 rounded-lg bg-accent text-accent-foreground w-fit mb-3">
                  <Cpu className="w-4 h-4 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-bold text-foreground mb-1.5">Dynamic Model Routing</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Automated routing of model calls across Gemini, Claude, OpenAI, and DeepSeek, dynamically matching individual agent tasks to the most efficient LLM runtime.
                </p>
              </div>
              <MultiLlmVisual />
            </Card>
          </motion.div>

          {/* 4. Automated Report Synthesis */}
          <motion.div variants={itemVariants}>
            <Card className="h-full border-border bg-card/60 hover:bg-card hover:border-primary/40 backdrop-blur-sm transition-all duration-300 p-5 flex flex-col justify-between">
              <div className="mb-4">
                <div className="p-2 rounded-lg bg-accent text-accent-foreground w-fit mb-3">
                  <FileText className="w-4 h-4 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-bold text-foreground mb-1.5">Automated Report Synthesis</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Hands-free compilation of verified research reports, complete with auto-generated tables, references, and inline citation mapping.
                </p>
              </div>
              <ReportVisual />
            </Card>
          </motion.div>

          {/* 5. Self-Correcting Coding Loop */}
          <motion.div variants={itemVariants}>
            <Card className="h-full border-border bg-card/60 hover:bg-card hover:border-primary/40 backdrop-blur-sm transition-all duration-300 p-5 flex flex-col justify-between">
              <div className="mb-4">
                <div className="p-2 rounded-lg bg-accent text-accent-foreground w-fit mb-3">
                  <Code className="w-4 h-4 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-bold text-foreground mb-1.5">Self-Correcting Coding Loop</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  An autonomous loop that generates, executes, audits, and debugs code scripts until all unit tests pass successfully without human intervention.
                </p>
              </div>
              <CodingLoopVisual />
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
