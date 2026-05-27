import { useState, useEffect } from 'react'
import type { Transaction, TransactionFormData, TransactionType } from '@/types'
import { useCategoryStore } from '@/store/categoryStore'
import { getTodayString, formatAmountInput } from '@/utils/formatters'
import { Button } from '@/components/ui/Button'
import clsx from 'clsx'

interface TransactionFormProps {
  initial?: Transaction
  onSubmit: (data: TransactionFormData) => void
  onCancel: () => void
}

export function TransactionForm({ initial, onSubmit, onCancel }: TransactionFormProps) {
  const { expenseTree, incomeTree, expenseMeta, incomeMeta } = useCategoryStore()

  const [type, setType] = useState<TransactionType>(initial?.type ?? 'expense')
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [mainCategory, setMainCategory] = useState<string>(initial?.mainCategory ?? '')
  const [subCategory, setSubCategory] = useState<string>(initial?.subCategory ?? '')
  const [memo, setMemo] = useState(initial?.memo ?? '')
  const [date, setDate] = useState(initial?.date ?? getTodayString())
  const [errors, setErrors] = useState<Record<string, string>>({})

  const categoryTree = type === 'expense' ? expenseTree : incomeTree
  const mainCategoryMeta = type === 'expense' ? expenseMeta : incomeMeta
  const mainCategories = Object.keys(categoryTree)

  // 첫 번째 카테고리 기본값
  const firstMain = mainCategories[0] ?? ''
  const firstSub = firstMain ? (categoryTree[firstMain]?.[0] ?? '') : ''

  // 유형 변경 시 카테고리 리셋
  useEffect(() => {
    if (!initial) {
      const tree = type === 'expense' ? expenseTree : incomeTree
      const cats = Object.keys(tree)
      const first = cats[0] ?? ''
      setMainCategory(first)
      setSubCategory(tree[first]?.[0] ?? '')
    }
  }, [type, initial, expenseTree, incomeTree])

  // 초기 대분류가 없으면 첫 번째로 설정
  useEffect(() => {
    if (!initial && !mainCategory && firstMain) {
      setMainCategory(firstMain)
      setSubCategory(firstSub)
    }
  }, [firstMain, firstSub, mainCategory, initial])

  // 대분류 변경 시 소분류 첫 번째로 리셋
  const handleMainCategoryChange = (main: string) => {
    setMainCategory(main)
    const subs = categoryTree[main] ?? []
    setSubCategory(subs[0] ?? '')
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!amount || parseInt(amount.replace(/[^0-9]/g, '')) <= 0) {
      errs.amount = '금액을 입력해주세요'
    }
    if (!date) {
      errs.date = '날짜를 선택해주세요'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit({ type, amount, mainCategory, subCategory, memo, date })
  }

  const currentSubCategories = categoryTree[mainCategory] ?? []

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 수입/지출 선택 */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl">
        {(['expense', 'income'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={clsx(
              'flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-150',
              type === t
                ? t === 'income'
                  ? 'bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {t === 'income' ? '수입' : '지출'}
          </button>
        ))}
      </div>

      {/* 금액 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          금액 <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₩</span>
          <input
            type="text"
            inputMode="numeric"
            value={formatAmountInput(amount)}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="0"
            className={clsx(
              'w-full pl-8 pr-4 py-3 rounded-xl border text-right text-lg font-semibold',
              'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow',
              errors.amount
                ? 'border-red-300 dark:border-red-600'
                : 'border-gray-200 dark:border-gray-600'
            )}
          />
        </div>
        {errors.amount && (
          <p className="mt-1 text-xs text-red-500">{errors.amount}</p>
        )}
      </div>

      {/* 대분류 선택 */}
      {mainCategories.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            대분류
          </label>
          <div className="grid grid-cols-4 gap-2">
            {mainCategories.map((cat) => {
              const m = mainCategoryMeta[cat]
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleMainCategoryChange(cat)}
                  className={clsx(
                    'flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-medium transition-all duration-150',
                    mainCategory === cat
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                  )}
                >
                  <span className="text-xl">{m?.icon ?? '📦'}</span>
                  <span className="leading-tight text-center break-keep">{cat}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 소분류 선택 */}
      {currentSubCategories.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            소분류
          </label>
          <div className="flex flex-wrap gap-2">
            {currentSubCategories.map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => setSubCategory(sub)}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border',
                  subCategory === sub
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400'
                )}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 날짜 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          날짜 <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={clsx(
            'w-full px-4 py-3 rounded-xl border',
            'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow',
            errors.date
              ? 'border-red-300 dark:border-red-600'
              : 'border-gray-200 dark:border-gray-600'
          )}
        />
        {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
      </div>

      {/* 메모 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          메모
        </label>
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="간단한 메모를 입력하세요"
          maxLength={100}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
        />
      </div>

      {/* 버튼 */}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" fullWidth onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" variant="primary" fullWidth>
          {initial ? '수정 완료' : '추가하기'}
        </Button>
      </div>
    </form>
  )
}
