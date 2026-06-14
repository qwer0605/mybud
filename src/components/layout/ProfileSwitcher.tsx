import { useState, useRef, useEffect } from 'react'
import { useProfileStore, type Profile } from '@/store/profileStore'
import { useTransactionStore } from '@/store/transactionStore'
import { useBudgetStore } from '@/store/budgetStore'
import { useAssetStore } from '@/store/assetStore'
import { getProfileStorageKey } from '@/utils/constants'
import { getCurrentUser } from '@/store/authStore'
import { deleteProfileDataFromFirestore } from '@/firebase/syncService'
import clsx from 'clsx'

// ───── 프로필 생성/수정 폼 ─────
const PRESET_ICONS = ['👤', '👨‍👩‍👧‍👦', '🏦', '💰', '🫂', '🎉', '🏠', '✈️', '🎓', '💼']
const PRESET_COLORS = [
  '#3b82f6', '#22c55e', '#f97316', '#ec4899',
  '#8b5cf6', '#14b8a6', '#ef4444', '#64748b',
]

interface ProfileFormProps {
  initial?: Partial<Profile>
  onSubmit: (name: string, icon: string, color: string) => void
  onCancel: () => void
  onReset?: () => void
}

function ProfileForm({ initial, onSubmit, onCancel, onReset }: ProfileFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? '👤')
  const [color, setColor] = useState(initial?.color ?? '#3b82f6')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('이름을 입력해주세요'); return }
    onSubmit(name.trim(), icon, color)
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      {/* 아이콘 선택 */}
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">아이콘</p>
        <div className="flex flex-wrap gap-2">
          {PRESET_ICONS.map((ic) => (
            <button
              key={ic}
              type="button"
              onClick={() => setIcon(ic)}
              className={clsx(
                'w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all',
                icon === ic
                  ? 'ring-2 ring-primary-400 bg-primary-50 dark:bg-primary-900/40'
                  : 'bg-cream-100 dark:bg-gray-700 hover:bg-cream-200 dark:hover:bg-gray-600'
              )}
            >
              {ic}
            </button>
          ))}
        </div>
      </div>

      {/* 색상 선택 */}
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">색상</p>
        <div className="flex gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={clsx(
                'w-7 h-7 rounded-full transition-all',
                color === c && 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800 scale-110'
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* 이름 입력 */}
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">통장 이름</p>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setError('') }}
          placeholder="예: 모임통장, 계모임, 여행 적금"
          maxLength={20}
          className="w-full px-3 py-2.5 rounded-xl border border-cream-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
          autoFocus
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>

      {/* 미리보기 */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl text-white" style={{ backgroundColor: color }}>
          {icon}
        </div>
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
          {name || '이름 없음'}
        </span>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 rounded-xl text-sm font-medium bg-cream-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-cream-200 dark:hover:bg-gray-600 transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          className="flex-1 py-2 rounded-xl text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors"
        >
          {initial?.id ? '수정' : '추가'}
        </button>
      </div>

      {/* 초기화 버튼 (수정 모드에서만) */}
      {initial?.id && onReset && (
        <div className="pt-1 border-t border-cream-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onReset}
            className="w-full py-2 text-xs font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
          >
            이 통장 초기화
          </button>
        </div>
      )}
    </form>
  )
}

// ───── 메인 프로필 스위처 ─────
interface ProfileSwitcherProps {
  compact?: boolean  // 사이드바용 vs 모바일 상단바용
}

export function ProfileSwitcher({ compact = false }: ProfileSwitcherProps) {
  const { profiles, activeProfileId, addProfile, updateProfile, deleteProfile, switchProfile, getActiveProfile } =
    useProfileStore()
  const { reloadForProfile: reloadTx } = useTransactionStore()
  const { reloadForProfile: reloadBudget } = useBudgetStore()
  const { reloadForProfile: reloadAsset } = useAssetStore()
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<'list' | 'add' | { editId: string }>('list')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const activeProfile = getActiveProfile()

  const handleResetProfile = (profile: Profile) => {
    if (
      !confirm(
        `'${profile.name}'의 모든 거래내역과 예산을 초기화할까요?\n되돌릴 수 없습니다.`
      )
    )
      return
    // localStorage 키 삭제
    localStorage.removeItem(getProfileStorageKey(profile.id, 'transactions'))
    localStorage.removeItem(getProfileStorageKey(profile.id, 'budgets'))
    localStorage.removeItem(getProfileStorageKey(profile.id, 'assets'))
    // Firestore 데이터 삭제 (로그인 상태일 때만)
    const user = getCurrentUser()
    if (user) {
      deleteProfileDataFromFirestore(user.uid, profile.id).catch(() => {})
    }
    // 스토어 재로드
    reloadTx(profile.id)
    reloadBudget(profile.id)
    reloadAsset(profile.id)
    setIsOpen(false)
    setMode('list')
  }

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setMode('list')
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const handleSwitch = (id: string) => {
    switchProfile(id)
    setIsOpen(false)
    setMode('list')
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (profiles.length <= 1) return
    if (confirm(`'${profiles.find(p => p.id === id)?.name}' 통장을 삭제할까요?\n모든 거래 내역과 예산이 삭제됩니다.`)) {
      deleteProfile(id)
    }
  }

  if (!activeProfile) return null

  return (
    <div ref={dropdownRef} className="relative">
      {/* 트리거 버튼 */}
      <button
        onClick={() => { setIsOpen(!isOpen); setMode('list') }}
        className={clsx(
          'flex items-center gap-2.5 w-full transition-colors rounded-xl',
          compact
            ? 'px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800'
            : 'px-3 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-cream-100 dark:hover:bg-gray-700'
        )}
      >
        {/* 아이콘 */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
          style={{ backgroundColor: activeProfile.color }}
        >
          <span>{activeProfile.icon}</span>
        </div>
        {/* 이름 */}
        <span className="flex-1 text-sm font-semibold text-gray-800 dark:text-gray-100 text-left truncate">
          {activeProfile.name}
        </span>
        {/* 화살표 */}
        <svg
          className={clsx('w-4 h-4 text-gray-400 flex-shrink-0 transition-transform', isOpen && 'rotate-180')}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 드롭다운 */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-cream-200 dark:border-gray-700 z-50 overflow-hidden">

          {mode === 'list' && (
            <>
              <div className="p-2 space-y-0.5 max-h-64 overflow-y-auto">
                {profiles.map((profile) => (
                  <div key={profile.id} className="flex items-center gap-2 group">
                    <button
                      onClick={() => handleSwitch(profile.id)}
                      className={clsx(
                        'flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors',
                        profile.id === activeProfileId
                          ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      )}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                        style={{ backgroundColor: profile.color }}
                      >
                        {profile.icon}
                      </div>
                      <span className="flex-1 font-medium text-left">{profile.name}</span>
                      {profile.id === activeProfileId && (
                        <svg className="w-4 h-4 text-primary-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>

                    {/* 수정/삭제 버튼 (hover 시) */}
                    <div className="flex-shrink-0 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity pr-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setMode({ editId: profile.id }) }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                        title="수정"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {profiles.length > 1 && profile.id !== 'default' && (
                        <button
                          onClick={(e) => handleDelete(e, profile.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                          title="삭제"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* 새 통장 추가 */}
              <div className="border-t border-cream-200 dark:border-gray-700 p-2">
                <button
                  onClick={() => setMode('add')}
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  새 통장 추가
                </button>
              </div>
            </>
          )}

          {mode === 'add' && (
            <ProfileForm
              onSubmit={(name, icon, color) => {
                addProfile(name, icon, color)
                setMode('list')
              }}
              onCancel={() => setMode('list')}
            />
          )}

          {typeof mode === 'object' && 'editId' in mode && (() => {
            const target = profiles.find((p) => p.id === mode.editId)
            if (!target) return null
            return (
              <ProfileForm
                initial={target}
                onSubmit={(name, icon, color) => {
                  updateProfile(target.id, { name, icon, color })
                  setMode('list')
                }}
                onCancel={() => setMode('list')}
                onReset={() => handleResetProfile(target)}
              />
            )
          })()}
        </div>
      )}
    </div>
  )
}
