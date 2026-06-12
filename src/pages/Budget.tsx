import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { BudgetForm } from '@/components/budget/BudgetForm'
import { BudgetProgressCard } from '@/components/budget/BudgetProgressCard'
import { WidgetContainer } from '@/components/widgets/WidgetContainer'
import { useBudgetStore, createDefaultBudgetFormData } from '@/store/budgetStore'
import { useBudgetProgress } from '@/hooks/useBudgetProgress'
import { useCategoryStore } from '@/store/categoryStore'
import { getCurrentYearMonth, formatCurrency, formatYearMonth } from '@/utils/formatters'
import clsx from 'clsx'

export function Budget() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedYearMonth, setSelectedYearMonth] = useState(getCurrentYearMonth())
  const { setBudget, deleteBudget, getBudgetByYearMonth } = useBudgetStore()
  const { expenseTree } = useCategoryStore()
  const expenseCategories = Object.keys(expenseTree)
  const existing = getBudgetByYearMonth(selectedYearMonth)
  const {
    totalBudget,
    totalSpent,
    totalRemaining,
    overallPercentage,
    isOverBudget,
    categoryProgress,
  } = useBudgetProgress(selectedYearMonth)

  const activeCategories = categoryProgress.filter((c) => c.budgeted > 0)

  // 월 이동
  const changeMonth = (delta: number) => {
    const [year, month] = selectedYearMonth.split('-').map(Number)
    const d = new Date(year, month - 1 + delta, 1)
    setSelectedYearMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    )
  }

  const isCurrentMonth = selectedYearMonth === getCurrentYearMonth()

  return (
    <div className="space-y-5">
      <Header
        title="예산 관리"
        action={
          <Button size="sm" onClick={() => setIsFormOpen(true)}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={existing ? 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' : 'M12 4v16m8-8H4'}
              />
            </svg>
            {existing ? '예산 수정' : '예산 설정'}
          </Button>
        }
      />

      {/* 월 선택 */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-3xl p-4 border border-gray-100 dark:border-gray-700">
        <button
          onClick={() => changeMonth(-1)}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-base font-semibold text-gray-900 dark:text-white">
          {formatYearMonth(selectedYearMonth)}
        </span>
        <button
          onClick={() => changeMonth(1)}
          disabled={isCurrentMonth}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400 disabled:opacity-30"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {totalBudget === 0 ? (
        /* 예산 미설정 상태 */
        <div className="bg-violet-50 dark:bg-violet-900/20 rounded-[28px] p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-violet-200 dark:bg-violet-800/40 flex items-center justify-center text-3xl mb-4">
            🎯
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">예산을 설정해보세요</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            월 예산을 설정하면 지출을 효율적으로 관리할 수 있어요
          </p>
          <Button onClick={() => setIsFormOpen(true)}>예산 설정하기</Button>
        </div>
      ) : (
        <>
          <WidgetContainer
            pageId="budget"
            widgetMap={{
              /* 전체 예산 요약 */
              summary: (
                <Card>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">전체 예산 현황</h3>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {formatCurrency(totalSpent)}
                        <span className="text-sm font-normal text-gray-400 dark:text-gray-500">
                          {' '}/ {formatCurrency(totalBudget)}
                        </span>
                      </p>
                    </div>
                    {isOverBudget && (
                      <span className="px-3 py-1 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full text-sm font-medium">
                        예산 초과
                      </span>
                    )}
                  </div>
                  <ProgressBar percentage={overallPercentage} />
                  <div className="flex justify-between mt-2 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">{overallPercentage}% 사용</span>
                    <span className={clsx('font-medium', isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300')}>
                      {isOverBudget ? `₩${Math.abs(totalRemaining).toLocaleString()} 초과` : `₩${totalRemaining.toLocaleString()} 남음`}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">설정 예산</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{formatCurrency(totalBudget)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">실제 지출</p>
                      <p className="text-sm font-semibold text-red-600 dark:text-red-400 mt-0.5">{formatCurrency(totalSpent)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{isOverBudget ? '초과 금액' : '남은 예산'}</p>
                      <p className={clsx('text-sm font-semibold mt-0.5', isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400')}>
                        {formatCurrency(Math.abs(totalRemaining))}
                      </p>
                    </div>
                  </div>
                </Card>
              ),

              /* 카테고리별 예산 */
              categories: (
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">카테고리별 예산</h3>
                    {activeCategories.some((c) => c.isOverBudget) && (
                      <span className="text-xs text-red-500 font-medium">
                        {activeCategories.filter((c) => c.isOverBudget).length}개 카테고리 초과
                      </span>
                    )}
                  </div>
                  {activeCategories.length === 0 ? (
                    <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
                      카테고리별 예산이 설정되지 않았습니다
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {activeCategories.map((item) => (
                        <BudgetProgressCard key={item.mainCategory} item={item} />
                      ))}
                    </div>
                  )}
                </Card>
              ),
            }}
          />

          <div className="text-center">
            <button
              onClick={() => { if (confirm('이번 달 예산을 삭제할까요?')) deleteBudget(selectedYearMonth) }}
              className="text-sm text-red-500 dark:text-red-400 hover:underline"
            >
              예산 삭제
            </button>
          </div>
        </>
      )}

      {/* 예산 설정 모달 */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="예산 설정" size="lg">
        <BudgetForm
          initial={createDefaultBudgetFormData(expenseCategories, existing)}
          yearMonth={selectedYearMonth}
          onSubmit={(data) => {
            setBudget(selectedYearMonth, data)
            setIsFormOpen(false)
          }}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>
    </div>
  )
}
