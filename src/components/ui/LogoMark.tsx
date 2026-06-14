// src/components/ui/LogoMark.tsx
// 차곡 로고 — CSS로만 구현된 스택 막대 + 워드마크

interface LogoMarkProps {
  size?: number
  className?: string
}

export function LogoMark({ size = 28, className }: LogoMarkProps) {
  const accent = '#10C57C'
  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      {/* 스택 막대 마크 */}
      <div
        className="flex flex-col items-center"
        style={{ width: size, gap: size * 0.09 }}
      >
        <div style={{ width: size * 0.5,  height: size * 0.22, borderRadius: 9999, background: accent, opacity: 0.45 }} />
        <div style={{ width: size * 0.74, height: size * 0.22, borderRadius: 9999, background: accent, opacity: 0.72 }} />
        <div style={{ width: size,        height: size * 0.22, borderRadius: 9999, background: accent }} />
      </div>
      {/* 워드마크 */}
      <span
        className="font-bold text-gray-900 dark:text-white"
        style={{ fontSize: size * 0.86, letterSpacing: '-0.03em', whiteSpace: 'nowrap' }}
      >
        차곡
      </span>
    </div>
  )
}
