import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { TransactionList } from '@/components/transactions/TransactionList'
import { TransactionFilterBar } from '@/components/transactions/TransactionFilter'
import { useTransactionStore } from '@/store/transactionStore'
import { useFilteredTransactions } from '@/hooks/useFilteredTransactions'
import { formatCurrency, getCurrentYearMonth, formatYearMonth } from '@/utils/formatters'

export function Transactions() {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [selectedYearMonth, setSelectedYearMonth] = useState(getCurrentYearMonth())
  const { addTransaction } = useTransactionStore()
  const filtered = useFilteredTransactions(selectedYearMonth)

  const totalIncome = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  // 월 이동
  const changeMonth = (delta: number) => {
    const [year, month] = selectedYearMonth.split('-').map(Number)
    const d = new Date(year, month - 1 + delta, 1)
    setSelectedYearMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    )
  }

  const isCurrentMonth = selectedYearMonth === getCurrentYearMonth()

  return (
    <div className="space-y-5">
      <Header
        title="거래 내역"
        action={
          <Button size="sm" onClick={() => setIsAddOpen(true)}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            추가
          </Button>
        }
      />

      {/* 월 선택 */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
        <button
          onClick={() => changeMonth(-1)}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <span className="text-base font-semibold text-gray-900 dark:text-white">
            {formatYearMonth(selectedYearMonth)}
          </span>
          <div className="flex gap-4 mt-1 justify-center text-xs">
            <span className="text-green-600 dark:text-green-400">+{formatCurrency(totalIncome)}</span>
            <span className="text-red-600 dark:text-red-400">-{formatCurrency(totalExpense)}</span>
          </div>
        </div>
        <button
          onClick={() => changeMonth(1)}
          disabled={isCurrentMonth}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400 disabled:opacity-30"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 필터 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
        <TransactionFilterBar />
      </div>

      {/* 거래 목록 */}
      <TransactionList yearMonth={selectedYearMonth} />

      {/* 추가 모달 */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="거래 추가">
        <TransactionForm
          onSubmit={(data) => {
            addTransaction(data)
            setIsAddOpen(false)
          }}
          onCancel={() => setIsAddOpen(false)}
        />
      </Modal>
    </div>
  )
}
