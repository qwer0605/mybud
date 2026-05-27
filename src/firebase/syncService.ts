/**
 * Firestore 동기화 서비스
 *
 * 동기화 전략:
 * - 로그인 시: Firestore → localStorage 풀 다운로드 (덮어쓰기)
 * - 데이터 변경 시: localStorage 저장 후 Firestore에도 즉시 upsert
 * - 오프라인 시: localStorage에만 저장 (단순 모드)
 *
 * Firestore 경로:
 *   users/{uid}/profiles/{profileId}/transactions/{id}
 *   users/{uid}/profiles/{profileId}/budgets/{id}
 *   users/{uid}/profiles/{profileId}/assets/{id}
 *   users/{uid}/profileList  (프로필 목록 문서)
 */

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  writeBatch,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from './config'
import { getProfileStorageKey } from '@/utils/constants'
import type { Transaction, MonthlyBudget, AssetAccount } from '@/types'
import type { Profile } from '@/store/profileStore'

type SyncType = 'transactions' | 'budgets' | 'assets'

// ───── 경로 헬퍼 ─────
function profileDataCol(uid: string, profileId: string, type: SyncType) {
  if (!db) throw new Error('Firestore not initialized')
  return collection(db, 'users', uid, 'profiles', profileId, type)
}

function profileListDoc(uid: string) {
  if (!db) throw new Error('Firestore not initialized')
  return doc(db, 'users', uid, 'profileList', 'data')
}

// ───── 단일 문서 upsert (fire-and-forget용) ─────
export async function upsertDocument(
  uid: string,
  profileId: string,
  type: SyncType,
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  if (!isFirebaseConfigured || !db) return
  try {
    const ref = doc(profileDataCol(uid, profileId, type), id)
    await setDoc(ref, data, { merge: true })
  } catch (err) {
    console.warn('[Sync] upsertDocument error:', err)
  }
}

// ───── 단일 문서 삭제 ─────
export async function deleteDocument(
  uid: string,
  profileId: string,
  type: SyncType,
  id: string
): Promise<void> {
  if (!isFirebaseConfigured || !db) return
  try {
    const ref = doc(profileDataCol(uid, profileId, type), id)
    await deleteDoc(ref)
  } catch (err) {
    console.warn('[Sync] deleteDocument error:', err)
  }
}

// ───── 프로필 목록 동기화 ─────
export async function syncProfileList(uid: string, profiles: Profile[]): Promise<void> {
  if (!isFirebaseConfigured || !db) return
  try {
    await setDoc(profileListDoc(uid), { profiles }, { merge: false })
  } catch (err) {
    console.warn('[Sync] syncProfileList error:', err)
  }
}

// ───── 로그인 시: Firestore → localStorage 다운로드 ─────
export async function downloadFromFirestore(uid: string, profiles: Profile[]): Promise<void> {
  if (!isFirebaseConfigured || !db) return
  try {
    for (const profile of profiles) {
      // transactions
      const txSnap = await getDocs(profileDataCol(uid, profile.id, 'transactions'))
      const txData: Transaction[] = []
      txSnap.forEach((d) => txData.push(d.data() as Transaction))
      if (txData.length > 0) {
        localStorage.setItem(
          getProfileStorageKey(profile.id, 'transactions'),
          JSON.stringify(txData)
        )
      }

      // budgets
      const bdSnap = await getDocs(profileDataCol(uid, profile.id, 'budgets'))
      const bdData: MonthlyBudget[] = []
      bdSnap.forEach((d) => bdData.push(d.data() as MonthlyBudget))
      if (bdData.length > 0) {
        localStorage.setItem(
          getProfileStorageKey(profile.id, 'budgets'),
          JSON.stringify(bdData)
        )
      }

      // assets
      const asSnap = await getDocs(profileDataCol(uid, profile.id, 'assets'))
      const asData: AssetAccount[] = []
      asSnap.forEach((d) => asData.push(d.data() as AssetAccount))
      if (asData.length > 0) {
        localStorage.setItem(
          getProfileStorageKey(profile.id, 'assets'),
          JSON.stringify(asData)
        )
      }
    }
  } catch (err) {
    console.warn('[Sync] downloadFromFirestore error:', err)
  }
}

// ───── 로컬 → Firestore 전체 업로드 ─────
export async function uploadToFirestore(uid: string, profiles: Profile[]): Promise<void> {
  if (!isFirebaseConfigured || !db) return
  try {
    const batch = writeBatch(db)
    for (const profile of profiles) {
      const types: SyncType[] = ['transactions', 'budgets', 'assets']
      for (const type of types) {
        const raw = localStorage.getItem(getProfileStorageKey(profile.id, type))
        if (!raw) continue
        const items = JSON.parse(raw) as Array<{ id: string }>
        for (const item of items) {
          const ref = doc(profileDataCol(uid, profile.id, type), item.id)
          batch.set(ref, item as Record<string, unknown>)
        }
      }
    }
    await batch.commit()
  } catch (err) {
    console.warn('[Sync] uploadToFirestore error:', err)
  }
}
