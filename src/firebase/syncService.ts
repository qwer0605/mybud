/**
 * Firestore 동기화 서비스
 *
 * 동기화 전략:
 * - 로그인 시: Firestore → localStorage 풀 다운로드 → 스토어 재로드
 * - 데이터 변경 시: localStorage 저장 후 Firestore에도 즉시 upsert (fire-and-forget)
 * - 오프라인 시: localStorage에만 저장 (Firestore 오류 무시)
 *
 * Firestore 경로:
 *   users/{uid}/profiles/{profileId}/transactions/{id}
 *   users/{uid}/profiles/{profileId}/budgets/{id}
 *   users/{uid}/profiles/{profileId}/assets/{id}
 *   users/{uid}/profileList/data
 *   users/{uid}/settings/categories
 */

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  writeBatch,
  onSnapshot,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from './config'
import { getProfileStorageKey } from '@/utils/constants'
import { applyInitialAmountMigration } from '@/utils/assetMigration'
import type { Transaction, MonthlyBudget, AssetAccount } from '@/types'
import type { Profile } from '@/store/profileStore'
import type { CategoryStoreData } from '@/store/categoryStore'

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

function categoriesDoc(uid: string) {
  if (!db) throw new Error('Firestore not initialized')
  return doc(db, 'users', uid, 'settings', 'categories')
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

// ───── 프로필 목록 업로드 ─────
export async function syncProfileList(uid: string, profiles: Profile[]): Promise<void> {
  if (!isFirebaseConfigured || !db) return
  try {
    await setDoc(profileListDoc(uid), { profiles }, { merge: false })
  } catch (err) {
    console.warn('[Sync] syncProfileList error:', err)
  }
}

// ───── 프로필 목록 다운로드 ─────
export async function downloadProfileList(uid: string): Promise<Profile[] | null> {
  if (!isFirebaseConfigured || !db) return null
  try {
    const snap = await getDoc(profileListDoc(uid))
    if (snap.exists()) {
      const data = snap.data() as { profiles: Profile[] }
      return data.profiles ?? null
    }
  } catch (err) {
    console.warn('[Sync] downloadProfileList error:', err)
  }
  return null
}

// ───── 카테고리 업로드 ─────
export async function upsertCategories(uid: string, data: CategoryStoreData): Promise<void> {
  if (!isFirebaseConfigured || !db) return
  try {
    await setDoc(categoriesDoc(uid), { ...data, updatedAt: new Date().toISOString() })
  } catch (err) {
    console.warn('[Sync] upsertCategories error:', err)
  }
}

// ───── 카테고리 다운로드 ─────
export async function downloadCategories(uid: string): Promise<CategoryStoreData | null> {
  if (!isFirebaseConfigured || !db) return null
  try {
    const snap = await getDoc(categoriesDoc(uid))
    if (snap.exists()) {
      const data = snap.data() as CategoryStoreData & { updatedAt?: string }
      // updatedAt 필드 제거 후 반환
      const { updatedAt: _u, ...rest } = data as typeof data & { updatedAt?: string }
      void _u
      return rest as CategoryStoreData
    }
  } catch (err) {
    console.warn('[Sync] downloadCategories error:', err)
  }
  return null
}

// ───── 로그인 시: Firestore → localStorage 다운로드 ─────
export async function downloadFromFirestore(uid: string, profiles: Profile[]): Promise<boolean> {
  if (!isFirebaseConfigured || !db) return false
  let hasData = false
  try {
    for (const profile of profiles) {
      // transactions
      const txSnap = await getDocs(profileDataCol(uid, profile.id, 'transactions'))
      const txData: Transaction[] = []
      txSnap.forEach((d) => txData.push(d.data() as Transaction))
      if (txData.length > 0) {
        localStorage.setItem(getProfileStorageKey(profile.id, 'transactions'), JSON.stringify(txData))
        hasData = true
      }

      // budgets
      const bdSnap = await getDocs(profileDataCol(uid, profile.id, 'budgets'))
      const bdData: MonthlyBudget[] = []
      bdSnap.forEach((d) => bdData.push(d.data() as MonthlyBudget))
      if (bdData.length > 0) {
        localStorage.setItem(getProfileStorageKey(profile.id, 'budgets'), JSON.stringify(bdData))
        hasData = true
      }

      // assets
      const asSnap = await getDocs(profileDataCol(uid, profile.id, 'assets'))
      const asData: AssetAccount[] = []
      asSnap.forEach((d) => asData.push(d.data() as AssetAccount))
      if (asData.length > 0) {
        // initialAmount 마이그레이션 적용 (구버전 Firestore 데이터 덮어쓰기 방지)
        const { migrated, changedIds } = applyInitialAmountMigration(asData)
        localStorage.setItem(getProfileStorageKey(profile.id, 'assets'), JSON.stringify(migrated))
        hasData = true
        // 마이그레이션된 계좌를 Firestore에 재업로드 (fire-and-forget)
        if (changedIds.length > 0 && db) {
          const updatedMap = new Map(migrated.map((a) => [a.id, a]))
          for (const id of changedIds) {
            const account = updatedMap.get(id)
            if (account) {
              upsertDocument(uid, profile.id, 'assets', id, account as unknown as Record<string, unknown>).catch(() => {})
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Sync] downloadFromFirestore error:', err)
  }
  return hasData
}

// ───── 프로필 데이터 전체 삭제 (통장 초기화 시 사용) ─────
export async function deleteProfileDataFromFirestore(uid: string, profileId: string): Promise<void> {
  if (!isFirebaseConfigured || !db) return
  try {
    const batch = writeBatch(db)
    const types: SyncType[] = ['transactions', 'budgets', 'assets']
    for (const type of types) {
      const colRef = profileDataCol(uid, profileId, type)
      const snap = await getDocs(colRef)
      snap.forEach((d) => batch.delete(d.ref))
    }
    await batch.commit()
  } catch (err) {
    console.warn('[Sync] deleteProfileDataFromFirestore error:', err)
  }
}

// ───── 실시간 리스너 (크로스 디바이스 동기화) ─────
let _unsubRealtime: (() => void) | null = null

export function subscribeRealtime(
  uid: string,
  profiles: Profile[],
  onDataUpdated: () => void,
): void {
  unsubscribeRealtime()
  if (!isFirebaseConfigured || !db) return

  const unsubs: (() => void)[] = []
  for (const profile of profiles) {
    for (const type of ['transactions', 'budgets', 'assets'] as SyncType[]) {
      try {
        const colRef = profileDataCol(uid, profile.id, type)
        const unsub = onSnapshot(
          colRef,
          (snap) => {
            // 이 기기에서 아직 서버에 반영 안 된 쓰기가 있으면 스킵
            // → 모든 로컬 쓰기가 확정된 시점의 완전한 스냅샷만 처리
            if (snap.metadata.hasPendingWrites) return
            const items = snap.docs.map((d) => d.data())
            localStorage.setItem(getProfileStorageKey(profile.id, type), JSON.stringify(items))
            onDataUpdated()
          },
          (err) => {
            console.warn(`[Sync] realtime ${type} error:`, err)
          },
        )
        unsubs.push(unsub)
      } catch (err) {
        console.warn('[Sync] subscribeRealtime error:', err)
      }
    }
  }
  _unsubRealtime = () => unsubs.forEach((u) => u())
}

export function unsubscribeRealtime(): void {
  _unsubRealtime?.()
  _unsubRealtime = null
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
