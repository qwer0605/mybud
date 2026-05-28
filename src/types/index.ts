// 거래 유형
export type TransactionType = 'income' | 'expense'

// ───── 지출 카테고리 ─────
export type ExpenseMainCategory =
  | '식비'
  | '교통'
  | '주거'
  | '쇼핑'
  | '의료/건강'
  | '문화/여가'
  | '교육'
  | '기타'

export type ExpenseSubCategory =
  // 식비
  | '외식'
  | '카페/음료'
  | '마트/편의점'
  | '배달'
  // 교통
  | '대중교통'
  | '택시'
  | '주유/주차'
  // 주거
  | '월세/관리비'
  | '공과금'
  | '인테리어'
  // 쇼핑
  | '의류/잡화'
  | '생활용품'
  | '전자기기'
  // 의료/건강
  | '병원/치과'
  | '약국'
  | '헬스/운동'
  // 문화/여가
  | '영화/공연'
  | '여행'
  | '구독서비스'
  // 교육
  | '학원/과외'
  | '서적'
  | '온라인강의'
  // 기타
  | '기타'

// ───── 수입 카테고리 ─────
export type IncomeMainCategory =
  | '근로소득'
  | '사업/부업소득'
  | '금융소득'
  | '기타소득'

export type IncomeSubCategory =
  // 근로소득
  | '급여'
  | '상여금/성과급'
  | '퇴직금'
  // 사업/부업소득
  | '프리랜서'
  | '부업'
  | '사업수익'
  // 금융소득
  | '이자소득'
  | '배당금'
  | '주식매도'
  // 기타소득
  | '용돈/선물'
  | '환급금'
  | '기타'

export type MainCategory = ExpenseMainCategory | IncomeMainCategory
export type SubCategory = ExpenseSubCategory | IncomeSubCategory

// ───── 거래 내역 ─────
export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  mainCategory: string
  subCategory: string
  memo: string
  date: string // ISO 날짜 문자열 YYYY-MM-DD
  createdAt: string
  updatedAt: string
  paymentMethod?: PaymentMethod   // 결제수단 (없으면 현금으로 간주)
  cardAccountId?: string          // 카드 선택 시 연결된 자산계좌 id
}

// ───── 예산 ─────
export interface BudgetItem {
  mainCategory: string   // 동적 카테고리 지원을 위해 string 사용
  amount: number
}

export interface MonthlyBudget {
  id: string
  yearMonth: string // YYYY-MM 형식
  totalBudget: number
  categoryBudgets: BudgetItem[]
  createdAt: string
  updatedAt: string
}

// ───── 앱 설정 ─────
export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  currency: string
  language: string
  useFirebase: boolean
}

// ───── 통계 ─────
export interface MonthlyStats {
  yearMonth: string
  totalIncome: number
  totalExpense: number
  balance: number
}

export interface CategoryStats {
  mainCategory: string
  amount: number
  percentage: number
  color: string
}

// ───── 폼 데이터 ─────
export interface TransactionFormData {
  type: TransactionType
  amount: string
  mainCategory: string
  subCategory: string
  memo: string
  date: string
  paymentMethod: PaymentMethod    // 결제수단 (기본 'cash')
  cardAccountId: string           // 카드 선택 시 계좌 id, 아니면 빈 문자열
}

export interface BudgetFormData {
  totalBudget: string
  categoryBudgets: { mainCategory: string; amount: string }[]
}

// ───── 필터 ─────
export interface TransactionFilter {
  type: TransactionType | 'all'
  mainCategory: string | 'all'
  startDate: string
  endDate: string
  searchText: string
}

// ───── 카테고리 메타데이터 ─────
export interface CategoryMeta {
  label: string
  color: string
  bgColor: string
  icon: string
}

// ───── 자산 관리 ─────
export type AssetType = '현금/예금' | '투자' | '부동산' | '연금/보험' | '기타자산'
export type LiabilityType = '신용카드' | '대출' | '카드할부' | '전세보증금' | '기타부채'

// ───── 결제수단 ─────
export type PaymentMethod = 'cash' | 'card' | 'transfer'

export interface AssetAccount {
  id: string
  name: string
  type: AssetType | LiabilityType
  isLiability: boolean
  /** 거래 연동으로 자동 갱신되는 현재 잔액 */
  amount: number
  /** 최초 등록 시 입력한 기초잔액 (거래 연동과 무관하게 직접 수정 가능) */
  initialAmount?: number
  memo: string
  updatedAt: string
  createdAt: string
}

export interface AssetSnapshot {
  id: string
  yearMonth: string   // YYYY-MM
  totalAssets: number
  totalLiabilities: number
  netWorth: number    // totalAssets - totalLiabilities
  createdAt: string
}
