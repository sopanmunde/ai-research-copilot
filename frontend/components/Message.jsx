import { useState } from "react";
import { cls } from "./utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { Copy, Check } from "lucide-react";

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

export default function Message({ role, content, sources, quality_score, children }) {
  const isUser = role === "user";

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
                    {sources.map((src, i) => (
                      <li
                        key={i}
                        className="text-[12px] text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/40 px-2.5 py-1.5 rounded-md border border-zinc-100 dark:border-zinc-900/80 flex items-start gap-2"
                      >
                        <span className="shrink-0 mt-0.5 w-4 h-4 rounded bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
                          {i + 1}
                        </span>
                        <span className="break-all">
                          {src.source || src.filename || "Unknown Source"}{" "}
                          {src.page ? `(Page ${src.page})` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
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
            </div>
          )
        ) : (
          children
        )}
      </div>
    </div>
  );
}
