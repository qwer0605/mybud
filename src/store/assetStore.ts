import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { AssetAccount, AssetSnapshot } from '@/types'
import { getProfileStorageKey, getActiveProfileId } from '@/utils/constants'
import { isFirebaseConfigured } from '@/firebase/config'
import { upsertDocument, deleteDocument } from '@/firebase/syncService'
import { useAuthStore } from './authStore'

// ───── localStorage 키 ─────
const SNAPSHOT_SUFFIX = '_asset_snapshots'

function getSnapshotKey(profileId: string): string {
  return `budget_app_${profileId}${SNAPSHOT_SUFFIX}`
}

// ───── 로드/저장 ─────
function loadAccounts(profileId?: string): AssetAccount[] {
  const pid = profileId ?? getActiveProfileId()
  const key = getProfileStorageKey(pid, 'assets')
  try {
    const data = localStorage.getItem(key)
    if (data) return JSON.parse(data) as AssetAccount[]
  } catch {
    // ignore
  }
  return []
}

function saveAccounts(accounts: AssetAccount[], profileId?: string): void {
  const pid = profileId ?? getActiveProfileId()
  localStorage.setItem(getProfileStorageKey(pid, 'assets'), JSON.stringify(accounts))
}

function loadSnapshots(profileId?: string): AssetSnapshot[] {
  const pid = profileId ?? getActiveProfileId()
  try {
    const data = localStorage.getItem(getSnapshotKey(pid))
    if (data) return JSON.parse(data) as AssetSnapshot[]
  } catch {
    // ignore
  }
  return []
}

function saveSnapshots(snapshots: AssetSnapshot[], profileId?: string): void {
  const pid = profileId ?? getActiveProfileId()
  localStorage.setItem(getSnapshotKey(pid), JSON.stringify(snapshots))
}

// ───── 현재 연월 (YYYY-MM) ─────
function currentYearMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// ───── Firestore sync 헬퍼 ─────
function fireSync(
  profileId: string,
  id: string,
  data: Record<string, unknown>
): void {
  if (!isFirebaseConfigured) return
  const { user } = useAuthStore.getState()
  if (!user) return
  upsertDocument(user.uid, profileId, 'assets', id, data).catch(() => {})
}

function fireDelete(profileId: string, id: string): void {
  if (!isFirebaseConfigured) return
  const { user } = useAuthStore.getState()
  if (!user) return
  deleteDocument(user.uid, profileId, 'assets', id).catch(() => {})
}

// ───── 타입 ─────
interface AssetState {
  accounts: AssetAccount[]
  snapshots: AssetSnapshot[]

  addAccount: (data: Omit<AssetAccount, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateAccount: (id: string, data: Partial<Omit<AssetAccount, 'id' | 'createdAt'>>) => void
  deleteAccount: (id: string) => void

  /** 이번 달 스냅샷 저장 (순자산 기록) */
  saveSnapshot: () => void

  getTotalAssets: () => number
  getTotalLiabilities: () => number
  getNetWorth: () => number

  /** 프로필 전환 시 데이터 재로드 */
  reloadForProfile: (profileId: string) => void
}

// ───── 스토어 ─────
export const useAssetStore = create<AssetState>((set, get) => {
  // 프로필 전환 이벤트 구독
  if (typeof window !== 'undefined') {
    window.addEventListener('profile-switch', (e) => {
      const { profileId } = (e as CustomEvent).detail
      get().reloadForProfile(profileId)
    })
  }

  return {
    accounts: loadAccounts(),
    snapshots: loadSnapshots(),

    addAccount: (data) => {
      const pid = getActiveProfileId()
      const now = new Date().toISOString()
      const newAccount: AssetAccount = {
        id: uuidv4(),
        ...data,
        createdAt: now,
        updatedAt: now,
      }
      const accounts = [newAccount, ...get().accounts]
      saveAccounts(accounts, pid)
      set({ accounts })
      // 스냅샷 갱신
      get().saveSnapshot()
      // Firestore 동기화
      fireSync(pid, newAccount.id, newAccount as unknown as Record<string, unknown>)
    },

    updateAccount: (id, data) => {
      const pid = getActiveProfileId()
      const now = new Date().toISOString()
      const accounts = get().accounts.map((a) =>
        a.id === id ? { ...a, ...data, updatedAt: now } : a
      )
      saveAccounts(accounts, pid)
      set({ accounts })
      get().saveSnapshot()
      const updated = accounts.find((a) => a.id === id)
      if (updated) fireSync(pid, id, updated as unknown as Record<string, unknown>)
    },

    deleteAccount: (id) => {
      const pid = getActiveProfileId()
      const accounts = get().accounts.filter((a) => a.id !== id)
      saveAccounts(accounts, pid)
      set({ accounts })
      get().saveSnapshot()
      fireDelete(pid, id)
    },

    saveSnapshot: () => {
      const pid = getActiveProfileId()
      const ym = currentYearMonth()
      const totalAssets = get().getTotalAssets()
      const totalLiabilities = get().getTotalLiabilities()
      const netWorth = totalAssets - totalLiabilities

      const existing = get().snapshots.find((s) => s.yearMonth === ym)
      let snapshots: AssetSnapshot[]
      if (existing) {
        snapshots = get().snapshots.map((s) =>
          s.yearMonth === ym ? { ...s, totalAssets, totalLiabilities, netWorth } : s
        )
      } else {
        const newSnap: AssetSnapshot = {
          id: uuidv4(),
          yearMonth: ym,
          totalAssets,
          totalLiabilities,
          netWorth,
          createdAt: new Date().toISOString(),
        }
        snapshots = [...get().snapshots, newSnap].sort((a, b) =>
          a.yearMonth.localeCompare(b.yearMonth)
        )
      }
      saveSnapshots(snapshots, pid)
      set({ snapshots })
    },

    getTotalAssets: () =>
      get()
        .accounts.filter((a) => !a.isLiability)
        .reduce((sum, a) => sum + a.amount, 0),

    getTotalLiabilities: () =>
      get()
        .accounts.filter((a) => a.isLiability)
        .reduce((sum, a) => sum + a.amount, 0),

    getNetWorth: () => get().getTotalAssets() - get().getTotalLiabilities(),

    reloadForProfile: (profileId) => {
      const accounts = loadAccounts(profileId)
      const snapshots = loadSnapshots(profileId)
      set({ accounts, snapshots })
    },
  }
})
