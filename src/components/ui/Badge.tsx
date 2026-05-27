import clsx from 'clsx'
import type { TransactionType } from '@/types'

interface BadgeProps {
  type: TransactionType
  size?: 'sm' | 'md'
}

export function TypeBadge({ type, size = 'sm' }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        type === 'income'
          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
          : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
      )}
    >
      {type === 'income' ? '수입' : '지출'}
    </span>
  )
}

interface CategoryBadgeProps {
  icon: string
  label: string
  bgColor: string
  size?: 'sm' | 'md'
}

export function CategoryBadge({ icon, label, bgColor, size = 'sm' }: CategoryBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full font-medium text-gray-700 dark:text-gray-300',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        bgColor
      )}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  )
}
