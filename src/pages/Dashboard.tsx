import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
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
  const {
    getAvailableAssets,
    getTotalAssets,
    getTotalLiabilities,
    getNetWorth,
    dashboardAssetTypes,
  } = useAssetStore()
  const yearMonth = getCurrentYearMonth()
  const { totalIncome, totalExpense, balance } = useMonthlyStats(yearMonth)
  const { totalBudget, totalSpent, overallPercentage, isOverBudget, categoryProgress } =
    useBudgetProgress(yearMonth)

  const availableAssets  = getAvailableAssets()
  const totalAssets      = getTotalAssets()
  const totalLiabilities = getTotalLiabilities()
  const netWorth         = getNetWorth()
  const topCategories    = categoryProgress.filter((c) => c.budgeted > 0).slice(0, 4)

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

      <WidgetContainer
        pageId="dashboard"
        widgetMap={{
          /* ── 보유자산 ── */
          assets: (
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 rounded-2xl p-5 shadow-md">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💰</span>
                  <span className="text-sm font-semibold text-white/90">현재 보유자산</span>
                </div>
                <Link to="/assets" className="text-xs font-medium text-white/70 hover:text-white transition-colors">
                  관리 →
                </Link>
              </div>
              <p className="text-3xl font-bold text-white mt-2 mb-0.5">
                {formatCurrency(availableAssets)}
              </p>
              <p className="text-xs text-white/60 mb-4">
                {dashboardAssetTypes.length > 0
                  ? `${dashboardAssetTypes.join(' · ')} 기준`
                  : '자산 관리에서 유형을 선택하세요'}
              </p>
              <div className="grid grid-cols-3 gap-2">
                <AssetStatBox label="총 자산"  amount={totalAssets}      colorClass="text-white" />
                <AssetStatBox label="총 부채"  amount={totalLiabilities} colorClass="text-red-300"   prefix="-" />
                <AssetStatBox
                  label="순자산"
                  amount={Math.abs(netWorth)}
                  colorClass={netWorth >= 0 ? 'text-green-300' : 'text-red-300'}
                  prefix={netWorth < 0 ? '-' : ''}
                />
              </div>
            </div>
          ),

          /* ── 현금흐름 ── */
          cashflow: (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">이번달 현금흐름</h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">거래 기록 기준 · 수입 / 지출 합계</p>
                </div>
                <Link to="/transactions" className="text-xs font-medium text-blue-500 dark:text-blue-400 hover:text-blue-600 transition-colors">
                  거래 내역 →
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <FlowCard label="수입" amount={totalIncome}  colorClass="text-green-600 dark:text-green-400" bgClass="bg-green-50 dark:bg-green-900/20" icon="📈" />
                <FlowCard label="지출" amount={totalExpense} colorClass="text-red-600 dark:text-red-400"     bgClass="bg-red-50 dark:bg-red-900/20"     icon="📉" />
                <FlowCard
                  label="수지"
                  amount={balance}
                  colorClass={balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}
                  bgClass={balance >= 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-red-50 dark:bg-red-900/20'}
                  icon={balance >= 0 ? '🟢' : '🔴'}
                  signed
                />
              </div>
              {balance < 0 && availableAssets > 0 && (
                <div className="mt-3 p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-start gap-2">
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
              {topCategories.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {topCategories.map((item) => (
                    <div key={item.mainCategory} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">{item.mainCategory}</span>
                        <span className={clsx('font-medium',
                          item.isOverBudget ? 'text-red-500'
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
            </Card>
          ) : null,

          /* ── 최근 거래 ── */
          recent: (
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

// ─── 보유자산 통계 박스 ───
interface AssetStatBoxProps { label: string; amount: number; colorClass: string; prefix?: string }
function AssetStatBox({ label, amount, colorClass, prefix = '' }: AssetStatBoxProps) {
  return (
    <div className="bg-white/10 rounded-xl p-2.5 text-center">
      <p className="text-xs text-white/60 mb-1">{label}</p>
      <p className={clsx('text-sm font-bold leading-tight', colorClass)}>
        {prefix}{formatCurrency(amount)}
      </p>
    </div>
  )
}

// ─── 현금흐름 카드 ───
interface FlowCardProps { label: string; amount: number; colorClass: string; bgClass: string; icon: string; signed?: boolean }
function FlowCard({ label, amount, colorClass, bgClass, icon, signed = false }: FlowCardProps) {
  return (
    <div className={clsx('rounded-xl p-3', bgClass)}>
      <div className="text-lg mb-1">{icon}</div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
      <p className={clsx('text-sm font-bold leading-tight', colorClass)}>
        {signed && amount < 0 ? '-' : signed && amount > 0 ? '+' : ''}
        {formatCurrency(Math.abs(amount))}
      </p>
    </div>
  )
}
