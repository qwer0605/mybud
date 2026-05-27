import { v4 as uuidv4 } from 'uuid'
import type { Transaction, MonthlyBudget } from '@/types'

const now = new Date()
const currentYear = now.getFullYear()
const currentMonth = now.getMonth() + 1

function makeDate(monthOffset: number, day: number): string {
  const month = currentMonth + monthOffset
  let year = currentYear
  let adjustedMonth = month
  if (month < 1) {
    year -= 1
    adjustedMonth = month + 12
  } else if (month > 12) {
    year += 1
    adjustedMonth = month - 12
  }
  return `${year}-${String(adjustedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const ts = () => new Date().toISOString()

export const sampleTransactions: Transaction[] = [
  // 이번 달 거래
  { id: uuidv4(), type: 'income',  amount: 3200000, mainCategory: '근로소득',      subCategory: '급여',        memo: '이번달 급여',       date: makeDate(0, 1),  createdAt: ts(), updatedAt: ts() },
  { id: uuidv4(), type: 'expense', amount: 85000,   mainCategory: '식비',          subCategory: '마트/편의점', memo: '마트 장보기',       date: makeDate(0, 3),  createdAt: ts(), updatedAt: ts() },
  { id: uuidv4(), type: 'expense', amount: 52000,   mainCategory: '교통',          subCategory: '대중교통',    memo: '교통카드 충전',     date: makeDate(0, 4),  createdAt: ts(), updatedAt: ts() },
  { id: uuidv4(), type: 'expense', amount: 38000,   mainCategory: '식비',          subCategory: '외식',        memo: '점심 회식',         date: makeDate(0, 5),  createdAt: ts(), updatedAt: ts() },
  { id: uuidv4(), type: 'expense', amount: 120000,  mainCategory: '쇼핑',          subCategory: '의류/잡화',   memo: '의류 구입',         date: makeDate(0, 7),  createdAt: ts(), updatedAt: ts() },
  { id: uuidv4(), type: 'expense', amount: 15000,   mainCategory: '문화/여가',     subCategory: '영화/공연',   memo: '영화 관람',         date: makeDate(0, 8),  createdAt: ts(), updatedAt: ts() },
  { id: uuidv4(), type: 'income',  amount: 250000,  mainCategory: '사업/부업소득', subCategory: '프리랜서',    memo: '프리랜서 작업',     date: makeDate(0, 10), createdAt: ts(), updatedAt: ts() },
  { id: uuidv4(), type: 'expense', amount: 67000,   mainCategory: '식비',          subCategory: '외식',        memo: '주말 외식',         date: makeDate(0, 11), createdAt: ts(), updatedAt: ts() },
  { id: uuidv4(), type: 'expense', amount: 45000,   mainCategory: '교육',          subCategory: '온라인강의',  memo: '온라인 강의',       date: makeDate(0, 12), createdAt: ts(), updatedAt: ts() },
  { id: uuidv4(), type: 'expense', amount: 89000,   mainCategory: '주거',          subCategory: '공과금',      memo: '전기/가스 요금',    date: makeDate(0, 14), createdAt: ts(), updatedAt: ts() },
  { id: uuidv4(), type: 'expense', amount: 25000,   mainCategory: '식비',          subCategory: '카페/음료',   memo: '카페',              date: makeDate(0, 15), createdAt: ts(), updatedAt: ts() },
  { id: uuidv4(), type: 'income',  amount: 150000,  mainCategory: '금융소득',      subCategory: '배당금',      memo: '배당금 수령',       date: makeDate(0, 16), createdAt: ts(), updatedAt: ts() },
  { id: uuidv4(), type: 'expense', amount: 32000,   mainCategory: '의료/건강',     subCategory: '병원/치과',   memo: '병원 진료',         date: makeDate(0, 17), createdAt: ts(), updatedAt: ts() },
  { id: uuidv4(), type: 'expense', amount: 78000,   mainCategory: '쇼핑',          subCategory: '생활용품',    memo: '생활용품',          date: makeDate(0, 19), createdAt: ts(), updatedAt: ts() },
  { id: uuidv4(), type: 'expense', amount: 42000,   mainCategory: '식비',          subCategory: '배달',        memo: '배달 주문',         date: makeDate(0, 20), createdAt: ts(), updatedAt: ts() },
  { id: uuidv4(), type: 'expense', amount: 15000,   mainCategory: '교통',          subCategory: '택시',        memo: '택시',              date: makeDate(0, 21), createdAt: ts(), updatedAt: ts() },
  { id: uuidv4(), type: 'expense', amount: 55000,   mainCategory: '문화/여가',     subCategory: '구독서비스',  memo: '스트리밍 구독',     date: makeDate(0, 22), createdAt: ts(), updatedAt: ts() },
  { id: uuidv4(), type: 'expense', amount: 130000,  mainCategory: '교육',          subCategory: '서적',        memo: '서적 구입',         date: makeDate(0, 23), createdAt: ts(), updatedAt: ts() },
  { id: uuidv4(), type: 'expense', amount: 28000,   mainCategory: '식비',          subCategory: '마트/편의점', memo: '편의점',            date: makeDate(0, 25), createdAt: ts(), updatedAt: ts() },

  // 지난 달 거래
  { id: uuidv4(), type: 'income',  amount: 3200000, mainCategory: '근로소득',      subCategory: '급여',        memo: '지난달 급여',       date: makeDate(-1, 1),  createdAt: ts(), updatedAt: ts() },
  { id: uuidv4(), type: 'expense', amount: 95000,   mainCategory: '식비',          subCategory: '마트/편의점', memo: '마트',              date: makeDate(-1, 5),  createdAt: ts(), updatedAt: ts() },
  { id: uuidv4(), type: 'expense', amount: 60000,   mainCategory: '교통',          subCategory: '대중교통',    memo: '교통카드',          date: makeDate(-1, 6),  createdAt: ts(), updatedAt: ts() },
  { id: uuidv4(), type: 'expense', amount: 180000,  mainCategory: '쇼핑',          subCategory: '의류/잡화',   memo: '신발 구입',         date: makeDate(-1, 8),  createdAt: ts(), updatedAt: ts() },
  { id: uuidv4(), type: 'income',  amount: 300000,  mainCategory: '사업/부업소득', subCategory: '프리랜서',    memo: '프리랜서',          date: makeDate(-1, 10), createdAt: ts(), updatedAt: ts() },
  { id: uuidv4(), type: 'expense', amount: 55000,   mainCategory: '식비',          subCategory: '외식',        memo: '외식',              date: makeDate(-1, 12), createdAt: ts(), updatedAt: ts() },
  { id: uuidv4(), type: 'expense', amount: 92000,   mainCategory: '주거',          subCategory: '월세/관리비', memo: '관리비',            date: makeDate(-1, 14), createdAt: ts(), updatedAt: ts() },
  { id: uuidv4(), type: 'expense', amount: 48000,   mainCategory: '의료/건강',     subCategory: '약국',        memo: '약국',              date: makeDate(-1, 16), createdAt: ts(), updatedAt: ts() },
  { id: uuidv4(), type: 'expense', amount: 35000,   mainCategory: '문화/여가',     subCategory: '영화/공연',   memo: '공연 관람',         date: makeDate(-1, 18), createdAt: ts(), updatedAt: ts() },
  { id: uuidv4(), type: 'expense', amount: 120000,  mainCategory: '교육',          subCategory: '학원/과외',   memo: '학원비',            date: makeDate(-1, 20), createdAt: ts(), updatedAt: ts() },

  // 2달 전 거래
  { id: uuidv4(), type: 'income',  amount: 3200000, mainCategory: '근로소득',      subCategory: '급여',        memo: '2달전 급여',        date: makeDate(-2, 1),  createdAt: ts(), updatedAt: ts() },
  { id: uuidv4(), type: 'income',  amount: 200000,  mainCategory: '금융소득',      subCategory: '주식매도',    memo: '주식 수익',         date: makeDate(-2, 5),  createdAt: ts(), updatedAt: ts() },
  { id: uuidv4(), type: 'expense', amount: 110000,  mainCategory: '식비',          subCategory: '마트/편의점', memo: '명절 음식',         date: makeDate(-2, 7),  createdAt: ts(), updatedAt: ts() },
  { id: uuidv4(), type: 'expense', amount: 45000,   mainCategory: '교통',          subCategory: '대중교통',    memo: '귀성 교통비',       date: makeDate(-2, 9),  createdAt: ts(), updatedAt: ts() },
  { id: uuidv4(), type: 'expense', amount: 250000,  mainCategory: '기타',          subCategory: '기타',        memo: '명절 선물',         date: makeDate(-2, 10), createdAt: ts(), updatedAt: ts() },
  { id: uuidv4(), type: 'expense', amount: 88000,   mainCategory: '주거',          subCategory: '공과금',      memo: '전기요금',          date: makeDate(-2, 14), createdAt: ts(), updatedAt: ts() },
  { id: uuidv4(), type: 'expense', amount: 65000,   mainCategory: '식비',          subCategory: '외식',        memo: '외식',              date: makeDate(-2, 18), createdAt: ts(), updatedAt: ts() },
  { id: uuidv4(), type: 'expense', amount: 40000,   mainCategory: '문화/여가',     subCategory: '여행',        memo: '여가활동',          date: makeDate(-2, 22), createdAt: ts(), updatedAt: ts() },
]

export const sampleBudgets: MonthlyBudget[] = [
  {
    id: uuidv4(),
    yearMonth: `${currentYear}-${String(currentMonth).padStart(2, '0')}`,
    totalBudget: 2000000,
    categoryBudgets: [
      { mainCategory: '식비',      amount: 400000 },
      { mainCategory: '교통',      amount: 150000 },
      { mainCategory: '주거',      amount: 250000 },
      { mainCategory: '쇼핑',      amount: 300000 },
      { mainCategory: '의료/건강', amount: 100000 },
      { mainCategory: '문화/여가', amount: 150000 },
      { mainCategory: '교육',      amount: 200000 },
      { mainCategory: '기타',      amount: 100000 },
    ],
    createdAt: ts(),
    updatedAt: ts(),
  },
]
