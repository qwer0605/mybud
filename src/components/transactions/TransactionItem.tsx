import { useState } from 'react'
import type { Transaction } from '@/types'
import { getMainCategoryMeta } from '@/utils/constants'
import { formatCurrency } from '@/utils/formatters'
import clsx from 'clsx'

interface TransactionItemProps {
  transaction: Transaction
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string) => void
}

export function TransactionItem({ transaction, onEdit, onDelete }: TransactionItemProps) {
  const [showActions, setShowActions] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const meta = getMainCategoryMeta(transaction.mainCategory)

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(transaction.id)
    } else {
      setConfirmDelete(true)
    }
  }

  return (
    <div
      className="flex items-center gap-3 p-3.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group"
      onClick={() => setShowActions(!showActions)}
    >
      {/* 카테고리 아이콘 */}
      <div
        className={clsx(
          'flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl',
          meta?.bgColor ?? 'bg-gray-100 dark:bg-gray-700'
        )}
      >
        {meta?.icon ?? '📦'}
      </div>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {transaction.memo || transaction.subCategory}
          </span>
        </div>
        {/* 대분류 > 소분류 + 결제수단 */}
        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {transaction.mainCategory}
          </span>
          <span className="text-xs text-gray-300 dark:text-gray-600">›</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {transaction.subCategory}
          </span>
          {transaction.type === 'expense' && transaction.paymentMethod && transaction.paymentMethod !== 'cash' && (
            <span className={clsx(
              'text-xs px-1.5 py-0.5 rounded-full font-medium',
              transaction.paymentMethod === 'card'
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
            )}>
              {transaction.paymentMethod === 'card' ? '💳 카드' : '🏦 이체'}
            </span>
          )}
        </div>
      </div>

      {/* 금액 */}
      <div className="flex-shrink-0 text-right">
        <span
          className={clsx(
            'text-sm font-semibold',
            transaction.type === 'income'
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          )}
        >
          {transaction.type === 'income' ? '+' : '-'}
          {formatCurrency(transaction.amount)}
        </span>
      </div>

      {/* 액션 버튼 (클릭 시 표시) */}
      {showActions && (
        <div
          className="flex-shrink-0 flex gap-1 ml-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              onEdit(transaction)
              setShowActions(false)
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:text-primary-400 dark:hover:bg-primary-900/30 transition-colors"
            aria-label="수정"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            onBlur={() => setConfirmDelete(false)}
            className={clsx(
              'p-1.5 rounded-lg transition-colors',
              confirmDelete
                ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                : 'text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/30'
            )}
            aria-label={confirmDelete ? '삭제 확인' : '삭제'}
          >
            {confirmDelete ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
