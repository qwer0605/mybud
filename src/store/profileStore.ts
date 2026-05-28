import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import {
  PROFILE_STORAGE_KEY,
  CURRENT_PROFILE_KEY,
  DEFAULT_PROFILE_ID,
  LOCAL_STORAGE_KEYS,
  getProfileStorageKey,
} from '@/utils/constants'
import { isFirebaseConfigured } from '@/firebase/config'
import { syncProfileList } from '@/firebase/syncService'
import { getCurrentUser } from '@/store/authStore'

// ───── 타입 ─────
export interface Profile {
  id: string
  name: string
  icon: string   // 이모지
  color: string  // hex 색상
  createdAt: string
}

interface ProfileState {
  profiles: Profile[]
  activeProfileId: string

  addProfile: (name: string, icon: string, color: string) => void
  updateProfile: (id: string, updates: Partial<Pick<Profile, 'name' | 'icon' | 'color'>>) => void
  deleteProfile: (id: string) => void
  switchProfile: (id: string) => void
  getActiveProfile: () => Profile | undefined
}

// ───── 기본 프로필 ─────
const DEFAULT_PROFILE: Profile = {
  id: DEFAULT_PROFILE_ID,
  name: '개인 가계부',
  icon: '👤',
  color: '#3b82f6',
  createdAt: new Date().toISOString(),
}

// ───── 초기 데이터 마이그레이션 ─────
function migrateOldData(): void {
  const oldTx = localStorage.getItem(LOCAL_STORAGE_KEYS.TRANSACTIONS)
  const newTx = localStorage.getItem(getProfileStorageKey(DEFAULT_PROFILE_ID, 'transactions'))
  if (oldTx && !newTx) {
    localStorage.setItem(getProfileStorageKey(DEFAULT_PROFILE_ID, 'transactions'), oldTx)
  }
  const oldBudget = localStorage.getItem(LOCAL_STORAGE_KEYS.BUDGETS)
  const newBudget = localStorage.getItem(getProfileStorageKey(DEFAULT_PROFILE_ID, 'budgets'))
  if (oldBudget && !newBudget) {
    localStorage.setItem(getProfileStorageKey(DEFAULT_PROFILE_ID, 'budgets'), oldBudget)
  }
}

// ───── 프로필 목록 로드/저장 ─────
function loadProfiles(): Profile[] {
  try {
    const data = localStorage.getItem(PROFILE_STORAGE_KEY)
    if (data) {
      const parsed = JSON.parse(data) as Profile[]
      if (parsed.length > 0) return parsed
    }
  } catch { /* ignore */ }
  migrateOldData()
  const profiles = [DEFAULT_PROFILE]
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles))
  return profiles
}

function saveProfiles(profiles: Profile[]): void {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles))
}

/**
 * 현재 활성 프로필 ID 로드
 * - 저장된 ID가 프로필 목록에 없으면 첫 번째 프로필로 자동 교정
 */
function loadActiveProfileId(profiles: Profile[]): string {
  const stored = localStorage.getItem(CURRENT_PROFILE_KEY) ?? DEFAULT_PROFILE_ID
  if (profiles.find((p) => p.id === stored)) return stored
  const fallback = profiles[0]?.id ?? DEFAULT_PROFILE_ID
  localStorage.setItem(CURRENT_PROFILE_KEY, fallback)
  return fallback
}

// ───── Firestore 동기화 헬퍼 ─────
// 프로필 목록이 변경될 때마다 Firestore에 업로드
// (로그인 상태일 때만, 비동기 fire-and-forget)
function syncProfilesToCloud(profiles: Profile[]): void {
  if (!isFirebaseConfigured) return
  const user = getCurrentUser()
  if (!user) return
  syncProfileList(user.uid, profiles).catch(() => {})
}

// ───── 스토어 ─────
export const useProfileStore = create<ProfileState>((set, get) => {
  const _profiles = loadProfiles()
  const _activeId = loadActiveProfileId(_profiles)

  // ── 이벤트 구독 ──
  if (typeof window !== 'undefined') {
    // Firestore 다운로드 완료 후 프로필 목록 재동기화
    // (authStore가 Firestore 프로필을 localStorage에 쓴 직후 발생)
    window.addEventListener('firestore-data-loaded', () => {
      const profiles   = loadProfiles()
      const activeProfileId = loadActiveProfileId(profiles)
      set({ profiles, activeProfileId })
    })
  }

  return {
    profiles: _profiles,
    activeProfileId: _activeId,

    addProfile: (name, icon, color) => {
      const newProfile: Profile = {
        id: uuidv4(),
        name,
        icon,
        color,
        createdAt: new Date().toISOString(),
      }
      const profiles = [...get().profiles, newProfile]
      saveProfiles(profiles)
      set({ profiles })
      // Firestore 즉시 동기화 (새로고침 후 덮어쓰기 방지)
      syncProfilesToCloud(profiles)
    },

    updateProfile: (id, updates) => {
      const profiles = get().profiles.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      )
      saveProfiles(profiles)
      set({ profiles })
      syncProfilesToCloud(profiles)
    },

    deleteProfile: (id) => {
      if (id === DEFAULT_PROFILE_ID) return
      const profiles = get().profiles.filter((p) => p.id !== id)
      localStorage.removeItem(getProfileStorageKey(id, 'transactions'))
      localStorage.removeItem(getProfileStorageKey(id, 'budgets'))
      localStorage.removeItem(getProfileStorageKey(id, 'assets'))
      saveProfiles(profiles)
      syncProfilesToCloud(profiles)

      if (get().activeProfileId === id) {
        const fallbackId = profiles[0]?.id ?? DEFAULT_PROFILE_ID
        localStorage.setItem(CURRENT_PROFILE_KEY, fallbackId)
        set({ profiles, activeProfileId: fallbackId })
      } else {
        set({ profiles })
      }
    },

    switchProfile: (id) => {
      if (id === get().activeProfileId) return
      localStorage.setItem(CURRENT_PROFILE_KEY, id)
      set({ activeProfileId: id })
      window.dispatchEvent(new CustomEvent('profile-switch', { detail: { profileId: id } }))
    },

    getActiveProfile: () => {
      const { profiles, activeProfileId } = get()
      const found = profiles.find((p) => p.id === activeProfileId)
      if (!found && profiles.length > 0) {
        // 런타임 ID 불일치 → 자동 교정
        const fallback = profiles[0]
        localStorage.setItem(CURRENT_PROFILE_KEY, fallback.id)
        set({ activeProfileId: fallback.id })
        return fallback
      }
      return found
    },
  }
})
