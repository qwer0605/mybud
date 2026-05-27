import { useAuthStore } from '@/store/authStore'
import { isFirebaseConfigured } from '@/firebase/config'
import clsx from 'clsx'

interface AuthButtonProps {
  /** 사이드바 하단용(column 방향) vs 모바일 상단바용(row 방향) */
  layout?: 'sidebar' | 'topbar'
}

export function AuthButton({ layout = 'sidebar' }: AuthButtonProps) {
  const { user, isLoading, signInWithGoogle, signOut } = useAuthStore()

  // Firebase 미설정 시 아무것도 표시 안 함
  if (!isFirebaseConfigured) return null

  if (isLoading) {
    return (
      <div className={clsx(
        'flex items-center gap-2',
        layout === 'sidebar' ? 'px-3 py-2.5' : 'px-2 py-1.5'
      )}>
        <div className="w-5 h-5 border-2 border-gray-200 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin" />
        <span className="text-xs text-gray-400 dark:text-gray-500">로딩 중...</span>
      </div>
    )
  }

  if (!user) {
    return (
      <button
        onClick={signInWithGoogle}
        className={clsx(
          'flex items-center gap-2.5 w-full rounded-xl font-medium transition-colors',
          'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600',
          'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200',
          layout === 'sidebar' ? 'px-3 py-2.5 text-sm' : 'px-3 py-2 text-xs'
        )}
      >
        {/* Google G 로고 */}
        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Google로 동기화
      </button>
    )
  }

  // 로그인 상태
  return (
    <div className={clsx(
      'flex items-center gap-2',
      layout === 'sidebar' ? 'flex-col' : 'flex-row'
    )}>
      {/* 사용자 정보 */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName ?? ''}
            className="w-7 h-7 rounded-full flex-shrink-0 border border-gray-200 dark:border-gray-600"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {(user.displayName ?? user.email ?? '?')[0].toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-800 dark:text-gray-100 truncate">
            {user.displayName ?? user.email ?? '사용자'}
          </p>
          <p className="text-[10px] text-green-600 dark:text-green-400 font-medium">동기화 중</p>
        </div>
      </div>

      {/* 로그아웃 버튼 */}
      <button
        onClick={signOut}
        className={clsx(
          'flex-shrink-0 text-xs font-medium text-gray-400 dark:text-gray-500',
          'hover:text-red-500 dark:hover:text-red-400 transition-colors',
          layout === 'sidebar' ? 'w-full text-center py-1' : 'px-2'
        )}
        title="로그아웃"
      >
        로그아웃
      </button>
    </div>
  )
}
