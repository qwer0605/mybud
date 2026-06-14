import { useEffect, useRef, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import clsx from 'clsx'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

interface DatePickerProps {
  value: string // YYYY-MM-DD
  onChange: (date: string) => void
  error?: boolean
}

export function DatePicker({ value, onChange, error }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selectedDate = value ? parseISO(value) : new Date()
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(selectedDate))
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [open])

  const handleToggle = () => {
    if (!open) setViewMonth(startOfMonth(selectedDate))
    setOpen((v) => !v)
  }

  const handleSelect = (day: Date) => {
    onChange(format(day, 'yyyy-MM-dd'))
    setOpen(false)
  }

  const gridStart = startOfWeek(startOfMonth(viewMonth))
  const gridEnd = endOfWeek(endOfMonth(viewMonth))
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        className={clsx(
          'w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left text-sm',
          'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
          'focus:outline-none focus:ring-2 focus:ring-primary-400 transition-shadow',
          error ? 'border-red-300 dark:border-red-600' : 'border-cream-200 dark:border-gray-600'
        )}
      >
        <span>{value ? format(selectedDate, "yyyy년 M월 d일 (EEE)", { locale: ko }) : '날짜 선택'}</span>
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 7V3m8 4V3M4 11h16M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-72 p-3 rounded-2xl border border-cream-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-xl">
          {/* 월 이동 헤더 */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setViewMonth((m) => subMonths(m, 1))}
              className="p-1.5 rounded-lg text-gray-400 hover:text-primary-500 hover:bg-cream-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {format(viewMonth, "yyyy년 M월", { locale: ko })}
            </span>
            <button
              type="button"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              className="p-1.5 rounded-lg text-gray-400 hover:text-primary-500 hover:bg-cream-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((w, i) => (
              <div
                key={w}
                className={clsx(
                  'text-center text-xs font-medium py-1',
                  i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400 dark:text-gray-500'
                )}
              >
                {w}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-y-1">
            {days.map((day) => {
              const inMonth = isSameMonth(day, viewMonth)
              const selected = !!value && isSameDay(day, selectedDate)
              const today = isToday(day)
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleSelect(day)}
                  className={clsx(
                    'mx-auto w-9 h-9 rounded-full text-sm flex items-center justify-center transition-colors',
                    !inMonth && 'text-gray-300 dark:text-gray-600',
                    inMonth && !selected && 'text-gray-700 dark:text-gray-200 hover:bg-cream-100 dark:hover:bg-gray-700',
                    selected && 'bg-primary-500 text-white font-semibold',
                    !selected && today && 'ring-1 ring-primary-400 font-semibold'
                  )}
                >
                  {format(day, 'd')}
                </button>
              )
            })}
          </div>

          {/* 오늘 버튼 */}
          <button
            type="button"
            onClick={() => handleSelect(new Date())}
            className="mt-2 w-full text-center text-xs font-medium text-primary-500 dark:text-primary-400 py-1.5 rounded-lg hover:bg-cream-100 dark:hover:bg-gray-700 transition-colors"
          >
            오늘
          </button>
        </div>
      )}
    </div>
  )
}
