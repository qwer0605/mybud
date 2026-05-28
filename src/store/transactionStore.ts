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
import { isFirebaseConfigured } from '@/firebase/config'
import { upsertDocument, deleteDocument } from '@/firebase/syncService'
import { getCurrentUser } from '@/store/authStore'
import { useAssetStore } from '@/store/assetStore'

// ───── 계좌 잔액 연동 헬퍼 ─────
// sign: +1 = 거래 발생, -1 = 거래 취소(역산)
function syncLinkedAccountBalance(transaction: Transaction, sign: 1 | -1) {
  const accountId = transaction.cardAccountId
  if (!accountId) return

  const account = useAssetStore.getState().accounts.find((a) => a.id === accountId)
  if (!account) return

  let delta: number
  if (transaction.type === 'expense') {
    // 부채 계좌(신용카드): 지출 시 잔액 증가(미결제 누적)
    // 자산 계좌(통장/현금): 지출 시 잔액 감소
    delta = account.isLiability
      ? transaction.amount * sign
      : -transaction.amount * sign
  } else {
    // 수입: 자산 계좌 증가, 부채 계좌 감소(상환)
    delta = account.isLiability
      ? -transaction.amount * sign
      : transaction.amount * sign
  }

  useAssetStore.getState().adjustAccountAmount(accountId, delta)
}

// ───── Firestore 동기화 헬퍼 ─────
function fireSync(profileId: string, id: string, data: Record<string, unknown>): void {
  if (!isFirebaseConfigured) return
  const user = getCurrentUser()
  if (!user) return
  upsertDocument(user.uid, profileId, 'transactions', id, data).catch(() => {})
}

function fireDelete(profileId: string, id: string): void {
  if (!isFirebaseConfigured) return
  const user = getCurrentUser()
  if (!user) return
  deleteDocument(user.uid, profileId, 'transactions', id).catch(() => {})
}

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
  } catch { /* ignore */ }
  if (seedIfEmpty) {
    localStorage.setItem(key, JSON.stringify(sampleTransactions))
    return sampleTransactions
  }
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
  if (typeof window !== 'undefined') {
    // 프로필 전환 이벤트
    window.addEventListener('profile-switch', (e) => {
      const { profileId } = (e as CustomEvent).detail
      get().reloadForProfile(profileId)
    })
    // Firestore 다운로드 완료 이벤트
    window.addEventListener('firestore-data-loaded', () => {
      const pid = getActiveProfileId()
      const transactions = loadFromStorage(pid, false)
      set({ transactions, filter: defaultFilter })
    })
    // 로그아웃 시 화면 초기화
    window.addEventListener('user-logged-out', () => {
      set({ transactions: [], filter: defaultFilter })
    })
  }

  return {
    transactions: loadFromStorage(),
    filter: defaultFilter,
    isLoading: false,

    addTransaction: (data) => {
      const pid = getActiveProfileId()
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
        paymentMethod: data.paymentMethod ?? 'cash',
        cardAccountId: data.paymentMethod === 'card' ? (data.cardAccountId || undefined) : undefined,
      }
      const transactions = [newTransaction, ...get().transactions]
      saveToStorage(transactions, pid)
      set({ transactions })
      fireSync(pid, newTransaction.id, newTransaction as unknown as Record<string, unknown>)
      // 연결 계좌 잔액 자동 반영
      syncLinkedAccountBalance(newTransaction, 1)
    },

    updateTransaction: (id, data) => {
      const pid = getActiveProfileId()
      const now = new Date().toISOString()
      const old = get().transactions.find((t) => t.id === id)
      const newAmount = parseInt(data.amount.replace(/[^0-9]/g, '')) || 0
      const updated: Transaction = {
        ...(old ?? {} as Transaction),
        id,
        type: data.type,
        amount: newAmount,
        mainCategory: data.mainCategory,
        subCategory: data.subCategory,
        memo: data.memo,
        date: data.date,
        updatedAt: now,
        paymentMethod: data.paymentMethod ?? 'cash',
        cardAccountId: data.paymentMethod === 'card' ? (data.cardAccountId || undefined) : undefined,
      }
      const transactions = get().transactions.map((t) => t.id === id ? updated : t)
      saveToStorage(transactions, pid)
      set({ transactions })
      fireSync(pid, id, updated as unknown as Record<string, unknown>)
      // 연결 계좌 잔액 역산 후 재적용
      if (old) syncLinkedAccountBalance(old, -1)
      syncLinkedAccountBalance(updated, 1)
    },

    deleteTransaction: (id) => {
      const pid = getActiveProfileId()
      const target = get().transactions.find((t) => t.id === id)
      const transactions = get().transactions.filter((t) => t.id !== id)
      saveToStorage(transactions, pid)
      set({ transactions })
      fireDelete(pid, id)
      // 연결 계좌 잔액 역산
      if (target) syncLinkedAccountBalance(target, -1)
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
      const transactions = loadFromStorage(profileId, false)
      set({ transactions, filter: defaultFilter })
    },
  }
})

export function hasLegacyData(): boolean {
  return !!localStorage.getItem(LOCAL_STORAGE_KEYS.TRANSACTIONS)
}
