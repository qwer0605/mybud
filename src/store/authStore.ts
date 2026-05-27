import { create } from 'zustand'
import { isFirebaseConfigured, auth, googleProvider } from '@/firebase/config'
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { downloadFromFirestore, uploadToFirestore, syncProfileList } from '@/firebase/syncService'
import { PROFILE_STORAGE_KEY } from '@/utils/constants'
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
  } catch {
    // ignore
  }
  return []
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

  // Firebase 설정된 경우: onAuthStateChanged 구독
  set({ isLoading: true })
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const user = toAuthUser(firebaseUser)
      const profiles = getStoredProfiles()
      // 로그인 시 Firestore → localStorage 다운로드
      await downloadFromFirestore(user.uid, profiles)
      // 프로필 목록도 동기화
      if (profiles.length > 0) {
        syncProfileList(user.uid, profiles).catch(() => {})
      }
      set({ user, isLoading: false })
      // 로컬 데이터 → Firestore 업로드 (신규 기기)
      uploadToFirestore(user.uid, profiles).catch(() => {})
    } else {
      set({ user: null, isLoading: false })
    }
  })

  return {
    user: null,
    isLoading: true,

    signInWithGoogle: async () => {
      if (!auth || !googleProvider) return
      try {
        await signInWithPopup(auth, googleProvider)
        // onAuthStateChanged가 user 상태를 업데이트함
      } catch (err) {
        console.error('[Auth] Google sign-in error:', err)
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
