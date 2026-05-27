import { useMemo } from 'react'
import { useTransactionStore } from '@/store/transactionStore'
import { useBudgetStore } from '@/store/budgetStore'
import type { ExpenseMainCategory } from '@/types'
import { EXPENSE_MAIN_CATEGORIES } from '@/utils/constants'
import { getCurrentYearMonth, getYearMonth } from '@/utils/formatters'

export interface BudgetProgressItem {
  mainCategory: ExpenseMainCategory
  budgeted: number
  spent: number
  remaining: number
  percentage: number
  isOverBudget: boolean
}

export interface BudgetSummary {
  totalBudget: number
  totalSpent: number
  totalRemaining: number
  overallPercentage: number
  isOverBudget: boolean
  categoryProgress: BudgetProgressItem[]
}

export function useBudgetProgress(yearMonth?: string): BudgetSummary {
  const ym = yearMonth ?? getCurrentYearMonth()
  const { transactions } = useTransactionStore()
  const { getBudgetByYearMonth } = useBudgetStore()

  return useMemo(() => {
    const budget = getBudgetByYearMonth(ym)
    const monthExpenses = transactions.filter(
      (t) => t.type === 'expense' && getYearMonth(t.date) === ym
    )

    const totalSpent = monthExpenses.reduce((sum, t) => sum + t.amount, 0)
    const totalBudget = budget?.totalBudget ?? 0
    const totalRemaining = totalBudget - totalSpent
    const overallPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

    const categoryProgress: BudgetProgressItem[] = EXPENSE_MAIN_CATEGORIES.map((mainCategory) => {
      const budgeted =
        budget?.categoryBudgets.find((cb) => cb.mainCategory === mainCategory)?.amount ?? 0
      const spent = monthExpenses
        .filter((t) => t.mainCategory === mainCategory)
        .reduce((sum, t) => sum + t.amount, 0)
      const remaining = budgeted - spent
      const percentage = budgeted > 0 ? Math.round((spent / budgeted) * 100) : 0

      return {
        mainCategory,
        budgeted,
        spent,
        remaining,
        percentage,
        isOverBudget: budgeted > 0 && spent > budgeted,
      }
    })

    return {
      totalBudget,
      totalSpent,
      totalRemaining,
      overallPercentage,
      isOverBudget: totalBudget > 0 && totalSpent > totalBudget,
      categoryProgress,
    }
  }, [transactions, getBudgetByYearMonth, ym])
}
