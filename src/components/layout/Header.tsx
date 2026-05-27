import { type ReactNode } from 'react'
import { useSettingsStore } from '@/store/settingsStore'

interface HeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function Header({ title, subtitle, action }: HeaderProps) {
  const { toggleTheme } = useSettingsStore()

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {action}
        {/* 모바일에서 테마 토글 버튼 */}
        <button
          onClick={toggleTheme}
          className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
          aria-label="테마 전환"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
