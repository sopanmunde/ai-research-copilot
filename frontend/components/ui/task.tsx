import * as React from "react"
import { cn } from "@/lib/utils"

function Task({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="task-root"
      className={cn(
        "relative rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/40 backdrop-blur-md p-4 text-zinc-950 dark:text-zinc-50 shadow-xs transition-all hover:bg-white/70 dark:hover:bg-zinc-950/60 flex flex-col gap-3 group overflow-hidden select-none",
        className
      )}
      {...props}
    />
  )
}

function TaskHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="task-header"
      className={cn("flex items-start justify-between gap-2", className)}
      {...props}
    />
  )
}

function TaskTitle({ className, ...props }: React.ComponentProps<"h4">) {
  return (
    <h4
      data-slot="task-title"
      className={cn("text-xs font-bold leading-tight truncate text-foreground", className)}
      {...props}
    />
  )
}

function TaskDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="task-description"
      className={cn("text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug line-clamp-2", className)}
      {...props}
    />
  )
}

function TaskProgress({
  value,
  max = 100,
  className,
  ...props
}: React.ComponentProps<"div"> & { value: number; max?: number }) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)))
  return (
    <div
      data-slot="task-progress"
      className={cn("space-y-1", className)}
      {...props}
    >
      <div className="flex justify-between items-center text-[9.5px] font-mono text-zinc-500 dark:text-zinc-400">
        <span>Subtasks</span>
        <span>{percentage}%</span>
      </div>
      <div className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-full h-1 overflow-hidden border border-zinc-200/30 dark:border-zinc-800/30">
        <div
          className="bg-zinc-900 dark:bg-zinc-50 h-full rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

function TaskMeta({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="task-meta"
      className={cn("flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800/60", className)}
      {...props}
    />
  )
}

function TaskTag({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="task-tag"
      className={cn(
        "text-[8px] font-semibold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded px-1.5 py-0.2 text-zinc-500 dark:text-zinc-400",
        className
      )}
      {...props}
    />
  )
}

function TaskAssignee({
  initials,
  className,
  ...props
}: React.ComponentProps<"span"> & { initials: string }) {
  return (
    <span
      data-slot="task-assignee"
      className={cn(
        "size-4.5 shrink-0 rounded-full bg-zinc-100 dark:bg-zinc-900 text-[8px] font-bold font-mono flex items-center justify-center border border-zinc-200/60 dark:border-zinc-800/60 text-zinc-700 dark:text-zinc-300",
        className
      )}
      {...props}
    >
      {initials}
    </span>
  )
}

export {
  Task,
  TaskHeader,
  TaskTitle,
  TaskDescription,
  TaskProgress,
  TaskMeta,
  TaskTag,
  TaskAssignee
}
