/**
 * 숫자를 한국식 원(₩) 형식으로 포맷
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * 숫자를 천 단위 구분자로 포맷 (₩ 없이)
 */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount)
}

/**
 * 날짜 문자열을 한국 형식으로 포맷 (YYYY년 MM월 DD일)
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

/**
 * 날짜 문자열을 짧은 형식으로 포맷 (MM/DD)
 */
export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/**
 * 날짜 문자열을 요일 포함 형식으로 포맷
 */
export function formatDateWithDay(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date)
}

/**
 * YYYY-MM 형식을 YYYY년 MM월로 포맷
 */
export function formatYearMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-')
  return `${year}년 ${parseInt(month)}월`
}

/**
 * 현재 날짜를 YYYY-MM-DD 형식으로 반환
 */
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * 현재 날짜를 YYYY-MM 형식으로 반환
 */
export function getCurrentYearMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * 날짜 문자열에서 YYYY-MM 추출
 */
export function getYearMonth(dateStr: string): string {
  return dateStr.substring(0, 7)
}

/**
 * 퍼센트 계산 (0 나누기 방지)
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

/**
 * 입력 문자열에서 숫자만 추출
 */
export function parseAmount(value: string): number {
  const cleaned = value.replace(/[^0-9]/g, '')
  return parseInt(cleaned) || 0
}

/**
 * 금액 입력 포맷 (천 단위 구분자 추가)
 */
export function formatAmountInput(value: string): string {
  const numbers = value.replace(/[^0-9]/g, '')
  if (!numbers) return ''
  return new Intl.NumberFormat('ko-KR').format(parseInt(numbers))
}
