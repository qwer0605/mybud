import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader } from '@/components/ui/Card'
import { MonthlyBarChart } from '@/components/statistics/MonthlyBarChart'
import { CategoryPieChart } from '@/components/statistics/CategoryPieChart'
import { BalanceLineChart } from '@/components/statistics/BalanceLineChart'
import { WidgetContainer } from '@/components/widgets/WidgetContainer'
import { useMonthlyStats, useCategoryStats, useMultiMonthStats } from '@/hooks/useMonthlyStats'
import { getCurrentYearMonth, formatCurrency, formatYearMonth } from '@/utils/formatters'
import clsx from 'clsx'

export function Statistics() {
  const [selectedYearMonth, setSelectedYearMonth] = useState(getCurrentYearMonth())
  const { totalIncome, totalExpense, balance } = useMonthlyStats(selectedYearMonth)
  const categoryStats = useCategoryStats(selectedYearMonth)
  const multiMonthStats = useMultiMonthStats(6)

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
      <Header title="통계" />

      {/* 월 선택 */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-3xl p-4 border border-cream-200 dark:border-gray-800">
        <button
          onClick={() => changeMonth(-1)}
          className="p-2 rounded-xl hover:bg-cream-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
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
          className="p-2 rounded-xl hover:bg-cream-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400 disabled:opacity-30"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <WidgetContainer
        pageId="statistics"
        widgetMap={{
          'stats-summary': (
            <div className="grid grid-cols-3 gap-3">
              <StatSummaryCard label="총 수입" value={formatCurrency(totalIncome)}  icon="📈" color="text-green-600 dark:text-green-400" bgColor="bg-green-50 dark:bg-green-900/20" />
              <StatSummaryCard label="총 지출" value={formatCurrency(totalExpense)} icon="📉" color="text-red-600 dark:text-red-400"     bgColor="bg-red-50 dark:bg-red-900/20" />
              <StatSummaryCard
                label="잔액"
                value={formatCurrency(balance)}
                icon="💰"
                color={balance >= 0 ? 'text-primary-600 dark:text-primary-400' : 'text-red-600 dark:text-red-400'}
                bgColor="bg-primary-50 dark:bg-primary-900/20"
              />
            </div>
          ),
          'pie-chart': (
            <Card>
              <CardHeader title="카테고리별 지출" subtitle={formatYearMonth(selectedYearMonth)} />
              <CategoryPieChart data={categoryStats} />
            </Card>
          ),
          'bar-chart': (
            <Card>
              <CardHeader title="월별 수입/지출" subtitle="최근 6개월" />
              <MonthlyBarChart data={multiMonthStats} />
            </Card>
          ),
          'line-chart': (
            <Card>
              <CardHeader title="월별 잔액 추이" subtitle="최근 6개월" />
              <BalanceLineChart data={multiMonthStats} />
            </Card>
          ),
          'monthly-table': (
            <Card>
              <CardHeader title="월별 요약" />
              <div className="space-y-3">
                {[...multiMonthStats].reverse().map((stat) => {
                  const isCurrent = stat.yearMonth === getCurrentYearMonth()
                  return (
                    <div
                      key={stat.yearMonth}
                      className={clsx('flex items-center justify-between p-3 rounded-xl',
                        isCurrent ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-gray-50 dark:bg-gray-700/30'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {formatYearMonth(stat.yearMonth)}
                        </span>
                        {isCurrent && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 font-medium">
                            이번달
                          </span>
                        )}
                      </div>
                      <div className="flex gap-4 text-xs font-num">
                        <span className="text-green-600 dark:text-green-400 font-medium">+{formatCurrency(stat.totalIncome)}</span>
                        <span className="text-red-600 dark:text-red-400 font-medium">-{formatCurrency(stat.totalExpense)}</span>
                        <span className={clsx('font-semibold w-20 text-right',
                          stat.balance >= 0 ? 'text-gray-800 dark:text-gray-200' : 'text-red-600 dark:text-red-400'
                        )}>
                          {formatCurrency(stat.balance)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          ),
        }}
      />
    </div>
  )
}

interface StatSummaryCardProps {
  label: string
  value: string
  icon: string
  color: string
  bgColor: string
}

function StatSummaryCard({ label, value, icon, color, bgColor }: StatSummaryCardProps) {
  return (
    <div className={clsx('rounded-3xl p-3 sm:p-4', bgColor)}>
      <div className="text-xl sm:text-2xl mb-1">{icon}</div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
      <p className={clsx('font-num text-xs sm:text-sm font-bold leading-tight', color)}>{value}</p>
    </div>
  )
}
