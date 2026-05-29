import { create } from 'zustand'

export interface WidgetDef {
  id: string
  label: string
  canHide: boolean
}

export interface WidgetItem {
  id: string
  visible: boolean
}

export const PAGE_WIDGET_DEFS: Record<string, WidgetDef[]> = {
  dashboard: [
    { id: 'assets',    label: '보유자산',      canHide: true },
    { id: 'cashflow',  label: '현금흐름',       canHide: true },
    { id: 'budget',    label: '예산 현황',      canHide: true },
    { id: 'recent',    label: '최근 거래',      canHide: true },
  ],
  transactions: [
    { id: 'recurring', label: '고정비',         canHide: true },
    { id: 'filter',    label: '필터',           canHide: true },
    { id: 'list',      label: '거래 목록',      canHide: false },
  ],
  budget: [
    { id: 'summary',    label: '예산 요약',         canHide: true },
    { id: 'categories', label: '카테고리별 예산',   canHide: true },
  ],
  statistics: [
    { id: 'stats-summary',  label: '이번달 요약',       canHide: true },
    { id: 'pie-chart',      label: '카테고리 파이차트', canHide: true },
    { id: 'bar-chart',      label: '월별 수입/지출',    canHide: true },
    { id: 'line-chart',     label: '잔액 추이',         canHide: true },
    { id: 'monthly-table',  label: '월별 요약 테이블',  canHide: true },
  ],
  assets: [
    { id: 'trend-chart',       label: '순자산 추이', canHide: true  },
    { id: 'assets-list',       label: '자산 목록',   canHide: false },
    { id: 'liabilities-list',  label: '부채 목록',   canHide: false },
  ],
}

const STORAGE_KEY = 'budget_app_widget_configs'

function loadConfigs(): Record<string, WidgetItem[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Record<string, WidgetItem[]>
  } catch { /* ignore */ }
  return {}
}

function saveConfigs(configs: Record<string, WidgetItem[]>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs))
}

function defaultItems(pageId: string): WidgetItem[] {
  return (PAGE_WIDGET_DEFS[pageId] ?? []).map((d) => ({ id: d.id, visible: true }))
}

interface WidgetStore {
  configs: Record<string, WidgetItem[]>
  editingPage: string | null
  getWidgets: (pageId: string) => WidgetItem[]
  moveWidget: (pageId: string, activeId: string, overId: string) => void
  toggleVisible: (pageId: string, widgetId: string) => void
  startEdit: (pageId: string) => void
  stopEdit: () => void
}

export const useWidgetStore = create<WidgetStore>((set, get) => ({
  configs: loadConfigs(),
  editingPage: null,

  getWidgets: (pageId) => {
    const saved = get().configs[pageId]
    const defaults = defaultItems(pageId)
    if (!saved) return defaults
    // Append any newly added widget defs that aren't in saved config
    const savedIds = new Set(saved.map((w) => w.id))
    const added = defaults.filter((w) => !savedIds.has(w.id))
    return [...saved, ...added]
  },

  moveWidget: (pageId, activeId, overId) => {
    const widgets = get().getWidgets(pageId)
    const from = widgets.findIndex((w) => w.id === activeId)
    const to   = widgets.findIndex((w) => w.id === overId)
    if (from === -1 || to === -1 || from === to) return
    const next = [...widgets]
    next.splice(to, 0, next.splice(from, 1)[0])
    const configs = { ...get().configs, [pageId]: next }
    saveConfigs(configs)
    set({ configs })
  },

  toggleVisible: (pageId, widgetId) => {
    const def = (PAGE_WIDGET_DEFS[pageId] ?? []).find((d) => d.id === widgetId)
    if (!def?.canHide) return
    const widgets = get().getWidgets(pageId)
    const next = widgets.map((w) => (w.id === widgetId ? { ...w, visible: !w.visible } : w))
    const configs = { ...get().configs, [pageId]: next }
    saveConfigs(configs)
    set({ configs })
  },

  startEdit: (pageId) => set({ editingPage: pageId }),
  stopEdit:  ()       => set({ editingPage: null }),
}))
