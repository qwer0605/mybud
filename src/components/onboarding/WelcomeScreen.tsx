import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { isFirebaseConfigured } from '@/firebase/config'
import { ONBOARDING_DONE_KEY } from '@/utils/constants'

interface WelcomeScreenProps {
  onDone: () => void
}

const FEATURES: { icon: string; title: string; desc: string }[] = [
  { icon: '💰', title: '수입 · 지출 기록', desc: '카테고리별로 거래 내역을 빠르게 관리해요' },
  { icon: '📊', title: '예산 관리', desc: '카테고리별 예산을 설정하고 사용 현황을 확인해요' },
  { icon: '🏦', title: '자산 · 순자산 추적', desc: '계좌 잔액과 순자산 변화를 한눈에 봐요' },
  { icon: '🔁', title: '고정비 · 고정수입', desc: '매월 반복되는 거래를 자동으로 등록해요' },
]

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-10">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-8">
        {/* 로고 */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 bg-primary-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-sm mb-4">
            ₩
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">가계부</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">스마트 예산 관리</p>
        </div>

        {/* 기능 소개 */}
        <div className="space-y-4 mb-8">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-lg flex-shrink-0">
                {f.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{f.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 시작 버튼 */}
        {isFirebaseConfigured ? (
          <div className="space-y-2.5">
            <button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-medium text-sm bg-primary-500 hover:bg-primary-600 text-white transition-colors disabled:opacity-60"
            >
              {isSigningIn ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" fillOpacity="0.85" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff" fillOpacity="0.7" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" fillOpacity="0.55" />
                </svg>
              )}
              Google로 로그인하고 시작
            </button>
            <button
              onClick={finish}
              className="w-full py-3 rounded-xl font-medium text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              로그인 없이 시작 (이 기기에 저장)
            </button>
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center pt-1">
              로그인하면 여러 기기에서 데이터가 동기화돼요
            </p>
          </div>
        ) : (
          <button
            onClick={finish}
            className="w-full py-3 rounded-xl font-medium text-sm bg-primary-500 hover:bg-primary-600 text-white transition-colors"
          >
            시작하기
          </button>
        )}
      </div>
    </div>
  )
}
