"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  CheckSquare,
  Plus,
  Trash2,
  Sparkles,
  Search,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  ListTodo,
  AlertCircle,
  TrendingUp,
  LayoutGrid,
  List as ListIcon,
  Calendar as CalendarIcon,
  User,
  ArrowRight,
  RefreshCw,
  X,
  PlusCircle,
  FileText,
  HelpCircle,
  XCircle,
  Timer,
  ArrowDown,
  ArrowRight as ArrowRightIcon,
  ArrowUp,
  ChevronsLeft,
  ChevronLeft,
  ChevronsRight,
  ArrowUpDown,
  MoreHorizontal,
  PlusCircle as PlusIcon,
  SlidersHorizontal,
  Circle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cls } from "./utils";
import * as ShadcnTaskUI from "@/components/ui/task";
import { API_BASE_URL } from "@/lib/api";
import { toast } from "sonner";
import { ExportModal } from "./ExportModal";


// ─── Interfaces ───────────────────────────────────────────────────────────────
interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface TaskHistory {
  timestamp: string;
  action: string;
}

interface Task {
  id: string;
  code: string; // e.g. TASK-8782
  type: "Documentation" | "Bug" | "Feature";
  title: string;
  description: string;
  status: "backlog" | "todo" | "in-progress" | "done" | "canceled";
  priority: "low" | "medium" | "high";
  tags: string[];
  dueDate: string;
  assignee: {
    name: string;
    avatarInitials: string;
  };
  progress: number; // 0 - 100
  subtasks: SubTask[];
  history: TaskHistory[];
}

export function TaskDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/tasks`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (e) {
      console.error("Failed to fetch tasks", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const syncTaskWithBackend = async (updatedTask: Task) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${updatedTask.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updatedTask)
      });
      if (!res.ok) throw new Error("Failed to sync task with backend");
    } catch (err) {
      console.error("Failed to sync task with backend:", err);
    }
  };

  const [viewMode, setViewMode] = useState<"kanban" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilterList, setStatusFilterList] = useState<string[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Row Selection State
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // Sorting State
  const [sortBy, setSortBy] = useState<"code" | "title" | "status" | "priority" | "dueDate" | "progress">("code");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Selection & Details Sidebar
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Column Visibility Selection Toggles
  const [visibleColumns, setVisibleColumns] = useState<string[]>(["title", "status", "priority", "progress"]);
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);

  // New Manual Task Modal Form States
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState<"Documentation" | "Bug" | "Feature">("Feature");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high">("medium");
  const [newTagsStr, setNewTagsStr] = useState("");
  const [newSubtasksStr, setNewSubtasksStr] = useState("");

  // Export & Integration Hub State
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportTaskId, setExportTaskId] = useState<string | undefined>(undefined);
  const [exportTaskTitle, setExportTaskTitle] = useState<string | undefined>(undefined);

  // AI Copilot State
  const [copilotPrompt, setCopilotPrompt] = useState("");

  const [isSimulatingAI, setIsSimulatingAI] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, priorityFilter, statusFilterList, pageSize]);

  // Auto-scroll simulation logs
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [simulationLogs]);

  // Recalculate progress for a task based on subtasks
  const updateTaskProgress = (task: Task, updatedSubtasks: SubTask[]): Task => {
    if (updatedSubtasks.length === 0) {
      return { ...task, subtasks: updatedSubtasks, progress: task.status === "done" ? 100 : 0 };
    }
    const completedCount = updatedSubtasks.filter((s) => s.completed).length;
    const progress = Math.round((completedCount / updatedSubtasks.length) * 100);
    const status = progress === 100 ? "done" : task.status === "done" ? "in-progress" : task.status;
    return { ...task, subtasks: updatedSubtasks, progress, status };
  };

  // Toggle single subtask checkbox
  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    let targetTask: Task | null = null;
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const subtasks = t.subtasks.map((s) =>
          s.id === subtaskId ? { ...s, completed: !s.completed } : s
        );
        const updatedTask = updateTaskProgress(t, subtasks);
        updatedTask.history = [
          {
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            action: `Toggled subtask: "${t.subtasks.find((s) => s.id === subtaskId)?.title}"`
          },
          ...updatedTask.history
        ];
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask(updatedTask);
        }
        targetTask = updatedTask;
        return updatedTask;
      }
      return t;
    });
    setTasks(updated);
    if (targetTask) {
      syncTaskWithBackend(targetTask);
    }
  };

  // Move task status
  const handleMoveStatus = (taskId: string, nextStatus: any) => {
    let targetTask: Task | null = null;
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const updatedTask = {
          ...t,
          status: nextStatus,
          progress: nextStatus === "done" ? 100 : nextStatus === "todo" && t.progress === 100 ? 0 : t.progress,
          subtasks: nextStatus === "done" ? t.subtasks.map(s => ({ ...s, completed: true })) : t.subtasks,
          history: [
            { timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), action: `Moved task to ${nextStatus.toUpperCase()}` },
            ...t.history
          ]
        };
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask(updatedTask);
        }
        targetTask = updatedTask;
        return updatedTask;
      }
      return t;
    });
    setTasks(updated);
    if (targetTask) {
      syncTaskWithBackend(targetTask);
    }
  };

  // Delete a task
  const handleDeleteTask = async (taskId: string) => {
    const token = localStorage.getItem("token");
    const toastId = toast.loading("Deleting task...");
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to delete task");
      setTasks(tasks.filter((t) => t.id !== taskId));
      setSelectedTaskIds(prev => prev.filter(id => id !== taskId));
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(null);
      }
      toast.success("Task deleted successfully", { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete task", { id: toastId });
    }
  };

  // Handle manual task creation
  const handleCreateTask = async () => {
    if (!newTitle.trim()) return;

    const tags = newTagsStr
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const subtasks: SubTask[] = newSubtasksStr
      .split(",")
      .map((st, index) => ({
        id: `sub-new-${Date.now()}-${index}`,
        title: st.trim(),
        completed: false
      }))
      .filter((st) => st.title.length > 0);

    const codeNum = 5000 + Math.floor(Math.random() * 4999);
    const newTaskData = {
      code: `TASK-${codeNum}`,
      type: newType,
      title: newTitle.trim(),
      description: newDesc.trim() || "No description provided.",
      status: "todo",
      priority: newPriority,
      tags: tags.length > 0 ? tags : ["General"],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      assignee: { name: "You", avatarInitials: "Y" },
      progress: 0,
      subtasks,
      history: [{ timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), action: "Task created manually" }]
    };

    const token = localStorage.getItem("token");
    const toastId = toast.loading("Creating task...");
    try {
      const res = await fetch(`${API_BASE_URL}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newTaskData)
      });
      if (!res.ok) throw new Error("Failed to create task");
      const createdTask = await res.json();
      setTasks([createdTask, ...tasks]);
      setIsNewTaskOpen(false);
      toast.success("Task created successfully", { id: toastId });

      // Reset Form
      setNewTitle("");
      setNewDesc("");
      setNewType("Feature");
      setNewPriority("medium");
      setNewTagsStr("");
      setNewSubtasksStr("");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create task", { id: toastId });
    }
  };

  // Add a new subtask dynamically inside details view
  const [inlineSubtaskText, setInlineSubtaskText] = useState("");
  const handleAddInlineSubtask = () => {
    if (!inlineSubtaskText.trim() || !selectedTask) return;

    const newSub: SubTask = {
      id: `sub-inline-${Date.now()}`,
      title: inlineSubtaskText.trim(),
      completed: false
    };

    const updatedSubtasks = [...selectedTask.subtasks, newSub];
    const updatedTask = updateTaskProgress(selectedTask, updatedSubtasks);
    updatedTask.history = [
      { timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), action: `Added subtask: "${newSub.title}"` },
      ...updatedTask.history
    ];

    setTasks(tasks.map(t => t.id === selectedTask.id ? updatedTask : t));
    setSelectedTask(updatedTask);
    setInlineSubtaskText("");
    syncTaskWithBackend(updatedTask);
  };

  // AI Task Copilot simulator
  const handleGenerateTasks = () => {
    if (!copilotPrompt.trim()) return;

    setIsSimulatingAI(true);
    setSimulationLogs([]);

    const steps = [
      "Analyzing project requirements & developer prompt...",
      "Matching visual context patterns from active dashboards...",
      "Resolving task priority & dependency charts...",
      "Formulating task titles, description details, and checklists...",
      "Structuring data layout schema in local index database...",
      "Injecting generated items into the live Kanban flow..."
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setSimulationLogs((prev) => [...prev, `[System AI] ${steps[currentStep]}`]);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          const prompt = copilotPrompt.toLowerCase();
          let generated: Task[] = [];

          const codeNum1 = 5000 + Math.floor(Math.random() * 4999);
          const codeNum2 = 5000 + Math.floor(Math.random() * 4999);

          if (prompt.includes("database") || prompt.includes("sql") || prompt.includes("postgres")) {
            generated = [
              {
                id: `task-ai-${Date.now()}-1`,
                code: `TASK-${codeNum1}`,
                type: "Feature",
                title: "Setup PostgreSQL Backup Scripts",
                description: "Write cron jobs to perform daily logical backups and upload gzip files to secure S3 storage.",
                status: "todo",
                priority: "high",
                tags: ["AI-Copilot", "Database"],
                dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                assignee: { name: "AI Autopilot", avatarInitials: "AI" },
                progress: 0,
                subtasks: [
                  { id: "sub-ai-1", title: "Write backup shell script using pg_dump", completed: false },
                  { id: "sub-ai-2", title: "Integrate AWS S3 upload cli commands", completed: false },
                  { id: "sub-ai-3", title: "Schedule crontab configuration tests", completed: false }
                ],
                history: [{ timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), action: "Task generated by AI Copilot Agent" }]
              },
              {
                id: `task-ai-${Date.now()}-2`,
                code: `TASK-${codeNum2}`,
                type: "Bug",
                title: "Refactor Database Schema Indexing",
                description: "Add compound index indexes on frequently filtered foreign keys (conversations, messages) to boost search dashboard performance.",
                status: "todo",
                priority: "medium",
                tags: ["AI-Copilot", "Performance"],
                dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                assignee: { name: "AI Autopilot", avatarInitials: "AI" },
                progress: 0,
                subtasks: [
                  { id: "sub-ai-4", title: "Identify slow queries via pg_stat_statements", completed: false },
                  { id: "sub-ai-5", title: "Create migration query statement scripts", completed: false }
                ],
                history: [{ timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), action: "Task generated by AI Copilot Agent" }]
              }
            ];
          } else if (prompt.includes("ui") || prompt.includes("css") || prompt.includes("design") || prompt.includes("style")) {
            generated = [
              {
                id: `task-ai-${Date.now()}-1`,
                code: `TASK-${codeNum1}`,
                type: "Documentation",
                title: "Verify Dark Mode Contrast Ratios",
                description: "Audit zinc-950 and glassmorphic translucent panels against standard WCAG AA contrast guidelines.",
                status: "todo",
                priority: "medium",
                tags: ["AI-Copilot", "UI/UX"],
                dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                assignee: { name: "AI Autopilot", avatarInitials: "AI" },
                progress: 0,
                subtasks: [
                  { id: "sub-ai-6", title: "Verify sidebar text contrast", completed: false },
                  { id: "sub-ai-7", title: "Fix transparent button hover borders", completed: false }
                ],
                history: [{ timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), action: "Task generated by AI Copilot Agent" }]
              },
              {
                id: `task-ai-${Date.now()}-2`,
                code: `TASK-${codeNum2}`,
                type: "Feature",
                title: "Animate Kanban Card Transitions",
                description: "Add framer-motion layout Animations for drag states, status toggles, and height expands inside TaskDashboard.",
                status: "todo",
                priority: "low",
                tags: ["AI-Copilot", "Frontend"],
                dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                assignee: { name: "AI Autopilot", avatarInitials: "AI" },
                progress: 0,
                subtasks: [
                  { id: "sub-ai-8", title: "Add LayoutId configuration transitions", completed: false },
                  { id: "sub-ai-9", title: "Tune transition duration metrics", completed: false }
                ],
                history: [{ timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), action: "Task generated by AI Copilot Agent" }]
              }
            ];
          } else {
            generated = [
              {
                id: `task-ai-${Date.now()}-1`,
                code: `TASK-${codeNum1}`,
                type: "Feature",
                title: `Automate Plan: ${copilotPrompt.substring(0, 30)}...`,
                description: `Automatically created task roadmap targeting: "${copilotPrompt}".`,
                status: "todo",
                priority: "medium",
                tags: ["AI-Copilot", "Auto-Created"],
                dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                assignee: { name: "AI Autopilot", avatarInitials: "AI" },
                progress: 0,
                subtasks: [
                  { id: "sub-ai-10", title: "Draft implementation architecture overview", completed: false },
                  { id: "sub-ai-11", title: "Implement code changes & test suite scripts", completed: false }
                ],
                history: [{ timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), action: "Task generated by AI Copilot Agent" }]
              }
            ];
          }

          // Persist generated tasks to backend
          const token = localStorage.getItem("token");
          Promise.all(generated.map(async (task) => {
            try {
              const res = await fetch(`${API_BASE_URL}/tasks`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(task)
              });
              if (res.ok) {
                return await res.json();
              }
            } catch (e) {
              console.error("Failed to persist generated task", e);
            }
            return task;
          })).then((persistedTasks) => {
            setTasks((prev) => [...persistedTasks, ...prev]);
            setSimulationLogs((prev) => [...prev, "✔ Success! Dynamic tasks registered successfully."]);
            setIsSimulatingAI(false);
            setCopilotPrompt("");
          });
        }, 800);
      }
    }, 450);
  };

  // Filter Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPriority = priorityFilter === "all" ? true : t.priority === priorityFilter;
      const matchesStatus = statusFilterList.length === 0 ? true : statusFilterList.includes(t.status);

      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [tasks, searchQuery, priorityFilter, statusFilterList]);

  // Sort Tasks
  const sortedTasks = useMemo(() => {
    const list = [...filteredTasks];
    list.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "title" || sortBy === "code" || sortBy === "dueDate") {
        comparison = a[sortBy].localeCompare(b[sortBy]);
      } else if (sortBy === "status") {
        const ranks = { backlog: 0, todo: 1, "in-progress": 2, done: 3, canceled: 4 };
        comparison = (ranks[a.status] ?? 0) - (ranks[b.status] ?? 0);
      } else if (sortBy === "priority") {
        const ranks = { low: 0, medium: 1, high: 2 };
        comparison = (ranks[a.priority] ?? 0) - (ranks[b.priority] ?? 0);
      } else if (sortBy === "progress") {
        comparison = a.progress - b.progress;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
    return list;
  }, [filteredTasks, sortBy, sortOrder]);

  // Paginated Tasks
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedTasks.slice(start, start + pageSize);
  }, [sortedTasks, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedTasks.length / pageSize) || 1;

  // Toggle Selection functions
  const isAllPageSelected = paginatedTasks.length > 0 && paginatedTasks.every(t => selectedTaskIds.includes(t.id));

  const handleToggleSelectAll = () => {
    if (isAllPageSelected) {
      setSelectedTaskIds(prev => prev.filter(id => !paginatedTasks.some(pt => pt.id === id)));
    } else {
      setSelectedTaskIds(prev => {
        const additions = paginatedTasks.filter(pt => !prev.includes(pt.id)).map(pt => pt.id);
        return [...prev, ...additions];
      });
    }
  };

  const handleToggleSelectRow = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTaskIds(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  // Clear all selections
  const handleClearSelection = () => {
    setSelectedTaskIds([]);
  };

  // Header column sorting handler
  const handleHeaderSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const toggleColumn = (columnId: string) => {
    setVisibleColumns((prev) =>
      prev.includes(columnId) ? prev.filter((c) => c !== columnId) : [...prev, columnId]
    );
  };

  // Stats Counters
  const backlogCount = tasks.filter((t) => t.status === "backlog").length;
  const todoCount = tasks.filter((t) => t.status === "todo").length;
  const inProgressCount = tasks.filter((t) => t.status === "in-progress").length;
  const doneCount = tasks.filter((t) => t.status === "done").length;
  const avgProgress = tasks.length > 0 ? Math.round(tasks.reduce((a, b) => a + b.progress, 0) / tasks.length) : 0;

  // Icon Maps
  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "backlog":
        return <HelpCircle className="size-3.5 mr-2 text-orange-600 dark:text-orange-400 shrink-0" />;
      case "todo":
        return <Circle className="size-3.5 mr-2 text-yellow-900 dark:text-yellow-100 shrink-0" />;
      case "in-progress":
        return <Timer className="size-3.5 mr-2 text-blue-600 dark:text-blue-400 shrink-0" />;
      case "done":
        return <CheckCircle2 className="size-3.5 mr-2 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case "canceled":
        return <XCircle className="size-3.5 mr-2 text-red-600 dark:text-red-400 shrink-0" />;
    }
  };

  const getPriorityIcon = (priority: Task["priority"]) => {
    switch (priority) {
      case "low":
        return <ArrowDown className="size-3 mr-1.5 text-zinc-400 shrink-0" />;
      case "medium":
        return <ArrowRightIcon className="size-3 mr-1.5 text-zinc-500 shrink-0" />;
      case "high":
        return <ArrowUp className="size-3 mr-1.5 text-zinc-800 dark:text-zinc-200 shrink-0" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full bg-background">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="size-6 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-semibold">Loading task pipelines...</span>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col overflow-hidden bg-background">

        {/* ── TOP HEADER BAR ────────────────────────────────────────────── */}
        <div className="shrink-0 border-b border-border bg-card">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg border border-border bg-muted shadow-xs">
                <CheckSquare className="size-4 text-foreground" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-foreground leading-none flex items-center gap-1.5">
                  Task Automation Dashboard
                  <Badge variant="outline" className="text-[9px] font-mono py-0 px-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 text-zinc-600 dark:text-zinc-400">
                    v1.6 Neutral UI
                  </Badge>
                </h1>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Orchestrate team operations, track progress, and trigger AI agent task generation pipelines
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setExportTaskId(undefined);
                  setExportTaskTitle("Task Board Export");
                  setIsExportOpen(true);
                }}
                className="h-8 text-xs font-semibold gap-1.5 border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10"
              >
                <FileText className="h-3.5 w-3.5" />
                Export &amp; Integrations Hub
              </Button>
            </div>
          </div>


          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-0 border-t border-border divide-x divide-border bg-muted/20">
            {[
              { icon: HelpCircle, label: "Backlog Tasks", value: backlogCount, note: "Unstarted pipeline" },
              { icon: Clock, label: "In Progress", value: inProgressCount, note: "Actively running" },
              { icon: CheckCircle2, label: "Completed", value: doneCount, note: "Sprint targets" },
              { icon: TrendingUp, label: "Avg. Progress", value: `${avgProgress}%`, note: "Overall rate" },
            ].map(({ icon: Icon, label, value, note }) => (
              <div key={label} className="flex items-center gap-3 px-6 py-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted border border-border shadow-xs">
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
                  <div className="flex items-baseline gap-1">
                    <p className="text-sm font-bold text-foreground leading-tight">{value}</p>
                    <span className="text-[8px] text-muted-foreground/70 font-mono">( {note} )</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── MAIN WORKSPACE CONTENT ──────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* LEFT COPILOT COLUMN (Collapsible) */}
          <div className={cls(
            "shrink-0 flex flex-col border-r border-border bg-card transition-all duration-350 ease-in-out relative overflow-hidden",
            isSidebarCollapsed ? "w-12" : "w-[280px]"
          )}>
            {isSidebarCollapsed ? (
              /* COLLAPSED VIEW */
              <div className="flex flex-col items-center py-4 space-y-6 h-full select-none">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="size-7 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 text-muted-foreground hover:text-foreground rounded-md"
                  title="Expand Panel"
                >
                  <ChevronRight className="size-4" />
                </Button>
                <div className="flex flex-col items-center justify-center gap-2 flex-1">
                  <Sparkles className="size-4 text-zinc-500" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest [writing-mode:vertical-lr] rotate-180 select-none">
                    AI Task Copilot
                  </span>
                </div>
              </div>
            ) : (
              /* EXPANDED VIEW */
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between p-4 border-b border-border select-none">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-zinc-800 dark:text-zinc-200 animate-pulse" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">AI Task Copilot</h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSidebarCollapsed(true)}
                    className="size-7 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 text-muted-foreground hover:text-foreground rounded-md"
                    title="Collapse Panel"
                  >
                    <ChevronRight className="size-4 rotate-180" />
                  </Button>
                </div>

                <div className="flex-1 flex flex-col min-h-0 p-4 justify-between space-y-4">
                  <div className="space-y-4 flex-1 flex flex-col min-h-0">
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      Provide instructions and the autopilot agent will construct full tasks with check-lists.
                    </p>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Prompt Instructions</label>
                      <Textarea
                        placeholder="E.g., Design dark mode contrast audit tasks..."
                        value={copilotPrompt}
                        onChange={(e) => setCopilotPrompt(e.target.value)}
                        disabled={isSimulatingAI}
                        className="text-xs min-h-[85px] resize-none bg-muted/40 border-border"
                      />
                    </div>

                    {/* Presets */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Presets</span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: "Database Plan", prompt: "Write postgres compound index roadmap and backup scripts creation" },
                          { label: "Design Contrast", prompt: "Design dark mode contrast audit tasks for zinc-950 layouts" },
                          { label: "QA Test Plans", prompt: "Create staging integration test roadmap and Websocket checks" }
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            onClick={() => setCopilotPrompt(preset.prompt)}
                            disabled={isSimulatingAI}
                            className="text-[10px] font-semibold border border-border/80 bg-zinc-100/60 dark:bg-zinc-900/60 hover:bg-zinc-200/80 dark:hover:bg-zinc-800/80 text-foreground px-2 py-0.5 rounded transition-colors"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button
                      disabled={isSimulatingAI || !copilotPrompt.trim()}
                      onClick={handleGenerateTasks}
                      className="w-full text-xs h-9 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900/50 text-foreground border border-border/80 font-semibold"
                    >
                      {isSimulatingAI ? (
                        <>
                          <RefreshCw className="size-3.5 animate-spin mr-1.5" />
                          <span>Autopilot Running...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="size-3.5 mr-1.5" />
                          <span>Generate Roadmaps</span>
                        </>
                      )}
                    </Button>

                    {/* Terminal Simulation Log */}
                    {(simulationLogs.length > 0 || isSimulatingAI) && (
                      <div className="flex-1 flex flex-col min-h-[160px] rounded-lg border border-border bg-zinc-950 overflow-hidden shadow-inner animate-in fade-in duration-200">
                        {/* macOS style title bar */}
                        <div className="flex items-center justify-between bg-zinc-900 px-3 py-1.5 border-b border-zinc-850 select-none shrink-0">
                          <div className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-red-500/85 hover:bg-red-500 transition-colors cursor-pointer" />
                            <span className="size-2 rounded-full bg-yellow-500/85 hover:bg-yellow-500 transition-colors cursor-pointer" />
                            <span className="size-2 rounded-full bg-green-500/85 hover:bg-green-500 transition-colors cursor-pointer" />
                          </div>
                          <span className="text-zinc-500 font-mono text-[8px] uppercase tracking-wider">autopilot-terminal</span>
                          <span className="size-3" />
                        </div>

                        <ScrollArea className="flex-1 min-h-0 p-3 font-mono text-[10px] text-zinc-300">
                          <div className="space-y-1.5 pr-2">
                            {simulationLogs.map((log, idx) => (
                              <div key={idx} className={cls(
                                log.startsWith("✔") ? "text-zinc-100 font-semibold" : "text-zinc-400"
                              )}>
                                {log}
                              </div>
                            ))}
                            {isSimulatingAI && (
                              <div className="text-zinc-500 animate-pulse flex items-center gap-1">
                                <span>System loading next step...</span>
                                <span className="inline-block animate-bounce font-bold">.</span>
                                <span className="inline-block animate-bounce font-bold [animation-delay:0.2s]">.</span>
                                <span className="inline-block animate-bounce font-bold [animation-delay:0.4s]">.</span>
                              </div>
                            )}
                            <div ref={logEndRef} />
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* MAIN KANBAN OR LIST BOARD AREA */}
          <div className="flex-1 flex min-w-0 flex-col overflow-hidden bg-background/50">

            {/* Unified Top Header & Filter Control Bar */}
            <div className="p-6 pb-2 shrink-0 flex flex-col border-b border-border/10 bg-card/20 backdrop-blur-xs select-none">
              <div className="flex flex-col mb-4">
                <h2 className="text-xl font-bold tracking-tight text-foreground">Welcome back!</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Here's a list of your tasks for this month.</p>
              </div>

              {/* Shared Table/Board Control Row */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-48">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Filter tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 text-xs h-8 bg-muted/40 border-border"
                    />
                  </div>

                  {/* Status Dropdown Filter */}
                  <div className="relative">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          className="h-8 text-xs bg-transparent border border-dashed border-border px-2.5 flex items-center gap-1 text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-900/50 rounded-md"
                        >
                          <PlusIcon className="size-3 text-muted-foreground mr-0.5" />
                          <span>Status</span>
                          {statusFilterList.length > 0 && (
                            <Badge variant="secondary" className="h-4.5 text-[8.5px] px-1.5 font-mono ml-1 text-foreground bg-zinc-100 dark:bg-zinc-800 border-none shrink-0">
                              {statusFilterList.length}
                            </Badge>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-44 bg-card border-border p-1.5 shadow-md z-50">
                        <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 px-2.5 py-1 uppercase tracking-wider">Filter Status</div>
                        <DropdownMenuSeparator className="my-1 bg-border/60" />
                        {[
                          { id: "backlog", label: "Backlog" },
                          { id: "todo", label: "Todo" },
                          { id: "in-progress", label: "In Progress" },
                          { id: "done", label: "Completed" },
                          { id: "canceled", label: "Canceled" }
                        ].map((item) => {
                          const isChecked = statusFilterList.includes(item.id);
                          const toggleStatus = () => {
                            setStatusFilterList(prev =>
                              prev.includes(item.id) ? prev.filter(s => s !== item.id) : [...prev, item.id]
                            );
                          };
                          return (
                            <div
                              key={item.id}
                              onClick={toggleStatus}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-muted/65 cursor-pointer text-xs text-foreground font-semibold select-none transition-colors"
                            >
                              {/* Custom Checkbox */}
                              <div className={cls(
                                "size-3.5 rounded border flex items-center justify-center transition-all duration-150 shrink-0",
                                isChecked
                                  ? "bg-zinc-950 dark:bg-zinc-50 border-zinc-950 dark:border-zinc-50 text-zinc-50 dark:text-zinc-950"
                                  : "bg-transparent border-zinc-300 dark:border-zinc-700"
                              )}>
                                {isChecked && (
                                  <svg className="size-2.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="4">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                              <span>{item.label}</span>
                            </div>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Priority Dropdown Filter */}
                  <div className="relative">
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger className="h-8 text-xs bg-transparent border-dashed border-border px-2.5 flex items-center gap-1 text-foreground">
                        <PlusIcon className="size-3 text-muted-foreground mr-0.5" />
                        <span>Priority</span>
                        {priorityFilter !== "all" && (
                          <Badge variant="secondary" className="h-4.5 text-[8.5px] px-1.5 font-mono ml-1 text-foreground bg-zinc-150 dark:bg-zinc-800 border-none">
                            {priorityFilter}
                          </Badge>
                        )}
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(statusFilterList.length > 0 || priorityFilter !== "all" || searchQuery !== "") && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setStatusFilterList([]);
                        setPriorityFilter("all");
                        setSearchQuery("");
                      }}
                      className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground font-semibold"
                    >
                      Reset
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Custom interactive View columns visibility dropdown toggle */}
                  <div className="relative">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          className="h-8 text-xs bg-transparent border border-border px-2.5 flex items-center gap-1.5 text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-900/50 shadow-xs rounded-md"
                        >
                          <SlidersHorizontal className="size-3 text-muted-foreground" />
                          <span>View</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 bg-card border-border p-1.5 shadow-md z-50">
                        <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 px-2.5 py-1 uppercase tracking-wider">Toggle Columns</div>
                        <DropdownMenuSeparator className="my-1 bg-border/60" />
                        {[
                          { id: "title", label: "Title", badge: "text", color: "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400" },
                          { id: "status", label: "Status", badge: "state", color: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400" },
                          { id: "priority", label: "Priority", badge: "rank", color: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
                          { id: "progress", label: "Progress", badge: "%", color: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" }
                        ].map((col) => {
                          const isChecked = visibleColumns.includes(col.id);
                          return (
                            <div
                              key={col.id}
                              onClick={() => toggleColumn(col.id)}
                              className="flex items-center justify-between gap-3 px-2.5 py-1.5 rounded-md hover:bg-muted/65 cursor-pointer text-xs text-foreground font-semibold select-none transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                {/* Custom Checkbox */}
                                <div className={cls(
                                  "size-3.5 rounded border flex items-center justify-center transition-all duration-150 shrink-0",
                                  isChecked
                                    ? "bg-zinc-950 dark:bg-zinc-50 border-zinc-950 dark:border-zinc-50 text-zinc-50 dark:text-zinc-950"
                                    : "bg-transparent border-zinc-300 dark:border-zinc-700"
                                )}>
                                  {isChecked && (
                                    <svg className="size-2.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="4">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  )}
                                </div>
                                <span>{col.label}</span>
                              </div>
                              <span className={cls("text-[8.5px] font-bold px-1.5 py-0.2 rounded font-mono uppercase tracking-wide", col.color)}>
                                {col.badge}
                              </span>
                            </div>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Layout View Toggles */}
                  <div className="flex items-center gap-1.5 p-0.5 rounded-lg bg-muted border border-border h-8">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewMode("kanban")}
                      className={cls("h-7 w-7 rounded-md", viewMode === "kanban" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground")}
                      title="Kanban Board View"
                    >
                      <LayoutGrid className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewMode("list")}
                      className={cls("h-7 w-7 rounded-md", viewMode === "list" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground")}
                      title="Data Table View"
                    >
                      <ListIcon className="size-3.5" />
                    </Button>
                  </div>

                  <Button
                    onClick={() => setIsNewTaskOpen(true)}
                    className="h-8 text-xs bg-zinc-950 hover:bg-zinc-900 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-950 border border-border/80 px-3 rounded-md font-semibold"
                  >
                    Add Task
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <div className="p-6 pt-4 flex-1 flex flex-col min-h-0 overflow-hidden">

                {viewMode === "list" ? (

                  /* ─── PREMIUM DATA TABLE VIEW ────────────────────────────── */
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="rounded-xl border border-border bg-card overflow-hidden flex-1 flex flex-col justify-between shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-border bg-muted/20 text-[11px] font-bold text-muted-foreground uppercase select-none">
                              <th className="p-3 pl-4 w-9">
                                <input
                                  type="checkbox"
                                  checked={isAllPageSelected}
                                  onChange={handleToggleSelectAll}
                                  className="size-3.5 rounded border-border bg-muted cursor-pointer accent-zinc-900 dark:accent-zinc-50"
                                />
                              </th>
                              <th className="p-3 font-mono text-[10px] w-24">Task</th>

                              {visibleColumns.includes("title") && (
                                <th className="p-3 cursor-pointer hover:text-foreground" onClick={() => handleHeaderSort("title")}>
                                  <div className="flex items-center gap-1.5">
                                    <span>Title</span>
                                    <ArrowUpDown className="size-3 text-muted-foreground" />
                                  </div>
                                </th>
                              )}

                              {visibleColumns.includes("status") && (
                                <th className="p-3 cursor-pointer hover:text-foreground w-36" onClick={() => handleHeaderSort("status")}>
                                  <div className="flex items-center gap-1.5">
                                    <span>Status</span>
                                    <ArrowUpDown className="size-3 text-muted-foreground" />
                                  </div>
                                </th>
                              )}

                              {visibleColumns.includes("priority") && (
                                <th className="p-3 cursor-pointer hover:text-foreground w-28" onClick={() => handleHeaderSort("priority")}>
                                  <div className="flex items-center gap-1.5">
                                    <span>Priority</span>
                                    <ArrowUpDown className="size-3 text-muted-foreground" />
                                  </div>
                                </th>
                              )}

                              {visibleColumns.includes("progress") && (
                                <th className="p-3 cursor-pointer hover:text-foreground w-32" onClick={() => handleHeaderSort("progress")}>
                                  <div className="flex items-center gap-1.5">
                                    <span>Progress</span>
                                    <ArrowUpDown className="size-3 text-muted-foreground" />
                                  </div>
                                </th>
                              )}

                              <th className="p-3 text-right pr-4 w-12"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border text-xs">
                            {paginatedTasks.length === 0 ? (
                              <tr>
                                <td colSpan={visibleColumns.length + 3} className="p-8 text-center text-muted-foreground">
                                  No tasks match the filter criteria.
                                </td>
                              </tr>
                            ) : (
                              paginatedTasks.map((task) => {
                                const isRowSelected = selectedTaskIds.includes(task.id);
                                return (
                                  <tr
                                    key={task.id}
                                    className={cls(
                                      "hover:bg-muted/15 transition-colors cursor-pointer group",
                                      isRowSelected ? "bg-muted/10" : ""
                                    )}
                                    onClick={() => setSelectedTask(task)}
                                  >
                                    <td className="p-3 pl-4" onClick={(e) => e.stopPropagation()}>
                                      <input
                                        type="checkbox"
                                        checked={isRowSelected}
                                        onChange={(e) => handleToggleSelectRow(task.id, e as any)}
                                        className="size-3.5 rounded border-border bg-muted cursor-pointer accent-zinc-900 dark:accent-zinc-50"
                                      />
                                    </td>
                                    <td className="p-3 font-mono text-[10px] text-zinc-500 font-medium">
                                      {task.code}
                                    </td>

                                    {visibleColumns.includes("title") && (
                                      <td className="p-3 font-semibold text-foreground max-w-md">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[9px] font-semibold tracking-wide bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md px-2 py-0.5 text-zinc-600 dark:text-zinc-400 shrink-0">
                                            {task.type}
                                          </span>
                                          <span className={cls(
                                            "truncate block font-medium",
                                            task.status === "done" ? "line-through text-zinc-400 dark:text-zinc-500" : "text-foreground"
                                          )}>
                                            {task.title}
                                          </span>
                                        </div>
                                      </td>
                                    )}

                                    {visibleColumns.includes("status") && (
                                      <td className="p-3">
                                        <div className="flex items-center text-zinc-700 dark:text-zinc-300 font-medium">
                                          {getStatusIcon(task.status)}
                                          <span className="capitalize">{task.status === "in-progress" ? "In Progress" : task.status}</span>
                                        </div>
                                      </td>
                                    )}

                                    {visibleColumns.includes("priority") && (
                                      <td className="p-3">
                                        <div className="flex items-center text-zinc-700 dark:text-zinc-300 font-medium capitalize">
                                          {getPriorityIcon(task.priority)}
                                          <span>{task.priority}</span>
                                        </div>
                                      </td>
                                    )}

                                    {visibleColumns.includes("progress") && (
                                      <td className="p-3">
                                        <div className="flex items-center gap-2">
                                          <div className="w-16 bg-zinc-100 dark:bg-zinc-900/60 rounded-full h-1.5 overflow-hidden border border-zinc-200/40 dark:border-zinc-800/40">
                                            <div
                                              className={cls(
                                                "h-full rounded-full transition-all duration-300",
                                                task.progress === 100
                                                  ? "bg-zinc-950 dark:bg-zinc-50"
                                                  : "bg-zinc-600 dark:bg-zinc-400"
                                              )}
                                              style={{ width: `${task.progress}%` }}
                                            />
                                          </div>
                                          <span className="text-[10px] font-mono text-zinc-500 font-semibold">{task.progress}%</span>
                                        </div>
                                      </td>
                                    )}

                                    <td className="p-3 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleDeleteTask(task.id)}
                                          className="size-7 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 rounded-md"
                                        >
                                          <Trash2 className="size-3.5" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => setSelectedTask(task)}
                                          className="size-7 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 rounded-md"
                                        >
                                          <MoreHorizontal className="size-3.5" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Premium Pagination Footer */}
                      <div className="p-4 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground select-none bg-muted/10">
                        <div>
                          {selectedTaskIds.length} of {sortedTasks.length} row(s) selected.
                          {selectedTaskIds.length > 0 && (
                            <Button
                              variant="ghost"
                              onClick={handleClearSelection}
                              className="h-6.5 text-[10px] font-semibold text-zinc-500 hover:text-foreground px-1.5 ml-2"
                            >
                              Clear
                            </Button>
                          )}
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <span>Rows per page</span>
                            <Select value={String(pageSize)} onValueChange={(val) => setPageSize(Number(val))}>
                              <SelectTrigger className="h-7 text-[11px] bg-background border border-border w-16">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="text-[11px]">
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="font-mono text-[11px]">
                            Page {currentPage} of {totalPages}
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage(1)}
                              className="size-7 border border-border rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900/50"
                            >
                              <ChevronsLeft className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                              className="size-7 border border-border rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900/50"
                            >
                              <ChevronLeft className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={currentPage === totalPages}
                              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                              className="size-7 border border-border rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900/50"
                            >
                              <ChevronRight className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={currentPage === totalPages}
                              onClick={() => setCurrentPage(totalPages)}
                              className="size-7 border border-border rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900/50"
                            >
                              <ChevronsRight className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                ) : (

                  /* ─── KANBAN VIEW ────────────────────────────────────────── */
                  <div className="flex-1 flex flex-col min-h-0">
                    <ScrollArea className="w-full h-full pb-2">
                      <div className="flex gap-4 items-start pb-4 min-w-[1100px] h-full pr-4">

                        {/* Backlog Column */}
                        <div className="flex flex-col rounded-xl bg-muted/20 border border-border/40 p-3 space-y-3 min-w-[200px]">
                          <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-1.5">
                              <HelpCircle className="size-3.5 text-zinc-500" />
                              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Backlog</h3>
                            </div>
                            <Badge variant="outline" className="text-[10px] px-1.5 border-border bg-background/40">
                              {filteredTasks.filter(t => t.status === "backlog").length}
                            </Badge>
                          </div>
                          <div className="space-y-3">
                            {filteredTasks.filter(t => t.status === "backlog").map(task => (
                              <TaskCard
                                key={task.id}
                                task={task}
                                visibleColumns={visibleColumns}
                                onSelect={() => setSelectedTask(task)}
                                onMove={handleMoveStatus}
                                onDelete={handleDeleteTask}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Todo Column */}
                        <div className="flex flex-col rounded-xl bg-muted/20 border border-border/40 p-3 space-y-3 min-w-[200px]">
                          <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-1.5">
                              <Circle className="size-3.5 text-zinc-400" />
                              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">To Do</h3>
                            </div>
                            <Badge variant="outline" className="text-[10px] px-1.5 border-border bg-background/40">
                              {filteredTasks.filter(t => t.status === "todo").length}
                            </Badge>
                          </div>
                          <div className="space-y-3">
                            {filteredTasks.filter(t => t.status === "todo").map(task => (
                              <TaskCard
                                key={task.id}
                                task={task}
                                visibleColumns={visibleColumns}
                                onSelect={() => setSelectedTask(task)}
                                onMove={handleMoveStatus}
                                onDelete={handleDeleteTask}
                              />
                            ))}
                          </div>
                        </div>

                        {/* In Progress Column */}
                        <div className="flex flex-col rounded-xl bg-muted/20 border border-border/40 p-3 space-y-3 min-w-[200px]">
                          <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-1.5">
                              <Timer className="size-3.5 text-zinc-800 dark:text-zinc-200 animate-pulse" />
                              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Active</h3>
                            </div>
                            <Badge variant="outline" className="text-[10px] px-1.5 border-border bg-background/40">
                              {filteredTasks.filter(t => t.status === "in-progress").length}
                            </Badge>
                          </div>
                          <div className="space-y-3">
                            {filteredTasks.filter(t => t.status === "in-progress").map(task => (
                              <TaskCard
                                key={task.id}
                                task={task}
                                visibleColumns={visibleColumns}
                                onSelect={() => setSelectedTask(task)}
                                onMove={handleMoveStatus}
                                onDelete={handleDeleteTask}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Completed Column */}
                        <div className="flex flex-col rounded-xl bg-muted/20 border border-border/40 p-3 space-y-3 min-w-[200px]">
                          <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className="size-3.5 text-zinc-950 dark:text-zinc-50" />
                              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Done</h3>
                            </div>
                            <Badge variant="outline" className="text-[10px] px-1.5 border-border bg-background/40">
                              {filteredTasks.filter(t => t.status === "done").length}
                            </Badge>
                          </div>
                          <div className="space-y-3">
                            {filteredTasks.filter(t => t.status === "done").map(task => (
                              <TaskCard
                                key={task.id}
                                task={task}
                                visibleColumns={visibleColumns}
                                onSelect={() => setSelectedTask(task)}
                                onMove={handleMoveStatus}
                                onDelete={handleDeleteTask}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Canceled Column */}
                        <div className="flex flex-col rounded-xl bg-muted/20 border border-border/40 p-3 space-y-3 min-w-[200px]">
                          <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-1.5">
                              <XCircle className="size-3.5 text-zinc-400" />
                              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Canceled</h3>
                            </div>
                            <Badge variant="outline" className="text-[10px] px-1.5 border-border bg-background/40">
                              {filteredTasks.filter(t => t.status === "canceled").length}
                            </Badge>
                          </div>
                          <div className="space-y-3">
                            {filteredTasks.filter(t => t.status === "canceled").map(task => (
                              <TaskCard
                                key={task.id}
                                task={task}
                                visibleColumns={visibleColumns}
                                onSelect={() => setSelectedTask(task)}
                                onMove={handleMoveStatus}
                                onDelete={handleDeleteTask}
                              />
                            ))}
                          </div>
                        </div>

                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </div>
                )}
              </div>
            </div>
          </div>



        </div>

        {/* ─── CREATION DIALOG OVERLAY ─────────────────────────────────────── */}
        <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
          <DialogContent className="sm:max-w-[480px] bg-card border-border/60 shadow-xl backdrop-blur-md">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-foreground">Create Manual Task Node</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Set up specific milestones, checklist items, and tags for manually managed operations.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Task Title</label>
                <Input
                  placeholder="E.g., Write staging integration tests..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="text-xs bg-muted/40 border-border"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Detailed Description</label>
                <Textarea
                  placeholder="Explain goals, constraints, and links to documentation..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="text-xs bg-muted/40 border-border min-h-[70px] resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Task Type</label>
                  <Select
                    value={newType}
                    onValueChange={(val) => setNewType(val as any)}
                  >
                    <SelectTrigger className="h-9 text-xs bg-muted/40 border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Feature">Feature</SelectItem>
                      <SelectItem value="Bug">Bug</SelectItem>
                      <SelectItem value="Documentation">Documentation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="font-semibold text-foreground">Priority Rating</label>
                  <Select
                    value={newPriority}
                    onValueChange={(val) => setNewPriority(val as any)}
                  >
                    <SelectTrigger className="h-9 text-xs bg-muted/40 border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Category Tags</label>
                  <Input
                    placeholder="E.g., Frontend, UI (comma-separated)"
                    value={newTagsStr}
                    onChange={(e) => setNewTagsStr(e.target.value)}
                    className="text-xs bg-muted/40 border-border"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Checklist Items</label>
                  <Input
                    placeholder="Task item A, Task item B (comma-separated)"
                    value={newSubtasksStr}
                    onChange={(e) => setNewSubtasksStr(e.target.value)}
                    className="text-xs bg-muted/40 border-border"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsNewTaskOpen(false)}
                className="h-9 text-xs border-border bg-transparent hover:bg-muted text-foreground"
              >
                Cancel
              </Button>
              <Button
                disabled={!newTitle.trim()}
                onClick={handleCreateTask}
                className="h-9 text-xs bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900/50 text-foreground border border-border"
              >
                Assemble Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ─── CENTER DETAILS DIALOG MODAL (ZOOM IN/OUT WINDOW) ─────────── */}
        <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
          <DialogContent className="max-w-2xl bg-card border-border p-0 shadow-lg gap-0 flex flex-col max-h-[85vh] overflow-hidden">
            <DialogHeader className="p-4 border-b border-border flex flex-row items-center justify-between space-y-0">
              <DialogTitle className="text-xs font-bold text-muted-foreground font-mono uppercase tracking-wide">
                Task Specification
              </DialogTitle>
            </DialogHeader>

            {selectedTask && (
              <>
                <ScrollArea className="flex-1 overflow-y-auto">
                  <div className="p-6 space-y-5 text-xs">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-mono text-zinc-500 font-semibold">{selectedTask.code}</span>
                        <span className="text-[9px] font-semibold bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-850 rounded px-1.5 py-0.2 text-zinc-500 dark:text-zinc-400">
                          {selectedTask.type}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-foreground">{selectedTask.title}</h3>
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed bg-muted/20 border border-border/30 rounded-lg p-3">
                        {selectedTask.description}
                      </p>
                    </div>

                    {/* Task Meta details */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 bg-muted/10 border border-border/40 rounded-lg p-3.5">
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground font-medium block">Current Status</span>
                        <Select
                          value={selectedTask.status}
                          onValueChange={(val) => handleMoveStatus(selectedTask.id, val as any)}
                        >
                          <SelectTrigger className="h-7 text-[11px] bg-background/50 border-border/60">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="text-[11px]">
                            <SelectItem value="backlog">Backlog</SelectItem>
                            <SelectItem value="todo">To Do</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="done">Completed</SelectItem>
                            <SelectItem value="canceled">Canceled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground font-medium block">Priority Rank</span>
                        <div className="flex items-center h-7">
                          <Badge variant="outline" className={cls(
                            "text-[9px] font-bold border px-2 py-0.5 uppercase border-zinc-200 dark:border-zinc-800 rounded",
                            selectedTask.priority === "high" ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-extrabold" :
                              selectedTask.priority === "medium" ? "bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400" :
                                "bg-transparent text-zinc-400"
                          )}>
                            {selectedTask.priority} Priority
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground font-medium block">Responsible Node</span>
                        <div className="flex items-center gap-1.5 h-7">
                          <span className="size-4.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-[8px] font-bold font-mono flex items-center justify-center border border-border text-foreground">
                            {selectedTask.assignee.avatarInitials}
                          </span>
                          <span className="text-[11px] text-foreground font-medium">{selectedTask.assignee.name}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground font-medium block">Deadline Date</span>
                        <div className="flex items-center gap-1 h-7 text-[11px] text-muted-foreground font-mono">
                          <CalendarIcon className="size-3 text-muted-foreground" />
                          <span>{selectedTask.dueDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Subtask checklist progress bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-semibold text-foreground">
                        <span>Subtask Checklists</span>
                        <span className="font-mono text-muted-foreground">{selectedTask.progress}% Complete</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden border border-border/30">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-300"
                          style={{ width: `${selectedTask.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Checklist Subtasks */}
                    <div className="space-y-2.5">
                      <ScrollArea className="max-h-[180px] pr-1">
                        <div className="grid grid-cols-1 gap-1.5">
                          {selectedTask.subtasks.map((st) => (
                            <div
                              key={st.id}
                              onClick={() => handleToggleSubtask(selectedTask.id, st.id)}
                              className={cls(
                                "flex items-center gap-2.5 rounded-lg border p-2 text-xs cursor-pointer select-none transition-all",
                                st.completed
                                  ? "bg-muted/30 border-border/40 text-muted-foreground line-through"
                                  : "bg-background border-border hover:bg-muted/20 text-foreground"
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={st.completed}
                                readOnly
                                className="size-3.5 rounded border-border bg-muted accent-primary cursor-pointer"
                              />
                              <span className="flex-1 leading-snug">{st.title}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>

                      {/* Inline new subtask generator */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <Input
                          placeholder="Add subtask element..."
                          value={inlineSubtaskText}
                          onChange={(e) => setInlineSubtaskText(e.target.value)}
                          className="text-xs h-8 bg-muted/40 border-border"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddInlineSubtask();
                          }}
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={handleAddInlineSubtask}
                          disabled={!inlineSubtaskText.trim()}
                          className="h-8 w-8 border-border bg-transparent hover:bg-muted shrink-0 text-foreground"
                        >
                          <PlusCircle className="size-4" />
                        </Button>
                      </div>
                    </div>

                    <Separator className="bg-border/60" />

                    {/* Audit History Logs */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Action Timeline</h4>
                      <ScrollArea className="max-h-[120px]">
                        <div className="space-y-2.5 pl-1.5 border-l border-border/80 ml-2 text-[11px]">
                          {selectedTask.history.map((h: TaskHistory, idx: number) => (
                            <div key={idx} className="relative flex flex-col space-y-0.5">
                              <span className="absolute -left-[14px] top-1 size-2 rounded-full bg-border border border-card" />
                              <span className="text-[10px] font-mono text-muted-foreground">{h.timestamp}</span>
                              <span className="text-foreground leading-tight">{h.action}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </ScrollArea>

                <DialogFooter className="p-4 border-t border-border bg-muted/10 flex flex-row items-center justify-between sm:justify-between space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTask(selectedTask.id)}
                    className="h-8 gap-1.5 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 bg-transparent text-zinc-600 dark:text-zinc-400"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Delete Task</span>
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTask(null)}
                      className="h-8 border-border bg-transparent hover:bg-muted text-foreground"
                    >
                      Close
                    </Button>
                    {selectedTask.status !== "done" ? (
                      <Button
                        size="sm"
                        onClick={() => handleMoveStatus(selectedTask.id, "done")}
                        className="h-8 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900/50 text-foreground border border-border"
                      >
                        Mark Complete
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleMoveStatus(selectedTask.id, "todo")}
                        className="h-8 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900/50 text-foreground border border-border"
                      >
                        Reopen Task
                      </Button>
                    )}
                  </div>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Export & Integration Hub Modal */}
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          type="task"
          taskId={exportTaskId}
          query={exportTaskTitle || "Task Board Export"}
        />

      </div>
    </TooltipProvider>
  );
}


// ─── HELPER CARDS (INTERNAL COMPONENTS) ───────────────────────────────────────
function TaskCard({
  task,
  visibleColumns,
  onSelect,
  onMove,
  onDelete
}: {
  task: Task;
  visibleColumns: string[];
  onSelect: () => void;
  onMove: (id: string, status: any) => void;
  onDelete: (id: string) => void;
}) {
  const isDone = task.status === "done";

  return (
    <ShadcnTaskUI.Task
      onClick={onSelect}
      className={cls(
        "border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700",
        isDone ? "opacity-75 hover:opacity-100" : ""
      )}
    >
      <ShadcnTaskUI.TaskHeader>
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex gap-1.5 flex-wrap items-center">
            {task.tags.map((tag) => (
              <ShadcnTaskUI.TaskTag key={tag}>
                {tag}
              </ShadcnTaskUI.TaskTag>
            ))}

            {visibleColumns.includes("priority") && (
              <span className={cls(
                "text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border border-zinc-200/50 dark:border-zinc-800/50 text-[10px]",
                task.priority === "high" ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-extrabold" :
                  task.priority === "medium" ? "bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400" :
                    "bg-transparent text-zinc-400"
              )}>
                {task.priority}
              </span>
            )}
          </div>
          <ShadcnTaskUI.TaskTitle className={cls(isDone && "line-through text-zinc-400 dark:text-zinc-500")}>
            <span className="font-mono text-[9px] text-zinc-500 mr-1.5">{task.code}</span>
            {task.title}
          </ShadcnTaskUI.TaskTitle>
        </div>

        <ShadcnTaskUI.TaskAssignee initials={task.assignee.avatarInitials} />
      </ShadcnTaskUI.TaskHeader>

      <ShadcnTaskUI.TaskDescription>
        {task.description}
      </ShadcnTaskUI.TaskDescription>

      {visibleColumns.includes("progress") && task.subtasks.length > 0 && (
        <ShadcnTaskUI.TaskProgress value={task.progress} />
      )}

      <ShadcnTaskUI.TaskMeta onClick={e => e.stopPropagation()}>
        <div className="text-[9.5px] text-zinc-500 dark:text-zinc-400 font-mono flex items-center gap-1">
          <CalendarIcon className="size-2.5" />
          <span>{task.dueDate}</span>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {task.status !== "done" ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMove(task.id, "done")}
              className="h-6 px-2 text-[10px] font-semibold bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900/50 text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-800 rounded-md"
            >
              <span>Done</span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMove(task.id, "todo")}
              className="h-6 px-2 text-[10px] font-semibold bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900/50 text-zinc-500 border border-zinc-200/50 dark:border-zinc-800/50 rounded-md"
            >
              <RefreshCw className="size-2.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(task.id)}
            className="h-6 w-6 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900/50 text-zinc-500"
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      </ShadcnTaskUI.TaskMeta>
    </ShadcnTaskUI.Task>
  );
}
