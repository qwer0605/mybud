import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { MonthlyBudget, BudgetFormData, ExpenseMainCategory } from '@/types'
import {
  EXPENSE_MAIN_CATEGORIES,
  getProfileStorageKey,
  getActiveProfileId,
} from '@/utils/constants'
import { getCurrentYearMonth } from '@/utils/formatters'
import { sampleBudgets } from '@/utils/sampleData'

// ───── 마이그레이션 ─────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateBudgets(raw: any[]): MonthlyBudget[] {
  return raw.map((b) => ({
    ...b,
    categoryBudgets: (b.categoryBudgets ?? []).map((cb: any) => ({
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
  } catch {
    // ignore
  }
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
  getCategoryBudget: (yearMonth: string, mainCategory: ExpenseMainCategory) => number

  /** 프로필 전환 시 데이터 재로드 */
  reloadForProfile: (profileId: string) => void
}

export const useBudgetStore = create<BudgetState>((set, get) => {
  // 프로필 전환 이벤트 구독
  if (typeof window !== 'undefined') {
    window.addEventListener('profile-switch', (e) => {
      const { profileId } = (e as CustomEvent).detail
      get().reloadForProfile(profileId)
    })
  }

  return {
    budgets: loadFromStorage(),

    setBudget: (yearMonth, data) => {
      const existing = get().getBudgetByYearMonth(yearMonth)
      const now = new Date().toISOString()

      const categoryBudgets = data.categoryBudgets
        .filter((cb) => cb.amount !== '' && parseInt(cb.amount.replace(/[^0-9]/g, '')) > 0)
        .map((cb) => ({
          mainCategory: cb.mainCategory,
          amount: parseInt(cb.amount.replace(/[^0-9]/g, '')) || 0,
        }))

      let budgets: MonthlyBudget[]
      if (existing) {
        budgets = get().budgets.map((b) =>
          b.yearMonth === yearMonth
            ? {
                ...b,
                totalBudget: parseInt(data.totalBudget.replace(/[^0-9]/g, '')) || 0,
                categoryBudgets,
                updatedAt: now,
              }
            : b
        )
      } else {
        const newBudget: MonthlyBudget = {
          id: uuidv4(),
          yearMonth,
          totalBudget: parseInt(data.totalBudget.replace(/[^0-9]/g, '')) || 0,
          categoryBudgets,
          createdAt: now,
          updatedAt: now,
        }
        budgets = [newBudget, ...get().budgets]
      }

      saveToStorage(budgets)
      set({ budgets })
    },

    deleteBudget: (yearMonth) => {
      const budgets = get().budgets.filter((b) => b.yearMonth !== yearMonth)
      saveToStorage(budgets)
      set({ budgets })
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

// 기본 예산 폼 데이터 생성 헬퍼
export function createDefaultBudgetFormData(existing?: MonthlyBudget): BudgetFormData {
  return {
    totalBudget: existing ? String(existing.totalBudget) : '',
    categoryBudgets: EXPENSE_MAIN_CATEGORIES.map((mainCategory) => {
      const found = existing?.categoryBudgets.find((cb) => cb.mainCategory === mainCategory)
      return {
        mainCategory,
        amount: found ? String(found.amount) : '',
      }
    }),
  }
}
