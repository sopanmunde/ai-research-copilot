"use client"

import DocumentViewer from "@/components/DocumentViewer"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  GripVertical,
  LayoutGrid,
  Loader,
  Plus,
  MoreVertical,
  SlidersHorizontal,
  List,
  // File type icons
  FileText,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileVideo,
  FileAudio,
  FileJson,
  FilePieChart,
  File as FileIcon,
  MessageSquare,
  Eye,
  Trash2,
  RefreshCw,
  Search,
  Pencil,
  Pin,
  PinOff,
  Download,
  Check,
} from "lucide-react"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { toast } from "sonner"

import { useIsMobile } from "@/components/ui/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

import { API_BASE_URL } from "@/lib/api"
import { cn } from "@/lib/utils"


interface Document {
  id: string
  filename: string
  file_type: string
  chunk_count: number
  file_size?: number
  uploaded_at: string
}

function formatBytes(bytes?: number) {
  if (bytes === undefined || bytes === null || bytes === 0) return "0 KB"
  return (bytes / 1024).toFixed(1) + " KB"
}

interface Conversation {
  id: string
  title: string
  folder: string | null
  pinned: boolean
  messageCount: number
  updated_at: string
  preview: string
}

type TableRowData = Document | Conversation


type FileIconInfo = {
  Icon: React.ElementType
}

function getFileIcon(filename: string): FileIconInfo {
  const ext = filename.split(".").pop()?.toLowerCase() || ""
  if (["pdf", "doc", "docx", "odt", "rtf", "md", "mdx", "rst", "txt", "log"].includes(ext))
    return { Icon: FileText }
  if (["xls", "xlsx", "csv", "tsv"].includes(ext))
    return { Icon: FileSpreadsheet }
  if (["ppt", "pptx"].includes(ext))
    return { Icon: FilePieChart }
  if (["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp", "tiff", "ico"].includes(ext))
    return { Icon: FileImage }
  if (["mp4", "webm", "mov", "avi", "mkv"].includes(ext))
    return { Icon: FileVideo }
  if (["mp3", "wav", "aac", "flac", "ogg", "m4a"].includes(ext))
    return { Icon: FileAudio }
  if (["json", "jsonl"].includes(ext))
    return { Icon: FileJson }
  if (["yaml", "yml", "xml", "toml", "py", "js", "ts", "jsx", "tsx", "java", "cpp", "c", "cs", "go", "rs", "rb", "php", "sh", "sql"].includes(ext))
    return { Icon: FileCode }
  return { Icon: FileIcon }
}

function getFilterIcon(filter: string): React.ElementType {
  switch (filter) {
    case "conversations":
      return MessageSquare
    case "pdf-docs":
    case "word-docs":
    case "txt-docs":
      return FileText
    case "image-docs":
      return FileImage
    case "spreadsheet-docs":
      return FileSpreadsheet
    case "presentation-docs":
      return FilePieChart
    case "code-docs":
      return FileCode
    case "all-docs":
    default:
      return FileIcon
  }
}

// ── Realistic Document Icon Component ─────────────────────────────────────────
function RealisticDocIcon({ filename, size = "md", className }: { filename: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const ext = filename?.split(".").pop()?.toLowerCase() || ""

  const dimensions = {
    sm: "w-5 h-6.5 text-[5px]",
    md: "w-6.5 h-8.5 text-[6.5px]",
    lg: "w-9 h-11 text-[8px]",
  }[size] || "w-6.5 h-8.5 text-[6.5px]"

  let theme = {
    badge: "PDF",
    bg: "from-red-500/20 via-red-500/10 to-rose-600/20",
    border: "border-red-500/40",
    headerBg: "bg-red-600 text-white",
    linesColor: "bg-red-400/50",
    IconComponent: FileText,
    accent: "text-red-400",
  }

  if (["pdf"].includes(ext)) {
    theme = {
      badge: "PDF",
      bg: "from-red-500/20 via-red-500/10 to-rose-600/20",
      border: "border-red-500/40",
      headerBg: "bg-red-600 text-white",
      linesColor: "bg-red-400/50",
      IconComponent: FileText,
      accent: "text-red-400",
    }
  } else if (["doc", "docx", "rtf", "odt"].includes(ext)) {
    theme = {
      badge: "DOCX",
      bg: "from-blue-500/20 via-blue-500/10 to-indigo-600/20",
      border: "border-blue-500/40",
      headerBg: "bg-blue-600 text-white",
      linesColor: "bg-blue-400/50",
      IconComponent: FileText,
      accent: "text-blue-400",
    }
  } else if (["xls", "xlsx", "csv"].includes(ext)) {
    theme = {
      badge: "XLS",
      bg: "from-emerald-500/20 via-emerald-500/10 to-teal-600/20",
      border: "border-emerald-500/40",
      headerBg: "bg-emerald-600 text-white",
      linesColor: "bg-emerald-400/50",
      IconComponent: FileSpreadsheet,
      accent: "text-emerald-400",
    }
  } else if (["ppt", "pptx"].includes(ext)) {
    theme = {
      badge: "PPT",
      bg: "from-orange-500/20 via-orange-500/10 to-amber-600/20",
      border: "border-orange-500/40",
      headerBg: "bg-orange-600 text-white",
      linesColor: "bg-orange-400/50",
      IconComponent: FilePieChart,
      accent: "text-orange-400",
    }
  } else if (["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(ext)) {
    theme = {
      badge: ext.toUpperCase().slice(0, 4),
      bg: "from-purple-500/20 via-purple-500/10 to-pink-600/20",
      border: "border-purple-500/40",
      headerBg: "bg-purple-600 text-white",
      linesColor: "bg-purple-400/50",
      IconComponent: FileImage,
      accent: "text-purple-400",
    }
  } else if (["json", "jsonl"].includes(ext)) {
    theme = {
      badge: "JSON",
      bg: "from-amber-500/20 via-amber-500/10 to-yellow-600/20",
      border: "border-amber-500/40",
      headerBg: "bg-amber-600 text-white",
      linesColor: "bg-amber-400/50",
      IconComponent: FileJson,
      accent: "text-amber-400",
    }
  } else if (["py", "js", "ts", "jsx", "tsx", "java", "cpp", "c", "cs", "go", "rs", "html", "css", "sh", "sql"].includes(ext)) {
    theme = {
      badge: ext.toUpperCase().slice(0, 4),
      bg: "from-cyan-500/20 via-cyan-500/10 to-blue-600/20",
      border: "border-cyan-500/40",
      headerBg: "bg-cyan-600 text-white",
      linesColor: "bg-cyan-400/50",
      IconComponent: FileCode,
      accent: "text-cyan-400",
    }
  } else if (["mp3", "wav", "mp4", "mov", "avi"].includes(ext)) {
    theme = {
      badge: "MEDIA",
      bg: "from-pink-500/20 via-pink-500/10 to-purple-600/20",
      border: "border-pink-500/40",
      headerBg: "bg-pink-600 text-white",
      linesColor: "bg-pink-400/50",
      IconComponent: FileVideo,
      accent: "text-pink-400",
    }
  } else {
    theme = {
      badge: ext.toUpperCase().slice(0, 4) || "TXT",
      bg: "from-zinc-500/20 via-zinc-500/10 to-slate-600/20",
      border: "border-zinc-500/40",
      headerBg: "bg-zinc-600 text-white",
      linesColor: "bg-zinc-400/50",
      IconComponent: FileText,
      accent: "text-zinc-400",
    }
  }

  return (
    <div className={cn("relative shrink-0 select-none group/docicon", dimensions, className)}>
      <div className={cn(
        "relative w-full h-full rounded bg-gradient-to-b border shadow-xs flex flex-col overflow-hidden transition-all duration-300 group-hover/docicon:scale-105 group-hover/docicon:-translate-y-0.5",
        theme.bg,
        theme.border
      )}>
        {/* Folded Corner */}
        <div className="absolute top-0 right-0 w-2 h-2 bg-zinc-700/80 shadow-xs rounded-bl-sm border-l border-b border-white/20 z-10" />

        {/* Ribbon Header Badge */}
        <div className={cn("px-0.5 py-0.2 font-bold tracking-tight flex items-center justify-between shadow-xs leading-none", theme.headerBg)}>
          <span>{theme.badge}</span>
        </div>

        {/* Mini Document Body Lines */}
        <div className="flex-1 p-0.5 flex flex-col justify-between items-center opacity-90">
          <theme.IconComponent className={cn("w-2.5 h-2.5 mt-0.5 shrink-0", theme.accent)} />
          <div className="w-full space-y-0.5 mb-0.5">
            <div className={cn("h-0.5 w-full rounded-full", theme.linesColor)} />
            <div className={cn("h-0.5 w-3/4 rounded-full", theme.linesColor)} />
          </div>
        </div>
      </div>
    </div>
  )
}

function DocVisualPreview({ doc }: { doc: Document }) {
  const ext = doc.filename.split(".").pop()?.toLowerCase() || ""
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  const isImage = ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(ext)
  const isCode = ["py", "js", "ts", "jsx", "tsx", "java", "cpp", "c", "cs", "go", "rs", "rb", "php", "sh", "sql", "json", "yaml", "yml", "xml", "html", "css"].includes(ext)
  const isSheet = ["xls", "xlsx", "csv", "tsv"].includes(ext)
  const isPdf = ["pdf"].includes(ext)
  const isWord = ["doc", "docx", "rtf", "odt"].includes(ext)
  const isPpt = ["ppt", "pptx"].includes(ext)
  const isAudioVideo = ["mp3", "wav", "aac", "flac", "ogg", "mp4", "webm", "mov", "avi"].includes(ext)

  const [imageBlobUrl, setImageBlobUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!doc.id || !isImage) return
    let isMounted = true

    const fetchImage = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/documents/${doc.id}/download`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (res.ok) {
          const blob = await res.blob()
          if (blob.size > 0) {
            const url = URL.createObjectURL(blob)
            if (isMounted) setImageBlobUrl(url)
          }
        }
      } catch (e) {
        console.error(e)
      }
    }
    fetchImage()
    return () => { isMounted = false }
  }, [doc.id, isImage, token])

  if (isImage) {
    const isJpg = ["jpg", "jpeg"].includes(ext)
    const isPng = ext === "png"
    const badgeLabel = isJpg ? "JPG" : isPng ? "PNG" : ext.toUpperCase().slice(0, 4) || "IMG"

    return (
      <div className="relative w-full h-full bg-zinc-950/90 rounded-xl overflow-hidden p-2.5 border border-zinc-800/80 flex flex-col justify-between group-hover:border-white/30 transition-colors">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent pointer-events-none" />
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <div className="h-4.5 px-1.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700 text-[8.5px] font-extrabold flex items-center shadow-xs">
              {badgeLabel}
            </div>
            <span className="text-[10px] font-mono text-zinc-300 font-medium truncate">{doc.filename}</span>
          </div>
        </div>

        <div className="my-1 p-1.5 bg-zinc-900/90 border border-zinc-800/70 rounded-lg flex-1 overflow-hidden flex flex-col justify-center items-center gap-1.5 z-10 relative">
          {imageBlobUrl ? (
            <img
              src={imageBlobUrl}
              alt={doc.filename}
              className="w-full h-full object-cover rounded-md opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
            />
          ) : (
            <>
              <FileImage className="h-7 w-7 text-purple-400 group-hover:scale-110 transition-transform" />
              <div className="w-full space-y-1 opacity-60">
                <div className="h-1 w-4/5 mx-auto rounded bg-zinc-700/60" />
                <div className="h-1 w-3/5 mx-auto rounded bg-zinc-800/80" />
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  if (isPdf) {
    return (
      <div className="relative w-full h-full bg-zinc-950/90 rounded-xl overflow-hidden p-2.5 border border-zinc-800/80 flex flex-col justify-between group-hover:border-white/30 transition-colors">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent pointer-events-none" />
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <div className="h-4.5 px-1.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700 text-[8.5px] font-extrabold flex items-center shadow-xs">
              PDF
            </div>
            <span className="text-[10px] font-mono text-zinc-300 font-medium truncate">{doc.filename}</span>
          </div>
        </div>

        <div className="my-1 p-2 bg-zinc-900/90 border border-zinc-800/70 rounded-lg flex-1 overflow-hidden flex flex-col justify-center items-center gap-1.5 z-10">
          <FileText className="h-7 w-7 text-red-500 group-hover:scale-110 transition-transform" />
          <div className="w-full space-y-1 opacity-60">
            <div className="h-1 w-4/5 mx-auto rounded bg-zinc-700/60" />
            <div className="h-1 w-3/5 mx-auto rounded bg-zinc-800/80" />
          </div>
        </div>
      </div>
    )
  }

  if (isWord) {
    return (
      <div className="relative w-full h-full bg-zinc-950/90 rounded-xl overflow-hidden p-2.5 border border-zinc-800/80 flex flex-col justify-between group-hover:border-white/30 transition-colors">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent pointer-events-none" />
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <div className="h-4.5 px-1.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700 text-[8.5px] font-extrabold flex items-center shadow-xs">
              DOCX
            </div>
            <span className="text-[10px] font-mono text-zinc-300 font-medium truncate">{doc.filename}</span>
          </div>
        </div>

        <div className="my-1 p-2 bg-zinc-900/90 border border-zinc-800/70 rounded-lg flex-1 overflow-hidden flex flex-col justify-center items-center gap-1.5 z-10">
          <FileText className="h-7 w-7 text-blue-500 group-hover:scale-110 transition-transform" />
          <div className="w-full space-y-1 opacity-60">
            <div className="h-1 w-4/5 mx-auto rounded bg-zinc-700/60" />
            <div className="h-1 w-3/5 mx-auto rounded bg-zinc-800/80" />
          </div>
        </div>
      </div>
    )
  }

  if (isCode) {
    return (
      <div className="relative w-full h-full bg-zinc-950/90 rounded-xl overflow-hidden p-2.5 border border-zinc-800/80 flex flex-col justify-between group-hover:border-white/30 transition-colors font-mono text-[10px]">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent pointer-events-none" />
        <div className="flex items-center justify-between opacity-90 z-10">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <div className="flex items-center gap-1 mr-1">
              <span className="size-1.5 rounded-full bg-rose-500" />
              <span className="size-1.5 rounded-full bg-amber-500" />
              <span className="size-1.5 rounded-full bg-emerald-500" />
            </div>
            <div className="h-4.5 px-1.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700 text-[8.5px] font-extrabold flex items-center shadow-xs uppercase">
              {ext}
            </div>
            <span className="text-[10px] font-mono text-zinc-300 font-medium truncate">{doc.filename}</span>
          </div>
        </div>

        <div className="my-1 p-2 bg-zinc-900/90 border border-zinc-800/70 rounded-lg flex-1 overflow-hidden flex flex-col justify-center items-center gap-1.5 z-10">
          <FileCode className="h-7 w-7 text-cyan-400 group-hover:scale-110 transition-transform" />
          <div className="w-full space-y-1 opacity-60">
            <div className="h-1 w-3/4 mx-auto rounded bg-zinc-700/60" />
            <div className="h-1 w-1/2 mx-auto rounded bg-zinc-800/80" />
          </div>
        </div>
      </div>
    )
  }

  if (isSheet) {
    return (
      <div className="relative w-full h-full bg-zinc-950/90 rounded-xl overflow-hidden p-2.5 border border-zinc-800/80 flex flex-col justify-between group-hover:border-white/30 transition-colors">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent pointer-events-none" />
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <div className="h-4.5 px-1.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700 text-[8.5px] font-extrabold flex items-center shadow-xs">
              XLS
            </div>
            <span className="text-[10px] font-mono text-zinc-300 font-medium truncate">{doc.filename}</span>
          </div>
        </div>

        <div className="my-1 p-2 bg-zinc-900/90 border border-zinc-800/70 rounded-lg flex-1 overflow-hidden flex flex-col justify-center items-center gap-1.5 z-10">
          <FileSpreadsheet className="h-7 w-7 text-emerald-500 group-hover:scale-110 transition-transform" />
          <div className="grid grid-cols-3 gap-1 w-full opacity-60">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-1.5 rounded bg-zinc-800 border border-zinc-700/60" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isPpt) {
    return (
      <div className="relative w-full h-full bg-zinc-950/90 rounded-xl overflow-hidden p-2.5 border border-zinc-800/80 flex flex-col justify-between group-hover:border-white/30 transition-colors">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent pointer-events-none" />
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <div className="h-4.5 px-1.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700 text-[8.5px] font-extrabold flex items-center shadow-xs">
              PPT
            </div>
            <span className="text-[10px] font-mono text-zinc-300 font-medium truncate">{doc.filename}</span>
          </div>
        </div>

        <div className="my-1 p-2 bg-zinc-900/90 border border-zinc-800/70 rounded-lg flex-1 overflow-hidden flex flex-col justify-center items-center gap-1.5 z-10">
          <FilePieChart className="h-7 w-7 text-orange-500 group-hover:scale-110 transition-transform" />
          <div className="w-full space-y-1 opacity-60">
            <div className="h-1 w-3/4 mx-auto rounded bg-zinc-700/60" />
            <div className="h-1 w-1/2 mx-auto rounded bg-zinc-800/80" />
          </div>
        </div>
      </div>
    )
  }

  if (isAudioVideo) {
    return (
      <div className="relative w-full h-full bg-zinc-950/90 rounded-xl overflow-hidden p-2.5 border border-zinc-800/80 flex flex-col justify-between group-hover:border-white/30 transition-colors">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent pointer-events-none" />
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <FileVideo className="h-3.5 w-3.5 text-purple-400 shrink-0" />
            <span className="text-[10px] font-mono text-zinc-300 font-medium truncate">{doc.filename}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1 my-1 h-7 opacity-85 group-hover:opacity-100 transition-opacity z-10">
          {[40, 70, 30, 90, 60, 100, 45, 80, 50, 65, 35, 85].map((h, i) => (
            <div
              key={i}
              style={{ height: `${h}%` }}
              className="w-1 rounded-full bg-purple-400 group-hover:bg-purple-300 transition-colors"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-zinc-950/90 rounded-xl overflow-hidden p-2.5 border border-zinc-800/80 flex flex-col justify-between group-hover:border-white/30 transition-colors">
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent pointer-events-none" />
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <FileText className="h-3.5 w-3.5 text-zinc-300 shrink-0" />
          <span className="text-[10px] font-mono text-zinc-300 font-medium truncate">{doc.filename}</span>
        </div>
      </div>

      <div className="my-1 p-2 bg-zinc-900/90 border border-zinc-800/70 rounded-lg flex-1 overflow-hidden flex flex-col justify-center items-center gap-1.5 z-10">
        <FileText className="h-7 w-7 text-zinc-300 group-hover:scale-110 transition-transform" />
        <div className="w-full space-y-1 opacity-60">
          <div className="h-1 w-3/4 mx-auto rounded bg-zinc-700/60" />
          <div className="h-1 w-1/2 mx-auto rounded bg-zinc-800/80" />
        </div>
      </div>
    </div>
  )
}

function DocFileIcon({ filename }: { filename: string }) {
  return <RealisticDocIcon filename={filename} size="sm" />
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}


function DragHandle({ id }: { id: UniqueIdentifier }) {
  const { attributes, listeners } = useSortable({ id })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="size-7 text-muted-foreground hover:bg-transparent cursor-grab active:cursor-grabbing"
    >
      <GripVertical className="size-3 text-muted-foreground" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}


function makeDocColumns(onView: (doc: Document) => void, onDelete: (doc: Document) => void): ColumnDef<Document>[] {
  return [
    {
      id: "drag",
      header: () => null,
      cell: ({ row }) => <DragHandle id={row.original.id} />,
    },
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "filename",
      header: "Filename",
      cell: ({ row }) => {
        return (
          <button
            onClick={() => onView(row.original)}
            className="flex items-center gap-2.5 max-w-[280px] text-left cursor-pointer group"
          >
            <DocFileIcon filename={row.original.filename} />
            <span className="truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">
              {row.original.filename}
            </span>
          </button>
        )
      },
      enableHiding: false,
    },
    {
      accessorKey: "file_type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline" className="px-1.5 text-muted-foreground font-mono text-[11px] uppercase">
          {row.original.file_type}
        </Badge>
      ),
    },
    {
      accessorKey: "file_size",
      header: "Size",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {formatBytes(row.original.file_size)}
        </span>
      ),
    },
    {
      accessorKey: "uploaded_at",
      header: "Uploaded",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.uploaded_at)}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
              size="icon"
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => onView(row.original)} className="gap-2">
              <Eye className="h-3.5 w-3.5" /> View details
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2">
              <RefreshCw className="h-3.5 w-3.5" /> Re-index
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => onDelete(row.original)} className="gap-2">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}


const convColumns: ColumnDef<Conversation>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <div className="max-w-[280px]">
        <span className="text-sm font-medium text-foreground truncate block">
          {row.original.title}
        </span>
        {row.original.preview && (
          <span className="text-xs text-muted-foreground truncate block mt-0.5">
            {row.original.preview}
          </span>
        )}
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "folder",
    header: "Folder",
    cell: ({ row }) => (
      <Badge variant="outline" className="px-1.5 text-muted-foreground text-[11px]">
        {row.original.folder || "Uncategorized"}
      </Badge>
    ),
  },
  {
    accessorKey: "messageCount",
    header: "Messages",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground tabular-nums">
        {row.original.messageCount}
      </span>
    ),
  },
  {
    accessorKey: "updated_at",
    header: "Last Updated",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(row.original.updated_at)}
      </span>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
            size="icon"
          >
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40 text-xs">
          <DropdownMenuItem className="gap-2">
            <MessageSquare className="h-3.5 w-3.5" /> Open conversation
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2">
            <Pencil className="h-3.5 w-3.5" /> Rename
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2">
            {row.original.pinned ? (
              <>
                <PinOff className="h-3.5 w-3.5" /> Unpin
              </>
            ) : (
              <>
                <Pin className="h-3.5 w-3.5" /> Pin
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" className="gap-2">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]


function DraggableRow({ row }: { row: any }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell: any) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}


function TablePagination({ table }: { table: any }) {
  return (
    <div className="flex items-center justify-between px-4">
      <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
        {table.getFilteredSelectedRowModel().rows.length} of{" "}
        {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
      <div className="flex w-full items-center gap-8 lg:w-fit">
        <div className="hidden items-center gap-2 lg:flex">
          <Label htmlFor="rows-per-page" className="text-sm font-medium">
            Rows per page
          </Label>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger size="sm" className="w-20" id="rows-per-page">
              <SelectValue
                placeholder={table.getState().pagination.pageSize}
              />
            </SelectTrigger>
            <SelectContent side="top">
              {[12, 24, 50, 100].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-fit items-center justify-center text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden size-8 lg:flex"
            size="icon"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}


function useAuthHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

function DocumentDataTable({
  refreshKey,
  onUploadTrigger,
  uploading,
  docTypeFilter,
  onTableInstance,
  layoutMode,
  onDeleteSuccess,
}: {
  refreshKey: number
  onUploadTrigger: () => void
  uploading: boolean
  docTypeFilter: string
  onTableInstance: (table: any) => void
  layoutMode: "table" | "grid"
  onDeleteSuccess?: () => void
}) {
  const [data, setData] = React.useState<Document[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  async function handleDeleteDoc(doc: Document) {
    const token = localStorage.getItem("token")
    const toastId = toast.loading(`Deleting "${doc.filename}"...`)
    try {
      const res = await fetch(`${API_BASE_URL}/documents/${doc.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error("Failed to delete document")
      toast.success(`Deleted "${doc.filename}" successfully`, { id: toastId })
      if (onDeleteSuccess) onDeleteSuccess()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to delete document", { id: toastId })
    }
  }
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 50 })

  const [viewerOpen, setViewerOpen] = React.useState(false)
  const [viewerDoc, setViewerDoc] = React.useState<Document | null>(null)

  function openViewer(doc: Document) {
    setViewerDoc(doc)
    setViewerOpen(true)
  }
  const sortableId = React.useId()
  const headers = useAuthHeaders()
  const isMobile = useIsMobile()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  React.useEffect(() => {
    const fetchDocs = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
        if (!token) {
          setData([])
          setIsLoading(false)
          return
        }
        const res = await fetch(`${API_BASE_URL}/documents`, {
          headers: {
            Authorization: `Bearer ${token}`,
            ...headers,
          },
        })
        if (res.ok) {
          const docs = await res.json()
          setData(docs || [])
        } else {
          setData([])
        }
      } catch (err) {
        console.warn("Failed to fetch documents", err)
        setData([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchDocs()
  }, [refreshKey])

  const filteredData = React.useMemo(() => {
    if (!docTypeFilter || docTypeFilter === "all-docs") return data;
    return data.filter((d) => {
      const ext = d.filename.split(".").pop()?.toLowerCase() || "";
      if (docTypeFilter === "pdf-docs") return ext === "pdf";
      if (docTypeFilter === "txt-docs") return ["txt", "md", "rtf", "odt", "rst"].includes(ext);
      if (docTypeFilter === "image-docs") return ["png", "jpg", "jpeg", "gif", "webp", "bmp", "tiff", "svg"].includes(ext);
      if (docTypeFilter === "spreadsheet-docs") return ["xlsx", "xls", "csv"].includes(ext);
      if (docTypeFilter === "presentation-docs") return ["pptx", "ppt"].includes(ext);
      if (docTypeFilter === "word-docs") return ["docx", "doc"].includes(ext);
      if (docTypeFilter === "code-docs") return ["py", "js", "ts", "jsx", "tsx", "java", "cpp", "c", "cs", "go", "rs", "html", "css", "sh", "sql"].includes(ext);
      return true;
    });
  }, [data, docTypeFilter]);

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => filteredData?.map((d) => d.id) || [],
    [filteredData]
  )

  const docColumns = React.useMemo(() => makeDocColumns(openViewer, handleDeleteDoc), [openViewer])

  const table = useReactTable({
    data: filteredData,
    columns: docColumns,
    getRowId: (row) => row.id,
    state: { sorting, columnVisibility, rowSelection, columnFilters, pagination },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  React.useEffect(() => {
    if (onTableInstance) {
      onTableInstance(table)
    }
  }, [table, onTableInstance])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((prev) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Table Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/30 p-3 rounded-xl border border-border/50">
          <div className="relative flex-1 max-w-sm">
            <Input
              placeholder="Search documents by name..."
              value={(table.getColumn("filename")?.getFilterValue() as string) ?? ""}
              onChange={(e) => table.getColumn("filename")?.setFilterValue(e.target.value)}
              className="w-full pl-9 h-9 bg-background border-input focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring transition-colors"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
          </div>

          <Button
            onClick={onUploadTrigger}
            disabled={uploading}
            variant="default"
            size="sm"
            className="h-9 cursor-pointer ml-auto"
          >
            {uploading ? (
              <Loader className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Upload New
          </Button>
        </div>

        {layoutMode === "grid" ? (
          table.getRowModel().rows.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 p-1">
              {table.getRowModel().rows.map((row) => {
                const doc = row.original;
                const isSelected = row.getIsSelected();

                return (
                  <div
                    key={doc.id}
                    className={cn(
                      "group/card relative flex flex-col justify-between h-[225px] p-3.5 rounded-xl border bg-zinc-950/85 border-zinc-800/80 backdrop-blur-2xl transition-all duration-300 shadow-md hover:border-white/50 hover:shadow-[0_0_22px_rgba(255,255,255,0.15)] hover:-translate-y-1.5 overflow-hidden cursor-pointer select-none",
                      isSelected
                        ? "border-white/70 ring-2 ring-white/20 bg-zinc-900/90"
                        : "border-zinc-800/80 hover:border-white/40"
                    )}
                    onClick={() => openViewer(doc)}
                  >
                    {/* Glowing Top Ambient White Shine Beam on Card Hover */}
                    <div className="absolute inset-x-0 -top-px h-[2px] bg-gradient-to-r from-transparent via-white/90 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 shadow-[0_0_12px_rgba(255,255,255,0.9)]" />

                    {/* White Sheen Glass Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent pointer-events-none" />

                    {/* Top Header Row (Realistic Icon + Filename + Selection Checkbox) */}
                    <div className="flex items-center justify-between gap-2 z-10">
                      <div className="flex items-center gap-1.5 overflow-hidden min-w-0">
                        <RealisticDocIcon filename={doc.filename} size="sm" />
                        <span
                          className="font-semibold text-xs text-foreground truncate tracking-tight group-hover/card:text-primary transition-colors"
                          title={doc.filename}
                        >
                          {doc.filename}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          row.toggleSelected(!isSelected);
                        }}
                        className={cn(
                          "size-5.5 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 border",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-sm scale-100 opacity-100"
                            : "bg-muted/80 hover:bg-muted border-border/80 text-muted-foreground hover:text-foreground opacity-60 group-hover/card:opacity-100"
                        )}
                        title={isSelected ? "Deselect document" : "Select document"}
                      >
                        <Check className="size-2.5 stroke-[3]" />
                      </button>
                    </div>

                    {/* Main Middle Section (Preview Banner + Hover Floating Action Bar) */}
                    <div className="relative flex-1 my-1.5 rounded-lg overflow-hidden bg-zinc-950/80 border border-border/40 flex items-center justify-center group-hover/card:border-border/80 transition-colors shadow-inner">
                      {/* Visual File Preview */}
                      <DocVisualPreview doc={doc} />

                      {/* Glassmorphic Floating Action Bar (Visible on Card Hover) */}
                      <div
                        className="absolute inset-x-0 bottom-0 p-1.5 z-20 flex items-center justify-center gap-1.5 bg-gradient-to-t from-zinc-950/95 via-zinc-950/70 to-transparent opacity-0 group-hover/card:opacity-100 transition-all duration-200 transform translate-y-1 group-hover/card:translate-y-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => openViewer(doc)}
                          className="h-6 px-2.5 rounded-md bg-zinc-900/90 hover:bg-zinc-800 text-zinc-100 border border-zinc-700/70 shadow-md backdrop-blur-md flex items-center gap-1 text-[10px] font-medium transition-transform hover:scale-105 cursor-pointer"
                          title="View Document Details"
                        >
                          <Eye className="size-3 text-primary" /> View
                        </button>

                        <a
                          href={`${API_BASE_URL}/documents/${doc.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          download={doc.filename}
                          className="h-6 px-2.5 rounded-md bg-zinc-900/90 hover:bg-zinc-800 text-zinc-100 border border-zinc-700/70 shadow-md backdrop-blur-md flex items-center gap-1 text-[10px] font-medium transition-transform hover:scale-105"
                          title="Download File"
                        >
                          <Download className="size-3 text-emerald-400" /> Save
                        </a>

                        <button
                          type="button"
                          onClick={() => handleDeleteDoc(doc)}
                          className="h-6 w-6 rounded-md bg-rose-950/90 hover:bg-rose-900 text-rose-400 border border-rose-800/70 shadow-md backdrop-blur-md flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
                          title="Delete Document"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center border border-dashed border-border rounded-xl text-xs text-muted-foreground bg-muted/10">
              No documents found. Upload files to get started.
            </div>
          )
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <DndContext
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleDragEnd}
              sensors={sensors}
              id={sortableId}
            >
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody className="**:data-[slot=table-cell]:first:w-8">
                  {table.getRowModel().rows.length ? (
                    <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
                      {table.getRowModel().rows.map((row) => (
                        <DraggableRow key={row.id} row={row} />
                      ))}
                    </SortableContext>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={docColumns.length} className="h-24 text-center text-muted-foreground text-xs font-medium">
                        No documents found. Upload files to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </DndContext>
          </div>
        )}

        <TablePagination table={table} />
      </div>

      {/* ── Document Viewer (slide-in panel) ── */}
      <DocumentViewer
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        file={viewerDoc ? {
          name: viewerDoc.filename,
          uploadedAt: viewerDoc.uploaded_at,
          url: `${API_BASE_URL}/documents/${viewerDoc.id}/download`,
        } : null}
      />
    </>
  )
}

function ConversationDataTable() {
  const [data, setData] = React.useState<Conversation[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })
  const sortableId = React.useId()
  const headers = useAuthHeaders()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  React.useEffect(() => {
    const fetchConvs = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
        if (!token) {
          setData([])
          setIsLoading(false)
          return
        }
        const res = await fetch(`${API_BASE_URL}/conversations`, {
          headers: {
            Authorization: `Bearer ${token}`,
            ...headers,
          },
        })
        if (res.ok) {
          const convs = await res.json()
          setData(
            (convs || []).map((c: any) => ({
              ...c,
              updated_at: c.updated_at || c.updatedAt || new Date().toISOString(),
              messageCount: c.messageCount || 0,
              preview: c.preview || "",
              folder: c.folder || null,
            }))
          )
        } else {
          setData([])
        }
      } catch (err) {
        console.warn("Failed to fetch conversations", err)
        setData([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchConvs()
  }, [])

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map((d) => d.id) || [],
    [data]
  )

  const table = useReactTable({
    data,
    columns: convColumns,
    getRowId: (row) => row.id,
    state: { sorting, columnVisibility, rowSelection, columnFilters, pagination },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((prev) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <DndContext
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
        sensors={sensors}
        id={sortableId}
      >
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="**:data-[slot=table-cell]:first:w-8">
            {table.getRowModel().rows.length ? (
              <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
                {table.getRowModel().rows.map((row) => (
                  <DraggableRow key={row.id} row={row} />
                ))}
              </SortableContext>
            ) : (
              <TableRow>
                <TableCell colSpan={convColumns.length} className="h-24 text-center text-muted-foreground">
                  No conversations yet. Start a new chat to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DndContext>
    </div>
  )
}


const uploadChartData = [
  { month: "January", documents: 12, conversations: 8 },
  { month: "February", documents: 19, conversations: 14 },
  { month: "March", documents: 15, conversations: 11 },
  { month: "April", documents: 8, conversations: 6 },
  { month: "May", documents: 22, conversations: 17 },
  { month: "June", documents: 18, conversations: 13 },
]

const uploadChartConfig = {
  documents: {
    label: "Documents",
    color: "var(--primary)",
  },
  conversations: {
    label: "Conversations",
    color: "var(--primary)",
  },
} satisfies ChartConfig


interface DashboardDocsTableProps {
  showChart?: boolean
}

export function DashboardDocsTable({ showChart = true }: DashboardDocsTableProps) {
  const isMobile = useIsMobile()
  const [docsRefreshKey, setDocsRefreshKey] = React.useState(0)
  const [uploading, setUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const headers = useAuthHeaders()

  const [activeTab, setActiveTab] = React.useState("documents")
  const [selectedFilter, setSelectedFilter] = React.useState("all-docs")
  const [tableInstance, setTableInstance] = React.useState<any>(null)
  const [layoutMode, setLayoutMode] = React.useState<"table" | "grid">("grid")

  const handleFilterChange = (val: string) => {
    setSelectedFilter(val)
    if (val === "conversations") {
      setActiveTab("conversations")
    } else {
      setActiveTab("documents")
    }
  }

  const getFilterLabel = (filter: string) => {
    switch (filter) {
      case "all-docs": return "All";
      case "pdf-docs": return "PDF";
      case "txt-docs": return "Text";
      case "image-docs": return "Images";
      case "spreadsheet-docs": return "Spreadsheets";
      case "presentation-docs": return "Presentations";
      case "word-docs": return "Word";
      case "code-docs": return "Code";
      default: return "All";
    }
  }

  const handleUpload = async (file: File) => {
    if (!file) return

    const ext = "." + (file.name.split(".").pop()?.toLowerCase() || "")
    const ACCEPTED_TYPES = [
      ".pdf", ".docx", ".doc", ".txt", ".rtf", ".odt",
      ".xlsx", ".xls", ".csv", ".pptx", ".ppt",
      ".html", ".htm", ".md", ".mdx", ".rst",
      ".json", ".jsonl", ".xml", ".yaml", ".yml",
      ".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".cpp", ".c", ".cs",
      ".go", ".rs", ".rb", ".php", ".sh", ".sql",
      ".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".tiff", ".svg", ".zip"
    ]
    if (!ACCEPTED_TYPES.includes(ext)) {
      toast.error(`Unsupported file type "${ext}"`)
      return
    }

    const token = localStorage.getItem("token")
    const formData = new FormData()
    formData.append("file", file)

    setUploading(true)
    const toastId = toast.loading(`Uploading "${file.name}"...`)

    try {
      const res = await fetch(`${API_BASE_URL}/documents/upload/stream`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!res.ok) throw new Error("Upload failed")

      const reader = res.body?.getReader()
      const decoder = new TextDecoder("utf-8")
      let done = false

      while (!done && reader) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone
        if (value) {
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split("\n\n")
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const eventData = JSON.parse(line.slice(6))
                if (eventData.stage === "done") {
                  toast.success("Document indexed successfully.", { id: toastId })
                  setDocsRefreshKey(prev => prev + 1)
                } else if (eventData.progress) {
                  toast.loading(`Indexing... ${eventData.progress}%`, { id: toastId })
                }
              } catch (e) {
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to upload document", { id: toastId })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full flex-col justify-start gap-6"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleUpload(file)
        }}
        className="hidden"
      />
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select value={selectedFilter} onValueChange={handleFilterChange}>
          <SelectTrigger className="flex w-fit gap-2 text-xs font-semibold bg-transparent border border-border" size="sm">
            <div className="flex items-center gap-1.5">
              {React.createElement(getFilterIcon(selectedFilter), {
                className: "h-3.5 w-3.5 text-muted-foreground",
              })}
              <SelectValue>
                {selectedFilter === "conversations" ? "Conversations" : `Documents (${getFilterLabel(selectedFilter)})`}
              </SelectValue>
            </div>
          </SelectTrigger>
          <SelectContent className="text-xs">
            <SelectItem value="all-docs">
              <div className="flex items-center gap-2">
                <FileIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <span>All Documents</span>
              </div>
            </SelectItem>
            <SelectItem value="pdf-docs">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <span>PDFs (.pdf)</span>
              </div>
            </SelectItem>
            <SelectItem value="txt-docs">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Text Files (.txt, .md)</span>
              </div>
            </SelectItem>
            <SelectItem value="image-docs">
              <div className="flex items-center gap-2">
                <FileImage className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Images (.png, .jpg, .webp)</span>
              </div>
            </SelectItem>
            <SelectItem value="spreadsheet-docs">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Spreadsheets (.xlsx, .csv)</span>
              </div>
            </SelectItem>
            <SelectItem value="presentation-docs">
              <div className="flex items-center gap-2">
                <FilePieChart className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Presentations (.pptx)</span>
              </div>
            </SelectItem>
            <SelectItem value="word-docs">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Word Documents (.docx)</span>
              </div>
            </SelectItem>
            <SelectItem value="code-docs">
              <div className="flex items-center gap-2">
                <FileCode className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Code Files (.py, .js, .ts)</span>
              </div>
            </SelectItem>
            <DropdownMenuSeparator className="my-1 bg-border/60" />
            <SelectItem value="conversations">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Conversations</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="documents" onClick={() => handleFilterChange("all-docs")} className="gap-2">
            <FileIcon className="h-3.5 w-3.5" />
            Documents <Badge variant="secondary">Docs</Badge>
          </TabsTrigger>
          <TabsTrigger value="conversations" onClick={() => handleFilterChange("conversations")} className="gap-2">
            <MessageSquare className="h-3.5 w-3.5" />
            Conversations <Badge variant="secondary">Chats</Badge>
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          {/* Layout Mode Toggle (Table vs Grid) */}
          {activeTab === "documents" && (
            <div className="flex items-center gap-1.5 bg-muted p-0.5 rounded-lg border border-border h-8.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLayoutMode("table")}
                className={cn("h-7.5 w-7.5 rounded-md", layoutMode === "table" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground")}
                title="Table View"
              >
                <List className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLayoutMode("grid")}
                className={cn("h-7.5 w-7.5 rounded-md", layoutMode === "grid" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground")}
                title="Grid View"
              >
                <LayoutGrid className="size-4" />
              </Button>
            </div>
          )}

          {activeTab === "documents" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="hidden lg:inline">Customize</span>
                  <span className="lg:hidden">Columns</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-2">
                <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 px-2.5 py-1 uppercase tracking-wider">Toggle Columns</div>
                <DropdownMenuSeparator className="my-1" />
                <div className="grid grid-cols-2 gap-1.5 p-1">
                  {tableInstance ? (
                    tableInstance
                      .getAllColumns()
                      .filter((column: any) => column.getCanHide())
                      .map((column: any) => (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize text-xs font-semibold cursor-pointer"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) => column.toggleVisibility(!!value)}
                        >
                          {column.id === "file_type" ? "Type" : column.id === "file_size" ? "Size" : column.id === "uploaded_at" ? "Uploaded" : column.id}
                        </DropdownMenuCheckboxItem>
                      ))
                  ) : (
                    <div className="p-2 text-xs text-muted-foreground text-center col-span-2">No columns available</div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="cursor-pointer"
          >
            {uploading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            <span className="hidden lg:inline">Add New</span>
          </Button>
        </div>
      </div>

      <TabsContent value="documents" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <DocumentDataTable
          refreshKey={docsRefreshKey}
          onUploadTrigger={() => fileInputRef.current?.click()}
          uploading={uploading}
          docTypeFilter={selectedFilter}
          onTableInstance={setTableInstance}
          layoutMode={layoutMode}
          onDeleteSuccess={() => setDocsRefreshKey(prev => prev + 1)}
        />
      </TabsContent>

      <TabsContent value="conversations" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <ConversationDataTable />
      </TabsContent>

      {showChart && (
        <TabsContent value="activity" className="flex flex-col px-4 lg:px-6">
          <div className="rounded-lg border bg-card/50 p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">Platform Activity</h3>
            <ChartContainer config={uploadChartConfig} className="aspect-video w-full">
              <AreaChart
                accessibilityLayer
                data={uploadChartData}
                margin={{ left: 0, right: 10 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                <Area
                  dataKey="documents"
                  type="natural"
                  fill="var(--color-documents)"
                  fillOpacity={0.4}
                  stroke="var(--color-documents)"
                  stackId="a"
                />
                <Area
                  dataKey="conversations"
                  type="natural"
                  fill="var(--color-conversations)"
                  fillOpacity={0.6}
                  stroke="var(--color-conversations)"
                  stackId="a"
                />
              </AreaChart>
            </ChartContainer>
          </div>
        </TabsContent>
      )}
    </Tabs>
  )
}
