"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, FileText, Scissors, Cpu, Database } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "parsing", label: "File Parsing", icon: FileText, desc: "Extracting text" },
  { id: "chunking", label: "Chunking", icon: Scissors, desc: "Semantic splitting" },
  { id: "embedding", label: "Embedding", icon: Cpu, desc: "Vector generation" },
  { id: "indexing", label: "Vector Store", icon: Database, desc: "Pinecone indexing" },
];

export default function RagPipelineVisualizer({ currentStage, progress, chunks }) {
  const [activeStepIndex, setActiveStepIndex] = useState(-1);

  useEffect(() => {
    if (currentStage === "done") {
      setActiveStepIndex(STEPS.length);
    } else {
      const index = STEPS.findIndex((s) => s.id === currentStage);
      if (index !== -1) setActiveStepIndex(index);
    }
  }, [currentStage]);

  return (
    <div className="w-full rounded-2xl border border-zinc-200/60 bg-white/50 p-6 shadow-sm backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-900/50">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {currentStage === "done" ? "Processing Complete" : "Processing Document"}
          </h3>
          <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
            {currentStage === "done"
              ? "Document successfully indexed into Pinecone."
              : "Running ingestion pipeline..."}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400">
          <Database className="h-5 w-5" />
        </div>
      </div>

      <div className="relative">
        {/* Progress Bar Track */}
        <div className="absolute left-6 top-1/2 -mt-px h-0.5 w-[calc(100%-3rem)] bg-zinc-100 dark:bg-zinc-800">
          <motion.div
            className="h-full bg-blue-500 transition-all duration-500 ease-out dark:bg-blue-400"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {STEPS.map((step, index) => {
            const isCompleted = index < activeStepIndex;
            const isCurrent = index === activeStepIndex;
            const isPending = index > activeStepIndex;

            return (
              <div key={step.id} className="flex flex-col items-center">
                <motion.div
                  initial={false}
                  animate={{
                    backgroundColor: isCompleted
                      ? "var(--blue-500)"
                      : isCurrent
                      ? "var(--bg-white)"
                      : "var(--bg-zinc-100)",
                    borderColor: isCompleted
                      ? "var(--blue-500)"
                      : isCurrent
                      ? "var(--blue-500)"
                      : "transparent",
                    scale: isCurrent ? 1.1 : 1,
                  }}
                  className={cn(
                    "relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl border-2 transition-colors duration-300",
                    isCompleted
                      ? "bg-blue-500 border-blue-500 text-white dark:bg-blue-500"
                      : isCurrent
                      ? "border-blue-500 bg-white text-blue-500 dark:bg-zinc-900 dark:border-blue-400 dark:text-blue-400"
                      : "border-transparent bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                  )}
                  style={{
                    "--blue-500": "#3b82f6",
                    "--bg-white": "white",
                    "--bg-zinc-100": "#f4f4f5",
                  }}
                >
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Check className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}

                  {isCurrent && (
                    <motion.div
                      layoutId="pulse"
                      className="absolute -inset-2 rounded-2xl border border-blue-500/30"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </motion.div>
                <div className="mt-3 flex flex-col items-center text-center">
                  <span
                    className={cn(
                      "text-[12px] font-semibold transition-colors duration-300",
                      isCompleted || isCurrent
                        ? "text-zinc-900 dark:text-zinc-100"
                        : "text-zinc-400 dark:text-zinc-500"
                    )}
                  >
                    {step.label}
                  </span>
                  <span className="mt-0.5 text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                    {step.desc}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
