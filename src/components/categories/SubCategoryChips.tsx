import { useRef, useState } from 'react'
import { useCategoryStore } from '@/store/categoryStore'
import clsx from 'clsx'

interface SubCategoryChipsProps {
  type: 'expense' | 'income'
  mainCategory: string
  subs: string[]
  /** true면 칩을 눌러 선택할 수 있음 (거래 추가 폼) */
  selectable?: boolean
  selectedSub?: string
  onSelect?: (sub: string) => void
  /** 소분류 이름이 변경된 후 호출 (선택 상태 보정용) */
  onSubRenamed?: (oldName: string, newName: string) => void
  /** 소분류가 삭제된 후 호출 (선택 상태 보정용) */
  onSubDeleted?: (name: string) => void
}

export function SubCategoryChips({
  type, mainCategory, subs, selectable = false, selectedSub, onSelect, onSubRenamed, onSubDeleted,
}: SubCategoryChipsProps) {
  const { addSubCategory, renameSubCategory, deleteSubCategory } = useCategoryStore()

  const [editingSub, setEditingSub] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [adding, setAdding] = useState(false)
  const [newSubName, setNewSubName] = useState('')
  const editRef = useRef<HTMLInputElement>(null)
  const newSubRef = useRef<HTMLInputElement>(null)

  function startEdit(sub: string) {
    setEditingSub(sub)
    setEditValue(sub)
    setTimeout(() => editRef.current?.focus(), 0)
  }

  function commitEdit() {
    if (editingSub && editValue.trim() && editValue.trim() !== editingSub) {
      const trimmed = editValue.trim()
      renameSubCategory(type, mainCategory, editingSub, trimmed)
      onSubRenamed?.(editingSub, trimmed)
    }
    setEditingSub(null)
    setEditValue('')
  }

  function handleDelete(sub: string) {
    if (!confirm(`"${sub}" 소분류를 삭제할까요?`)) return
    deleteSubCategory(type, mainCategory, sub)
    onSubDeleted?.(sub)
  }

  function startAdd() {
    setAdding(true)
    setNewSubName('')
    setTimeout(() => newSubRef.current?.focus(), 0)
  }

  function commitAdd() {
    if (newSubName.trim()) {
      addSubCategory(type, mainCategory, newSubName)
    }
    setAdding(false)
    setNewSubName('')
  }

  return (
    <div className="flex flex-wrap gap-2">
      {subs.map((sub) => {
        if (editingSub === sub) {
          return (
            <input
              key={sub}
              ref={editRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitEdit()
                if (e.key === 'Escape') { setEditingSub(null); setEditValue('') }
              }}
              onBlur={commitEdit}
              maxLength={10}
              className="w-24 px-2 py-1.5 text-xs rounded-full border-2 border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
            />
          )
        }

        const isSelected = selectable && selectedSub === sub

        return (
          <div
            key={sub}
            className={clsx(
              'flex items-center gap-1 rounded-full pl-3 pr-1.5 py-1.5 border text-xs font-medium transition-all duration-150',
              isSelected
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600'
            )}
          >
            <button
              type="button"
              onClick={() => selectable && onSelect?.(sub)}
              className={clsx(!selectable && 'cursor-default')}
            >
              {sub}
            </button>
            <button
              type="button"
              onClick={() => startEdit(sub)}
              title="수정"
              className={clsx(
                'w-4 h-4 flex items-center justify-center rounded-full transition-colors',
                isSelected
                  ? 'text-blue-100 hover:text-white hover:bg-blue-500'
                  : 'text-gray-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/40'
              )}
            >
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => handleDelete(sub)}
              title="삭제"
              className={clsx(
                'w-4 h-4 flex items-center justify-center rounded-full transition-colors',
                isSelected
                  ? 'text-blue-100 hover:text-white hover:bg-blue-500'
                  : 'text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/40'
              )}
            >
              ×
            </button>
          </div>
        )
      })}

      {adding ? (
        <input
          ref={newSubRef}
          type="text"
          value={newSubName}
          onChange={(e) => setNewSubName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitAdd()
            if (e.key === 'Escape') { setAdding(false); setNewSubName('') }
          }}
          onBlur={commitAdd}
          placeholder="소분류명"
          maxLength={10}
          className="w-24 px-2 py-1.5 text-xs rounded-full border-2 border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none placeholder-gray-400"
        />
      ) : (
        <button
          type="button"
          onClick={startAdd}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs border border-dashed border-blue-300 dark:border-blue-700 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        >
          + 소분류 추가
        </button>
      )}
    </div>
  )
}
