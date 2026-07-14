"use client";

import {
  useRef, useState, forwardRef, useImperativeHandle, useEffect, useCallback,
} from "react";
import {
  Loader2, Plus, StopCircle, ChevronDown,
  FlaskConical, Zap, Check, BrainCircuit,
  FileText, FileType, FileSpreadsheet, FileCode, FileJson,
  Archive, File as FileIcon, X, Presentation,
  Bot, Globe, BookOpen, Palette, ArrowUp, Calendar, Sliders, CheckSquare, Mail, FolderHeart, Cpu, Plug, Terminal, Code
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ComposerActionsPopover from "./ComposerActionsPopover";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";
import { Spinner } from "./ui/spinner";

const ACCEPTED_TYPES = [
  ".pdf", ".docx", ".doc", ".txt", ".rtf", ".odt",
  ".xlsx", ".xls", ".csv", ".pptx", ".ppt",
  ".html", ".htm", ".md", ".mdx", ".rst",
  ".json", ".jsonl", ".xml", ".yaml", ".yml",
  ".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".cpp", ".c", ".cs",
  ".go", ".rs", ".rb", ".php", ".sh", ".sql",
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".tiff", ".svg", ".zip",
];
const MAX_FILE_SIZE_MB = 5;

function getFileInfo(filename) {
  const ext = filename?.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf") return { icon: FileType, color: "text-red-400", bg: "bg-red-500", label: "PDF" };
  if (["docx", "doc", "rtf", "odt"].includes(ext)) return { icon: FileText, color: "text-blue-400", bg: "bg-blue-500", label: ext.toUpperCase() };
  if (["xlsx", "xls", "csv"].includes(ext)) return { icon: FileSpreadsheet, color: "text-green-400", bg: "bg-green-500", label: ext.toUpperCase() };
  if (["pptx", "ppt"].includes(ext)) return { icon: Presentation, color: "text-orange-400", bg: "bg-orange-500", label: ext.toUpperCase() };
  if (["png", "jpg", "jpeg", "gif", "webp", "bmp", "tiff", "svg"].includes(ext)) return { icon: FileIcon, color: "text-purple-400", bg: "bg-purple-500", label: "Image" };
  if (["json", "jsonl", "xml", "yaml", "yml"].includes(ext)) return { icon: FileJson, color: "text-yellow-400", bg: "bg-yellow-500", label: ext.toUpperCase() };
  if (["html", "htm", "md", "mdx", "rst"].includes(ext)) return { icon: FileCode, color: "text-cyan-400", bg: "bg-cyan-500", label: ext.toUpperCase() };
  if (["py", "js", "ts", "jsx", "tsx", "java", "cpp", "c", "cs", "go", "rs", "rb", "php", "sh", "sql"].includes(ext)) return { icon: FileCode, color: "text-indigo-400", bg: "bg-indigo-500", label: ext.toUpperCase() };
  if (ext === "zip") return { icon: Archive, color: "text-zinc-400", bg: "bg-zinc-600", label: "ZIP" };
  return { icon: FileIcon, color: "text-zinc-400", bg: "bg-zinc-600", label: ext.toUpperCase() || "File" };
}

function AttachedFilePill({ file, uploading, onRemove }) {
  const info = getFileInfo(file.name);
  const Icon = info.icon;
  const shortName = file.name.length > 28 ? file.name.slice(0, 26) + "..." : file.name;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.88, y: 4 }} transition={{ duration: 0.18 }}
      className="flex items-center gap-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 shadow-sm max-w-[280px] relative"
    >
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", info.bg)}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="overflow-hidden flex-1">
        <p className="text-[13px] font-medium text-zinc-800 dark:text-zinc-100 truncate leading-snug">{shortName}</p>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
          {uploading ? (
            <span className="flex items-center gap-1"><Loader2 className="h-2.5 w-2.5 animate-spin" /> Indexing...</span>
          ) : info.label}
        </p>
      </div>
      {!uploading && (
        <button onClick={onRemove}
          className="shrink-0 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-300/80 dark:bg-zinc-700 hover:bg-zinc-400 dark:hover:bg-zinc-600 transition-colors"
          title="Remove attachment">
          <X className="h-2.5 w-2.5 text-zinc-700 dark:text-zinc-300" />
        </button>
      )}
    </motion.div>
  );
}



function getActionLabel(action) {
  const map = { research: "Deep search", agent: "Agent", image: "Image", study: "Study", web: "Web search", canvas: "Canvas", calendar: "Calendar" };
  return map[action] || action;
}

function getActionIcon(action) {
  if (action === "research") return <FlaskConical className="h-3.5 w-3.5" />;
  if (action === "agent") return <Bot className="h-3.5 w-3.5" />;
  if (action === "image") return <Palette className="h-3.5 w-3.5" />;
  if (action === "study") return <BookOpen className="h-3.5 w-3.5" />;
  if (action === "web") return <Globe className="h-3.5 w-3.5" />;
  if (action === "canvas") return <Palette className="h-3.5 w-3.5" />;
  if (action === "calendar") return <Calendar className="h-3.5 w-3.5" />;
  return null;
}

const Composer = forwardRef(function Composer({ onSend, busy, defaultMode = "research", selectedBot = "Fast", onNavigateTo, onAddNewSkill }, ref) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [mode, setMode] = useState(defaultMode);
  const [activeAction, setActiveAction] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const isVoiceUsedRef = useRef(false);

  const [integrationsList, setIntegrationsList] = useState(null);
  const [selectedFeatures, setSelectedFeatures] = useState([]);

  useEffect(() => {
    const fetchList = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/integrations`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setIntegrationsList(data);
        }
      } catch (e) {
        console.error("Failed to load integrations for slash command", e);
      }
    };
    fetchList();
  }, []);

  const CORE_APPS = [
    { id: "app:tasks", label: "Tasks Context", category: "Apps & Context", icon: CheckSquare },
    { id: "app:calendar", label: "Calendar Agenda", category: "Apps & Context", icon: Calendar },
    { id: "app:email", label: "Email Gateway", category: "Apps & Context", icon: Mail },
    { id: "app:gallery", label: "Gallery Docs", category: "Apps & Context", icon: FolderHeart },
    { id: "app:notes", label: "Notes Notion", category: "Apps & Context", icon: FileText }
  ];

  const EXTENSION_FEATURES = [
    { id: "lsp:lsp", label: "LSP Engine", category: "Agent Protocols", icon: Code },
    { id: "acp:acp", label: "ACP Copilot", category: "Agent Protocols", icon: Terminal }
  ];

  const dynamicSkills = (integrationsList?.skills || []).map((s) => ({
    id: `skill:${s.id}`,
    label: `Skill: ${s.name}`,
    category: "Custom Skills",
    icon: Cpu
  }));

  const dynamicMcps = (integrationsList?.mcp_plugins || []).map((m) => ({
    id: `mcp:${m.id}`,
    label: `MCP: ${m.name}`,
    category: "MCP Plugins",
    icon: Plug
  }));

  const allAvailableFeatures = [
    ...CORE_APPS,
    ...dynamicSkills,
    ...dynamicMcps,
    ...EXTENSION_FEATURES
  ];

  const getSlashModeAndQuery = (text) => {
    const lastSpaceIdx = Math.max(text.lastIndexOf(" "), text.lastIndexOf("\n"));
    const wordStart = lastSpaceIdx === -1 ? 0 : lastSpaceIdx + 1;
    
    // The word must start with "/"
    if (text[wordStart] !== "/") return { mode: null, query: null };
    
    const commandWord = text.slice(wordStart);
    
    // Check for prefixes with trailing slash
    const prefixes = ["/skills/", "/tasks/", "/gallery/", "/docs/", "/email/", "/notes/", "/mcp/", "/lsp/", "/acp/"];
    for (const prefix of prefixes) {
      if (commandWord.toLowerCase().startsWith(prefix)) {
        const query = commandWord.slice(prefix.length);
        if (query.includes("/")) return { mode: null, query: null }; // no double nested sub-slashes
        return { mode: prefix.slice(1, -1), query: query.toLowerCase() };
      }
    }
    
    // Otherwise, we are in root mode, query is the text after the initial slash
    const query = commandWord.slice(1);
    if (query.includes("/")) return { mode: null, query: null };
    return { mode: "root", query: query.toLowerCase() };
  };

  const { mode: slashMode, query: slashQuery } = getSlashModeAndQuery(value);
  const showCommandPopup = slashMode !== null;

  // States for sub-menus lazy loading
  const [subMenuData, setSubMenuData] = useState({
    tasks: [],
    gallery: [],
    email: [],
    notes: []
  });
  const [loadingSubMenu, setLoadingSubMenu] = useState(false);


  useEffect(() => {
    if (!slashMode) return;
    const fetchSubMenu = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      try {
        setLoadingSubMenu(true);
        if (slashMode === "tasks" && subMenuData.tasks.length === 0) {
          const res = await fetch(`${API_BASE_URL}/tasks`, { headers: { Authorization: `Bearer ${token}` } });
          if (res.ok) {
            const data = await res.json();
            setSubMenuData(prev => ({ ...prev, tasks: data }));
          }
        } else if ((slashMode === "gallery" || slashMode === "docs") && subMenuData.gallery.length === 0) {
          const res = await fetch(`${API_BASE_URL}/documents`, { headers: { Authorization: `Bearer ${token}` } });
          if (res.ok) {
            const data = await res.json();
            setSubMenuData(prev => ({ ...prev, gallery: data }));
          }
        } else if (slashMode === "email" && subMenuData.email.length === 0) {
          const res = await fetch(`${API_BASE_URL}/emails`, { headers: { Authorization: `Bearer ${token}` } });
          if (res.ok) {
            const data = await res.json();
            setSubMenuData(prev => ({ ...prev, email: data }));
          }
        } else if (slashMode === "notes" && subMenuData.notes.length === 0) {
          const res = await fetch(`${API_BASE_URL}/notes`, { headers: { Authorization: `Bearer ${token}` } });
          if (res.ok) {
            const data = await res.json();
            setSubMenuData(prev => ({ ...prev, notes: data }));
          }
        }
      } catch (err) {
        console.error(`Failed to load ${slashMode} data for sub-menu`, err);
      } finally {
        setLoadingSubMenu(false);
      }
    };
    
    if (["tasks", "gallery", "docs", "email", "notes"].includes(slashMode)) {
      fetchSubMenu();
    }
  }, [slashMode]);

  const ROOT_COMMANDS = [
    { id: "category:skills", label: "/skills/", subtitle: "Reference dynamic skills context", icon: Cpu, isFolder: true },
    { id: "category:tasks", label: "/tasks/", subtitle: "Reference existing tasks from dashboard", icon: CheckSquare, isFolder: true },
    { id: "category:gallery", label: "/gallery/", subtitle: "Reference uploaded documents & files", icon: FolderHeart, isFolder: true },
    { id: "category:email", label: "/email/", subtitle: "Reference email correspondence", icon: Mail, isFolder: true },
    { id: "category:notes", label: "/notes/", subtitle: "Reference workspace notepad entries", icon: FileText, isFolder: true },
    { id: "category:mcp", label: "/mcp/", subtitle: "Reference Model Context Protocol tools", icon: Plug, isFolder: true },
    { id: "category:lsp", label: "/lsp/", subtitle: "Configure Language Server Protocol options", icon: Code, isFolder: true },
    { id: "category:acp", label: "/acp/", subtitle: "Configure Agentic Copilot Protocols", icon: Terminal, isFolder: true }
  ];

  const getSubMenuFeatures = () => {
    if (slashMode === "root") {
      return ROOT_COMMANDS;
    }
    if (slashMode === "tasks") {
      return [
        { id: "action:tasks", label: "+ Add New Task", category: "Tasks Database", icon: Plus },
        ...subMenuData.tasks.map(t => ({
          id: `task:${t.id}`,
          label: t.title,
          category: "Tasks Database",
          icon: CheckSquare
        }))
      ];
    }
    if (slashMode === "gallery" || slashMode === "docs") {
      return [
        { id: "action:gallery", label: "+ Upload New Document", category: "Gallery Files", icon: Plus },
        ...subMenuData.gallery.map(d => ({
          id: `gallery:${d.id}`,
          label: d.name || d.filename,
          category: "Gallery Files",
          icon: FolderHeart
        }))
      ];
    }
    if (slashMode === "email") {
      return [
        { id: "action:email", label: "+ Compose New Email", category: "Emails Inbox", icon: Plus },
        ...subMenuData.email.map(e => ({
          id: `email:${e.id}`,
          label: e.subject || "No Subject",
          category: "Emails Inbox",
          icon: Mail
        }))
      ];
    }
    if (slashMode === "notes") {
      return [
        { id: "action:notes", label: "+ Create New Note", category: "Workspace Notes", icon: Plus },
        ...subMenuData.notes.map(n => ({
          id: `notes:${n.id}`,
          label: n.title || "Untitled Note",
          category: "Workspace Notes",
          icon: FileText
        }))
      ];
    }
    if (slashMode === "skills") {
      return [
        { id: "action:skills", label: "+ Add New Skill", category: "Skills Configurations", icon: Plus },
        ...(integrationsList?.skills || []).map(s => ({
          id: `skill:${s.id}`,
          label: s.name,
          category: "Skills Configurations",
          icon: Cpu
        }))
      ];
    }
    if (slashMode === "mcp") {
      return [
        { id: "action:mcp", label: "+ Register New MCP Server", category: "MCP Servers", icon: Plus },
        ...(integrationsList?.mcp_plugins || []).map(m => ({
          id: `mcp:${m.id}`,
          label: m.name,
          category: "MCP Servers",
          icon: Plug
        }))
      ];
    }
    if (slashMode === "lsp") {
      return (integrationsList?.lsp?.servers || []).map(s => ({
        id: `lsp:${s.language}`,
        label: `${s.language} LSP`,
        category: "LSP Servers",
        icon: Code
      }));
    }
    if (slashMode === "acp") {
      return [
        { id: "acp:autocomplete", label: "Agentic Autopilot", category: "ACP Tools", icon: Terminal }
      ];
    }
    return [];
  };

  const filteredFeatures = getSubMenuFeatures().filter((f) =>
    !slashQuery || f.label.toLowerCase().includes(slashQuery)
  );

  const [highlightedIndex, setHighlightedIndex] = useState(0);

  useEffect(() => {
    if (showCommandPopup) {
      setHighlightedIndex(0);
    }
  }, [showCommandPopup, filteredFeatures.length]);

  const handleToggleFeature = (feat) => {
    // Format label to show categories properly in pills
    let prefix = "";
    if (feat.id.startsWith("task:")) prefix = "Task: ";
    else if (feat.id.startsWith("gallery:")) prefix = "Doc: ";
    else if (feat.id.startsWith("email:")) prefix = "Email: ";
    else if (feat.id.startsWith("notes:")) prefix = "Note: ";
    else if (feat.id.startsWith("skill:")) prefix = "Skill: ";
    else if (feat.id.startsWith("mcp:")) prefix = "MCP: ";
    else if (feat.id.startsWith("lsp:")) prefix = "LSP: ";
    else if (feat.id.startsWith("acp:")) prefix = "ACP: ";

    const displayFeature = {
      ...feat,
      label: feat.label.startsWith(prefix) ? feat.label : `${prefix}${feat.label}`
    };

    setSelectedFeatures((prev) => {
      const exists = prev.some((x) => x.id === displayFeature.id);
      if (exists) {
        return prev.filter((x) => x.id !== displayFeature.id);
      } else {
        return [...prev, displayFeature];
      }
    });

    // Clear command input from text area relative to word start
    setValue((prev) => {
      const lastSpaceIdx = Math.max(prev.lastIndexOf(" "), prev.lastIndexOf("\n"));
      const wordStart = lastSpaceIdx === -1 ? 0 : lastSpaceIdx + 1;
      return prev.slice(0, wordStart);
    });

    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleItemClick = (feat) => {
    if (feat.id && feat.id.startsWith("action:")) {
      const featId = feat.id;
      if (featId === "action:skills" || featId === "action:mcp") {
        onAddNewSkill?.();
      } else if (featId === "action:tasks") {
        onNavigateTo?.("tasks");
      } else if (featId === "action:email") {
        onNavigateTo?.("email");
      } else if (featId === "action:notes") {
        onNavigateTo?.("notes");
      } else if (featId === "action:gallery") {
        onNavigateTo?.("docs");
      }

      // Close popup by clearing command input
      setValue((prev) => {
        const lastSpaceIdx = Math.max(prev.lastIndexOf(" "), prev.lastIndexOf("\n"));
        const wordStart = lastSpaceIdx === -1 ? 0 : lastSpaceIdx + 1;
        return prev.slice(0, wordStart);
      });
      setTimeout(() => inputRef.current?.focus(), 0);
    } else if (feat.isFolder) {
      setValue((prev) => {
        const lastSpaceIdx = Math.max(prev.lastIndexOf(" "), prev.lastIndexOf("\n"));
        const wordStart = lastSpaceIdx === -1 ? 0 : lastSpaceIdx + 1;
        return prev.slice(0, wordStart) + feat.label;
      });
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      handleToggleFeature(feat);
    }
  };
  const [attachedFile, setAttachedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!inputRef.current) return;
    const ta = inputRef.current;
    const lineHeight = 24;
    ta.style.height = "auto";
    const lines = Math.max(1, Math.ceil(ta.scrollHeight / lineHeight));
    if (lines <= 12) {
      ta.style.height = `${Math.max(24, ta.scrollHeight)}px`;
      ta.style.overflowY = "hidden";
    } else {
      ta.style.height = `${12 * lineHeight}px`;
      ta.style.overflowY = "auto";
    }
  }, [value]);

  useImperativeHandle(ref, () => ({
    insertTemplate: (templateContent) => {
      setValue((prev) => {
        const next = prev ? `${prev}\n\n${templateContent}` : templateContent;
        setTimeout(() => { inputRef.current?.focus(); inputRef.current?.setSelectionRange(next.length, next.length); }, 0);
        return next;
      });
    },
    setValue: (text) => { setValue(text); setTimeout(() => inputRef.current?.focus(), 0); },
    focus: () => inputRef.current?.focus(),
    getMode: () => mode,
  }), [mode]);

  const uploadFileToRag = useCallback(async (file) => {
    const ext = "." + (file.name.split(".").pop()?.toLowerCase() || "");
    if (!ACCEPTED_TYPES.includes(ext)) { toast.error(`Unsupported file type "${ext}".`); return; }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) { toast.error(`File too large. Max ${MAX_FILE_SIZE_MB} MB.`); return; }
    setAttachedFile({ name: file.name, ext: ext.slice(1) });
    setUploading(true);
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const apiUrl = API_BASE_URL;
      const res = await fetch(`${apiUrl}/documents/upload`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");
      toast.success(`"${file.name}" indexed (${data.chunks} chunks)`);
    } catch (err) {
      toast.error(err.message || "Upload failed");
      setAttachedFile(null);
    } finally {
      setUploading(false);
    }
  }, []);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) uploadFileToRag(file);
    e.target.value = "";
  }, [uploadFileToRag]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      let mimeType = "audio/webm";
      let extension = "webm";
      
      if (typeof MediaRecorder !== "undefined") {
        if (MediaRecorder.isTypeSupported("audio/webm")) {
          mimeType = "audio/webm";
          extension = "webm";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
          extension = "mp4";
        } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
          mimeType = "audio/ogg";
          extension = "ogg";
        } else if (MediaRecorder.isTypeSupported("audio/wav")) {
          mimeType = "audio/wav";
          extension = "wav";
        } else if (MediaRecorder.isTypeSupported("audio/aac")) {
          mimeType = "audio/aac";
          extension = "aac";
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        if (audioBlob.size === 0) return;
        
        const formData = new FormData();
        formData.append("file", audioBlob, `recording.${extension}`);
        
        try {
          toast.info("Transcribing audio...", { id: "voice-transcribing", duration: 4000 });
          const token = localStorage.getItem("token");
          const response = await fetch(`${API_BASE_URL}/audio/transcribe`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`
            },
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error(`Failed to transcribe: ${response.statusText}`);
          }
          
          const result = await response.json();
          if (result.text) {
            setValue((prev) => (prev ? prev + " " + result.text : result.text));
            isVoiceUsedRef.current = true;
            toast.success("Voice transcribed!", { id: "voice-transcribing" });
          } else {
            toast.warning("Speech not recognized, please try again.", { id: "voice-transcribing" });
          }
        } catch (error) {
          console.error("Transcription error:", error);
          toast.error("Audio transcription failed.", { id: "voice-transcribing" });
        }
      };
      
      mediaRecorder.start();
      setIsListening(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast.error("Failed to access microphone. Please check permissions.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setIsListening(false);
  }, []);

  const hasContent = value.trim().length > 0 || !!attachedFile;

  const handleSend = useCallback(async () => {
    if (busy) {
      await onSend?.("", mode, null);
      return;
    }
    if (!hasContent || uploading) return;
    const text = value.trim();
    const currentMode = mode;
    const fileRef = attachedFile ? { name: attachedFile.name } : null;

    const activeFeatures = {
      apps: selectedFeatures.filter(f => f.id.startsWith("app:")).map(f => f.id.split(":")[1]),
      skills: selectedFeatures.filter(f => f.id.startsWith("skill:")).map(f => f.id.split(":")[1]),
      mcp_plugins: selectedFeatures.filter(f => f.id.startsWith("mcp:")).map(f => f.id.split(":")[1]),
      lsp: selectedFeatures.some(f => f.id === "lsp:lsp"),
      acp: selectedFeatures.some(f => f.id === "acp:acp")
    };

    setValue("");
    setAttachedFile(null);
    setSelectedFeatures([]);
    setSending(true);
    try {
      await onSend?.(text, currentMode, fileRef, activeFeatures, isVoiceUsedRef.current);
    } finally {
      setSending(false);
      isVoiceUsedRef.current = false;
    }
  }, [busy, hasContent, uploading, value, mode, attachedFile, onSend, selectedFeatures]);

  return (
    <div className="px-3 pb-2 pt-1 relative">
      {/* Active action badge above composer */}
      <AnimatePresence>
        {activeAction && (
          <div className="flex justify-center mb-1.5">
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }} transition={{ duration: 0.15 }}
            >
              <Badge variant="secondary"
                className="flex items-center gap-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-800/80 px-2.5 py-1 text-[11px] font-medium text-zinc-900 dark:text-zinc-50 shadow-none cursor-default">
                <span className="text-zinc-500">{getActionIcon(activeAction)}</span>
                <span className="truncate capitalize font-semibold">{getActionLabel(activeAction)}</span>
                <button type="button"
                  onClick={() => { setActiveAction(null); setMode(defaultMode); }}
                  className="ml-1 shrink-0 flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
                  title="Clear action">
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Command Popup Dropdown */}
      <AnimatePresence>
        {showCommandPopup && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            className="absolute bottom-full mb-3 left-4 right-4 sm:right-auto sm:left-4 sm:w-[320px] bg-white/95 dark:bg-[#0C0C0D]/95 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl backdrop-blur-md z-50 p-2 max-h-[300px] overflow-y-auto scrollbar-thin flex flex-col gap-1.5"
          >
            {loadingSubMenu && (
              <div className="flex items-center justify-center py-6 gap-2 text-zinc-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-[10px] font-mono leading-none">Loading dashboard data...</span>
              </div>
            )}
            
            {!loadingSubMenu && filteredFeatures.length === 0 ? (
              <p className="text-[11px] text-zinc-500 text-center py-4">No matching items found.</p>
            ) : !loadingSubMenu && (
              Object.entries(
                filteredFeatures.reduce((acc, feat) => {
                  if (!acc[feat.category]) acc[feat.category] = [];
                  acc[feat.category].push(feat);
                  return acc;
                }, {})
              ).map(([cat, feats]) => (
                <div key={cat} className="space-y-1">
                  {cat !== "undefined" && cat !== "null" && cat !== "" && (
                    <span className="block text-[8px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500/85 px-2 pt-1.5">{cat}</span>
                  )}
                  <div className="space-y-0.5">
                    {feats.map((feat) => {
                      const Icon = feat.icon;
                      const isChecked = selectedFeatures.some(x => x.id === feat.id);
                      const isHighlighted = filteredFeatures[highlightedIndex]?.id === feat.id;
                      return (
                        <div
                          key={feat.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleItemClick(feat);
                          }}
                          className={cn(
                            "flex items-center justify-between gap-2.5 rounded-lg px-2 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer select-none transition-colors border border-transparent",
                            isChecked && "bg-primary/5 text-primary hover:bg-primary/10",
                            isHighlighted && "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-950 dark:text-zinc-50 font-semibold"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon className="h-4 w-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
                            <div className="flex flex-col min-w-0">
                              <span className="truncate leading-none font-semibold text-zinc-900 dark:text-zinc-100">{feat.label}</span>
                            </div>
                          </div>
                          {feat.isFolder ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 shrink-0">
                              <path d="m9 18 6-6-6-6"/>
                            </svg>
                          ) : feat.id && feat.id.startsWith("action:") ? (
                            <Plus className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                          ) : (
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="accent-primary h-3.5 w-3.5 rounded shrink-0 cursor-pointer"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cn(
        "mx-auto max-w-3xl rounded-2xl border bg-white dark:bg-[#0B0B0C] border-zinc-200 dark:border-zinc-800/80 shadow-sm transition-all duration-200",
        isFocused && "border-zinc-300 dark:border-zinc-700"
      )}>
        {/* Selected Command Features Row */}
        {selectedFeatures.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 px-4 pt-2.5">
            {selectedFeatures.map((feat) => {
              const Icon = feat.icon;
              return (
                <Badge
                  key={feat.id}
                  variant="secondary"
                  className="flex items-center gap-1 px-2.5 py-0.5 text-[10px] bg-primary/10 border border-primary/20 text-primary font-bold rounded-full leading-none shrink-0"
                >
                  <Icon className="h-2.5 w-2.5 mr-0.5 shrink-0" />
                  <span>{feat.label}</span>
                  <button
                    onClick={() => setSelectedFeatures((prev) => prev.filter((f) => f.id !== feat.id))}
                    className="ml-1 hover:text-red-500 transition-colors shrink-0 cursor-pointer"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              );
            })}
          </div>
        )}

        {/* Attached file row (only visible when file attached) */}
        <AnimatePresence>
          {attachedFile && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="flex items-center px-3 pt-2.5 pb-0"
            >
              <AttachedFilePill file={attachedFile} uploading={uploading} onRemove={() => setAttachedFile(null)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Textarea */}
        <div className="px-4 pt-2.5 pb-1">
          <textarea
            ref={inputRef} value={value} onChange={(e) => setValue(e.target.value)}
            onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
            placeholder={`Message ${selectedBot || "TriVisionX"} ...`} rows={1}
            className="w-full resize-none bg-transparent text-[14.5px] leading-relaxed text-zinc-800 dark:text-zinc-100 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600 scrollbar-thin"
            onKeyDown={(e) => {
              if (showCommandPopup) {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setHighlightedIndex((prev) => (filteredFeatures.length > 0 ? (prev + 1) % filteredFeatures.length : 0));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setHighlightedIndex((prev) => (filteredFeatures.length > 0 ? (prev - 1 + filteredFeatures.length) % filteredFeatures.length : 0));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  if (filteredFeatures[highlightedIndex]) {
                    handleItemClick(filteredFeatures[highlightedIndex]);
                  }
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  setValue((prev) => {
                    const lastSpaceIdx = Math.max(prev.lastIndexOf(" "), prev.lastIndexOf("\n"));
                    const wordStart = lastSpaceIdx === -1 ? 0 : lastSpaceIdx + 1;
                    return prev.slice(0, wordStart);
                  });
                }
              } else {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }
            }}
          />
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between px-2.5 pb-2 pt-1 gap-2">
          {/* Left: + (actions) */}
          <div className="flex items-center gap-1.5">
            <Tooltip>
              <ComposerActionsPopover
                onFileSelect={uploadFileToRag} mode={mode}
                setMode={(m) => { setMode(m); setActiveAction(m); }}
                activeAction={activeAction}
              >
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="group h-7 w-7 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 shrink-0 cursor-pointer">
                    <Plus className="h-4 w-4 transition-transform duration-300 ease-in-out group-data-[state=open]:rotate-90" />
                  </Button>
                </TooltipTrigger>
              </ComposerActionsPopover>
              <TooltipContent side="top">Actions Menu</TooltipContent>
            </Tooltip>
          </div>

          {/* Right: Agent/Chat segment + Mic + Send */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-0.5 bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-200/50 dark:border-zinc-800/80">
              <button type="button"
                onClick={() => { setActiveAction("agent"); setMode("agent"); }}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer select-none leading-none",
                  activeAction === "agent"
                    ? "bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 shadow-sm border border-zinc-200 dark:border-zinc-800"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                )}>Agent</button>
              <button type="button"
                onClick={() => { setActiveAction(null); setMode(defaultMode); }}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer select-none leading-none",
                  !activeAction || activeAction !== "agent"
                    ? "bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 shadow-sm border border-zinc-200 dark:border-zinc-800"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                )}>Chat</button>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative flex items-center justify-center">
                  {isListening && (
                    <>
                      <span className="absolute inset-0 rounded-lg animate-ping bg-red-500/40" />
                      <span className="absolute -inset-1 rounded-lg animate-pulse bg-red-500/20" />
                    </>
                  )}
                  <Button variant="ghost" size="icon"
                    onClick={() => isListening ? stopRecording() : startRecording()}
                    className={cn(
                      "relative h-7 w-7 rounded-lg transition-all duration-300",
                      isListening ? "bg-red-500 text-white hover:bg-red-600 shadow-md" : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    )}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("h-4 w-4", isListening && "animate-pulse")}>
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" x2="12" y1="19" y2="22" />
                    </svg>
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">Voice input</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={handleSend} disabled={(!hasContent && !busy) || uploading} size="icon"
                  className={cn(
                    "h-7 w-7 rounded-lg transition-all duration-200",
                    hasContent || busy
                      ? "bg-zinc-950 text-white hover:bg-zinc-900 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 shadow-sm cursor-pointer"
                      : "bg-muted text-muted-foreground cursor-not-allowed opacity-50",
                  )}>
                  {sending || busy ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <ArrowUp className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">{busy ? "Stop" : "Send message"}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      <input type="file" accept={ACCEPTED_TYPES.join(",")} className="hidden" ref={fileInputRef} onChange={handleFileChange} />
    </div>
  );
});

export default Composer;