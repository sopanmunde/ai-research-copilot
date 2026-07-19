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
  sidebarCollapsed,
  setSidebarOpen,
  selectedBot,
  setSelectedBot,
  onToggleIntegrations,
  onOpenAuditLogs,
}) {
  const currentBot = CHATBOTS.find((b) => b.name === selectedBot) || CHATBOTS[0];

  return (
    <div className="sticky top-0 z-30 flex items-center justify-between bg-zinc-50/80 px-4 py-2.5 backdrop-blur-xl dark:bg-zinc-950/80 border-b border-zinc-200/80 dark:border-zinc-900/80">
      {/* Left side */}
      <div className="flex items-center gap-2">
        {/* Mobile menu button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden inline-flex h-8 w-8 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0 cursor-pointer"
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
              className="h-8 rounded-lg px-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 border-zinc-200/80 dark:border-zinc-800/80 shadow-xs flex items-center gap-1.5 cursor-pointer bg-white/50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-900 transition-all select-none"
            >
              <span className="text-zinc-400 dark:text-zinc-500 shrink-0">{currentBot.icon}</span>
              <span>{selectedBot || "Select model"}</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-60 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[220px] rounded-xl p-1.5 border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md">
            <DropdownMenuLabel className="px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Select a model
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
            <div className="space-y-0.5">
              {CHATBOTS.map((bot) => (
                <DropdownMenuItem
                  key={bot.name}
                  onClick={() => setSelectedBot(bot.name)}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800/80 outline-none"
                >
                  <span className="text-zinc-400 dark:text-zinc-500 shrink-0">{bot.icon}</span>
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="text-[12px] font-medium text-zinc-800 dark:text-zinc-100 leading-none">{bot.name}</span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-snug mt-0.5">{bot.desc}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {bot.badge && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-sm border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 leading-none">
                        {bot.badge}
                      </span>
                    )}
                    {selectedBot === bot.name && (
                      <Check className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
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
        <button className="flex items-center gap-1 text-[12px] font-bold text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-50 px-3 py-1.5 border border-zinc-200/80 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/50 rounded-full shadow-xs hover:bg-white dark:hover:bg-zinc-900 transition-all cursor-pointer leading-none select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-0.5 animate-pulse" />
          <span>TriVisionX Chat</span>
          <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
        </button>
      </div>

      {/* Right side settings & audit log triggers */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenAuditLogs}
          className="h-8 rounded-lg px-2.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
          title="Explainable AI Audit Logs"
        >
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span className="hidden sm:inline">Audit Logs</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleIntegrations}
          className="h-8 w-8 rounded-lg p-0 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 border-zinc-200/80 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-900 shadow-xs cursor-pointer flex items-center justify-center transition-all"
          title="Integrations & Agent Extensions"
        >
          <Sliders className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

