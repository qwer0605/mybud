// src/utils/designTokens.ts
// 차곡 디자인 토큰 — 컴포넌트에서 import해서 사용하세요.

export const tokens = {
  // ── 컬러 ─────────────────────────────────────────────────
  colors: {
    bg:         '#F4F1E9',   // 앱 배경 크림
    surface:    '#FFFFFF',   // 카드 배경
    surface2:   '#FBF9F4',   // 2차 배경
    ink:        '#1C1A16',   // 메인 텍스트
    ink2:       '#54504A',   // 서브 텍스트
    muted:      '#94908A',   // 플레이스홀더/힌트
    line:       '#EAE6DC',   // 구분선
    accent:     '#10C57C',   // 차곡 그린
    accentSoft: '#E2F6EC',   // 그린 tint bg
    accentInk:  '#0A7A4D',   // 그린 위 텍스트
    danger:     '#F0524B',   // 초과/오류
  },
  // ── 타이포그래피 ──────────────────────────────────────────
  fonts: {
    kr:  "'IBM Plex Sans KR', Pretendard, system-ui, sans-serif",
    num: "'Space Grotesk', system-ui, sans-serif",
  },
  // ── 스페이싱 & 레이아웃 ───────────────────────────────────
  radius: {
    sm:   12,
    md:   16,
    lg:   20,
    xl:   24,
    card: 24,   // 카드 기본 (기존 rounded-3xl = 24px와 동일)
    hero: 26,   // 히어로 카드
    pill: 9999,
  },
  // ── 섀도 ──────────────────────────────────────────────────
  shadows: {
    card:   '0 1px 2px rgba(28,26,22,0.04), 0 8px 24px rgba(28,26,22,0.06)',
    cardSm: '0 1px 2px rgba(28,26,22,0.05), 0 4px 12px rgba(28,26,22,0.05)',
    green:  '0 8px 20px rgba(16,197,124,0.35)',
  },
} as const

// ── 카테고리 컬러 매핑 ────────────────────────────────────────
// categoryOptions.ts의 이모지/컬러와 연동하세요.
export const CATEGORY_COLORS: Record<string, { color: string; emoji: string }> = {
  '식비':     { color: '#FF6B5E', emoji: '🍜' },
  '카페·간식': { color: '#F5A623', emoji: '☕' },
  '교통':     { color: '#4C8DFF', emoji: '🚌' },
  '쇼핑':     { color: '#9B7BFF', emoji: '🛍️' },
  '생활':     { color: '#16C2A3', emoji: '🧺' },
  '문화·여가': { color: '#FF7AC6', emoji: '🎬' },
  '건강':     { color: '#3DCB7F', emoji: '💊' },
  '고정지출':  { color: '#8C7B6B', emoji: '🔁' },
  '수입':     { color: '#10C57C', emoji: '💰' },
}

/** 카테고리명으로 컬러 조회. 없으면 기본 컬러 반환 */
export function getCategoryColor(name: string): string {
  return CATEGORY_COLORS[name]?.color ?? '#94908A'
}

/** 카테고리 코인 tinted bg style (카드 내 아이콘 배경) */
export function getCategoryBgStyle(name: string) {
  const color = getCategoryColor(name)
  return { background: `${color}1F` }  // 12% opacity
}

/** 금액을 ₩ 포맷으로 반환 (기존 formatCurrency와 별도) */
export function wonFormat(n: number): string {
  return '₩' + Math.round(Math.abs(n)).toLocaleString('ko-KR')
}
