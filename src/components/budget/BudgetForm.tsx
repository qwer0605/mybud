import { useState, useMemo } from 'react'
import type { BudgetFormData } from '@/types'
import { useCategoryStore } from '@/store/categoryStore'
import { formatAmountInput } from '@/utils/formatters'
import { Button } from '@/components/ui/Button'
import clsx from 'clsx'

interface BudgetFormProps {
  initial: BudgetFormData
  yearMonth: string
  onSubmit: (data: BudgetFormData) => void
  onCancel: () => void
}

export function BudgetForm({ initial, yearMonth, onSubmit, onCancel }: BudgetFormProps) {
  const { expenseTree, expenseMeta } = useCategoryStore()
  const expenseMainCats = Object.keys(expenseTree)

  const [totalBudget, setTotalBudget] = useState(initial.totalBudget)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 현재 카테고리 목록 기준으로 categoryBudgets 초기화
  // (저장된 것 우선, 없으면 빈 값으로 초기화)
  const [categoryBudgets, setCategoryBudgets] = useState(() => {
    const existingMap = new Map(initial.categoryBudgets.map((cb) => [cb.mainCategory, cb.amount]))
    return expenseMainCats.map((cat) => ({
      mainCategory: cat,
      amount: existingMap.get(cat) ?? '',
    }))
  })

  // categoryStore가 바뀌어도 새로 추가된 카테고리 반영
  const mergedBudgets = useMemo(() => {
    const existingMap = new Map(categoryBudgets.map((cb) => [cb.mainCategory, cb.amount]))
    return expenseMainCats.map((cat) => ({
      mainCategory: cat,
      amount: existingMap.get(cat) ?? '',
    }))
  }, [expenseMainCats, categoryBudgets])

  const [year, month] = yearMonth.split('-')

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!totalBudget || parseInt(totalBudget.replace(/[^0-9]/g, '')) <= 0) {
      errs.totalBudget = '전체 예산을 입력해주세요'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit({ totalBudget, categoryBudgets: mergedBudgets })
  }

  const updateCategoryAmount = (mainCategory: string, value: string) => {
    setCategoryBudgets((prev) =>
      prev.map((cb) =>
        cb.mainCategory === mainCategory
          ? { ...cb, amount: value.replace(/[^0-9]/g, '') }
          : cb
      )
    )
  }

  const totalCategoryBudget = mergedBudgets.reduce(
    (sum, cb) => sum + (parseInt(cb.amount.replace(/[^0-9]/g, '')) || 0),
    0
  )

  const total = parseInt(totalBudget.replace(/[^0-9]/g, '')) || 0
  const remaining = total - totalCategoryBudget

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center pb-2">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {year}년 {parseInt(month)}월 예산
        </span>
      </div>

      {/* 전체 예산 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          전체 예산 <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₩</span>
          <input
            type="text"
            inputMode="numeric"
            value={formatAmountInput(totalBudget)}
            onChange={(e) => setTotalBudget(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="0"
            className={clsx(
              'w-full pl-8 pr-4 py-3 rounded-xl border text-right text-lg font-semibold',
              'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              errors.totalBudget ? 'border-red-300' : 'border-gray-200 dark:border-gray-600'
            )}
          />
        </div>
        {errors.totalBudget && <p className="mt-1 text-xs text-red-500">{errors.totalBudget}</p>}
      </div>

      {/* 카테고리별 예산 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            대분류별 예산
          </label>
          {total > 0 && (
            <span
              className={clsx(
                'text-xs font-medium',
                remaining < 0
                  ? 'text-red-500'
                  : remaining === 0
                  ? 'text-green-500'
                  : 'text-gray-500 dark:text-gray-400'
              )}
            >
              {remaining < 0
                ? `전체 예산 초과 ₩${Math.abs(remaining).toLocaleString()}`
                : `미배정 ₩${remaining.toLocaleString()}`}
            </span>
          )}
        </div>
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {mergedBudgets.map(({ mainCategory, amount }) => {
            const m = expenseMeta[mainCategory]
            return (
              <div
                key={mainCategory}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50"
              >
                <span className="text-xl w-8 text-center">{m?.icon ?? '📦'}</span>
                <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {mainCategory}
                </span>
                <div className="relative w-36">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₩</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatAmountInput(amount)}
                    onChange={(e) =>
                      updateCategoryAmount(mainCategory, e.target.value.replace(/[^0-9]/g, ''))
                    }
                    placeholder="0"
                    className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" fullWidth onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" variant="primary" fullWidth>
          저장하기
        </Button>
      </div>
    </form>
  )
}
