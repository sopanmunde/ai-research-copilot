"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Plus,
  LayoutGrid,
  List,
  Star,
  Trash2,
  Calendar,
  Sparkles,
  RefreshCw,
  Tag,
  Folder,
  ChevronRight,
  BookOpen,
  Edit3,
  X,
  Check,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/api";
import { toast } from "sonner";

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  favorite: boolean;
  updatedAt: string;
}

export function NotesDashboard() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [showVisuals, setShowVisuals] = useState(true);

  // Selection & Editing
  const [selectedNoteId, setSelectedNoteId] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("work");

  // Creation
  const [isNewNoteOpen, setIsNewNoteOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("work");

  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/notes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
        if (data.length > 0 && !selectedNoteId) {
          setSelectedNoteId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch notes", err);
      toast.error("Failed to sync notes library");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleCreateNote = async () => {
    if (!newTitle.trim()) {
      toast.error("Please provide a note title");
      return;
    }
    const payload = {
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
      favorite: false,
    };
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const created = await res.json();
        setNotes([created, ...notes]);
        setSelectedNoteId(created.id);
        setIsNewNoteOpen(false);
        setNewTitle("");
        setNewContent("");
        setNewCategory("work");
        toast.success("Note created successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save new note");
    }
  };

  const handleUpdateNote = async (id: string, updates: Partial<Note>) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/notes/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        setNotes(notes.map((n) => (n.id === id ? updated : n)));
        setIsEditing(false);
        toast.success("Note updated successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update note");
    }
  };

  const convertNoteToTask = async (note: Note) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: `[From Note] ${note.title}`,
          description: note.content || "Created from note: " + note.title,
          type: "Feature",
          status: "todo",
          priority: "medium",
          tags: ["note-import", note.category],
          subtasks: [],
          history: [{ timestamp: new Date().toLocaleTimeString(), action: "Task created from Note" }],
        }),
      });
      if (res.ok) {
        toast.success("Task created from Note! View it in Task Dashboard.");
      } else {
        toast.error("Failed to create task from Note.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error creating task.");
    }
  };

  const convertNoteToEvent = async (note: Note) => {
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
          title: `[Note Session] ${note.title}`,
          description: note.content || "Session created for note: " + note.title,
          from: now.toISOString(),
          to: end.toISOString(),
          type: "purple",
        }),
      });
      if (res.ok) {
        toast.success("Calendar Event created! View it in Calendar Dashboard.");
      } else {
        toast.error("Failed to create Calendar Event.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error creating Calendar Event.");
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/notes/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const filtered = notes.filter((n) => n.id !== id);
        setNotes(filtered);
        if (selectedNoteId === id) {
          setSelectedNoteId(filtered.length > 0 ? filtered[0].id : "");
        }
        toast.success("Note deleted successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete note");
    }
  };

  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  const startEditing = () => {
    if (!selectedNote) return;
    setEditTitle(selectedNote.title);
    setEditContent(selectedNote.content);
    setEditCategory(selectedNote.category);
    setIsEditing(true);
  };

  // Filtering notes
  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeCategory === "all") return matchesSearch;
    if (activeCategory === "favorites") return matchesSearch && note.favorite;
    return matchesSearch && note.category === activeCategory;
  });

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "work":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "ideas":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "personal":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full min-h-[500px] bg-background">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="size-6 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-semibold">Loading notes library...</span>
        </div>
      </div>
    );
  }

  const favoriteCount = notes.filter((n) => n.favorite).length;

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col overflow-y-auto bg-background p-4 md:p-6 space-y-5 lg:space-y-6">

        {/* ─── Brain Dashboard Style Top Visual Telemetry Banner ─── */}
        <div className="flex flex-col gap-3 p-4.5 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md shrink-0 shadow-[0_8px_25px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.5)] relative transition-all duration-300">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-foreground/5 border border-border flex items-center justify-center text-foreground shadow-xs shrink-0">
                <FileText className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold tracking-tight text-foreground">
                    Notes &amp; Knowledge Vault
                  </h1>
                  <Badge variant="outline" className="text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider bg-muted/60 border-border text-muted-foreground shadow-xs">
                    v2.0 Vault
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  Organize ideas, capture research snippets, and sync execution roadmaps with calendar events
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
                onClick={() => setIsNewNoteOpen(true)}
                className="h-8.5 text-xs font-semibold bg-foreground hover:bg-foreground/90 text-background gap-1.5 px-3 rounded-xl shadow-md border border-foreground/10 cursor-pointer transition-all hover:scale-102"
              >
                <Plus className="size-3.5" />
                <span>New Note</span>
              </Button>
            </div>
          </div>

          {/* Visual Analytics Telemetry Bar */}
          {showVisuals && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-border/40 select-none">
              {/* Metric 1: Total Notes */}
              <div className="p-2.5 rounded-xl bg-card border border-border/60 flex items-center justify-between shadow-xs hover:shadow-sm transition-all">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <BookOpen className="size-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Vault Notes</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-bold text-foreground">{notes.length} entries</span>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 bg-muted border-border text-muted-foreground">
                  Stored
                </Badge>
              </div>

              {/* Metric 2: Starred Notes */}
              <div className="p-2.5 rounded-xl bg-card border border-border/60 flex items-center justify-between shadow-xs hover:shadow-sm transition-all">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <Star className="size-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Starred Favorites</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-bold text-foreground">{favoriteCount} starred</span>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 bg-amber-500/10 text-amber-600 border-amber-500/30">
                  Priority
                </Badge>
              </div>

              {/* Metric 3: Active Category */}
              <div className="p-2.5 rounded-xl bg-card border border-border/60 flex items-center justify-between shadow-xs hover:shadow-sm transition-all">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Folder className="size-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Filtered View</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-bold text-foreground capitalize">{activeCategory}</span>
                      <span className="text-[10px] text-muted-foreground">({filteredNotes.length})</span>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                  Filter
                </Badge>
              </div>

              {/* Metric 4: Knowledge Engine Latency */}
              <div className="p-2.5 rounded-xl bg-card border border-border/60 flex items-center justify-between shadow-xs hover:shadow-sm transition-all">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <Sparkles className="size-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Vault Engine</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-bold text-foreground">Sync Active</span>
                      <span className="text-[10px] text-emerald-500 font-mono">~90ms</span>
                    </div>
                  </div>
                </div>
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" title="Engine Active" />
              </div>
            </div>
          )}
        </div>

        {/* ─── MAIN WORKSPACE CONTENT GRID ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 flex-1 min-h-0">

          {/* CONTAINER 1: LEFT NOTES LIBRARY SIDEBAR (Width 4/12) */}
          <div className="lg:col-span-4 bg-card border border-border/80 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_25px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col min-h-[500px] overflow-hidden">
            {/* Header search & create buttons */}
            <div className="p-4 border-b border-border/60 space-y-3 shrink-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs tracking-wider flex items-center gap-2 uppercase text-foreground select-none">
                  <FileText className="size-4 text-foreground" />
                  Notes Library
                </span>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 border-border bg-muted/40 font-mono">
                  {filteredNotes.length} notes
                </Badge>
              </div>

              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search notes content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 text-xs h-8.5 border-border bg-muted/20 rounded-xl"
                />
              </div>
            </div>

            {/* Categories Tab selectors */}
            <div className="px-3 py-2 border-b border-border/60 bg-muted/10 flex items-center justify-between shrink-0 gap-1 overflow-x-auto scrollbar-none">
              {[
                { id: "all", label: "All" },
                { id: "work", label: "Work" },
                { id: "ideas", label: "Ideas" },
                { id: "personal", label: "Personal" },
                { id: "favorites", label: "Stars" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "px-2.5 py-1 text-[10px] font-bold rounded-xl transition-all shrink-0 uppercase cursor-pointer",
                    activeCategory === cat.id
                      ? "bg-foreground text-background shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Notes items loop inside 3D elevated cards */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => {
                    setSelectedNoteId(note.id);
                    setIsEditing(false);
                  }}
                  className={cn(
                    "group flex flex-col p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-200 select-none relative",
                    selectedNoteId === note.id
                      ? "border-foreground/40 bg-muted/30 shadow-md ring-1 ring-foreground/15"
                      : "border-border/80 bg-card hover:border-foreground/30 hover:shadow-sm"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-bold text-xs text-foreground truncate flex-1">
                      {note.title || "Untitled Note"}
                    </span>
                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateNote(note.id, { favorite: !note.favorite });
                        }}
                        className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                      >
                        <Star
                          className={cn(
                            "size-3.5",
                            note.favorite && "fill-amber-400 text-amber-400"
                          )}
                        />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }}
                        className="p-1 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed mb-2.5 font-medium">
                    {note.content || "Empty content..."}
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-border/40">
                    <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0.5 font-bold uppercase rounded-md", getCategoryColor(note.category))}>
                      {note.category}
                    </Badge>
                    <span className="text-[9.5px] font-mono text-muted-foreground">
                      {new Date(note.updatedAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>
              ))}
              {filteredNotes.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <BookOpen className="size-8 text-muted-foreground/30 mb-2" />
                  <span className="text-xs font-semibold">No notes found matching category</span>
                </div>
              )}
            </div>
          </div>

          {/* CONTAINER 2: RIGHT WORKSPACE CONTAINER CARD (Width 8/12) */}
          <div className="lg:col-span-8 bg-card border border-border/80 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_35px_rgba(0,0,0,0.5)] transition-all duration-300 flex flex-col min-h-[500px] overflow-hidden p-6">

            {/* Main workspace view */}
            {isNewNoteOpen ? (
              /* CREATE NOTE FORM VIEW */
              <div className="flex-1 flex flex-col min-h-0 space-y-4 overflow-hidden">
                <div className="flex items-center justify-between border-b border-border/60 pb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-foreground" />
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">Compose New Note Entry</span>
                  </div>
                  <button
                    onClick={() => setIsNewNoteOpen(false)}
                    className="p-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1.5 min-h-0 scrollbar-thin">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Note Title</label>
                    <Input
                      placeholder="Enter a descriptive title..."
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="text-xs border-border bg-muted/20 h-9 rounded-xl"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">Note Category:</label>
                    <Select value={newCategory} onValueChange={setNewCategory}>
                      <SelectTrigger className="w-[160px] h-8.5 text-xs bg-muted/20 border-border rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="work" className="text-xs">Work</SelectItem>
                        <SelectItem value="ideas" className="text-xs">Ideas</SelectItem>
                        <SelectItem value="personal" className="text-xs">Personal</SelectItem>
                        <SelectItem value="general" className="text-xs">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1 flex flex-col space-y-1.5 min-h-[260px]">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Body Content</label>
                    <Textarea
                      placeholder="Draft your markdown text notes here..."
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      className="flex-1 text-sm border-border bg-muted/20 resize-none p-4 leading-relaxed rounded-xl focus:border-border min-h-[250px] overflow-y-auto"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-border/60 pt-4 shrink-0">
                  <Button
                    variant="outline"
                    onClick={() => setIsNewNoteOpen(false)}
                    className="h-8.5 text-xs border-border rounded-xl font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateNote}
                    className="h-8.5 text-xs bg-foreground text-background hover:bg-foreground/90 font-semibold rounded-xl px-4 shadow-sm"
                  >
                    <Check className="size-3 mr-1" /> Create Note
                  </Button>
                </div>
              </div>
            ) : selectedNote ? (
              isEditing ? (
                /* EDIT NOTE FORM VIEW */
                <div className="flex-1 flex flex-col min-h-0 space-y-4 lg:space-y-5 overflow-hidden">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3.5 shrink-0">
                    <div className="flex items-center gap-2">
                      <Edit3 className="size-4 text-foreground" />
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground">Modify Note Metadata</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => convertNoteToTask(selectedNote)}
                            className="size-8 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/15 rounded-xl shadow-xs"
                          >
                            <BookOpen className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">Convert to Task</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => convertNoteToEvent(selectedNote)}
                            className="size-8 border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/5 hover:bg-purple-500/15 rounded-xl shadow-xs"
                          >
                            <Calendar className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">Schedule Event</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleDeleteNote(selectedNote.id)}
                            className="size-8 text-rose-500 hover:bg-rose-500/10 border-rose-500/30 bg-rose-500/5 rounded-xl shadow-xs"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">Delete Note</TooltipContent>
                      </Tooltip>

                      <button
                        onClick={() => setIsEditing(false)}
                        className="p-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer ml-1"
                        title="Close editor"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-4 pr-1.5 min-h-0 scrollbar-thin">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Note Title</label>
                      <Input
                        placeholder="Enter title..."
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="text-xs border-border bg-muted/20 h-9 rounded-xl"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">Category:</label>
                      <Select value={editCategory} onValueChange={setEditCategory}>
                        <SelectTrigger className="w-[160px] h-8.5 text-xs bg-muted/20 border-border rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="work" className="text-xs">Work</SelectItem>
                          <SelectItem value="ideas" className="text-xs">Ideas</SelectItem>
                          <SelectItem value="personal" className="text-xs">Personal</SelectItem>
                          <SelectItem value="general" className="text-xs">General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex-1 flex flex-col space-y-1.5 min-h-[260px]">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Body Content</label>
                      <Textarea
                        placeholder="Body content..."
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="flex-1 text-sm border-border bg-muted/20 resize-none p-4 leading-relaxed rounded-xl focus:border-border min-h-[250px] overflow-y-auto"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 border-t border-border/60 pt-4 shrink-0">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="h-8.5 text-xs border-border rounded-xl font-semibold"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() =>
                        handleUpdateNote(selectedNote.id, {
                          title: editTitle,
                          content: editContent,
                          category: editCategory,
                        })
                      }
                      className="h-8.5 text-xs bg-foreground text-background hover:bg-foreground/90 font-semibold rounded-xl px-4 shadow-sm"
                    >
                      <Check className="size-3 mr-1" /> Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                /* DETAIL PREVIEW VIEW */
                <div className="flex-1 flex flex-col min-h-0 space-y-4 lg:space-y-5">
                  {/* Note title and quick actions */}
                  <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-4 flex-wrap shrink-0">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-foreground tracking-tight">
                          {selectedNote.title || "Untitled Note"}
                        </h2>
                        <button
                          onClick={() =>
                            handleUpdateNote(selectedNote.id, {
                              favorite: !selectedNote.favorite,
                            })
                          }
                          className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                        >
                          <Star
                            className={cn(
                              "size-4",
                              selectedNote.favorite &&
                              "fill-amber-400 text-amber-400"
                            )}
                          />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("text-[9px] font-bold uppercase rounded-md", getCategoryColor(selectedNote.category))}>
                          {selectedNote.category}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                          <Calendar className="size-3" />
                          Modified {new Date(selectedNote.updatedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => convertNoteToTask(selectedNote)}
                            className="size-8.5 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/15 rounded-xl shadow-xs"
                          >
                            <BookOpen className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">Convert to Task</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => convertNoteToEvent(selectedNote)}
                            className="size-8.5 border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/5 hover:bg-purple-500/15 rounded-xl shadow-xs"
                          >
                            <Calendar className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">Schedule Event</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={startEditing}
                            className="size-8.5 border-border hover:bg-muted text-foreground rounded-xl shadow-xs"
                          >
                            <Edit3 className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">Edit Note</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleDeleteNote(selectedNote.id)}
                            className="size-8.5 text-rose-500 hover:bg-rose-500/10 border-rose-500/30 bg-rose-500/5 rounded-xl shadow-xs"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">Delete Note</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Scrollable Note Body Container with Enhanced Readability */}
                  <ScrollArea className="flex-1 min-h-[380px] w-full rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground font-normal tracking-normal select-text space-y-3 pr-3">
                      {selectedNote.content ? (
                        selectedNote.content.split("\n\n").map((paragraph, idx) => (
                          <p key={idx} className="leading-relaxed">
                            {paragraph}
                          </p>
                        ))
                      ) : (
                        <span className="text-muted-foreground italic font-normal text-xs">No content inside this note yet. Click Edit Note to write details.</span>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )
            ) : (
              /* EMPTY PLACEHOLDER VIEW */
              <div className="flex-grow flex flex-col items-center justify-center text-muted-foreground gap-3 bg-card rounded-xl border border-dashed border-border p-8">
                <FileText className="size-12 text-muted-foreground/30" />
                <span className="text-xs font-semibold">Select a note from the library list to view or edit details</span>
              </div>
            )}
          </div>

        </div>

      </div>
    </TooltipProvider>
  );
}
