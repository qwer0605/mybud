import { useState, useMemo } from 'react'
import type { RecurringTransaction } from '@/types'
import { useRecurringStore } from '@/store/recurringStore'
import { useTransactionStore } from '@/store/transactionStore'
import { getYearMonth, formatCurrency } from '@/utils/formatters'
import { Modal } from '@/components/ui/Modal'
import { RecurringForm } from '@/components/recurring/RecurringForm'
import clsx from 'clsx'

interface RecurringSectionProps {
  yearMonth: string
}

export function RecurringSection({ yearMonth }: RecurringSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editItem, setEditItem] = useState<RecurringTransaction | null>(null)

  const { recurring, addRecurring, updateRecurring, deleteRecurring, toggleActive, registerToMonth } =
    useRecurringStore()
  const { transactions } = useTransactionStore()

  const [, monthStr] = yearMonth.split('-')
  const month = parseInt(monthStr)

  // 해당 월에 등록된 recurringId 집합 (transactions 변경 시 재계산)
  const registeredIds = useMemo(() => {
    const ids = new Set<string>()
    for (const t of transactions) {
      if (getYearMonth(t.date) === yearMonth && t.recurringId) {
        ids.add(t.recurringId)
      }
    }
    return ids
  }, [transactions, yearMonth])

  // 해당 월에 적용되는 활성 항목
  const relevantItems = useMemo(
    () =>
      recurring.filter(
        (r) =>
          r.isActive &&
          (r.period === 'monthly' || (r.period === 'yearly' && r.monthOfYear === month))
      ),
    [recurring, month]
  )

  const inactiveCount = recurring.filter((r) => !r.isActive).length
  const otherMonthCount = recurring.filter(
    (r) => r.isActive && r.period === 'yearly' && r.monthOfYear !== month
  ).length
  const unregisteredCount = relevantItems.filter((r) => !registeredIds.has(r.id)).length
  const totalAmount = relevantItems.reduce((sum, r) => {
    return r.type === 'expense' ? sum + r.amount : sum - r.amount
  }, 0)

  const handleRegisterAll = () => {
    registerToMonth(yearMonth)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* 헤더 */}
      <button
        type="button"
        className="w-full flex items-center justify-between p-4 text-left"
        onClick={() => setIsExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
            <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            고정비
          </span>
          {recurring.length > 0 && (
            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
              {relevantItems.length}개
            </span>
          )}
          {unregisteredCount > 0 && (
            <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
              {unregisteredCount}개 미등록
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {relevantItems.length > 0 && (
            <span className={clsx(
              'text-xs font-semibold',
              totalAmount > 0 ? 'text-red-500' : 'text-green-500'
            )}>
              {totalAmount > 0 ? '-' : '+'}{formatCurrency(Math.abs(totalAmount))}
            </span>
          )}
          <svg
            className={clsx('w-4 h-4 text-gray-400 transition-transform', isExpanded && 'rotate-180')}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-100 dark:border-gray-700">
          {recurring.length === 0 ? (
            /* 항목 없음 */
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-3">
                월세, 구독 서비스 등 고정 지출을 등록해보세요
              </p>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsAddOpen(true) }}
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                고정비 추가하기
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-1">
              {relevantItems.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-2">
                  이번 달에 해당하는 고정비가 없습니다
                </p>
              ) : (
                relevantItems.map((item) => (
                  <RecurringItem
                    key={item.id}
                    item={item}
                    isRegistered={registeredIds.has(item.id)}
                    onEdit={() => setEditItem(item)}
                    onToggle={() => toggleActive(item.id)}
                  />
                ))
              )}

              {/* 비활성 / 다른 달 안내 */}
              {(inactiveCount > 0 || otherMonthCount > 0) && (
                <p className="text-xs text-gray-400 dark:text-gray-500 pt-2 pb-1">
                  {[
                    inactiveCount > 0 && `비활성 ${inactiveCount}개`,
                    otherMonthCount > 0 && `다른 달 ${otherMonthCount}개`,
                  ]
                    .filter(Boolean)
                    .join(' · ')}{' '}
                  숨김
                </p>
              )}

              {/* 전체 등록 완료 */}
              {relevantItems.length > 0 && unregisteredCount === 0 && (
                <div className="flex items-center justify-center gap-1.5 py-2.5 text-xs text-green-600 dark:text-green-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  이번 달 고정비 모두 등록됨
                </div>
              )}

              {/* 미등록 일괄 등록 버튼 */}
              {unregisteredCount > 0 && (
                <button
                  type="button"
                  onClick={handleRegisterAll}
                  className="w-full mt-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                >
                  이번 달 미등록 {unregisteredCount}개 거래에 추가
                </button>
              )}
            </div>
          )}

          {/* 하단 추가 버튼 */}
          <div className="px-4 pb-4">
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="w-full py-2 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              + 고정비 추가
            </button>
          </div>
        </div>
      )}

      {/* 추가 모달 */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="고정비 추가">
        <RecurringForm
          onSubmit={(data) => { addRecurring(data); setIsAddOpen(false) }}
          onCancel={() => setIsAddOpen(false)}
        />
      </Modal>

      {/* 수정 모달 */}
      {editItem && (
        <Modal isOpen onClose={() => setEditItem(null)} title="고정비 수정">
          <RecurringForm
            initial={editItem}
            onSubmit={(data) => { updateRecurring(editItem.id, data); setEditItem(null) }}
            onCancel={() => setEditItem(null)}
            onDelete={() => { deleteRecurring(editItem.id); setEditItem(null) }}
          />
        </Modal>
      )}
    </div>
  )
}

// ─── 개별 항목 행 ───
interface RecurringItemProps {
  item: RecurringTransaction
  isRegistered: boolean
  onEdit: () => void
  onToggle: () => void
}

function RecurringItem({ item, isRegistered, onEdit, onToggle }: RecurringItemProps) {
  const periodLabel =
    item.period === 'yearly'
      ? `매년 ${item.monthOfYear}월 ${item.dayOfMonth}일`
      : `매월 ${item.dayOfMonth}일`

  const paymentIcon =
    item.paymentMethod === 'card' ? '💳' : item.paymentMethod === 'transfer' ? '🏦' : ''

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
      {/* 활성 토글 */}
      <button
        type="button"
        onClick={onToggle}
        className={clsx(
          'w-4 h-4 rounded-full flex-shrink-0 transition-colors',
          item.isActive ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
        )}
        title={item.isActive ? '비활성화' : '활성화'}
      />

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {item.name}
          </span>
          <span
            className={clsx(
              'text-xs font-semibold flex-shrink-0',
              item.type === 'expense' ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'
            )}
          >
            {item.type === 'expense' ? '-' : '+'}{formatCurrency(item.amount)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-400 dark:text-gray-500">
          <span>{periodLabel}</span>
          {paymentIcon && <span>{paymentIcon}</span>}
        </div>
      </div>

      {/* 상태 배지 */}
      <span
        className={clsx(
          'flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium',
          isRegistered
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
        )}
      >
        {isRegistered ? '등록됨' : '미등록'}
      </span>

      {/* 수정 버튼 */}
      <button
        type="button"
        onClick={onEdit}
        className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
    </div>
  )
}
