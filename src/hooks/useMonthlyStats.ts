import { useMemo } from 'react'
import { useTransactionStore } from '@/store/transactionStore'
import type { MonthlyStats, CategoryStats } from '@/types'
import { EXPENSE_MAIN_CATEGORY_META, CHART_COLORS } from '@/utils/constants'
import { getYearMonth } from '@/utils/formatters'

export function useMonthlyStats(yearMonth: string) {
  const { transactions } = useTransactionStore()

  return useMemo(() => {
    const monthTransactions = transactions.filter(
      (t) => getYearMonth(t.date) === yearMonth
    )

    const totalIncome = monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpense = monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    const balance = totalIncome - totalExpense

    return { totalIncome, totalExpense, balance, transactions: monthTransactions }
  }, [transactions, yearMonth])
}

export function useCategoryStats(yearMonth: string) {
  const { transactions } = useTransactionStore()

  return useMemo(() => {
    const expenseTransactions = transactions.filter(
      (t) => getYearMonth(t.date) === yearMonth && t.type === 'expense'
    )

    const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0)

    // 대분류 기준으로 집계
    const categoryMap = new Map<string, number>()
    expenseTransactions.forEach((t) => {
      const current = categoryMap.get(t.mainCategory) ?? 0
      categoryMap.set(t.mainCategory, current + t.amount)
    })

    const stats: CategoryStats[] = Array.from(categoryMap.entries())
      .map(([mainCategory, amount], index) => ({
        mainCategory,
        amount,
        percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
        color:
          EXPENSE_MAIN_CATEGORY_META[mainCategory as keyof typeof EXPENSE_MAIN_CATEGORY_META]?.color ??
          CHART_COLORS[index % CHART_COLORS.length],
      }))
      .sort((a, b) => b.amount - a.amount)

    return stats
  }, [transactions, yearMonth])
}

export function useMultiMonthStats(monthCount: number = 6): MonthlyStats[] {
  const { transactions } = useTransactionStore()

  return useMemo(() => {
    const now = new Date()
    const stats: MonthlyStats[] = []

    for (let i = monthCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const yearMonth = `${year}-${month}`

      const monthTransactions = transactions.filter(
        (t) => getYearMonth(t.date) === yearMonth
      )

      const totalIncome = monthTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)

      const totalExpense = monthTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)

      stats.push({
        yearMonth,
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
      })
    }

    return stats
  }, [transactions, monthCount])
}
