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
  Circle,
  Cpu
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
  const [showVisuals, setShowVisuals] = useState(true);

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

  const convertTaskToNote = async (task: Task) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: `[Task Note] ${task.title}`,
          content: `Task Code: ${task.code}\nType: ${task.type}\nStatus: ${task.status}\nPriority: ${task.priority}\n\nDescription:\n${task.description || "N/A"}`,
          category: "work",
          favorite: false,
        }),
      });
      if (res.ok) {
        toast.success("Task converted to Note! View in Notes Dashboard.");
      } else {
        toast.error("Failed to convert task to Note.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error creating Note.");
    }
  };

  const convertTaskToEvent = async (task: Task) => {
    try {
      const token = localStorage.getItem("token");
      const now = new Date();
      const end = new Date(now.getTime() + 60 * 60 * 1000);
      const res = await fetch(`${API_BASE_URL}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: `[Task Execution] ${task.title}`,
          description: `Task Code: ${task.code}\nDescription: ${task.description}`,
          from: now.toISOString(),
          to: end.toISOString(),
          type: "pink",
        }),
      });
      if (res.ok) {
        toast.success("Task scheduled in Calendar! View in Calendar Dashboard.");
      } else {
        toast.error("Failed to schedule Calendar Event.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error scheduling Event.");
    }
  };

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
      <div className="flex h-full flex-col overflow-y-auto bg-background p-4 md:p-6 space-y-5">

        {/* ─── Brain Dashboard Style Top Visual Telemetry Banner ─── */}
        <div className="flex flex-col gap-3 p-4.5 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md shrink-0 shadow-[0_8px_25px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.5)] relative transition-all duration-300">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-foreground/5 border border-border flex items-center justify-center text-foreground shadow-xs shrink-0">
                <CheckSquare className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold tracking-tight text-foreground">
                    Task Automation &amp; Operations Center
                  </h1>
                  <Badge variant="outline" className="text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider bg-muted/60 border-border text-muted-foreground shadow-xs">
                    v2.0 Autopilot
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  Orchestrate team operations, track sprint velocity, and trigger AI agent task generation pipelines
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowVisuals(!showVisuals)}
                className="h-8.5 text-xs font-semibold border-border hover:bg-muted gap-1.5 px-3 rounded-xl transition-all shadow-xs"
              >
                <Cpu className="size-3.5" />
                <span>{showVisuals ? "Hide Analytics" : "Show Analytics"}</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setExportTaskId(undefined);
                  setExportTaskTitle("Task Board Export");
                  setIsExportOpen(true);
                }}
                className="h-8.5 text-xs font-semibold gap-1.5 border-border hover:bg-muted text-foreground rounded-xl shadow-xs"
              >
                <FileText className="h-3.5 w-3.5" />
                Export &amp; Integrations Hub
              </Button>

              <Button
                size="sm"
                onClick={() => setIsNewTaskOpen(true)}
                className="h-8.5 text-xs font-semibold bg-foreground hover:bg-foreground/90 text-background gap-1.5 px-3 rounded-xl shadow-md border border-foreground/10 cursor-pointer transition-all hover:scale-102"
              >
                <Plus className="size-3.5" />
                <span>Add Task</span>
              </Button>
            </div>
          </div>

          {/* Visual Analytics Telemetry Bar */}
          {showVisuals && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-border/40 select-none">
              {/* Metric 1: Backlog & Total Tasks */}
              <div className="p-2.5 rounded-xl bg-card border border-border/60 flex items-center justify-between shadow-xs hover:shadow-sm transition-all">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
                    <HelpCircle className="size-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Backlog &amp; Todo</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-bold text-foreground">{backlogCount + todoCount} tasks</span>
                      <span className="text-[10px] text-muted-foreground">({tasks.length} total)</span>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 bg-muted border-border text-muted-foreground">
                  Queued
                </Badge>
              </div>

              {/* Metric 2: In Progress Velocity */}
              <div className="p-2.5 rounded-xl bg-card border border-border/60 flex items-center justify-between shadow-xs hover:shadow-sm transition-all">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Timer className="size-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">In Progress</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-bold text-foreground">{inProgressCount} active</span>
                      <span className="text-[10px] text-emerald-500 font-mono">~95ms</span>
                    </div>
                  </div>
                </div>
                <span className="size-2 rounded-full bg-blue-500 animate-pulse" title="Active Engine" />
              </div>

              {/* Metric 3: Target Completion */}
              <div className="p-2.5 rounded-xl bg-card border border-border/60 flex items-center justify-between shadow-xs hover:shadow-sm transition-all">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Completed</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-bold text-foreground">{doneCount} done</span>
                      <span className="text-[10px] text-muted-foreground">({tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0}%)</span>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                  Sprint
                </Badge>
              </div>

              {/* Metric 4: Average Progress Rate */}
              <div className="p-2.5 rounded-xl bg-card border border-border/60 flex items-center justify-between shadow-xs hover:shadow-sm transition-all">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <TrendingUp className="size-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Avg Progress</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-bold text-foreground">{avgProgress}%</span>
                    </div>
                  </div>
                </div>
                <div className="w-12 bg-muted/60 h-1.5 rounded-full overflow-hidden border border-border/40">
                  <div className="bg-foreground h-full rounded-full" style={{ width: `${avgProgress}%` }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── MAIN WORKSPACE CONTENT GRID ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">

          {/* CONTAINER 1: LEFT COPILOT COLUMN (Width 3-4/12 or Collapsed) */}
          <div className={cls(
            "bg-card border border-border/80 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_25px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.1)] transition-all duration-300 relative overflow-hidden flex flex-col min-h-[450px]",
            isSidebarCollapsed ? "lg:col-span-1" : selectedTask ? "lg:col-span-3" : "lg:col-span-4"
          )}>
            {isSidebarCollapsed ? (
              /* COLLAPSED VIEW */
              <div className="flex flex-col items-center py-4 space-y-6 h-full select-none justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="size-7 hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl"
                  title="Expand Panel"
                >
                  <ChevronRight className="size-4" />
                </Button>
                <div className="flex flex-col items-center justify-center gap-2 flex-1">
                  <Sparkles className="size-4 text-foreground" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest [writing-mode:vertical-lr] rotate-180 select-none">
                    AI Task Copilot
                  </span>
                </div>
              </div>
            ) : (
              /* EXPANDED VIEW */
              <div className="flex-1 flex flex-col min-h-0 p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3 select-none">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-foreground animate-pulse" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">AI Task Copilot</h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSidebarCollapsed(true)}
                    className="size-7 hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl"
                    title="Collapse Panel"
                  >
                    <ChevronRight className="size-4 rotate-180" />
                  </Button>
                </div>

                <div className="flex-1 flex flex-col min-h-0 justify-between space-y-3.5">
                  <div className="space-y-3 flex-1 flex flex-col min-h-0">
                    <p className="text-[11px] text-muted-foreground leading-normal font-medium">
                      Provide instructions and the autopilot agent will construct full tasks with check-lists.
                    </p>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Prompt Instructions</label>
                      <Textarea
                        placeholder="E.g., Design dark mode contrast audit tasks..."
                        value={copilotPrompt}
                        onChange={(e) => setCopilotPrompt(e.target.value)}
                        disabled={isSimulatingAI}
                        className="text-xs min-h-[80px] resize-none bg-muted/20 border-border text-foreground rounded-xl focus:border-border"
                      />
                    </div>

                    {/* Presets */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Presets</span>
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
                            className="text-[10px] font-semibold border border-border/80 bg-muted/30 hover:bg-muted text-foreground px-2.5 py-1 rounded-xl transition-all cursor-pointer shadow-xs"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button
                      disabled={isSimulatingAI || !copilotPrompt.trim()}
                      onClick={handleGenerateTasks}
                      className="w-full text-xs h-9 bg-foreground hover:bg-foreground/90 text-background font-semibold rounded-xl shadow-xs border border-foreground/10 cursor-pointer"
                    >
                      {isSimulatingAI ? (
                        <>
                          <RefreshCw className="size-3.5 animate-spin mr-1.5 text-background" />
                          <span>Autopilot Running...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="size-3.5 mr-1.5 text-background" />
                          <span>Generate Roadmaps</span>
                        </>
                      )}
                    </Button>

                    {/* Terminal Simulation Log */}
                    {(simulationLogs.length > 0 || isSimulatingAI) && (
                      <div className="flex-1 flex flex-col min-h-[140px] rounded-xl border border-border bg-muted/30 overflow-hidden shadow-inner animate-in fade-in duration-200">
                        {/* macOS style title bar */}
                        <div className="flex items-center justify-between bg-card px-3 py-1.5 border-b border-border select-none shrink-0">
                          <div className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-red-500/85 hover:bg-red-500 transition-colors cursor-pointer" />
                            <span className="size-2 rounded-full bg-yellow-500/85 hover:bg-yellow-500 transition-colors cursor-pointer" />
                            <span className="size-2 rounded-full bg-green-500/85 hover:bg-green-500 transition-colors cursor-pointer" />
                          </div>
                          <span className="text-muted-foreground font-mono text-[8px] uppercase tracking-wider">autopilot-terminal</span>
                          <span className="size-3" />
                        </div>

                        <ScrollArea className="flex-1 min-h-0 p-3 font-mono text-[10px] text-foreground">
                          <div className="space-y-1.5 pr-2">
                            {simulationLogs.map((log, idx) => (
                              <div key={idx} className={cls(
                                log.startsWith("✔") ? "text-foreground font-semibold" : "text-muted-foreground"
                              )}>
                                {log}
                              </div>
                            ))}
                            {isSimulatingAI && (
                              <div className="text-muted-foreground animate-pulse flex items-center gap-1">
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

          {/* MAIN KANBAN OR LIST BOARD AREA (Width 5-8/12 or 11/12) */}
          <div className={cls(
            "space-y-5 flex flex-col min-w-0",
            isSidebarCollapsed
              ? selectedTask ? "lg:col-span-7" : "lg:col-span-11"
              : selectedTask ? "lg:col-span-5" : "lg:col-span-8"
          )}>

            {/* CONTAINER 2: Filter, Search & View Controls Ribbon */}
            <div className="bg-card border border-border/80 rounded-2xl p-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_25px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-wrap items-center justify-between gap-3 select-none">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-48">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Filter tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 text-xs h-8.5 bg-muted/20 border-border rounded-xl"
                  />
                </div>

                {/* Status Dropdown Filter */}
                <div className="relative">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        className="h-8.5 text-xs bg-transparent border border-dashed border-border px-3 flex items-center gap-1.5 text-foreground hover:bg-muted rounded-xl"
                      >
                        <PlusIcon className="size-3 text-muted-foreground mr-0.5" />
                        <span>Status</span>
                        {statusFilterList.length > 0 && (
                          <Badge variant="secondary" className="h-4.5 text-[8.5px] px-1.5 font-mono ml-1 text-foreground bg-muted border-none shrink-0">
                            {statusFilterList.length}
                          </Badge>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-44 bg-card border-border p-1.5 shadow-md z-50 rounded-xl">
                      <div className="text-[10px] font-bold text-muted-foreground px-2.5 py-1 uppercase tracking-wider">Filter Status</div>
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
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-muted cursor-pointer text-xs text-foreground font-semibold select-none transition-colors"
                          >
                            {/* Custom Checkbox */}
                            <div className={cls(
                              "size-3.5 rounded border flex items-center justify-center transition-all duration-150 shrink-0",
                              isChecked
                                ? "bg-foreground border-foreground text-background"
                                : "bg-transparent border-border"
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
                    <SelectTrigger className="h-8.5 text-xs bg-transparent border-dashed border-border px-3 flex items-center gap-1 text-foreground rounded-xl">
                      <PlusIcon className="size-3 text-muted-foreground mr-0.5" />
                      <span>Priority</span>
                      {priorityFilter !== "all" && (
                        <Badge variant="secondary" className="h-4.5 text-[8.5px] px-1.5 font-mono ml-1 text-foreground bg-muted border-none">
                          {priorityFilter}
                        </Badge>
                      )}
                    </SelectTrigger>
                    <SelectContent className="text-xs bg-card border-border rounded-xl">
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
                    className="h-8.5 px-2.5 text-xs text-muted-foreground hover:text-foreground font-semibold rounded-xl"
                  >
                    Reset
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Custom View columns visibility dropdown toggle */}
                <div className="relative">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        className="h-8.5 text-xs bg-transparent border border-border px-3 flex items-center gap-1.5 text-foreground hover:bg-muted shadow-xs rounded-xl"
                      >
                        <SlidersHorizontal className="size-3 text-muted-foreground" />
                        <span>View</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 bg-card border-border p-1.5 shadow-md z-50 rounded-xl">
                      <div className="text-[10px] font-bold text-muted-foreground px-2.5 py-1 uppercase tracking-wider">Toggle Columns</div>
                      <DropdownMenuSeparator className="my-1 bg-border/60" />
                      {[
                        { id: "title", label: "Title", badge: "text", color: "bg-muted text-muted-foreground" },
                        { id: "status", label: "Status", badge: "state", color: "bg-blue-500/10 text-blue-500" },
                        { id: "priority", label: "Priority", badge: "rank", color: "bg-amber-500/10 text-amber-500" },
                        { id: "progress", label: "Progress", badge: "%", color: "bg-emerald-500/10 text-emerald-500" }
                      ].map((col) => {
                        const isChecked = visibleColumns.includes(col.id);
                        return (
                          <div
                            key={col.id}
                            onClick={() => toggleColumn(col.id)}
                            className="flex items-center justify-between gap-3 px-2.5 py-1.5 rounded-lg hover:bg-muted cursor-pointer text-xs text-foreground font-semibold select-none transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              {/* Custom Checkbox */}
                              <div className={cls(
                                "size-3.5 rounded border flex items-center justify-center transition-all duration-150 shrink-0",
                                isChecked
                                  ? "bg-foreground border-foreground text-background"
                                  : "bg-transparent border-border"
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
                <div className="flex items-center gap-1 p-0.5 rounded-xl bg-muted border border-border h-8.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode("kanban")}
                    className={cls("h-7 w-7 rounded-lg", viewMode === "kanban" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground")}
                    title="Kanban Board View"
                  >
                    <LayoutGrid className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode("list")}
                    className={cls("h-7 w-7 rounded-lg", viewMode === "list" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground")}
                    title="Data Table View"
                  >
                    <ListIcon className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* CONTAINER 3: Primary Workspace Canvas Container */}
            <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_35px_rgba(0,0,0,0.5)] transition-all duration-300 flex-1 overflow-hidden min-h-[520px]">

                {viewMode === "list" ? (

                  /* ─── PREMIUM DATA TABLE VIEW ────────────────────────────── */
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="rounded-2xl border border-border/80 bg-card overflow-hidden flex-1 flex flex-col justify-between shadow-xs transition-all duration-300">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-border/80 bg-muted/40 text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider select-none backdrop-blur-md">
                              <th className="p-3.5 pl-4 w-9">
                                <input
                                  type="checkbox"
                                  checked={isAllPageSelected}
                                  onChange={handleToggleSelectAll}
                                  className="size-3.5 rounded border-border bg-muted cursor-pointer accent-zinc-900 dark:accent-zinc-50"
                                />
                              </th>
                              <th className="p-3.5 font-mono text-[10px] w-24">Task</th>

                              {visibleColumns.includes("title") && (
                                <th className="p-3.5 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleHeaderSort("title")}>
                                  <div className="flex items-center gap-1.5">
                                    <span>Title</span>
                                    <ArrowUpDown className="size-3 text-muted-foreground" />
                                  </div>
                                </th>
                              )}

                              {visibleColumns.includes("status") && (
                                <th className="p-3.5 cursor-pointer hover:text-foreground transition-colors w-36" onClick={() => handleHeaderSort("status")}>
                                  <div className="flex items-center gap-1.5">
                                    <span>Status</span>
                                    <ArrowUpDown className="size-3 text-muted-foreground" />
                                  </div>
                                </th>
                              )}

                              {visibleColumns.includes("priority") && (
                                <th className="p-3.5 cursor-pointer hover:text-foreground transition-colors w-28" onClick={() => handleHeaderSort("priority")}>
                                  <div className="flex items-center gap-1.5">
                                    <span>Priority</span>
                                    <ArrowUpDown className="size-3 text-muted-foreground" />
                                  </div>
                                </th>
                              )}

                              {visibleColumns.includes("progress") && (
                                <th className="p-3.5 cursor-pointer hover:text-foreground transition-colors w-32" onClick={() => handleHeaderSort("progress")}>
                                  <div className="flex items-center gap-1.5">
                                    <span>Progress</span>
                                    <ArrowUpDown className="size-3 text-muted-foreground" />
                                  </div>
                                </th>
                              )}

                              <th className="p-3.5 text-right pr-4 w-12"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60 text-xs">
                            {paginatedTasks.length === 0 ? (
                              <tr>
                                <td colSpan={visibleColumns.length + 3} className="p-8 text-center text-muted-foreground font-medium">
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
                                      "hover:bg-muted/40 transition-colors duration-150 cursor-pointer group",
                                      isRowSelected ? "bg-muted/30" : ""
                                    )}
                                    onClick={() => setSelectedTask(task)}
                                  >
                                    <td className="p-3.5 pl-4" onClick={(e) => e.stopPropagation()}>
                                      <input
                                        type="checkbox"
                                        checked={isRowSelected}
                                        onChange={(e) => handleToggleSelectRow(task.id, e as any)}
                                        className="size-3.5 rounded border-border bg-muted cursor-pointer accent-zinc-900 dark:accent-zinc-50"
                                      />
                                    </td>
                                    <td className="p-3.5 font-mono text-[10px] text-muted-foreground font-bold">
                                      {task.code}
                                    </td>

                                    {visibleColumns.includes("title") && (
                                      <td className="p-3.5 font-bold text-foreground max-w-md">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[9px] font-bold tracking-wide bg-muted border border-border/60 rounded-lg px-2 py-0.5 text-muted-foreground shrink-0 uppercase">
                                            {task.type}
                                          </span>
                                          <span className={cls(
                                            "truncate block font-semibold",
                                            task.status === "done" ? "line-through opacity-60 text-muted-foreground" : "text-foreground"
                                          )}>
                                            {task.title}
                                          </span>
                                        </div>
                                      </td>
                                    )}

                                    {visibleColumns.includes("status") && (
                                      <td className="p-3.5">
                                        <div className="flex items-center text-foreground font-semibold">
                                          {getStatusIcon(task.status)}
                                          <span className="capitalize ml-1.5">{task.status === "in-progress" ? "In Progress" : task.status}</span>
                                        </div>
                                      </td>
                                    )}

                                    {visibleColumns.includes("priority") && (
                                      <td className="p-3.5">
                                        <div className="flex items-center text-foreground font-semibold capitalize">
                                          {getPriorityIcon(task.priority)}
                                          <span className="ml-1.5">{task.priority}</span>
                                        </div>
                                      </td>
                                    )}

                                    {visibleColumns.includes("progress") && (
                                      <td className="p-3.5">
                                        <div className="flex items-center gap-2">
                                          <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden border border-border/40">
                                            <div
                                              className={cls(
                                                "h-full rounded-full transition-all duration-300",
                                                task.progress === 100
                                                  ? "bg-emerald-500"
                                                  : "bg-primary"
                                              )}
                                              style={{ width: `${task.progress}%` }}
                                            />
                                          </div>
                                          <span className="text-[10px] font-mono text-muted-foreground font-semibold">{task.progress}%</span>
                                        </div>
                                      </td>
                                    )}

                                    <td className="p-3.5 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleDeleteTask(task.id)}
                                          className="size-7 hover:bg-rose-500/10 hover:text-rose-500 text-muted-foreground rounded-lg"
                                        >
                                          <Trash2 className="size-3.5" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => setSelectedTask(task)}
                                          className="size-7 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg"
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
                        <div className="flex flex-col rounded-2xl bg-card border border-border/80 p-3.5 space-y-3 min-w-[210px] flex-1 shadow-sm">
                          <div className="flex items-center justify-between border-b border-border/60 pb-2">
                            <div className="flex items-center gap-1.5">
                              <HelpCircle className="size-3.5 text-orange-500" />
                              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Backlog</h3>
                            </div>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 border-border bg-muted/40 font-mono">
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
                        <div className="flex flex-col rounded-2xl bg-card border border-border/80 p-3.5 space-y-3 min-w-[210px] flex-1 shadow-sm">
                          <div className="flex items-center justify-between border-b border-border/60 pb-2">
                            <div className="flex items-center gap-1.5">
                              <Circle className="size-3.5 text-muted-foreground" />
                              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">To Do</h3>
                            </div>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 border-border bg-muted/40 font-mono">
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
                        <div className="flex flex-col rounded-2xl bg-card border border-border/80 p-3.5 space-y-3 min-w-[210px] flex-1 shadow-sm">
                          <div className="flex items-center justify-between border-b border-border/60 pb-2">
                            <div className="flex items-center gap-1.5">
                              <Timer className="size-3.5 text-blue-500 animate-pulse" />
                              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Active</h3>
                            </div>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 border-border bg-muted/40 font-mono">
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
                        <div className="flex flex-col rounded-2xl bg-card border border-border/80 p-3.5 space-y-3 min-w-[210px] flex-1 shadow-sm">
                          <div className="flex items-center justify-between border-b border-border/60 pb-2">
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className="size-3.5 text-emerald-500" />
                              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Done</h3>
                            </div>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 border-border bg-muted/40 font-mono">
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
                        <div className="flex flex-col rounded-2xl bg-card border border-border/80 p-3.5 space-y-3 min-w-[210px] flex-1 shadow-sm">
                          <div className="flex items-center justify-between border-b border-border/60 pb-2">
                            <div className="flex items-center gap-1.5">
                              <XCircle className="size-3.5 text-red-500" />
                              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Canceled</h3>
                            </div>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 border-border bg-muted/40 font-mono">
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

          {/* ─── TASK SPECIFICATION PANEL (Inline Page Panel, 4/12 col) ─────────── */}
          {selectedTask && (
            <div className="lg:col-span-4 bg-card/95 backdrop-blur-xl border border-border/80 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.6)] transition-all duration-300 flex flex-col min-h-[520px] overflow-hidden animate-in slide-in-from-right-4">

              {/* ── Panel Header ── */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 shrink-0 bg-gradient-to-b from-muted/50 via-card/80 to-card">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-9 rounded-2xl bg-foreground/5 border border-border/80 flex items-center justify-center shrink-0 shadow-xs">
                    <FileText className="size-4 text-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-mono font-bold text-muted-foreground">{selectedTask.code}</span>
                      <span className="text-[9px] font-extrabold bg-muted border border-border/60 rounded-md px-1.5 py-0.2 text-muted-foreground uppercase tracking-wide">
                        {selectedTask.type}
                      </span>
                    </div>
                    <h2 className="text-sm font-extrabold text-foreground tracking-tight truncate leading-snug">{selectedTask.title}</h2>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedTask(null)}
                  className="size-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-transparent hover:border-border/60 flex items-center justify-center shrink-0 transition-all cursor-pointer"
                  title="Close Panel"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* ── Scrollable Panel Body ── */}
              <ScrollArea className="flex-1 min-h-0">
                <div className="p-5 space-y-4">

                  {/* Container A: Meta Info Grid */}
                  <div className="rounded-2xl border border-border/70 bg-gradient-to-b from-muted/30 to-muted/10 p-4 space-y-3 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                    <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">
                      Task Metadata
                    </span>
                    
                    <div className="grid grid-cols-2 gap-3">

                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground font-semibold block">Current Status</span>
                        <Select
                          value={selectedTask.status}
                          onValueChange={(val) => handleMoveStatus(selectedTask.id, val as any)}
                        >
                          <SelectTrigger className="h-8.5 text-[11px] font-semibold bg-background/80 border-border/70 rounded-xl shadow-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="text-[11px] rounded-xl bg-card border-border">
                            <SelectItem value="backlog">Backlog</SelectItem>
                            <SelectItem value="todo">To Do</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="done">Completed</SelectItem>
                            <SelectItem value="canceled">Canceled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground font-semibold block">Priority Rank</span>
                        <div className="flex items-center h-8.5">
                          <Badge variant="outline" className={cls(
                            "text-[9.5px] font-bold border px-2.5 py-1 uppercase rounded-xl shadow-xs",
                            selectedTask.priority === "high" ? "bg-rose-500/10 text-rose-600 border-rose-500/30" :
                              selectedTask.priority === "medium" ? "bg-amber-500/10 text-amber-600 border-amber-500/30" :
                                "bg-muted text-muted-foreground border-border/60"
                          )}>
                            {selectedTask.priority} priority
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground font-semibold block">Responsible Node</span>
                        <div className="flex items-center gap-1.5 h-8.5 px-2 bg-background/60 border border-border/60 rounded-xl">
                          <span className="size-5 rounded-full bg-gradient-to-br from-primary to-primary/80 text-[8.5px] font-extrabold text-primary-foreground flex items-center justify-center shrink-0">
                            {selectedTask.assignee.avatarInitials}
                          </span>
                          <span className="text-[11px] text-foreground font-bold truncate">{selectedTask.assignee.name}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground font-semibold block">Deadline</span>
                        <div className="flex items-center gap-1.5 h-8.5 px-2.5 bg-background/60 border border-border/60 rounded-xl text-[11px] text-foreground font-mono font-bold">
                          <CalendarIcon className="size-3.5 text-muted-foreground shrink-0" />
                          <span>{selectedTask.dueDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Container B: Detailed Description */}
                  <div className="rounded-2xl border border-border/70 bg-gradient-to-b from-muted/30 to-muted/10 p-4 space-y-2 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                    <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">
                      Description & Context
                    </span>
                    <p className="text-xs text-muted-foreground leading-relaxed bg-background/80 border border-border/60 rounded-xl p-3.5 font-medium">
                      {selectedTask.description || "No detailed description provided."}
                    </p>
                  </div>

                  {/* Container C: Progress Tracker */}
                  <div className="rounded-2xl border border-border/70 bg-gradient-to-b from-muted/30 to-muted/10 p-4 space-y-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Overall Completion</span>
                      <span className="text-xs font-mono font-extrabold text-foreground">{selectedTask.progress}%</span>
                    </div>
                    <div className="w-full bg-muted/60 rounded-full h-2 overflow-hidden border border-border/40 p-0.5">
                      <div
                        className={cls(
                          "h-full rounded-full transition-all duration-500",
                          selectedTask.progress === 100 ? "bg-emerald-500" :
                            selectedTask.progress >= 50 ? "bg-gradient-to-r from-blue-500 to-indigo-500" : "bg-amber-500"
                        )}
                        style={{ width: `${selectedTask.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9.5px] text-muted-foreground font-mono font-semibold">
                      <span>0%</span>
                      <span>
                        {selectedTask.subtasks.filter(s => s.completed).length} of {selectedTask.subtasks.length} checklist items completed
                      </span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Container D: Interactive Checklist */}
                  <div className="rounded-2xl border border-border/70 bg-gradient-to-b from-muted/30 to-muted/10 p-4 space-y-3 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                    <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">
                      Subtask Checklist
                    </span>

                    <div className="space-y-2">
                      {selectedTask.subtasks.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground italic py-3 text-center">No checklist items configured.</p>
                      ) : (
                        selectedTask.subtasks.map((st) => (
                          <div
                            key={st.id}
                            onClick={() => handleToggleSubtask(selectedTask.id, st.id)}
                            className={cls(
                              "flex items-center gap-2.5 rounded-xl border p-2.5 text-xs cursor-pointer select-none transition-all duration-150",
                              st.completed
                                ? "bg-emerald-500/5 border-emerald-500/30 text-muted-foreground"
                                : "bg-background/80 border-border/70 hover:bg-card text-foreground shadow-xs"
                            )}
                          >
                            <div className={cls(
                              "size-4 rounded-md border flex items-center justify-center shrink-0 transition-all duration-150",
                              st.completed ? "bg-emerald-500 border-emerald-500 text-white" : "bg-transparent border-border"
                            )}>
                              {st.completed && (
                                <svg className="size-2.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="4">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>
                            <span className={cls("flex-1 leading-snug font-medium", st.completed && "line-through opacity-60")}>{st.title}</span>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Inline subtask generator */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                      <Input
                        placeholder="Add checklist item..."
                        value={inlineSubtaskText}
                        onChange={(e) => setInlineSubtaskText(e.target.value)}
                        className="text-xs h-8.5 bg-background/80 border-border/70 rounded-xl"
                        onKeyDown={(e) => { if (e.key === "Enter") handleAddInlineSubtask(); }}
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={handleAddInlineSubtask}
                        disabled={!inlineSubtaskText.trim()}
                        className="h-8.5 w-8.5 border-border/70 bg-transparent hover:bg-muted shrink-0 rounded-xl"
                      >
                        <PlusCircle className="size-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Container E: Category Tags */}
                  {selectedTask.tags.length > 0 && (
                    <div className="rounded-2xl border border-border/70 bg-gradient-to-b from-muted/30 to-muted/10 p-4 space-y-2 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                      <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">Associated Tags</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedTask.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[9.5px] px-2.5 py-0.5 rounded-xl bg-muted/50 border-border/70 font-mono font-bold text-muted-foreground">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Container F: Audit Log Timeline */}
                  <div className="rounded-2xl border border-border/70 bg-gradient-to-b from-muted/30 to-muted/10 p-4 space-y-3 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                    <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">Action Timeline</span>
                    <div className="space-y-3 pl-3.5 border-l-2 border-border/70 ml-1">
                      {selectedTask.history.map((h: TaskHistory, idx: number) => (
                        <div key={idx} className="relative flex flex-col space-y-0.5">
                          <span className="absolute -left-[19px] top-1.5 size-2.5 rounded-full bg-background border-2 border-primary" />
                          <span className="text-[9.5px] font-mono text-muted-foreground font-bold">{h.timestamp}</span>
                          <span className="text-[11px] text-foreground leading-snug font-medium">{h.action}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </ScrollArea>

              {/* ── Panel Footer Actions ── */}
              <div className="px-5 py-4 border-t border-border/70 bg-gradient-to-b from-card to-muted/40 shrink-0">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => convertTaskToNote(selectedTask)}
                          className="h-8.5 w-8.5 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl shadow-xs"
                        >
                          <FileText className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">Convert to Note</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => convertTaskToEvent(selectedTask)}
                          className="h-8.5 w-8.5 border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 rounded-xl shadow-xs"
                        >
                          <CalendarIcon className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">Schedule Event</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteTask(selectedTask.id)}
                          className="h-8.5 w-8.5 text-rose-500 hover:bg-rose-500/10 border-rose-500/30 bg-rose-500/10 rounded-xl shadow-xs"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">Delete Task</TooltipContent>
                    </Tooltip>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedTask(null)}
                    className="h-8.5 text-xs border-border/80 hover:bg-muted font-bold rounded-xl px-4"
                  >
                    Close
                  </Button>
                </div>

                {selectedTask.status !== "done" ? (
                  <Button
                    size="sm"
                    onClick={() => handleMoveStatus(selectedTask.id, "done")}
                    className="h-9 text-xs w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-xs gap-1.5"
                  >
                    <CheckCircle2 className="size-4" /> Mark Complete
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMoveStatus(selectedTask.id, "todo")}
                    className="h-9 text-xs w-full border-border hover:bg-muted font-bold rounded-xl gap-1.5"
                  >
                    <RefreshCw className="size-4" /> Reopen Task
                  </Button>
                )}
              </div>

            </div>
          )}

        </div>

        {/* ─── CREATION DIALOG OVERLAY (CONTAINER STYLING) ─────────── */}
        <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
          <DialogContent className="sm:max-w-[540px] bg-card/95 backdrop-blur-xl border border-border/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] p-0 gap-0 overflow-hidden rounded-3xl transition-all duration-300">

            {/* Container 1: Hero Header */}
            <div className="relative px-6 pt-6 pb-5 border-b border-border/60 bg-gradient-to-b from-muted/50 via-card/80 to-card overflow-hidden">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 size-40 bg-gradient-to-br from-violet-500/15 to-indigo-500/0 rounded-full blur-2xl pointer-events-none" />
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="size-11 rounded-2xl bg-gradient-to-b from-card to-muted border border-border/80 shadow-[0_4px_12px_rgba(0,0,0,0.12)] flex items-center justify-center shrink-0">
                    <PlusCircle className="size-5 text-foreground drop-shadow-xs" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-extrabold text-foreground tracking-tight flex items-center gap-2">
                      New Task Spec
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                      Configure manual milestone node & parameters
                    </DialogDescription>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsNewTaskOpen(false)}
                  className="size-8 rounded-xl bg-muted/40 hover:bg-muted border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:translate-y-0.5"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Form Body - Nested Cards & Inset Inputs */}
            <div className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto scrollbar-thin">

              {/* Container 2: Main Task Specification Card */}
              <div className="rounded-2xl border border-border/70 bg-gradient-to-b from-muted/30 to-muted/10 p-4 space-y-3.5 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="size-3 text-primary" /> Core Information
                </span>

                {/* Title Input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                    Task Title <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="E.g., Deploy staging integration tests..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="text-xs h-10 bg-background/80 border-border/80 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] focus:shadow-[inset_0_1px_2px_rgba(0,0,0,0.05),0_0_0_2px_rgba(120,80,255,0.2)] transition-all placeholder:text-muted-foreground/50 font-medium"
                  />
                </div>

                {/* Description Input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                    Description
                  </label>
                  <Textarea
                    placeholder="Describe scope, objectives, constraints..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="text-xs bg-background/80 border-border/80 min-h-[75px] resize-none rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] focus:shadow-[inset_0_1px_2px_rgba(0,0,0,0.05),0_0_0_2px_rgba(120,80,255,0.2)] transition-all placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>

              {/* Container 3: Type & Priority Controls */}
              <div className="rounded-2xl border border-border/70 bg-gradient-to-b from-muted/30 to-muted/10 p-4 space-y-4 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                
                {/* Task Type Buttons */}
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">
                    Task Classification
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { value: "Feature", icon: Sparkles, activeStyle: "from-violet-500/20 to-purple-500/10 border-violet-500/50 text-violet-600 dark:text-violet-300 shadow-[0_3px_10px_rgba(139,92,246,0.2)]" },
                      { value: "Bug", icon: AlertCircle, activeStyle: "from-rose-500/20 to-red-500/10 border-rose-500/50 text-rose-600 dark:text-rose-300 shadow-[0_3px_10px_rgba(244,63,94,0.2)]" },
                      { value: "Documentation", label: "Docs", icon: FileText, activeStyle: "from-blue-500/20 to-sky-500/10 border-blue-500/50 text-blue-600 dark:text-blue-300 shadow-[0_3px_10px_rgba(59,130,246,0.2)]" },
                    ] as const).map((item) => (
                      <button
                        key={item.value}
                        onClick={() => setNewType(item.value)}
                        className={cls(
                          "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl border text-[10.5px] font-bold transition-all duration-200 cursor-pointer select-none relative overflow-hidden",
                          newType === item.value
                            ? `bg-gradient-to-b ${item.activeStyle} -translate-y-0.5`
                            : "border-border/60 bg-card/60 text-muted-foreground hover:bg-card hover:text-foreground shadow-[0_2px_4px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 active:translate-y-0"
                        )}
                      >
                        <item.icon className="size-3.5 shrink-0" />
                        <span className="truncate">{item.label || item.value}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority Buttons */}
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">
                    Priority Weight
                  </span>
                  <div className="grid grid-cols-3 gap-2.5">
                    {([
                      { value: "low", label: "Low", icon: ArrowDown, activeStyle: "from-zinc-500/20 to-zinc-600/10 border-zinc-400/50 text-zinc-700 dark:text-zinc-300 shadow-[0_3px_10px_rgba(150,150,150,0.2)]" },
                      { value: "medium", label: "Medium", icon: ArrowRightIcon, activeStyle: "from-amber-500/20 to-orange-500/10 border-amber-500/50 text-amber-600 dark:text-amber-300 shadow-[0_3px_10px_rgba(245,158,11,0.25)]" },
                      { value: "high", label: "High", icon: ArrowUp, activeStyle: "from-rose-500/25 to-red-600/15 border-rose-500/60 text-rose-600 dark:text-rose-300 shadow-[0_3px_10px_rgba(244,63,94,0.3)] font-extrabold" },
                    ] as const).map(({ value, label, icon: Icon, activeStyle }) => (
                      <button
                        key={value}
                        onClick={() => setNewPriority(value)}
                        className={cls(
                          "flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-[11px] font-bold transition-all duration-200 cursor-pointer select-none",
                          newPriority === value
                            ? `bg-gradient-to-b ${activeStyle} -translate-y-0.5`
                            : "border-border/60 bg-card/60 text-muted-foreground hover:bg-card hover:text-foreground shadow-[0_2px_6px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 active:translate-y-0"
                        )}
                      >
                        <Icon className="size-3.5" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Container 4: Subtasks & Tags */}
              <div className="rounded-2xl border border-border/70 bg-gradient-to-b from-muted/30 to-muted/10 p-4 space-y-3 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                      Category Tags
                    </label>
                    <Input
                      placeholder="Frontend, API..."
                      value={newTagsStr}
                      onChange={(e) => setNewTagsStr(e.target.value)}
                      className="text-xs h-9 bg-background/80 border-border/80 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] placeholder:text-muted-foreground/50"
                    />
                    <p className="text-[9px] text-muted-foreground font-mono">Comma separated</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                      Initial Checklist
                    </label>
                    <Input
                      placeholder="Subtask 1, Subtask 2..."
                      value={newSubtasksStr}
                      onChange={(e) => setNewSubtasksStr(e.target.value)}
                      className="text-xs h-9 bg-background/80 border-border/80 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] placeholder:text-muted-foreground/50"
                    />
                    <p className="text-[9px] text-muted-foreground font-mono">Comma separated</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Container 5: Action Footer */}
            <div className="px-6 py-4 border-t border-border/70 bg-gradient-to-b from-card to-muted/40 flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsNewTaskOpen(false)}
                className="h-10 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-xl px-4 transition-all active:translate-y-0.5"
              >
                Cancel
              </Button>
              
              <Button
                disabled={!newTitle.trim()}
                onClick={handleCreateTask}
                className="h-10 text-xs font-extrabold rounded-xl px-6 bg-gradient-to-b from-foreground via-foreground to-foreground/90 text-background hover:from-foreground/90 hover:to-foreground shadow-[0_6px_20px_rgba(0,0,0,0.25)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:hover:translate-y-0 transition-all gap-2"
              >
                <PlusCircle className="size-4" />
                Assemble Task Node
              </Button>
            </div>

          </DialogContent>
        </Dialog>

        {/* Task Specification Dialog removed — now rendered as inline page panel above */}
        {false && (
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

                <DialogFooter className="p-4 border-t border-border bg-muted/10 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => convertTaskToNote(selectedTask)}
                      className="h-8 text-xs border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/15 font-semibold gap-1"
                      title="Save task details as a Note"
                    >
                      <FileText className="size-3.5" /> Convert to Note
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => convertTaskToEvent(selectedTask)}
                      className="h-8 text-xs border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/5 hover:bg-purple-500/15 font-semibold gap-1"
                      title="Schedule task execution event in Calendar"
                    >
                      <CalendarIcon className="size-3.5" /> Schedule Event
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTask(selectedTask.id)}
                      className="h-8 gap-1.5 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 bg-transparent text-zinc-600 dark:text-zinc-400"
                    >
                      <Trash2 className="size-3.5" />
                      <span>Delete</span>
                    </Button>
                  </div>

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
        )}

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
        "bg-card border border-border/80 hover:border-foreground/40 rounded-xl p-3.5 shadow-xs hover:shadow-md transition-all cursor-pointer group space-y-2.5 relative overflow-hidden",
        isDone ? "opacity-75 hover:opacity-100" : ""
      )}
    >
      <ShadcnTaskUI.TaskHeader>
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex gap-1.5 flex-wrap items-center">
            {task.tags.map((tag) => (
              <ShadcnTaskUI.TaskTag key={tag} className="text-[9px] px-1.5 py-0.5 rounded-md bg-muted border border-border/60 text-muted-foreground font-mono">
                {tag}
              </ShadcnTaskUI.TaskTag>
            ))}

            {visibleColumns.includes("priority") && (
              <span className={cls(
                "text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border font-mono",
                task.priority === "high" ? "bg-red-500/10 text-red-500 border-red-500/20 font-extrabold" :
                  task.priority === "medium" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                    "bg-muted/40 text-muted-foreground border-border/40"
              )}>
                {task.priority}
              </span>
            )}
          </div>
          <ShadcnTaskUI.TaskTitle className={cls(isDone && "line-through text-muted-foreground")}>
            <span className="font-mono text-[9px] text-muted-foreground mr-1.5">{task.code}</span>
            {task.title}
          </ShadcnTaskUI.TaskTitle>
        </div>

        <ShadcnTaskUI.TaskAssignee initials={task.assignee.avatarInitials} />
      </ShadcnTaskUI.TaskHeader>

      <ShadcnTaskUI.TaskDescription className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
        {task.description}
      </ShadcnTaskUI.TaskDescription>

      {visibleColumns.includes("progress") && task.subtasks.length > 0 && (
        <ShadcnTaskUI.TaskProgress value={task.progress} />
      )}

      <ShadcnTaskUI.TaskMeta onClick={e => e.stopPropagation()}>
        <div className="text-[9.5px] text-muted-foreground font-mono flex items-center gap-1">
          <CalendarIcon className="size-2.5" />
          <span>{task.dueDate}</span>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {task.status !== "done" ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMove(task.id, "done")}
              className="h-6 px-2 text-[10px] font-semibold bg-transparent hover:bg-muted text-foreground border border-border rounded-lg"
            >
              <span>Done</span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMove(task.id, "todo")}
              className="h-6 px-2 text-[10px] font-semibold bg-transparent hover:bg-muted text-muted-foreground border border-border rounded-lg"
            >
              <RefreshCw className="size-2.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(task.id)}
            className="h-6 w-6 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500"
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      </ShadcnTaskUI.TaskMeta>
    </ShadcnTaskUI.Task>
  );
}
