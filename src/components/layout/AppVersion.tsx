import clsx from 'clsx'

export function AppVersion({ className }: { className?: string }) {
  const formatted = new Date(__BUILD_TIME__).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <p className={clsx('text-[11px] text-gray-300 dark:text-gray-600 text-center', className)}>
      v{__APP_VERSION__} · {formatted} 빌드
    </p>
  )
}
