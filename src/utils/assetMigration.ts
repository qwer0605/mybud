/**
 * 자산 계좌 기초잔액(initialAmount) 마이그레이션
 *
 * Direction B 도입 이전에 등록된 계좌에는 initialAmount 필드가 없습니다.
 * 이 함수는 모든 프로필을 순회하며 initialAmount가 없는 계좌에
 * 현재 amount 값을 기초잔액으로 일괄 설정합니다.
 *
 * - 멱등(idempotent): initialAmount가 이미 있으면 건드리지 않음
 * - 모임통장 등 비활성 프로필도 포함
 */

import { PROFILE_STORAGE_KEY, getProfileStorageKey, DEFAULT_PROFILE_ID } from '@/utils/constants'
import type { AssetAccount } from '@/types'

export interface MigrationResult {
  profileId: string
  accounts: AssetAccount[]          // 마이그레이션된 전체 목록
  changedIds: string[]              // Firestore 재업로드가 필요한 계좌 ID
}

export function migrateInitialAmounts(): MigrationResult[] {
  const results: MigrationResult[] = []

  // 마이그레이션할 프로필 ID 목록 수집 (저장된 프로필 + default)
  const profileIds = new Set<string>([DEFAULT_PROFILE_ID])
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY)
    if (raw) {
      const profiles = JSON.parse(raw) as { id: string }[]
      profiles.forEach((p) => profileIds.add(p.id))
    }
  } catch { /* ignore */ }

  for (const profileId of profileIds) {
    const key = getProfileStorageKey(profileId, 'assets')
    const raw = localStorage.getItem(key)
    if (!raw) continue

    let accounts: AssetAccount[]
    try {
      accounts = JSON.parse(raw) as AssetAccount[]
    } catch { continue }

    const changedIds: string[] = []
    const updated = accounts.map((a) => {
      if (a.initialAmount === undefined) {
        changedIds.push(a.id)
        return { ...a, initialAmount: a.amount }
      }
      return a
    })

    if (changedIds.length > 0) {
      localStorage.setItem(key, JSON.stringify(updated))
      results.push({ profileId, accounts: updated, changedIds })
    }
  }

  return results
}

/**
 * 다운로드된 자산 배열에 인메모리로 마이그레이션 적용
 * (syncService.ts 에서 Firestore 다운로드 직후 사용)
 */
export function applyInitialAmountMigration(accounts: AssetAccount[]): {
  migrated: AssetAccount[]
  changedIds: string[]
} {
  const changedIds: string[] = []
  const migrated = accounts.map((a) => {
    if (a.initialAmount === undefined) {
      changedIds.push(a.id)
      return { ...a, initialAmount: a.amount }
    }
    return a
  })
  return { migrated, changedIds }
}
