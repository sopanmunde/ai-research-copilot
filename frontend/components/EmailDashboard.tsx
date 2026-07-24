"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Inbox,
  FileText,
  Send,
  Trash2,
  Archive,
  ArchiveX,
  Paperclip,
  Search,
  Plus,
  X,
  Reply,
  ReplyAll,
  Forward,
  Sparkles,
  PenSquare,
  Bold,
  Italic,
  Strikethrough,
  Heading,
  List,
  Link2,
  Smile,
  RefreshCw,
  AlertCircle,
  MoreVertical,
  Star,
  CheckSquare,
  MessageSquareText,
  ArrowRight,
  Mail,
  MailQuestion,
  Bot,
  ChevronLeft,
  Copy,
  Check,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Calendar,
  Layers,
  Clock,
  ArrowLeft,
  Info,
  AlignJustify,
  LayoutGrid,
  Activity,
  Gauge,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { API_BASE_URL } from "@/lib/api";
import { toast } from "sonner";

interface Email {
  id: string;
  name: string;
  email: string;
  subject: string;
  date: string;
  fullDate: string;
  snippet: string;
  body: string;
  tags: string[];
  unread: boolean;
  favorite: boolean;
  folder: "inbox" | "drafts" | "sent" | "trash" | "archive" | "junk";
  category?: "social" | "updates" | "forums" | "shopping" | "promotions";
}

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export function EmailDashboard() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeNav, setActiveNav] = useState("inbox");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmailId, setSelectedEmailId] = useState("");
  const [composeMode, setComposeMode] = useState<"new" | "reply" | "edit" | null>(null);

  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");

  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTone, setAiTone] = useState("professional");
  const [aiDraft, setAiDraft] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiChat, setAiChat] = useState<ChatMessage[]>([]);

  const [mobileView, setMobileView] = useState<"list" | "detail" | "compose">("list");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  // View Mode: "compact" (One-line container row) | "comfortable" (Card view)
  const [listViewMode, setListViewMode] = useState<"compact" | "comfortable">("compact");
  const [showVisuals, setShowVisuals] = useState(true);

  // Auto-close desktop sidebar when AI Assistant opens to expand email workspace UI
  useEffect(() => {
    if (aiAssistantOpen) {
      setDesktopSidebarOpen(false);
    } else {
      setDesktopSidebarOpen(true);
    }
  }, [aiAssistantOpen]);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const selectedEmail = emails.find((e) => e.id === selectedEmailId) || null;
  const isDetailPaneOpen = Boolean(selectedEmailId || composeMode);

  const renderSenderAvatar = (email: Email, sizeClass = "size-6.5") => {
    const initials = email.name
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "G";

    const colorMap: Record<string, string> = {
      A: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
      B: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
      C: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      D: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
      E: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
      F: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
      G: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30",
      H: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
      K: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
      M: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
      P: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30",
      S: "bg-blue-600/15 text-blue-600 dark:text-blue-400 border-blue-600/30",
      T: "bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 border-emerald-600/30",
      V: "bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 border-indigo-600/30",
    };

    const firstLetter = initials[0] || "G";
    const badgeStyle = colorMap[firstLetter] || "bg-muted text-foreground border-border";

    return (
      <div className={cn(sizeClass, "rounded-full border flex items-center justify-center font-bold text-[10px] shrink-0 shadow-xs select-none", badgeStyle)}>
        {initials}
      </div>
    );
  };

  const closeDetailPane = () => {
    setSelectedEmailId("");
    setComposeMode(null);
    setMobileView("list");
  };

  const fetchEmails = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/emails`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setEmails(data);
      }
    } catch (e) {
      console.error("Failed to fetch emails", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [aiChat]);

  const getNavCount = (navId: string) => {
    const isFolder = ["inbox", "drafts", "sent", "junk", "trash", "archive"].includes(navId);
    if (isFolder) {
      return emails.filter((e) => e.folder === navId).length;
    } else {
      return emails.filter((e) => e.category === navId).length;
    }
  };

  const getFilteredEmails = () => {
    const isFolder = ["inbox", "drafts", "sent", "junk", "trash", "archive"].includes(activeNav);
    let list = isFolder
      ? emails.filter((e) => e.folder === activeNav)
      : emails.filter((e) => e.category === activeNav);

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.subject.toLowerCase().includes(q) ||
          e.body.toLowerCase().includes(q)
      );
    }

    if (selectedFilter === "unread") {
      list = list.filter((e) => e.unread);
    } else if (selectedFilter === "favorites") {
      list = list.filter((e) => e.favorite);
    }

    return list;
  };

  const filteredEmails = getFilteredEmails();

  useEffect(() => {
    const isSelectedInFolder = filteredEmails.some((e) => e.id === selectedEmailId);
    if (!isSelectedInFolder) {
      setSelectedEmailId("");
    }
  }, [activeNav]);

  const generateAIDraft = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setAiDraft("");

    setAiChat((prev) => [...prev, { role: "user", text: aiPrompt }]);
    const currentPrompt = aiPrompt;
    setAiPrompt("");

    setTimeout(() => {
      let draftText = "";

      if (composeMode === "reply" && selectedEmail) {
        if (aiTone === "professional") {
          draftText = `Dear ${selectedEmail.name},\n\nThank you for reaching out regarding "${selectedEmail.subject}". I have reviewed your points, and I agree that aligning on our next steps is crucial.\n\nI am available to sync tomorrow to finalize these items. Please let me know what time works best for you.\n\nBest regards,\n[Your Name]`;
        } else if (aiTone === "friendly") {
          draftText = `Hi ${selectedEmail.name}!\n\nThanks for the email! I'd love to chat more about this. Meeting tomorrow sounds like a plan — let me know what time you're free and we'll set it up.\n\nTalk soon,\n[Your Name]`;
        } else {
          draftText = `Hi ${selectedEmail.name},\n\nRegarding "${selectedEmail.subject}": I need to review the details first but let's connect tomorrow to make sure we are on the same page.\n\nThanks,\n[Your Name]`;
        }
      } else {
        if (aiTone === "professional") {
          draftText = `Subject: ${composeSubject || "Update regarding Project Plan"}\n\nDear Team,\n\nI wanted to check in regarding our current development milestones. Please review the updated items in our library and prepare your feedback for tomorrow.\n\nSincerely,\n[Your Name]`;
        } else {
          draftText = `Subject: Quick catchup\n\nHey everyone,\n\nJust wanted to check in and see how we are tracking on our project work. Let's sync up briefly tomorrow if you have some open slots.\n\nBest,\n[Your Name]`;
        }
      }

      let index = 0;
      setIsGenerating(false);

      const interval = setInterval(() => {
        if (index < draftText.length) {
          setAiDraft((prev) => prev + draftText.substring(prev.length, prev.length + 5));
          index += 5;
        } else {
          clearInterval(interval);
          setAiChat((prev) => [...prev, { role: "assistant", text: draftText }]);
        }
      }, 30);
    }, 1200);
  };

  const handleApplyDraft = () => {
    if (aiDraft) {
      setComposeBody(aiDraft);
      toast.success("AI draft applied into email body!");
    }
  };

  const triggerReply = () => {
    if (selectedEmail) {
      setComposeTo(selectedEmail.email);
      setComposeSubject(`Re: ${selectedEmail.subject}`);
      setComposeBody(
        `\n\nOn ${selectedEmail.fullDate}, ${selectedEmail.name} <${selectedEmail.email}> wrote:\n> ` +
        selectedEmail.body.replace(/\n/g, "\n> ")
      );
      setComposeMode("reply");
      setMobileView("compose");
    }
  };

  const triggerEdit = () => {
    if (selectedEmail) {
      setComposeTo(selectedEmail.email);
      setComposeSubject(selectedEmail.subject);
      setComposeBody(selectedEmail.body);
      setComposeMode("edit");
      setMobileView("compose");
    }
  };

  const triggerNew = () => {
    setComposeTo("");
    setComposeSubject("");
    setComposeBody("");
    setComposeMode("new");
    setMobileView("compose");
  };

  const convertEmailToTask = async (email: Email) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: `[Email] ${email.subject}`,
          description: `From: ${email.name} (${email.email})\n\n${email.snippet || email.body}`,
          type: "Feature",
          status: "todo",
          priority: "high",
          tags: ["email-import"],
          subtasks: [],
          history: [{ timestamp: new Date().toLocaleTimeString(), action: "Task created from Email" }],
        }),
      });
      if (res.ok) {
        toast.success("Task created from Email! View in Task Dashboard.");
      } else {
        toast.error("Failed to create task from Email.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error creating task.");
    }
  };

  const convertEmailToNote = async (email: Email) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: `[Email Note] ${email.subject}`,
          content: `Sender: ${email.name} (${email.email})\nDate: ${email.fullDate || email.date}\n\n${email.body || email.snippet}`,
          category: "work",
          favorite: false,
        }),
      });
      if (res.ok) {
        toast.success("Saved as Note! View in Notes Dashboard.");
      } else {
        toast.error("Failed to save Note.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error creating Note.");
    }
  };

  const convertEmailToEvent = async (email: Email) => {
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
          title: `[Email Meeting] ${email.subject}`,
          description: `Email context from ${email.name}:\n\n${email.snippet}`,
          from: now.toISOString(),
          to: end.toISOString(),
          type: "blue",
        }),
      });
      if (res.ok) {
        toast.success("Calendar Event created! View in Calendar Dashboard.");
      } else {
        toast.error("Failed to create Calendar Event.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error creating Calendar Event.");
    }
  };

  const folderItems = [
    { id: "inbox", label: "Inbox", icon: Inbox },
    { id: "drafts", label: "Drafts", icon: FileText },
    { id: "sent", label: "Sent", icon: Send },
    { id: "junk", label: "Junk", icon: ArchiveX },
    { id: "trash", label: "Trash", icon: Trash2 },
    { id: "archive", label: "Archive", icon: Archive },
  ];

  const categoryItems = [
    { id: "social", label: "Social" },
    { id: "updates", label: "Updates" },
    { id: "forums", label: "Forums" },
    { id: "shopping", label: "Shopping" },
    { id: "promotions", label: "Promotions" },
  ];

  const activeFolderIcon = folderItems.find((f) => f.id === activeNav)?.icon || Inbox;
  const ActiveIcon = activeFolderIcon;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full min-h-[550px] bg-background/50 backdrop-blur-md border border-border/40 rounded-2xl">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="size-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground font-medium animate-pulse">Synchronizing email pipeline...</span>
        </div>
      </div>
    );
  }

  // Common Sidebar Content
  const renderSidebar = () => (
    <div className="flex flex-col h-full bg-card/30 backdrop-blur-lg p-3 rounded-2xl border border-border/80 shadow-lg justify-between select-none">
      <div className="flex flex-col gap-4 overflow-y-auto scrollbar-none">
        {/* Profile Card Header */}
        <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex items-center gap-3">
          <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Mail className="size-4.5 text-primary" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-foreground block truncate">Email Workspace</span>
            <span className="text-[10px] text-muted-foreground block truncate">sopanmunde5@gmail.com</span>
          </div>
        </div>

        {/* Compose Button */}
        <button
          onClick={triggerNew}
          className="relative w-full overflow-hidden rounded-xl border border-border bg-card/80 hover:bg-muted text-foreground py-2.5 text-xs font-semibold transition-all duration-200 shadow-sm active:scale-98 flex items-center justify-center gap-2 group cursor-pointer"
        >
          <Plus className="size-4 group-hover:rotate-90 transition-all duration-200 text-foreground" />
          <span className="tracking-tight">Compose Message</span>
        </button>

        {/* Folders Section */}
        <div className="flex flex-col gap-0.5">
          <span className="px-3 py-1 text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            System Folders
          </span>
          {folderItems.map((item) => {
            const count = getNavCount(item.id);
            const isActive = activeNav === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveNav(item.id);
                  closeDetailPane();
                  setMobileSidebarOpen(false);
                }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-xl transition-all duration-200 text-left w-full cursor-pointer",
                  isActive
                    ? "bg-primary/10 border border-primary/25 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground border border-transparent"
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span>{item.label}</span>
                {count > 0 && (
                  <span
                    className={cn(
                      "ml-auto text-[9px] px-1.5 py-0.5 rounded-md font-semibold min-w-5 text-center border",
                      isActive
                        ? "bg-primary text-primary-foreground border-primary/20"
                        : "bg-muted text-muted-foreground border-border"
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <Separator className="bg-border/60" />

        {/* Categories Section */}
        <div className="flex flex-col gap-0.5">
          <span className="px-3 py-1 text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Smart Categories
          </span>
          {categoryItems.map((item) => {
            const count = getNavCount(item.id);
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveNav(item.id);
                  closeDetailPane();
                  setMobileSidebarOpen(false);
                }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-xl transition-all duration-200 text-left w-full border border-transparent cursor-pointer",
                  isActive
                    ? "bg-primary/10 border-primary/20 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "size-2 rounded-full shrink-0",
                    item.id === "social" && "bg-blue-500",
                    item.id === "updates" && "bg-teal-500",
                    item.id === "forums" && "bg-orange-500",
                    item.id === "shopping" && "bg-green-500",
                    item.id === "promotions" && "bg-pink-500"
                  )}
                />
                <span>{item.label}</span>
                {count > 0 && (
                  <span
                    className={cn(
                      "ml-auto text-[9px] px-1.5 py-0.5 rounded-md font-semibold min-w-5 text-center border",
                      isActive
                        ? "bg-primary text-primary-foreground border-primary/25"
                        : "bg-muted text-muted-foreground border-border"
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mini Telemetry Status Footer */}
      <div className="p-3 bg-muted/20 rounded-xl border border-border/40 text-[10px] text-muted-foreground flex items-center justify-between mt-4">
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>SMTP Engine</span>
        </div>
        <span className="font-semibold">{emails.length} total</span>
      </div>
    </div>
  );

  const renderEmailList = () => (
    <div className="flex flex-col h-full overflow-hidden w-full relative">
      {/* List Header */}
      <div className="p-3 flex items-center justify-between gap-2 shrink-0 border-b border-border/60 bg-muted/20 flex-wrap">
        <h2 className="text-sm font-bold tracking-tight text-foreground capitalize select-none flex items-center gap-2">
          <ActiveIcon className="size-4 text-foreground" />
          {activeNav}
        </h2>

        <div className="flex items-center gap-1.5">
          {/* Filter Toggle Buttons */}
          <div className="flex bg-muted/50 border border-border p-0.5 rounded-xl shrink-0">
            {["all", "unread"].map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={cn(
                  "px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all select-none capitalize cursor-pointer",
                  selectedFilter === filter
                    ? "bg-card text-foreground border border-border/60 shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* View Mode Toggle Buttons */}
          <div className="flex bg-muted/50 border border-border p-0.5 rounded-xl shrink-0">
            <button
              onClick={() => setListViewMode("compact")}
              title="Compact One-Line View"
              className={cn(
                "p-1 rounded-lg text-xs transition-all select-none cursor-pointer",
                listViewMode === "compact"
                  ? "bg-card text-foreground border border-border/60 shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <AlignJustify className="size-3.5" />
            </button>
            <button
              onClick={() => setListViewMode("comfortable")}
              title="Comfortable Card View"
              className={cn(
                "p-1 rounded-lg text-xs transition-all select-none cursor-pointer",
                listViewMode === "comfortable"
                  ? "bg-card text-foreground border border-border/60 shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 shrink-0 border-b border-border/40 bg-card">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8.5 text-xs bg-muted/30 border-border rounded-xl placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-border"
          />
        </div>
      </div>

      {/* Emails List Body */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 flex flex-col gap-1.5 min-h-0 bg-muted/10">
        {filteredEmails.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2.5 select-none">
            <div className="size-10 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground/60">
              <AlertCircle className="size-5" />
            </div>
            <span className="text-xs font-medium">No emails in {activeNav}</span>
          </div>
        ) : (
          filteredEmails.map((email) => {
            const isSelected = selectedEmailId === email.id;

            if (listViewMode === "compact") {
              {/* ONE-LINE CONTAINER ROW VIEW */ }
              return (
                <button
                  key={email.id}
                  onClick={() => {
                    setSelectedEmailId(email.id);
                    setComposeMode(null);
                    setMobileView("detail");
                  }}
                  className={cn(
                    "group flex items-center justify-between gap-3 px-3 py-2 rounded-xl transition-all duration-150 border text-xs w-full text-left cursor-pointer min-h-10 select-none",
                    isSelected
                      ? "bg-muted/90 border-foreground/40 font-semibold shadow-xs ring-1 ring-foreground/20"
                      : "bg-card border-border/60 hover:bg-muted/40 hover:border-border"
                  )}
                >
                  {/* Left: Google Account Profile Avatar + Sender Name */}
                  <div className="flex items-center gap-2.5 w-36 sm:w-44 shrink-0 min-w-0">
                    {renderSenderAvatar(email, "size-6")}
                    <span className={cn("text-xs truncate", email.unread ? "font-bold text-foreground" : "font-semibold text-foreground/90")}>
                      {email.name}
                    </span>
                  </div>

                  {/* Middle: Inline Subject & Body Preview */}
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 truncate">
                    <span className={cn("text-xs truncate shrink-0 max-w-[50%]", email.unread ? "font-bold text-foreground" : "font-medium text-foreground/90")}>
                      {email.subject || "(No Subject)"}
                    </span>
                    <span className="text-muted-foreground/60 text-xs hidden sm:inline">&ndash;</span>
                    <span className="text-muted-foreground text-[11px] truncate flex-1 font-normal hidden sm:inline">
                      {email.snippet || email.body}
                    </span>
                  </div>

                  {/* Right: Star & Date */}
                  <div className="flex items-center gap-2 shrink-0 ml-auto">
                    {email.favorite && (
                      <Star className="size-3 text-foreground fill-foreground shrink-0" />
                    )}
                    <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                      {email.date}
                    </span>
                  </div>
                </button>
              );
            }

            {/* COMFORTABLE CARD VIEW */ }
            return (
              <button
                key={email.id}
                onClick={() => {
                  setSelectedEmailId(email.id);
                  setComposeMode(null);
                  setMobileView("detail");
                }}
                className={cn(
                  "group flex flex-col items-start p-3 rounded-xl transition-all duration-150 border text-xs w-full text-left relative cursor-pointer",
                  isSelected
                    ? "bg-muted/80 border-foreground/40 shadow-sm ring-1 ring-foreground/20"
                    : "bg-card border-border/60 hover:bg-muted/40 hover:border-border"
                )}
              >
                {/* Header row: Profile avatar, Sender name & Date */}
                <div className="flex w-full items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {renderSenderAvatar(email, "size-7")}
                    <div className="min-w-0 flex flex-col">
                      <span className={cn("text-xs truncate", email.unread ? "font-bold text-foreground" : "font-semibold text-foreground/90")}>
                        {email.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate">{email.email}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                    {email.date}
                  </span>
                </div>

                {/* Subject line */}
                <h3 className={cn("text-xs w-full truncate mb-1 pl-9", email.unread ? "font-bold text-foreground" : "font-medium text-foreground/80")}>
                  {email.subject || "(No Subject)"}
                </h3>

                {/* Snippet / Body Preview text */}
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 w-full pl-9 mb-2">
                  {email.snippet || email.body}
                </p>

                {/* Footer: Tags & Star */}
                <div className="flex items-center justify-between w-full pl-9 mt-auto pt-1 border-t border-border/20">
                  <div className="flex items-center gap-1 flex-wrap">
                    {email.tags && email.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider border border-border bg-muted/60 text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  {email.favorite && (
                    <Star className="size-3 text-foreground fill-foreground shrink-0 ml-auto" />
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden font-sans gap-4 p-4 md:p-6">

        {/* Upgraded Dashboard Header & Visual Telemetry Widget (Brain Dashboard style) */}
        <div className="flex flex-col gap-3 p-4 rounded-2xl border border-border/80 bg-card/40 backdrop-blur-md shrink-0 shadow-sm relative">

          {/* Header Row */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                className="lg:hidden p-1.5 border border-border hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground shrink-0 transition-colors"
              >
                <Menu className="size-4.5" />
              </button>
              <button
                onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)}
                title={desktopSidebarOpen ? "Collapse email sidebar" : "Expand email sidebar"}
                className="hidden lg:inline-flex p-1.5 border border-border hover:bg-muted rounded-lg text-foreground shrink-0 transition-colors cursor-pointer"
              >
                {desktopSidebarOpen ? <PanelLeftClose className="size-4.5" /> : <PanelLeftOpen className="size-4.5" />}
              </button>
              <div className="size-9.5 rounded-xl bg-foreground/10 border border-border flex items-center justify-center shadow-inner">
                <Mail className="size-5 text-foreground" />
              </div>
              <div>
                <h1 className="text-md font-extrabold tracking-tight text-foreground select-none flex items-center gap-2">
                  Mailroom Dashboard & AI Engine
                </h1>
                <p className="text-[10px] text-muted-foreground select-none">
                  Smart inbox telemetry, AI Copilot triggers, and secure SMTP engine
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Telemetry Visuals Toggle */}
              <button
                onClick={() => setShowVisuals(!showVisuals)}
                title={showVisuals ? "Hide Analytics Visuals" : "Show Analytics Visuals"}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-[10px] font-semibold text-foreground transition-colors cursor-pointer"
              >
                <Activity className="size-3.5 text-foreground" />
                <span>{showVisuals ? "Hide Visuals" : "Show Visuals"}</span>
              </button>

              {/* SMTP Status */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-muted/40 text-[10px] font-semibold text-foreground select-none cursor-help hover:bg-muted/80 transition-colors">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Google SMTP Secure</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  Configure SMTP details in your .env variables to dispatch real emails over SMTP.
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Brain Dashboard Style Visual Analytics Bar */}
          {showVisuals && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-border/40 select-none">

              {/* Metric 1: Total Emails & Read Ratio */}
              <div className="p-2.5 rounded-xl bg-card border border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-lg bg-muted border border-border flex items-center justify-center">
                    <Inbox className="size-3.5 text-foreground" />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-medium">Total Inbox</span>
                    <span className="text-xs font-bold text-foreground">{emails.length} emails</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-muted-foreground block">Unread</span>
                  <span className="text-xs font-bold text-foreground">{emails.filter(e => e.unread).length}</span>
                </div>
              </div>

              {/* Metric 2: AI Copilot Assistant Engine Status */}
              <div className="p-2.5 rounded-xl bg-card border border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-lg bg-muted border border-border flex items-center justify-center">
                    <Sparkles className="size-3.5 text-foreground" />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-medium">AI Copilot</span>
                    <span className="text-xs font-bold text-foreground">LangGraph Ready</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] border-border text-foreground font-mono bg-muted">
                  ~120ms
                </Badge>
              </div>

              {/* Metric 3: SMTP Connection Telemetry */}
              <div className="p-2.5 rounded-xl bg-card border border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-lg bg-muted border border-border flex items-center justify-center">
                    <Gauge className="size-3.5 text-foreground" />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-medium">SMTP Gateway</span>
                    <span className="text-xs font-bold text-foreground">99.9% Uptime</span>
                  </div>
                </div>
                <span className="text-[9px] text-emerald-500 font-semibold font-mono">TLS 587</span>
              </div>

              {/* Metric 4: Category Visual Breakdown Bar */}
              <div className="p-2.5 rounded-xl bg-card border border-border/60 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-muted-foreground font-medium">Inbox Distribution</span>
                  <span className="text-foreground font-bold">{emails.length} items</span>
                </div>
                {/* Visual Progress Meter */}
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden flex">
                  <div className="h-full bg-blue-500" style={{ width: "45%" }} title="Work 45%" />
                  <div className="h-full bg-teal-500" style={{ width: "25%" }} title="Updates 25%" />
                  <div className="h-full bg-orange-500" style={{ width: "15%" }} title="Social 15%" />
                  <div className="h-full bg-pink-500" style={{ width: "15%" }} title="Promotions 15%" />
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Main Work Area Container */}
        <div className="flex-1 flex gap-4 min-h-0 relative">

          {/* MOBILE OVERLAY SIDEBAR */}
          {mobileSidebarOpen && (
            <div className="fixed inset-0 z-50 flex lg:hidden bg-background/80 backdrop-blur-sm">
              <div className="w-[260px] h-full p-4 relative bg-card shadow-2xl flex flex-col border-r border-border">
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="absolute top-4 right-4 p-1 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
                <div className="mt-8 flex-1 overflow-hidden">
                  {renderSidebar()}
                </div>
              </div>
              <div className="flex-1" onClick={() => setMobileSidebarOpen(false)} />
            </div>
          )}

          {/* DESKTOP SIDEBAR CONTAINER (COLUMN 1) */}
          {desktopSidebarOpen && (
            <div className="hidden lg:block w-[190px] shrink-0 h-full transition-all duration-300">
              {renderSidebar()}
            </div>
          )}

          {/* SPLIT GROUP WORKSPACE PANEL CONTAINER (COLUMNS 2 & 3) */}
          <div className="flex-1 min-w-0 h-full relative">
            {!isDetailPaneOpen ? (
              /* When detail pane is closed, render Email List in 100% full-width container without ResizablePanelGroup */
              <div className="h-full w-full bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
                {renderEmailList()}
              </div>
            ) : (
              /* When detail pane is open, render 2-panel ResizablePanelGroup */
              <ResizablePanelGroup direction="horizontal">
                {/* ─── COLUMN 2: EMAIL LIST ─── */}
                <ResizablePanel
                  defaultSize={34}
                  minSize={25}
                  maxSize={45}
                  className={cn(
                    "h-full flex-col min-w-0 bg-card border border-border rounded-2xl shadow-sm overflow-hidden",
                    mobileView !== "list" && "hidden md:flex",
                    mobileView === "list" && "flex"
                  )}
                >
                  {renderEmailList()}
                </ResizablePanel>

                <ResizableHandle withHandle className="hidden md:flex bg-border/40 hover:bg-foreground/20 transition-colors mx-1 rounded-full" />

                {/* ─── COLUMN 3: DETAIL PREVIEW OR EDITOR COMPONENT ─── */}
                <ResizablePanel
                  defaultSize={66}
                  minSize={55}
                  className={cn(
                    "h-full min-w-0 bg-card border border-border rounded-2xl shadow-sm overflow-hidden",
                    mobileView !== "detail" && mobileView !== "compose" && "hidden md:block",
                    (mobileView === "detail" || mobileView === "compose") && "block"
                  )}
                >
                  <div className="flex h-full w-full relative overflow-hidden">

                    {composeMode ? (
                      /* ─── WRITE MODE: EMAIL COMPOSER ─── */
                      <div className="flex flex-1 flex-col h-full bg-background/5 p-4 overflow-y-auto">
                        <div className="flex flex-col flex-1 rounded-2xl border border-border/80 bg-card shadow-xl overflow-hidden relative">
                          {/* Composer Header */}
                          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 shrink-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider bg-muted border-border text-foreground">
                                {composeMode === "reply" ? "Reply" : composeMode === "edit" ? "Edit" : "Compose"}
                              </Badge>
                              <span className="text-xs text-muted-foreground font-semibold truncate max-w-[200px] select-none">
                                {composeMode === "reply" ? `Re: ${selectedEmail?.subject}` : composeMode === "edit" ? `Edit: ${selectedEmail?.subject}` : "New Message"}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {/* Toggle AI Assist Panel */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setAiAssistantOpen(!aiAssistantOpen)}
                                    className="text-xs gap-1.5 h-8 px-3 border border-border rounded-xl transition-all font-semibold"
                                  >
                                    <Sparkles className="size-3.5 text-foreground" />
                                    Generate
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {aiAssistantOpen ? "Hide AI assistant drawer" : "Show AI assistant drawer"}
                                </TooltipContent>
                              </Tooltip>

                              {/* Discard / Close email writer button (Top Right Corner) */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon-sm"
                                    variant="outline"
                                    onClick={closeDetailPane}
                                    aria-label="Close email writer"
                                    className="h-8 w-8 text-foreground hover:bg-muted border border-border rounded-xl cursor-pointer shadow-xs transition-all ml-1 shrink-0"
                                  >
                                    <X className="size-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Close email writer</TooltipContent>
                              </Tooltip>
                            </div>
                          </div>

                          {/* Fields Panel */}
                          <div className="px-4 py-3 flex flex-col gap-3 border-b border-border bg-card/60">
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground/80 font-bold w-12 text-right shrink-0 select-none">
                                To
                              </span>
                              <Input
                                type="text"
                                placeholder="recipient@example.com"
                                value={composeTo}
                                onChange={(e) => setComposeTo(e.target.value)}
                                className="h-8.5 text-xs bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 placeholder:text-muted-foreground/30 w-full"
                              />
                            </div>
                            <Separator className="bg-border/40" />
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground/80 font-bold w-12 text-right shrink-0 select-none">
                                Subject
                              </span>
                              <Input
                                type="text"
                                placeholder="Add subject line..."
                                value={composeSubject}
                                onChange={(e) => setComposeSubject(e.target.value)}
                                className="h-8.5 text-xs bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 font-medium placeholder:text-muted-foreground/30 w-full"
                              />
                            </div>
                          </div>

                          {/* Toolbar */}
                          <div className="px-4 py-2 border-b border-border bg-muted/20 flex items-center justify-between shrink-0 flex-wrap gap-2 select-none">
                            <div className="flex items-center gap-0.5">
                              <Button size="icon-xs" variant="ghost" className="text-muted-foreground hover:text-foreground">
                                <Heading className="size-3.5" />
                              </Button>
                              <Separator orientation="vertical" className="h-4 mx-1 border-border/80" />
                              <Button size="icon-xs" variant="ghost" className="text-muted-foreground hover:text-foreground">
                                <Bold className="size-3.5" />
                              </Button>
                              <Button size="icon-xs" variant="ghost" className="text-muted-foreground hover:text-foreground">
                                <Italic className="size-3.5" />
                              </Button>
                              <Button size="icon-xs" variant="ghost" className="text-muted-foreground hover:text-foreground">
                                <Strikethrough className="size-3.5" />
                              </Button>
                              <Separator orientation="vertical" className="h-4 mx-1 border-border/80" />
                              <Button size="icon-xs" variant="ghost" className="text-muted-foreground hover:text-foreground">
                                <List className="size-3.5" />
                              </Button>
                              <Button size="icon-xs" variant="ghost" className="text-muted-foreground hover:text-foreground">
                                <Link2 className="size-3.5" />
                              </Button>
                              <Button size="icon-xs" variant="ghost" className="text-muted-foreground hover:text-foreground">
                                <Paperclip className="size-3.5" />
                              </Button>
                              <Button size="icon-xs" variant="ghost" className="text-muted-foreground hover:text-foreground">
                                <Smile className="size-3.5" />
                              </Button>
                            </div>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setAiAssistantOpen(true)}
                              className="h-7 text-[10px] font-semibold border-border text-foreground bg-muted/30 hover:bg-muted gap-1.5 px-2.5 rounded-lg transition-all shrink-0 ml-2"
                            >
                              <Sparkles className="size-3 text-foreground" />
                              <span>Generate</span>
                            </Button>
                          </div>

                          {/* Editor Text Block */}
                          <div className="flex-1 p-4 bg-card flex flex-col overflow-y-auto gap-3">
                            {/* Quick AI Copilot Assistant Trigger Prompt Bar */}
                            {/* <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/20 border border-border shadow-xs">
                              <Sparkles className="size-3.5 text-foreground shrink-0 ml-1" />
                              <Input
                                type="text"
                                placeholder="Prompt AI Copilot (e.g., 'Write polite follow-up email')..."
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") generateAIDraft();
                                }}
                                className="h-8 text-xs border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50"
                              />
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={generateAIDraft}
                                disabled={isGenerating || !aiPrompt.trim()}
                                className="h-7 text-[10px] font-semibold border border-border bg-card text-foreground hover:bg-muted shrink-0"
                              >
                                {isGenerating ? <RefreshCw className="size-3 animate-spin" /> : "Generate"}
                              </Button>
                            </div>
 */}
                            <textarea
                              placeholder="Type your message here..."
                              value={composeBody}
                              onChange={(e) => setComposeBody(e.target.value)}
                              className="w-full flex-1 min-h-[160px] bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 border-0 focus:outline-none resize-none leading-relaxed font-sans"
                            />

                            {/* Footer Buttons */}
                            <div className="flex items-center justify-between border-t border-border pt-3 mt-auto shrink-0 select-none">
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={closeDetailPane}
                                  className="text-xs text-muted-foreground hover:text-foreground h-9 px-3 rounded-xl border border-border"
                                >
                                  Cancel
                                </Button>
                              </div>

                              <Button
                                size="sm"
                                onClick={async () => {
                                  if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) {
                                    toast.error("Please fill in recipient, subject, and message body.");
                                    return;
                                  }

                                  try {
                                    const token = localStorage.getItem("token");
                                    const res = await fetch(`${API_BASE_URL}/emails`, {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                        Authorization: `Bearer ${token}`
                                      },
                                      body: JSON.stringify({
                                        name: composeTo.split("@")[0] || "Recipient",
                                        email: composeTo,
                                        subject: composeSubject,
                                        body: composeBody,
                                        snippet: composeBody.slice(0, 80),
                                        date: "Just now",
                                        folder: "sent",
                                        category: "work",
                                        unread: false,
                                        favorite: false,
                                        tags: ["Sent", "Real SMTP"]
                                      })
                                    });

                                    if (res.ok) {
                                      const newEmailObj = await res.json();
                                      setEmails([newEmailObj, ...emails]);
                                      toast.success(`Email sent via SMTP to ${composeTo}!`);
                                    } else {
                                      toast.error("Backend dispatch error.");
                                    }
                                  } catch (e) {
                                    console.error("Failed to send email", e);
                                    toast.error("Failed to send email over SMTP connection.");
                                  }
                                  closeDetailPane();
                                }}
                                className="text-xs h-9 px-4 bg-foreground hover:bg-foreground/90 text-background font-semibold rounded-xl shadow-sm border border-foreground/10"
                              >
                                <Send className="size-3.5 mr-1.5" />
                                Send Email
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* ─── READ MODE: VIEW EMAIL PANE ─── */
                      <div className="flex flex-1 flex-col h-full bg-background/20 relative">

                        {/* Top Action Ribbon */}
                        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/20 min-h-13 shrink-0 select-none flex-wrap gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">

                            {/* Back Button for mobile view */}
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => setMobileView("list")}
                              className="md:hidden text-muted-foreground mr-1 h-8 w-8 hover:bg-muted border rounded-xl border-transparent"
                            >
                              <ArrowLeft className="size-4" />
                            </Button>

                            {/* Archive Action */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon-sm"
                                  variant="outline"
                                  className="text-foreground hover:bg-muted rounded-xl h-8 w-8 border-border bg-card/40"
                                  onClick={async () => {
                                    if (!selectedEmailId) return;
                                    try {
                                      const token = localStorage.getItem("token");
                                      const res = await fetch(`${API_BASE_URL}/emails/${selectedEmailId}`, {
                                        method: "PUT",
                                        headers: {
                                          "Content-Type": "application/json",
                                          Authorization: `Bearer ${token}`
                                        },
                                        body: JSON.stringify({ folder: "archive" })
                                      });
                                      if (res.ok) {
                                        const updated = await res.json();
                                        setEmails(emails.map((e) => e.id === selectedEmailId ? updated : e));
                                        toast.success("Email moved to archive.");
                                      }
                                    } catch (err) {
                                      console.error("Failed to archive email", err);
                                    }
                                  }}
                                >
                                  <Archive className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Archive</TooltipContent>
                            </Tooltip>

                            {/* Trash Action */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon-sm"
                                  variant="outline"
                                  className="text-foreground hover:bg-muted rounded-xl h-8 w-8 border-border bg-card/40"
                                  onClick={async () => {
                                    if (!selectedEmailId) return;
                                    try {
                                      const token = localStorage.getItem("token");
                                      const res = await fetch(`${API_BASE_URL}/emails/${selectedEmailId}`, {
                                        method: "DELETE",
                                        headers: {
                                          Authorization: `Bearer ${token}`
                                        }
                                      });
                                      if (res.ok) {
                                        setEmails(emails.filter((e) => e.id !== selectedEmailId));
                                        closeDetailPane();
                                        toast.success("Email deleted.");
                                      }
                                    } catch (err) {
                                      console.error("Failed to delete email", err);
                                    }
                                  }}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete</TooltipContent>
                            </Tooltip>

                            {/* Mark Unread Action */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon-sm"
                                  variant="outline"
                                  onClick={async () => {
                                    if (!selectedEmailId || !selectedEmail) return;
                                    try {
                                      const token = localStorage.getItem("token");
                                      const res = await fetch(`${API_BASE_URL}/emails/${selectedEmailId}`, {
                                        method: "PUT",
                                        headers: {
                                          "Content-Type": "application/json",
                                          Authorization: `Bearer ${token}`
                                        },
                                        body: JSON.stringify({ unread: !selectedEmail.unread })
                                      });
                                      if (res.ok) {
                                        const updated = await res.json();
                                        setEmails(emails.map((e) => e.id === selectedEmailId ? updated : e));
                                        toast.success(updated.unread ? "Marked as unread" : "Marked as read");
                                      }
                                    } catch (err) {
                                      console.error("Failed to mark unread", err);
                                    }
                                  }}
                                  className="text-foreground hover:bg-muted rounded-xl h-8 w-8 border-border bg-card/40"
                                >
                                  <Inbox className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {selectedEmail?.unread ? "Mark as Read" : "Mark as Unread"}
                              </TooltipContent>
                            </Tooltip>

                            {/* Favorite/Star Action */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon-sm"
                                  variant="outline"
                                  onClick={async () => {
                                    if (!selectedEmailId || !selectedEmail) return;
                                    try {
                                      const token = localStorage.getItem("token");
                                      const res = await fetch(`${API_BASE_URL}/emails/${selectedEmailId}`, {
                                        method: "PUT",
                                        headers: {
                                          "Content-Type": "application/json",
                                          Authorization: `Bearer ${token}`
                                        },
                                        body: JSON.stringify({ favorite: !selectedEmail.favorite })
                                      });
                                      if (res.ok) {
                                        const updated = await res.json();
                                        setEmails(emails.map((e) => e.id === selectedEmailId ? updated : e));
                                        toast.success(updated.favorite ? "Added to Starred" : "Removed from Starred");
                                      }
                                    } catch (err) {
                                      console.error("Failed to toggle favorite email", err);
                                    }
                                  }}
                                  className="text-foreground hover:bg-muted rounded-xl h-8 w-8 border-border bg-card/40"
                                >
                                  <Star
                                    className={cn(
                                      "size-4 transition-all duration-200",
                                      selectedEmail?.favorite && "fill-foreground text-foreground"
                                    )}
                                  />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {selectedEmail?.favorite ? "Remove Star" : "Add Star"}
                              </TooltipContent>
                            </Tooltip>

                            <Separator orientation="vertical" className="h-4.5 mx-1 hidden sm:block" />

                            {/* Action integrations & AI Copilot buttons */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setAiAssistantOpen(!aiAssistantOpen)}
                                className="h-8 text-xs font-semibold border-border text-foreground hover:bg-muted bg-card/40 gap-1.5 px-3 rounded-xl transition-colors"
                              >
                                <Sparkles className="size-3.5" />
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => selectedEmail && convertEmailToTask(selectedEmail)}
                                className="h-8 text-xs font-semibold border-border text-foreground hover:bg-muted bg-card/40 gap-1.5 px-3 rounded-xl transition-colors"
                              >
                                <CheckSquare className="size-3.5" /> Convert to Task
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => selectedEmail && convertEmailToEvent(selectedEmail)}
                                className="h-8 text-xs font-semibold border-border text-foreground hover:bg-muted bg-card/40 gap-1.5 px-3 rounded-xl transition-colors"
                              >
                                <MailQuestion className="size-3.5" /> Create Event
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => selectedEmail && convertEmailToNote(selectedEmail)}
                                className="h-8 text-xs font-semibold border-border text-foreground hover:bg-muted bg-card/40 gap-1.5 px-3 rounded-xl transition-colors"
                              >
                                <FileText className="size-3.5" /> Save Note
                              </Button>
                            </div>
                          </div>

                          {/* Navigation Ribbon actions (reply, edit, reply all, forward) */}
                          <div className="flex items-center gap-1.5">
                            {/* <Button
                              size="sm"
                              variant="outline"
                              onClick={triggerReply}
                              className="h-8 text-xs font-semibold border-border text-foreground hover:bg-muted bg-card/40 gap-1.5 px-3 rounded-xl transition-colors"
                            >
                              <Reply className="size-3.5" /> Reply
                            </Button> */}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={triggerEdit}
                              className="h-8 text-xs font-semibold border-border text-foreground hover:bg-muted bg-card/40 gap-1.5 px-3 rounded-xl transition-colors"
                            >
                              <PenSquare className="size-3.5" /> Edit
                            </Button>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="icon-sm" variant="outline" onClick={triggerReply} className="text-foreground hover:bg-muted rounded-xl h-8 w-8 border-border bg-card/40">
                                  <ReplyAll className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Reply All</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="icon-sm" variant="outline" className="text-foreground hover:bg-muted rounded-xl h-8 w-8 border-border bg-card/40">
                                  <Forward className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Forward</TooltipContent>
                            </Tooltip>

                            {/* Close Detail View Button */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon-sm"
                                  variant="outline"
                                  onClick={closeDetailPane}
                                  className="text-foreground hover:bg-muted rounded-xl h-8 w-8 border-border bg-card/40 ml-1 shrink-0 cursor-pointer"
                                >
                                  <X className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Close email view</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>

                        {/* Read Pane body */}
                        {selectedEmail ? (
                          <div className="flex-1 overflow-y-auto scrollbar-thin p-5 flex flex-col gap-6 min-h-0">

                            {/* Sender Details Header */}
                            <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border/60 bg-card/25 backdrop-blur-md">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border border-border shadow bg-primary/10">
                                  <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                                    {selectedEmail.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <span className="text-sm font-bold text-foreground block">
                                    {selectedEmail.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground block font-medium">
                                    &lt;{selectedEmail.email}&gt;
                                  </span>
                                </div>
                              </div>
                              <span className="text-xs text-muted-foreground font-semibold shrink-0 bg-muted/40 border border-border px-2.5 py-1 rounded-lg">
                                {selectedEmail.date}
                              </span>
                            </div>

                            {/* Subject Title */}
                            <div>
                              <h2 className="text-lg font-bold tracking-tight text-foreground leading-snug">
                                {selectedEmail.subject}
                              </h2>
                            </div>

                            <Separator className="bg-border/60" />

                            {/* Email Message Content Body */}
                            <div className="text-xs text-foreground/90 leading-relaxed font-sans whitespace-pre-wrap rounded-xl p-4 bg-card/30 border border-border/40 shadow-inner">
                              {selectedEmail.body}
                            </div>

                            {/* Quick Integrations Footer Bar inside Detail View */}
                            <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between gap-2 flex-wrap select-none">
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={triggerReply}
                                  className="text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 gap-1.5 h-8.5 px-4 rounded-xl border border-foreground/10"
                                >
                                  <Reply className="size-3.5" /> Reply
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={triggerEdit}
                                  className="text-xs font-semibold border-border text-foreground hover:bg-muted gap-1.5 h-8.5 px-4 rounded-xl"
                                >
                                  <PenSquare className="size-3.5" /> Edit Message
                                </Button>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => convertEmailToTask(selectedEmail)}
                                  className="text-[10px] font-semibold border-border text-foreground hover:bg-muted gap-1 flex-1 h-8.5 rounded-xl"
                                >
                                  <CheckSquare className="size-3" /> Task
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => convertEmailToEvent(selectedEmail)}
                                  className="text-[10px] font-semibold border-border text-foreground hover:bg-muted gap-1 flex-1 h-8.5 rounded-xl"
                                >
                                  <MailQuestion className="size-3" /> Event
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => convertEmailToNote(selectedEmail)}
                                  className="text-[10px] font-semibold border-border text-foreground hover:bg-muted gap-1 flex-1 h-8.5 rounded-xl"
                                >
                                  <FileText className="size-3" /> Note
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3 select-none bg-background/5">
                            <div className="size-14 rounded-2xl bg-muted border border-border/80 flex items-center justify-center text-muted-foreground/35 shadow-inner">
                              <Inbox className="size-7" />
                            </div>
                            <span className="text-sm font-semibold">Select an email to view details</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            )}
          </div>

          {/* ─── COLUMN 4: AI COPILOT DRAFT ASSISTANT DRAWER PANEL ─── */}
          {aiAssistantOpen && (
            <div className="fixed inset-y-0 right-0 z-40 w-[320px] bg-card border-l border-border shadow-2xl flex flex-col lg:relative lg:inset-y-auto lg:right-auto lg:z-0 lg:w-[280px] xl:w-[320px] h-full lg:rounded-2xl lg:border border-border/80 lg:overflow-hidden select-none">
              {/* Copilot Header */}
              <div className="px-4 py-3.5 flex items-center justify-between border-b border-border bg-muted/30 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="flex size-7.5 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shadow-inner">
                    <Bot className="size-4.5 text-primary" />
                  </div>
                  <div>
                    <span className="font-bold text-foreground text-xs block">AI Copilot</span>
                    <span className="text-[9px] text-muted-foreground block font-medium">
                      Smart Assistant Engine
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setAiAssistantOpen(false)}
                  className="p-1 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              </div>

              {/* Chat Feed & Draft Display */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto scrollbar-thin p-4 flex flex-col gap-4 min-h-0">
                  <div className="flex gap-2.5 items-start text-xs">
                    <div className="size-6.5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-inner">
                      <Bot className="size-3.5 text-primary" />
                    </div>
                    <div className="bg-muted/40 border border-border/60 rounded-xl p-3 text-foreground leading-relaxed max-w-[85%] shadow-sm">
                      Hello! I can help you draft a response, rewrite drafts, or summarize this email thread. What would you like to do?
                    </div>
                  </div>

                  {aiChat.map((msg, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex gap-2.5 items-start text-xs w-full",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {msg.role !== "user" && (
                        <div className="size-6.5 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 shadow-inner">
                          <Bot className="size-3.5 text-foreground" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "rounded-xl p-3 leading-relaxed max-w-[85%] border shadow-sm",
                          msg.role === "user"
                            ? "bg-foreground text-background border-foreground/10 ml-auto font-medium"
                            : "bg-muted/40 border-border/60 text-foreground"
                        )}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}

                  {/* AI Generating Animation */}
                  {isGenerating && (
                    <div className="flex gap-2.5 items-start text-xs">
                      <div className="size-6.5 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 animate-pulse">
                        <Bot className="size-3.5 text-foreground" />
                      </div>
                      <div className="bg-muted/30 border border-border/40 rounded-xl p-3 text-muted-foreground leading-relaxed max-w-[85%] flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-foreground opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-foreground"></span>
                        </span>
                        <span className="font-medium">Formulating draft...</span>
                      </div>
                    </div>
                  )}

                  {/* Draft Preview card container */}
                  {aiDraft && !isGenerating && (
                    <Card className="border border-border bg-card/60 shadow-sm">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between gap-1.5 text-foreground font-bold mb-2 text-[10px] uppercase tracking-wider select-none">
                          <div className="flex items-center gap-1">
                            <Sparkles className="size-3.5" />
                            <span>AI Copilot Draft Editor</span>
                          </div>
                          <Badge variant="outline" className="text-[8px] border-border text-foreground py-0 px-1 font-mono uppercase bg-muted">Editable</Badge>
                        </div>
                        <Textarea
                          value={aiDraft}
                          onChange={(e) => setAiDraft(e.target.value)}
                          placeholder="Edit AI Copilot draft..."
                          className="text-[11px] text-foreground bg-background/50 border-border focus-visible:ring-border leading-relaxed font-sans min-h-[110px] rounded-lg p-2.5 resize-y"
                        />
                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            size="sm"
                            onClick={handleApplyDraft}
                            className="flex-1 text-xs h-8 bg-foreground hover:bg-foreground/90 text-background font-semibold rounded-xl border border-foreground/10"
                          >
                            Apply Draft to Mail
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(aiDraft);
                              toast.success("Draft copied to clipboard!");
                            }}
                            className="text-xs h-8 px-2.5 border-border hover:bg-muted font-bold rounded-xl"
                            title="Copy draft"
                          >
                            <Copy className="size-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div ref={chatBottomRef} />
                </div>

                {/* Tone Selectors and Input Footer */}
                <div className="p-3.5 border-t border-border bg-background flex flex-col gap-3 shrink-0">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Draft Tone:</span>
                    <div className="flex gap-0.5 bg-muted/40 p-0.5 rounded-lg border border-border">
                      {["professional", "friendly", "direct"].map((tone) => (
                        <button
                          key={tone}
                          onClick={() => setAiTone(tone)}
                          className={cn(
                            "px-2 py-0.5 text-[9px] rounded-md capitalize transition-all select-none font-semibold",
                            aiTone === tone
                              ? "bg-card text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {tone}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Prompt Text Input */}
                  <div className="flex items-center gap-1.5 relative">
                    <Input
                      type="text"
                      placeholder="Instruct AI Copilot..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && generateAIDraft()}
                      className="h-8.5 text-xs pr-8 bg-muted/20 border-border rounded-xl"
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          onClick={generateAIDraft}
                          disabled={!aiPrompt.trim() || isGenerating}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-primary hover:text-primary/85 disabled:text-muted-foreground"
                        >
                          <ArrowRight className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Generate draft</TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Suggestion Quick Tags */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => {
                        setAiPrompt("Generate a clean summary of the current email thread with bold action points.");
                        setTimeout(() => generateAIDraft(), 50);
                      }}
                      className="text-[9px] h-6 justify-start font-medium text-left truncate rounded-md hover:bg-muted border-border"
                    >
                      Summarize Thread
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => {
                        setAiPrompt("Decline this reminder/request politely due to schedule limits.");
                        setTimeout(() => generateAIDraft(), 50);
                      }}
                      className="text-[9px] h-6 justify-start font-medium text-left truncate rounded-md hover:bg-muted border-border"
                    >
                      Decline Politely
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </TooltipProvider>
  );
}
