import { useState, useRef } from 'react'
import { useCategoryStore } from '@/store/categoryStore'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import clsx from 'clsx'

// ─── 아이콘 선택지 ────────────────────────────────────────────
const ICON_OPTIONS = [
  '🍽️','🍜','🍔','🍕','☕','🛒','🥗','🍱','🍷','🎂',
  '🚌','🚗','✈️','🚇','🛵','⛽','🚢','🚲','🏍️','🚕',
  '🏠','🏢','💡','🔑','🛋️','🏗️','🌿','🏡','🔒','🧹',
  '🛍️','👗','💄','👠','⌚','📱','💻','🎮','📷','🎧',
  '🏥','💊','🏋️','🧘','🩺','🦷','💉','🏃','🧬','🌡️',
  '🎬','🎵','🎨','🎭','🎪','📚','✏️','🎓','🌍','🏖️',
  '💰','💳','📈','📉','💼','🏦','🪙','💵','🧾','🤝',
  '🎁','📦','🔧','⚙️','🧰','🖨️','📬','🗂️','📌','🔖',
]

// ─── 색상 선택지 ────────────────────────────────────────────
const COLOR_OPTIONS: { color: string; bgColor: string; label: string }[] = [
  { color: '#f97316', bgColor: 'bg-orange-100 dark:bg-orange-900/30', label: '주황' },
  { color: '#ef4444', bgColor: 'bg-red-100 dark:bg-red-900/30', label: '빨강' },
  { color: '#ec4899', bgColor: 'bg-pink-100 dark:bg-pink-900/30', label: '분홍' },
  { color: '#8b5cf6', bgColor: 'bg-violet-100 dark:bg-violet-900/30', label: '보라' },
  { color: '#3b82f6', bgColor: 'bg-blue-100 dark:bg-blue-900/30', label: '파랑' },
  { color: '#06b6d4', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30', label: '하늘' },
  { color: '#14b8a6', bgColor: 'bg-teal-100 dark:bg-teal-900/30', label: '청록' },
  { color: '#22c55e', bgColor: 'bg-green-100 dark:bg-green-900/30', label: '초록' },
  { color: '#84cc16', bgColor: 'bg-lime-100 dark:bg-lime-900/30', label: '연두' },
  { color: '#f59e0b', bgColor: 'bg-amber-100 dark:bg-amber-900/30', label: '노랑' },
  { color: '#64748b', bgColor: 'bg-slate-100 dark:bg-slate-700/50', label: '회청' },
  { color: '#9ca3af', bgColor: 'bg-gray-100 dark:bg-gray-700/50', label: '회색' },
]

interface MainFormState {
  name: string
  icon: string
  color: string
  bgColor: string
}

const DEFAULT_FORM: MainFormState = {
  name: '',
  icon: '📦',
  color: '#9ca3af',
  bgColor: 'bg-gray-100 dark:bg-gray-700/50',
}

export function Settings() {
  const [activeType, setActiveType] = useState<'expense' | 'income'>('expense')
  const [expandedCat, setExpandedCat] = useState<string | null>(null)

  // 대분류 추가/수정 모달
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMain, setEditingMain] = useState<string | null>(null) // null = 추가, string = 수정
  const [mainForm, setMainForm] = useState<MainFormState>(DEFAULT_FORM)
  const [iconSearch, setIconSearch] = useState('')

  // 소분류 추가
  const [addingSubFor, setAddingSubFor] = useState<string | null>(null)
  const [newSubName, setNewSubName] = useState('')
  const newSubRef = useRef<HTMLInputElement>(null)

  // 소분류 수정
  const [editingSub, setEditingSub] = useState<{ main: string; sub: string } | null>(null)
  const [editSubName, setEditSubName] = useState('')

  const {
    expenseTree, incomeTree, expenseMeta, incomeMeta,
    addMainCategory, updateMainCategory, deleteMainCategory,
    addSubCategory, renameSubCategory, deleteSubCategory,
    resetToDefault,
  } = useCategoryStore()

  const tree = activeType === 'expense' ? expenseTree : incomeTree
  const meta = activeType === 'expense' ? expenseMeta : incomeMeta
  const mainCats = Object.keys(tree)

  // ─── 대분류 모달 열기 ────────────────────────────────────
  function openAddMain() {
    setEditingMain(null)
    setMainForm(DEFAULT_FORM)
    setIconSearch('')
    setModalOpen(true)
  }

  function openEditMain(name: string) {
    setEditingMain(name)
    const m = meta[name]
    setMainForm({
      name,
      icon: m?.icon ?? '📦',
      color: m?.color ?? '#9ca3af',
      bgColor: m?.bgColor ?? 'bg-gray-100 dark:bg-gray-700/50',
    })
    setIconSearch('')
    setModalOpen(true)
  }

  function handleModalSubmit() {
    if (!mainForm.name.trim()) return
    const metaPayload = {
      icon: mainForm.icon,
      color: mainForm.color,
      bgColor: mainForm.bgColor,
    }
    if (editingMain === null) {
      addMainCategory(activeType, mainForm.name, metaPayload)
    } else {
      updateMainCategory(activeType, editingMain, mainForm.name, metaPayload)
      if (expandedCat === editingMain) setExpandedCat(mainForm.name)
    }
    setModalOpen(false)
  }

  function handleDeleteMain(name: string) {
    if (!confirm(`"${name}" 대분류와 소분류 전체를 삭제할까요?`)) return
    deleteMainCategory(activeType, name)
    if (expandedCat === name) setExpandedCat(null)
  }

  // ─── 소분류 추가 ──────────────────────────────────────────
  function startAddSub(mainCat: string) {
    setAddingSubFor(mainCat)
    setNewSubName('')
    setExpandedCat(mainCat)
    setTimeout(() => newSubRef.current?.focus(), 50)
  }

  function commitAddSub() {
    if (addingSubFor && newSubName.trim()) {
      addSubCategory(activeType, addingSubFor, newSubName)
    }
    setAddingSubFor(null)
    setNewSubName('')
  }

  // ─── 소분류 수정 ──────────────────────────────────────────
  function startEditSub(main: string, sub: string) {
    setEditingSub({ main, sub })
    setEditSubName(sub)
  }

  function commitEditSub() {
    if (editingSub && editSubName.trim()) {
      renameSubCategory(activeType, editingSub.main, editingSub.sub, editSubName)
    }
    setEditingSub(null)
    setEditSubName('')
  }

  // ─── 아이콘 필터링 ───────────────────────────────────────
  const filteredIcons = iconSearch
    ? ICON_OPTIONS.filter((icon) => icon.includes(iconSearch))
    : ICON_OPTIONS

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
        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-2xl text-blue-600 dark:text-blue-400 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors font-medium"
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
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden"
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
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                    title="수정"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>

                  {/* 삭제 */}
                  <button
                    onClick={() => handleDeleteMain(cat)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                    title="삭제"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* 소분류 (확장 시) */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-50 dark:border-gray-700/50 pt-3">
                  <div className="flex flex-wrap gap-2">
                    {subs.map((sub) => {
                      const isEditing = editingSub?.main === cat && editingSub?.sub === sub
                      return isEditing ? (
                        <div key={sub} className="flex items-center gap-1">
                          <input
                            autoFocus
                            type="text"
                            value={editSubName}
                            onChange={(e) => setEditSubName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitEditSub()
                              if (e.key === 'Escape') { setEditingSub(null); setEditSubName('') }
                            }}
                            onBlur={commitEditSub}
                            className="w-28 px-2 py-1 text-xs rounded-full border-2 border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
                          />
                        </div>
                      ) : (
                        <div key={sub} className="flex items-center gap-0.5 bg-gray-50 dark:bg-gray-700/60 rounded-full pl-3 pr-1.5 py-1 group">
                          <span
                            onClick={() => startEditSub(cat, sub)}
                            className="text-xs text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            title="클릭하여 수정"
                          >
                            {sub}
                          </span>
                          <button
                            onClick={() => {
                              if (!confirm(`"${sub}" 소분류를 삭제할까요?`)) return
                              deleteSubCategory(activeType, cat, sub)
                            }}
                            className="ml-1 w-4 h-4 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            ×
                          </button>
                        </div>
                      )
                    })}

                    {/* 소분류 추가 인풋 */}
                    {addingSubFor === cat ? (
                      <div className="flex items-center gap-1">
                        <input
                          ref={newSubRef}
                          type="text"
                          value={newSubName}
                          onChange={(e) => setNewSubName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitAddSub()
                            if (e.key === 'Escape') { setAddingSubFor(null); setNewSubName('') }
                          }}
                          onBlur={commitAddSub}
                          placeholder="소분류명"
                          className="w-24 px-2 py-1 text-xs rounded-full border-2 border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none placeholder-gray-400"
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => startAddSub(cat)}
                        className="flex items-center gap-1 px-3 py-1 rounded-full text-xs border border-dashed border-blue-300 dark:border-blue-700 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        + 소분류 추가
                      </button>
                    )}
                  </div>

                  {subs.length > 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      소분류를 클릭하면 이름을 수정할 수 있어요
                    </p>
                  )}
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
          className="w-full py-3 rounded-2xl border border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          기본값으로 초기화
        </button>
      </div>

      {/* 대분류 추가/수정 모달 */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingMain === null ? '대분류 추가' : '대분류 수정'}
        size="md"
      >
        <div className="space-y-5">
          {/* 미리보기 */}
          <div className="flex items-center justify-center">
            <div
              className={clsx(
                'w-16 h-16 rounded-2xl flex items-center justify-center text-3xl',
                mainForm.bgColor
              )}
            >
              {mainForm.icon}
            </div>
          </div>

          {/* 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              대분류 이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={mainForm.name}
              onChange={(e) => setMainForm((p) => ({ ...p, name: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleModalSubmit()}
              placeholder="예: 반려동물"
              maxLength={10}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 아이콘 선택 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                아이콘
              </label>
              <input
                type="text"
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                placeholder="검색..."
                className="w-20 text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-10 gap-1 max-h-36 overflow-y-auto p-1 rounded-xl bg-gray-50 dark:bg-gray-700/50">
              {filteredIcons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setMainForm((p) => ({ ...p, icon }))}
                  className={clsx(
                    'w-8 h-8 flex items-center justify-center rounded-lg text-lg transition-all',
                    mainForm.icon === icon
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/40'
                      : 'hover:bg-white dark:hover:bg-gray-600'
                  )}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* 색상 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              색상
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.color}
                  type="button"
                  onClick={() => setMainForm((p) => ({ ...p, color: opt.color, bgColor: opt.bgColor }))}
                  className={clsx(
                    'w-8 h-8 rounded-full border-2 transition-all',
                    mainForm.color === opt.color
                      ? 'border-gray-900 dark:border-white scale-110'
                      : 'border-transparent hover:scale-105'
                  )}
                  style={{ backgroundColor: opt.color }}
                  title={opt.label}
                />
              ))}
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" fullWidth onClick={() => setModalOpen(false)}>
              취소
            </Button>
            <Button
              type="button"
              variant="primary"
              fullWidth
              onClick={handleModalSubmit}
              disabled={!mainForm.name.trim()}
            >
              {editingMain === null ? '추가하기' : '수정 완료'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
