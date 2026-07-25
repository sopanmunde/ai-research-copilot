"use client";

import React, { useState, useEffect } from "react";
import {
  GitMerge,
  Plus,
  Play,
  Clock,
  Zap,
  X,
  RefreshCw,
  Trash2,
  Activity,
  Bot,
  Sparkles,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AutomationCanvas } from "./automation-canvas";

export default function WorkflowsModal({ isOpen, onClose }) {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedWf, setSelectedWf] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [runningId, setRunningId] = useState(null);

  // New Workflow Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTriggerType, setNewTriggerType] = useState("cron");
  const [newCronExpr, setNewCronExpr] = useState("0 8 * * 1");
  const [newEventTrigger, setNewEventTrigger] = useState("document_uploaded");
  const [newWorkflowType, setNewWorkflowType] = useState("research");
  const [newPrompt, setNewPrompt] = useState(
    "Summarize all new competitor research and extract key strategic insights."
  );
  const [newProvider, setNewProvider] = useState("google");

  const fetchWorkflows = async () => {
    if (!isOpen) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/workflows`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWorkflows(data || []);
        if (data.length > 0 && !selectedWf) {
          setSelectedWf(data[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch workflows:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (wfId) => {
    if (!wfId) return;
    setLoadingLogs(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/workflows/${wfId}/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch workflow logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, [isOpen]);

  useEffect(() => {
    if (selectedWf) {
      fetchLogs(selectedWf.id);
    }
  }, [selectedWf]);

  if (!isOpen) return null;

  const handleCreateWorkflow = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const payload = {
        title: newTitle.trim(),
        description: newDesc.trim(),
        trigger_type: newTriggerType,
        cron_expression: newCronExpr,
        event_type: newEventTrigger,
        workflow_type: newWorkflowType,
        query_prompt: newPrompt,
        model_provider: newProvider,
        is_active: true,
      };

      const res = await fetch(`${API_BASE_URL}/workflows`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const created = await res.json();
        setWorkflows([created, ...workflows]);
        setSelectedWf(created);
        setShowCreateModal(false);
        setNewTitle("");
        setNewDesc("");
      }
    } catch (err) {
      console.error("Failed to create workflow:", err);
    }
  };

  const handleToggleActive = async (wf) => {
    try {
      const token = localStorage.getItem("token");
      const updatedActive = !wf.is_active;
      const res = await fetch(`${API_BASE_URL}/workflows/${wf.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: updatedActive }),
      });

      if (res.ok) {
        const updated = await res.json();
        setWorkflows(workflows.map((w) => (w.id === wf.id ? updated : w)));
        if (selectedWf?.id === wf.id) setSelectedWf(updated);
      }
    } catch (err) {
      console.error("Failed to toggle workflow active status:", err);
    }
  };

  const handleRunNow = async (wfId) => {
    setRunningId(wfId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/workflows/${wfId}/run`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setTimeout(() => {
          fetchLogs(wfId);
          fetchWorkflows();
          setRunningId(null);
        }, 3000);
      }
    } catch (err) {
      console.error("Failed to run workflow:", err);
      setRunningId(null);
    }
  };

  const handleDeleteWorkflow = async (wfId) => {
    if (!confirm("Are you sure you want to delete this workflow automation?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/workflows/${wfId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const remaining = workflows.filter((w) => w.id !== wfId);
        setWorkflows(remaining);
        setSelectedWf(remaining[0] || null);
      }
    } catch (err) {
      console.error("Failed to delete workflow:", err);
    }
  };

  const CRON_PRESETS = [
    { label: "Every Monday at 8 AM", cron: "0 8 * * 1" },
    { label: "Daily at Midnight", cron: "0 0 * * *" },
    { label: "Every 6 Hours", cron: "0 */6 * * *" },
    { label: "Every Hour", cron: "0 * * * *" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="flex flex-col h-[88vh] w-full max-w-6xl rounded-2xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground border border-border">
              <GitMerge className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                Workflow Automation (Proactive AI)
                <Badge variant="secondary" className="text-[10px] uppercase font-mono tracking-wider bg-muted text-foreground border border-border">
                  APScheduler Engine
                </Badge>
              </h2>
              <p className="text-xs text-muted-foreground">
                Schedule autonomous agent pipelines with Cron or event triggers (e.g. file uploads & competitor scans).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="transparent"
              size="sm"
              onClick={() => setShowCreateModal(true)}
              className="gap-1.5 h-8 text-xs font-semibold"
            >
              <Plus className="h-4 w-4" />
              New Automation
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex flex-1 min-h-0">
          {/* Left Column: Workflows List */}
          <div className="w-5/12 flex flex-col border-r border-border bg-card">
            <div className="p-3 border-b border-border flex items-center justify-between bg-muted/30">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Configured Pipelines ({workflows.length})
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchWorkflows}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title="Refresh Workflows"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="divide-y divide-border/50">
                {workflows.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-10 text-center text-muted-foreground">
                    <GitMerge className="h-8 w-8 mb-2 opacity-50 text-foreground" />
                    <p className="text-xs font-bold text-foreground">No Automation Workflows Yet</p>
                    <p className="text-[11px] mt-1 text-muted-foreground">Create your first scheduled agent pipeline or event trigger.</p>
                    <Button
                      variant="transparent"
                      size="sm"
                      onClick={() => setShowCreateModal(true)}
                      className="mt-4 gap-1.5 h-8 text-xs font-semibold border-border hover:border-border"
                    >
                      <Plus className="h-3.5 w-3.5" /> Create Workflow
                    </Button>
                  </div>
                ) : (
                  workflows.map((wf) => {
                    const isSelected = selectedWf?.id === wf.id;
                    const isCron = wf.trigger_type === "cron";

                    return (
                      <div
                        key={wf.id}
                        onClick={() => setSelectedWf(wf)}
                        className={`p-4 cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-accent border-l-4 border-primary"
                            : "hover:bg-accent/50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <Badge variant="outline" className="text-[10px] font-mono uppercase tracking-wider flex items-center gap-1">
                            {isCron ? <Clock className="h-3 w-3 text-muted-foreground" /> : <Zap className="h-3 w-3 text-muted-foreground" />}
                            {isCron ? `CRON: ${wf.cron_expression}` : `EVENT: ${wf.event_type}`}
                          </Badge>

                          <div onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleActive(wf)}
                              className={`h-5 text-[10px] font-bold px-2 rounded-full transition-colors ${
                                wf.is_active
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400"
                                  : "bg-muted text-muted-foreground border-transparent"
                              }`}
                            >
                              {wf.is_active ? "ACTIVE" : "PAUSED"}
                            </Button>
                          </div>
                        </div>

                        <h4 className="text-xs font-bold text-foreground truncate">
                          {wf.title}
                        </h4>
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5 font-mono">
                          {wf.query_prompt}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-2.5 font-mono">
                          <span>Runs: {wf.run_count || 0}</span>
                          <span>{wf.last_run_at ? `Last: ${new Date(wf.last_run_at).toLocaleTimeString()}` : "Never run"}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right Column: Detail & Visual Canvas Inspector */}
          <ScrollArea className="w-7/12 flex-1 bg-muted/20 p-6">
            {selectedWf ? (
              <div className="space-y-6">
                {/* Header detail */}
                <div className="flex items-start justify-between border-b border-border pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold font-mono text-muted-foreground uppercase">
                        {selectedWf.trigger_type === "cron" ? `SCHEDULED: ${selectedWf.cron_expression}` : `EVENT TRIGGER: ${selectedWf.event_type}`}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-foreground">
                      {selectedWf.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedWf.description || "No description provided."}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRunNow(selectedWf.id)}
                      disabled={runningId === selectedWf.id}
                      className="gap-1.5 h-8 text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
                    >
                      <Play className={`h-3.5 w-3.5 ${runningId === selectedWf.id ? "animate-spin" : ""}`} />
                      {runningId === selectedWf.id ? "Running..." : "Test Run Now"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteWorkflow(selectedWf.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Delete Workflow"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Automation Query Prompt Card */}
                <Card className="border-border bg-card text-card-foreground shadow-xs">
                  <CardContent className="p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Bot className="h-4 w-4 text-foreground" />
                      Configured Agent Prompt Pipeline
                    </h4>
                    <p className="text-xs font-mono bg-muted p-3 rounded-lg border border-border text-foreground leading-relaxed">
                      "{selectedWf.query_prompt}"
                    </p>
                  </CardContent>
                </Card>

                {/* Embedded Automation Visual Topology */}
                <Card className="border-border bg-card text-card-foreground overflow-hidden shadow-xs">
                  <div className="p-3 border-b border-border flex items-center justify-between bg-muted/50">
                    <span className="text-xs font-bold text-foreground flex items-center gap-2">
                      <Activity className="h-4 w-4 text-emerald-400" />
                      Visual Execution Topology Canvas
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      Pipeline Mode: {selectedWf.workflow_type || "research"}
                    </span>
                  </div>
                  <AutomationCanvas />
                </Card>

                {/* Historical Execution Run Logs */}
                <Card className="border-border bg-card text-card-foreground shadow-xs">
                  <CardContent className="p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-blue-500" />
                      Execution Run Logs ({logs.length})
                    </h4>

                    {loadingLogs ? (
                      <p className="text-xs text-muted-foreground italic">Loading run logs...</p>
                    ) : logs.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No execution logs recorded yet for this workflow.</p>
                    ) : (
                      <div className="space-y-3">
                        {logs.map((log, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg bg-muted border border-border text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-foreground flex items-center gap-1.5">
                                <span className={`h-2 w-2 rounded-full ${log.status === 'success' ? 'bg-emerald-500' : 'bg-destructive'}`} />
                                Run via {log.trigger_source || 'scheduled'}
                              </span>
                              <span className="font-mono text-[10px] text-muted-foreground">
                                {log.executed_at ? new Date(log.executed_at).toLocaleString() : ""} ({log.duration_ms || 0}ms)
                              </span>
                            </div>
                            <p className="font-mono text-muted-foreground text-[11px]">
                              {log.output_summary || log.error || "Execution completed."}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center text-center text-muted-foreground py-12">
                <p className="text-xs font-semibold">Select a workflow on the left or create a new automation.</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Create Workflow Modal Wizard */}
      {showCreateModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card text-card-foreground p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-foreground" /> Create Proactive AI Automation
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCreateModal(false)}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleCreateWorkflow} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-foreground mb-1">Workflow Title</label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Weekly Competitor News Tracker"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full h-8 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">Trigger Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={newTriggerType === "cron" ? "default" : "outline"}
                    onClick={() => setNewTriggerType("cron")}
                    className="h-9 font-semibold flex items-center justify-center gap-2"
                  >
                    <Clock className="h-4 w-4 text-muted-foreground" /> Cron Schedule
                  </Button>
                  <Button
                    type="button"
                    variant={newTriggerType === "event" ? "default" : "outline"}
                    onClick={() => setNewTriggerType("event")}
                    className="h-9 font-semibold flex items-center justify-center gap-2"
                  >
                    <Zap className="h-4 w-4 text-amber-500" /> Event Trigger
                  </Button>
                </div>
              </div>

              {newTriggerType === "cron" ? (
                <div>
                  <label className="block font-bold text-foreground mb-1">Cron Expression</label>
                  <Input
                    type="text"
                    required
                    value={newCronExpr}
                    onChange={(e) => setNewCronExpr(e.target.value)}
                    className="w-full h-8 font-mono text-xs"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {CRON_PRESETS.map((p, i) => (
                      <Button
                        key={i}
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setNewCronExpr(p.cron)}
                        className="h-6 text-[10px] px-2 font-semibold"
                      >
                        {p.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-foreground mb-1">Event Name</label>
                  <select
                    value={newEventTrigger}
                    onChange={(e) => setNewEventTrigger(e.target.value)}
                    className="w-full rounded-md border border-input bg-background p-2 text-xs font-medium text-foreground"
                  >
                    <option value="document_uploaded">On Document Uploaded (Auto-classify & extract)</option>
                    <option value="query_completed">On Agent Query Completed</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-foreground mb-1">Agent Query Prompt</label>
                <Textarea
                  rows={3}
                  required
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  className="w-full font-mono text-xs min-h-[70px]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                  className="h-8 text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  className="h-8 font-semibold shadow-xs text-xs"
                >
                  Save & Activate Workflow
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
