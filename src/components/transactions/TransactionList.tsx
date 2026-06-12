import { useState } from 'react'
import type { Transaction } from '@/types'
import { useGroupedTransactions } from '@/hooks/useFilteredTransactions'
import { useTransactionStore } from '@/store/transactionStore'
import { TransactionItem } from './TransactionItem'
import { TransactionForm } from './TransactionForm'
import { Modal } from '@/components/ui/Modal'
import { formatDateWithDay, formatCurrency } from '@/utils/formatters'

interface TransactionListProps {
  yearMonth?: string
  limit?: number
}

export function TransactionList({ yearMonth, limit }: TransactionListProps) {
  const groupedTransactions = useGroupedTransactions(yearMonth)
  const { updateTransaction, deleteTransaction } = useTransactionStore()
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

  const sortedDates = Array.from(groupedTransactions.keys()).sort((a, b) =>
    b.localeCompare(a)
  )

  const displayDates = limit ? sortedDates.slice(0, limit) : sortedDates

  if (displayDates.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="text-5xl mb-3">📭</div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">거래 내역이 없습니다</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {displayDates.map((date) => {
          const items = groupedTransactions.get(date) ?? []
          const dayIncome = items
            .filter((t) => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0)
          const dayExpense = items
            .filter((t) => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0)

          return (
            <div key={date} className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              {/* 날짜 헤더 */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-700/30">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {formatDateWithDay(date)}
                </span>
                <div className="flex items-center gap-3 text-xs">
                  {dayIncome > 0 && (
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      +{formatCurrency(dayIncome)}
                    </span>
                  )}
                  {dayExpense > 0 && (
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      -{formatCurrency(dayExpense)}
                    </span>
                  )}
                </div>
              </div>

              {/* 거래 목록 */}
              <div className="divide-y divide-gray-50 dark:divide-gray-700/50 px-1">
                {items.map((t) => (
                  <TransactionItem
                    key={t.id}
                    transaction={t}
                    onEdit={setEditingTransaction}
                    onDelete={deleteTransaction}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* 수정 모달 */}
      <Modal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        title="거래 수정"
      >
        {editingTransaction && (
          <TransactionForm
            initial={editingTransaction}
            onSubmit={(data) => {
              updateTransaction(editingTransaction.id, data)
              setEditingTransaction(null)
            }}
            onCancel={() => setEditingTransaction(null)}
          />
        )}
      </Modal>
    </>
  )
}
