import { useMemo } from 'react'
import { useTransactionStore } from '@/store/transactionStore'
import type { Transaction } from '@/types'
import { getYearMonth } from '@/utils/formatters'

export function useFilteredTransactions(yearMonth?: string): Transaction[] {
  const { transactions, filter } = useTransactionStore()

  return useMemo(() => {
    let result = [...transactions]

    // 월 필터
    if (yearMonth) {
      result = result.filter((t) => getYearMonth(t.date) === yearMonth)
    }

    // 유형 필터
    if (filter.type !== 'all') {
      result = result.filter((t) => t.type === filter.type)
    }

    // 대분류 필터
    if (filter.mainCategory !== 'all') {
      result = result.filter((t) => t.mainCategory === filter.mainCategory)
    }

    // 날짜 범위 필터
    if (filter.startDate) {
      result = result.filter((t) => t.date >= filter.startDate)
    }
    if (filter.endDate) {
      result = result.filter((t) => t.date <= filter.endDate)
    }

    // 텍스트 검색 (메모, 대분류, 소분류)
    if (filter.searchText.trim()) {
      const query = filter.searchText.trim().toLowerCase()
      result = result.filter(
        (t) =>
          t.memo.toLowerCase().includes(query) ||
          t.mainCategory.toLowerCase().includes(query) ||
          t.subCategory.toLowerCase().includes(query) ||
          String(t.amount).includes(query)
      )
    }

    // 날짜 내림차순 정렬
    return result.sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date)
      return b.createdAt.localeCompare(a.createdAt)
    })
  }, [transactions, filter, yearMonth])
}

// 날짜별로 그룹화
export function useGroupedTransactions(yearMonth?: string): Map<string, Transaction[]> {
  const filtered = useFilteredTransactions(yearMonth)

  return useMemo(() => {
    const groups = new Map<string, Transaction[]>()
    filtered.forEach((t) => {
      const existing = groups.get(t.date) ?? []
      groups.set(t.date, [...existing, t])
    })
    return groups
  }, [filtered])
}
