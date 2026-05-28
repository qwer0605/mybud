import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import {
  PROFILE_STORAGE_KEY,
  CURRENT_PROFILE_KEY,
  DEFAULT_PROFILE_ID,
  LOCAL_STORAGE_KEYS,
  getProfileStorageKey,
} from '@/utils/constants'

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
// 구형 데이터(budget_app_transactions 등)를 기본 프로필 키로 복사
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

// ───── 프로필 목록 로드 ─────
function loadProfiles(): Profile[] {
  try {
    const data = localStorage.getItem(PROFILE_STORAGE_KEY)
    if (data) {
      const parsed = JSON.parse(data) as Profile[]
      if (parsed.length > 0) return parsed
    }
  } catch {
    // ignore
  }
  // 처음 실행: 기본 프로필 생성 + 구형 데이터 마이그레이션
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
 * - 새로고침 후 Firestore 동기화로 프로필 목록이 바뀌어도 버튼이 사라지지 않음
 */
function loadActiveProfileId(profiles: Profile[]): string {
  const stored = localStorage.getItem(CURRENT_PROFILE_KEY) ?? DEFAULT_PROFILE_ID
  if (profiles.find((p) => p.id === stored)) return stored
  // 저장된 ID가 목록에 없음 → 첫 번째 프로필로 교정
  const fallback = profiles[0]?.id ?? DEFAULT_PROFILE_ID
  localStorage.setItem(CURRENT_PROFILE_KEY, fallback)
  return fallback
}

// ───── 스토어 ─────
export const useProfileStore = create<ProfileState>((set, get) => {
  const _profiles = loadProfiles()
  const _activeId  = loadActiveProfileId(_profiles)
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
  },

  updateProfile: (id, updates) => {
    const profiles = get().profiles.map((p) =>
      p.id === id ? { ...p, ...updates } : p
    )
    saveProfiles(profiles)
    set({ profiles })
  },

  deleteProfile: (id) => {
    if (id === DEFAULT_PROFILE_ID) return // 기본 프로필 삭제 불가
    const profiles = get().profiles.filter((p) => p.id !== id)
    // 해당 프로필 데이터 삭제
    localStorage.removeItem(getProfileStorageKey(id, 'transactions'))
    localStorage.removeItem(getProfileStorageKey(id, 'budgets'))
    saveProfiles(profiles)

    // 삭제된 프로필이 활성이었다면 기본으로 전환
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
    // 각 스토어에 프로필 전환 알림 (동적 import 방지: 전역 이벤트 사용)
    window.dispatchEvent(new CustomEvent('profile-switch', { detail: { profileId: id } }))
  },

  getActiveProfile: () => {
    const { profiles, activeProfileId } = get()
    const found = profiles.find((p) => p.id === activeProfileId)
    if (!found && profiles.length > 0) {
      // 런타임에 ID 불일치 감지 → 첫 번째 프로필로 자동 교정
      const fallback = profiles[0]
      localStorage.setItem(CURRENT_PROFILE_KEY, fallback.id)
      set({ activeProfileId: fallback.id })
      return fallback
    }
    return found
  },
  }
})
