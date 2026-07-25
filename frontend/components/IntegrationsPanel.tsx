"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Sliders,
  CheckSquare,
  Calendar,
  Mail,
  FolderHeart,
  FileText,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  Plug,
  Terminal,
  Cpu,
  Sparkles,
  Layers,
  Code
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/api";
import { toast } from "sonner";

interface IntegrationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IntegrationsPanel({ isOpen, onClose }: IntegrationsPanelProps) {
  const [activeTab, setActiveTab] = useState<"apps" | "extensions" | "hub">("apps");
  const [config, setConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);


  // States for adding new items
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillDesc, setNewSkillDesc] = useState("");
  const [newSkillPrompt, setNewSkillPrompt] = useState("");

  const [newMcpName, setNewMcpName] = useState("");
  const [newMcpUrl, setNewMcpUrl] = useState("");
  const [newMcpToken, setNewMcpToken] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    fetchIntegrations();
  }, [isOpen]);

  const fetchIntegrations = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/integrations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      } else {
        toast.error("Failed to load integration configurations");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error connecting to integrations API");
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async (updatedConfig = config) => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/integrations`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updatedConfig)
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        toast.success("Settings saved and synced successfully");
      } else {
        toast.error("Failed to save configurations");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error while saving settings");
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to toggle boolean configs
  const handleToggleApp = (appKey: string, field: string) => {
    const updated = {
      ...config,
      apps: {
        ...config.apps,
        [appKey]: {
          ...config.apps[appKey],
          [field]: !config.apps[appKey][field]
        }
      }
    };
    setConfig(updated);
    saveConfig(updated);
  };

  const handleUpdateAppText = (appKey: string, field: string, val: any) => {
    setConfig({
      ...config,
      apps: {
        ...config.apps,
        [appKey]: {
          ...config.apps[appKey],
          [field]: val
        }
      }
    });
  };

  // Skills handlers
  const handleToggleSkill = (skillId: string) => {
    const updated = {
      ...config,
      skills: config.skills.map((s: any) =>
        s.id === skillId ? { ...s, isActive: !s.isActive } : s
      )
    };
    setConfig(updated);
    saveConfig(updated);
  };

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    const newSkill = {
      id: `skill-${Math.random().toString(36).slice(2)}`,
      name: newSkillName.trim(),
      description: newSkillDesc.trim(),
      systemPrompt: newSkillPrompt.trim(),
      isActive: true
    };
    const updated = {
      ...config,
      skills: [...config.skills, newSkill]
    };
    setConfig(updated);
    saveConfig(updated);

    // Reset fields
    setNewSkillName("");
    setNewSkillDesc("");
    setNewSkillPrompt("");
  };

  const handleDeleteSkill = (skillId: string) => {
    const updated = {
      ...config,
      skills: config.skills.filter((s: any) => s.id !== skillId)
    };
    setConfig(updated);
    saveConfig(updated);
  };

  // MCP handlers
  const handleAddMcp = () => {
    if (!newMcpName.trim() || !newMcpUrl.trim()) return;
    const newMcp = {
      id: `mcp-${Math.random().toString(36).slice(2)}`,
      name: newMcpName.trim(),
      endpoint: newMcpUrl.trim(),
      status: "connected",
      token: newMcpToken.trim()
    };
    const updated = {
      ...config,
      mcp_plugins: [...config.mcp_plugins, newMcp]
    };
    setConfig(updated);
    saveConfig(updated);

    // Reset fields
    setNewMcpName("");
    setNewMcpUrl("");
    setNewMcpToken("");
  };

  const handleDeleteMcp = (mcpId: string) => {
    const updated = {
      ...config,
      mcp_plugins: config.mcp_plugins.filter((m: any) => m.id !== mcpId)
    };
    setConfig(updated);
    saveConfig(updated);
  };

  // LSP handlers
  const handleToggleLsp = () => {
    const updated = {
      ...config,
      lsp: {
        ...config.lsp,
        enabled: !config.lsp.enabled
      }
    };
    setConfig(updated);
    saveConfig(updated);
  };

  const handleToggleLspServer = (lang: string) => {
    const updated = {
      ...config,
      lsp: {
        ...config.lsp,
        servers: config.lsp.servers.map((s: any) =>
          s.language === lang ? { ...s, active: !s.active } : s
        )
      }
    };
    setConfig(updated);
    saveConfig(updated);
  };

  // ACP handlers
  const handleToggleAcp = () => {
    const updated = {
      ...config,
      acp: {
        ...config.acp,
        enabled: !config.acp.enabled
      }
    };
    setConfig(updated);
    saveConfig(updated);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-y-0 right-0 z-50 w-full sm:w-[450px] border-l border-border bg-card/95 text-card-foreground backdrop-blur-md shadow-2xl flex flex-col h-full overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/5 text-primary">
            <Sliders className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-foreground leading-tight">Integrations &amp; Agents</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Configure app contexts, skills &amp; protocols</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs bar */}
      <div className="flex bg-muted/40 p-1 border-b border-border">
        <button
          onClick={() => setActiveTab("apps")}
          className={cn(
            "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1",
            activeTab === "apps"
              ? "bg-card text-foreground shadow-2xs border border-border"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Layers className="h-3.5 w-3.5" />
          Apps
        </button>
        <button
          onClick={() => setActiveTab("extensions")}
          className={cn(
            "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1",
            activeTab === "extensions"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700/60"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Protocols
        </button>
        <button
          onClick={() => setActiveTab("hub")}
          className={cn(
            "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1",
            activeTab === "hub"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700/60"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
          )}
        >
          <Plug className="h-3.5 w-3.5 text-indigo-500" />
          Export &amp; Hub
        </button>
      </div>


      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <RefreshCw className="h-5 w-5 animate-spin text-zinc-400" />
            <span className="text-xs text-zinc-500 font-semibold">Loading integrations...</span>
          </div>
        ) : !config ? (
          <div className="text-center py-20 text-xs text-zinc-500">
            Error loading settings. Please try again.
          </div>
        ) : activeTab === "apps" ? (
          <div className="space-y-5">
            {/* APPS & CONTEXT TAB */}
            {/* TASKS */}
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4.5 w-4.5 text-indigo-500" />
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Tasks Sync</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.apps.tasks.enabled}
                  onChange={() => handleToggleApp("tasks", "enabled")}
                  className="accent-primary h-3.5 w-3.5 rounded"
                />
              </div>
              {config.apps.tasks.enabled && (
                <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500">Auto-inject context:</span>
                    <input
                      type="checkbox"
                      checked={config.apps.tasks.autoSync}
                      onChange={() => handleToggleApp("tasks", "autoSync")}
                      className="h-3 w-3 accent-primary"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3 text-[11px]">
                    <span className="text-zinc-500 shrink-0">Default List:</span>
                    <Input
                      size={1}
                      value={config.apps.tasks.defaultList}
                      onChange={(e) => handleUpdateAppText("tasks", "defaultList", e.target.value)}
                      onBlur={() => saveConfig()}
                      className="h-6 py-0 px-2 text-[10px] bg-zinc-50 dark:bg-zinc-800 max-w-[120px]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* CALENDAR */}
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4.5 w-4.5 text-emerald-500" />
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Calendar Agenda</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.apps.calendar.enabled}
                  onChange={() => handleToggleApp("calendar", "enabled")}
                  className="accent-primary h-3.5 w-3.5 rounded"
                />
              </div>
              {config.apps.calendar.enabled && (
                <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex items-center justify-between gap-3 text-[11px]">
                    <span className="text-zinc-500">Sync Interval (mins):</span>
                    <Input
                      type="number"
                      value={config.apps.calendar.syncInterval}
                      onChange={(e) => handleUpdateAppText("calendar", "syncInterval", parseInt(e.target.value) || 30)}
                      onBlur={() => saveConfig()}
                      className="h-6 py-0 px-2 text-[10px] bg-zinc-50 dark:bg-zinc-800 max-w-[80px]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* EMAIL */}
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4.5 w-4.5 text-sky-500" />
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Email Gateway</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.apps.email.enabled}
                  onChange={() => handleToggleApp("email", "enabled")}
                  className="accent-primary h-3.5 w-3.5 rounded"
                />
              </div>
              {config.apps.email.enabled && (
                <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500">Auto-draft replies:</span>
                    <input
                      type="checkbox"
                      checked={config.apps.email.autoDraft}
                      onChange={() => handleToggleApp("email", "autoDraft")}
                      className="h-3 w-3 accent-primary"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* GALLERY */}
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderHeart className="h-4.5 w-4.5 text-pink-500" />
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Gallery &amp; Docs</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.apps.gallery.enabled}
                  onChange={() => handleToggleApp("gallery", "enabled")}
                  className="accent-primary h-3.5 w-3.5 rounded"
                />
              </div>
              {config.apps.gallery.enabled && (
                <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex items-center justify-between gap-3 text-[11px]">
                    <span className="text-zinc-500">Max File Size (MB):</span>
                    <Input
                      type="number"
                      value={config.apps.gallery.maxFileSize}
                      onChange={(e) => handleUpdateAppText("gallery", "maxFileSize", parseInt(e.target.value) || 5)}
                      onBlur={() => saveConfig()}
                      className="h-6 py-0 px-2 text-[10px] bg-zinc-50 dark:bg-zinc-800 max-w-[80px]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* NOTES */}
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4.5 w-4.5 text-amber-500" />
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Notes &amp; Notion</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.apps.notes.enabled}
                  onChange={() => handleToggleApp("notes", "enabled")}
                  className="accent-primary h-3.5 w-3.5 rounded"
                />
              </div>
              {config.apps.notes.enabled && (
                <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Notion Workspace Sync:</span>
                    <input
                      type="checkbox"
                      checked={config.apps.notes.notionSync}
                      onChange={() => handleToggleApp("notes", "notionSync")}
                      className="h-3 w-3 accent-primary"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Google Keep Sync:</span>
                    <input
                      type="checkbox"
                      checked={config.apps.notes.keepSync}
                      onChange={() => handleToggleApp("notes", "keepSync")}
                      className="h-3 w-3 accent-primary"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === "extensions" ? (
          <div className="space-y-6">
            {/* AGENT EXTENSIONS TAB (Skills, MCP, LSP, ACP) */}
            {/* SKILLS */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-primary" /> Custom Skills
              </h4>
              <div className="space-y-2">
                {config.skills.map((s: any) => (
                  <div key={s.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/20 p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{s.name}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={s.isActive}
                          onChange={() => handleToggleSkill(s.id)}
                          className="h-3 w-3 accent-primary"
                        />
                        <button
                          onClick={() => handleDeleteSkill(s.id)}
                          className="text-zinc-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-500">{s.description}</p>
                    <code className="text-[9px] font-mono p-1.5 rounded bg-zinc-50 dark:bg-zinc-800/80 truncate text-zinc-600 dark:text-zinc-400 border border-zinc-150 dark:border-zinc-800">
                      {s.systemPrompt}
                    </code>
                  </div>
                ))}
              </div>

              {/* Add Skill Form */}
              <div className="rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 p-3.5 space-y-2.5 bg-zinc-50/20 dark:bg-zinc-900/10">
                <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">Add custom skill</p>
                <Input
                  placeholder="Skill Name (e.g. SQL Formatter)"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  className="h-7 text-xs bg-white dark:bg-zinc-900"
                />
                <Input
                  placeholder="Short Description"
                  value={newSkillDesc}
                  onChange={(e) => setNewSkillDesc(e.target.value)}
                  className="h-7 text-xs bg-white dark:bg-zinc-900"
                />
                <Textarea
                  placeholder="System Prompt Instructions..."
                  value={newSkillPrompt}
                  onChange={(e) => setNewSkillPrompt(e.target.value)}
                  className="text-xs min-h-[50px] bg-white dark:bg-zinc-900"
                />
                <Button
                  size="sm"
                  disabled={!newSkillName.trim()}
                  onClick={handleAddSkill}
                  className="h-7 w-full text-xs font-semibold"
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Custom Skill
                </Button>
              </div>
            </div>

            <Separator />

            {/* MCP PLUGINS */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                <Plug className="h-3.5 w-3.5 text-amber-500" /> MCP Plugins (Model Context Protocol)
              </h4>
              <div className="space-y-2">
                {config.mcp_plugins.map((m: any) => (
                  <div key={m.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/20 p-3 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{m.name}</span>
                      <button
                        onClick={() => handleDeleteMcp(m.id)}
                        className="text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[9px] font-mono">
                      <span className="text-zinc-400 truncate max-w-[280px]">{m.endpoint}</span>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-full font-bold",
                        m.status === "connected" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-zinc-500/10 text-zinc-500"
                      )}>
                        {m.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add MCP Plugin Form */}
              <div className="rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 p-3.5 space-y-2.5 bg-zinc-50/20 dark:bg-zinc-900/10">
                <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">Register MCP server</p>
                <Input
                  placeholder="Server Name (e.g. Postgres Server)"
                  value={newMcpName}
                  onChange={(e) => setNewMcpName(e.target.value)}
                  className="h-7 text-xs bg-white dark:bg-zinc-900"
                />
                <Input
                  placeholder="Endpoint URL (http://...)"
                  value={newMcpUrl}
                  onChange={(e) => setNewMcpUrl(e.target.value)}
                  className="h-7 text-xs bg-white dark:bg-zinc-900"
                />
                <Input
                  placeholder="Auth Token (optional)"
                  type="password"
                  value={newMcpToken}
                  onChange={(e) => setNewMcpToken(e.target.value)}
                  className="h-7 text-xs bg-white dark:bg-zinc-900"
                />
                <Button
                  size="sm"
                  disabled={!newMcpName.trim() || !newMcpUrl.trim()}
                  onClick={handleAddMcp}
                  className="h-7 w-full text-xs font-semibold"
                >
                  <Plus className="h-3 w-3 mr-1" /> Add MCP Server
                </Button>
              </div>
            </div>

            <Separator />

            {/* LSP CONFIGURATION */}
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code className="h-4.5 w-4.5 text-blue-500" />
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">LSP (Language Server Protocol)</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.lsp.enabled}
                  onChange={handleToggleLsp}
                  className="accent-primary h-3.5 w-3.5 rounded"
                />
              </div>
              {config.lsp.enabled && (
                <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                  <p className="text-[10px] text-zinc-500">Activate language servers for intelligent coding assists:</p>
                  <div className="space-y-1.5 mt-2">
                    {config.lsp.servers.map((s: any) => (
                      <div key={s.language} className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300 font-mono capitalize">{s.language}</span>
                        <input
                          type="checkbox"
                          checked={s.active}
                          onChange={() => handleToggleLspServer(s.language)}
                          className="h-3 w-3 accent-primary"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ACP CONFIGURATION */}
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4.5 w-4.5 text-zinc-600 dark:text-zinc-400" />
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">ACP (Agentic Copilot Protocols)</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.acp.enabled}
                  onChange={handleToggleAcp}
                  className="accent-primary h-3.5 w-3.5 rounded"
                />
              </div>
              {config.acp.enabled && (
                <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-zinc-500">Trigger Delay (ms):</span>
                    <Input
                      type="number"
                      value={config.acp.triggerDelay}
                      onChange={(e) => {
                        const updated = {
                          ...config,
                          acp: { ...config.acp, triggerDelay: parseInt(e.target.value) || 150 }
                        };
                        setConfig(updated);
                      }}
                      onBlur={() => saveConfig()}
                      className="h-6 py-0 px-2 text-[10px] bg-zinc-50 dark:bg-zinc-800 max-w-[85px]"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-zinc-500">Context Length:</span>
                    <Input
                      type="number"
                      value={config.acp.contextLength}
                      onChange={(e) => {
                        const updated = {
                          ...config,
                          acp: { ...config.acp, contextLength: parseInt(e.target.value) || 4096 }
                        };
                        setConfig(updated);
                      }}
                      onBlur={() => saveConfig()}
                      className="h-6 py-0 px-2 text-[10px] bg-zinc-50 dark:bg-zinc-800 max-w-[85px]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* EXPORT & INTEGRATION HUB TAB */}
            {/* SLACK */}
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-emerald-500">#</span>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Slack Webhook</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.slack?.enabled || false}
                  onChange={() => {
                    const updated = { ...config, slack: { ...config.slack, enabled: !config.slack?.enabled } };
                    setConfig(updated);
                    saveConfig(updated);
                  }}
                  className="accent-primary h-3.5 w-3.5 rounded"
                />
              </div>
              <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px]">
                <Input
                  placeholder="https://hooks.slack.com/services/..."
                  value={config.slack?.webhookUrl || ""}
                  onChange={(e) => setConfig({ ...config, slack: { ...config.slack, webhookUrl: e.target.value } })}
                  onBlur={() => saveConfig()}
                  className="h-7 text-[11px] bg-zinc-50 dark:bg-zinc-800"
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-zinc-500">Channel Name:</span>
                  <Input
                    placeholder="#research-reports"
                    value={config.slack?.channelName || ""}
                    onChange={(e) => setConfig({ ...config, slack: { ...config.slack, channelName: e.target.value } })}
                    onBlur={() => saveConfig()}
                    className="h-6 text-[10px] bg-zinc-50 dark:bg-zinc-800 max-w-[150px]"
                  />
                </div>
              </div>
            </div>

            {/* TEAMS */}
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-indigo-500">T</span>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Microsoft Teams</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.teams?.enabled || false}
                  onChange={() => {
                    const updated = { ...config, teams: { ...config.teams, enabled: !config.teams?.enabled } };
                    setConfig(updated);
                    saveConfig(updated);
                  }}
                  className="accent-primary h-3.5 w-3.5 rounded"
                />
              </div>
              <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px]">
                <Input
                  placeholder="https://outlook.office.com/webhook/..."
                  value={config.teams?.webhookUrl || ""}
                  onChange={(e) => setConfig({ ...config, teams: { ...config.teams, webhookUrl: e.target.value } })}
                  onBlur={() => saveConfig()}
                  className="h-7 text-[11px] bg-zinc-50 dark:bg-zinc-800"
                />
              </div>
            </div>

            {/* NOTION */}
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">N</span>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Notion Workspace</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.notion?.enabled || false}
                  onChange={() => {
                    const updated = { ...config, notion: { ...config.notion, enabled: !config.notion?.enabled } };
                    setConfig(updated);
                    saveConfig(updated);
                  }}
                  className="accent-primary h-3.5 w-3.5 rounded"
                />
              </div>
              <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px]">
                <Input
                  type="password"
                  placeholder="Notion Integration Secret (secret_...)"
                  value={config.notion?.apiKey || ""}
                  onChange={(e) => setConfig({ ...config, notion: { ...config.notion, apiKey: e.target.value } })}
                  onBlur={() => saveConfig()}
                  className="h-7 text-[11px] bg-zinc-50 dark:bg-zinc-800"
                />
                <Input
                  placeholder="Parent Page ID or Database ID"
                  value={config.notion?.parentPageId || ""}
                  onChange={(e) => setConfig({ ...config, notion: { ...config.notion, parentPageId: e.target.value } })}
                  onBlur={() => saveConfig()}
                  className="h-7 text-[11px] bg-zinc-50 dark:bg-zinc-800"
                />
              </div>
            </div>

            {/* CONFLUENCE */}
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-blue-500">C</span>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Confluence Wiki</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.confluence?.enabled || false}
                  onChange={() => {
                    const updated = { ...config, confluence: { ...config.confluence, enabled: !config.confluence?.enabled } };
                    setConfig(updated);
                    saveConfig(updated);
                  }}
                  className="accent-primary h-3.5 w-3.5 rounded"
                />
              </div>
              <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px]">
                <Input
                  placeholder="Domain (e.g. company.atlassian.net)"
                  value={config.confluence?.domain || ""}
                  onChange={(e) => setConfig({ ...config, confluence: { ...config.confluence, domain: e.target.value } })}
                  onBlur={() => saveConfig()}
                  className="h-7 text-[11px] bg-zinc-50 dark:bg-zinc-800"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="User Email"
                    value={config.confluence?.email || ""}
                    onChange={(e) => setConfig({ ...config, confluence: { ...config.confluence, email: e.target.value } })}
                    onBlur={() => saveConfig()}
                    className="h-7 text-[11px] bg-zinc-50 dark:bg-zinc-800"
                  />
                  <Input
                    placeholder="Space Key (e.g. RESEARCH)"
                    value={config.confluence?.spaceKey || ""}
                    onChange={(e) => setConfig({ ...config, confluence: { ...config.confluence, spaceKey: e.target.value } })}
                    onBlur={() => saveConfig()}
                    className="h-7 text-[11px] bg-zinc-50 dark:bg-zinc-800"
                  />
                </div>
                <Input
                  type="password"
                  placeholder="Atlassian API Token"
                  value={config.confluence?.apiToken || ""}
                  onChange={(e) => setConfig({ ...config, confluence: { ...config.confluence, apiToken: e.target.value } })}
                  onBlur={() => saveConfig()}
                  className="h-7 text-[11px] bg-zinc-50 dark:bg-zinc-800"
                />
              </div>
            </div>

            {/* JIRA */}
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-sky-500">J</span>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Jira Integration</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.jira?.enabled || false}
                  onChange={() => {
                    const updated = { ...config, jira: { ...config.jira, enabled: !config.jira?.enabled } };
                    setConfig(updated);
                    saveConfig(updated);
                  }}
                  className="accent-primary h-3.5 w-3.5 rounded"
                />
              </div>
              <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px]">
                <Input
                  placeholder="Domain (e.g. company.atlassian.net)"
                  value={config.jira?.domain || ""}
                  onChange={(e) => setConfig({ ...config, jira: { ...config.jira, domain: e.target.value } })}
                  onBlur={() => saveConfig()}
                  className="h-7 text-[11px] bg-zinc-50 dark:bg-zinc-800"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="User Email"
                    value={config.jira?.email || ""}
                    onChange={(e) => setConfig({ ...config, jira: { ...config.jira, email: e.target.value } })}
                    onBlur={() => saveConfig()}
                    className="h-7 text-[11px] bg-zinc-50 dark:bg-zinc-800"
                  />
                  <Input
                    placeholder="Project Key (e.g. AI)"
                    value={config.jira?.projectKey || ""}
                    onChange={(e) => setConfig({ ...config, jira: { ...config.jira, projectKey: e.target.value } })}
                    onBlur={() => saveConfig()}
                    className="h-7 text-[11px] bg-zinc-50 dark:bg-zinc-800"
                  />
                </div>
                <Input
                  type="password"
                  placeholder="Atlassian API Token"
                  value={config.jira?.apiToken || ""}
                  onChange={(e) => setConfig({ ...config, jira: { ...config.jira, apiToken: e.target.value } })}
                  onBlur={() => saveConfig()}
                  className="h-7 text-[11px] bg-zinc-50 dark:bg-zinc-800"
                />
              </div>
            </div>

            {/* EXPORT BRANDING */}
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-4 space-y-3">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">PDF &amp; DOCX Branding</span>
              <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px]">
                <Input
                  placeholder="Company Name (e.g. TriVisionX Enterprise)"
                  value={config.export?.companyName || ""}
                  onChange={(e) => setConfig({ ...config, export: { ...config.export, companyName: e.target.value } })}
                  onBlur={() => saveConfig()}
                  className="h-7 text-[11px] bg-zinc-50 dark:bg-zinc-800"
                />
                <Input
                  placeholder="Footer Disclaimer Text"
                  value={config.export?.footerText || ""}
                  onChange={(e) => setConfig({ ...config, export: { ...config.export, footerText: e.target.value } })}
                  onBlur={() => saveConfig()}
                  className="h-7 text-[11px] bg-zinc-50 dark:bg-zinc-800"
                />
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-between">
        <span className="text-[10px] text-zinc-400">Settings auto-save and sync to MongoDB.</span>
        <Button
          onClick={() => saveConfig()}
          disabled={isSaving}
          size="sm"
          className="h-8 text-xs font-semibold flex items-center gap-1.5"
        >
          {isSaving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Force Sync
        </Button>
      </div>
    </div>
  );
}
