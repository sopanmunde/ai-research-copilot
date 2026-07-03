'use client'

import React, { useState, useMemo } from 'react'
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
  Cpu,
  Search
} from 'lucide-react'
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
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: 'e1',
      title: 'AI Agent Architecture Sync',
      from: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
      to: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
      type: 'blue',
      description: 'Discuss Gemini integration plans and local provider endpoints.',
      location: 'Conference Room Alpha'
    },
    {
      id: 'e2',
      title: 'Design Review: Dashboard Mockups',
      from: new Date(new Date().setHours(11, 30, 0, 0)).toISOString(),
      to: new Date(new Date().setHours(12, 30, 0, 0)).toISOString(),
      type: 'purple',
      description: 'Go over frontend layout adjustments and dark mode settings.',
      location: 'Huddle Room B'
    },
    {
      id: 'e3',
      title: 'Client Demo: TriVisionX Alpha v1',
      from: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
      to: new Date(new Date().setHours(15, 0, 0, 0)).toISOString(),
      type: 'green',
      description: 'Live demonstration of automated pipeline execution.',
      location: 'Virtual Meet Link'
    },
    {
      id: 'e4',
      title: 'Product Launch Planning',
      from: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
      to: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
      type: 'orange',
      description: 'Strategic planning session for marketing and developer outreach.',
      location: 'Executive Boardroom'
    }
  ])

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
  const handleSaveNewEvent = () => {
    if (!newEventTitle.trim()) return

    const [startH, startM] = convert12hTo24h(newEventStartTime)
    const [endH, endM] = convert12hTo24h(newEventEndTime)

    const fromDate = new Date(newEventStartDate)
    fromDate.setHours(startH, startM, 0, 0)

    const toDate = new Date(newEventEndDate)
    toDate.setHours(endH, endM, 0, 0)

    const newEv: CalendarEvent = {
      id: Math.random().toString(36).substring(7),
      title: newEventTitle,
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      type: newEventEtiquette,
      description: newEventDescription,
      location: newEventLocation,
      allDay: newEventAllDay
    }

    setEvents(prev => [...prev, newEv])
    setIsAddEventOpen(false)

    // Add color-coded log
    const timeLog = new Date().toLocaleTimeString()
    setLogs(prev => [
      { id: Math.random().toString(), text: `${timeLog} - Created Block: "${newEventTitle}"`, type: newEventEtiquette },
      ...prev
    ])
  }

  // Delete event handler
  function handleDeleteEvent(id: string) {
    const ev = events.find(e => e.id === id)
    setEvents(prev => prev.filter(e => e.id !== id))
    if (ev) {
      const timeLog = new Date().toLocaleTimeString()
      setLogs(prev => [
        { id: Math.random().toString(), text: `${timeLog} - Removed: "${ev.title}"`, type: ev.type },
        ...prev
      ])
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

        const newEv: CalendarEvent = {
          id: Math.random().toString(36).substring(7),
          title: 'AI Booking: Integration Call',
          from: tomorrow.toISOString(),
          to: endTomorrow.toISOString(),
          type: 'blue',
          description: 'Scheduled automatically by AI Agent.'
        }
        setEvents(prev => [...prev, newEv])
        
        setLogs(prev => [
          { id: Math.random().toString(), text: `${new Date().toLocaleTimeString()} - Autopilot Auto-Scheduled: "AI Booking: Integration Call"`, type: 'blue' },
          ...prev
        ])
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

  return (
    <div className="relative flex-1 overflow-y-auto bg-background pb-16">
      
      {/* Root Create Event Dialog */}
      <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
        <DialogContent className="sm:max-w-[400px] p-5 bg-zinc-950 text-zinc-50 border-zinc-800 gap-0">
          <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-zinc-800">
            <DialogTitle className="text-base font-bold">Create Event</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 py-3">
            {/* Title */}
            <div className="space-y-1">
              <Label htmlFor="title" className="text-xs text-zinc-400 font-medium">Title</Label>
              <Input
                id="title"
                placeholder="Event Title"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-zinc-100 h-8.5 text-xs focus-visible:ring-zinc-700"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label htmlFor="description" className="text-xs text-zinc-400 font-medium">Description</Label>
              <Textarea
                id="description"
                placeholder="Description details"
                value={newEventDescription}
                onChange={(e) => setNewEventDescription(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-zinc-100 min-h-[60px] text-xs focus-visible:ring-zinc-700"
              />
            </div>

            {/* Start Date & Start Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400 font-medium">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between bg-zinc-900 border-zinc-800 text-zinc-100 h-8.5 text-xs px-3 hover:bg-zinc-900"
                    >
                      <span>{formatOrdinalDate(newEventStartDate)}</span>
                      <CalendarIcon className="size-3.5 text-zinc-500" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-zinc-950 border-zinc-850">
                    <Calendar
                      mode="single"
                      selected={newEventStartDate}
                      onSelect={(d) => d && setNewEventStartDate(d)}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-zinc-400 font-medium">Start Time</Label>
                <Select value={newEventStartTime} onValueChange={setNewEventStartTime}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100 h-8.5 text-xs shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 bg-zinc-950 border-zinc-850">
                    {timeDropdownOptions.map(t => (
                      <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* End Date & End Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400 font-medium">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between bg-zinc-900 border-zinc-800 text-zinc-100 h-8.5 text-xs px-3 hover:bg-zinc-900"
                    >
                      <span>{formatOrdinalDate(newEventEndDate)}</span>
                      <CalendarIcon className="size-3.5 text-zinc-500" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-zinc-950 border-zinc-850">
                    <Calendar
                      mode="single"
                      selected={newEventEndDate}
                      onSelect={(d) => d && setNewEventEndDate(d)}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-zinc-400 font-medium">End Time</Label>
                <Select value={newEventEndTime} onValueChange={setNewEventEndTime}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100 h-8.5 text-xs shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 bg-zinc-950 border-zinc-850">
                    {timeDropdownOptions.map(t => (
                      <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* All day */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="all-day"
                checked={newEventAllDay}
                onChange={(e) => setNewEventAllDay(e.target.checked)}
                className="rounded border-zinc-800 bg-zinc-900 text-zinc-100 size-4 cursor-pointer"
              />
              <Label htmlFor="all-day" className="text-xs text-zinc-300 font-medium cursor-pointer">All day</Label>
            </div>

            {/* Location */}
            <div className="space-y-1">
              <Label htmlFor="location" className="text-xs text-zinc-400 font-medium">Location</Label>
              <Input
                id="location"
                placeholder="Location details"
                value={newEventLocation}
                onChange={(e) => setNewEventLocation(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-zinc-100 h-8.5 text-xs focus-visible:ring-zinc-700"
              />
            </div>

            {/* Etiquette (Colors) */}
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400 font-medium">Etiquette</Label>
              <div className="flex items-center gap-2.5">
                {['blue', 'yellow', 'purple', 'pink', 'green', 'orange'].map((colorKey) => {
                  const key = colorKey as 'blue' | 'yellow' | 'purple' | 'pink' | 'green' | 'orange'
                  const colorConfig = etiquetteColors[key]
                  const isSelected = newEventEtiquette === key
                  return (
                    <button
                      key={key}
                      onClick={() => setNewEventEtiquette(key)}
                      className={`size-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected ? 'border-sky-500 scale-110' : 'border-zinc-800 hover:border-zinc-650'
                      } ${colorConfig.dot}`}
                      type="button"
                    >
                      {isSelected && <div className="size-1.5 rounded-full bg-zinc-950 dark:bg-white" />}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2 border-t border-zinc-800 pt-3 mt-1">
            <Button
              variant="outline"
              onClick={() => setIsAddEventOpen(false)}
              className="bg-transparent border-zinc-800 text-zinc-300 h-8.5 text-xs hover:bg-zinc-900"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveNewEvent}
              className="bg-white text-zinc-950 hover:bg-zinc-200 h-8.5 text-xs font-semibold"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="relative px-6 py-8 lg:px-8 max-w-7xl mx-auto space-y-8">
        
        {/* ─── Header Section ─────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
                <CalendarIcon className="mr-1 size-3" /> Calendar System
              </span>
              {aiSync && (
                <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/5">
                  <span className="relative flex h-1.5 w-1.5 mr-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  Autopilot Synced
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl">
              Scheduler & Logs
            </h1>
            <p className="max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
              Manage appointments and view event lists. Click any block or calendar cell directly to pop up the event creation dialog.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Create Event Button (Transparent / Outline style) */}
            <Button
              variant="outline"
              onClick={() => handleBlockClick(new Date())}
              className="h-9.5 text-xs border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 bg-transparent text-zinc-800 dark:text-zinc-200 shadow-xs"
            >
              <Plus className="mr-1.5 size-3.5" /> Create Event
            </Button>
          </div>
        </div>

        {/* ─── Main Grid Layout ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT SIDEBAR PANEL */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Quick selector (Mini-calendar & Preset triggers) */}
            <DashboardCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <CalendarIcon className="size-4 text-zinc-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Quick Selector</span>
              </div>
              
              {/* Presets Row */}
              <div className="grid grid-cols-2 gap-1.5 mb-3.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect('today')}
                  className="text-[10px] h-7 px-2 font-semibold bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect('tomorrow')}
                  className="text-[10px] h-7 px-2 font-semibold bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Tomorrow
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect('next-week')}
                  className="text-[10px] h-7 px-2 font-semibold bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Next Mon
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect('next-month')}
                  className="text-[10px] h-7 px-2 font-semibold bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Next Month
                </Button>
              </div>

              <div className="flex justify-center border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 bg-zinc-50/50 dark:bg-zinc-950/20">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="w-full bg-transparent scale-95"
                  modifiers={{
                    booked: (date) => isDateBooked(date)
                  }}
                  modifiersClassNames={{
                    booked: "after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-zinc-500 font-semibold relative"
                  }}
                />
              </div>
            </DashboardCard>

            {/* AI Autopilot Controls (Colored indicators) */}
            <DashboardCard>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-zinc-500" />
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Autopilot Directives</span>
                </div>
                {aiSync && (
                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:bg-emerald-500/5">
                    <span className="relative flex h-1.5 w-1.5 mr-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    Active
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="ai-sync-switch" className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      Auto-booking rules
                    </Label>
                    <p className="text-[10px] text-zinc-500 leading-normal">
                      Automatically approve matching slots.
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

                <Separator className="bg-zinc-100 dark:bg-zinc-800/80" />

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-zinc-850 dark:text-zinc-200">
                    Instructions Prompt
                  </Label>
                  <Textarea
                    value={aiInstructions}
                    onChange={(e) => setAiInstructions(e.target.value)}
                    className="text-xs min-h-[50px] border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-700 bg-transparent resize-none leading-normal"
                  />
                </div>

                <Button
                  variant="outline"
                  onClick={runAutopilotSimulation}
                  disabled={isSimulating}
                  className="w-full text-xs border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 shadow-xs"
                >
                  {isSimulating ? (
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="size-3 animate-spin" /> Simulating Agent...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Cpu className="size-3" /> Simulate Auto-Booking
                    </span>
                  )}
                </Button>
              </div>
            </DashboardCard>

            {/* Activity Logs (Color-coded) */}
            <DashboardCard className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Activity Logs Console</span>
                <button
                  onClick={() => setLogs([])}
                  className="text-[10px] font-semibold text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-200"
                >
                  Clear
                </button>
              </div>
              <div className="h-[115px] rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-900 text-zinc-300 dark:bg-zinc-950 p-2.5 text-[9.5px] font-mono overflow-y-auto leading-normal space-y-1 shadow-inner scrollbar-none">
                {logs.map((log) => {
                  const dotColor = log.type && etiquetteColors[log.type] ? etiquetteColors[log.type].dot : 'bg-zinc-550'
                  return (
                    <div key={log.id} className="flex gap-2 items-center">
                      <span className={`size-1.5 rounded-full shrink-0 ${dotColor}`} />
                      <span className="text-zinc-600 select-none">&gt;</span>
                      <span className="break-all">{log.text}</span>
                    </div>
                  )
                })}
              </div>
            </DashboardCard>

          </div>

          {/* RIGHT CALENDAR VIEW PANEL (Width: 8/12) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* TOOLBAR */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 bg-white/70 dark:bg-zinc-950/20 backdrop-blur-md shadow-xs">
              
              <div className="flex items-center gap-2">
                {/* Year Navigation Controls */}
                <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-background">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (!selectedDate) return
                      const newDate = new Date(selectedDate)
                      newDate.setFullYear(newDate.getFullYear() - 1)
                      setSelectedDate(newDate)
                    }}
                    className="h-8.5 w-8.5 rounded-none border-r border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    title="Previous Year"
                  >
                    <ChevronsLeft className="size-4 text-zinc-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleNavigateDate('prev')}
                    className="h-8.5 w-8.5 rounded-none border-r border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    title="Previous"
                  >
                    <ChevronLeft className="size-4 text-zinc-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleNavigateDate('next')}
                    className="h-8.5 w-8.5 rounded-none border-r border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    title="Next"
                  >
                    <ChevronRight className="size-4 text-zinc-500" />
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
                    className="h-8.5 w-8.5 rounded-none hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    title="Next Year"
                  >
                    <ChevronsRight className="size-4 text-zinc-500" />
                  </Button>
                </div>

                {/* Dynamic Today Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date())}
                  className="h-8.5 border-zinc-200 dark:border-zinc-800 text-xs shadow-xs hover:bg-zinc-50 dark:hover:bg-zinc-900 bg-transparent"
                >
                  Today ({new Date().getDate()})
                </Button>
                
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 ml-1 truncate max-w-[150px] sm:max-w-[220px]">
                  {headerViewTitle}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400 pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Search blocks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8.5 pl-8 text-xs w-[130px] sm:w-[155px] border-zinc-200 dark:border-zinc-800 bg-background shadow-none"
                  />
                </div>

                {/* Dropdown view selector (Day, Week, Month, Year, Agenda) */}
                <Select value={currentView} onValueChange={(v: CalendarViewType) => setCurrentView(v)}>
                  <SelectTrigger className="h-8.5 w-[95px] text-xs border-zinc-200 dark:border-zinc-800 shadow-none bg-background">
                    <SelectValue placeholder="View" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-zinc-200 dark:border-zinc-800">
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                    <SelectItem value="agenda">Agenda</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </div>

            {/* MAIN CALENDAR DISPLAY WINDOW */}
            <DashboardCard className="flex-1 p-0 overflow-visible min-h-[500px]">
              
              {/* Day View */}
              {currentView === 'day' && (
                <div className="flex flex-col h-full bg-background/30 rounded-xl overflow-hidden border border-zinc-200/50 dark:border-zinc-800/50">
                  <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 font-semibold text-xs text-zinc-500 uppercase tracking-wider bg-zinc-50/50 dark:bg-zinc-950/20">
                    Day Schedule Timeline
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-[500px] divide-y divide-zinc-100 dark:divide-zinc-900">
                    {dayTimelineHours.map(hour => {
                      const matched = searchedEvents.find(e => {
                        const hourNum = hour.substring(0, 2)
                        const evHourNum = new Date(e.from).getHours().toString().padStart(2, '0')
                        return evHourNum === hourNum && new Date(e.from).toDateString() === selectedDate?.toDateString()
                      })

                      return (
                        <div key={hour} className="flex min-h-[60px] relative hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                          <div className="w-16 p-3.5 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 text-right border-r border-zinc-200/60 dark:border-zinc-800/50 bg-zinc-50/20 dark:bg-zinc-950/5">
                            {hour}
                          </div>
                          <div className="flex-1 p-2 relative flex items-center">
                            {matched ? (
                              <div
                                onClick={() => matched && handleBlockClick(new Date(matched.from))}
                                className={`w-full border rounded-lg p-2.5 pl-4 text-xs relative group/event transition-all cursor-pointer hover:bg-zinc-100/30 dark:hover:bg-zinc-900/50 ${
                                  matched.type && etiquetteColors[matched.type] ? etiquetteColors[matched.type].border : 'border-zinc-200 dark:border-zinc-800'
                                }`}
                              >
                                <div className={`absolute inset-y-2 left-2 w-0.5 rounded-full ${
                                  matched.type && etiquetteColors[matched.type] ? etiquetteColors[matched.type].dot : 'bg-zinc-500'
                                }`} />
                                <div className="flex items-center justify-between">
                                  <div className="font-semibold text-zinc-800 dark:text-zinc-200">{matched.title}</div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteEvent(matched.id)
                                    }}
                                    className="opacity-0 group-hover/event:opacity-100 size-5 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                                  >
                                    <Trash2 className="size-3" />
                                  </Button>
                                </div>
                                <div className="text-[10px] text-zinc-500 mt-0.5 flex justify-between">
                                  <span>{formatDateRange(new Date(matched.from), new Date(matched.to))}</span>
                                  {matched.location && <span className="opacity-80">Location: {matched.location}</span>}
                                </div>
                              </div>
                            ) : (
                              <div
                                onClick={() => selectedDate && handleBlockClick(selectedDate, hour)}
                                className="w-full h-full cursor-pointer flex items-center pl-4 text-zinc-455 hover:bg-zinc-50/30 dark:hover:bg-zinc-900/10 transition-all rounded-lg"
                              >
                                <span className="opacity-0 hover:opacity-100 text-[10.5px] font-semibold text-zinc-400 flex items-center gap-1">
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
                  <div className="grid grid-cols-7 h-full bg-background/30 rounded-xl overflow-hidden border border-zinc-200/50 dark:border-zinc-800/50 divide-x divide-zinc-200 dark:divide-zinc-800 min-w-[700px] md:min-w-0 min-h-[460px]">
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
                          className={`flex flex-col h-full min-h-[400px] cursor-pointer hover:bg-zinc-50/20 dark:hover:bg-zinc-900/5 transition-colors ${
                            isSelected ? 'bg-zinc-50/20 dark:bg-zinc-900/5' : ''
                          }`}
                        >
                          <div className="p-3 text-center border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 flex flex-col items-center">
                            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">
                              {day.toLocaleDateString('en-US', { weekday: 'short' })}
                            </span>
                            <span className={`text-sm font-semibold rounded-full size-6 flex items-center justify-center mt-1 transition-all ${
                              isToday ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950 font-bold' : 'text-zinc-700 dark:text-zinc-300'
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
                            className="flex-1 p-2 space-y-1.5 overflow-y-auto max-h-[380px]"
                          >
                            {dayEvents.map(event => (
                              <div
                                key={event.id}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleBlockClick(new Date(event.from))
                                }}
                                className={`border rounded-lg p-2 text-[10.5px] relative pl-4 leading-normal group/event cursor-pointer hover:bg-zinc-150/40 dark:hover:bg-zinc-900/60 ${
                                  event.type && etiquetteColors[event.type] ? etiquetteColors[event.type].border : 'border-zinc-200 dark:border-zinc-800'
                                }`}
                              >
                                <div className={`absolute inset-y-1.5 left-1.5 w-0.5 rounded-full ${
                                  event.type && etiquetteColors[event.type] ? etiquetteColors[event.type].dot : 'bg-zinc-550'
                                }`} />
                                <div className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">{event.title}</div>
                                <div className="text-[9px] text-zinc-400 mt-0.5 font-medium">
                                  {new Date(event.from).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteEvent(event.id)
                                  }}
                                  className="absolute right-1 top-1 opacity-0 group-hover/event:opacity-100 p-0.5 text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50"
                                >
                                  <Trash2 className="size-2.5" />
                                </button>
                              </div>
                            ))}
                            {dayEvents.length === 0 && (
                              <div className="h-full flex items-center justify-center text-[10px] text-zinc-300 dark:text-zinc-700 italic select-none py-12 pointer-events-none">
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
                  <div className="flex flex-col h-full bg-background/30 rounded-xl overflow-hidden border border-zinc-200/50 dark:border-zinc-800/50 min-w-[750px] md:min-w-0 min-h-[500px]">
                    <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 text-center py-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      <div>Sun</div>
                      <div>Mon</div>
                      <div>Tue</div>
                      <div>Wed</div>
                      <div>Thu</div>
                      <div>Fri</div>
                      <div>Sat</div>
                    </div>
                    <div className="grid grid-cols-7 grid-rows-6 flex-1 divide-y divide-x divide-zinc-200/60 dark:divide-zinc-800/50 min-h-[460px]">
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
                            className={`min-h-[75px] p-2 flex flex-col justify-between cursor-pointer hover:bg-zinc-50/40 dark:hover:bg-zinc-900/5 transition-colors group/cell ${
                              isSelected ? 'bg-zinc-50/20 dark:bg-zinc-900/5' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-semibold rounded-full size-5.5 flex items-center justify-center ${
                                isToday
                                  ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950 font-bold'
                                  : isCurrentMonth
                                  ? 'text-zinc-700 dark:text-zinc-300'
                                  : 'text-zinc-350 dark:text-zinc-650'
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
                                  className={`border rounded px-1.5 py-0.5 text-[9px] font-semibold truncate relative pl-3.5 ${
                                    event.type && etiquetteColors[event.type] ? etiquetteColors[event.type].bg + ' ' + etiquetteColors[event.type].border : 'bg-zinc-100 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-750 dark:text-zinc-300'
                                  }`}
                                >
                                  <div className={`absolute inset-y-1 left-1.5 w-0.5 rounded ${
                                    event.type && etiquetteColors[event.type] ? etiquetteColors[event.type].dot : 'bg-zinc-400'
                                  }`} />
                                  {event.title}
                                </div>
                              ))}
                              {dayEvents.length > 2 && (
                                <div className="text-[8.5px] text-zinc-400 dark:text-zinc-500 text-center font-bold">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 sm:p-6 overflow-y-auto max-h-[500px]">
                  {yearMonths.map(month => {
                    const monthName = month.toLocaleDateString('en-US', { month: 'long' })
                    
                    const year = month.getFullYear()
                    const mVal = month.getMonth()
                    const daysInMonth = new Date(year, mVal + 1, 0).getDate()
                    const startDay = new Date(year, mVal, 1).getDay()

                    return (
                      <div
                        key={month.toISOString()}
                        className="border border-zinc-150 dark:border-zinc-850 rounded-xl p-3.5 bg-zinc-50/20 dark:bg-zinc-950/10 flex flex-col justify-between"
                      >
                        <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-800 pb-1 mb-2">
                          {monthName}
                        </h4>
                        
                        <div className="grid grid-cols-7 gap-0.5 text-[8.5px] text-center text-zinc-400 font-semibold select-none">
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
                                className={`size-3.5 flex items-center justify-center rounded-full cursor-pointer hover:bg-zinc-250 dark:hover:bg-zinc-855 transition-all ${
                                  isSelected
                                    ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 font-bold'
                                    : hasEvents
                                    ? 'border border-zinc-400 dark:border-zinc-650 font-bold'
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
                <div className="flex flex-col h-full bg-background/30 rounded-xl overflow-hidden border border-zinc-200/50 dark:border-zinc-800/50 min-h-[460px]">
                  <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 font-semibold text-xs text-zinc-500 uppercase tracking-wider bg-zinc-50/50 dark:bg-zinc-950/20">
                    Agenda Block Schedule List
                  </div>
                  
                  <div className="flex-1 overflow-y-auto max-h-[440px] p-4 divide-y divide-zinc-200 dark:divide-zinc-800 space-y-4">
                    {searchedEvents
                      .sort((a, b) => new Date(a.from).getTime() - new Date(b.from).getTime())
                      .map(event => {
                        const evDate = new Date(event.from)
                        return (
                          <div key={event.id} className="pt-4 flex flex-col sm:flex-row sm:items-start gap-4 group/agenda">
                            <div className="sm:w-32 shrink-0 flex flex-row sm:flex-col items-baseline sm:items-start gap-2">
                              <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                                {evDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                              </span>
                              <span className="text-xs text-zinc-400 font-semibold">
                                {evDate.toLocaleDateString('en-US', { weekday: 'long' })}
                              </span>
                            </div>

                            <div
                              onClick={() => handleBlockClick(evDate)}
                              className={`flex-1 border rounded-xl p-4 cursor-pointer bg-zinc-50/30 dark:bg-zinc-900/5 hover:bg-zinc-50 dark:hover:bg-zinc-900/10 transition-colors relative pl-6 ${
                                event.type && etiquetteColors[event.type] ? etiquetteColors[event.type].border : 'border-zinc-200 dark:border-zinc-800'
                              }`}
                            >
                              <div className={`absolute inset-y-4 left-3 w-0.5 rounded-full ${
                                event.type && etiquetteColors[event.type] ? etiquetteColors[event.type].dot : 'bg-zinc-400'
                              }`} />
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{event.title}</h4>
                                  <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                                    <Clock className="size-3" />
                                    {formatDateRange(new Date(event.from), new Date(event.to))}
                                  </div>
                                  {event.description && (
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
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
                                  className="opacity-0 group-hover/agenda:opacity-100 size-8 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })}

                    {searchedEvents.length === 0 && (
                      <div className="py-16 text-center text-sm text-zinc-400 dark:text-zinc-500 italic border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                        No events found matching your query.
                      </div>
                    )}
                  </div>
                </div>
              )}

            </DashboardCard>
          </div>

        </div>

      </div>
    </div>
  )
}
