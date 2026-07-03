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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
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
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update note");
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

  return (
    <TooltipProvider>
      <div className="flex h-screen w-full bg-background text-foreground overflow-hidden border border-border rounded-xl">
        
        {/* LEFT COLUMN: NOTES LIST */}
        <div className="w-[380px] shrink-0 border-r border-border bg-card/30 flex flex-col h-full">
          
          {/* Header search & create buttons */}
          <div className="p-4 border-b border-border space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm tracking-tight flex items-center gap-2 uppercase opacity-85 select-none">
                <FileText className="size-4 text-muted-foreground" />
                Notes Library
              </span>
              <Button
                size="sm"
                onClick={() => setIsNewNoteOpen(true)}
                className="h-7 px-2.5 text-xs bg-foreground text-background hover:bg-foreground/90 font-semibold gap-1"
              >
                <Plus className="size-3" /> New Note
              </Button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search notes content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-8 border-border bg-background/50"
              />
            </div>
          </div>

          {/* Categories Tab selectors */}
          <div className="px-3 py-2 border-b border-border bg-muted/20 flex items-center justify-between shrink-0 gap-1 overflow-x-auto scrollbar-none">
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
                  "px-2 py-1 text-[10px] font-bold rounded-md transition-all shrink-0 uppercase",
                  activeCategory === cat.id
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Notes items loop */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => {
                  setSelectedNoteId(note.id);
                  setIsEditing(false);
                }}
                className={cn(
                  "group flex flex-col p-3 rounded-lg border text-left cursor-pointer transition-all hover:bg-muted/30 select-none relative",
                  selectedNoteId === note.id
                    ? "border-primary/40 bg-muted/40 shadow-xs"
                    : "border-border/60 bg-card/40"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-semibold text-xs text-foreground truncate flex-1">
                    {note.title || "Untitled Note"}
                  </span>
                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateNote(note.id, { favorite: !note.favorite });
                      }}
                      className="p-0.5 rounded text-muted-foreground hover:text-foreground"
                    >
                      <Star
                        className={cn(
                          "size-3",
                          note.favorite && "fill-foreground text-foreground"
                        )}
                      />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note.id);
                      }}
                      className="p-0.5 rounded text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed mb-2 font-light">
                  {note.content || "Empty content..."}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={cn("text-[9px] px-1.5 font-bold uppercase", getCategoryColor(note.category))}>
                    {note.category}
                  </Badge>
                  <span className="text-[9px] font-mono text-muted-foreground">
                    {new Date(note.updatedAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                  </span>
                </div>
              </div>
            ))}
            {filteredNotes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <BookOpen className="size-8 text-muted-foreground/30 mb-2" />
                <span className="text-xs">No notes found matching category</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: DETAIL NOTE DISPLAY & MODE CONTROLS */}
        <div className="flex-1 flex flex-col bg-background h-full">
          
          {/* Main workspace view */}
          {isNewNoteOpen ? (
            /* CREATE NOTE FORM VIEW */
            <div className="flex-grow flex flex-col p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-muted-foreground" />
                  <span className="text-xs font-bold uppercase">Compose New Note Entry</span>
                </div>
                <button
                  onClick={() => setIsNewNoteOpen(false)}
                  className="p-1 rounded text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Note Title</label>
                <Input
                  placeholder="Enter a descriptive title..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="text-xs border-border bg-card h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Note Folder Category</label>
                  <Select value={newCategory} onValueChange={setNewCategory}>
                    <SelectTrigger className="h-9 text-xs bg-card border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="work" className="text-xs">Work</SelectItem>
                      <SelectItem value="ideas" className="text-xs">Ideas</SelectItem>
                      <SelectItem value="personal" className="text-xs">Personal</SelectItem>
                      <SelectItem value="general" className="text-xs">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex-1 flex flex-col space-y-1.5 min-h-0">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Body Content</label>
                <Textarea
                  placeholder="Draft your markdown text notes here..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="flex-1 text-xs border-border bg-card resize-none p-3 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsNewNoteOpen(false)}
                  className="h-8 text-xs border-border"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateNote}
                  className="h-8 text-xs bg-foreground text-background hover:bg-foreground/90 font-semibold"
                >
                  <Check className="size-3 mr-1" /> Create Note
                </Button>
              </div>
            </div>
          ) : selectedNote ? (
            isEditing ? (
              /* EDIT NOTE FORM VIEW */
              <div className="flex-grow flex flex-col p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <Edit3 className="size-4 text-muted-foreground" />
                    <span className="text-xs font-bold uppercase">Modify Note Metadata</span>
                  </div>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="p-1 rounded text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Note Title</label>
                  <Input
                    placeholder="Enter title..."
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-xs border-border bg-card h-9"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Category</label>
                    <Select value={editCategory} onValueChange={setEditCategory}>
                      <SelectTrigger className="h-9 text-xs bg-card border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="work" className="text-xs">Work</SelectItem>
                        <SelectItem value="ideas" className="text-xs">Ideas</SelectItem>
                        <SelectItem value="personal" className="text-xs">Personal</SelectItem>
                        <SelectItem value="general" className="text-xs">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex-1 flex flex-col space-y-1.5 min-h-0">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Body Content</label>
                  <Textarea
                    placeholder="Body content..."
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="flex-1 text-xs border-border bg-card resize-none p-3 leading-relaxed"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="h-8 text-xs border-border"
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
                    className="h-8 text-xs bg-foreground text-background hover:bg-foreground/90 font-semibold"
                  >
                    <Check className="size-3 mr-1" /> Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              /* DETAIL PREVIEW VIEW */
              <div className="flex-grow flex flex-col p-6 space-y-6">
                
                {/* Note title and quick actions */}
                <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-foreground">
                        {selectedNote.title || "Untitled Note"}
                      </h2>
                      <button
                        onClick={() =>
                          handleUpdateNote(selectedNote.id, {
                            favorite: !selectedNote.favorite,
                          })
                        }
                        className="p-1 rounded text-muted-foreground hover:text-foreground"
                      >
                        <Star
                          className={cn(
                            "size-4",
                            selectedNote.favorite &&
                              "fill-foreground text-foreground"
                          )}
                        />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn("text-[9px] font-bold uppercase", getCategoryColor(selectedNote.category))}>
                        {selectedNote.category}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="size-3" />
                        Modified {new Date(selectedNote.updatedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={startEditing}
                      className="h-8 text-xs border-border font-semibold gap-1"
                    >
                      <Edit3 className="size-3.5" /> Edit Note
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteNote(selectedNote.id)}
                      className="h-8 text-xs text-destructive hover:bg-destructive/10 border-border font-semibold gap-1"
                    >
                      <Trash2 className="size-3.5" /> Delete
                    </Button>
                  </div>
                </div>

                {/* Note body preview scroll space */}
                <div className="flex-grow overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-foreground/90 font-light pr-2 scrollbar-thin">
                  {selectedNote.content || (
                    <span className="text-muted-foreground italic">No content inside this note yet. Click Edit to add some.</span>
                  )}
                </div>
              </div>
            )
          ) : (
            /* EMPTY PLACEHOLDER VIEW */
            <div className="flex-grow flex flex-col items-center justify-center text-muted-foreground gap-3 bg-background">
              <FileText className="size-16 text-muted-foreground/20" />
              <span className="text-sm font-semibold">Select a note from the library list to view or edit details</span>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
