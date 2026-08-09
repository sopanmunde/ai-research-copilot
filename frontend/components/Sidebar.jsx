"use client";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  PanelLeftClose,
  PanelLeftOpen,
  SearchIcon,
  Plus,
  FolderIcon,
  FileText,
  Settings,
  PenSquare,
  ChevronRight,
  ChevronDown,
  Menu,
  Mail,
  Key,
  Brain,
  Calendar,
  BookOpen,
  Globe,
  ImageIcon,
  CheckSquare,
  Plug,
} from "lucide-react";
import { TriVisionXLogo } from "./TriVisionXLogo";
import ConversationRow from "./ConversationRow";
import FolderRow from "./FolderRow";
import TemplateRow from "./TemplateRow";
import FolderPopover from "./CreateFolderModal";
import TemplatePopover from "./CreateTemplateModal";
import SearchPopover from "./SearchModal";
import SettingsPopover from "./SettingsPopover";
import { AnimatedThemeToggler } from "./ui/animated-theme-toggler";
import { cls } from "./utils";
import { useState, useEffect, forwardRef } from "react";

function loadLS(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v !== null ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}
function saveLS(key, value) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { }
}

function groupByDate(conversations) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOf7DaysAgo = new Date(startOfToday);
  startOf7DaysAgo.setDate(startOf7DaysAgo.getDate() - 7);
  const startOf30DaysAgo = new Date(startOfToday);
  startOf30DaysAgo.setDate(startOf30DaysAgo.getDate() - 30);

  const groups = { Today: [], Yesterday: [], "Previous 7 Days": [], "Previous 30 Days": [], Older: [] };
  for (const c of conversations) {
    const d = new Date(c.updatedAt || c.updated_at || 0);
    if (d >= startOfToday) groups["Today"].push(c);
    else if (d >= startOfYesterday) groups["Yesterday"].push(c);
    else if (d >= startOf7DaysAgo) groups["Previous 7 Days"].push(c);
    else if (d >= startOf30DaysAgo) groups["Previous 30 Days"].push(c);
    else groups["Older"].push(c);
  }
  return groups;
}

function CollapsedSidebar({ setSidebarCollapsed, createNewChat, conversations, selectedId, onSelect, onUserUpdate, user, userInitials }) {
  return (
    <motion.aside
      initial={{ width: 260 }}
      animate={{ width: 52 }}
      transition={{ type: "spring", stiffness: 300, damping: 32 }}
      data-slot="sidebar"
      data-sidebar="sidebar"
      className="z-50 flex h-full shrink-0 flex-col border border-sidebar-border bg-sidebar text-sidebar-foreground backdrop-blur-xl md:rounded-2xl shadow-sm"
    >
      <div className="flex items-center justify-center border-b border-sidebar-border/60 px-1.5 py-3">
        <button
          onClick={() => setSidebarCollapsed(false)}
          title="Open sidebar"
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-sidebar-foreground/70 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:scale-95"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-1 flex-col items-center gap-2 pt-3 px-1.5">
        <button onClick={createNewChat} title="New Chat" className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-sidebar-border/60 bg-sidebar-accent/40 text-sidebar-foreground/80 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:scale-95">
          <PenSquare className="h-4 w-4" />
        </button>
        <SearchPopover conversations={conversations} onSelect={onSelect} createNewChat={createNewChat}>
          <button title="Search" className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-sidebar-border/60 bg-sidebar-accent/40 text-sidebar-foreground/80 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:scale-95">
            <SearchIcon className="h-4 w-4" />
          </button>
        </SearchPopover>
        <button title="Templates" className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-sidebar-border/60 bg-sidebar-accent/40 text-sidebar-foreground/80 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:scale-95">
          <FileText className="h-4 w-4" />
        </button>
        <button title="Folders" className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-sidebar-border/60 bg-sidebar-accent/40 text-sidebar-foreground/80 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:scale-95">
          <FolderIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => onSelect("notes")}
          title="Notes"
          className={cls(
            "inline-flex h-8 w-8 items-center justify-center rounded-xl border transition-all active:scale-95",
            selectedId === "notes"
              ? "border-primary bg-primary/10 text-primary"
              : "border-sidebar-border/60 bg-sidebar-accent/40 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <FileText className="h-4 w-4" />
        </button>
        <button
          onClick={() => onSelect("email")}
          title="Email Dashboard"
          className={cls(
            "inline-flex h-8 w-8 items-center justify-center rounded-xl border transition-all active:scale-95",
            selectedId === "email"
              ? "border-primary bg-primary/10 text-primary"
              : "border-sidebar-border/60 bg-sidebar-accent/40 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <Mail className="h-4 w-4" />
        </button>
        <button
          onClick={() => onSelect("integrations")}
          title="Plugins & Integrations"
          className={cls(
            "inline-flex h-8 w-8 items-center justify-center rounded-xl border transition-all active:scale-95",
            selectedId === "integrations" || selectedId === "plugins"
              ? "border-primary bg-primary/10 text-primary"
              : "border-sidebar-border/60 bg-sidebar-accent/40 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <Plug className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-col items-center gap-2 pb-3 px-1.5">
        <AnimatedThemeToggler
          title="Toggle Theme"
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-sidebar-border/60 bg-sidebar-accent/40 text-sidebar-foreground/80 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:scale-95 [&_svg]:size-4 cursor-pointer"
        />
        <SettingsPopover onUserUpdate={onUserUpdate} onSelect={onSelect}>
          <button title="Settings" className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-[11px] font-extrabold text-primary-foreground hover:opacity-90 transition-all active:scale-95 cursor-pointer shadow-sm border border-primary-foreground/20">
            {userInitials || "U"}
          </button>
        </SettingsPopover>
      </div>
    </motion.aside>
  );
}

function AccordionSection({ id, icon, title, badge, isOpen, onToggle, addAction, children }) {
  return (
    <section aria-label={title} className="mt-1">
      <div className="flex items-center gap-1">
        <button
          id={`acc-${id}`}
          aria-expanded={isOpen}
          aria-controls={`acc-panel-${id}`}
          onClick={onToggle}
          className="group relative flex flex-1 items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-all duration-150 select-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:scale-[0.99] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <span className="shrink-0 text-primary group-hover:text-primary transition-colors">{icon}</span>
          <span className="flex-1 text-[11px] font-semibold text-sidebar-foreground/80 group-hover:text-sidebar-foreground transition-colors">{title}</span>
          {badge > 0 && (
            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground px-1 text-[9px] font-bold tabular-nums transition-colors">{badge}</span>
          )}
          <ChevronDown className={cls("h-3 w-3 text-muted-foreground group-hover:text-sidebar-foreground transition-all duration-200", isOpen ? "rotate-0" : "-rotate-90")} />
        </button>
        {addAction && (
          <div className="shrink-0" onClick={e => e.stopPropagation()}>{addAction}</div>
        )}
      </div>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div id={`acc-panel-${id}`} key="panel" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }} className="overflow-hidden">
            <div className="pt-0.5 pl-1 space-y-px">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function DateSection({ label, isOpen, onToggle, children }) {
  return (
    <section aria-label={label} className="mt-1">
      <button aria-expanded={isOpen} onClick={onToggle} className="group flex w-full items-center justify-between px-2 py-1 select-none focus-visible:outline-none">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground group-hover:text-sidebar-foreground transition-colors">{label}</span>
        <ChevronDown className={cls("h-2.5 w-2.5 text-muted-foreground group-hover:text-sidebar-foreground transition-all duration-200", isOpen ? "rotate-0" : "-rotate-90")} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div key="body" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }} className="overflow-hidden">
            <div className="space-y-px pt-0.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

const AddBtn = forwardRef(({ title, ...props }, ref) => (
  <button ref={ref} {...props} aria-label={title} title={title} className="group inline-flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
    <Plus className="h-3 w-3 transition-transform duration-300 ease-in-out group-data-[state=open]:rotate-90" />
  </button>
));
AddBtn.displayName = "AddBtn";

export default function Sidebar({
  open = false, onClose = () => { }, collapsed = false, setCollapsed = () => { }, conversations = [], pinned = [], recent = [], folders = [], folderCounts = {},
  selectedId = null, onSelect = () => { }, togglePin = () => { }, query = "", setQuery = () => { }, searchRef = null, createFolder = () => { }, deleteFolder = () => { },
  renameFolder = () => { }, createNewChat = () => { }, templates = [], setTemplates = () => { }, onUseTemplate = () => { },
  sidebarCollapsed = false, setSidebarCollapsed = () => { }, onDeleteConversation = () => { },
  onRenameConversation = () => { }, user = null, onUserUpdate = () => { },
}) {
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [foldersOpen, setFoldersOpen] = useState(() => loadLS("sb_folders_open", true));
  const [templatesOpen, setTemplatesOpen] = useState(() => loadLS("sb_templates_open", true));
  const [toolsOpen, setToolsOpen] = useState(() => loadLS("sb_tools_open", false));
  const [expandedFolder, setExpandedFolder] = useState(null);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [rotatedNewChat, setRotatedNewChat] = useState(false);
  const [rotatedEmail, setRotatedEmail] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  if (!mounted) {
    return null;
  }

  const toggleFolders = () => setFoldersOpen(v => {
    const next = !v;
    saveLS("sb_folders_open", next);
    if (next) {
      setTemplatesOpen(false);
      setToolsOpen(false);
      saveLS("sb_templates_open", false);
      saveLS("sb_tools_open", false);
    }
    return next;
  });

  const toggleTemplates = () => setTemplatesOpen(v => {
    const next = !v;
    saveLS("sb_templates_open", next);
    if (next) {
      setFoldersOpen(false);
      setToolsOpen(false);
      saveLS("sb_folders_open", false);
      saveLS("sb_tools_open", false);
    }
    return next;
  });

  const toggleTools = () => setToolsOpen(v => {
    const next = !v;
    saveLS("sb_tools_open", next);
    if (next) {
      setFoldersOpen(false);
      setTemplatesOpen(false);
      saveLS("sb_folders_open", false);
      saveLS("sb_templates_open", false);
    }
    return next;
  });

  const toggleGroup = lbl => setCollapsedGroups(p => ({ ...p, [lbl]: !p[lbl] }));

  const getConvsByFolder = name => conversations.filter(c => c.folder === name);
  const handleCreateFolder = name => createFolder(name);
  const handleDeleteFolder = name => deleteFolder?.(name);
  const handleRenameFolder = (old, next) => renameFolder?.(old, next);

  const handleCreateTemplate = data => {
    if (editingTemplate) {
      setTemplates(templates.map(t => t.id === editingTemplate.id ? { ...data, id: editingTemplate.id } : t));
      setEditingTemplate(null);
    } else {
      setTemplates([...templates, { ...data, id: Date.now().toString() }]);
    }
  };
  const handleEditTemplate = t => setEditingTemplate(t);
  const handleRenameTemplate = (id, name) => setTemplates(templates.map(t => t.id === id ? { ...t, name } : t));
  const handleDeleteTemplate = id => setTemplates(templates.filter(t => t.id !== id));
  const handleUseTemplate = t => onUseTemplate(t);

  const userInitials = user
    ? ((user.first_name?.[0] || "") + (user.last_name?.[0] || "")).toUpperCase() || user.username?.[0]?.toUpperCase() || "U"
    : "U";
  const userName = user
    ? (user.first_name || "" + " " + user.last_name || "").trim() || user.username
    : "Loading";

  const folderCount = (Array.isArray(folders) ? folders : []).length;
  const templateCount = (Array.isArray(templates) ? templates : []).length;
  const nonPinned = (recent || []).filter(c => !c.pinned);

  if (sidebarCollapsed) {
    return (
      <CollapsedSidebar
        setSidebarCollapsed={setSidebarCollapsed}
        createNewChat={createNewChat}
        conversations={conversations}
        selectedId={selectedId}
        onSelect={onSelect}
        onUserUpdate={onUserUpdate}
        user={user}
        userInitials={userInitials}
      />
    );
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden" onClick={onClose} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mounted && (
          <aside
            key="sidebar"
            data-slot="sidebar"
            data-sidebar="sidebar"
            className={cls(
              "z-50 flex h-full w-[260px] shrink-0 flex-col",
              "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              "fixed inset-y-0 left-0 md:static",
              open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
              "border-r border-sidebar-border bg-sidebar text-sidebar-foreground backdrop-blur-xl md:rounded-2xl md:border md:shadow-md",
              "shadow-[4px_0_24px_rgba(0,0,0,0.12)] md:shadow-sm"
            )}
          >
            {/* HEADER BRAND CONTAINER */}
            <div data-slot="sidebar-header" className="px-2.5 pt-3 pb-2 shrink-0">
              <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/30 p-2.5 shadow-xs flex items-center justify-between transition-all duration-200">
                <div className="flex items-center gap-2.5">
                  <TriVisionXLogo size="sm" showWordmark animate={false} />
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setSidebarCollapsed(true)} title="Collapse sidebar"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-xl text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border border-transparent hover:border-sidebar-border transition-all cursor-pointer">
                    <Menu className="h-4 w-4" />
                  </button>
                  <button onClick={onClose} aria-label="Close sidebar"
                    className="md:hidden inline-flex h-7 w-7 items-center justify-center rounded-xl text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border border-transparent hover:border-sidebar-border transition-all">
                    <PanelLeftClose className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* STATIC NAVIGATION RAIL */}
            <div data-slot="sidebar-content" className="px-2.5 pb-2 shrink-0 space-y-0.5 border-b border-sidebar-border max-h-[460px] overflow-y-auto scrollbar-none">
              <button
                onClick={() => {
                  setRotatedNewChat(prev => !prev);
                  createNewChat?.();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[11.5px] font-semibold text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all cursor-pointer"
              >
                <Plus className={cls("h-4 w-4 text-primary transition-transform duration-300 ease-in-out", rotatedNewChat ? "rotate-90" : "rotate-0")} /><span>New Chat</span>
              </button>
              <SearchPopover conversations={conversations} onSelect={onSelect} createNewChat={createNewChat}>
                <button className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[11.5px] font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all cursor-pointer">
                  <SearchIcon className="h-4 w-4 text-primary" /><span>Search</span>
                </button>
              </SearchPopover>
              <button
                onClick={() => {
                  onSelect("email");
                  onClose?.();
                }}
                className={cls(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[11.5px] font-medium transition-all cursor-pointer",
                  selectedId === "email"
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <span className="flex items-center gap-2.5"><Mail className="h-4 w-4 text-primary" /><span>Email</span></span>
              </button>
              <button onClick={toggleTools} className="flex w-full justify-between items-center rounded-lg px-2.5 py-1.5 text-left text-[11.5px] font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all cursor-pointer">
                <span className="flex items-center gap-2.5"><Key className="h-4 w-4 text-primary" /><span>Tools</span></span>
                <ChevronDown className={cls("h-3 w-3 opacity-60 transition-transform duration-200", toolsOpen ? "rotate-0" : "-rotate-90")} />
              </button>

              <AnimatePresence initial={false}>
                {toolsOpen && (
                  <motion.div
                    key="tools-dropdown"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="flex flex-col space-y-0.5 overflow-hidden pl-2"
                  >
                    <button
                      onClick={() => {
                        onSelect("brain");
                        onClose?.();
                      }}
                      className={cls(
                        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[11.5px] font-medium transition-all cursor-pointer",
                        selectedId === "brain"
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <Brain className="h-4 w-4 text-primary" /><span>Brain</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelect("integrations");
                        onClose?.();
                      }}
                      className={cls(
                        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[11.5px] font-medium transition-all cursor-pointer",
                        selectedId === "integrations" || selectedId === "plugins"
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <Plug className="h-4 w-4 text-primary" /><span>Plugins & Integrations</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelect("calendar");
                        onClose?.();
                      }}
                      className={cls(
                        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[11.5px] font-medium transition-all cursor-pointer",
                        selectedId === "calendar"
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <Calendar className="h-4 w-4 text-primary" /><span>Calendar</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelect("tasks");
                        onClose?.();
                      }}
                      className={cls(
                        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[11.5px] font-medium transition-all cursor-pointer",
                        selectedId === "tasks"
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <CheckSquare className="h-4 w-4 text-primary" /><span>Tasks</span>
                    </button>

                    <button
                      onClick={() => {
                        setLibraryOpen(prev => !prev);
                      }}
                      className="flex w-full justify-between items-center rounded-lg px-2.5 py-1.5 text-left text-[11.5px] font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all cursor-pointer"
                    >
                      <span className="flex items-center gap-2.5"><FolderIcon className="h-4 w-4 text-primary" /><span>Library</span></span>
                      <ChevronDown className={cls("h-3.5 w-3.5 opacity-60 transition-transform duration-200", libraryOpen ? "rotate-0" : "-rotate-90")} />
                    </button>

                    <AnimatePresence initial={false}>
                      {libraryOpen && (
                        <motion.div
                          key="library-dropdown"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="flex flex-col space-y-0.5 overflow-hidden pl-4 border-l border-sidebar-border ml-4.5"
                        >
                          <button
                            onClick={() => {
                              onSelect("docs");
                              onClose();
                            }}
                            className={cls(
                              "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[11.5px] font-medium transition-all cursor-pointer",
                              selectedId === "docs"
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            )}
                          >
                            <ImageIcon className="h-4 w-4 text-primary" /><span>Gallery</span>
                          </button>
                          <button
                            onClick={() => {
                              onSelect("notes");
                              onClose?.();
                            }}
                            className={cls(
                              "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[11.5px] font-medium transition-all cursor-pointer",
                              selectedId === "notes"
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            )}
                          >
                            <FileText className="h-4 w-4 text-primary" /><span>Notes</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </motion.div>
                )}
              </AnimatePresence>

            </div>

            {/* SCROLLABLE BODY */}
            <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2.5 pb-2 space-y-0.5 scrollbar-thin scrollbar-thumb-white/[0.06] scrollbar-track-transparent" aria-label="Sidebar navigation">
              {/* UNIFIED CONTAINER FOR TEMPLATES & FOLDERS */}
              <div className="my-1.5 rounded-2xl border border-sidebar-border bg-sidebar-accent/20 p-2 shadow-2xs space-y-1">
                <AccordionSection
                  id="templates" icon={<FileText className="h-3.5 w-3.5 text-primary" />} title="Templates"
                  badge={templateCount} isOpen={templatesOpen} onToggle={toggleTemplates}
                  addAction={
                    <TemplatePopover onCreateTemplate={handleCreateTemplate} editingTemplate={editingTemplate}>
                      <AddBtn title="New template" />
                    </TemplatePopover>
                  }
                >
                  {(Array.isArray(templates) ? templates : []).map(t => (
                    <TemplateRow key={t.id} template={t} onUseTemplate={handleUseTemplate}
                      onEditTemplate={handleEditTemplate} onRenameTemplate={handleRenameTemplate}
                      onDeleteTemplate={handleDeleteTemplate} />
                  ))}
                  {templateCount === 0 && <p className="py-2 pl-3 text-[11px] italic text-muted-foreground">No templates yet</p>}
                </AccordionSection>

                <div className="h-px mx-2 bg-sidebar-border/60" />

                <AccordionSection
                  id="folders" icon={<FolderIcon className="h-3.5 w-3.5 text-primary" />} title="Folders"
                  badge={folderCount} isOpen={foldersOpen} onToggle={toggleFolders}
                  addAction={
                    <FolderPopover onCreateFolder={handleCreateFolder}>
                      <AddBtn title="New folder" />
                    </FolderPopover>
                  }
                >
                  {(Array.isArray(folders) ? folders : []).map(f => (
                    <FolderRow key={f.id} name={f.name} count={folderCounts[f.name] || 0}
                      conversations={getConvsByFolder(f.name)} selectedId={selectedId}
                      onSelect={onSelect} togglePin={togglePin}
                      onDeleteFolder={handleDeleteFolder} onRenameFolder={handleRenameFolder}
                      onDeleteConversation={onDeleteConversation} onRenameConversation={onRenameConversation}
                      isExpanded={expandedFolder === f.id}
                      onToggle={() => setExpandedFolder(prev => prev === f.id ? null : f.id)} />
                  ))}
                  {folderCount === 0 && <p className="py-2 pl-3 text-[11px] italic text-muted-foreground">No folders yet</p>}
                </AccordionSection>
              </div>

              <div role="separator" className="mx-1 my-2 h-px bg-sidebar-border" />

              <div className="px-2 pb-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Recent</span>
              </div>

              {pinned && pinned.length > 0 && pinned.map(c => (
                <ConversationRow key={c.id} data={c} active={c.id === selectedId}
                  onSelect={() => onSelect(c.id)} onTogglePin={() => togglePin(c.id)} onDelete={() => onDeleteConversation(c.id)}
                  onRename={onRenameConversation} />
              ))}

              {nonPinned && nonPinned.length > 0 && nonPinned.map(c => (
                <ConversationRow key={c.id} data={c} active={c.id === selectedId}
                  onSelect={() => onSelect(c.id)} onTogglePin={() => togglePin(c.id)} onDelete={() => onDeleteConversation(c.id)}
                  onRename={onRenameConversation} />
              ))}

              {(!recent || recent.length === 0) && (!pinned || pinned.length === 0) && (
                <div className="mt-6 select-none rounded-2xl border border-dashed border-sidebar-border px-4 py-8 text-center text-[11px] text-muted-foreground">
                  <div className="mb-3 flex justify-center opacity-20">
                    <TriVisionXLogo size="lg" glow animate={false} />
                  </div>
                  No conversations yet.
                  <br />
                  Start a new chat to begin.
                </div>
              )}
            </nav>

            {/* PROFILE & THEME FOOTER CONTAINER */}
            <div data-slot="sidebar-footer" className="shrink-0 p-2.5 border-t border-sidebar-border bg-gradient-to-b from-transparent to-sidebar-accent/20">
              <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/30 p-2.5 shadow-xs flex items-center justify-between transition-all duration-200 hover:border-sidebar-border/80">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-[11px] font-extrabold text-primary-foreground select-none shadow-xs border border-primary-foreground/20">
                      {userInitials || "U"}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 border-2 border-sidebar shadow-xs" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="truncate text-[11.5px] font-bold text-sidebar-foreground leading-tight">{userName || "User"}</span>
                    <span className="text-[9.5px] text-muted-foreground font-medium font-mono">Workspace</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <AnimatedThemeToggler
                    title="Toggle Theme"
                    className="p-1.5 rounded-xl text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent border border-transparent hover:border-sidebar-border transition-all cursor-pointer shadow-none hover:shadow-xs active:translate-y-0.5 [&_svg]:size-4 flex items-center justify-center"
                  />
                  <SettingsPopover onUserUpdate={onUserUpdate} onSelect={onSelect}>
                    <button aria-label="Open settings" title="Account Settings" className="p-1.5 rounded-xl text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent border border-transparent hover:border-sidebar-border transition-all cursor-pointer shadow-none hover:shadow-xs active:translate-y-0.5">
                      <Settings className="h-4 w-4" />
                    </button>
                  </SettingsPopover>
                </div>
              </div>
            </div>
          </aside>
        )}
      </AnimatePresence>
    </>
  );
}