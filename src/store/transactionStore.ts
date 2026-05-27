import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { Transaction, TransactionFormData, TransactionFilter } from '@/types'
import {
  LOCAL_STORAGE_KEYS,
  getProfileStorageKey,
  getActiveProfileId,
} from '@/utils/constants'
import { getCurrentYearMonth, getYearMonth } from '@/utils/formatters'
import { sampleTransactions } from '@/utils/sampleData'

// ───── 마이그레이션 ─────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrate(raw: any[]): Transaction[] {
  return raw.map((t) => {
    if (t.mainCategory) return t as Transaction
    const cat: string = t.category ?? '기타'
    return { ...t, mainCategory: cat, subCategory: cat } as Transaction
  })
}

// ───── 로드/저장 ─────
/**
 * @param seedIfEmpty true(기본): 데이터 없으면 샘플 데이터 씨딩
 *                   false: 데이터 없으면 빈 배열 반환 (초기화 후 재로드 시 사용)
 */
function loadFromStorage(profileId?: string, seedIfEmpty = true): Transaction[] {
  const pid = profileId ?? getActiveProfileId()
  const key = getProfileStorageKey(pid, 'transactions')
  try {
    const data = localStorage.getItem(key)
    if (data) {
      const parsed = JSON.parse(data)
      const migrated = migrate(parsed)
      if (parsed.length > 0 && !parsed[0].mainCategory) saveToStorage(migrated, pid)
      return migrated
    }
  } catch {
    // ignore
  }
  if (seedIfEmpty) {
    localStorage.setItem(key, JSON.stringify(sampleTransactions))
    return sampleTransactions
  }
  // 초기화 후 재로드: 빈 배열을 명시적으로 저장
  localStorage.setItem(key, JSON.stringify([]))
  return []
}

function saveToStorage(transactions: Transaction[], profileId?: string): void {
  const pid = profileId ?? getActiveProfileId()
  localStorage.setItem(getProfileStorageKey(pid, 'transactions'), JSON.stringify(transactions))
}

// ───── 타입 ─────
interface TransactionState {
  transactions: Transaction[]
  filter: TransactionFilter
  isLoading: boolean

  addTransaction: (data: TransactionFormData) => void
  updateTransaction: (id: string, data: TransactionFormData) => void
  deleteTransaction: (id: string) => void

  setFilter: (filter: Partial<TransactionFilter>) => void
  resetFilter: () => void

  getTransactionsByYearMonth: (yearMonth: string) => Transaction[]
  getCurrentMonthTransactions: () => Transaction[]

  /** 프로필 전환 시 데이터 재로드 */
  reloadForProfile: (profileId: string) => void
}

const defaultFilter: TransactionFilter = {
  type: 'all',
  mainCategory: 'all',
  startDate: '',
  endDate: '',
  searchText: '',
}

export const useTransactionStore = create<TransactionState>((set, get) => {
  // 프로필 전환 이벤트 구독
  if (typeof window !== 'undefined') {
    window.addEventListener('profile-switch', (e) => {
      const { profileId } = (e as CustomEvent).detail
      get().reloadForProfile(profileId)
    })
  }

  return {
    transactions: loadFromStorage(),
    filter: defaultFilter,
    isLoading: false,

    addTransaction: (data) => {
      const now = new Date().toISOString()
      const newTransaction: Transaction = {
        id: uuidv4(),
        type: data.type,
        amount: parseInt(data.amount.replace(/[^0-9]/g, '')) || 0,
        mainCategory: data.mainCategory,
        subCategory: data.subCategory,
        memo: data.memo,
        date: data.date,
        createdAt: now,
        updatedAt: now,
      }
      const transactions = [newTransaction, ...get().transactions]
      saveToStorage(transactions)
      set({ transactions })
    },

    updateTransaction: (id, data) => {
      const now = new Date().toISOString()
      const transactions = get().transactions.map((t) =>
        t.id === id
          ? {
              ...t,
              type: data.type,
              amount: parseInt(data.amount.replace(/[^0-9]/g, '')) || 0,
              mainCategory: data.mainCategory,
              subCategory: data.subCategory,
              memo: data.memo,
              date: data.date,
              updatedAt: now,
            }
          : t
      )
      saveToStorage(transactions)
      set({ transactions })
    },

    deleteTransaction: (id) => {
      const transactions = get().transactions.filter((t) => t.id !== id)
      saveToStorage(transactions)
      set({ transactions })
    },

    setFilter: (filter) => {
      set((state) => ({ filter: { ...state.filter, ...filter } }))
    },

    resetFilter: () => {
      set({ filter: defaultFilter })
    },

    getTransactionsByYearMonth: (yearMonth) => {
      return get()
        .transactions.filter((t) => getYearMonth(t.date) === yearMonth)
        .sort((a, b) => b.date.localeCompare(a.date))
    },

    getCurrentMonthTransactions: () => {
      return get().getTransactionsByYearMonth(getCurrentYearMonth())
    },

    reloadForProfile: (profileId) => {
      // seedIfEmpty=false: 초기화 후에는 빈 배열로, 샘플 데이터 재씨딩 방지
      const transactions = loadFromStorage(profileId, false)
      set({ transactions, filter: defaultFilter })
    },
  }
})

// 레거시 호환: 구형 TRANSACTIONS 키에 데이터가 있으면 알림
export function hasLegacyData(): boolean {
  return !!localStorage.getItem(LOCAL_STORAGE_KEYS.TRANSACTIONS)
}
