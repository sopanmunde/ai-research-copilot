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
        className="p-0 max-w-2xl overflow-hidden rounded-2xl border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/95 shadow-2xl backdrop-blur-xl z-[9999] gap-0"
      >
        <DialogTitle className="sr-only">Search conversations</DialogTitle>
        <DialogDescription className="sr-only">Locate previous chats, topics, or templates in your workspace history.</DialogDescription>
        {/* Search Input Section */}
        <div className="relative flex items-center border-b border-zinc-200/80 dark:border-zinc-800/80 px-4 py-4 bg-zinc-50/50 dark:bg-zinc-900/30">
          <SearchIcon className="h-5 w-5 text-zinc-400 dark:text-zinc-500 mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations, ideas, templates..."
            className="w-full bg-transparent text-[15px] font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none border-0 p-0 focus:ring-0"
            autoFocus
          />
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium select-none">ESC to close</span>
            <Kbd className="h-5 text-[10px] px-1.5 border border-zinc-200 dark:border-zinc-800 bg-background/50 text-muted-foreground select-none">Esc</Kbd>
          </div>
        </div>

        {/* Scrollable Results Area */}
        <div className="max-h-[400px] overflow-y-auto p-3 space-y-3 scroll-smooth">
          {/* Quick Action: Start new chat */}
          <div>
            <button
              onClick={handleNewChat}
              className="group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all hover:bg-zinc-100/80 dark:hover:bg-zinc-900/50 active:scale-[0.99] border border-transparent hover:border-zinc-200/50 dark:hover:border-zinc-800/50 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all group-hover:scale-105">
                  <Plus className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 block">
                    Start a new conversation
                  </span>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
                    Clear composer workspace and reset context
                  </span>
                </div>
              </div>
              <CornerDownLeft className="h-3.5 w-3.5 text-zinc-400/40 opacity-0 group-hover:opacity-100 transition-all" />
            </button>
          </div>

          {/* Grouped conversations */}
          <div className="space-y-4">
            {Object.entries(groupedConversations).map(([groupName, convs]) => (
              <div key={groupName} className="space-y-1.5">
                <div className="flex items-center justify-between px-3">
                  <span className="text-[10.5px] font-bold text-zinc-400/80 dark:text-zinc-500/80 uppercase tracking-wider">
                    {groupName}
                  </span>
                  {convs.length > 0 && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 font-medium text-zinc-400 dark:text-zinc-500 bg-transparent border-zinc-200 dark:border-zinc-800">
                      {convs.length}
                    </Badge>
                  )}
                </div>

                <div className="space-y-1">
                  {convs.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      className="group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all hover:bg-zinc-100/80 dark:hover:bg-zinc-900/50 border border-transparent hover:border-zinc-200/50 dark:hover:border-zinc-800/50 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 text-zinc-500 transition-colors group-hover:bg-white dark:group-hover:bg-zinc-950">
                          <Clock className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 leading-snug group-hover:text-primary transition-colors">
                            {conv.title || "Untitled Conversation"}
                          </div>
                          {conv.preview && (
                            <div className="truncate text-[11px] text-zinc-400 dark:text-zinc-500 font-medium mt-0.5">
                              {conv.preview}
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-zinc-400/40 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {filteredConversations.length === 0 && (
            <div className="py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/85 mx-auto mb-3">
                <SearchIcon className="h-5 w-5 text-zinc-400/60 dark:text-zinc-500/60" />
              </div>
              <p className="text-[13.5px] font-semibold text-zinc-800 dark:text-zinc-200">
                No matching conversations found
              </p>
              <p className="text-[11.5px] text-zinc-400 dark:text-zinc-500 mt-1 max-w-sm mx-auto">
                We couldn't find anything matching "{query}". Try checking for spelling or create a new chat.
              </p>
            </div>
          )}
        </div>

        {/* Footer shortcuts/hints */}
        <div className="flex items-center justify-between border-t border-zinc-200/80 dark:border-zinc-800/80 px-4 py-3 bg-zinc-50/50 dark:bg-zinc-900/30 text-[11px] text-zinc-400 dark:text-zinc-500 font-medium select-none">
          <div className="flex items-center gap-1.5">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>TriVisionX Search Assistant</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <CornerDownLeft className="h-3 w-3" />
              <span>to select</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
