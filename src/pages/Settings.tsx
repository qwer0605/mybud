import { useRef, useState } from 'react'
import { useCategoryStore } from '@/store/categoryStore'
import { Modal } from '@/components/ui/Modal'
import { CategoryMainEditor } from '@/components/categories/CategoryMainEditor'
import { SubCategoryChips } from '@/components/categories/SubCategoryChips'
import { getActiveProfileId, getProfileStorageKey, PROFILE_STORAGE_KEY } from '@/utils/constants'
import { AppVersion } from '@/components/layout/AppVersion'
import clsx from 'clsx'

// ─── 데이터 내보내기 ─────────────────────────────────────────
function exportData() {
  try {
    const profileId = getActiveProfileId()
    const transactions = JSON.parse(localStorage.getItem(getProfileStorageKey(profileId, 'transactions')) ?? '[]')
    const budgets = JSON.parse(localStorage.getItem(getProfileStorageKey(profileId, 'budgets')) ?? '[]')
    const assets = JSON.parse(localStorage.getItem(getProfileStorageKey(profileId, 'assets')) ?? '[]')
    const profiles = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) ?? '[]')

    const exportPayload = {
      exportDate: new Date().toISOString(),
      appVersion: '1.0',
      activeProfileId: profileId,
      profiles,
      transactions,
      budgets,
      assets,
    }

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const dateStr = new Date().toLocaleDateString('ko-KR').replace(/\. /g, '-').replace('.', '')
    a.href = url
    a.download = `가계부_백업_${dateStr}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (err) {
    alert('내보내기 중 오류가 발생했습니다.')
    console.error(err)
  }
}

// ─── 데이터 가져오기(복원) ───────────────────────────────────
function importData(file: File, onDone: () => void) {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)
      if (!data || typeof data !== 'object') throw new Error('invalid backup file')

      const profileId = typeof data.activeProfileId === 'string' ? data.activeProfileId : getActiveProfileId()

      if (!confirm('현재 통장의 거래내역·예산·자산 데이터를 백업 파일 내용으로 덮어씁니다.\n계속할까요?')) {
        onDone()
        return
      }

      if (Array.isArray(data.profiles) && data.profiles.length > 0) {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(data.profiles))
      }
      if (Array.isArray(data.transactions)) {
        localStorage.setItem(getProfileStorageKey(profileId, 'transactions'), JSON.stringify(data.transactions))
      }
      if (Array.isArray(data.budgets)) {
        localStorage.setItem(getProfileStorageKey(profileId, 'budgets'), JSON.stringify(data.budgets))
      }
      if (Array.isArray(data.assets)) {
        localStorage.setItem(getProfileStorageKey(profileId, 'assets'), JSON.stringify(data.assets))
      }

      alert('데이터를 복원했습니다.')
      window.location.reload()
    } catch (err) {
      alert('복원 중 오류가 발생했습니다. 올바른 백업 파일인지 확인해주세요.')
      console.error(err)
      onDone()
    }
  }
  reader.readAsText(file)
}

export function Settings() {
  const [activeType, setActiveType] = useState<'expense' | 'income'>('expense')
  const [expandedCat, setExpandedCat] = useState<string | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  // 대분류 추가/수정 모달
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMain, setEditingMain] = useState<string | null>(null) // null = 추가, string = 수정

  const { expenseTree, incomeTree, expenseMeta, incomeMeta, resetToDefault } = useCategoryStore()

  const tree = activeType === 'expense' ? expenseTree : incomeTree
  const meta = activeType === 'expense' ? expenseMeta : incomeMeta
  const mainCats = Object.keys(tree)

  // ─── 대분류 모달 열기 ────────────────────────────────────
  function openAddMain() {
    setEditingMain(null)
    setModalOpen(true)
  }

  function openEditMain(name: string) {
    setEditingMain(name)
    setModalOpen(true)
  }

  return (
    <div className="space-y-6 pb-4">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">설정</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          카테고리를 자유롭게 추가·수정·삭제할 수 있어요
        </p>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
        {(['expense', 'income'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setActiveType(t); setExpandedCat(null) }}
            className={clsx(
              'flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-150',
              activeType === t
                ? t === 'expense'
                  ? 'bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-sm'
                  : 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {t === 'expense' ? '💸 지출 카테고리' : '💰 수입 카테고리'}
          </button>
        ))}
      </div>

      {/* 대분류 추가 버튼 */}
      <button
        onClick={openAddMain}
        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-primary-300 dark:border-primary-700 rounded-2xl text-primary-500 dark:text-primary-400 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors font-medium"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        대분류 추가
      </button>

      {/* 카테고리 카드 목록 */}
      <div className="space-y-3">
        {mainCats.length === 0 && (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm">카테고리가 없습니다. 추가해보세요!</p>
          </div>
        )}

        {mainCats.map((cat) => {
          const m = meta[cat]
          const subs = tree[cat] ?? []
          const isExpanded = expandedCat === cat

          return (
            <div
              key={cat}
              className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              {/* 대분류 헤더 */}
              <div className="flex items-center gap-3 px-4 py-3">
                {/* 아이콘 */}
                <div
                  className={clsx(
                    'w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0',
                    m?.bgColor ?? 'bg-gray-100 dark:bg-gray-700/50'
                  )}
                >
                  {m?.icon ?? '📦'}
                </div>

                {/* 이름 */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{cat}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    소분류 {subs.length}개
                  </p>
                </div>

                {/* 액션 버튼들 */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* 확장/접기 */}
                  <button
                    onClick={() => setExpandedCat(isExpanded ? null : cat)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title={isExpanded ? '접기' : '펼치기'}
                  >
                    <svg
                      className={clsx('w-4 h-4 transition-transform', isExpanded && 'rotate-180')}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* 수정 */}
                  <button
                    onClick={() => openEditMain(cat)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                    title="수정"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* 소분류 (확장 시) */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-50 dark:border-gray-700/50 pt-3">
                  <SubCategoryChips type={activeType} mainCategory={cat} subs={subs} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 기본값 복원 */}
      <div className="pt-2">
        <button
          onClick={() => {
            if (!confirm('모든 카테고리를 기본값으로 되돌릴까요?\n직접 추가한 카테고리는 삭제됩니다.')) return
            resetToDefault()
            setExpandedCat(null)
          }}
          className="w-full py-3 rounded-3xl border border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          기본값으로 초기화
        </button>
      </div>

      {/* 데이터 관리 */}
      <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">데이터 관리</h2>
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
          {/* 데이터 내보내기 */}
          <button
            onClick={exportData}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">데이터 내보내기</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                현재 통장의 거래내역·예산·자산을 JSON 파일로 저장
              </p>
            </div>
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* 데이터 가져오기(복원) */}
          <button
            onClick={() => importInputRef.current?.click()}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">데이터 가져오기 (복원)</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                백업한 JSON 파일로 거래내역·예산·자산을 복원
              </p>
            </div>
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) importData(file, () => { e.target.value = '' })
              else e.target.value = ''
            }}
          />
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 px-1">
          💡 정기적으로 백업해두면 데이터 분실을 예방할 수 있어요
        </p>
      </div>

      <AppVersion className="lg:hidden pb-2" />

      {/* 대분류 추가/수정 모달 */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingMain === null ? '대분류 추가' : '대분류 수정'}
        size="md"
      >
        <CategoryMainEditor
          key={editingMain ?? '__new__'}
          type={activeType}
          editingMain={editingMain}
          onCancel={() => setModalOpen(false)}
          onSaved={(finalName) => {
            if (editingMain !== null && expandedCat === editingMain) setExpandedCat(finalName)
            setModalOpen(false)
          }}
          onDeleted={() => {
            if (expandedCat === editingMain) setExpandedCat(null)
            setModalOpen(false)
          }}
        />
      </Modal>
    </div>
  )
}
