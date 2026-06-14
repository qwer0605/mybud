import clsx from 'clsx'

interface ProgressBarProps {
  percentage: number
  showLabel?: boolean
  size?: 'sm' | 'md'
  variant?: 'default' | 'warning' | 'danger' | 'success'
}

export function ProgressBar({
  percentage,
  showLabel = false,
  size = 'md',
  variant,
}: ProgressBarProps) {
  const clamped = Math.min(Math.max(percentage, 0), 100)

  const autoVariant =
    variant ??
    (clamped >= 100 ? 'danger' : clamped >= 80 ? 'warning' : 'default')

  const barColor = {
    default: 'bg-primary-500',
    warning: 'bg-amber-500',
    danger: 'bg-[#F0524B]',
    success: 'bg-green-500',
  }[autoVariant]

  const trackColor = {
    default: 'bg-[#EDE9DF] dark:bg-gray-700',
    warning: 'bg-amber-100 dark:bg-amber-900/30',
    danger: 'bg-red-100 dark:bg-red-900/30',
    success: 'bg-green-100 dark:bg-green-900/30',
  }[autoVariant]

  const height = size === 'sm' ? 'h-1.5' : 'h-2.5'

  return (
    <div className="w-full">
      <div className={clsx('w-full rounded-full overflow-hidden', height, trackColor)}>
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-500',
            barColor,
            percentage > 100 && 'opacity-90'
          )}
          style={{ width: `${Math.min(clamped, 100)}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && (
        <span
          className={clsx(
            'text-xs font-medium mt-1 block',
            autoVariant === 'danger'
              ? 'text-red-600 dark:text-red-400'
              : autoVariant === 'warning'
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-gray-500 dark:text-gray-400'
          )}
        >
          {percentage > 100 ? `초과 ${percentage - 100}%` : `${percentage}%`}
        </span>
      )}
    </div>
  )
}
