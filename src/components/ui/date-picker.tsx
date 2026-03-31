'use client'

import { useEffect, useRef, useState } from 'react'

interface DatePickerProps {
  value: string // YYYY-MM-DD
  onChange: (_value: string) => void
  className?: string
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

function formatDisplay(value: string): string {
  if (!value) return 'Pick a date'
  const [y, m, d] = value.split('-').map(Number)
  return `${MONTHS[m - 1]} ${d}, ${y}`
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function toYMD(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function DatePicker({ value, onChange, className = '' }: DatePickerProps) {
  const today = new Date()
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(() => value ? parseInt(value.split('-')[0]) : today.getFullYear())
  const [viewMonth, setViewMonth] = useState(() => value ? parseInt(value.split('-')[1]) - 1 : today.getMonth())
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  // Sync view when value changes externally
  useEffect(() => {
    if (value) {
      setViewYear(parseInt(value.split('-')[0]))
      setViewMonth(parseInt(value.split('-')[1]) - 1)
    }
  }, [value])

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to full rows
  while (cells.length % 7 !== 0) cells.push(null)

  const selectedParts = value ? value.split('-').map(Number) : null
  const isSelected = (day: number) =>
    selectedParts &&
    selectedParts[0] === viewYear &&
    selectedParts[1] === viewMonth + 1 &&
    selectedParts[2] === day

  const isToday = (day: number) =>
    today.getFullYear() === viewYear &&
    today.getMonth() === viewMonth &&
    today.getDate() === day

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-2 border border-border/70 bg-background px-3 py-2 text-left text-xs focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <svg className="h-3.5 w-3.5 shrink-0 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
          {formatDisplay(value)}
        </span>
        {value && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange('') }}
            className="ml-auto text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            ×
          </button>
        )}
      </button>

      {/* Calendar popover */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 border border-border bg-card p-3 shadow-lg">
          {/* Month/year nav */}
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={prevMonth} className="p-1 text-muted-foreground hover:text-foreground">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-xs font-semibold text-foreground">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={nextMonth} className="p-1 text-muted-foreground hover:text-foreground">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="mb-1 grid grid-cols-7">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[10px] font-medium text-muted-foreground">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />
              const selected = isSelected(day)
              const todayMark = isToday(day)
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => { onChange(toYMD(viewYear, viewMonth, day)); setOpen(false) }}
                  className={[
                    'flex h-7 w-full items-center justify-center text-xs transition-colors',
                    selected
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : todayMark
                      ? 'border border-primary/50 text-primary hover:bg-accent'
                      : 'text-foreground hover:bg-accent',
                  ].join(' ')}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
