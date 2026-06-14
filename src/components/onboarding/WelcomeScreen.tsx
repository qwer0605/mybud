import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { isFirebaseConfigured } from '@/firebase/config'
import { ONBOARDING_DONE_KEY } from '@/utils/constants'
import { LogoMark } from '@/components/ui/LogoMark'
import { CategoryCoin } from '@/components/ui/CategoryCoin'

interface WelcomeScreenProps {
  onDone: () => void
}

export function WelcomeScreen({ onDone }: WelcomeScreenProps) {
  const { signInWithGoogle } = useAuthStore()
  const [isSigningIn, setIsSigningIn] = useState(false)

  const finish = () => {
    localStorage.setItem(ONBOARDING_DONE_KEY, '1')
    onDone()
  }

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true)
    try {
      await signInWithGoogle()
    } finally {
      setIsSigningIn(false)
      finish()
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-ink px-6 py-10">
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        {/* 로고 */}
        <LogoMark size={32} className="mb-10" />

        {/* 히어로: 미니 대시보드 카드 */}
        <div className="relative w-full mb-12">
          <div className="relative overflow-hidden rounded-[26px] p-5 bg-[#1C1A16] text-white shadow-card">
            <div className="absolute -top-10 -right-8 w-36 h-36 rounded-full bg-primary-500 opacity-20 blur-md pointer-events-none" />
            <p className="text-[13px] text-white/65 font-medium relative">이번 달 남은 예산</p>
            <p className="font-num text-3xl font-bold mt-1.5 mb-3 relative tracking-tight">₩842,000</p>
            <div className="h-2 rounded-full bg-white/16 overflow-hidden relative">
              <div className="h-full w-[58%] rounded-full bg-primary-500" />
            </div>
          </div>

          {/* 플로팅 뱃지 */}
          <div className="absolute -bottom-5 -right-3 flex items-center gap-2.5 bg-white dark:bg-gray-900 rounded-2xl shadow-card px-4 py-2.5 border border-[#EAE6DC] dark:border-gray-800">
            <CategoryCoin color="#10C57C" emoji="💰" size={32} />
            <div>
              <p className="text-[10px] text-ink-muted font-medium">오늘 기록</p>
              <p className="font-num text-sm font-bold text-ink dark:text-white leading-tight">+₩30,000</p>
            </div>
          </div>
        </div>

        {/* 헤드라인 */}
        <h1 className="text-[28px] font-bold text-ink dark:text-white text-center leading-tight">
          3초 만에 기록하는<br />가장 쉬운 가계부
        </h1>
        <p className="text-sm text-ink-2 dark:text-gray-400 text-center mt-2">
          카테고리 · 예산 · 자산까지, 차곡차곡 쌓이는 가계부
        </p>
      </div>

      {/* CTA */}
      <div className="max-w-md mx-auto w-full space-y-3 pt-6">
        <button
          onClick={finish}
          className="w-full py-3.5 rounded-2xl font-semibold text-sm bg-ink dark:bg-white text-white dark:text-ink transition-colors"
        >
          시작하기
        </button>
        {isFirebaseConfigured && (
          <button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="w-full py-2 text-sm font-medium text-ink-2 dark:text-gray-400 hover:text-ink dark:hover:text-white transition-colors disabled:opacity-60"
          >
            {isSigningIn ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-ink-muted/40 border-t-ink-muted rounded-full animate-spin" />
                로그인 중...
              </span>
            ) : (
              '이미 계정이 있나요? Google로 로그인'
            )}
          </button>
        )}
      </div>
    </div>
  )
}
