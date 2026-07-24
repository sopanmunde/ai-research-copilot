"use client";
import { useState, useMemo, useEffect } from "react";
import { X, SearchIcon, Plus, Clock, ChevronRight, CornerDownLeft } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "./ui/dialog";
import { Kbd } from "./ui/kbd";
import { Badge } from "./ui/badge";

function getTimeGroup(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  if (date >= today) return "Today";
  if (date >= yesterday) return "Yesterday";
  if (date >= sevenDaysAgo) return "7 days ago";
  return "Older";
}

export default function SearchPopover({
  children,
  conversations = [],
  onSelect,
  createNewChat,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredConversations = useMemo(() => {
    if (!query.trim()) return conversations.slice(0, 8);
    const q = query.toLowerCase();
    return conversations.filter(
      (c) =>
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.preview && c.preview.toLowerCase().includes(q)),
    );
  }, [conversations, query]);

  const groupedConversations = useMemo(() => {
    const groups = {};
    filteredConversations
      .sort((a, b) => new Date(b.updatedAt || b.updated_at) - new Date(a.updatedAt || a.updated_at))
      .forEach((conv) => {
        const time = conv.updatedAt || conv.updated_at || new Date().toISOString();
        const group = getTimeGroup(time);
        if (!groups[group]) groups[group] = [];
        groups[group].push(conv);
      });
    return groups;
  }, [filteredConversations]);

  const handleClose = () => {
    setQuery("");
    setOpen(false);
  };

  const handleNewChat = () => {
    createNewChat();
    handleClose();
  };

  const handleSelectConversation = (id) => {
    onSelect(id);
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent 
        showCloseButton={false}
        className="p-0 max-w-2xl overflow-hidden rounded-3xl border border-border/80 bg-card/95 backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] z-[9999] gap-0 transition-all duration-300"
      >
        <DialogTitle className="sr-only">Search conversations</DialogTitle>
        <DialogDescription className="sr-only">Locate previous chats, topics, or templates in your workspace history.</DialogDescription>
        
        {/* Search Header Container */}
        <div className="relative px-5 py-4 border-b border-border/60 bg-gradient-to-b from-muted/50 via-card/80 to-card flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-gradient-to-b from-card to-muted border border-border/80 shadow-[0_4px_12px_rgba(0,0,0,0.12)] flex items-center justify-center shrink-0">
            <SearchIcon className="size-4 text-foreground drop-shadow-xs" />
          </div>
          
          <div className="flex-1 min-w-0 relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search conversations, topics, tags..."
              className="w-full bg-background/80 text-sm font-semibold text-foreground placeholder:text-muted-foreground/60 rounded-xl px-3.5 py-2 border border-border/70 shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] focus:shadow-[inset_0_1px_2px_rgba(0,0,0,0.05),0_0_0_2px_rgba(120,80,255,0.2)] outline-none transition-all"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            <Kbd className="h-6 text-[10px] px-2 font-mono border border-border/80 bg-muted/60 text-muted-foreground select-none rounded-lg">
              ESC
            </Kbd>
          </div>
        </div>

        {/* Scrollable Results Container */}
        <div className="max-h-[420px] overflow-y-auto p-4 space-y-4 scrollbar-thin">
          
          {/* Quick Action Container: Start New Chat */}
          <div className="rounded-2xl border border-border/70 bg-gradient-to-b from-muted/30 to-muted/10 p-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
            <button
              onClick={handleNewChat}
              className="group flex w-full items-center justify-between rounded-xl p-2.5 text-left transition-all duration-200 hover:bg-card border border-transparent hover:border-border/60 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-none hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground shadow-[0_2px_8px_rgba(0,0,0,0.15)] shrink-0 transition-transform group-hover:scale-105">
                  <Plus className="size-4.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-foreground block tracking-tight">
                    Start a new conversation
                  </span>
                  <span className="text-[10.5px] text-muted-foreground font-medium">
                    Reset workspace composer and begin fresh prompt
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all text-muted-foreground text-[10px] font-mono">
                <span>NEW</span>
                <CornerDownLeft className="size-3.5" />
              </div>
            </button>
          </div>

          {/* Grouped Conversations Container */}
          <div className="space-y-4">
            {Object.entries(groupedConversations).map(([groupName, convs]) => (
              <div key={groupName} className="rounded-2xl border border-border/60 bg-muted/10 p-3 space-y-2 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="size-3 text-primary" /> {groupName}
                  </span>
                  {convs.length > 0 && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono font-bold text-muted-foreground bg-muted/40 border-border/60">
                      {convs.length}
                    </Badge>
                  )}
                </div>

                <div className="space-y-1.5">
                  {convs.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      className="group flex w-full items-center justify-between rounded-xl p-2.5 text-left transition-all duration-200 bg-background/60 hover:bg-card border border-border/50 hover:border-border/90 shadow-[0_2px_6px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted/50 border border-border/60 text-muted-foreground transition-all group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/30">
                          <Clock className="size-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                            {conv.title || "Untitled Conversation"}
                          </div>
                          {conv.preview && (
                            <div className="truncate text-[10.5px] text-muted-foreground font-medium mt-0.5">
                              {conv.preview}
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {filteredConversations.length === 0 && (
            <div className="py-12 text-center rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-muted border border-border/80 mx-auto mb-3 shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
                <SearchIcon className="size-5 text-muted-foreground" />
              </div>
              <p className="text-xs font-bold text-foreground">
                No matching conversations found
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 max-w-xs mx-auto">
                No results for "{query}". Try checking your search terms or start a new chat.
              </p>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="px-5 py-3 border-t border-border/70 bg-gradient-to-b from-card to-muted/40 flex items-center justify-between text-[11px] text-muted-foreground font-medium select-none">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="font-bold text-foreground">TriVisionX Search</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono">
            <CornerDownLeft className="size-3 text-muted-foreground" />
            <span>Select item</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
