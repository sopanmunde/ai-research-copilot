"use client";
import {
  Menu,
  ChevronDown,
  Zap,
  Globe,
  BrainCircuit,
  Bot,
  Check,
  Sliders,
  ShieldCheck,
  GitMerge,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";

const CHATBOTS = [
  {
    name: "Fast",
    icon: <Zap className="h-3.5 w-3.5" />,
    desc: "Instant response",
    badge: null,
  },
  {
    name: "Gemini",
    icon: <Globe className="h-3.5 w-3.5" />,
    desc: "Google DeepMind",
    badge: null,
  },
  {
    name: "Claude Sonnet 4",
    icon: <BrainCircuit className="h-3.5 w-3.5" />,
    desc: "Anthropic",
    badge: "NEW",
  },
  {
    name: "Assistant",
    icon: <Bot className="h-3.5 w-3.5" />,
    desc: "TriVisionX",
    badge: null,
  },
];

export default function Header({
  sidebarCollapsed = false,
  setSidebarOpen = () => { },
  selectedBot = "Fast",
  setSelectedBot = () => { },
  onToggleIntegrations = () => { },
  onOpenAuditLogs = () => { },
  onOpenWorkflows = () => { },
}) {
  const currentBot = CHATBOTS.find((b) => b.name === selectedBot) || CHATBOTS[0];

  return (
    <div className="sticky top-0 z-30 flex items-center justify-between bg-background/80 px-4 py-2.5 backdrop-blur-xl border-b border-border">
      {/* Left side */}
      <div className="flex items-center gap-2">
        {/* Mobile menu button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden inline-flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground shrink-0 cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        {/* Model dropdown using shadcn button UI */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg px-2.5 text-xs font-semibold text-foreground border-border shadow-2xs flex items-center gap-1.5 cursor-pointer bg-background hover:bg-accent transition-all select-none"
            >
              <span className="text-muted-foreground shrink-0">{currentBot.icon}</span>
              <span>{selectedBot || "Select model"}</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-60 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[220px] rounded-xl p-1.5 border-border bg-popover text-popover-foreground backdrop-blur-md">
            <DropdownMenuLabel className="px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Select a model
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <div className="space-y-0.5">
              {CHATBOTS.map((bot) => (
                <DropdownMenuItem
                  key={bot.name}
                  onClick={() => setSelectedBot(bot.name)}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer focus:bg-accent outline-none"
                >
                  <span className="text-muted-foreground shrink-0">{bot.icon}</span>
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="text-[12px] font-medium text-foreground leading-none">{bot.name}</span>
                    <span className="text-[10px] text-muted-foreground leading-snug mt-0.5">{bot.desc}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {bot.badge && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-sm border border-border text-muted-foreground bg-muted leading-none">
                        {bot.badge}
                      </span>
                    )}
                    {selectedBot === bot.name && (
                      <Check className="h-3.5 w-3.5 text-foreground" />
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Center Group: Dropdown selector */}
      <div className="flex items-center">
        <button className="flex items-center gap-1 text-[12px] font-bold text-foreground px-3 py-1.5 border border-border bg-background rounded-full shadow-2xs hover:bg-accent transition-all cursor-pointer leading-none select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-0.5 animate-pulse" />
          <span>TriVisionX</span>
          <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
        </button>
      </div>

      {/* Right side settings, audit logs & automations triggers */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenWorkflows}
          className="h-8 gap-1.5 text-xs font-semibold text-foreground border-border bg-background hover:bg-accent shadow-2xs transition-all"
          title="Workflow Automations (Cron & Events)"
        >
          <GitMerge className="h-4 w-4 text-foreground" />
          <span className="hidden sm:inline">Automations</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenAuditLogs}
          className="h-8 gap-1.5 text-xs font-semibold text-foreground border-border bg-background hover:bg-accent shadow-2xs transition-all"
          title="Explainable AI Audit Logs"
        >
          <ShieldCheck className="h-4 w-4 text-foreground" />
          <span className="hidden sm:inline">Audit Logs</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleIntegrations}
          className="h-8 w-8 rounded-lg p-0 text-muted-foreground hover:text-foreground border-border bg-background hover:bg-accent shadow-2xs cursor-pointer flex items-center justify-center transition-all"
          title="Integrations & Agent Extensions"
        >
          <Sliders className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

