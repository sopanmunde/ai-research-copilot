"use client";

import {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  Pencil,
  RefreshCw,
  Check,
  X,
  Square,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Stethoscope,
  BookOpen,
  FileText,
  FileType,
  FileSpreadsheet,
  FileCode,
  FileJson,
  File as FileIcon,
  Archive,
  Presentation,
  Bot,
  ChevronDown,
} from "lucide-react";
import { TriVisionXLogo } from "./TriVisionXLogo";
import { motion, AnimatePresence } from "framer-motion";
import Message from "./Message";
import Composer from "./Composer";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Textarea } from "./ui/textarea";
import { Card, CardContent } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import ScrambleHover from "./ui/scramble";

function getFileInfo(filename) {
  const ext = filename?.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf") return { icon: FileType, bg: "bg-red-500", label: "PDF" };
  if (["docx", "doc", "rtf", "odt"].includes(ext)) return { icon: FileText, bg: "bg-blue-500", label: ext.toUpperCase() };
  if (["xlsx", "xls", "csv"].includes(ext)) return { icon: FileSpreadsheet, bg: "bg-green-500", label: ext.toUpperCase() };
  if (["pptx", "ppt"].includes(ext)) return { icon: Presentation, bg: "bg-orange-500", label: ext.toUpperCase() };
  if (["json", "jsonl", "xml", "yaml", "yml"].includes(ext)) return { icon: FileJson, bg: "bg-yellow-500", label: ext.toUpperCase() };
  if (["html", "htm", "md", "mdx", "rst"].includes(ext)) return { icon: FileCode, bg: "bg-cyan-500", label: ext.toUpperCase() };
  if (["py", "js", "ts", "jsx", "tsx", "java", "cpp", "c", "cs", "go", "rs", "rb", "php", "sh", "sql"].includes(ext)) return { icon: FileCode, bg: "bg-indigo-500", label: ext.toUpperCase() };
  if (ext === "zip") return { icon: Archive, bg: "bg-zinc-600", label: "ZIP" };
  return { icon: FileIcon, bg: "bg-zinc-600", label: ext.toUpperCase() || "File" };
}

function MessageFileCard({ attachedFile }) {
  const info = getFileInfo(attachedFile.name);
  const Icon = info.icon;
  const shortName = attachedFile.name.length > 32 ? attachedFile.name.slice(0, 30) + "…" : attachedFile.name;
  return (
    <div className="flex justify-end mb-2">
      <Card className="flex items-center gap-2.5 rounded-xl border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 px-3 py-2 shadow-xs max-w-[280px]">
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-sm text-white", info.bg)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="overflow-hidden">
          <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-100 truncate leading-snug">{shortName}</p>
          <Badge variant="secondary" className="mt-0.5 text-[9px] px-1.5 py-0.5 font-bold tracking-wider leading-none">
            {info.label}
          </Badge>
        </div>
      </Card>
    </div>
  );
}

function ThinkingMessage({ onPause, agentState }) {
  const getAgentText = (state) => {
    if (state === "planner") return "Planning research strategy...";
    if (state === "retriever") return "Searching documents...";
    if (state === "summarizer") return "Analyzing findings...";
    if (state === "citation") return "Extracting citations...";
    if (state === "reporter") return "Generating report...";
    return "Thinking...";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-4 px-2 w-full justify-start"
    >
      {/* AI avatar */}
      <Avatar className="mt-1 h-8 w-8 border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
        <AvatarFallback className="bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-3 py-1">
        {/* Staggered dots */}
        <div className="flex items-center gap-[5px]">
          {[0, 160, 320].map((delay) => (
            <motion.div
              key={delay}
              className="h-2 w-2 rounded-full bg-zinc-400 dark:bg-zinc-500"
              animate={{ scale: [0.7, 1.2, 0.7], opacity: [0.35, 1, 0.35] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: delay / 1000,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
        <span className="text-[14px] font-medium text-zinc-500 dark:text-zinc-400">
          {getAgentText(agentState)}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onPause}
          className="ml-2 h-7 rounded-full px-3 text-[11px] font-semibold transition-all border-zinc-200 hover:border-red-500/50 hover:bg-red-50 dark:border-zinc-800 dark:hover:border-red-500/30 dark:hover:bg-red-950/20 text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
        >
          <Square className="h-2 w-2 mr-1.5 fill-current" /> Stop
        </Button>

      </div>
    </motion.div>
  );
}

const SUGGESTIONS = [
  { label: "Explain a diagnosis", icon: Stethoscope },
  { label: "Summarize research", icon: BookOpen },
  { label: "Write a report", icon: FileText },
];

function EmptyState({ onSuggestion }) {
  return null;
}

const ChatPane = forwardRef(function ChatPane(
  {
    conversation,
    onSend,
    onEditMessage,
    onResendMessage,
    isThinking,
    isResponding,
    onPauseThinking,
    agentState,
    providerSwitchEvent,
    onDismissProviderSwitch,
    selectedBot,
    user,
  },
  ref,
) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const composerRef = useRef(null);
  const bottomRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const switchTimerRef = useRef(null);

  useEffect(() => {
    if (providerSwitchEvent) {
      if (switchTimerRef.current) clearTimeout(switchTimerRef.current);
      switchTimerRef.current = setTimeout(() => {
        onDismissProviderSwitch?.();
      }, 6000);
    }
    return () => {
      if (switchTimerRef.current) clearTimeout(switchTimerRef.current);
    };
  }, [providerSwitchEvent, onDismissProviderSwitch]);

  useImperativeHandle(
    ref,
    () => ({
      insertTemplate: (templateContent) =>
        composerRef.current?.insertTemplate(templateContent),
      getSelectedBot: () =>
        composerRef.current?.getSelectedBot(),
    }),
    [],
  );

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distFromBottom > 150);
  }, []);

  const messages = Array.isArray(conversation?.messages)
    ? conversation.messages
    : [];
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distFromBottom < 250) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages.length, isThinking]);

  function scrollToBottom() {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    setShowScrollBtn(false);
  }

  function handleSuggestion(text) {
    composerRef.current?.setValue?.(text);
    composerRef.current?.focus?.();
  }

  function startEdit(m) {
    setEditingId(m.id);
    setDraft(m.content);
  }
  function cancelEdit() {
    setEditingId(null);
    setDraft("");
  }
  function saveEdit() {
    if (!editingId) return;
    onEditMessage?.(editingId, draft);
    cancelEdit();
  }
  function saveAndResend() {
    if (!editingId) return;
    onEditMessage?.(editingId, draft);
    onResendMessage?.(editingId);
    cancelEdit();
  }

  async function copyToClipboard(text, id) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { }
  }

  if (!conversation) return null;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden">
      {/* Background patterns to contrast with the sidebar's translucent look */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.03),transparent_75%)] pointer-events-none" />

      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col justify-between overflow-y-auto px-4 py-8 bg-transparent relative z-10">
          <div className="flex flex-1 flex-col items-center justify-center w-full">
            <div className="w-full max-w-3xl flex flex-col items-center justify-center">
              {/* Logo & Greeting (no surrounding card box border/bg) */}
              <Card className="mb-8 border-none shadow-none bg-transparent max-w-md w-full">
                <CardContent className="flex flex-col items-center justify-center text-center pt-6 pb-0">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center gap-4 w-full"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl animate-pulse" />
                      <TriVisionXLogo size="lg" glow animate={false} />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-600 dark:from-white dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
                        Hello{user?.first_name ? (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            ,&nbsp;
                            <ScrambleHover
                              text={user.first_name}
                              scrambleSpeed={80}
                              maxIterations={8}
                              characters="!<>-_\/[]{}—=+*^?#@"
                              className="text-primary"
                            />
                          </motion.span>
                        ) : ''}
                      </h2>
                      <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mt-1">
                        How can I help you today?
                      </p>
                    </div>
                  </motion.div>
                </CardContent>
              </Card>

              <div className="w-full relative z-10">
                <Composer
                  ref={composerRef}
                  onSend={async (text, mode, fileRef) => {
                    if (isThinking || isResponding || busy) {
                      onPauseThinking?.();
                      return;
                    }
                    if (!text.trim() && !fileRef) return;
                    setBusy(true);
                    await onSend?.(text, mode, fileRef);
                    setBusy(false);
                  }}
                  busy={busy || isThinking || isResponding}
                  selectedBot={selectedBot}
                />
              </div>

              {/* Suggestion pills — directly below Composer */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-4 relative z-10">
                {SUGGESTIONS.map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.28 + i * 0.06, duration: 0.35 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant="outline"
                      onClick={() => handleSuggestion(s.label)}
                      className="group rounded-full h-8 px-4 border border-zinc-200/80 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md shadow-xs text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-white dark:hover:bg-zinc-900 transition-all duration-200 cursor-pointer"
                    >
                      {s.icon && (
                        <s.icon className="mr-1.5 h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
                      )}
                      <span>{s.label}</span>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Hint stays down of the chat panel */}
          <p className="mx-auto mt-7 text-center text-[11px] text-zinc-400/70 dark:text-zinc-600">
            AI can make mistakes. Verify important information.
          </p>
        </div>
      ) : (
        <>
          {/* Provider Switch Notification Banner */}
          <AnimatePresence>
            {providerSwitchEvent && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center justify-center gap-2 bg-amber-50/90 dark:bg-amber-950/30 backdrop-blur-md border-b border-amber-200/60 dark:border-amber-800/30 px-4 py-2.5 text-[12px] text-amber-800 dark:text-amber-300 font-medium shadow-xs relative z-10"
              >
                <span>
                  Switched from <strong>{providerSwitchEvent.from}</strong> to{" "}
                  <strong>{providerSwitchEvent.to}</strong>
                  {providerSwitchEvent.reason === "quota_exhausted"
                    ? " (quota exhausted)"
                    : ""}
                </span>
                <button
                  onClick={onDismissProviderSwitch}
                  className="ml-2 rounded-full p-0.5 hover:bg-amber-200/50 dark:hover:bg-amber-800/50 transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages scroll area — native div so scrollIntoView works reliably */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto relative z-10 scroll-smooth"
          >
            <div className="mx-auto max-w-3xl px-4 py-8">
              <div className="space-y-6">
                <AnimatePresence initial={false}>
                  {messages.map((m, idx) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="group"
                    >
                      {editingId === m.id ? (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 shadow-md backdrop-blur-md">
                            <CardContent className="p-3">
                              <Textarea
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                className="w-full resize-none border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3 text-[14px] rounded-lg shadow-xs focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[90px] leading-relaxed transition-all"
                                autoFocus
                                placeholder="Edit message..."
                              />
                              <div className="mt-3 flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  onClick={cancelEdit}
                                  className="h-8 rounded-lg text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 px-3 cursor-pointer select-none"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={saveAndResend}
                                  className="h-8 rounded-lg text-xs font-semibold px-3 cursor-pointer select-none border-zinc-200 dark:border-zinc-800"
                                >
                                  Save & Resend
                                </Button>
                                <Button
                                  onClick={saveEdit}
                                  className="h-8 rounded-lg text-xs font-semibold px-3 cursor-pointer bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 select-none shadow-xs"
                                >
                                  Save
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ) : (
                        <div className="relative">
                          {/* File card above user message */}
                          {m.role === "user" && m.attachedFile && (
                            <MessageFileCard attachedFile={m.attachedFile} />
                          )}
                          <Message
                            role={m.role}
                            content={m.content}
                            sources={m.sources}
                            quality_score={m.quality_score}
                          />

                          {/* Hover action bar */}
                          <div
                            className={cn(
                              "mt-1.5 flex items-center gap-1.5 opacity-0 transition-all duration-200 group-hover:opacity-100",
                              m.role === "user"
                                ? "justify-end pr-1"
                                : "justify-start pl-12",
                            )}
                          >
                            {/* Copy */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => copyToClipboard(m.content, m.id)}
                                  className="h-7 w-7 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 shadow-xs transition-colors shrink-0"
                                >
                                  {copiedId === m.id ? (
                                    <Check className="h-4 w-4 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top">Copy to clipboard</TooltipContent>
                            </Tooltip>

                            {m.role === "user" && (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => startEdit(m)}
                                      className="h-7 w-7 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 shadow-xs transition-colors shrink-0"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">Edit message</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => onResendMessage?.(m.id)}
                                      className="h-7 w-7 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 shadow-xs transition-colors shrink-0"
                                    >
                                      <RefreshCw className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">Resend message</TooltipContent>
                                </Tooltip>
                              </>
                            )}

                            {m.role === "assistant" && (
                              <div className="flex items-center gap-1.5 ml-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 shadow-xs transition-colors">
                                      <ThumbsUp className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">Good response</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 shadow-xs transition-colors">
                                      <ThumbsDown className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">Bad response</TooltipContent>
                                </Tooltip>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isThinking && (
                  <ThinkingMessage
                    onPause={onPauseThinking}
                    agentState={agentState}
                  />
                )}

                {/* Scroll anchor */}
                <div ref={bottomRef} className="h-1" />
              </div>
            </div>
          </div>



          {/* Liquid fade gradient above composer */}
          <div className="pointer-events-none absolute bottom-[var(--composer-h,140px)] left-0 right-0 h-20 z-10 bg-gradient-to-t from-zinc-50 dark:from-zinc-950 to-transparent" />

          {/* Scroll-to-bottom button — sits just above the composer */}
          <AnimatePresence>
            {showScrollBtn && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.18 }}
                className="relative z-20 flex justify-center py-1.5"
              >
                <motion.button
                  onClick={scrollToBottom}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-secondary-foreground border border-border shadow-sm hover:bg-accent transition-all duration-200 cursor-pointer"
                  aria-label="Scroll to bottom"
                >
                  <motion.span
                    animate={{ y: [0, 3, 0] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                    className="flex items-center justify-center"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Composer at the bottom */}
          <div className="relative z-10">
            <Composer
              ref={composerRef}
              onSend={async (text, mode, fileRef) => {
                if (isThinking || isResponding || busy) {
                  onPauseThinking?.();
                  return;
                }
                if (!text.trim() && !fileRef) return;
                setBusy(true);
                await onSend?.(text, mode, fileRef);
                setBusy(false);
              }}
              busy={busy || isThinking || isResponding}
              selectedBot={selectedBot}
            />
          </div>

          {/* Footer Hint below Composer */}
          <p className="mx-auto pb-4 text-center text-[11px] text-zinc-400/70 dark:text-zinc-600 relative z-10">
            AI can make mistakes. Verify important information.
          </p>

        </>
      )}
    </div>
  );
});

export default ChatPane;
