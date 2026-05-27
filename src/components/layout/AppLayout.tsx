import { type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { ProfileSwitcher } from './ProfileSwitcher'
import { AuthButton } from '@/components/auth/AuthButton'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <Sidebar />

      {/* 모바일 상단 프로필 바 */}
      <div className="lg:hidden sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <ProfileSwitcher />
          </div>
          <AuthButton layout="topbar" />
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <main className="lg:ml-60 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 lg:pb-8">
          {children}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
