import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { RecurringTransaction, RecurringFormData } from '@/types'
import { getProfileStorageKey, getActiveProfileId } from '@/utils/constants'
import { getYearMonth } from '@/utils/formatters'
import { useTransactionStore } from '@/store/transactionStore'

function loadFromStorage(profileId?: string): RecurringTransaction[] {
  const pid = profileId ?? getActiveProfileId()
  try {
    const data = localStorage.getItem(getProfileStorageKey(pid, 'recurring'))
    if (data) return JSON.parse(data) as RecurringTransaction[]
  } catch { /* ignore */ }
  return []
}

function saveToStorage(items: RecurringTransaction[], profileId?: string): void {
  const pid = profileId ?? getActiveProfileId()
  localStorage.setItem(getProfileStorageKey(pid, 'recurring'), JSON.stringify(items))
}

interface RecurringState {
  recurring: RecurringTransaction[]
  addRecurring: (data: RecurringFormData) => void
  updateRecurring: (id: string, data: RecurringFormData) => void
  deleteRecurring: (id: string) => void
  toggleActive: (id: string) => void
  registerToMonth: (yearMonth: string) => number
  reloadForProfile: (profileId: string) => void
}

export const useRecurringStore = create<RecurringState>((set, get) => {
  if (typeof window !== 'undefined') {
    window.addEventListener('profile-switch', (e) => {
      const { profileId } = (e as CustomEvent).detail
      get().reloadForProfile(profileId)
    })
    window.addEventListener('user-logged-out', () => {
      set({ recurring: [] })
    })
  }

  return {
    recurring: loadFromStorage(),

    addRecurring: (data) => {
      const pid = getActiveProfileId()
      const now = new Date().toISOString()
      const item: RecurringTransaction = {
        id: uuidv4(),
        name: data.name.trim(),
        type: data.type,
        amount: parseInt(data.amount.replace(/[^0-9]/g, '')) || 0,
        mainCategory: data.mainCategory,
        subCategory: data.subCategory,
        period: data.period,
        dayOfMonth: parseInt(data.dayOfMonth) || 1,
        monthOfYear: data.period === 'yearly' ? (parseInt(data.monthOfYear) || 1) : undefined,
        paymentMethod: data.paymentMethod,
        cardAccountId: data.paymentMethod === 'card' ? (data.cardAccountId || undefined) : undefined,
        memo: data.memo,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }
      const recurring = [...get().recurring, item]
      saveToStorage(recurring, pid)
      set({ recurring })
    },

    updateRecurring: (id, data) => {
      const pid = getActiveProfileId()
      const now = new Date().toISOString()
      const recurring = get().recurring.map((r) =>
        r.id !== id
          ? r
          : {
              ...r,
              name: data.name.trim(),
              type: data.type,
              amount: parseInt(data.amount.replace(/[^0-9]/g, '')) || 0,
              mainCategory: data.mainCategory,
              subCategory: data.subCategory,
              period: data.period,
              dayOfMonth: parseInt(data.dayOfMonth) || 1,
              monthOfYear: data.period === 'yearly' ? (parseInt(data.monthOfYear) || 1) : undefined,
              paymentMethod: data.paymentMethod,
              cardAccountId: data.paymentMethod === 'card' ? (data.cardAccountId || undefined) : undefined,
              memo: data.memo,
              updatedAt: now,
            }
      )
      saveToStorage(recurring, pid)
      set({ recurring })
    },

    deleteRecurring: (id) => {
      const pid = getActiveProfileId()
      const recurring = get().recurring.filter((r) => r.id !== id)
      saveToStorage(recurring, pid)
      set({ recurring })
    },

    toggleActive: (id) => {
      const pid = getActiveProfileId()
      const now = new Date().toISOString()
      const recurring = get().recurring.map((r) =>
        r.id === id ? { ...r, isActive: !r.isActive, updatedAt: now } : r
      )
      saveToStorage(recurring, pid)
      set({ recurring })
    },

    registerToMonth: (yearMonth) => {
      const [, month] = yearMonth.split('-').map(Number)
      const year = parseInt(yearMonth.split('-')[0])

      // 해당 월에 이미 등록된 recurringId 수집
      const transactions = useTransactionStore.getState().transactions
      const registeredIds = new Set<string>()
      for (const t of transactions) {
        if (getYearMonth(t.date) === yearMonth && t.recurringId) {
          registeredIds.add(t.recurringId)
        }
      }

      const activeItems = get().recurring.filter((r) => r.isActive)
      let count = 0

      for (const r of activeItems) {
        if (registeredIds.has(r.id)) continue
        if (r.period === 'yearly' && r.monthOfYear !== month) continue

        // 해당 월의 최대 일수 계산 (dayOfMonth가 말일 초과 시 말일 사용)
        const maxDay = new Date(year, month, 0).getDate()
        const day = Math.min(r.dayOfMonth, maxDay)
        const date = `${yearMonth}-${String(day).padStart(2, '0')}`

        useTransactionStore.getState().addTransaction({
          type: r.type,
          amount: String(r.amount),
          mainCategory: r.mainCategory,
          subCategory: r.subCategory,
          memo: r.memo,
          date,
          paymentMethod: r.paymentMethod,
          cardAccountId: r.cardAccountId ?? '',
          recurringId: r.id,
        })
        count++
      }
      return count
    },

    reloadForProfile: (profileId) => {
      set({ recurring: loadFromStorage(profileId) })
    },
  }
})
