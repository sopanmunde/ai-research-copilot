import { useState } from "react";
import { cls } from "./utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { Copy, Check, Volume2, VolumeX, ChevronDown, X, ShieldCheck } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

function CodeBlock({ children, className, ...props }) {
  const [copied, setCopied] = useState(false);
  const code = typeof children === "string" ? children : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { }
  };

  return (
    <div className="group/code relative my-4 overflow-hidden rounded-lg border border-zinc-200/50 bg-zinc-950 shadow-sm dark:border-zinc-800/50">
      {/* Language tag + Copy button */}
      <div className="flex items-center justify-between border-b border-zinc-800/40 bg-zinc-900 px-4 py-1.5">
        <span className="text-[11px] font-mono font-medium text-zinc-400">
          {className?.replace("language-", "") || "code"}
        </span>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" /> Copy code
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13.5px] leading-relaxed">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}

export default function Message({ role, content, sources, quality_score, agent_steps, source_heatmap, onOpenAuditLogs, children }) {
  const isUser = role === "user";
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioInstance, setAudioInstance] = useState(null);
  const [showSteps, setShowSteps] = useState(false);

  const handleSpeak = async () => {
    if (isSpeaking) {
      if (audioInstance) {
        audioInstance.pause();
      }
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);

    try {
      const token = localStorage.getItem("token");
      const url = `${API_BASE_URL}/audio/tts?text=${encodeURIComponent(content)}`;

      const testRes = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!testRes.ok) {
        throw new Error("tts_disabled_or_failed");
      }

      const audioBlob = await testRes.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      setAudioInstance(audio);

      audio.onended = () => {
        setIsSpeaking(false);
        setAudioInstance(null);
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        setAudioInstance(null);
      };

      await audio.play();

    } catch (err) {
      console.log("ElevenLabs TTS not available, falling back to Browser speechSynthesis: ", err.message);
      window.speechSynthesis.cancel();

      const cleanText = content
        .replace(/\[\d+\]/g, "")
        .replace(/[*_`#]/g, "")
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div
      className={cls(
        "flex gap-4 px-2 w-full",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {/* AI avatar */}
      {!isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 shadow-sm">
          <svg
            className="w-[50%] h-[50%] text-zinc-700 dark:text-zinc-300"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="3" x2="12" y2="21" />
            <path d="M5 7 C5 3 19 3 19 7" />
            <line x1="5" y1="7" x2="5" y2="13" />
            <line x1="19" y1="7" x2="19" y2="13" />
            <line x1="8" y1="21" x2="16" y2="21" />
          </svg>
        </div>
      )}

      <div
        className={cls(
          "text-[15px] leading-relaxed max-w-[85%] sm:max-w-[75%] transition-all duration-200",
          isUser
            ? "rounded-2xl bg-zinc-100 dark:bg-zinc-800 px-4 py-2.5 text-zinc-800 dark:text-zinc-100 select-text"
            : "rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-sm px-4 py-3.5 text-zinc-800 dark:text-zinc-100 shadow-sm w-full"
        )}
      >
        {content !== undefined ? (
          isUser ? (
            <span className="whitespace-pre-wrap break-words">{typeof content === 'string' ? content : JSON.stringify(content)}</span>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none break-words prose-p:my-2.5 prose-p:leading-relaxed prose-headings:font-semibold prose-headings:tracking-tight prose-li:my-1 prose-code:rounded-md prose-code:bg-zinc-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-zinc-800 prose-code:font-mono prose-code:text-[12px] dark:prose-code:bg-zinc-800 dark:prose-code:text-zinc-200 prose-pre:my-0 prose-pre:p-0 prose-pre:bg-transparent prose-pre:shadow-none prose-blockquote:border-l-zinc-300 dark:prose-blockquote:border-l-zinc-600 prose-blockquote:text-zinc-500 dark:prose-blockquote:text-zinc-400 prose-table:text-[13px]">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  pre: ({ children }) => <>{children}</>,
                  code: ({ node, className, children, ...props }) => {
                    const isBlock = node?.position && className?.startsWith("language-") ||
                      (node?.parent?.tagName === "pre") ||
                      (typeof children === "string" && children.includes("\n"));

                    if (isBlock || className) {
                      return (
                        <CodeBlock className={className} {...props}>
                          {children}
                        </CodeBlock>
                      );
                    }

                    return (
                      <code
                        className={cls(
                          "rounded-md bg-zinc-100 px-1.2 py-0.4 font-mono text-[12px] dark:bg-zinc-800",
                          className,
                        )}
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
              </ReactMarkdown>

              {/* Citations Panel */}
              {sources && sources.length > 0 && (
                <div className="mt-4 border-t border-zinc-200/50 dark:border-zinc-800/50 pt-3">
                  <h4 className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                    Citations
                  </h4>
                  <ul className="space-y-1.5 list-none pl-0">
                    {sources.map((src, i) => {
                      const confPercent = confidence ? Math.round(confidence * 100) : null;
                      const confColorClass = confPercent >= 80
                        ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                        : confPercent >= 55
                          ? "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20"
                          : "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20";
                      return (
                        <li
                          key={i}
                          className="text-[12px] text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/40 px-2.5 py-1.5 rounded-md border border-zinc-100 dark:border-zinc-900/80 flex items-center gap-2"
                        >
                          <span className="shrink-0 w-4 h-4 rounded bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
                            {i + 1}
                          </span>
                          <span className="break-all flex-1 min-w-0">
                            {url ? (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors font-medium"
                              >
                                {source || filename || "Unknown Source"}
                              </a>
                            ) : (
                              source || filename || "Unknown Source"
                            )}{" "}
                            {page && page !== "N/A" ? `(Page ${page})` : ""}
                          </span>
                          {confPercent !== null && (
                            <span className={cls("shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border leading-none ml-2", confColorClass)}>
                              {confPercent}% Match
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Source Heatmap Panel */}
              {role === "assistant" && source_heatmap && source_heatmap.length > 0 && (
                <div className="mt-4 border-t border-zinc-200/50 dark:border-zinc-800/50 pt-3">
                  <h4 className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                    Source Impact Heatmap
                  </h4>
                  <div className="space-y-2">
                    {source_heatmap.map((item, idx) => {
                      const total = source_heatmap.reduce((sum, h) => sum + h.count, 0);
                      const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                      return (
                        <div key={idx} className="flex flex-col gap-1">
                          <div className="flex justify-between text-[11.5px] font-medium">
                            <span className="text-zinc-750 dark:text-zinc-350 truncate max-w-[70%]" title={item.source}>
                              {item.source}
                            </span>
                            <span className="text-zinc-500 dark:text-zinc-400 shrink-0 font-semibold text-[11px]">
                              {item.count} hit{item.count !== 1 ? 's' : ''} ({pct}%)
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quality Score Panel */}
              {role === "assistant" && typeof content === "string" && quality_score && (
                <div className="mt-4 border-t border-zinc-200/50 dark:border-zinc-800/50 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      Research Quality
                    </h4>
                    <span className={cls(
                      "text-[9px] font-semibold px-1.5 py-0.5 rounded border",
                      quality_score.overall >= 80
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : quality_score.overall >= 60
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                    )}>
                      {quality_score.overall >= 80 ? "High Reliability" :
                        quality_score.overall >= 60 ? "Medium Reliability" : "Low Reliability"}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                    {/* Coverage */}
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-zinc-500 dark:text-zinc-400">Coverage</span>
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">{quality_score.coverage}%</span>
                      </div>
                      <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${quality_score.coverage}%` }} />
                      </div>
                    </div>
                    {/* Confidence */}
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-zinc-500 dark:text-zinc-400">Confidence</span>
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">{quality_score.confidence}%</span>
                      </div>
                      <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-fuchsia-500 rounded-full" style={{ width: `${quality_score.confidence}%` }} />
                      </div>
                    </div>
                    {/* Completeness */}
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-zinc-500 dark:text-zinc-400">Completeness</span>
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">{quality_score.completeness}%</span>
                      </div>
                      <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${quality_score.completeness}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Agent Execution Pathway Panel */}
              {role === "assistant" && agent_steps && agent_steps.length > 0 && (
                <div className="mt-4 border-t border-zinc-200/50 dark:border-zinc-800/50 pt-3">
                  <button
                    onClick={() => setShowSteps(!showSteps)}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 uppercase tracking-wider transition-colors cursor-pointer select-none"
                  >
                    <span>Agent execution pathway</span>
                    <span className="text-[10px] text-zinc-400 font-normal">({agent_steps.length} step{agent_steps.length !== 1 ? 's' : ''})</span>
                    <ChevronDown className={cls("h-3.5 w-3.5 transition-transform duration-250 text-zinc-400", showSteps && "rotate-180")} />
                  </button>

                  {showSteps && (
                    <div className="mt-3.5 pl-2.5 border-l border-zinc-200 dark:border-zinc-850 space-y-4">
                      {agent_steps.map((step, idx) => {
                        const nodeConfig = {
                          voice_preprocessor: { title: "Voice Preprocessing", desc: "Transcribing and optimizing voice audio input." },
                          planner: { title: "Research Planner", desc: "Analyzing user query, routing, and creating research task list." },
                          memory_retriever: { title: "Memory Recall", desc: "Searching conversation history and persistent memories." },
                          vision_extractor: { title: "Vision Document Parsing", desc: "Extracting tables, OCR text, and charts from file." },
                          retriever: { title: "Document Semantics Retriever", desc: "Querying vector database to extract factual contexts." },
                          web_researcher: { title: "Web Query Analyst", desc: "Performing live search over the internet for fresh data." },
                          citation: { title: "Citation Validator", desc: "Filtering duplication and grading source relevancies." },
                          summarizer: { title: "Synthesis Architect", desc: "Compiling research details and draft answers." },
                          reporter: { title: "Final Report Publisher", desc: "Constructing final report markdown structure." },
                          code_generation: { title: "Code Generator", desc: "Creating solution structure and code files." },
                          code_review: { title: "Code Reviewer", desc: "Scanning code for potential bugs and inefficiencies." },
                          testing: { title: "Testing Suite", desc: "Running test cases over implementation." },
                          data_analysis: { title: "Data Analyst", desc: "Aggregating and analyzing numerical data datasets." },
                        };
                        const config = nodeConfig[step.node] || { title: step.node, desc: "Executing agent tasks." };
                        const isCompleted = step.status === "completed";
                        const isRunning = step.status === "running";
                        const isFailed = step.status === "failed";

                        return (
                          <div key={idx} className="relative flex items-start gap-3">
                            <div className={cls("mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold",
                              isCompleted ? "border-emerald-500/25 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400" :
                                isRunning ? "border-blue-500/25 bg-blue-500/5 text-blue-600 dark:text-blue-400 animate-pulse" :
                                  "border-rose-500/25 bg-rose-500/5 text-rose-600 dark:text-rose-400"
                            )}>
                              {isCompleted ? "✓" : isRunning ? "●" : "✗"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 justify-between">
                                <span className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-200 leading-none">
                                  {config.title}
                                </span>
                              </div>
                              <p className="mt-1.5 text-[12px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium font-mono">
                                {step.output || config.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-3 flex items-center justify-between border-t border-zinc-200/50 dark:border-zinc-800/50 pt-2.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <ShieldCheck className="h-3 w-3" /> Explainable AI Audited
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSpeak}
                    className="inline-flex items-center justify-center h-6 w-6 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                    title={isSpeaking ? "Stop speaking" : "Speak response"}
                  >
                    {isSpeaking ? (
                      <VolumeX className="h-3.5 w-3.5 text-red-500 animate-pulse" />
                    ) : (
                      <Volume2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )
        ) : (
          children
        )}
      </div>
    </div>
  );
}
