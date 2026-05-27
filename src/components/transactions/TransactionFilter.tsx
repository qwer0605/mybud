import { useTransactionStore } from '@/store/transactionStore'
import { EXPENSE_MAIN_CATEGORIES, INCOME_MAIN_CATEGORIES } from '@/utils/constants'
import clsx from 'clsx'

export function TransactionFilterBar() {
  const { filter, setFilter, resetFilter } = useTransactionStore()

  const hasActiveFilter =
    filter.type !== 'all' ||
    filter.mainCategory !== 'all' ||
    filter.startDate !== '' ||
    filter.endDate !== '' ||
    filter.searchText !== ''

  const mainCategories =
    filter.type === 'income'
      ? INCOME_MAIN_CATEGORIES
      : filter.type === 'expense'
      ? EXPENSE_MAIN_CATEGORIES
      : [...EXPENSE_MAIN_CATEGORIES, ...INCOME_MAIN_CATEGORIES]

  return (
    <div className="space-y-3">
      {/* 검색 */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={filter.searchText}
          onChange={(e) => setFilter({ searchText: e.target.value })}
          placeholder="메모, 카테고리 검색..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 유형 필터 */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {(['all', 'expense', 'income'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter({ type: t, mainCategory: 'all' })}
            className={clsx(
              'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              filter.type === t
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            )}
          >
            {t === 'all' ? '전체' : t === 'income' ? '수입' : '지출'}
          </button>
        ))}
        <div className="w-px bg-gray-200 dark:bg-gray-600 mx-1 flex-shrink-0" />
        {mainCategories.map((cat) => (
          <button
            key={cat}
            onClick={() =>
              setFilter({ mainCategory: filter.mainCategory === cat ? 'all' : cat })
            }
            className={clsx(
              'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              filter.mainCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 날짜 범위 */}
      <div className="flex gap-2 items-center">
        <input
          type="date"
          value={filter.startDate}
          onChange={(e) => setFilter({ startDate: e.target.value })}
          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-gray-400 text-xs flex-shrink-0">~</span>
        <input
          type="date"
          value={filter.endDate}
          onChange={(e) => setFilter({ endDate: e.target.value })}
          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {hasActiveFilter && (
          <button
            onClick={resetFilter}
            className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            초기화
          </button>
        )}
      </div>
    </div>
  )
}
