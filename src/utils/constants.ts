import type { CategoryMeta, ExpenseMainCategory, IncomeMainCategory } from '@/types'

// ───── 지출 계층 구조 ─────
export const EXPENSE_CATEGORY_TREE: Record<ExpenseMainCategory, string[]> = {
  식비: ['외식', '카페/음료', '마트/편의점', '배달'],
  교통: ['대중교통', '택시', '주유/주차'],
  주거: ['월세/관리비', '공과금', '인테리어'],
  쇼핑: ['의류/잡화', '생활용품', '전자기기'],
  '의료/건강': ['병원/치과', '약국', '헬스/운동'],
  '문화/여가': ['영화/공연', '여행', '구독서비스'],
  교육: ['학원/과외', '서적', '온라인강의'],
  기타: ['기타'],
}

// ───── 수입 계층 구조 ─────
export const INCOME_CATEGORY_TREE: Record<IncomeMainCategory, string[]> = {
  근로소득: ['급여', '상여금/성과급', '퇴직금'],
  '사업/부업소득': ['프리랜서', '부업', '사업수익'],
  금융소득: ['이자소득', '배당금', '주식매도'],
  기타소득: ['용돈/선물', '환급금', '기타'],
}

// 대분류 목록
export const EXPENSE_MAIN_CATEGORIES = Object.keys(EXPENSE_CATEGORY_TREE) as ExpenseMainCategory[]
export const INCOME_MAIN_CATEGORIES = Object.keys(INCOME_CATEGORY_TREE) as IncomeMainCategory[]

// ───── 지출 대분류 메타 ─────
export const EXPENSE_MAIN_CATEGORY_META: Record<ExpenseMainCategory, CategoryMeta> = {
  식비: {
    label: '식비',
    color: '#f97316',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    icon: '🍽️',
  },
  교통: {
    label: '교통',
    color: '#3b82f6',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    icon: '🚌',
  },
  주거: {
    label: '주거',
    color: '#64748b',
    bgColor: 'bg-slate-100 dark:bg-slate-700/50',
    icon: '🏠',
  },
  쇼핑: {
    label: '쇼핑',
    color: '#ec4899',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    icon: '🛍️',
  },
  '의료/건강': {
    label: '의료/건강',
    color: '#ef4444',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: '🏥',
  },
  '문화/여가': {
    label: '문화/여가',
    color: '#8b5cf6',
    bgColor: 'bg-violet-100 dark:bg-violet-900/30',
    icon: '🎬',
  },
  교육: {
    label: '교육',
    color: '#06b6d4',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    icon: '📚',
  },
  기타: {
    label: '기타',
    color: '#9ca3af',
    bgColor: 'bg-gray-100 dark:bg-gray-700/50',
    icon: '📦',
  },
}

// ───── 수입 대분류 메타 ─────
export const INCOME_MAIN_CATEGORY_META: Record<IncomeMainCategory, CategoryMeta> = {
  근로소득: {
    label: '근로소득',
    color: '#22c55e',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    icon: '💼',
  },
  '사업/부업소득': {
    label: '사업/부업소득',
    color: '#84cc16',
    bgColor: 'bg-lime-100 dark:bg-lime-900/30',
    icon: '🖥️',
  },
  금융소득: {
    label: '금융소득',
    color: '#14b8a6',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
    icon: '📈',
  },
  기타소득: {
    label: '기타소득',
    color: '#6b7280',
    bgColor: 'bg-gray-100 dark:bg-gray-700/50',
    icon: '🎁',
  },
}

// ───── 차트 색상 ─────
export const CHART_COLORS = [
  '#f97316',
  '#3b82f6',
  '#ec4899',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#64748b',
  '#9ca3af',
]

// ───── 로컬스토리지 키 ─────
export const LOCAL_STORAGE_KEYS = {
  TRANSACTIONS: 'budget_app_transactions',
  BUDGETS: 'budget_app_budgets',
  SETTINGS: 'budget_app_settings',
  THEME: 'budget_app_theme',
}

// ───── 멀티 프로필 키 ─────
export const PROFILE_STORAGE_KEY = 'budget_app_profiles'
export const CURRENT_PROFILE_KEY = 'budget_app_current_profile'
export const DEFAULT_PROFILE_ID = 'default'

/** 프로필별 독립 스토리지 키 반환 */
export function getProfileStorageKey(
  profileId: string,
  type: 'transactions' | 'budgets' | 'assets'
): string {
  return `budget_app_${profileId}_${type}`
}

/** 현재 활성 프로필 ID를 localStorage에서 직접 읽기 (스토어 순환 의존성 방지) */
export function getActiveProfileId(): string {
  return localStorage.getItem(CURRENT_PROFILE_KEY) ?? DEFAULT_PROFILE_ID
}

// ───── 헬퍼 함수 ─────
/** mainCategory에 해당하는 메타 반환 (지출/수입 자동 판별) */
export function getMainCategoryMeta(mainCategory: string): CategoryMeta {
  if (mainCategory in EXPENSE_MAIN_CATEGORY_META) {
    return EXPENSE_MAIN_CATEGORY_META[mainCategory as ExpenseMainCategory]
  }
  if (mainCategory in INCOME_MAIN_CATEGORY_META) {
    return INCOME_MAIN_CATEGORY_META[mainCategory as IncomeMainCategory]
  }
  return { label: mainCategory, color: '#9ca3af', bgColor: 'bg-gray-100 dark:bg-gray-700/50', icon: '📦' }
}
