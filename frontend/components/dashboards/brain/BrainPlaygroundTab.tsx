"use client";

import React, { RefObject } from "react";
import { Brain, RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Message } from "./types";

interface BrainPlaygroundTabProps {
  scrollRef: RefObject<HTMLDivElement | null>;
  chatMessages: Message[];
  selectedModel: string;
  isGenerating: boolean;
  streamedText: string;
  inputMessage: string;
  setInputMessage: (val: string) => void;
  handleSendMessage: () => void;
  temperature: number;
  clearPlaygroundLogs: () => void;
}

export function BrainPlaygroundTab({
  scrollRef,
  chatMessages,
  selectedModel,
  isGenerating,
  streamedText,
  inputMessage,
  setInputMessage,
  handleSendMessage,
  temperature,
  clearPlaygroundLogs,
}: BrainPlaygroundTabProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-muted/10">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        {chatMessages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "flex flex-col max-w-[85%] rounded-xl px-4 py-3 border text-xs leading-relaxed shadow-xs",
              msg.role === "user"
                ? "ml-auto bg-foreground text-background border-foreground/10"
                : "mr-auto bg-card text-foreground border-border"
            )}
          >
            {msg.role === "assistant" && (
              <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-mono text-muted-foreground">
                <Brain className="size-3" />
                <span>{msg.modelUsed || selectedModel}</span>
              </div>
            )}
            <p className="whitespace-pre-wrap">{msg.content}</p>
            <span className={cn(
              "text-[9px] mt-1.5 block text-right font-mono",
              msg.role === "user" ? "text-background/70" : "text-muted-foreground/70"
            )}>
              {msg.timestamp}
            </span>
          </div>
        ))}

        {isGenerating && streamedText && (
          <div className="mr-auto bg-card text-foreground border border-border rounded-xl px-4 py-3 text-xs leading-relaxed max-w-[85%] shadow-xs">
            <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-mono text-muted-foreground">
              <Brain className="size-3" />
              <span>{selectedModel} (Streaming…)</span>
            </div>
            <p className="whitespace-pre-wrap">{streamedText}</p>
            <span className="inline-block animate-pulse font-bold text-foreground">|</span>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border bg-card">
        <div className="flex items-center gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Send test prompt to ${selectedModel} (temp=${temperature})…`}
            onKeyDown={(e) => { if (e.key === "Enter") handleSendMessage(); }}
            className="text-xs border-border bg-background h-10"
            disabled={isGenerating}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isGenerating}
            size="icon"
            className="h-10 w-10 shrink-0 cursor-pointer"
          >
            {isGenerating ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
        <div className="flex justify-between items-center mt-2 px-1 text-[10px] text-muted-foreground">
          <span>Press Enter to send. Playground utilizes configured Temperature, System Prompt, and Parameters.</span>
          <button
            className="hover:text-foreground underline transition-colors cursor-pointer"
            onClick={clearPlaygroundLogs}
          >
            Clear Playground Logs
          </button>
        </div>
      </div>
    </div>
  );
}
