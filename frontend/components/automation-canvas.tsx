"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import {
  Webhook, Bot, Code, GitMerge, FileText, Send,
  CheckCircle2, Play, Cpu, Server, Activity, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface CanvasNodeProps {
  label: string;
  icon: React.ElementType;
  x: number;
  y: number;
  type: "trigger" | "action" | "logic" | "agent";
  status: "idle" | "running" | "success" | "error";
  execTime?: string;
  onClick: () => void;
}

function CanvasNode({ label, icon: Icon, x, y, type, status, execTime, onClick }: CanvasNodeProps) {
  const typeColors = {
    trigger: "border-purple-500/30 bg-purple-950/20 text-purple-400",
    action: "border-emerald-500/30 bg-emerald-950/20 text-emerald-400",
    logic: "border-amber-500/30 bg-amber-950/20 text-amber-400",
    agent: "border-blue-500/30 bg-blue-950/20 text-blue-400",
  };

  const statusDot = {
    idle: "bg-zinc-600",
    running: "bg-purple-400 animate-pulse",
    success: "bg-emerald-400",
    error: "bg-rose-500 animate-bounce",
  };

  return (
    <motion.div
      style={{ left: x, top: y }}
      whileHover={{ scale: 1.02, borderColor: "rgba(168,85,247,0.4)" }}
      onClick={onClick}
      className={`absolute w-44 h-[84px] p-3.5 rounded-xl border bg-zinc-950/90 backdrop-blur-sm shadow-xl font-mono select-none cursor-pointer transition-colors z-20 ${typeColors[type]}`}
    >
      {/* Node connectors */}
      <div className="absolute top-1/2 -left-1 w-2 h-2 rounded-full bg-zinc-700 border border-zinc-900 -translate-y-1/2" />
      <div className="absolute top-1/2 -right-1 w-2 h-2 rounded-full bg-zinc-700 border border-zinc-900 -translate-y-1/2" />

      <div className="flex items-center gap-2.5 mb-2">
        <div className="p-1 rounded bg-zinc-900 border border-zinc-800">
          <Icon className="w-4 h-4" />
        </div>
        <span className="font-bold truncate text-zinc-100 text-[11px]">{label}</span>
      </div>

      <div className="flex items-center justify-between text-[8.5px] text-zinc-400 border-t border-zinc-900/80 pt-1.5 mt-1.5">
        <span className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${statusDot[status]}`} />
          {status.toUpperCase()}
        </span>
        {execTime && <span className="font-mono text-zinc-350">{execTime}</span>}
      </div>
    </motion.div>
  );
}

export function AutomationCanvas() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeStep, setActiveStep] = useState(0);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 6);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const nodes = [
    { id: "webhook", label: "Webhook Trigger", icon: Webhook, x: 60, y: 183, type: "trigger" as const, status: activeStep === 0 ? ("running" as const) : ("success" as const), execTime: "2ms" },
    { id: "agent", label: "LangGraph Planner", icon: Bot, x: 290, y: 78, type: "agent" as const, status: activeStep === 1 ? ("running" as const) : activeStep > 1 ? ("success" as const) : ("idle" as const), execTime: "124ms" },
    { id: "py_exec", label: "Python Sandbox", icon: Code, x: 290, y: 288, type: "logic" as const, status: activeStep === 2 ? ("running" as const) : activeStep > 2 ? ("success" as const) : ("idle" as const), execTime: "84ms" },
    { id: "router", label: "Decision Branch", icon: GitMerge, x: 520, y: 183, type: "logic" as const, status: activeStep === 3 ? ("running" as const) : activeStep > 3 ? ("success" as const) : ("idle" as const), execTime: "15ms" },
    { id: "db_sync", label: "Pinecone Sync", icon: Server, x: 750, y: 78, type: "action" as const, status: activeStep === 4 ? ("running" as const) : activeStep > 4 ? ("success" as const) : ("idle" as const), execTime: "45ms" },
    { id: "slack", label: "Slack Notify", icon: Send, x: 750, y: 288, type: "action" as const, status: activeStep === 5 ? ("running" as const) : activeStep > 5 ? ("success" as const) : ("idle" as const), execTime: "110ms" },
  ];

  return (
    <section id="automation-graph" className="py-24 px-4 bg-zinc-950/40 relative border-t border-zinc-900/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-400 mb-4 tracking-wider uppercase font-mono"
          >
            <Activity className="w-3.5 h-3.5" />
            Visual Integrations
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4"
          >
            Enterprise-Grade Agentic Automation
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-zinc-400 max-w-2xl mx-auto text-sm sm:text-base"
          >
            Connect autonomous multi-agent systems to your enterprise stack. Orchestrate, scale, and monitor self-correcting LLM planning loops with real-time vector databases, secure code sandboxes, and production API integrations.
          </motion.p>
        </div>

        {/* Unified Canvas Wrapper */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="rounded-3xl border border-zinc-800/80 bg-zinc-900/10 backdrop-blur-xl overflow-hidden shadow-2xl"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-950 border-b border-zinc-900 select-none">
            <div className="flex items-center gap-6">
              {/* Window controls */}
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
              </div>
              <span className="text-[10px] font-mono text-zinc-500 tracking-wider">
                automation_agent_routing_graph.json
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                EXECUTING LIVE
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left side: Canvas Editor Viewport */}
            <div className="lg:col-span-8 relative bg-zinc-950 border-b lg:border-b-0 lg:border-r border-zinc-900 w-full min-w-0 overflow-hidden">
              {/* Desktop/Tablet Viewport: Horizontal SVG Canvas (visible on md and up) */}
              <div className="hidden md:block w-full overflow-x-auto scrollbar-thin">
                <div className="relative w-[960px] h-[450px] p-4 select-none overflow-hidden shrink-0">
                  {/* Dot Grid Background */}
                  <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                      backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
                      backgroundSize: "20px 20px",
                    }}
                  />

                  {/* Connecting Bezier Wires */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-70">
                    {/* Bezier connector paths */}
                    <path d="M 228 225 C 259 225, 259 120, 290 120" stroke="#27272a" strokeWidth="1.5" fill="none" />
                    <path d="M 228 225 C 259 225, 259 330, 290 330" stroke="#27272a" strokeWidth="1.5" fill="none" />
                    <path d="M 458 120 C 489 120, 489 225, 520 225" stroke="#27272a" strokeWidth="1.5" fill="none" />
                    <path d="M 458 330 C 489 330, 489 225, 520 225" stroke="#27272a" strokeWidth="1.5" fill="none" />
                    <path d="M 688 225 C 719 225, 719 120, 750 120" stroke="#27272a" strokeWidth="1.5" fill="none" />
                    <path d="M 688 225 C 719 225, 719 330, 750 330" stroke="#27272a" strokeWidth="1.5" fill="none" />

                    {/* Glowing path animations matching execution steps */}
                    {activeStep === 1 && (
                      <motion.path
                        d="M 228 225 C 259 225, 259 120, 290 120"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray="8 6"
                        animate={{ strokeDashoffset: [-28, 0] }}
                        transition={{ repeat: Infinity, ease: "linear", duration: 1.2 }}
                      />
                    )}
                    {activeStep === 2 && (
                      <motion.path
                        d="M 228 225 C 259 225, 259 330, 290 330"
                        stroke="#f59e0b"
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray="8 6"
                        animate={{ strokeDashoffset: [-28, 0] }}
                        transition={{ repeat: Infinity, ease: "linear", duration: 1.2 }}
                      />
                    )}
                    {activeStep === 3 && (
                      <>
                        <motion.path
                          d="M 458 120 C 489 120, 489 225, 520 225"
                          stroke="#8b5cf6"
                          strokeWidth="2"
                          fill="none"
                          strokeDasharray="8 6"
                          animate={{ strokeDashoffset: [-28, 0] }}
                          transition={{ repeat: Infinity, ease: "linear", duration: 1.2 }}
                        />
                        <motion.path
                          d="M 458 330 C 489 330, 489 225, 520 225"
                          stroke="#8b5cf6"
                          strokeWidth="2"
                          fill="none"
                          strokeDasharray="8 6"
                          animate={{ strokeDashoffset: [-28, 0] }}
                          transition={{ repeat: Infinity, ease: "linear", duration: 1.2 }}
                        />
                      </>
                    )}
                    {activeStep === 4 && (
                      <motion.path
                        d="M 688 225 C 719 225, 719 120, 750 120"
                        stroke="#10b981"
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray="8 6"
                        animate={{ strokeDashoffset: [-28, 0] }}
                        transition={{ repeat: Infinity, ease: "linear", duration: 1.2 }}
                      />
                    )}
                    {activeStep === 5 && (
                      <motion.path
                        d="M 688 225 C 719 225, 719 330, 750 330"
                        stroke="#10b981"
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray="8 6"
                        animate={{ strokeDashoffset: [-28, 0] }}
                        transition={{ repeat: Infinity, ease: "linear", duration: 1.2 }}
                      />
                    )}
                  </svg>

                  {/* Render canvas node cards */}
                  {nodes.map((node) => (
                    <CanvasNode
                      key={node.id}
                      label={node.label}
                      icon={node.icon}
                      x={node.x}
                      y={node.y}
                      type={node.type}
                      status={node.status}
                      execTime={node.execTime}
                      onClick={() => setSelectedNode(node.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Mobile Viewport: Responsive Vertical Stack (visible on mobile only, no horizontal scroll) */}
              <div className="md:hidden w-full bg-zinc-950 p-5 flex flex-col items-center gap-1.5 select-none">
                {nodes.map((node, i) => {
                  const typeColors = {
                    trigger: "border-purple-500/30 bg-purple-950/20 text-purple-400",
                    action: "border-emerald-500/30 bg-emerald-950/20 text-emerald-400",
                    logic: "border-amber-500/30 bg-amber-950/20 text-amber-400",
                    agent: "border-blue-500/30 bg-blue-950/20 text-blue-400",
                  };

                  const statusDot = {
                    idle: "bg-zinc-600",
                    running: "bg-purple-400 animate-pulse",
                    success: "bg-emerald-400",
                    error: "bg-rose-500 animate-bounce",
                  };

                  const Icon = node.icon;
                  const isActive = node.status === "running";

                  return (
                    <div key={node.id} className="w-full flex flex-col items-center">
                      {i > 0 && (
                        <div className="h-4 w-0.5 border-l border-dashed border-zinc-800 my-1" />
                      )}
                      
                      <motion.div
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedNode(node.id)}
                        className={`w-full max-w-[280px] p-3.5 rounded-xl border bg-zinc-950/90 shadow-xl font-mono cursor-pointer transition-all duration-300 ${
                          isActive ? "ring-1 ring-purple-500/40 border-purple-500/30 scale-[1.02]" : ""
                        } ${typeColors[node.type]}`}
                      >
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="p-1 rounded bg-zinc-900 border border-zinc-800">
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="font-bold truncate text-zinc-100 text-[11px]">{node.label}</span>
                        </div>

                        <div className="flex items-center justify-between text-[8.5px] text-zinc-400 border-t border-zinc-900/80 pt-1.5 mt-1.5">
                          <span className="flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${statusDot[node.status]}`} />
                            <span className="uppercase">{node.status}</span>
                          </span>
                          {node.execTime && <span className="font-mono text-zinc-350">{node.execTime}</span>}
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right side: Execution Debug Console */}
            <div className="lg:col-span-4 p-5 flex flex-col justify-between font-mono text-[10px] bg-zinc-950 text-zinc-400 border-t lg:border-t-0 border-zinc-900 w-full min-w-0 overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                  <span className="font-bold text-zinc-300 uppercase tracking-wider text-[9px] flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-purple-400" />
                    Execution Debugger
                  </span>
                  <span className="text-zinc-650">v0.4.1</span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between text-zinc-500">
                    <span>Active Workflow Runs:</span>
                    <span className="text-zinc-300 font-bold">14,295</span>
                  </div>
                  <div className="flex justify-between text-zinc-500">
                    <span>Avg Execution Time:</span>
                    <span className="text-purple-400 font-bold">184ms</span>
                  </div>
                  <div className="flex justify-between text-zinc-500">
                    <span>Step Concurrency:</span>
                    <span className="text-zinc-300">Enabled (Parallel)</span>
                  </div>
                </div>

                {/* Selected Node Inspector Mockup */}
                <div className="bg-zinc-900/50 border border-zinc-850 p-3.5 rounded-xl space-y-2.5 mt-4">
                  <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                    Node Metadata Inspector
                  </div>
                  {selectedNode ? (
                    <div className="space-y-1.5 text-[9.5px]">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Node ID:</span>
                        <span className="text-purple-400 font-bold">{selectedNode}</span>
                      </div>
                      <div className="text-zinc-500 leading-relaxed">
                        Logs: <span className="text-emerald-400 font-bold">Payload verified. State synced to DB.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-zinc-500 italic leading-relaxed">
                      Click any node inside the canvas diagram viewport to inspect execution variables.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-zinc-900 flex justify-between items-center text-[9px] text-zinc-500">
                <span>CPU: 8.4%</span>
                <span>MEM: 1.8GB / 8GB</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
