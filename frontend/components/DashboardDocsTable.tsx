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
  CheckCircle,
  GripVertical,
  LayoutGrid,
  Loader,
  Plus,
  MoreVertical,
  TrendingUp,
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
  uploaded_at: string
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


function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() || ""
  if (["pdf"].includes(ext)) return { emoji: "📄", color: "text-red-500", bg: "bg-red-500/10 border-red-500/20" }
  if (["doc", "docx"].includes(ext)) return { emoji: "📝", color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" }
  if (["xls", "xlsx", "csv"].includes(ext)) return { emoji: "📊", color: "text-green-500", bg: "bg-green-500/10 border-green-500/20" }
  if (["ppt", "pptx"].includes(ext)) return { emoji: "📑", color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/20" }
  if (["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(ext)) return { emoji: "🖼️", color: "text-purple-500", bg: "bg-purple-500/10 border-purple-500/20" }
  if (["py", "js", "ts", "jsx", "tsx", "java", "cpp", "c", "go", "rs"].includes(ext)) return { emoji: "💻", color: "text-cyan-500", bg: "bg-cyan-500/10 border-cyan-500/20" }
  if (["json", "yaml", "yml", "xml", "toml"].includes(ext)) return { emoji: "⚙️", color: "text-zinc-400", bg: "bg-zinc-500/10 border-zinc-500/20" }
  return { emoji: "📁", color: "text-zinc-400", bg: "bg-zinc-500/10 border-zinc-500/20" }
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


function makeDocColumns(onView: (doc: Document) => void): ColumnDef<Document>[] {
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
        const { emoji } = getFileIcon(row.original.filename)
        return (
          <button
            onClick={() => onView(row.original)}
            className="flex items-center gap-2 max-w-[260px] text-left hover:underline underline-offset-2 cursor-pointer group"
          >
            <span className="text-base shrink-0">{emoji}</span>
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
      accessorKey: "chunk_count",
      header: "Chunks",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {row.original.chunk_count.toLocaleString()}
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
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem onClick={() => onView(row.original)}>View details</DropdownMenuItem>
            <DropdownMenuItem>Re-index</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
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
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem>Open conversation</DropdownMenuItem>
          <DropdownMenuItem>Rename</DropdownMenuItem>
          <DropdownMenuItem>{row.original.pinned ? "Unpin" : "Pin"}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
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
              {[10, 20, 30, 40, 50].map((pageSize) => (
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
}: {
  refreshKey: number
  onUploadTrigger: () => void
  uploading: boolean
}) {
  const [data, setData] = React.useState<Document[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })

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
        const res = await fetch(`${API_BASE_URL}/documents`, { headers })
        if (res.ok) {
          const docs = await res.json()
          setData(docs || [])
        }
      } catch (err) {
        console.error("Failed to fetch documents", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchDocs()
  }, [refreshKey])

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map((d) => d.id) || [],
    [data]
  )

  const docColumns = React.useMemo(() => makeDocColumns(openViewer), [])

  const table = useReactTable({
    data,
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
          <span className="absolute left-3 top-2.5 text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 opacity-60"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </span>
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
          Upload Document
        </Button>
      </div>

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
                  <TableCell colSpan={docColumns.length} className="h-24 text-center text-muted-foreground">
                    No documents found. Upload files to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>

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
        const res = await fetch(`${API_BASE_URL}/conversations`, { headers })
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
        }
      } catch (err) {
        console.error("Failed to fetch conversations", err)
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
                  toast.success(`Indexed successfully: ${eventData.chunks} chunks.`, { id: toastId })
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
      defaultValue="documents"
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
        <Select defaultValue="documents">
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="documents">Documents</SelectItem>
            <SelectItem value="conversations">Conversations</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="documents">
            Documents <Badge variant="secondary">Docs</Badge>
          </TabsTrigger>
          <TabsTrigger value="conversations">
            Conversations <Badge variant="secondary">Chats</Badge>
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>Toggle columns</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
