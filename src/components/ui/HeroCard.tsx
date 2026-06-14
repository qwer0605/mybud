// src/components/ui/HeroCard.tsx
// 홈 대시보드 상단 다크 히어로 카드 — 이번 달 남은 예산.

interface HeroCardProps {
  remaining: number     // 남은 예산 (원)
  spent: number         // 사용 금액 (원)
  totalBudget: number   // 총 예산 (원)
  isOverBudget: boolean
  formatCurrency: (n: number) => string
}

export function HeroCard({ remaining, spent, totalBudget, isOverBudget, formatCurrency }: HeroCardProps) {
  const pct = totalBudget > 0 ? Math.min((spent / totalBudget) * 100, 100) : 0

  return (
    <div className="relative overflow-hidden rounded-[26px] p-5 bg-[#1C1A16] text-white">
      {/* 배경 그린 글로우 */}
      <div className="absolute -top-10 -right-8 w-36 h-36 rounded-full bg-primary-500 opacity-20 blur-md pointer-events-none" />

      {/* 뱃지 */}
      <div className="flex items-center justify-between relative">
        <p className="text-[13.5px] text-white/65 font-medium">이번 달 남은 예산</p>
        <span className="text-xs font-bold text-white bg-white/10 px-2.5 py-1 rounded-full whitespace-nowrap">
          {Math.max(0, Math.round(100 - pct))}% 남음
        </span>
      </div>

      {/* 금액 */}
      <p className="font-num text-[40px] font-bold mt-2 mb-4 relative tracking-tight leading-none">
        {formatCurrency(remaining)}
      </p>

      {/* 프로그레스 */}
      <div className="h-[9px] rounded-full bg-white/16 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isOverBudget ? 'bg-[#F0524B]' : 'bg-primary-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* 요약 */}
      <div className="flex justify-between mt-3 text-xs text-white/65 relative">
        <span>
          쓴 돈{' '}
          <span className="font-num text-white font-semibold">{formatCurrency(spent)}</span>
        </span>
        <span>
          예산{' '}
          <span className="font-num text-white font-semibold">{formatCurrency(totalBudget)}</span>
        </span>
      </div>
    </div>
  )
}
