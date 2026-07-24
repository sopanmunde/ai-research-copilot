'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Trash2,
  Sparkles,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ChevronUp,
  Cpu,
  Search,
  X
} from 'lucide-react'
import { cn } from "@/lib/utils"
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatDateRange } from 'little-date'
import { API_BASE_URL } from "@/lib/api"
import { toast } from "sonner"

// ─── Types ────────────────────────────────────────────────────────────────────
interface CalendarEvent {
  id: string
  title: string
  from: string // ISO string
  to: string   // ISO string
  type: 'blue' | 'yellow' | 'purple' | 'pink' | 'green' | 'orange' | 'ai-auto'
  description?: string
  location?: string
  allDay?: boolean
  emailNotifications?: string[] // ["2d", "1d", "5h", "1h", "30m", "5m", "start"]
  notificationEmail?: string
}

type CalendarViewType = 'day' | 'week' | 'month' | 'year' | 'agenda'

interface LogItem {
  id: string
  text: string
  type: 'system' | 'blue' | 'yellow' | 'purple' | 'pink' | 'green' | 'orange' | 'ai-auto'
}

// ─── Custom Card Container (Strictly Shadcn Colors & No Shine) ────────────────
export function DashboardCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-950/40 dark:backdrop-blur-md flex flex-col ${className}`}>
      {children}
    </div>
  )
}

// ─── Helper Functions ────────────────────────────────────────────────────────
function formatOrdinalDate(date: Date) {
  const day = date.getDate()
  const month = date.toLocaleDateString('en-US', { month: 'long' })
  const year = date.getFullYear()
  
  let suffix = 'th'
  if (day === 1 || day === 21 || day === 31) suffix = 'st'
  else if (day === 2 || day === 22) suffix = 'nd'
  else if (day === 3 || day === 23) suffix = 'rd'
  
  return `${month} ${day}${suffix}, ${year}`
}

function convert12hTo24h(time12h: string): [number, number] {
  const [time, ampm] = time12h.split(' ')
  let [h, m] = time.split(':').map(Number)
  if (ampm === 'PM' && h !== 12) h += 12
  if (ampm === 'AM' && h === 12) h = 0
  return [h, m]
}

export function CalendarDashboard() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [currentView, setCurrentView] = useState<CalendarViewType>('month')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTime, setSelectedTime] = useState<string | null>('10:00')
  const [aiSync, setAiSync] = useState(true)
  const [isAutopilotDirectivesOpen, setIsAutopilotDirectivesOpen] = useState(false)

  // Simulation & Logs state (with color mapping)
  const [isSimulating, setIsSimulating] = useState(false)
  const [logs, setLogs] = useState<LogItem[]>([
    { id: '1', text: '23:10:02 - System: Index synchronization complete.', type: 'system' },
    { id: '2', text: '23:10:05 - System: Autopilot listening for scheduling requests.', type: 'system' },
    { id: '3', text: '23:10:15 - Memory: Spacing preferences synced from Brain.', type: 'system' }
  ])

  // Custom AI instructions
  const [aiInstructions, setAiInstructions] = useState(
    'Only book meetings in the afternoon. Reserve mornings (09:00 - 13:00) for focus time.'
  )

  // Events list state
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/events`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (res.ok) {
        const data = await res.json()
        setEvents(data)
      }
    } catch (e) {
      console.error("Failed to fetch events", e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const convertEventToTask = async (evt: CalendarEvent) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: `[Event Followup] ${evt.title}`,
          description: evt.description || `Event meeting task for ${evt.title}`,
          type: "Feature",
          status: "todo",
          priority: "high",
          tags: ["calendar-import"],
          subtasks: [],
          history: [{ timestamp: new Date().toLocaleTimeString(), action: "Task created from Calendar Event" }],
        }),
      });
      if (res.ok) {
        toast.success("Task created from Event! View in Task Dashboard.");
      } else {
        toast.error("Failed to create task from Event.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error creating task.");
    }
  };

  const convertEventToNote = async (evt: CalendarEvent) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: `[Meeting Notes] ${evt.title}`,
          content: `Event: ${evt.title}\nTime: ${evt.from} - ${evt.to}\nLocation: ${evt.location || "N/A"}\n\nNotes:\n${evt.description || ""}`,
          category: "work",
          favorite: false,
        }),
      });
      if (res.ok) {
        toast.success("Meeting Notes saved! View in Notes Dashboard.");
      } else {
        toast.error("Failed to save Meeting Notes.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error creating Note.");
    }
  };

  // Dialog / Modal Form States
  const [isAddEventOpen, setIsAddEventOpen] = useState(false)
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventDescription, setNewEventDescription] = useState('')
  const [newEventStartDate, setNewEventStartDate] = useState<Date>(new Date())
  const [newEventEndDate, setNewEventEndDate] = useState<Date>(new Date())
  const [newEventStartTime, setNewEventStartTime] = useState('9:00 AM')
  const [newEventEndTime, setNewEventEndTime] = useState('10:00 AM')
  const [newEventAllDay, setNewEventAllDay] = useState(false)
  const [newEventLocation, setNewEventLocation] = useState('')
  const [newEventEtiquette, setNewEventEtiquette] = useState<'blue' | 'yellow' | 'purple' | 'pink' | 'green' | 'orange'>('blue')
  const [newEventNotifications, setNewEventNotifications] = useState<string[]>(['2d', '1d', '5h', '1h', '30m', '5m', 'start'])
  const [newNotificationEmail, setNewNotificationEmail] = useState('')

  const notificationTimesList = [
    { id: '2d', label: '2 Days' },
    { id: '1d', label: '1 Day' },
    { id: '5h', label: '5 Hours' },
    { id: '1h', label: '1 Hour' },
    { id: '30m', label: '30 Mins' },
    { id: '5m', label: '5 Mins' },
    { id: 'start', label: 'Start' },
  ]

  // Etiquette Color Styling Config
  const etiquetteColors: Record<CalendarEvent['type'] | 'system', { label: string; border: string; bg: string; dot: string }> = {
    blue: { label: 'Blue', border: 'border-sky-500/80', bg: 'bg-sky-500/10 text-sky-500', dot: 'bg-sky-500' },
    yellow: { label: 'Yellow', border: 'border-amber-500/80', bg: 'bg-amber-500/10 text-amber-500', dot: 'bg-amber-500' },
    purple: { label: 'Purple', border: 'border-violet-500/80', bg: 'bg-violet-500/10 text-violet-500', dot: 'bg-violet-500' },
    pink: { label: 'Pink', border: 'border-rose-500/80', bg: 'bg-rose-500/10 text-rose-500', dot: 'bg-rose-500' },
    green: { label: 'Green', border: 'border-emerald-500/80', bg: 'bg-emerald-500/10 text-emerald-500', dot: 'bg-emerald-500' },
    orange: { label: 'Orange', border: 'border-orange-500/80', bg: 'bg-orange-500/10 text-orange-500', dot: 'bg-orange-500' },
    'ai-auto': { label: 'AI Auto', border: 'border-zinc-500/80', bg: 'bg-zinc-500/10 text-zinc-500', dot: 'bg-zinc-500' },
    system: { label: 'System', border: 'border-zinc-500/80', bg: 'bg-zinc-500/10 text-zinc-400', dot: 'bg-zinc-500' }
  }

  // 15-Minute dropdown times
  const timeDropdownOptions = useMemo(() => {
    const times = []
    for (let hour = 0; hour < 24; hour++) {
      for (let min = 0; min < 60; min += 15) {
        const ampm = hour >= 12 ? 'PM' : 'AM'
        const displayHour = hour % 12 === 0 ? 12 : hour % 12
        const displayMin = min.toString().padStart(2, '0')
        times.push(`${displayHour}:${displayMin} ${ampm}`)
      }
    }
    return times
  }, [])

  // Filter and search events
  const searchedEvents = useMemo(() => {
    let list = events
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        e =>
          e.title.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          e.location?.toLowerCase().includes(q)
      )
    }
    return list
  }, [events, searchQuery])

  // Mini-calendar date book checks
  const isDateBooked = (date: Date) => {
    const dStr = date.toDateString()
    return events.some(e => new Date(e.from).toDateString() === dStr)
  }

  // Day View Timeline hour grid
  const dayTimelineHours = useMemo(() => {
    return Array.from({ length: 11 }, (_, i) => {
      const hour = i + 8 // 08:00 to 18:00
      return `${hour.toString().padStart(2, '0')}:00`
    })
  }, [])

  // Week View dates array
  const weekDays = useMemo(() => {
    if (!selectedDate) return []
    const startOfWeek = new Date(selectedDate)
    const day = startOfWeek.getDay()
    startOfWeek.setDate(startOfWeek.getDate() - day)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [selectedDate])

  // Month View dates array
  const monthDays = useMemo(() => {
    if (!selectedDate) return []
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const startOffset = firstDay.getDay()
    const days: { date: Date; isCurrentMonth: boolean }[] = []
    
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      })
    }
    
    const currentMonthDaysCount = new Date(year, month + 1, 0).getDate()
    for (let i = 1; i <= currentMonthDaysCount; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      })
    }
    
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      })
    }
    
    return days
  }, [selectedDate])

  // Year View months array
  const yearMonths = useMemo(() => {
    if (!selectedDate) return []
    const year = selectedDate.getFullYear()
    return Array.from({ length: 12 }, (_, i) => new Date(year, i, 1))
  }, [selectedDate])

  // Header Title based on view
  const headerViewTitle = useMemo(() => {
    if (!selectedDate) return ''
    if (currentView === 'day') {
      return selectedDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    }
    if (currentView === 'week') {
      const start = weekDays[0]
      const end = weekDays[6]
      if (!start || !end) return ''
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    }
    if (currentView === 'month') {
      return selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }
    return selectedDate.getFullYear().toString()
  }, [selectedDate, currentView, weekDays])

  // Click handler to open Dialog and prefill values
  const handleBlockClick = (date: Date, timeSlot?: string) => {
    setNewEventStartDate(date)
    setNewEventEndDate(date)
    if (timeSlot) {
      const [h, m] = timeSlot.split(':').map(Number)
      const ampm = h >= 12 ? 'PM' : 'AM'
      const displayHour = h % 12 === 0 ? 12 : h % 12
      const displayMin = m.toString().padStart(2, '0')
      setNewEventStartTime(`${displayHour}:${displayMin} ${ampm}`)
      
      const endH = (h + 1) % 24
      const endAmpm = endH >= 12 ? 'PM' : 'AM'
      const endDisplayHour = endH % 12 === 0 ? 12 : endH % 12
      setNewEventEndTime(`${endDisplayHour}:${displayMin} ${endAmpm}`)
    } else {
      setNewEventStartTime('9:00 AM')
      setNewEventEndTime('10:00 AM')
    }
    setNewEventTitle('')
    setNewEventDescription('')
    setNewEventLocation('')
    setNewEventAllDay(false)
    setNewEventEtiquette('blue')
    setIsAddEventOpen(true)
  }

  // Handle manual event creation (Save handler)
  const handleSaveNewEvent = async () => {
    if (!newEventTitle.trim()) return

    const [startH, startM] = convert12hTo24h(newEventStartTime)
    const [endH, endM] = convert12hTo24h(newEventEndTime)

    const fromDate = new Date(newEventStartDate)
    fromDate.setHours(startH, startM, 0, 0)

    const toDate = new Date(newEventEndDate)
    toDate.setHours(endH, endM, 0, 0)

    const newEv = {
      title: newEventTitle,
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      type: newEventEtiquette,
      description: newEventDescription,
      location: newEventLocation,
      allDay: newEventAllDay,
      emailNotifications: newEventNotifications,
      notificationEmail: newNotificationEmail
    }

    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newEv)
      })
      if (!res.ok) throw new Error("Failed to create event")
      const createdEvent = await res.json()
      setEvents(prev => [...prev, createdEvent])
      setIsAddEventOpen(false)

      // Add color-coded log
      const timeLog = new Date().toLocaleTimeString()
      setLogs(prev => [
        { id: Math.random().toString(), text: `${timeLog} - Created Block: "${newEventTitle}"`, type: newEventEtiquette },
        ...prev
      ])
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to create event")
    }
  }

  // Delete event handler
  async function handleDeleteEvent(id: string) {
    const ev = events.find(e => e.id === id)
    if (!ev) return

    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/events/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error("Failed to delete event")

      setEvents(prev => prev.filter(e => e.id !== id))
      const timeLog = new Date().toLocaleTimeString()
      setLogs(prev => [
        { id: Math.random().toString(), text: `${timeLog} - Removed: "${ev.title}"`, type: ev.type },
        ...prev
      ])
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to delete event")
    }
  }

  // Autopilot Simulation Handler
  const runAutopilotSimulation = () => {
    if (isSimulating || !selectedDate) return
    setIsSimulating(true)

    const steps = [
      'Inbox scan: booking request from "integration-teams@trivisionx.ai"',
      'Parsing request details: tomorrow at 14:00 requested.',
      'Checking scheduling slots...',
      'Validating spacing limits: afternoon availability checked.',
      'Auto-booking confirmed.',
      'Creating calendar record.'
    ]

    let currentStep = 0
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setLogs(prev => [
          { id: Math.random().toString(), text: `${new Date().toLocaleTimeString()} - Autopilot: ${steps[currentStep]}`, type: 'system' },
          ...prev
        ])
        currentStep++
      } else {
        clearInterval(interval)
        setIsSimulating(false)

        const tomorrow = new Date(selectedDate)
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(14, 0, 0, 0)
        
        const endTomorrow = new Date(tomorrow)
        endTomorrow.setHours(15, 0, 0, 0)

        const newEv = {
          title: 'AI Booking: Integration Call',
          from: tomorrow.toISOString(),
          to: endTomorrow.toISOString(),
          type: 'blue',
          description: 'Scheduled automatically by AI Agent.'
        }
        const token = localStorage.getItem("token")
        fetch(`${API_BASE_URL}/events`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(newEv)
        }).then(res => {
          if (res.ok) {
            return res.json()
          }
          throw new Error("Failed to save autopilot event")
        }).then(createdEvent => {
          setEvents(prev => [...prev, createdEvent])
          setLogs(prev => [
            { id: Math.random().toString(), text: `${new Date().toLocaleTimeString()} - Autopilot Auto-Scheduled: "AI Booking: Integration Call"`, type: 'blue' },
            ...prev
          ])
        }).catch(err => {
          console.error(err)
        })
      }
    }, 1000)
  }

  // Navigate Date
  const handleNavigateDate = (direction: 'prev' | 'next') => {
    if (!selectedDate) return
    const newDate = new Date(selectedDate)
    if (currentView === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'prev' ? -1 : 1))
    } else if (currentView === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'prev' ? -7 : 7))
    } else if (currentView === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'prev' ? -1 : 1))
    } else if (currentView === 'year') {
      newDate.setFullYear(newDate.getFullYear() + (direction === 'prev' ? -1 : 1))
    }
    setSelectedDate(newDate)
  }

  // Quick Select Preset Handlers
  const handleQuickSelect = (preset: 'today' | 'tomorrow' | 'next-week' | 'next-month') => {
    const today = new Date()
    if (preset === 'today') {
      setSelectedDate(today)
    } else if (preset === 'tomorrow') {
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)
      setSelectedDate(tomorrow)
    } else if (preset === 'next-week') {
      const nextWeek = new Date(today)
      // hop to next Monday
      const day = today.getDay()
      const daysToNextMonday = day === 0 ? 1 : 8 - day
      nextWeek.setDate(today.getDate() + daysToNextMonday)
      setSelectedDate(nextWeek)
    } else if (preset === 'next-month') {
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
      setSelectedDate(nextMonth)
    }
  }

  const [showVisuals, setShowVisuals] = useState(true)

  // Compute metrics for visual telemetry
  const todayStr = new Date().toDateString()
  const todayEvents = events.filter(e => new Date(e.from).toDateString() === todayStr)
  const upcomingCount = events.filter(e => new Date(e.from).getTime() >= new Date().getTime()).length

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full min-h-[500px] bg-background">
        <div className="flex flex-col items-center gap-2.5">
          <RefreshCw className="size-6 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-semibold">Loading calendar pipelines & autopilot...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex-1 overflow-y-auto bg-background p-4 md:p-6 space-y-5">
      
      {/* Root Create Event Dialog Overlay */}
      <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 bg-card/95 text-foreground border border-border/80 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] backdrop-blur-xl gap-0 overflow-hidden transition-all duration-300">
          
          {/* Container 1: Hero Glass Header */}
          <div className="relative px-6 pt-6 pb-5 border-b border-border/60 bg-gradient-to-b from-muted/50 via-card/80 to-card overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 size-40 bg-gradient-to-br from-indigo-500/15 to-purple-500/0 rounded-full blur-2xl pointer-events-none" />
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="size-11 rounded-2xl bg-gradient-to-b from-card to-muted border border-border/80 shadow-[0_4px_12px_rgba(0,0,0,0.12)] flex items-center justify-center shrink-0">
                  <CalendarIcon className="size-5 text-foreground drop-shadow-xs" />
                </div>
                <div>
                  <DialogTitle className="text-base font-extrabold text-foreground tracking-tight">
                    New Event Node
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Schedule calendar block & set notifications
                  </DialogDescription>
                </div>
              </div>

              <button
                onClick={() => setIsAddEventOpen(false)}
                className="size-8 rounded-xl bg-muted/40 hover:bg-muted border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:translate-y-0.5"
              >
                <Trash2 className="hidden" />
                <X className="size-4" />
              </button>
            </div>
          </div>
          
          {/* Scrollable Form Body */}
          <div className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto scrollbar-thin">

            {/* Container 2: Core Details Card */}
            <div className="rounded-2xl border border-border/70 bg-gradient-to-b from-muted/30 to-muted/10 p-4 space-y-3.5 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
              <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">
                Event Information
              </span>

              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-[11px] font-bold text-foreground flex items-center gap-1">
                  Event Title <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="E.g., Team Sync & Architecture Review..."
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="text-xs h-10 bg-background/80 border-border/80 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] focus:shadow-[inset_0_1px_2px_rgba(0,0,0,0.05),0_0_0_2px_rgba(120,80,255,0.2)] transition-all placeholder:text-muted-foreground/50 font-medium"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-[11px] font-bold text-foreground">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Meeting agenda, goals, preparation..."
                  value={newEventDescription}
                  onChange={(e) => setNewEventDescription(e.target.value)}
                  className="text-xs bg-background/80 border-border/80 min-h-[70px] resize-none rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] focus:shadow-[inset_0_1px_2px_rgba(0,0,0,0.05),0_0_0_2px_rgba(120,80,255,0.2)] transition-all placeholder:text-muted-foreground/50"
                />
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-[11px] font-bold text-foreground">Location / Meeting Link</Label>
                <Input
                  id="location"
                  placeholder="E.g., Google Meet URL or Room 402..."
                  value={newEventLocation}
                  onChange={(e) => setNewEventLocation(e.target.value)}
                  className="text-xs h-9 bg-background/80 border-border/80 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            {/* Container 3: Time & Schedule Card */}
            <div className="rounded-2xl border border-border/70 bg-gradient-to-b from-muted/30 to-muted/10 p-4 space-y-3.5 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
              <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">
                Schedule & Timing
              </span>

              {/* Start Date & Start Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-foreground">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between bg-background/80 border-border/80 text-foreground h-9 text-xs px-3 rounded-xl shadow-xs"
                      >
                        <span className="truncate">{formatOrdinalDate(newEventStartDate)}</span>
                        <CalendarIcon className="size-3.5 text-muted-foreground shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-card border-border rounded-2xl shadow-xl">
                      <Calendar
                        mode="single"
                        selected={newEventStartDate}
                        onSelect={(d) => d && setNewEventStartDate(d)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-foreground">Start Time</Label>
                  <Select value={newEventStartTime} onValueChange={setNewEventStartTime}>
                    <SelectTrigger className="bg-background/80 border-border/80 text-foreground h-9 text-xs rounded-xl shadow-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 bg-card border-border rounded-xl">
                      {timeDropdownOptions.map(t => (
                        <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* End Date & End Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-foreground">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between bg-background/80 border-border/80 text-foreground h-9 text-xs px-3 rounded-xl shadow-xs"
                      >
                        <span className="truncate">{formatOrdinalDate(newEventEndDate)}</span>
                        <CalendarIcon className="size-3.5 text-muted-foreground shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-card border-border rounded-2xl shadow-xl">
                      <Calendar
                        mode="single"
                        selected={newEventEndDate}
                        onSelect={(d) => d && setNewEventEndDate(d)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-foreground">End Time</Label>
                  <Select value={newEventEndTime} onValueChange={setNewEventEndTime}>
                    <SelectTrigger className="bg-background/80 border-border/80 text-foreground h-9 text-xs rounded-xl shadow-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 bg-card border-border rounded-xl">
                      {timeDropdownOptions.map(t => (
                        <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* All day */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="all-day"
                  checked={newEventAllDay}
                  onChange={(e) => setNewEventAllDay(e.target.checked)}
                  className="rounded-md border-border bg-muted text-foreground size-4 cursor-pointer accent-primary"
                />
                <Label htmlFor="all-day" className="text-xs text-foreground font-semibold cursor-pointer select-none">All day event</Label>
              </div>
            </div>

            {/* Container 4: Color Etiquette & Notifications */}
            <div className="rounded-2xl border border-border/70 bg-gradient-to-b from-muted/30 to-muted/10 p-4 space-y-3.5 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
              
              {/* Etiquette (Colors) */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">
                  Etiquette Tag Color
                </span>
                <div className="flex items-center gap-3">
                  {['blue', 'yellow', 'purple', 'pink', 'green', 'orange'].map((colorKey) => {
                    const key = colorKey as 'blue' | 'yellow' | 'purple' | 'pink' | 'green' | 'orange'
                    const colorConfig = etiquetteColors[key]
                    const isSelected = newEventEtiquette === key
                    return (
                      <button
                        key={key}
                        onClick={() => setNewEventEtiquette(key)}
                        className={`size-6 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                          isSelected ? 'border-foreground scale-110 shadow-sm' : 'border-border/60 hover:border-foreground/50'
                        } ${colorConfig.dot}`}
                        type="button"
                        title={colorConfig.label}
                      >
                        {isSelected && <div className="size-2 rounded-full bg-background" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Target Notification Email */}
              <div className="space-y-1.5 pt-1">
                <Label htmlFor="notification-email" className="text-[11px] font-bold text-foreground">Notification Target Email</Label>
                <Input
                  id="notification-email"
                  placeholder="user@trivisionx.ai (default account)"
                  value={newNotificationEmail}
                  onChange={(e) => setNewNotificationEmail(e.target.value)}
                  className="text-xs h-9 bg-background/80 border-border/80 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] placeholder:text-muted-foreground/50"
                />
              </div>

            </div>

          </div>

          {/* Container 5: Action Footer */}
          <DialogFooter className="px-6 py-4 border-t border-border/70 bg-gradient-to-b from-card to-muted/40 flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAddEventOpen(false)}
              className="h-10 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-xl px-4 transition-all active:translate-y-0.5"
            >
              Cancel
            </Button>
            
            <Button
              disabled={!newEventTitle.trim()}
              onClick={handleSaveNewEvent}
              className="h-10 text-xs font-extrabold rounded-xl px-6 bg-gradient-to-b from-foreground via-foreground to-foreground/90 text-background hover:from-foreground/90 hover:to-foreground shadow-[0_6px_20px_rgba(0,0,0,0.25)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:hover:translate-y-0 transition-all gap-2"
            >
              <Plus className="size-4" />
              Save Event Node
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Brain Dashboard Style Top Visual Telemetry Banner ─── */}
      <div className="flex flex-col gap-3 p-4.5 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md shrink-0 shadow-[0_8px_25px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.5)] relative transition-all duration-300">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-foreground/5 border border-border flex items-center justify-center text-foreground shadow-xs shrink-0">
              <CalendarIcon className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-foreground">
                  Calendar &amp; Scheduling Hub
                </h1>
                <Badge variant="outline" className="text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider bg-muted/60 border-border text-muted-foreground shadow-xs">
                  v3.0 Autopilot
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                Autonomous AI Agent scheduling, multi-view calendar canvas &amp; SMTP email notifications
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
              onClick={() => handleBlockClick(new Date())}
              className="h-8.5 text-xs font-semibold bg-foreground hover:bg-foreground/90 text-background gap-1.5 px-3 rounded-xl shadow-md border border-foreground/10 cursor-pointer transition-all hover:scale-102"
            >
              <Plus className="size-3.5" />
              <span>Create Event</span>
            </Button>
          </div>
        </div>

        {/* Visual Analytics Telemetry Bar */}
        {showVisuals && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-border/40 select-none">
            {/* Metric 1: Total Events & Today Schedule */}
            <div className="p-2.5 rounded-xl bg-card border border-border/60 flex items-center justify-between shadow-xs hover:shadow-sm transition-all">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <CalendarIcon className="size-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Today &amp; Total</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-bold text-foreground">{todayEvents.length} today</span>
                    <span className="text-[10px] text-muted-foreground">({events.length} total)</span>
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                Live
              </Badge>
            </div>

            {/* Metric 2: AI Autopilot Latency */}
            <div className="p-2.5 rounded-xl bg-card border border-border/60 flex items-center justify-between shadow-xs hover:shadow-sm transition-all">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">AI Autopilot</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-bold text-foreground">{aiSync ? "Active" : "Disabled"}</span>
                    <span className="text-[10px] text-emerald-500 font-mono">~115ms</span>
                  </div>
                </div>
              </div>
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" title="Active Engine" />
            </div>

            {/* Metric 3: SMTP Email Reminders Gateway */}
            <div className="p-2.5 rounded-xl bg-card border border-border/60 flex items-center justify-between shadow-xs hover:shadow-sm transition-all">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Clock className="size-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Email Reminders</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-bold text-foreground">TLS 587</span>
                    <span className="text-[10px] text-muted-foreground">100% Delivery</span>
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 bg-muted border-border text-muted-foreground">
                Ready
              </Badge>
            </div>

            {/* Metric 4: Upcoming Events Ratio */}
            <div className="p-2.5 rounded-xl bg-card border border-border/60 flex items-center justify-between shadow-xs hover:shadow-sm transition-all">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <ChevronRight className="size-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Upcoming Events</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-bold text-foreground">{upcomingCount} upcoming</span>
                  </div>
                </div>
              </div>
              <div className="w-12 bg-muted/60 h-1.5 rounded-full overflow-hidden border border-border/40">
                <div className="bg-foreground h-full rounded-full" style={{ width: `${Math.min(100, (upcomingCount / (events.length || 1)) * 100)}%` }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Main Workspace Grid Container ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* ─── LEFT SIDEBAR PANEL (Width 4/12) ─── */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* CONTAINER 1: AI Autopilot Directives & Rules (Collapsible with Zoom/Scale Trigger) */}
          <div className={cn(
            "bg-card border rounded-2xl p-4 transition-all duration-300 relative",
            isAutopilotDirectivesOpen
              ? "border-foreground/40 ring-2 ring-foreground/15 shadow-[0_12px_35px_rgba(0,0,0,0.15)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.6)] scale-102 z-20 animate-in fade-in-0 zoom-in-95"
              : "border-border/80 shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_25px_rgba(0,0,0,0.4)] hover:border-foreground/30 hover:shadow-[0_8px_28px_rgba(0,0,0,0.1)]"
          )}>
            {/* Click Trigger Header */}
            <div
              onClick={() => setIsAutopilotDirectivesOpen(!isAutopilotDirectivesOpen)}
              className="flex items-center justify-between cursor-pointer select-none group"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-foreground group-hover:rotate-12 transition-transform duration-200" />
                <div>
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider block">Autopilot Directives</span>
                  {!isAutopilotDirectivesOpen && (
                    <span className="text-[10px] text-muted-foreground font-medium block truncate">
                      {aiSync ? "Active auto-booking rules (Click to open)" : "Disabled (Click to configure)"}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {aiSync && (
                  <Badge variant="outline" className="text-[9px] px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-bold shadow-xs">
                    Active
                  </Badge>
                )}
                <Button
                  size="icon-xs"
                  variant="ghost"
                  className="size-7 rounded-xl text-muted-foreground group-hover:text-foreground hover:bg-muted shrink-0"
                >
                  {isAutopilotDirectivesOpen ? <ChevronUp className="size-4 text-foreground" /> : <ChevronDown className="size-4" />}
                </Button>
              </div>
            </div>

            {/* Expanded Directives Body with Zoom-In effect */}
            {isAutopilotDirectivesOpen && (
              <div className="space-y-3.5 pt-3.5 mt-3 border-t border-border/60 animate-in fade-in-0 zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="ai-sync-switch" className="text-xs font-semibold text-foreground block">
                      Auto-booking engine
                    </Label>
                    <p className="text-[10px] text-muted-foreground leading-normal">
                      Approve slots matching rules.
                    </p>
                  </div>
                  <Switch
                    id="ai-sync-switch"
                    checked={aiSync}
                    onCheckedChange={(checked) => {
                      setAiSync(checked)
                      setLogs(prev => [
                        { id: Math.random().toString(), text: `${new Date().toLocaleTimeString()} - Autopilot rules ${checked ? 'enabled' : 'disabled'}.`, type: 'system' },
                        ...prev
                      ])
                    }}
                  />
                </div>

                <Separator className="bg-border/60" />

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    Instructions Prompt
                  </Label>
                  <Textarea
                    value={aiInstructions}
                    onChange={(e) => setAiInstructions(e.target.value)}
                    className="text-xs min-h-[55px] border-border bg-muted/20 focus:border-border text-foreground rounded-xl resize-none leading-normal"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={runAutopilotSimulation}
                    disabled={isSimulating}
                    className="flex-1 text-xs border-border hover:bg-muted text-foreground font-semibold rounded-xl h-8.5 shadow-xs"
                  >
                    {isSimulating ? (
                      <span className="flex items-center gap-1.5">
                        <RefreshCw className="size-3 animate-spin text-foreground" /> Simulating Agent...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <Cpu className="size-3 text-foreground" /> Simulate Auto-Booking
                      </span>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsAutopilotDirectivesOpen(false)}
                    className="h-8.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-xl px-3 font-semibold cursor-pointer"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* CONTAINER 2: Quick Navigation & Date Selector */}
          <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_25px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.1)] transition-all duration-300 space-y-3">
            <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
              <div className="flex items-center gap-2">
                <CalendarIcon className="size-4 text-foreground" />
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">Quick Selector</span>
              </div>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 bg-muted border-border text-muted-foreground shadow-xs">
                Calendar
              </Badge>
            </div>

            {/* Presets Row */}
            <div className="grid grid-cols-2 gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect('today')}
                className="text-[10px] h-7 px-2 font-semibold border-border hover:bg-muted text-foreground rounded-xl shadow-xs"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect('tomorrow')}
                className="text-[10px] h-7 px-2 font-semibold border-border hover:bg-muted text-foreground rounded-xl shadow-xs"
              >
                Tomorrow
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect('next-week')}
                className="text-[10px] h-7 px-2 font-semibold border-border hover:bg-muted text-foreground rounded-xl shadow-xs"
              >
                Next Mon
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect('next-month')}
                className="text-[10px] h-7 px-2 font-semibold border-border hover:bg-muted text-foreground rounded-xl shadow-xs"
              >
                Next Month
              </Button>
            </div>

            <div className="flex justify-center border border-border/60 rounded-xl p-2 bg-muted/10 shadow-inner">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="w-full bg-transparent scale-95"
                modifiers={{
                  booked: (date) => isDateBooked(date)
                }}
                modifiersClassNames={{
                  booked: "after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-foreground font-semibold relative"
                }}
              />
            </div>
          </div>

        </div>

        {/* ─── RIGHT CALENDAR VIEW PANEL (Width 8/12) ─── */}
        <div className="lg:col-span-8 space-y-5 flex flex-col">
          
          {/* CONTAINER 5: Toolbar & Control Ribbon */}
          <div className="bg-card border border-border/80 rounded-2xl p-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_25px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 flex-wrap">
            
            <div className="flex items-center gap-2 flex-wrap">
              {/* Year Navigation Controls */}
              <div className="flex items-center border border-border rounded-xl overflow-hidden bg-muted/20 shadow-xs">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (!selectedDate) return
                    const newDate = new Date(selectedDate)
                    newDate.setFullYear(newDate.getFullYear() - 1)
                    setSelectedDate(newDate)
                  }}
                  className="h-8.5 w-8.5 rounded-none border-r border-border hover:bg-muted"
                  title="Previous Year"
                >
                  <ChevronsLeft className="size-4 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleNavigateDate('prev')}
                  className="h-8.5 w-8.5 rounded-none border-r border-border hover:bg-muted"
                  title="Previous"
                >
                  <ChevronLeft className="size-4 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleNavigateDate('next')}
                  className="h-8.5 w-8.5 rounded-none border-r border-border hover:bg-muted"
                  title="Next"
                >
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (!selectedDate) return
                    const newDate = new Date(selectedDate)
                    newDate.setFullYear(newDate.getFullYear() + 1)
                    setSelectedDate(newDate)
                  }}
                  className="h-8.5 w-8.5 rounded-none hover:bg-muted"
                  title="Next Year"
                >
                  <ChevronsRight className="size-4 text-muted-foreground" />
                </Button>
              </div>

              {/* Dynamic Today Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(new Date())}
                className="h-8.5 border-border text-xs shadow-xs hover:bg-muted bg-transparent rounded-xl font-semibold"
              >
                Today ({new Date().getDate()})
              </Button>
              
              <span className="text-sm font-bold text-foreground ml-1 truncate max-w-[150px] sm:max-w-[220px]">
                {headerViewTitle}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8.5 pl-8 text-xs w-[130px] sm:w-[155px] border-border bg-muted/20 shadow-none rounded-xl"
                />
              </div>

              {/* Dropdown view selector (Day, Week, Month, Year, Agenda) */}
              <Select value={currentView} onValueChange={(v: CalendarViewType) => setCurrentView(v)}>
                <SelectTrigger className="h-8.5 w-[100px] text-xs border-border shadow-none bg-muted/20 rounded-xl font-semibold">
                  <SelectValue placeholder="View" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border rounded-xl shadow-lg">
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                  <SelectItem value="agenda">Agenda</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>

          {/* CONTAINER 6: Main Calendar Display Canvas */}
          <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_35px_rgba(0,0,0,0.5)] transition-all duration-300 flex-1 overflow-hidden min-h-[520px]">
            
            {/* Day View */}
            {currentView === 'day' && (
              <div className="flex flex-col h-full bg-muted/10 rounded-xl overflow-hidden border border-border/60">
                <div className="p-3 border-b border-border/60 font-semibold text-xs text-muted-foreground uppercase tracking-wider bg-muted/20 flex items-center justify-between">
                  <span>Day Schedule Timeline</span>
                  <Badge variant="outline" className="text-[9px] bg-muted border-border text-muted-foreground">
                    {searchedEvents.filter(e => new Date(e.from).toDateString() === selectedDate?.toDateString()).length} events
                  </Badge>
                </div>
                <div className="flex-1 overflow-y-auto max-h-[500px] divide-y divide-border/40 scrollbar-thin">
                  {dayTimelineHours.map(hour => {
                    const matched = searchedEvents.find(e => {
                      const hourNum = hour.substring(0, 2)
                      const evHourNum = new Date(e.from).getHours().toString().padStart(2, '0')
                      return evHourNum === hourNum && new Date(e.from).toDateString() === selectedDate?.toDateString()
                    })

                    return (
                      <div key={hour} className="flex min-h-[60px] relative hover:bg-muted/20 transition-colors">
                        <div className="w-16 p-3.5 text-[10px] font-semibold text-muted-foreground text-right border-r border-border/60 bg-muted/10">
                          {hour}
                        </div>
                        <div className="flex-1 p-2 relative flex items-center">
                          {matched ? (
                            <div
                              onClick={() => matched && handleBlockClick(new Date(matched.from))}
                              className={`w-full border rounded-xl p-2.5 pl-4 text-xs relative group/event transition-all cursor-pointer bg-card border-border shadow-xs hover:border-foreground/30`}
                            >
                              <div className={`absolute inset-y-2 left-2 w-1 rounded-full ${
                                matched.type && etiquetteColors[matched.type] ? etiquetteColors[matched.type].dot : 'bg-muted-foreground'
                              }`} />
                              <div className="flex items-center justify-between">
                                <div className="font-bold text-foreground">{matched.title}</div>
                                <div className="flex items-center gap-1 opacity-0 group-hover/event:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      convertEventToTask(matched);
                                    }}
                                    className="h-5 px-1.5 text-[10px] font-semibold text-foreground hover:bg-muted rounded-md"
                                    title="Convert event to Task"
                                  >
                                    + Task
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      convertEventToNote(matched);
                                    }}
                                    className="h-5 px-1.5 text-[10px] font-semibold text-foreground hover:bg-muted rounded-md"
                                    title="Save event as Meeting Note"
                                  >
                                    + Note
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteEvent(matched.id)
                                    }}
                                    className="size-5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                                  >
                                    <Trash2 className="size-3" />
                                  </Button>
                                </div>
                              </div>
                              <div className="text-[10px] text-muted-foreground mt-0.5 flex justify-between">
                                <span>{formatDateRange(new Date(matched.from), new Date(matched.to))}</span>
                                {matched.location && <span className="opacity-80">Location: {matched.location}</span>}
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() => selectedDate && handleBlockClick(selectedDate, hour)}
                              className="w-full h-full cursor-pointer flex items-center pl-4 text-muted-foreground/40 hover:text-foreground hover:bg-muted/20 transition-all rounded-xl"
                            >
                              <span className="opacity-0 hover:opacity-100 text-[10.5px] font-semibold flex items-center gap-1">
                                <Plus className="size-3" /> Book {hour}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Week View */}
            {currentView === 'week' && (
              <div className="overflow-x-auto w-full scrollbar-none">
                <div className="grid grid-cols-7 h-full bg-muted/10 rounded-xl overflow-hidden border border-border/60 divide-x divide-border/60 min-w-[700px] md:min-w-0 min-h-[460px]">
                  {weekDays.map(day => {
                    const isToday = day.toDateString() === new Date().toDateString()
                    const isSelected = day.toDateString() === selectedDate?.toDateString()
                    const dayEvents = searchedEvents.filter(e => new Date(e.from).toDateString() === day.toDateString())

                    return (
                      <div
                        key={day.toISOString()}
                        onClick={() => {
                          setSelectedDate(day)
                        }}
                        className={`flex flex-col h-full min-h-[400px] cursor-pointer hover:bg-muted/20 transition-colors ${
                          isSelected ? 'bg-muted/30' : ''
                        }`}
                      >
                        <div className="p-3 text-center border-b border-border/60 bg-muted/20 flex flex-col items-center">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">
                            {day.toLocaleDateString('en-US', { weekday: 'short' })}
                          </span>
                          <span className={`text-sm font-semibold rounded-full size-6 flex items-center justify-center mt-1 transition-all ${
                            isToday ? 'bg-foreground text-background font-bold shadow-xs' : 'text-foreground'
                          }`}>
                            {day.getDate()}
                          </span>
                        </div>
                        <div
                          onClick={(e) => {
                            if (e.target === e.currentTarget) {
                              handleBlockClick(day)
                            }
                          }}
                          className="flex-1 p-2 space-y-1.5 overflow-y-auto max-h-[380px] scrollbar-thin"
                        >
                          {dayEvents.map(event => (
                            <div
                              key={event.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleBlockClick(new Date(event.from))
                              }}
                              className={`border rounded-xl p-2 text-[10.5px] relative pl-4 leading-normal group/event cursor-pointer bg-card border-border shadow-xs hover:border-foreground/30`}
                            >
                              <div className={`absolute inset-y-1.5 left-1.5 w-1 rounded-full ${
                                event.type && etiquetteColors[event.type] ? etiquetteColors[event.type].dot : 'bg-muted-foreground'
                              }`} />
                              <div className="font-bold text-foreground truncate">{event.title}</div>
                              <div className="text-[9px] text-muted-foreground mt-0.5 font-medium">
                                {new Date(event.from).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteEvent(event.id)
                                }}
                                className="absolute right-1 top-1 opacity-0 group-hover/event:opacity-100 p-0.5 text-muted-foreground hover:text-foreground"
                              >
                                <Trash2 className="size-2.5" />
                              </button>
                            </div>
                          ))}
                          {dayEvents.length === 0 && (
                            <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground/40 italic select-none py-12 pointer-events-none">
                              Free
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Month View */}
            {currentView === 'month' && (
              <div className="overflow-x-auto w-full scrollbar-none">
                <div className="flex flex-col h-full bg-muted/10 rounded-xl overflow-hidden border border-border/60 min-w-[750px] md:min-w-0 min-h-[500px]">
                  <div className="grid grid-cols-7 border-b border-border/60 bg-muted/20 text-center py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <div>Sun</div>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                  </div>
                  <div className="grid grid-cols-7 grid-rows-6 flex-1 divide-y divide-x divide-border/60 min-h-[460px]">
                    {monthDays.map(({ date, isCurrentMonth }) => {
                      const isToday = date.toDateString() === new Date().toDateString()
                      const isSelected = date.toDateString() === selectedDate?.toDateString()
                      const dayEvents = searchedEvents.filter(e => new Date(e.from).toDateString() === date.toDateString())

                      return (
                        <div
                          key={date.toISOString()}
                          onClick={() => {
                            handleBlockClick(date)
                          }}
                          className={`min-h-[75px] p-2 flex flex-col justify-between cursor-pointer hover:bg-muted/30 transition-colors group/cell ${
                            isSelected ? 'bg-muted/40 font-semibold' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-semibold rounded-full size-5.5 flex items-center justify-center ${
                              isToday
                                ? 'bg-foreground text-background font-bold shadow-xs'
                                : isCurrentMonth
                                ? 'text-foreground'
                                : 'text-muted-foreground/40'
                            }`}>
                              {date.getDate()}
                            </span>
                          </div>

                          <div className="mt-1 space-y-1 max-h-[50px] overflow-hidden pr-0.5">
                            {dayEvents.slice(0, 2).map(event => (
                              <div
                                key={event.id}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleBlockClick(new Date(event.from))
                                }}
                                className={`border border-border/60 bg-card rounded-lg px-1.5 py-0.5 text-[9px] font-semibold truncate relative pl-3.5 text-foreground shadow-xs`}
                              >
                                <div className={`absolute inset-y-1 left-1.5 w-1 rounded-full ${
                                  event.type && etiquetteColors[event.type] ? etiquetteColors[event.type].dot : 'bg-muted-foreground'
                                }`} />
                                {event.title}
                              </div>
                            ))}
                            {dayEvents.length > 2 && (
                              <div className="text-[8.5px] text-muted-foreground text-center font-bold">
                                +{dayEvents.length - 2} more
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Year View */}
            {currentView === 'year' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-2 overflow-y-auto max-h-[500px] scrollbar-thin">
                {yearMonths.map(month => {
                  const monthName = month.toLocaleDateString('en-US', { month: 'long' })
                  
                  const year = month.getFullYear()
                  const mVal = month.getMonth()
                  const daysInMonth = new Date(year, mVal + 1, 0).getDate()
                  const startDay = new Date(year, mVal, 1).getDay()

                  return (
                    <div
                      key={month.toISOString()}
                      className="border border-border/60 rounded-xl p-3.5 bg-muted/10 flex flex-col justify-between"
                    >
                      <h4 className="text-xs font-bold text-foreground border-b border-border/60 pb-1 mb-2">
                        {monthName}
                      </h4>
                      
                      <div className="grid grid-cols-7 gap-0.5 text-[8.5px] text-center text-muted-foreground font-semibold select-none">
                        {Array.from({ length: startDay }).map((_, i) => (
                          <div key={`offset-${i}`} />
                        ))}
                        
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                          const dateVal = new Date(year, mVal, i + 1)
                          const isSelected = dateVal.toDateString() === selectedDate?.toDateString()
                          const hasEvents = events.some(e => new Date(e.from).toDateString() === dateVal.toDateString())

                          return (
                            <div
                              key={i}
                              onClick={() => {
                                setSelectedDate(dateVal)
                                setCurrentView('month')
                              }}
                              className={`size-4 flex items-center justify-center rounded-full cursor-pointer hover:bg-muted transition-all ${
                                isSelected
                                  ? 'bg-foreground text-background font-bold'
                                  : hasEvents
                                  ? 'border border-border font-bold text-foreground'
                                  : ''
                              }`}
                            >
                              {i + 1}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Agenda View */}
            {currentView === 'agenda' && (
              <div className="flex flex-col h-full bg-muted/10 rounded-xl overflow-hidden border border-border/60 min-h-[460px]">
                <div className="p-3 border-b border-border/60 font-semibold text-xs text-muted-foreground uppercase tracking-wider bg-muted/20 flex items-center justify-between">
                  <span>Agenda Block Schedule List</span>
                  <Badge variant="outline" className="text-[9px] bg-muted border-border text-muted-foreground">
                    {searchedEvents.length} Total Agenda Blocks
                  </Badge>
                </div>
                
                <div className="flex-1 overflow-y-auto max-h-[440px] p-4 divide-y divide-border/60 space-y-4 scrollbar-thin">
                  {searchedEvents
                    .sort((a, b) => new Date(a.from).getTime() - new Date(b.from).getTime())
                    .map(event => {
                      const evDate = new Date(event.from)
                      return (
                        <div key={event.id} className="pt-4 flex flex-col sm:flex-row sm:items-start gap-4 group/agenda">
                          <div className="sm:w-32 shrink-0 flex flex-row sm:flex-col items-baseline sm:items-start gap-2">
                            <span className="text-sm font-bold text-foreground">
                              {evDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                            </span>
                            <span className="text-xs text-muted-foreground font-semibold">
                              {evDate.toLocaleDateString('en-US', { weekday: 'long' })}
                            </span>
                          </div>

                          <div
                            onClick={() => handleBlockClick(evDate)}
                            className={`flex-1 border rounded-xl p-4 cursor-pointer bg-card border-border/80 hover:border-foreground/30 shadow-xs transition-colors relative pl-6`}
                          >
                            <div className={`absolute inset-y-4 left-3 w-1 rounded-full ${
                              event.type && etiquetteColors[event.type] ? etiquetteColors[event.type].dot : 'bg-muted-foreground'
                            }`} />
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h4 className="text-sm font-bold text-foreground">{event.title}</h4>
                                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1 font-mono">
                                  <Clock className="size-3" />
                                  {formatDateRange(new Date(event.from), new Date(event.to))}
                                </div>
                                {event.description && (
                                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                    {event.description}
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteEvent(event.id)
                                }}
                                className="opacity-0 group-hover/agenda:opacity-100 size-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                  {searchedEvents.length === 0 && (
                    <div className="py-16 text-center text-sm text-muted-foreground italic border border-dashed border-border rounded-xl">
                      No events found matching your query.
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  )
}
