import { create } from 'zustand'
import type { CategoryMeta } from '@/types'
import {
  EXPENSE_CATEGORY_TREE,
  INCOME_CATEGORY_TREE,
  EXPENSE_MAIN_CATEGORY_META,
  INCOME_MAIN_CATEGORY_META,
} from '@/utils/constants'

export const CATEGORY_STORAGE_KEY = 'budget_app_categories'

export interface CategoryStoreData {
  expenseTree: Record<string, string[]>
  incomeTree: Record<string, string[]>
  expenseMeta: Record<string, CategoryMeta>
  incomeMeta: Record<string, CategoryMeta>
}

interface CategoryStore extends CategoryStoreData {
  // 대분류 CRUD
  addMainCategory: (type: 'expense' | 'income', name: string, meta: Omit<CategoryMeta, 'label'>) => void
  updateMainCategory: (type: 'expense' | 'income', oldName: string, newName: string, meta: Omit<CategoryMeta, 'label'>) => void
  deleteMainCategory: (type: 'expense' | 'income', name: string) => void

  // 소분류 CRUD
  addSubCategory: (type: 'expense' | 'income', mainCategory: string, name: string) => void
  renameSubCategory: (type: 'expense' | 'income', mainCategory: string, oldName: string, newName: string) => void
  deleteSubCategory: (type: 'expense' | 'income', mainCategory: string, name: string) => void

  // 기본값 복원
  resetToDefault: () => void

  // 헬퍼: mainCategory에 해당하는 메타 반환
  getCategoryMeta: (mainCategory: string) => CategoryMeta
}

function getDefaultData(): CategoryStoreData {
  return {
    expenseTree: { ...(EXPENSE_CATEGORY_TREE as Record<string, string[]>) },
    incomeTree: { ...(INCOME_CATEGORY_TREE as Record<string, string[]>) },
    expenseMeta: { ...(EXPENSE_MAIN_CATEGORY_META as Record<string, CategoryMeta>) },
    incomeMeta: { ...(INCOME_MAIN_CATEGORY_META as Record<string, CategoryMeta>) },
  }
}

function readStorage(): CategoryStoreData {
  try {
    const raw = localStorage.getItem(CATEGORY_STORAGE_KEY)
    if (!raw) return getDefaultData()
    const parsed = JSON.parse(raw) as Partial<CategoryStoreData>
    const def = getDefaultData()
    return {
      expenseTree: parsed.expenseTree ?? def.expenseTree,
      incomeTree: parsed.incomeTree ?? def.incomeTree,
      expenseMeta: parsed.expenseMeta ?? def.expenseMeta,
      incomeMeta: parsed.incomeMeta ?? def.incomeMeta,
    }
  } catch {
    return getDefaultData()
  }
}

function persist(data: CategoryStoreData) {
  localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(data))
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
  ...readStorage(),

  addMainCategory(type, name, meta) {
    const trimmed = name.trim()
    if (!trimmed) return
    const s = get()
    const tree = { ...(type === 'expense' ? s.expenseTree : s.incomeTree) }
    const metaMap = { ...(type === 'expense' ? s.expenseMeta : s.incomeMeta) }
    if (tree[trimmed]) return // already exists
    tree[trimmed] = []
    metaMap[trimmed] = { ...meta, label: trimmed }
    const patch = type === 'expense'
      ? { expenseTree: tree, expenseMeta: metaMap }
      : { incomeTree: tree, incomeMeta: metaMap }
    set(patch)
    persist({ ...s, ...patch })
  },

  updateMainCategory(type, oldName, newName, meta) {
    const trimmed = newName.trim()
    if (!trimmed) return
    const s = get()
    const tree = { ...(type === 'expense' ? s.expenseTree : s.incomeTree) }
    const metaMap = { ...(type === 'expense' ? s.expenseMeta : s.incomeMeta) }
    const subs = tree[oldName] ?? []
    if (oldName !== trimmed) {
      delete tree[oldName]
      delete metaMap[oldName]
    }
    tree[trimmed] = subs
    metaMap[trimmed] = { ...meta, label: trimmed }
    const patch = type === 'expense'
      ? { expenseTree: tree, expenseMeta: metaMap }
      : { incomeTree: tree, incomeMeta: metaMap }
    set(patch)
    persist({ ...s, ...patch })
  },

  deleteMainCategory(type, name) {
    const s = get()
    const tree = { ...(type === 'expense' ? s.expenseTree : s.incomeTree) }
    const metaMap = { ...(type === 'expense' ? s.expenseMeta : s.incomeMeta) }
    delete tree[name]
    delete metaMap[name]
    const patch = type === 'expense'
      ? { expenseTree: tree, expenseMeta: metaMap }
      : { incomeTree: tree, incomeMeta: metaMap }
    set(patch)
    persist({ ...s, ...patch })
  },

  addSubCategory(type, mainCategory, name) {
    const trimmed = name.trim()
    if (!trimmed) return
    const s = get()
    const tree = { ...(type === 'expense' ? s.expenseTree : s.incomeTree) }
    if (!tree[mainCategory]) tree[mainCategory] = []
    if (tree[mainCategory].includes(trimmed)) return
    tree[mainCategory] = [...tree[mainCategory], trimmed]
    const patch = type === 'expense' ? { expenseTree: tree } : { incomeTree: tree }
    set(patch)
    persist({ ...s, ...patch })
  },

  renameSubCategory(type, mainCategory, oldName, newName) {
    const trimmed = newName.trim()
    if (!trimmed) return
    const s = get()
    const tree = { ...(type === 'expense' ? s.expenseTree : s.incomeTree) }
    if (!tree[mainCategory]) return
    const idx = tree[mainCategory].indexOf(oldName)
    if (idx === -1) return
    const newSubs = [...tree[mainCategory]]
    newSubs[idx] = trimmed
    tree[mainCategory] = newSubs
    const patch = type === 'expense' ? { expenseTree: tree } : { incomeTree: tree }
    set(patch)
    persist({ ...s, ...patch })
  },

  deleteSubCategory(type, mainCategory, name) {
    const s = get()
    const tree = { ...(type === 'expense' ? s.expenseTree : s.incomeTree) }
    if (!tree[mainCategory]) return
    tree[mainCategory] = tree[mainCategory].filter((sub) => sub !== name)
    const patch = type === 'expense' ? { expenseTree: tree } : { incomeTree: tree }
    set(patch)
    persist({ ...s, ...patch })
  },

  resetToDefault() {
    const defaults = getDefaultData()
    set(defaults)
    persist(defaults)
  },

  getCategoryMeta(mainCategory) {
    const { expenseMeta, incomeMeta } = get()
    return (
      expenseMeta[mainCategory] ??
      incomeMeta[mainCategory] ?? {
        label: mainCategory,
        color: '#9ca3af',
        bgColor: 'bg-gray-100 dark:bg-gray-700/50',
        icon: '📦',
      }
    )
  },
}))
