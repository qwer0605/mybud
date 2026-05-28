import { create } from 'zustand'
import { isFirebaseConfigured, auth, googleProvider } from '@/firebase/config'
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import {
  downloadFromFirestore,
  uploadToFirestore,
  syncProfileList,
  downloadProfileList,
  downloadCategories,
  upsertCategories,
} from '@/firebase/syncService'
import { PROFILE_STORAGE_KEY, CURRENT_PROFILE_KEY, getProfileStorageKey } from '@/utils/constants'
import { CATEGORY_STORAGE_KEY } from '@/store/categoryStore'
import type { Profile } from '@/store/profileStore'

interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

function toAuthUser(u: User): AuthUser {
  return {
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    photoURL: u.photoURL,
  }
}

function getStoredProfiles(): Profile[] {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Profile[]
  } catch { /* ignore */ }
  return []
}

/** Firestore에서 다운로드 후 모든 스토어에 재로드 이벤트 발송 */
function notifyStoresReload() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('firestore-data-loaded'))
  }
}

export const useAuthStore = create<AuthState>((set) => {
  // Firebase 미설정 시 항상 로컬 모드
  if (!isFirebaseConfigured || !auth) {
    return {
      user: null,
      isLoading: false,
      signInWithGoogle: async () => {},
      signOut: async () => {},
    }
  }

  // 리다이렉트 로그인 결과 처리 (iOS 등 팝업 차단 환경용)
  getRedirectResult(auth).catch(() => {})

  // Firebase 설정된 경우: onAuthStateChanged 구독
  set({ isLoading: true })
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const user = toAuthUser(firebaseUser)

      // ─── 프로필 목록: Firestore 우선, 없으면 로컬 ───
      let profiles = getStoredProfiles()
      const cloudProfiles = await downloadProfileList(user.uid)
      if (cloudProfiles && cloudProfiles.length > 0) {
        // Firestore 프로필이 있으면 로컬에 덮어씀
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(cloudProfiles))
        profiles = cloudProfiles
      }

      // ─── 카테고리: Firestore 우선, 없으면 로컬 업로드 ───
      const cloudCategories = await downloadCategories(user.uid)
      if (cloudCategories) {
        localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(cloudCategories))
      } else {
        // 로컬 카테고리를 Firestore에 올림
        try {
          const localCatRaw = localStorage.getItem(CATEGORY_STORAGE_KEY)
          if (localCatRaw) {
            upsertCategories(user.uid, JSON.parse(localCatRaw)).catch(() => {})
          }
        } catch { /* ignore */ }
      }

      // ─── 거래/예산/자산: Firestore 다운로드 ───
      const hasCloudData = await downloadFromFirestore(user.uid, profiles)
      if (hasCloudData) {
        // Firestore 데이터가 있으면 스토어 재로드 이벤트 발송
        notifyStoresReload()
      }

      // 프로필 목록 Firestore 동기화
      if (profiles.length > 0) {
        syncProfileList(user.uid, profiles).catch(() => {})
      }

      set({ user, isLoading: false })

      // 로컬 데이터 → Firestore 전체 업로드 (신규 기기 / 최초 로그인)
      if (!hasCloudData) {
        uploadToFirestore(user.uid, profiles).catch(() => {})
      }
    } else {
      // 로그아웃 시 localStorage 데이터 삭제 (재로그인 시 Firestore에서 새로 받아옴)
      // → 샘플 데이터나 이전 유저 데이터가 남지 않도록
      try {
        const profiles = getStoredProfiles()
        for (const profile of profiles) {
          localStorage.removeItem(getProfileStorageKey(profile.id, 'transactions'))
          localStorage.removeItem(getProfileStorageKey(profile.id, 'budgets'))
          localStorage.removeItem(getProfileStorageKey(profile.id, 'assets'))
        }
        localStorage.removeItem(CATEGORY_STORAGE_KEY)
      } catch { /* ignore */ }

      // 모든 스토어 화면 초기화 이벤트 발송
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('user-logged-out'))
      }
      set({ user: null, isLoading: false })
    }
  })

  return {
    user: null,
    isLoading: true,

    signInWithGoogle: async () => {
      if (!auth || !googleProvider) return
      try {
        // 팝업 방식 시도 (데스크탑/Android)
        await signInWithPopup(auth, googleProvider)
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code
        // 팝업 차단 또는 사용자가 닫은 경우 → 리다이렉트 방식으로 폴백 (iOS Safari 등)
        if (code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request') {
          try {
            await signInWithRedirect(auth, googleProvider)
          } catch (redirectErr) {
            console.error('[Auth] Redirect sign-in error:', redirectErr)
          }
        } else if (code !== 'auth/popup-closed-by-user') {
          // 사용자가 직접 닫은 경우는 오류 아님
          console.error('[Auth] Google sign-in error:', err)
        }
      }
    },

    signOut: async () => {
      if (!auth) return
      try {
        await firebaseSignOut(auth)
      } catch (err) {
        console.error('[Auth] Sign-out error:', err)
      }
    },
  }
})

/** 현재 로그인 유저 UID (스토어 외부에서 사용) */
export function getCurrentUid(): string | null {
  return useAuthStore.getState().user?.uid ?? null
}

/** 현재 로그인 유저 (스토어 외부에서 사용) */
export function getCurrentUser() {
  return useAuthStore.getState().user
}
