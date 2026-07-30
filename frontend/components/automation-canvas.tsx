"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect, useMemo } from "react";
import {
  Webhook, Bot, Code, GitMerge, Server, Send,
  Play, Pause, RotateCcw, Activity, ShieldAlert,
  Database, Zap, Terminal, Sparkles, Copy, Check,
  ChevronRight, ChevronLeft, Layers, Bell, Keyboard, X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Kbd, KbdGroup } from "@/components/ui/kbd";

type NodeType = "trigger" | "action" | "logic" | "agent";
type NodeStatus = "idle" | "running" | "success" | "error";

interface WorkflowNode {
  id: string;
  label: string;
  icon: React.ElementType;
  x: number;
  y: number;
  type: NodeType;
  execTime: string;
  model?: string;
  description: string;
  payload: Record<string, any>;
  logs: string[];
}

interface WorkflowConnection {
  from: string;
  to: string;
  pathD: string;
}

interface WorkflowPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  badge: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
}

const WORKFLOW_PRESETS: WorkflowPreset[] = [
  {
    id: "code-audit",
    name: "Autonomous PR & Code Audit",
    category: "DevOps & Engineering",
    badge: "Most Popular",
    description: "Self-correcting agent loop inspecting PR diffs, running test sandboxes, and posting reviews.",
    nodes: [
      {
        id: "gh_webhook",
        label: "GitHub Webhook",
        icon: Webhook,
        x: 40,
        y: 128,
        type: "trigger",
        execTime: "4ms",
        description: "Listens for Pull Request opened / updated events from GitHub API.",
        payload: { event: "pull_request.opened", repo: "trivisionx/backend", pr_id: 142, author: "dev-team" },
        logs: [
          "[10:42:01.002] [TRIGGER] Webhook received from github.com/trivisionx/backend#142",
          "[10:42:01.004] [INFO] Payload verified via HMAC signature authentication.",
        ],
      },
      {
        id: "langgraph_planner",
        label: "LangGraph Planner",
        icon: Bot,
        x: 230,
        y: 48,
        type: "agent",
        execTime: "142ms",
        model: "Claude 3.5 Sonnet",
        description: "Decomposes code diff into static analysis and dynamic unit test execution sub-tasks.",
        payload: { task: "plan_pr_audit", modules_changed: ["services/auth.py", "models/user.py"], strategy: "parallel_eval" },
        logs: [
          "[10:42:01.010] [AGENT] LangGraph Orchestrator initialized context graph.",
          "[10:42:01.120] [AGENT] Identified high-risk changes in authentication service module.",
          "[10:42:01.150] [SUCCESS] Audit plan constructed: [AST Check, PyTest execution, Security Scan].",
        ],
      },
      {
        id: "py_sandbox",
        label: "Python AST Sandbox",
        icon: Code,
        x: 230,
        y: 208,
        type: "logic",
        execTime: "86ms",
        description: "Isolated gVisor sandbox running static AST linting, type checks, and vulnerability scans.",
        payload: { runtime: "python:3.11-slim", sandbox_id: "sbx-9941a", static_lint: "0 errors, 1 warning" },
        logs: [
          "[10:42:01.160] [EXEC] Provisioning isolated gVisor container sbx-9941a...",
          "[10:42:01.210] [EXEC] Executing mypy & ruff static analysis...",
          "[10:42:01.246] [SUCCESS] Zero high-severity vulnerabilities found in AST breakdown.",
        ],
      },
      {
        id: "qa_evaluator",
        label: "Decision Evaluator",
        icon: GitMerge,
        x: 420,
        y: 128,
        type: "logic",
        execTime: "48ms",
        description: "Evaluates aggregate test results against enterprise code quality thresholds.",
        payload: { threshold_pass: true, risk_score: 0.04, coverage_delta: "+1.8%" },
        logs: [
          "[10:42:01.250] [EVAL] Merging sub-task metrics from Planner and AST Sandbox...",
          "[10:42:01.288] [EVAL] Risk Score: 0.04 (Below maximum risk allowance 0.25).",
          "[10:42:01.298] [SUCCESS] Approved PR #142 for automatic merge staging.",
        ],
      },
      {
        id: "vector_sync",
        label: "Pinecone Sync",
        icon: Server,
        x: 610,
        y: 48,
        type: "action",
        execTime: "38ms",
        description: "Updates Pinecone vector index with updated codebase embeddings for instant RAG lookup.",
        payload: { vectors_upserted: 48, index: "codebase-v2", latency_ms: 38 },
        logs: [
          "[10:42:01.305] [ACTION] Generating text-embedding-3-large vectors for modified modules...",
          "[10:42:01.340] [SUCCESS] Upserted 48 dense vectors to Pinecone production namespace.",
        ],
      },
      {
        id: "slack_notify",
        label: "Slack & PR Notify",
        icon: Send,
        x: 610,
        y: 208,
        type: "action",
        execTime: "115ms",
        description: "Posts approval summary to Slack #engineering channel and attaches PR review approval.",
        payload: { channel: "#eng-deployments", pr_comment_id: 88402, status: "approved" },
        logs: [
          "[10:42:01.345] [ACTION] Constructing Slack block kit payload...",
          "[10:42:01.450] [SUCCESS] Notification delivered to #eng-deployments. PR approved on GitHub.",
        ],
      },
    ],
    connections: [
      { from: "gh_webhook", to: "langgraph_planner", pathD: "M 184 155 C 207 155, 207 75, 230 75" },
      { from: "gh_webhook", to: "py_sandbox", pathD: "M 184 155 C 207 155, 207 235, 230 235" },
      { from: "langgraph_planner", to: "qa_evaluator", pathD: "M 374 75 C 397 75, 397 155, 420 155" },
      { from: "py_sandbox", to: "qa_evaluator", pathD: "M 374 235 C 397 235, 397 155, 420 155" },
      { from: "qa_evaluator", to: "vector_sync", pathD: "M 564 155 C 587 155, 587 75, 610 75" },
      { from: "qa_evaluator", to: "slack_notify", pathD: "M 564 155 C 587 155, 587 235, 610 235" },
    ],
  },
  {
    id: "secops",
    name: "SecOps Incident Auto-Remediation",
    category: "Cybersecurity",
    badge: "Autonomous",
    description: "Detects anomalous traffic spikes or SIEM alerts and deploys zero-downtime firewall mitigation.",
    nodes: [
      {
        id: "siem_alert",
        label: "Datadog SIEM Alert",
        icon: ShieldAlert,
        x: 40,
        y: 128,
        type: "trigger",
        execTime: "3ms",
        description: "Triggered by automated detection of suspicious volumetric API rate violations.",
        payload: { source: "Datadog Security Monitoring", threat: "DDoS / Malicious Burst", ip_subnet: "194.26.29.0/24" },
        logs: [
          "[11:15:00.001] [TRIGGER] High severity security alert fired by Datadog SIEM Engine.",
          "[11:15:00.003] [INFO] Target scope: /api/v1/auth endpoints under 12,000 req/sec load.",
        ],
      },
      {
        id: "threat_agent",
        label: "Threat Analyzer",
        icon: Bot,
        x: 230,
        y: 48,
        type: "agent",
        execTime: "165ms",
        model: "GPT-4o",
        description: "Analyzes request signatures and correlates with CVE databases and threat intelligence feeds.",
        payload: { classification: "Automated Credential Stuffing Botnet", confidence: 0.992, threat_score: 9.8 },
        logs: [
          "[11:15:00.010] [AGENT] Ingested 50,000 raw packet headers for forensic evaluation.",
          "[11:15:00.160] [AGENT] Match confirmed: Known credential-stuffing botnet fingerprint.",
          "[11:15:00.170] [SUCCESS] Mitigation strategy: AWS CloudFront Rate-Limit + IP Blocklist.",
        ],
      },
      {
        id: "sim_sandbox",
        label: "Exploit Sandbox",
        icon: Code,
        x: 230,
        y: 208,
        type: "logic",
        execTime: "94ms",
        description: "Simulates policy enforcement in isolated staging container to prevent false positive downtime.",
        payload: { false_positive_rate: "0.0001%", verified_legitimate_impact: 0 },
        logs: [
          "[11:15:00.175] [EXEC] Running shadow traffic simulation with proposed WAF rule...",
          "[11:15:00.260] [SUCCESS] Zero legitimate users impacted during 1,000-packet trial run.",
        ],
      },
      {
        id: "policy_eval",
        label: "Policy Engine",
        icon: GitMerge,
        x: 420,
        y: 128,
        type: "logic",
        execTime: "28ms",
        description: "Verifies mitigation actions against SOC2 & ISO-27001 automated compliance rules.",
        payload: { compliant: true, authorization: "AUTO_REMEDIATE_TIER1", audit_token: "soc2-autofix-77" },
        logs: [
          "[11:15:00.270] [EVAL] Verifying automated remediation policy compliance...",
          "[11:15:00.295] [SUCCESS] Compliance checks passed. Proceeding with CloudFront WAF deployment.",
        ],
      },
      {
        id: "aws_patch",
        label: "AWS WAF Patch",
        icon: Zap,
        x: 610,
        y: 48,
        type: "action",
        execTime: "210ms",
        description: "Applies dynamic WAF rule to block subnet across global edge locations in under 1 second.",
        payload: { rule_id: "waf-block-194-26", edge_propagation: "Global 100%", active: true },
        logs: [
          "[11:15:00.300] [ACTION] Calling AWS CloudFront UpdateIPSet API...",
          "[11:15:00.505] [SUCCESS] WAF rule active globally. Threat traffic dropped at edge.",
        ],
      },
      {
        id: "pagerduty_notify",
        label: "PagerDuty Log",
        icon: Bell,
        x: 610,
        y: 208,
        type: "action",
        execTime: "64ms",
        description: "Creates resolved incident ticket with complete digital forensic audit trace.",
        payload: { incident_key: "INC-88910", severity: "SEV-1", remediation: "AUTO_MITIGATED" },
        logs: [
          "[11:15:00.510] [ACTION] Creating resolved PagerDuty incident record with forensic report...",
          "[11:15:00.570] [SUCCESS] Incident INC-88910 marked as RESOLVED in 570ms total latency.",
        ],
      },
    ],
    connections: [
      { from: "siem_alert", to: "threat_agent", pathD: "M 184 155 C 207 155, 207 75, 230 75" },
      { from: "siem_alert", to: "sim_sandbox", pathD: "M 184 155 C 207 155, 207 235, 230 235" },
      { from: "threat_agent", to: "policy_eval", pathD: "M 374 75 C 397 75, 397 155, 420 155" },
      { from: "sim_sandbox", to: "policy_eval", pathD: "M 374 235 C 397 235, 397 155, 420 155" },
      { from: "policy_eval", to: "aws_patch", pathD: "M 564 155 C 587 155, 587 75, 610 75" },
      { from: "policy_eval", to: "pagerduty_notify", pathD: "M 564 155 C 587 155, 587 235, 610 235" },
    ],
  },
  {
    id: "rag_pipeline",
    name: "Real-Time Enterprise RAG Pipeline",
    category: "Knowledge Graphs & AI",
    badge: "High Throughput",
    description: "Ingests raw enterprise documents, extracts knowledge graph triples, and syncs caches.",
    nodes: [
      {
        id: "kafka_stream",
        label: "Kafka Ingest",
        icon: Database,
        x: 40,
        y: 128,
        type: "trigger",
        execTime: "2ms",
        description: "Streams enterprise PDF, Notion, and Confluence update events into processing queue.",
        payload: { topic: "enterprise.documents.v1", partition: 4, batch_size: 150, bytes: "4.2 MB" },
        logs: [
          "[14:02:10.001] [TRIGGER] Consumed document ingestion event from Kafka partition 4.",
          "[14:02:10.003] [INFO] Extracting raw text & layout semantics from 150 document pages.",
        ],
      },
      {
        id: "chunk_embed",
        label: "Text Chunking",
        icon: Code,
        x: 230,
        y: 48,
        type: "logic",
        execTime: "45ms",
        description: "Applies sliding-window semantic chunking with overlapping header preservation.",
        payload: { chunk_size: 512, overlap: 64, total_chunks: 420, strategy: "markdown_aware" },
        logs: [
          "[14:02:10.008] [EXEC] Splitting text stream using markdown header hierarchy...",
          "[14:02:10.050] [SUCCESS] Generated 420 chunk objects with context metadata headers.",
        ],
      },
      {
        id: "graph_builder",
        label: "Knowledge Graph",
        icon: Bot,
        x: 230,
        y: 208,
        type: "agent",
        execTime: "180ms",
        model: "Llama-3-70B",
        description: "Extracts entity-relationship triples for hybrid graph retrieval.",
        payload: { entities_extracted: 84, relations_mapped: 112, graph_db: "Neo4j Enterprise" },
        logs: [
          "[14:02:10.055] [AGENT] Extracting named entity triples from text chunks...",
          "[14:02:10.220] [AGENT] Identified 84 entities and 112 relationship edges.",
          "[14:02:10.230] [SUCCESS] Cypher query batch committed to Neo4j database.",
        ],
      },
      {
        id: "hybrid_search",
        label: "Hybrid Ranker",
        icon: GitMerge,
        x: 420,
        y: 128,
        type: "logic",
        execTime: "34ms",
        description: "Combines dense vector similarity with sparse BM25 keyword matching.",
        payload: { alpha_weight: 0.7, reranker: "Cohere Rerank v3", mrr_score: 0.982 },
        logs: [
          "[14:02:10.235] [EVAL] Computing reciprocal rank fusion across vector & graph indices...",
          "[14:02:10.265] [SUCCESS] Reranking complete. top_k context relevance score: 0.982.",
        ],
      },
      {
        id: "cache_flush",
        label: "Redis Cache",
        icon: Server,
        x: 610,
        y: 48,
        type: "action",
        execTime: "12ms",
        description: "Invalidates stale query embeddings and pre-warms semantic cache.",
        payload: { memory_keys_updated: 124, cache_hit_rate: "94.2%" },
        logs: [
          "[14:02:10.270] [ACTION] Invalidating matching semantic cache entries in Redis cluster...",
          "[14:02:10.280] [SUCCESS] Redis keys updated in 10ms with zero drop in hit rate.",
        ],
      },
      {
        id: "dash_push",
        label: "Telemetry Push",
        icon: Send,
        x: 610,
        y: 208,
        type: "action",
        execTime: "78ms",
        description: "Streams ingestion status and token metrics directly to admin dashboards via WebSocket.",
        payload: { target: "admin_dashboard_ws", status: "SYNCHRONIZED", latency_total: "282ms" },
        logs: [
          "[14:02:10.285] [ACTION] Publishing ingestion metrics event to WebSocket broker...",
          "[14:02:10.360] [SUCCESS] RAG Pipeline sync completed. 150 documents ready for agent query.",
        ],
      },
    ],
    connections: [
      { from: "kafka_stream", to: "chunk_embed", pathD: "M 184 155 C 207 155, 207 75, 230 75" },
      { from: "kafka_stream", to: "graph_builder", pathD: "M 184 155 C 207 155, 207 235, 230 235" },
      { from: "chunk_embed", to: "hybrid_search", pathD: "M 374 75 C 397 75, 397 155, 420 155" },
      { from: "graph_builder", to: "hybrid_search", pathD: "M 374 235 C 397 235, 397 155, 420 155" },
      { from: "hybrid_search", to: "cache_flush", pathD: "M 564 155 C 587 155, 587 75, 610 75" },
      { from: "hybrid_search", to: "dash_push", pathD: "M 564 155 C 587 155, 587 235, 610 235" },
    ],
  },
];

/* Compact n8n-Style Node Component */
function CompactCanvasNode({
  node,
  status,
  isSelected,
  onClick,
}: {
  node: WorkflowNode;
  status: NodeStatus;
  isSelected: boolean;
  onClick: () => void;
}) {
  const statusDot = {
    idle: "bg-muted-foreground",
    running: "bg-primary animate-ping",
    success: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]",
    error: "bg-destructive animate-bounce",
  };

  const Icon = node.icon;

  return (
    <motion.div
      style={{ left: node.x, top: node.y }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`absolute w-36 h-[54px] px-2.5 py-2 rounded-lg border bg-card text-card-foreground shadow-sm font-mono select-none cursor-pointer transition-all duration-150 z-20 flex flex-col justify-between ${
        isSelected
          ? "ring-2 ring-ring border-primary bg-accent/40 shadow-md scale-[1.03]"
          : "border-border hover:border-accent-foreground/40 hover:bg-accent/20"
      }`}
    >
      {/* n8n-style Node edge connector pins */}
      <div className="absolute top-1/2 -left-1 w-2 h-2 rounded-full bg-muted border-2 border-background -translate-y-1/2" />
      <div className="absolute top-1/2 -right-1 w-2 h-2 rounded-full bg-muted border-2 border-background -translate-y-1/2" />

      {/* Top row: Icon + Title */}
      <div className="flex items-center gap-1.5 min-w-0">
        <div className="p-0.5 rounded bg-accent text-accent-foreground border border-border shrink-0">
          <Icon className="w-3 h-3" />
        </div>
        <span className="font-bold truncate text-foreground text-[10px] leading-none">
          {node.label}
        </span>
      </div>

      {/* Bottom row: Status + Execution Time */}
      <div className="flex items-center justify-between text-[8px] text-muted-foreground border-t border-border/60 pt-1">
        <span className="flex items-center gap-1 font-bold">
          <span className={`w-1.5 h-1.5 rounded-full ${statusDot[status]}`} />
          <span className="uppercase tracking-wider text-[7.5px]">{status}</span>
        </span>
        <span className="font-mono text-muted-foreground text-[7.5px] px-1 py-0 bg-muted/60 rounded border border-border/40">
          {node.execTime}
        </span>
      </div>
    </motion.div>
  );
}

export function AutomationCanvas() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const [activePresetId, setActivePresetId] = useState<string>("code-audit");
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("langgraph_planner");
  const [inspectorTab, setInspectorTab] = useState<"overview" | "payload" | "logs">("overview");
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);
  const [isShortcutsPanelOpen, setIsShortcutsPanelOpen] = useState<boolean>(false);

  // Active preset object
  const currentPreset = useMemo(
    () => WORKFLOW_PRESETS.find((p) => p.id === activePresetId) || WORKFLOW_PRESETS[0],
    [activePresetId]
  );

  // Reset selected node when preset changes
  useEffect(() => {
    setActiveStep(0);
    if (currentPreset.nodes.length > 1) {
      setSelectedNodeId(currentPreset.nodes[1].id);
    } else {
      setSelectedNodeId(currentPreset.nodes[0]?.id || null);
    }
  }, [activePresetId, currentPreset]);

  // Interval for execution simulation
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.round(2400 / speed);
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % currentPreset.nodes.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, speed, currentPreset.nodes.length]);

  // Keyboard shortcut event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when user is typing inside input or textarea
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          setIsPlaying((prev) => !prev);
          break;
        case "ArrowRight":
        case "n":
        case "N":
          e.preventDefault();
          setActiveStep((prev) => (prev + 1) % currentPreset.nodes.length);
          break;
        case "ArrowLeft":
        case "p":
        case "P":
          e.preventDefault();
          setActiveStep((prev) => (prev - 1 + currentPreset.nodes.length) % currentPreset.nodes.length);
          break;
        case "r":
        case "R":
          e.preventDefault();
          setActiveStep(0);
          break;
        case "s":
        case "S":
          e.preventDefault();
          setSpeed((prev) => (prev === 0.5 ? 1 : prev === 1 ? 2 : 0.5));
          break;
        case "1":
          setActivePresetId("code-audit");
          break;
        case "2":
          setActivePresetId("secops");
          break;
        case "3":
          setActivePresetId("rag_pipeline");
          break;
        case "?":
        case "k":
        case "K":
          e.preventDefault();
          setIsShortcutsPanelOpen((prev) => !prev);
          break;
        case "Escape":
          setIsShortcutsPanelOpen(false);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPreset.nodes.length]);

  const selectedNode = useMemo(
    () => currentPreset.nodes.find((n) => n.id === selectedNodeId) || currentPreset.nodes[0],
    [currentPreset, selectedNodeId]
  );

  // Helper to resolve node status based on current active step
  const getNodeStatus = (nodeIndex: number): NodeStatus => {
    if (activeStep === nodeIndex) return "running";
    if (activeStep > nodeIndex) return "success";
    return "idle";
  };

  const handleCopyPayload = () => {
    if (!selectedNode) return;
    navigator.clipboard.writeText(JSON.stringify(selectedNode.payload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <section id="automation-graph" className="py-20 px-4 bg-background text-foreground transition-colors relative border-t border-border select-none">
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-3 gap-1.5 px-3 py-1 text-xs font-mono uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 text-primary animate-pulse" />
            Autonomous Agent Canvas
          </Badge>
          
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-3">
            Enterprise-Grade Agentic Automation
          </h2>
          
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm leading-relaxed">
            Orchestrate multi-agent systems with self-correcting planning loops, vector memory retrieval, real-time code execution sandboxes, and enterprise telemetry.
          </p>

          {/* Preset Selector Tabs with Kbd Shortcuts */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            {WORKFLOW_PRESETS.map((preset, idx) => {
              const isActive = preset.id === activePresetId;
              return (
                <Button
                  key={preset.id}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActivePresetId(preset.id)}
                  className="gap-1.5 font-mono text-xs h-8"
                >
                  <Kbd>{idx + 1}</Kbd>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="font-bold">{preset.name}</span>
                  <Badge variant={isActive ? "secondary" : "outline"} className="text-[8px] px-1 py-0 uppercase">
                    {preset.badge}
                  </Badge>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Compact Canvas & Telemetry Suite Container */}
        <Card className="p-0 overflow-hidden border-border bg-card shadow-xl relative">
          {/* Key Commands Modal Panel Overlay */}
          <AnimatePresence>
            {isShortcutsPanelOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="absolute inset-0 bg-background/95 backdrop-blur-md z-50 p-6 flex flex-col justify-between font-mono"
              >
                <div className="space-y-4 max-w-2xl mx-auto w-full">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      <Keyboard className="w-4 h-4 text-primary" />
                      <span className="font-bold text-sm text-foreground">Canvas Keyboard Shortcuts</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setIsShortcutsPanelOpen(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Playback Controls */}
                    <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
                      <div className="font-bold text-primary text-[11px] uppercase tracking-wider mb-2">
                        Simulation Playback
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-[11px]">Play / Pause</span>
                        <Kbd>Space</Kbd>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-[11px]">Step Forward</span>
                        <KbdGroup>
                          <Kbd>→</Kbd>
                          <Kbd>N</Kbd>
                        </KbdGroup>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-[11px]">Step Backward</span>
                        <KbdGroup>
                          <Kbd>←</Kbd>
                          <Kbd>P</Kbd>
                        </KbdGroup>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-[11px]">Reset Simulation</span>
                        <Kbd>R</Kbd>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-[11px]">Change Speed</span>
                        <Kbd>S</Kbd>
                      </div>
                    </div>

                    {/* Presets & Navigation */}
                    <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
                      <div className="font-bold text-primary text-[11px] uppercase tracking-wider mb-2">
                        Presets & Commands
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-[11px]">Code Audit Preset</span>
                        <Kbd>1</Kbd>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-[11px]">SecOps Preset</span>
                        <Kbd>2</Kbd>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-[11px]">RAG Pipeline Preset</span>
                        <Kbd>3</Kbd>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-[11px]">Toggle Key Panel</span>
                        <KbdGroup>
                          <Kbd>?</Kbd>
                          <Kbd>K</Kbd>
                        </KbdGroup>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-[11px]">Close Panel</span>
                        <Kbd>Esc</Kbd>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center text-[10px] text-muted-foreground border-t border-border pt-3">
                  Press any key command on your keyboard while viewing the canvas to trigger actions instantly.
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Canvas Navigation & Control Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-2.5 bg-muted/40 border-b border-border select-none">
            {/* Left: Window Controls & Active Preset Title */}
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-accent-foreground/20" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
              </div>

              <div className="h-3.5 w-px bg-border" />

              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-mono font-bold text-foreground">
                  {currentPreset.name}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground hidden sm:inline">
                  ({currentPreset.category})
                </span>
              </div>
            </div>

            {/* Right: Compact Simulation Controls with Key Commands Toggle */}
            <div className="flex items-center gap-2 font-mono text-xs">
              {/* Keyboard Commands Toggle Panel Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsShortcutsPanelOpen(!isShortcutsPanelOpen)}
                className="h-7 text-[10px] gap-1.5 font-mono px-2"
                title="View Keyboard Shortcuts"
              >
                <Keyboard className="w-3 h-3 text-primary" />
                <span className="hidden sm:inline">Key Commands</span>
                <Kbd>?</Kbd>
              </Button>

              <div className="flex items-center gap-0.5 bg-background border border-border rounded-md p-0.5">
                {/* Play / Pause Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 relative"
                  onClick={() => setIsPlaying(!isPlaying)}
                  title="Play / Pause (Space)"
                >
                  {isPlaying ? <Pause className="w-3 h-3 text-primary" /> : <Play className="w-3 h-3 text-emerald-500" />}
                </Button>

                {/* Step Backward */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setActiveStep((prev) => (prev - 1 + currentPreset.nodes.length) % currentPreset.nodes.length)}
                  title="Step Prev (P / Left Arrow)"
                >
                  <ChevronLeft className="w-3 h-3" />
                </Button>

                {/* Step Forward */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setActiveStep((prev) => (prev + 1) % currentPreset.nodes.length)}
                  title="Step Next (N / Right Arrow)"
                >
                  <ChevronRight className="w-3 h-3" />
                </Button>

                {/* Reset Execution */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setActiveStep(0)}
                  title="Reset to Step 1 (R)"
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
              </div>

              {/* Speed Multiplier Button */}
              <div className="flex items-center bg-background border border-border rounded-md p-0.5 text-[9px]">
                {[0.5, 1, 2].map((s) => (
                  <Button
                    key={s}
                    variant={speed === s ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setSpeed(s)}
                    className="h-5 px-1.5 text-[9px] font-mono"
                  >
                    {s}x
                  </Button>
                ))}
              </div>

              {/* Live Status Badge */}
              <Badge variant="outline" className="hidden md:flex gap-1 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold text-[9px] h-6">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE CANVAS
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left Column: Compact Canvas Diagram Viewport */}
            <div className="lg:col-span-8 relative bg-background border-b lg:border-b-0 lg:border-r border-border min-w-0 overflow-hidden">
              {/* Desktop/Tablet Viewport: Compact Horizontal SVG Canvas */}
              <div className="hidden md:block w-full overflow-x-auto scrollbar-thin">
                <div className="relative w-[790px] h-[310px] p-3 select-none overflow-hidden shrink-0">
                  {/* Grid background */}
                  <div
                    className="absolute inset-0 opacity-[0.05]"
                    style={{
                      backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
                      backgroundSize: "20px 20px",
                    }}
                  />

                  {/* Bezier Wires SVG */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                    {/* Render Base Paths */}
                    {currentPreset.connections.map((conn, idx) => (
                      <path
                        key={`base-${idx}`}
                        d={conn.pathD}
                        className="stroke-border"
                        strokeWidth="1.5"
                        fill="none"
                      />
                    ))}

                    {/* Animated Flowing Particles on Active Step */}
                    {currentPreset.connections.map((conn, idx) => {
                      const fromNodeIdx = currentPreset.nodes.findIndex((n) => n.id === conn.from);
                      const isConnectedStepActive = activeStep === fromNodeIdx + 1;

                      if (!isConnectedStepActive) return null;

                      return (
                        <g key={`flow-${idx}`}>
                          <motion.path
                            d={conn.pathD}
                            className="stroke-primary"
                            strokeWidth="2.5"
                            fill="none"
                            strokeDasharray="8 6"
                            animate={{ strokeDashoffset: [-28, 0] }}
                            transition={{ repeat: Infinity, ease: "linear", duration: 0.8 }}
                          />
                        </g>
                      );
                    })}
                  </svg>

                  {/* Render Compact Node Cards */}
                  {currentPreset.nodes.map((node, index) => {
                    const status = getNodeStatus(index);
                    const isSelected = selectedNodeId === node.id;

                    return (
                      <CompactCanvasNode
                        key={node.id}
                        node={node}
                        status={status}
                        isSelected={isSelected}
                        onClick={() => setSelectedNodeId(node.id)}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Mobile Viewport: Compact Vertical Flow */}
              <div className="md:hidden w-full bg-background p-3 flex flex-col items-center gap-1.5 select-none">
                {currentPreset.nodes.map((node, i) => {
                  const isSelected = selectedNodeId === node.id;
                  const Icon = node.icon;

                  return (
                    <div key={node.id} className="w-full flex flex-col items-center">
                      {i > 0 && (
                        <div className="h-3 w-0.5 border-l-2 border-dashed border-border my-0.5" />
                      )}

                      <Card
                        onClick={() => setSelectedNodeId(node.id)}
                        className={`w-full max-w-[280px] p-2.5 font-mono cursor-pointer transition-all ${
                          isSelected
                            ? "border-primary ring-1 ring-ring bg-accent/40"
                            : "border-border hover:border-accent-foreground/30"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <div className="p-1 rounded bg-muted border border-border">
                              <Icon className="w-3 h-3 text-primary" />
                            </div>
                            <div className="font-bold text-[11px] text-foreground">{node.label}</div>
                          </div>
                          <Badge variant="outline" className="text-[8px] font-mono px-1 py-0">
                            {node.execTime}
                          </Badge>
                        </div>

                        <div className="text-[9.5px] text-muted-foreground line-clamp-1 leading-relaxed">
                          {node.description}
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Tabbed Inspector & Live Telemetry Console */}
            <div className="lg:col-span-4 p-4 flex flex-col justify-between font-mono bg-card text-card-foreground w-full min-w-0 overflow-hidden">
              <div className="space-y-3">
                {/* Inspector Header with Tab Switcher */}
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="font-bold text-foreground uppercase tracking-wider text-[9px] flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-primary" />
                    Inspector & Logs
                  </span>

                  {/* Inspector Tabs */}
                  <div className="flex gap-0.5 bg-muted p-0.5 rounded-md text-[9px]">
                    <Button
                      variant={inspectorTab === "overview" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setInspectorTab("overview")}
                      className="h-5 px-1.5 text-[9px]"
                    >
                      Overview
                    </Button>
                    <Button
                      variant={inspectorTab === "payload" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setInspectorTab("payload")}
                      className="h-5 px-1.5 text-[9px]"
                    >
                      JSON
                    </Button>
                    <Button
                      variant={inspectorTab === "logs" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setInspectorTab("logs")}
                      className="h-5 px-1.5 text-[9px]"
                    >
                      Logs
                    </Button>
                  </div>
                </div>

                {/* Tab 1: Overview Details */}
                {inspectorTab === "overview" && selectedNode && (
                  <motion.div
                    key="tab-overview"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2 text-[9.5px]"
                  >
                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground text-[10px]">{selectedNode.label}</span>
                        <Badge variant="secondary" className="text-[8px] uppercase px-1 py-0">
                          {selectedNode.type}
                        </Badge>
                      </div>
                      <p className="text-[9px] text-muted-foreground leading-normal font-sans">
                        {selectedNode.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="p-2 rounded bg-muted/30 border border-border">
                        <span className="text-muted-foreground block text-[8px]">Latency</span>
                        <span className="text-emerald-500 font-bold text-[9.5px]">{selectedNode.execTime}</span>
                      </div>
                      <div className="p-2 rounded bg-muted/30 border border-border">
                        <span className="text-muted-foreground block text-[8px]">Engine</span>
                        <span className="text-primary font-bold text-[9.5px] truncate block">{selectedNode.model || "Native Core"}</span>
                      </div>
                    </div>

                    <div className="p-2 rounded bg-muted/30 border border-border text-[9px] space-y-1">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Retry Policy:</span>
                        <span className="text-foreground font-bold">Exponential Backoff</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Security Scope:</span>
                        <span className="text-emerald-500 font-bold">Isolated Sandbox</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Tab 2: Formatted JSON Payload */}
                {inspectorTab === "payload" && selectedNode && (
                  <motion.div
                    key="tab-payload"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyPayload}
                      className="absolute top-1.5 right-1.5 h-5 text-[8.5px] px-1.5 gap-1 z-10"
                    >
                      {copiedPayload ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : <Copy className="w-2.5 h-2.5" />}
                      <span>{copiedPayload ? "Copied" : "Copy"}</span>
                    </Button>

                    <pre className="p-2.5 rounded-lg bg-muted border border-border text-[9px] font-mono text-foreground overflow-x-auto max-h-[145px] leading-relaxed scrollbar-thin">
                      {JSON.stringify(selectedNode.payload, null, 2)}
                    </pre>
                  </motion.div>
                )}

                {/* Tab 3: Execution Log Terminal */}
                {inspectorTab === "logs" && selectedNode && (
                  <motion.div
                    key="tab-logs"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-2.5 rounded-lg bg-background border border-border font-mono text-[8.5px] space-y-1 max-h-[145px] overflow-y-auto scrollbar-thin"
                  >
                    {selectedNode.logs.map((log, i) => (
                      <div key={i} className="text-foreground leading-normal border-b border-border/40 pb-0.5 last:border-none">
                        {log.includes("SUCCESS") ? (
                          <span className="text-emerald-500 font-bold">{log}</span>
                        ) : log.includes("AGENT") ? (
                          <span className="text-primary font-semibold">{log}</span>
                        ) : (
                          <span className="text-muted-foreground">{log}</span>
                        )}
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Bottom Live System Gauges */}
              <div className="mt-4 pt-3 border-t border-border space-y-1 text-[9px]">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Concurrency:</span>
                  <span className="text-emerald-500 font-bold">128 Parallel Nodes</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Avg Latency:</span>
                  <span className="text-primary font-bold">142ms</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Memory Hit Rate:</span>
                  <span className="text-foreground font-bold">99.4%</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
