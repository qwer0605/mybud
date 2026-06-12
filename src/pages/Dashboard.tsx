import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Modal } from '@/components/ui/Modal'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { TransactionList } from '@/components/transactions/TransactionList'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { WidgetContainer } from '@/components/widgets/WidgetContainer'
import { useTransactionStore } from '@/store/transactionStore'
import { useAssetStore } from '@/store/assetStore'
import { useMonthlyStats } from '@/hooks/useMonthlyStats'
import { useBudgetProgress } from '@/hooks/useBudgetProgress'
import { getCurrentYearMonth, formatCurrency, formatYearMonth } from '@/utils/formatters'
import clsx from 'clsx'

export function Dashboard() {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const { addTransaction } = useTransactionStore()
  const { getAvailableAssets, getNetWorth, dashboardAssetTypes } = useAssetStore()
  const yearMonth = getCurrentYearMonth()
  const { totalIncome, totalExpense, balance } = useMonthlyStats(yearMonth)
  const { totalBudget, totalSpent, overallPercentage, isOverBudget, categoryProgress } =
    useBudgetProgress(yearMonth)

  const availableAssets = getAvailableAssets()
  const netWorth = getNetWorth()
  const topCategories = categoryProgress.filter((c) => c.budgeted > 0).slice(0, 4)

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400 dark:text-gray-500">{formatYearMonth(yearMonth)}</p>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">오늘도 좋은 하루예요 👋</h1>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="w-11 h-11 rounded-full bg-primary-300 hover:bg-primary-400 text-gray-900 flex items-center justify-center text-xl font-bold shadow-sm transition-colors"
          aria-label="거래 추가"
        >
          +
        </button>
      </div>

      <WidgetContainer
        pageId="dashboard"
        widgetMap={{
          /* ── 보유자산 ── */
          assets: (
            <Link to="/assets" className="flex items-center gap-4 bg-primary-50 dark:bg-primary-900/20 rounded-[28px] p-5">
              <div className="w-14 h-14 rounded-full bg-primary-200 dark:bg-primary-800/40 flex items-center justify-center text-3xl flex-shrink-0">
                🐷
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-primary-500">총 보유자산</p>
                  <span className="text-xs font-medium text-primary-400">관리 →</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {formatCurrency(availableAssets)}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {dashboardAssetTypes.length > 0
                    ? `${dashboardAssetTypes.join(' · ')} 기준 · 순자산 ${netWorth < 0 ? '-' : ''}${formatCurrency(Math.abs(netWorth))}`
                    : '자산 관리에서 유형을 선택하세요'}
                </p>
              </div>
            </Link>
          ),

          /* ── 현금흐름 ── */
          cashflow: (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-sky-50 dark:bg-sky-900/20 rounded-[24px] p-3.5 text-center">
                  <div className="w-9 h-9 mx-auto rounded-full bg-sky-200 dark:bg-sky-800/40 flex items-center justify-center text-lg mb-1.5">💸</div>
                  <p className="text-xs text-sky-500 font-semibold mb-0.5">수입</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(totalIncome)}</p>
                </div>
                <div className="bg-rose-50 dark:bg-rose-900/20 rounded-[24px] p-3.5 text-center">
                  <div className="w-9 h-9 mx-auto rounded-full bg-rose-200 dark:bg-rose-800/40 flex items-center justify-center text-lg mb-1.5">🛍️</div>
                  <p className="text-xs text-rose-500 font-semibold mb-0.5">지출</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(totalExpense)}</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-[24px] p-3.5 text-center">
                  <div className="w-9 h-9 mx-auto rounded-full bg-emerald-200 dark:bg-emerald-800/40 flex items-center justify-center text-lg mb-1.5">🌱</div>
                  <p className="text-xs text-emerald-500 font-semibold mb-0.5">수지</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {balance < 0 ? '-' : balance > 0 ? '+' : ''}
                    {formatCurrency(Math.abs(balance))}
                  </p>
                </div>
              </div>
              {balance < 0 && availableAssets > 0 && (
                <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-start gap-2">
                  <span className="text-sm mt-0.5">💡</span>
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                    이번달 지출이 수입보다 많지만, 보유자산은{' '}
                    <span className="font-semibold">{formatCurrency(availableAssets)}</span>입니다.
                  </p>
                </div>
              )}
            </div>
          ),

          /* ── 예산 현황 ── */
          budget: totalBudget > 0 ? (
            <Link to="/budget" className="block bg-violet-50 dark:bg-violet-900/20 rounded-[28px] p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-violet-200 dark:bg-violet-800/40 flex items-center justify-center text-xl flex-shrink-0">
                  🎯
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-violet-500">이번 달 예산</p>
                  {isOverBudget ? (
                    <p className="text-xs font-bold text-rose-500">예산을 초과했어요!</p>
                  ) : (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {formatCurrency(totalBudget - totalSpent)} 남았어요
                    </p>
                  )}
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">{overallPercentage}%</span>
              </div>
              <ProgressBar percentage={overallPercentage} />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
              </p>
              {topCategories.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {topCategories.map((item) => (
                    <div key={item.mainCategory} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">{item.mainCategory}</span>
                        <span className={clsx('font-medium',
                          item.isOverBudget ? 'text-rose-500'
                          : item.percentage >= 80 ? 'text-amber-500'
                          : 'text-gray-600 dark:text-gray-400'
                        )}>
                          {item.percentage}%
                        </span>
                      </div>
                      <ProgressBar percentage={item.percentage} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </Link>
          ) : null,

          /* ── 최근 거래 ── */
          recent: (
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🧾</span>
                  <p className="text-base font-bold text-gray-900 dark:text-white">최근 거래</p>
                </div>
                <Link to="/transactions" className="text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors">
                  전체보기
                </Link>
              </div>
              <TransactionList yearMonth={yearMonth} limit={3} />
            </div>
          ),
        }}
      />

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="거래 추가">
        <TransactionForm
          onSubmit={(data) => { addTransaction(data); setIsAddOpen(false) }}
          onCancel={() => setIsAddOpen(false)}
        />
      </Modal>
    </div>
  )
}
