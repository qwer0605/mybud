// src/components/ui/CategoryCoin.tsx
// 카테고리 아이콘을 tinted 배경 원형으로 표시하는 코인 컴포넌트.
// 기존 TransactionItem, BudgetProgressCard 등에서 카테고리 아이콘 대신 사용하세요.

interface CategoryCoinProps {
  /** 카테고리 컬러 (hex) */
  color: string
  /** 표시할 이모지 */
  emoji: string
  /** 코인 크기 (px). 기본 44 */
  size?: number
  /** 모서리 반경 (px). 기본 size*0.34 (= 부드러운 squircle) */
  radius?: number
  className?: string
}

export function CategoryCoin({ color, emoji, size = 44, radius, className }: CategoryCoinProps) {
  const r = radius ?? Math.round(size * 0.34)

  return (
    <div
      className={`flex items-center justify-center flex-shrink-0 ${className ?? ''}`}
      style={{
        width: size,
        height: size,
        borderRadius: r,
        background: `${color}1F`,   // 12% opacity tint
        fontSize: size * 0.46,
        lineHeight: 1,
      }}
    >
      {emoji}
    </div>
  )
}
