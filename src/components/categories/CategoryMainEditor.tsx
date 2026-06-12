import { useState } from 'react'
import { useCategoryStore } from '@/store/categoryStore'
import { Button } from '@/components/ui/Button'
import { ICON_OPTIONS, COLOR_OPTIONS } from '@/utils/categoryOptions'
import clsx from 'clsx'

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

interface CategoryMainEditorProps {
  type: 'expense' | 'income'
  /** null이면 추가 모드, 문자열이면 해당 대분류 수정 모드 */
  editingMain: string | null
  onSaved: (finalName: string) => void
  onCancel: () => void
  onDeleted?: () => void
}

export function CategoryMainEditor({ type, editingMain, onSaved, onCancel, onDeleted }: CategoryMainEditorProps) {
  const { expenseMeta, incomeMeta, addMainCategory, updateMainCategory, deleteMainCategory } = useCategoryStore()
  const meta = type === 'expense' ? expenseMeta : incomeMeta

  const [form, setForm] = useState<MainFormState>(() => {
    const m = editingMain ? meta[editingMain] : undefined
    return m
      ? { name: editingMain as string, icon: m.icon, color: m.color, bgColor: m.bgColor }
      : DEFAULT_FORM
  })
  const [iconSearch, setIconSearch] = useState('')

  const filteredIcons = iconSearch
    ? ICON_OPTIONS.filter((icon) => icon.includes(iconSearch))
    : ICON_OPTIONS

  function handleSubmit() {
    const trimmed = form.name.trim()
    if (!trimmed) return
    const metaPayload = { icon: form.icon, color: form.color, bgColor: form.bgColor }
    if (editingMain === null) {
      addMainCategory(type, trimmed, metaPayload)
    } else {
      updateMainCategory(type, editingMain, trimmed, metaPayload)
    }
    onSaved(trimmed)
  }

  function handleDelete() {
    if (!editingMain) return
    if (!confirm(`"${editingMain}" 대분류와 소분류 전체를 삭제할까요?`)) return
    deleteMainCategory(type, editingMain)
    onDeleted?.()
  }

  return (
    <div className="space-y-5">
      {/* 미리보기 */}
      <div className="flex items-center justify-center">
        <div className={clsx('w-16 h-16 rounded-2xl flex items-center justify-center text-3xl', form.bgColor)}>
          {form.icon}
        </div>
      </div>

      {/* 이름 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          대분류 이름 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="예: 반려동물"
          maxLength={10}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
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
            className="w-20 text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-400"
          />
        </div>
        <div className="grid grid-cols-10 gap-1 max-h-36 overflow-y-auto p-1 rounded-xl bg-gray-50 dark:bg-gray-700/50">
          {filteredIcons.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => setForm((p) => ({ ...p, icon }))}
              className={clsx(
                'w-8 h-8 flex items-center justify-center rounded-lg text-lg transition-all',
                form.icon === icon
                  ? 'ring-2 ring-primary-400 bg-primary-50 dark:bg-primary-900/40'
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
              onClick={() => setForm((p) => ({ ...p, color: opt.color, bgColor: opt.bgColor }))}
              className={clsx(
                'w-8 h-8 rounded-full border-2 transition-all',
                form.color === opt.color
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
        <Button type="button" variant="secondary" fullWidth onClick={onCancel}>
          취소
        </Button>
        <Button
          type="button"
          variant="primary"
          fullWidth
          onClick={handleSubmit}
          disabled={!form.name.trim()}
        >
          {editingMain === null ? '추가하기' : '수정 완료'}
        </Button>
      </div>

      {editingMain !== null && (
        <button
          type="button"
          onClick={handleDelete}
          className="w-full text-center text-xs text-red-500 hover:text-red-600 transition-colors"
        >
          이 대분류 삭제
        </button>
      )}
    </div>
  )
}
