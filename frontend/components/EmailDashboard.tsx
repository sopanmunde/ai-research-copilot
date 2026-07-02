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

const initialEmails: Email[] = [
  {
    id: "1",
    name: "William Smith",
    email: "williamsmith@example.com",
    subject: "Meeting Tomorrow",
    date: "4 months ago",
    fullDate: "Oct 22, 2023, 9:00:00 AM",
    snippet:
      "Hi, let's have a meeting tomorrow to discuss the project. I've been reviewing the project details and have some ideas I'd like to share. It's crucial that we align on our next steps...",
    body: "Hi, let's have a meeting tomorrow to discuss the project. I've been reviewing the project details and have some ideas I'd like to share. It's crucial that we align on our next steps to ensure the project's success.\n\nPlease come prepared with any questions or insights you may have. Looking forward to our meeting!\n\nBest regards,\nWilliam",
    tags: ["meeting", "work", "important"],
    unread: false,
    favorite: true,
    folder: "inbox",
  },
  {
    id: "2",
    name: "Alice Smith",
    email: "alicesmith@example.com",
    subject: "Re: Project Update",
    date: "4 months ago",
    fullDate: "Oct 20, 2023, 2:15:00 PM",
    snippet:
      "Thank you for the project update. It looks great! I've gone through the report, and the progress is impressive. The team has done a fantastic job of meeting our milestones...",
    body: "Thank you for the project update. It looks great! I've gone through the report, and the progress is impressive. The team has done a fantastic job of meeting our milestones on time.\n\nI have a few small comments on the dashboard component spacing, but overall it is ready for review. Let's schedule a brief sync to finalize deployment.\n\nThanks,\nAlice",
    tags: ["work", "important"],
    unread: true,
    favorite: false,
    folder: "inbox",
  },
  {
    id: "3",
    name: "Bob Johnson",
    email: "bobjohnson@example.com",
    subject: "Weekend Plans",
    date: "about 3 years ago",
    fullDate: "Jun 12, 2021, 11:30:00 AM",
    snippet:
      "Any plans for the weekend? I was thinking of going hiking in the nearby mountains. It's been a while since we had some outdoor fun. If you're interested, let me know, and we...",
    body: "Any plans for the weekend? I was thinking of going hiking in the nearby mountains. It's been a while since we had some outdoor fun. If you're interested, let me know, and we can plan the details.\n\nI was looking at the Mount Mitchell trail which has excellent views. Weather forecast looks sunny!\n\nCheers,\nBob",
    tags: ["personal"],
    unread: false,
    favorite: true,
    folder: "inbox",
  },
  {
    id: "4",
    name: "Emily Davis",
    email: "emilydavis@example.com",
    subject: "Re: Question about Budget",
    date: "over 3 years ago",
    fullDate: "Apr 5, 2021, 4:45:00 PM",
    snippet:
      "I have a question about the budget for the upcoming project. It seems like there's a discrepancy in the allocation of resources. I've reviewed the budget report and noticed...",
    body: "I have a question about the budget for the upcoming project. It seems like there's a discrepancy in the allocation of resources. I've reviewed the budget report and noticed that design engineering is allocated 15% less than originally agreed.\n\nCould we review the spreadsheet together sometime tomorrow morning?\n\nBest,\nEmily",
    tags: ["work", "budget"],
    unread: false,
    favorite: false,
    folder: "inbox",
  },
  {
    id: "5",
    name: "Michael Wilson",
    email: "michaelwilson@example.com",
    subject: "Important Announcement",
    date: "over 3 years ago",
    fullDate: "Mar 10, 2021, 3:00:00 PM",
    snippet:
      "I have an important announcement to make during our team meeting. It pertains to a strategic shift in our approach to the upcoming product launch. We've received valuable...",
    body: "I have an important announcement to make during our team meeting. It pertains to a strategic shift in our approach to the upcoming product launch. We've received valuable feedback from our beta testers, and I believe it's time to make some adjustments to better meet our customers' needs.\n\nThis change is crucial to our success, and I look forward to discussing it with the team. Please be prepared to share your insights during the meeting.\n\nRegards,\nMichael",
    tags: ["work"],
    unread: true,
    favorite: false,
    folder: "inbox",
  },
  {
    id: "6",
    name: "Draft Recipient",
    email: "draft@example.com",
    subject: "Draft: Spacing issues on dashboard",
    date: "1 day ago",
    fullDate: "Yesterday, 6:00:00 PM",
    snippet:
      "This is a draft containing notes on UI spacing issues that we need to fix before the presentation tomorrow...",
    body: "This is a draft containing notes on UI spacing issues that we need to fix before the presentation tomorrow.\n\nMake sure Tailwind config is set up correctly and padding is consistent.",
    tags: ["work"],
    unread: false,
    favorite: false,
    folder: "drafts",
  },
  {
    id: "7",
    name: "Sarah Connor",
    email: "sarah.connor@sky.net",
    subject: "Sent: Re: Project Milestones",
    date: "2 weeks ago",
    fullDate: "Oct 5, 2023, 10:00:00 AM",
    snippet:
      "I have successfully pushed the latest modifications. The system is functional and ready for testing. Please confirm receipt...",
    body: "I have successfully pushed the latest modifications. The system is functional and ready for testing. Please confirm receipt.",
    tags: ["work", "important"],
    unread: false,
    favorite: false,
    folder: "sent",
  },
  {
    id: "8",
    name: "Promo Bot",
    email: "promobot@example.com",
    subject: "Claim your free account upgrade",
    date: "3 weeks ago",
    fullDate: "Sep 28, 2023, 11:00:00 AM",
    snippet:
      "Congratulations! You have been selected to win a free account upgrade. Click this link immediately to claim...",
    body: "Congratulations! You have been selected to win a free account upgrade. Click this link immediately to claim your reward.",
    tags: ["personal"],
    unread: false,
    favorite: false,
    folder: "trash",
  },
  {
    id: "9",
    name: "HR Department",
    email: "hr@company.com",
    subject: "Performance Review Q3",
    date: "6 months ago",
    fullDate: "Jun 1, 2023, 9:30:00 AM",
    snippet:
      "Attached is the summary of your Q3 performance review. Thank you for your continued dedication and excellent contribution to the team...",
    body: "Attached is the summary of your Q3 performance review. Thank you for your continued dedication and excellent contribution to the team this year.",
    tags: ["work"],
    unread: false,
    favorite: false,
    folder: "archive",
  },
];

export function EmailDashboard() {
  const [emails, setEmails] = useState<Email[]>(initialEmails);
  const [activeNav, setActiveNav] = useState("inbox");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmailId, setSelectedEmailId] = useState("1");
  const [composeMode, setComposeMode] = useState<"new" | "reply" | null>(null);

  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");

  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTone, setAiTone] = useState("professional");
  const [aiDraft, setAiDraft] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiChat, setAiChat] = useState<ChatMessage[]>([]);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const selectedEmail = emails.find((e) => e.id === selectedEmailId) || emails[0];

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
      if (filteredEmails.length > 0) {
        setSelectedEmailId(filteredEmails[0].id);
      } else {
        setSelectedEmailId("");
      }
    }
  }, [activeNav, emails, selectedEmailId, filteredEmails]);

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
      setAiAssistantOpen(false);
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
    }
  };

  const triggerNew = () => {
    setComposeTo("");
    setComposeSubject("");
    setComposeBody("");
    setComposeMode("new");
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

  return (
    <TooltipProvider>
      <div className="flex h-screen w-full bg-background text-foreground overflow-hidden border border-border rounded-xl">
        <ResizablePanelGroup direction="horizontal">
          {/* ─── SIDEBAR ─── */}
          <ResizablePanel defaultSize={14} minSize={12} maxSize={18}>
            <div className="flex flex-col h-full bg-card py-2 gap-3 overflow-y-auto scrollbar-none">
          <div className="px-4 py-2 flex items-center justify-between h-9 shrink-0">
            <span className="font-semibold text-foreground text-xs tracking-tight uppercase opacity-85 flex items-center gap-2 select-none">
              <Inbox className="size-3.5 text-muted-foreground" />
              Email
            </span>
          </div>

          <Separator />

          {/* New Email Compose Button */}
          <div className="px-3 py-1">
            <button
              onClick={triggerNew}
              className="relative w-full overflow-hidden rounded-xl border border-border bg-muted/20 px-3.5 py-2.5 text-xs font-semibold text-foreground transition-all duration-300 hover:border-zinc-700/80 hover:bg-muted/40 shadow-sm hover:shadow-[0_0_15px_rgba(255,255,255,0.03)] active:scale-98 flex items-center justify-center gap-2 group cursor-pointer"
            >
              {/* Inner double border highlight effect */}
              <span className="absolute inset-0 rounded-xl border border-white/[0.02] pointer-events-none" />
              
              <Plus className="size-4 text-indigo-400 group-hover:rotate-90 group-hover:scale-110 transition-all duration-300" />
              <span className="tracking-tight">New Email</span>
            </button>
          </div>

          <div className="px-2 flex flex-col gap-0.5">
            {folderItems.map((item) => {
              const count = getNavCount(item.id);
              const isActive = activeNav === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveNav(item.id);
                    setComposeMode(null);
                  }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-1.5 text-xs font-medium rounded-md transition-all text-left w-full",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{item.label}</span>
                  {count > 0 && (
                    <span
                      className={cn(
                        "ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-medium min-w-5 text-center",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground border border-border"
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <Separator />

          <div className="px-2 flex flex-col gap-0.5">
            <span className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Categories
            </span>
            {categoryItems.map((item) => {
              const count = getNavCount(item.id);
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveNav(item.id);
                    setComposeMode(null);
                  }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-1.5 text-xs font-medium rounded-md transition-all text-left w-full",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                  )}
                >
                  <span
                        className={cn(
                          "size-1.5 rounded-full shrink-0",
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
                        "ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-medium min-w-5 text-center",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground border border-border"
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
      </ResizablePanel>

      <ResizableHandle withHandle className="bg-zinc-800 dark:bg-zinc-800 hover:bg-zinc-700/80 transition-colors" />

      {/* ─── EMAIL LIST ─── */}
      <ResizablePanel defaultSize={26} minSize={20} maxSize={35}>
        <div className="flex flex-col bg-background relative h-full overflow-hidden w-full">
          {/* Top/Bottom Fade overlays for premium scrolling */}
          <div className="absolute top-[96px] left-0 right-0 h-3 bg-gradient-to-b from-background to-transparent pointer-events-none z-10" />
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
          {/* Header Pane */}
          <div className="px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight text-foreground capitalize select-none">
              {activeNav}
            </h1>
            
            {/* Filter Toggle Switcher */}
            <div className="flex bg-muted/40 border border-border p-0.5 rounded-lg shrink-0">
              <button
                onClick={() => setSelectedFilter("all")}
                className={cn(
                  "px-3 py-1 rounded-md text-[10px] font-medium transition-all select-none",
                  selectedFilter === "all" 
                    ? "bg-muted text-foreground border border-border shadow-sm font-semibold" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                All
              </button>
              <button
                onClick={() => setSelectedFilter("unread")}
                className={cn(
                  "px-3 py-1 rounded-md text-[10px] font-medium transition-all select-none",
                  selectedFilter === "unread" 
                    ? "bg-muted text-foreground border border-border shadow-sm font-semibold" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Unread
              </button>
            </div>
          </div>

          {/* Search container */}
          <div className="px-3 pb-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-muted/30 border-border placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-zinc-700"
              />
            </div>
          </div>

          <Separator className="bg-border/60" />

          {/* Scrollable Email list */}
          <div className="flex-1 overflow-y-auto scrollbar-thin min-h-0">
            <div className="p-3 flex flex-col gap-2">
              {filteredEmails.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                  <AlertCircle className="size-8 text-muted-foreground/60" />
                  <span className="text-xs">No emails found</span>
                </div>
              ) : (
                filteredEmails.map((email) => {
                  const isSelected = selectedEmailId === email.id;
                  return (
                    <button
                      key={email.id}
                      onClick={() => {
                        setSelectedEmailId(email.id);
                        setComposeMode(null);
                      }}
                      className={cn(
                        "flex flex-col items-start gap-1.5 p-3.5 text-left rounded-lg transition-all duration-200 border text-xs w-full relative overflow-hidden",
                        isSelected
                          ? "bg-muted/70 border-zinc-600 shadow-md ring-1 ring-zinc-700/30"
                          : "bg-background border-border/50 hover:bg-muted/15 hover:border-zinc-700/80 hover:shadow-[0_0_12px_rgba(255,255,255,0.02)]"
                      )}
                    >
                      <div className="flex w-full items-center justify-between gap-2">
                        <span className="font-semibold text-foreground text-xs">
                          {email.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {email.date}
                        </span>
                      </div>

                      <span className="font-medium text-foreground text-[11px] line-clamp-1">
                        {email.subject}
                      </span>

                      <p className="text-muted-foreground/80 line-clamp-2 leading-relaxed text-[11px]">
                        {email.snippet}
                      </p>

                      <div className="flex items-center gap-1.5 mt-2 flex-wrap w-full">
                        {email.tags.map((tag) => (
                          <span 
                            key={tag} 
                            className={cn(
                              "px-2 py-0.5 rounded-md text-[9px] font-semibold border transition-all",
                              tag === "work" 
                                ? "bg-zinc-100 text-zinc-900 border-zinc-200/20" 
                                : tag === "personal"
                                ? "bg-zinc-900 text-zinc-400 border-zinc-800/80"
                                : "bg-zinc-800 text-zinc-300 border-zinc-700/50"
                            )}
                          >
                            {tag}
                          </span>
                        ))}
                        {email.favorite && (
                          <Star className="size-3 text-amber-500 fill-amber-500 ml-auto shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle className="bg-zinc-800 dark:bg-zinc-800 hover:bg-zinc-700/80 transition-colors" />

      <ResizablePanel defaultSize={60} minSize={40}>
        <div className="flex h-full w-full bg-background relative overflow-hidden">
          {composeMode ? (
            /* ─── COMPOSE / EMAIL EDITOR ─── */
            <div className="flex flex-1 flex-col h-full bg-background p-4 overflow-y-auto">
              <div className="flex flex-col flex-1 rounded-xl border border-zinc-700/80 dark:border-zinc-700/80 bg-card shadow-lg overflow-hidden relative">
                {/* Subtle top edge glow highlight */}
                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-zinc-400/20 to-transparent pointer-events-none" />

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700/80 bg-muted/40 shrink-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-semibold uppercase tracking-wider bg-background/50 border-zinc-700/80 text-foreground">
                      {composeMode === "reply" ? "Reply" : "Compose"}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-medium truncate max-w-[200px] sm:max-w-[300px]">
                      {composeMode === "reply"
                        ? `Re: ${selectedEmail?.subject}`
                        : "New Message"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAiAssistantOpen(!aiAssistantOpen)}
                          className={cn(
                            "text-xs gap-1.5 h-8 px-3 border border-zinc-700/80 transition-all font-medium",
                            aiAssistantOpen 
                              ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                              : "bg-background hover:bg-accent"
                          )}
                        >
                          <Sparkles className="size-3.5" />
                          AI Pilot
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {aiAssistantOpen ? "Hide AI assistant" : "Show AI assistant"}
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          size="icon-sm" 
                          variant="ghost" 
                          onClick={() => setComposeMode(null)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md"
                        >
                          <X className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Discard draft</TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {/* Fields */}
                <div className="px-4 py-2.5 flex flex-col gap-2 border-b border-zinc-700/80 bg-card">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground/75 font-semibold w-14 text-right shrink-0">
                      To
                    </span>
                    <Input
                      type="text"
                      placeholder="recipient@example.com"
                      value={composeTo}
                      onChange={(e) => setComposeTo(e.target.value)}
                      className="h-8 text-xs bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 placeholder:text-muted-foreground/40 w-full"
                    />
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] text-muted-foreground hover:bg-muted shrink-0 rounded-md px-2">
                      Cc / Bcc
                    </Button>
                  </div>
                  <div className="h-[1px] bg-zinc-700/30 w-full" />
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground/75 font-semibold w-14 text-right shrink-0">
                      Subject
                    </span>
                    <Input
                      type="text"
                      placeholder="Enter subject..."
                      value={composeSubject}
                      onChange={(e) => setComposeSubject(e.target.value)}
                      className="h-8 text-xs bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 placeholder:text-muted-foreground/40 w-full"
                    />
                  </div>
                </div>

                {/* Formatting Toolbar */}
                <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-zinc-700/80 bg-muted/20 overflow-x-auto shrink-0 scrollbar-none">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon-xs" variant="ghost" className="text-muted-foreground hover:text-foreground">
                        <Heading className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Heading</TooltipContent>
                  </Tooltip>
                  <Separator orientation="vertical" className="h-4 mx-1 border-zinc-700/80" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon-xs" variant="ghost" className="text-muted-foreground hover:text-foreground">
                        <Bold className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Bold</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon-xs" variant="ghost" className="text-muted-foreground hover:text-foreground">
                        <Italic className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Italic</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon-xs" variant="ghost" className="text-muted-foreground hover:text-foreground">
                        <Strikethrough className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Strikethrough</TooltipContent>
                  </Tooltip>
                  <Separator orientation="vertical" className="h-4 mx-1 border-zinc-700/80" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon-xs" variant="ghost" className="text-muted-foreground hover:text-foreground">
                        <List className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>List</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon-xs" variant="ghost" className="text-muted-foreground hover:text-foreground">
                        <Link2 className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Insert link</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon-xs" variant="ghost" className="text-muted-foreground hover:text-foreground">
                        <Paperclip className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Attach files</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon-xs" variant="ghost" className="text-muted-foreground hover:text-foreground">
                        <Smile className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Insert emoji</TooltipContent>
                  </Tooltip>
                </div>

                {/* Body Textarea */}
                <div className="flex-1 p-4 bg-card flex flex-col overflow-y-auto">
                  <Textarea
                    placeholder="Write your email here..."
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    className="flex-1 bg-transparent border-0 resize-none text-sm text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 leading-relaxed placeholder:text-muted-foreground/30 p-0 min-h-[180px]"
                  />
                </div>

                {/* Footer / Actions */}
                <div className="p-3 border-t border-zinc-700/80 bg-muted/40 flex items-center justify-between shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setComposeMode(null)}
                    className="text-xs h-9 px-4 border border-zinc-700/80 hover:bg-accent font-medium"
                  >
                    Cancel
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        if (composeTo.trim()) {
                          const newMail: Email = {
                            id: String(emails.length + 1),
                            name: composeTo.split("@")[0].replace(/[^a-zA-Z]/g, " "),
                            email: composeTo,
                            subject: composeSubject || "(No Subject)",
                            date: "Just now",
                            fullDate: new Date().toLocaleString(),
                            snippet: composeBody.substring(0, 100) + "...",
                            body: composeBody,
                            tags: ["work"],
                            unread: false,
                            favorite: false,
                            folder: "sent",
                          };
                          setEmails([newMail, ...emails]);
                          setSelectedEmailId(newMail.id);
                        }
                        setComposeMode(null);
                      }}
                      className="text-xs h-9 px-4 border border-zinc-700/80 bg-foreground text-background hover:bg-foreground/90 font-semibold"
                    >
                      <Send className="size-3.5 mr-1.5" />
                      Send Mail
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ─── READ MODE ─── */
            <div className="flex flex-1 flex-col h-full bg-background">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30 h-12">
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="text-muted-foreground"
                        onClick={() => {
                          setEmails(
                            emails.map((e) =>
                              e.id === selectedEmailId ? { ...e, folder: "archive" } : e
                            )
                          );
                        }}
                      >
                        <Archive className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Archive</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          setEmails(
                            emails.map((e) =>
                              e.id === selectedEmailId ? { ...e, folder: "trash" } : e
                            )
                          );
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Move to trash</TooltipContent>
                  </Tooltip>
                  <Separator orientation="vertical" className="h-4" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => {
                          setEmails(
                            emails.map((e) =>
                              e.id === selectedEmailId ? { ...e, favorite: !e.favorite } : e
                            )
                          );
                        }}
                        className="text-muted-foreground"
                      >
                        <Star
                          className={cn(
                            "size-4",
                            selectedEmail?.favorite && "fill-foreground text-foreground"
                          )}
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {selectedEmail?.favorite ? "Unfavorite" : "Favorite"}
                    </TooltipContent>
                  </Tooltip>
                </div>

                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={triggerReply}
                        className="text-muted-foreground"
                      >
                        <Reply className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Reply</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon-sm" variant="ghost" className="text-muted-foreground">
                        <ReplyAll className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Reply all</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon-sm" variant="ghost" className="text-muted-foreground">
                        <Forward className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Forward</TooltipContent>
                  </Tooltip>
                  <Separator orientation="vertical" className="h-4" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon-sm" variant="ghost" className="text-muted-foreground">
                        <MoreVertical className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>More</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {selectedEmail ? (
                <div className="flex-1 overflow-y-auto scrollbar-thin min-h-0">
                  <div className="p-6 flex flex-col gap-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-border bg-muted">
                          <AvatarFallback className="bg-muted text-muted-foreground text-xs font-semibold">
                            {selectedEmail.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-semibold text-foreground">
                            {selectedEmail.name}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span>{selectedEmail.subject}</span>
                            <span>&bull;</span>
                            <span>Reply-To: {selectedEmail.email}</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] text-muted-foreground font-medium shrink-0 ml-4">
                        {selectedEmail.fullDate}
                      </span>
                    </div>

                    <Separator />

                    <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed pr-4">
                      {selectedEmail.body}
                    </div>

                    <Separator className="mt-4" />

                    {/* ── Reply Composer ── */}
                    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/40">
                        <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                          <div className="flex size-5 items-center justify-center rounded-md bg-muted border border-border">
                            <MessageSquareText className="size-3 text-muted-foreground" />
                          </div>
                          <span>Reply to <span className="font-semibold">{selectedEmail.name}</span></span>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                triggerReply();
                                setAiAssistantOpen(true);
                              }}
                              className="h-7 text-xs gap-1.5 border-border bg-background hover:bg-muted"
                            >
                              <Sparkles className="size-3" />
                              Reply with AI
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Open AI assistant to help draft a reply
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      {/* Textarea */}
                      <div className="px-4 pt-3 pb-2">
                        <Textarea
                          onClick={triggerReply}
                          readOnly
                          placeholder="Click here to write reply or use the AI draft assistant…"
                          className="min-h-[80px] resize-none border-0 bg-transparent p-0 text-xs text-muted-foreground placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0 cursor-text shadow-none leading-relaxed"
                        />
                      </div>

                      {/* Divider */}
                      <Separator />

                      {/* Footer toolbar */}
                      <div className="flex items-center justify-between px-3 py-2 bg-muted/20">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[11px] text-muted-foreground hover:text-foreground gap-1.5 px-2.5 rounded-md"
                        >
                          Mute this thread
                        </Button>
                        <Button
                          size="sm"
                          onClick={triggerReply}
                          className="h-7 text-xs px-4 gap-1.5 bg-foreground text-background hover:bg-foreground/90"
                        >
                          <Reply className="size-3" />
                          Reply
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3 bg-background">
                  <Inbox className="size-12 text-muted-foreground/30" />
                  <span className="text-sm">Select an email to read</span>
                </div>
              )}
            </div>
          )}
        </div>
      </ResizablePanel>

      {aiAssistantOpen && (
        <>
          <ResizableHandle withHandle className="bg-zinc-800 dark:bg-zinc-800 hover:bg-zinc-700/80 transition-colors" />
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            {/* ─── AI ASSISTANT SIDE PANEL ─── */}
            <div className="flex flex-col h-full bg-card overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-md bg-muted border border-border">
                  <Bot className="size-4 text-foreground" />
                </div>
                <div>
                  <span className="font-semibold text-foreground text-xs block">AI Co-pilot</span>
                  <span className="text-[9px] text-muted-foreground block">
                    Draft Assistant
                  </span>
                </div>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon-xs" variant="ghost" onClick={() => setAiAssistantOpen(false)}>
                    <X className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Close panel</TooltipContent>
              </Tooltip>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
               <div className="flex-1 overflow-y-auto scrollbar-thin p-4 min-h-0">
                <div className="flex flex-col gap-4">
                  <div className="flex gap-2 items-start text-xs">
                    <div className="size-6 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                      <Bot className="size-3 text-muted-foreground" />
                    </div>
                    <div className="bg-muted border border-border rounded-xl p-3 text-foreground leading-relaxed max-w-[85%]">
                      Hello! I am your AI assistant. How can I help you respond or draft your
                      email today?
                    </div>
                  </div>

                  {aiChat.map((msg, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex gap-2 items-start text-xs",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {msg.role !== "user" && (
                        <div className="size-6 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                          <Bot className="size-3 text-muted-foreground" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "rounded-xl p-3 leading-relaxed max-w-[85%] border",
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground border-primary ml-auto"
                            : "bg-muted border-border text-foreground"
                        )}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}

                  {isGenerating && (
                    <div className="flex gap-2 items-start text-xs">
                      <div className="size-6 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 animate-pulse">
                        <Bot className="size-3 text-muted-foreground" />
                      </div>
                      <div className="bg-muted border border-border rounded-xl p-3 text-muted-foreground leading-relaxed max-w-[85%] flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-foreground opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-foreground"></span>
                        </span>
                        <span>Generating draft...</span>
                      </div>
                    </div>
                  )}

                  {aiDraft && !isGenerating && (
                    <Card className="border-border bg-muted shadow-none">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-1.5 text-foreground font-semibold mb-2 text-xs">
                          <Sparkles className="size-3" />
                          <span>Draft Preview</span>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed select-all">
                          {aiDraft}
                        </p>
                        <Button
                          size="sm"
                          onClick={handleApplyDraft}
                          className="mt-3 w-full text-xs h-8"
                        >
                          Insert Draft into Composer
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  <div ref={chatBottomRef} />
                </div>
              </div>

              <div className="p-3 border-t border-border bg-background flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[10px] text-muted-foreground font-semibold">Tone:</span>
                  <div className="flex gap-1">
                    {["professional", "friendly", "direct"].map((tone) => (
                      <button
                        key={tone}
                        onClick={() => setAiTone(tone)}
                        className={cn(
                          "px-2 py-0.5 text-[9px] rounded-md border capitalize transition-all",
                          aiTone === tone
                            ? "bg-accent border-border text-accent-foreground font-medium"
                            : "bg-background border-border text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                        )}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 relative">
                  <Input
                    type="text"
                    placeholder="e.g. Write a friendly response..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && generateAIDraft()}
                    className="h-8 text-xs pr-8"
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        onClick={generateAIDraft}
                        disabled={!aiPrompt.trim() || isGenerating}
                        className="absolute right-0.5 top-0.5 text-foreground disabled:text-muted-foreground"
                      >
                        <ArrowRight className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Generate draft</TooltipContent>
                  </Tooltip>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      setAiPrompt(
                        "Generate a summary of the current email thread highlighting the core action items."
                      );
                      setTimeout(() => generateAIDraft(), 50);
                    }}
                    className="text-[9px] h-6 justify-start font-normal text-left truncate"
                  >
                    Summarize Thread
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      setAiPrompt(
                        "Politely decline the meeting request explaining that I have a scheduling conflict."
                      );
                      setTimeout(() => generateAIDraft(), 50);
                    }}
                    className="text-[9px] h-6 justify-start font-normal text-left truncate"
                  >
                    Decline Politely
                  </Button>
                </div>
              </div>
            </div>
            </div>
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  </div>
</TooltipProvider>
  );
}
