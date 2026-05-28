import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { TransactionList } from '@/components/transactions/TransactionList'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useTransactionStore } from '@/store/transactionStore'
import { useAssetStore } from '@/store/assetStore'
import { useMonthlyStats } from '@/hooks/useMonthlyStats'
import { useBudgetProgress } from '@/hooks/useBudgetProgress'
import { getCurrentYearMonth, formatCurrency, formatYearMonth } from '@/utils/formatters'
import clsx from 'clsx'

export function Dashboard() {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const { addTransaction } = useTransactionStore()
  const { getAvailableAssets, dashboardAssetTypes } = useAssetStore()
  const yearMonth = getCurrentYearMonth()
  const { totalIncome, totalExpense, balance } = useMonthlyStats(yearMonth)
  const { totalBudget, totalSpent, overallPercentage, isOverBudget, categoryProgress } =
    useBudgetProgress(yearMonth)
  const availableAssets = getAvailableAssets()

  const topCategories = categoryProgress
    .filter((c) => c.budgeted > 0)
    .slice(0, 4)

  return (
    <div className="space-y-5">
      <Header
        title="대시보드"
        subtitle={formatYearMonth(yearMonth)}
        action={
          <Button size="sm" onClick={() => setIsAddOpen(true)}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            추가
          </Button>
        }
      />

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard
          label="총 수입"
          amount={totalIncome}
          color="text-green-600 dark:text-green-400"
          bgColor="bg-green-50 dark:bg-green-900/20"
          icon="📈"
        />
        <SummaryCard
          label="총 지출"
          amount={totalExpense}
          color="text-red-600 dark:text-red-400"
          bgColor="bg-red-50 dark:bg-red-900/20"
          icon="📉"
        />
        <SummaryCard
          label="잔액"
          amount={balance}
          color={balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}
          bgColor="bg-blue-50 dark:bg-blue-900/20"
          icon="💳"
        />
      </div>

      {/* 가용자산 카드 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">💰</span>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">가용자산</span>
          </div>
          <Link
            to="/assets"
            className="text-xs font-medium text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
          >
            관리 →
          </Link>
        </div>
        <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-2">
          {formatCurrency(availableAssets)}
        </p>
        {dashboardAssetTypes.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {dashboardAssetTypes.map((type) => (
              <span
                key={type}
                className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full"
              >
                {type}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            자산 관리 탭에서 유형을 선택해주세요
          </p>
        )}
      </div>

      {/* 예산 현황 */}
      {totalBudget > 0 && (
        <Card>
          <CardHeader
            title="이번 달 예산"
            subtitle={`${formatCurrency(totalSpent)} / ${formatCurrency(totalBudget)}`}
            action={
              <Link to="/budget">
                <Button variant="ghost" size="sm">더보기</Button>
              </Link>
            }
          />
          <div className="space-y-2">
            <ProgressBar percentage={overallPercentage} />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{overallPercentage}% 사용</span>
              {isOverBudget ? (
                <span className="text-red-500 font-medium">예산 초과!</span>
              ) : (
                <span>{formatCurrency(totalBudget - totalSpent)} 남음</span>
              )}
            </div>
          </div>

          {/* 카테고리별 미니 게이지 */}
          {topCategories.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {topCategories.map((item) => (
                <div key={item.mainCategory} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">{item.mainCategory}</span>
                    <span
                      className={clsx(
                        'font-medium',
                        item.isOverBudget
                          ? 'text-red-500'
                          : item.percentage >= 80
                          ? 'text-amber-500'
                          : 'text-gray-600 dark:text-gray-400'
                      )}
                    >
                      {item.percentage}%
                    </span>
                  </div>
                  <ProgressBar percentage={item.percentage} size="sm" />
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* 최근 거래 내역 */}
      <Card padding="none">
        <div className="p-5 pb-0">
          <CardHeader
            title="최근 거래 내역"
            action={
              <Link to="/transactions">
                <Button variant="ghost" size="sm">전체보기</Button>
              </Link>
            }
          />
        </div>
        <div className="px-2 pb-2">
          <TransactionList yearMonth={yearMonth} limit={3} />
        </div>
      </Card>

      {/* 거래 추가 모달 */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="거래 추가">
        <TransactionForm
          onSubmit={(data) => {
            addTransaction(data)
            setIsAddOpen(false)
          }}
          onCancel={() => setIsAddOpen(false)}
        />
      </Modal>
    </div>
  )
}

interface SummaryCardProps {
  label: string
  amount: number
  color: string
  bgColor: string
  icon: string
}

function SummaryCard({ label, amount, color, bgColor, icon }: SummaryCardProps) {
  return (
    <div className={clsx('rounded-2xl p-3 sm:p-4', bgColor)}>
      <div className="text-xl sm:text-2xl mb-1">{icon}</div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
      <p className={clsx('text-sm sm:text-base font-bold leading-tight', color)}>
        {formatCurrency(amount)}
      </p>
    </div>
  )
}
