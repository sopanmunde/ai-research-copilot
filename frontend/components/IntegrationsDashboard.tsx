"use client";

import React, { useState, useEffect } from "react";
import {
  Plug,
  Bot,
  Key,
  Database,
  Search,
  Server,
  Layers,
  Sparkles,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Code2,
  Terminal,
  Cpu,
  Globe,
  Sliders,
  CheckSquare,
  Calendar,
  Mail,
  FileText,
  ExternalLink,
  ShieldCheck,
  Zap,
  Lock,
  ChevronRight
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/api";
import { toast } from "sonner";

interface IntegrationsDashboardProps {
  onNavigateToChat?: () => void;
}

export function IntegrationsDashboard({ onNavigateToChat }: IntegrationsDashboardProps) {
  const [activeTab, setActiveTab] = useState<"agents" | "providers" | "vectordb" | "search" | "mcp" | "apps">("agents");
  const [config, setConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Skill Form
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillDesc, setNewSkillDesc] = useState("");
  const [newSkillPrompt, setNewSkillPrompt] = useState("");

  // MCP Form
  const [newMcpName, setNewMcpName] = useState("");
  const [newMcpUrl, setNewMcpUrl] = useState("");
  const [newMcpToken, setNewMcpToken] = useState("");

  useEffect(() => {
    fetchIntegrations();
  }, []);

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
        toast.success("All integration & agent settings saved successfully");
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

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    const newSkill = {
      id: `custom-${Date.now()}`,
      name: newSkillName.trim(),
      description: newSkillDesc.trim(),
      prompt_injection: newSkillPrompt.trim(),
      enabled: true
    };
    const nextSkills = [...(config?.custom_skills || []), newSkill];
    const updated = { ...config, custom_skills: nextSkills };
    setConfig(updated);
    saveConfig(updated);
    setNewSkillName("");
    setNewSkillDesc("");
    setNewSkillPrompt("");
  };

  const handleDeleteSkill = (id: string) => {
    const nextSkills = (config?.custom_skills || []).filter((s: any) => s.id !== id);
    const updated = { ...config, custom_skills: nextSkills };
    setConfig(updated);
    saveConfig(updated);
  };

  const handleAddMcpServer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMcpName.trim() || !newMcpUrl.trim()) return;
    const newMcp = {
      id: `mcp-${Date.now()}`,
      name: newMcpName.trim(),
      url: newMcpUrl.trim(),
      bearer_token: newMcpToken.trim(),
      status: "connected"
    };
    const nextMcp = [...(config?.mcp_servers || []), newMcp];
    const updated = { ...config, mcp_servers: nextMcp };
    setConfig(updated);
    saveConfig(updated);
    setNewMcpName("");
    setNewMcpUrl("");
    setNewMcpToken("");
  };

  const handleDeleteMcp = (id: string) => {
    const nextMcp = (config?.mcp_servers || []).filter((m: any) => m.id !== id);
    const updated = { ...config, mcp_servers: nextMcp };
    setConfig(updated);
    saveConfig(updated);
  };

  if (isLoading || !config) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] bg-background text-foreground space-y-4">
        <RefreshCw className="size-7 animate-spin text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground font-mono">Loading Agents & Integrations Hub...</p>
      </div>
    );
  }

  const connectedProvidersCount = Object.values(config?.llm_keys || {}).filter((k: any) => Boolean(k?.api_key)).length;
  const activeSkillsCount = (config?.custom_skills || []).filter((s: any) => s.enabled).length + 4;
  const mcpCount = (config?.mcp_servers || []).length;

  return (
    <div className="flex-1 overflow-y-auto bg-background text-foreground min-h-screen pb-16">
      {/* Radial ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.03),transparent_60%)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 py-8 lg:px-8 space-y-8">
        {/* Top Header & Metrics Banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-border">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-card text-xs font-semibold text-muted-foreground shadow-2xs">
                <Plug className="size-3.5 text-foreground" /> Ecosystem Hub
              </span>
              <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                ● Live Synced
              </Badge>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
              Agents & Integrations
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Orchestrate multi-agent swarms, configure LLM provider keys, vector memory indexes, Model Context Protocol (MCP) servers, and workspace apps.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchIntegrations()}
              disabled={isLoading}
              className="gap-2 h-9 text-xs font-semibold"
            >
              <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
              Refresh Status
            </Button>
            <Button
              size="sm"
              onClick={() => saveConfig()}
              disabled={isSaving}
              className="gap-2 h-9 text-xs font-semibold shadow-sm"
            >
              <Save className="size-3.5" />
              {isSaving ? "Syncing..." : "Save All Changes"}
            </Button>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border bg-card shadow-2xs">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Connected Providers</p>
                <h3 className="text-2xl font-extrabold mt-1 text-foreground">{connectedProvidersCount} Active</h3>
              </div>
              <div className="size-10 rounded-xl bg-muted border border-border flex items-center justify-center text-foreground">
                <Key className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-2xs">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Agent Swarm Skills</p>
                <h3 className="text-2xl font-extrabold mt-1 text-foreground">{activeSkillsCount} Enabled</h3>
              </div>
              <div className="size-10 rounded-xl bg-muted border border-border flex items-center justify-center text-foreground">
                <Bot className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-2xs">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Vector Store RAG</p>
                <h3 className="text-2xl font-extrabold mt-1 text-foreground">
                  {config?.vector_db?.pinecone_api_key ? "Pinecone Active" : "Local FAISS"}
                </h3>
              </div>
              <div className="size-10 rounded-xl bg-muted border border-border flex items-center justify-center text-foreground">
                <Database className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-2xs">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">MCP Protocol Servers</p>
                <h3 className="text-2xl font-extrabold mt-1 text-foreground">{mcpCount} Registered</h3>
              </div>
              <div className="size-10 rounded-xl bg-muted border border-border flex items-center justify-center text-foreground">
                <Server className="size-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Navigation Hub */}
        <Tabs defaultValue="agents" value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-6">
          <TabsList className="w-full justify-start overflow-x-auto scrollbar-none bg-muted/60 p-1 rounded-xl border border-border gap-1 h-auto">
            <TabsTrigger value="agents" className="gap-2 px-4 py-2 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg transition-all cursor-pointer">
              <Bot className="size-4" /> Agent Swarm & Skills
            </TabsTrigger>
            <TabsTrigger value="providers" className="gap-2 px-4 py-2 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg transition-all cursor-pointer">
              <Key className="size-4" /> LLM Model Keys
            </TabsTrigger>
            <TabsTrigger value="vectordb" className="gap-2 px-4 py-2 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg transition-all cursor-pointer">
              <Database className="size-4" /> Vector DB & RAG
            </TabsTrigger>
            <TabsTrigger value="search" className="gap-2 px-4 py-2 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg transition-all cursor-pointer">
              <Search className="size-4" /> Search & Web Tools
            </TabsTrigger>
            <TabsTrigger value="mcp" className="gap-2 px-4 py-2 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg transition-all cursor-pointer">
              <Server className="size-4" /> MCP Protocol Servers
            </TabsTrigger>
            <TabsTrigger value="apps" className="gap-2 px-4 py-2 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg transition-all cursor-pointer">
              <Layers className="size-4" /> Workspace Apps
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: AGENTS & SKILLS */}
          <TabsContent value="agents" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Built-in Agent Roles */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Sparkles className="size-4" /> Multi-Agent Persona Orchestra
                  </h3>
                  <Badge variant="outline" className="text-[10px] font-mono">5 Core Personas</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: "planner", name: "Research Planner Agent", desc: "Decomposes complex requests into research pathways.", model: "Auto Selected", icon: Sliders },
                    { id: "retriever", name: "Document RAG Analyst", desc: "Queries Pinecone/FAISS vectors for citation facts.", model: "LangChain Retriever", icon: Database },
                    { id: "web_search", name: "Web Query Analyst", desc: "Scrapes & queries Tavily and live search APIs.", model: "Tavily Search", icon: Globe },
                    { id: "code_gen", name: "Code Engineer & Critic", desc: "Generates code structures and runs syntax reviews.", model: "DeepSeek / GPT-4o", icon: Code2 },
                  ].map((agent) => (
                    <Card key={agent.id} className="border-border bg-card shadow-2xs hover:border-primary/40 transition-all">
                      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-lg bg-muted border border-border flex items-center justify-center text-foreground">
                            <agent.icon className="size-4" />
                          </div>
                          <div>
                            <CardTitle className="text-xs font-bold text-foreground">{agent.name}</CardTitle>
                            <span className="text-[10px] font-mono text-muted-foreground">{agent.model}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[9px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                          Active
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        <p className="text-xs text-muted-foreground leading-relaxed">{agent.desc}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Custom Agent Skills Section */}
                <div className="pt-4 border-t border-border space-y-4">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Terminal className="size-4" /> Registered Custom Agent Skills ({config?.custom_skills?.length || 0})
                  </h3>

                  <div className="space-y-3">
                    {(config?.custom_skills || []).map((skill: any) => (
                      <div key={skill.id} className="rounded-xl border border-border bg-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-foreground">{skill.name}</h4>
                            <Badge variant="outline" className="text-[9px] font-mono">Custom Skill</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{skill.description}</p>
                          {skill.prompt_injection && (
                            <code className="block text-[10px] font-mono p-2 rounded bg-muted text-foreground border border-border truncate mt-1">
                              {skill.prompt_injection}
                            </code>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDeleteSkill(skill.id)}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Add Custom Skill Form Card */}
              <Card className="border-border bg-card shadow-2xs h-fit">
                <CardHeader className="p-5 pb-3 border-b border-border">
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Plus className="size-4" /> Register New Agent Skill
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Inject custom domain instructions or formatting prompts into agent execution chains.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <form onSubmit={handleAddSkill} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Skill Name</label>
                      <Input
                        placeholder="e.g. Financial Report Formatter"
                        value={newSkillName}
                        onChange={(e) => setNewSkillName(e.target.value)}
                        className="h-8.5 text-xs bg-muted/30"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Description</label>
                      <Input
                        placeholder="Brief summary of when to execute"
                        value={newSkillDesc}
                        onChange={(e) => setNewSkillDesc(e.target.value)}
                        className="h-8.5 text-xs bg-muted/30"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">System Prompt Injection</label>
                      <Textarea
                        placeholder="Instructions injected into agent context..."
                        value={newSkillPrompt}
                        onChange={(e) => setNewSkillPrompt(e.target.value)}
                        className="min-h-[90px] text-xs bg-muted/30 font-mono"
                      />
                    </div>
                    <Button type="submit" size="sm" className="w-full h-9 text-xs font-semibold gap-1.5">
                      <Plus className="size-3.5" /> Save Skill
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 2: LLM MODEL PROVIDER KEYS */}
          <TabsContent value="providers" className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-foreground">LLM Provider API Credentials</h3>
                <p className="text-xs text-muted-foreground">Provide API keys for OpenAI, Anthropic, Gemini, DeepSeek, and Groq to activate custom model selection.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: "openai_api_key", name: "OpenAI API Key", placeholder: "sk-proj-...", docs: "https://platform.openai.com/api-keys" },
                  { key: "gemini_api_key", name: "Google Gemini API Key", placeholder: "AIzaSy...", docs: "https://aistudio.google.com/app/apikey" },
                  { key: "anthropic_api_key", name: "Anthropic Claude Key", placeholder: "sk-ant-...", docs: "https://console.anthropic.com/" },
                  { key: "deepseek_api_key", name: "DeepSeek API Key", placeholder: "sk-...", docs: "https://platform.deepseek.com/" },
                  { key: "groq_api_key", name: "Groq LPU Key", placeholder: "gsk_...", docs: "https://console.groq.com/keys" },
                  { key: "cohere_api_key", name: "Cohere API Key", placeholder: "co-...", docs: "https://dashboard.cohere.com/" },
                ].map((item) => (
                  <Card key={item.key} className="border-border bg-card p-4 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Key className="size-3.5 text-muted-foreground" /> {item.name}
                      </label>
                      <a
                        href={item.docs}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                      >
                        Get Key <ExternalLink className="size-2.5" />
                      </a>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        placeholder={item.placeholder}
                        value={config?.llm_keys?.[item.key] || ""}
                        onChange={(e) => setConfig({
                          ...config,
                          llm_keys: { ...config?.llm_keys, [item.key]: e.target.value }
                        })}
                        className="h-8.5 text-xs bg-muted/30 font-mono flex-1"
                      />
                      {config?.llm_keys?.[item.key] ? (
                        <Badge variant="outline" className="text-[9px] font-mono border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 shrink-0 px-2">
                          Saved
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px] font-mono text-muted-foreground shrink-0 px-2">
                          Unset
                        </Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              {/* Local Ollama / vLLM Endpoint Card */}
              <Card className="border-border bg-card p-5 space-y-3 shadow-2xs">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Cpu className="size-4 text-foreground" /> Local Ollama / vLLM Endpoint Host
                </h4>
                <p className="text-xs text-muted-foreground">Host URL for local open-weight LLMs running via Ollama or vLLM server.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Ollama Base URL</label>
                    <Input
                      type="text"
                      placeholder="http://localhost:11434"
                      value={config?.llm_keys?.ollama_base_url || "http://localhost:11434"}
                      onChange={(e) => setConfig({
                        ...config,
                        llm_keys: { ...config?.llm_keys, ollama_base_url: e.target.value }
                      })}
                      className="h-8.5 text-xs bg-muted/30 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Default Local Model</label>
                    <Input
                      type="text"
                      placeholder="llama3:latest"
                      value={config?.llm_keys?.ollama_model || "llama3:latest"}
                      onChange={(e) => setConfig({
                        ...config,
                        llm_keys: { ...config?.llm_keys, ollama_model: e.target.value }
                      })}
                      className="h-8.5 text-xs bg-muted/30 font-mono"
                    />
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 3: VECTOR DB & RAG */}
          <TabsContent value="vectordb" className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Vector Store & Embedding RAG Engine</h3>
                <p className="text-xs text-muted-foreground">Configure Pinecone or FAISS index properties for fast semantic document search and grounded citations.</p>
              </div>

              <Card className="border-border bg-card p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-lg bg-muted border border-border flex items-center justify-center text-foreground">
                      <Database className="size-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">Pinecone Cloud Vector Index</h4>
                      <p className="text-[10px] text-muted-foreground font-mono">Serverless / Standard Index</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-mono border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                    Active RAG Engine
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Pinecone API Key</label>
                    <Input
                      type="password"
                      placeholder="pcsk_..."
                      value={config?.vector_db?.pinecone_api_key || ""}
                      onChange={(e) => setConfig({
                        ...config,
                        vector_db: { ...config?.vector_db, pinecone_api_key: e.target.value }
                      })}
                      className="h-8.5 text-xs bg-muted/30 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Index Name</label>
                    <Input
                      type="text"
                      placeholder="trivisionx-index"
                      value={config?.vector_db?.pinecone_index_name || "trivisionx-index"}
                      onChange={(e) => setConfig({
                        ...config,
                        vector_db: { ...config?.vector_db, pinecone_index_name: e.target.value }
                      })}
                      className="h-8.5 text-xs bg-muted/30 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Embedding Dimension</label>
                    <Input
                      type="number"
                      placeholder="1536"
                      value={config?.vector_db?.embedding_dimension || 1536}
                      onChange={(e) => setConfig({
                        ...config,
                        vector_db: { ...config?.vector_db, embedding_dimension: parseInt(e.target.value) || 1536 }
                      })}
                      className="h-8.5 text-xs bg-muted/30 font-mono"
                    />
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 4: SEARCH & WEB TOOLS */}
          <TabsContent value="search" className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Search & Live Web Crawling Tools</h3>
                <p className="text-xs text-muted-foreground">Configure web search provider keys for live Internet data retrieval during agent research runs.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-border bg-card p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Globe className="size-3.5 text-muted-foreground" /> Tavily Search API
                    </label>
                    <Badge variant="outline" className="text-[9px] font-mono">Recommended</Badge>
                  </div>
                  <Input
                    type="password"
                    placeholder="tvly-..."
                    value={config?.web_search?.tavily_api_key || ""}
                    onChange={(e) => setConfig({
                      ...config,
                      web_search: { ...config?.web_search, tavily_api_key: e.target.value }
                    })}
                    className="h-8.5 text-xs bg-muted/30 font-mono"
                  />
                </Card>

                <Card className="border-border bg-card p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Search className="size-3.5 text-muted-foreground" /> Serper Google Search Key
                    </label>
                  </div>
                  <Input
                    type="password"
                    placeholder="serper_..."
                    value={config?.web_search?.serper_api_key || ""}
                    onChange={(e) => setConfig({
                      ...config,
                      web_search: { ...config?.web_search, serper_api_key: e.target.value }
                    })}
                    className="h-8.5 text-xs bg-muted/30 font-mono"
                  />
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* TAB 5: MCP PROTOCOL SERVERS */}
          <TabsContent value="mcp" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Server className="size-4" /> Registered MCP Protocol Servers ({config?.mcp_servers?.length || 0})
                  </h3>
                  <p className="text-xs text-muted-foreground">Model Context Protocol (MCP) endpoints connecting external databases, tools, and execution runtimes.</p>
                </div>

                <div className="space-y-3">
                  {(config?.mcp_servers || []).map((mcp: any) => (
                    <Card key={mcp.id} className="border-border bg-card p-4 shadow-2xs">
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-foreground">{mcp.name}</h4>
                            <Badge variant="outline" className="text-[9px] font-mono border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                              Connected
                            </Badge>
                          </div>
                          <p className="text-xs font-mono text-muted-foreground truncate">{mcp.url}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDeleteMcp(mcp.id)}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Add MCP Form */}
              <Card className="border-border bg-card shadow-2xs h-fit">
                <CardHeader className="p-5 pb-3 border-b border-border">
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Plus className="size-4" /> Connect New MCP Server
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <form onSubmit={handleAddMcpServer} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Server Name</label>
                      <Input
                        placeholder="e.g. Postgres DB MCP"
                        value={newMcpName}
                        onChange={(e) => setNewMcpName(e.target.value)}
                        className="h-8.5 text-xs bg-muted/30"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">MCP Endpoint URL</label>
                      <Input
                        placeholder="https://mcp.internal.api/sse"
                        value={newMcpUrl}
                        onChange={(e) => setNewMcpUrl(e.target.value)}
                        className="h-8.5 text-xs bg-muted/30 font-mono"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Bearer Auth Token (Optional)</label>
                      <Input
                        type="password"
                        placeholder="mcp_token_..."
                        value={newMcpToken}
                        onChange={(e) => setNewMcpToken(e.target.value)}
                        className="h-8.5 text-xs bg-muted/30 font-mono"
                      />
                    </div>
                    <Button type="submit" size="sm" className="w-full h-9 text-xs font-semibold gap-1.5">
                      <Plus className="size-3.5" /> Connect MCP Server
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 6: WORKSPACE APPS */}
          <TabsContent value="apps" className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Workspace Application Connectors</h3>
                <p className="text-xs text-muted-foreground">Toggle built-in task management, calendar, inbox email, and documentation apps.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: "task_management", name: "Task Management Engine", desc: "Automated Kanban board and subtask execution.", icon: CheckSquare },
                  { id: "smart_calendar", name: "Smart Calendar & Scheduling", desc: "Event scheduling and time slot optimization.", icon: Calendar },
                  { id: "inbox_assistant", name: "Inbox & Email Assistant", desc: "Draft email replies and classify messages.", icon: Mail },
                  { id: "notes_documentation", name: "Notes & Docs Knowledge", desc: "Document editing and automated markdown summaries.", icon: FileText },
                ].map((app) => (
                  <Card key={app.id} className="border-border bg-card p-4 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-lg bg-muted border border-border flex items-center justify-center text-foreground">
                        <app.icon className="size-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">{app.name}</h4>
                        <p className="text-[11px] text-muted-foreground">{app.desc}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] font-mono border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                      Enabled
                    </Badge>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
