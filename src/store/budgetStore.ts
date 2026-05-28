import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { MonthlyBudget, BudgetFormData } from '@/types'
import {
  getProfileStorageKey,
  getActiveProfileId,
} from '@/utils/constants'
import { getCurrentYearMonth } from '@/utils/formatters'
import { sampleBudgets } from '@/utils/sampleData'
import { isFirebaseConfigured } from '@/firebase/config'
import { upsertDocument, deleteDocument } from '@/firebase/syncService'
import { getCurrentUser } from '@/store/authStore'

// ───── Firestore 동기화 헬퍼 ─────
function fireSync(profileId: string, id: string, data: Record<string, unknown>): void {
  if (!isFirebaseConfigured) return
  const user = getCurrentUser()
  if (!user) return
  upsertDocument(user.uid, profileId, 'budgets', id, data).catch(() => {})
}

function fireDelete(profileId: string, id: string): void {
  if (!isFirebaseConfigured) return
  const user = getCurrentUser()
  if (!user) return
  deleteDocument(user.uid, profileId, 'budgets', id).catch(() => {})
}

// ───── 마이그레이션 ─────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateBudgets(raw: any[]): MonthlyBudget[] {
  return raw.map((b) => ({
    ...b,
    categoryBudgets: (b.categoryBudgets ?? []).map((cb: { mainCategory?: string; category?: string; amount: number }) => ({
      mainCategory: cb.mainCategory ?? cb.category ?? '기타',
      amount: cb.amount,
    })),
  })) as MonthlyBudget[]
}

// ───── 로드/저장 ─────
function loadFromStorage(profileId?: string, seedIfEmpty = true): MonthlyBudget[] {
  const pid = profileId ?? getActiveProfileId()
  const key = getProfileStorageKey(pid, 'budgets')
  try {
    const data = localStorage.getItem(key)
    if (data) {
      const parsed = JSON.parse(data)
      const migrated = migrateBudgets(parsed)
      if (
        parsed.length > 0 &&
        parsed[0].categoryBudgets?.length > 0 &&
        !parsed[0].categoryBudgets[0].mainCategory
      ) {
        saveToStorage(migrated, pid)
      }
      return migrated
    }
  } catch { /* ignore */ }
  if (seedIfEmpty) {
    localStorage.setItem(key, JSON.stringify(sampleBudgets))
    return sampleBudgets
  }
  localStorage.setItem(key, JSON.stringify([]))
  return []
}

function saveToStorage(budgets: MonthlyBudget[], profileId?: string): void {
  const pid = profileId ?? getActiveProfileId()
  localStorage.setItem(getProfileStorageKey(pid, 'budgets'), JSON.stringify(budgets))
}

// ───── 타입 ─────
interface BudgetState {
  budgets: MonthlyBudget[]

  setBudget: (yearMonth: string, data: BudgetFormData) => void
  deleteBudget: (yearMonth: string) => void

  getBudgetByYearMonth: (yearMonth: string) => MonthlyBudget | undefined
  getCurrentMonthBudget: () => MonthlyBudget | undefined
  getCategoryBudget: (yearMonth: string, mainCategory: string) => number

  reloadForProfile: (profileId: string) => void
}

export const useBudgetStore = create<BudgetState>((set, get) => {
  if (typeof window !== 'undefined') {
    // 프로필 전환 이벤트
    window.addEventListener('profile-switch', (e) => {
      const { profileId } = (e as CustomEvent).detail
      get().reloadForProfile(profileId)
    })
    // Firestore 다운로드 완료 이벤트
    window.addEventListener('firestore-data-loaded', () => {
      const pid = getActiveProfileId()
      const budgets = loadFromStorage(pid, false)
      set({ budgets })
    })
    // 로그아웃 시 화면 초기화
    window.addEventListener('user-logged-out', () => {
      set({ budgets: [] })
    })
  }

  return {
    budgets: loadFromStorage(),

    setBudget: (yearMonth, data) => {
      const pid = getActiveProfileId()
      const existing = get().getBudgetByYearMonth(yearMonth)
      const now = new Date().toISOString()

      const categoryBudgets = data.categoryBudgets
        .filter((cb) => cb.amount !== '' && parseInt(cb.amount.replace(/[^0-9]/g, '')) > 0)
        .map((cb) => ({
          mainCategory: cb.mainCategory,
          amount: parseInt(cb.amount.replace(/[^0-9]/g, '')) || 0,
        }))

      let budgets: MonthlyBudget[]
      let targetBudget: MonthlyBudget

      if (existing) {
        targetBudget = {
          ...existing,
          totalBudget: parseInt(data.totalBudget.replace(/[^0-9]/g, '')) || 0,
          categoryBudgets,
          updatedAt: now,
        }
        budgets = get().budgets.map((b) =>
          b.yearMonth === yearMonth ? targetBudget : b
        )
      } else {
        targetBudget = {
          id: uuidv4(),
          yearMonth,
          totalBudget: parseInt(data.totalBudget.replace(/[^0-9]/g, '')) || 0,
          categoryBudgets,
          createdAt: now,
          updatedAt: now,
        }
        budgets = [targetBudget, ...get().budgets]
      }

      saveToStorage(budgets, pid)
      set({ budgets })
      fireSync(pid, targetBudget.id, targetBudget as unknown as Record<string, unknown>)
    },

    deleteBudget: (yearMonth) => {
      const pid = getActiveProfileId()
      const target = get().getBudgetByYearMonth(yearMonth)
      const budgets = get().budgets.filter((b) => b.yearMonth !== yearMonth)
      saveToStorage(budgets, pid)
      set({ budgets })
      if (target) fireDelete(pid, target.id)
    },

    getBudgetByYearMonth: (yearMonth) => {
      return get().budgets.find((b) => b.yearMonth === yearMonth)
    },

    getCurrentMonthBudget: () => {
      return get().getBudgetByYearMonth(getCurrentYearMonth())
    },

    getCategoryBudget: (yearMonth, mainCategory) => {
      const budget = get().getBudgetByYearMonth(yearMonth)
      if (!budget) return 0
      const item = budget.categoryBudgets.find((cb) => cb.mainCategory === mainCategory)
      return item?.amount ?? 0
    },

    reloadForProfile: (profileId) => {
      const budgets = loadFromStorage(profileId, false)
      set({ budgets })
    },
  }
})

// 기본 예산 폼 데이터 생성 헬퍼 (동적 카테고리 지원)
export function createDefaultBudgetFormData(
  expenseCategories: string[],
  existing?: MonthlyBudget
): BudgetFormData {
  return {
    totalBudget: existing ? String(existing.totalBudget) : '',
    categoryBudgets: expenseCategories.map((mainCategory) => {
      const found = existing?.categoryBudgets.find((cb) => cb.mainCategory === mainCategory)
      return {
        mainCategory,
        amount: found ? String(found.amount) : '',
      }
    }),
  }
}
