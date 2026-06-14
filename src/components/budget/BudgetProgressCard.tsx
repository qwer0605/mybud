import type { BudgetProgressItem } from '@/hooks/useBudgetProgress'
import { EXPENSE_MAIN_CATEGORY_META } from '@/utils/constants'
import { formatCurrency } from '@/utils/formatters'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { CategoryCoin } from '@/components/ui/CategoryCoin'
import clsx from 'clsx'

interface BudgetProgressCardProps {
  item: BudgetProgressItem
}

export function BudgetProgressCard({ item }: BudgetProgressCardProps) {
  const meta = EXPENSE_MAIN_CATEGORY_META[item.mainCategory as keyof typeof EXPENSE_MAIN_CATEGORY_META]

  if (item.budgeted === 0) return null

  return (
    <div className="p-4 rounded-xl bg-cream-100 dark:bg-gray-700/50 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CategoryCoin color={meta?.color ?? '#94908A'} emoji={meta?.icon ?? '📦'} size={32} />
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
            {item.mainCategory}
          </span>
          {item.isOverBudget && (
            <span className="px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-medium">
              초과
            </span>
          )}
        </div>
        <div className="text-right">
          <span
            className={clsx(
              'font-num text-sm font-semibold',
              item.isOverBudget
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-800 dark:text-gray-200'
            )}
          >
            {formatCurrency(item.spent)}
          </span>
          <span className="font-num text-xs text-gray-400 dark:text-gray-500">
            {' '}/ {formatCurrency(item.budgeted)}
          </span>
        </div>
      </div>

      <ProgressBar percentage={item.percentage} size="md" />

      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{item.percentage}% 사용</span>
        <span className="font-num">
          {item.remaining >= 0
            ? `₩${item.remaining.toLocaleString()} 남음`
            : `₩${Math.abs(item.remaining).toLocaleString()} 초과`}
        </span>
      </div>
    </div>
  )
}
