import { useState, useEffect } from 'react'
import type {
  RecurringTransaction,
  RecurringFormData,
  TransactionType,
  PaymentMethod,
  RecurringPeriod,
} from '@/types'
import { useCategoryStore } from '@/store/categoryStore'
import { useAssetStore } from '@/store/assetStore'
import { formatAmountInput } from '@/utils/formatters'
import { Button } from '@/components/ui/Button'
import clsx from 'clsx'

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'cash', label: '현금', icon: '💵' },
  { value: 'card', label: '카드', icon: '💳' },
  { value: 'transfer', label: '계좌이체', icon: '🏦' },
]

const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
const DAYS = Array.from({ length: 28 }, (_, i) => i + 1)

interface RecurringFormProps {
  initial?: RecurringTransaction
  onSubmit: (data: RecurringFormData) => void
  onCancel: () => void
  onDelete?: () => void
}

export function RecurringForm({ initial, onSubmit, onCancel, onDelete }: RecurringFormProps) {
  const { expenseTree, incomeTree, expenseMeta, incomeMeta } = useCategoryStore()
  const { accounts } = useAssetStore()

  const [type, setType] = useState<TransactionType>(initial?.type ?? 'expense')
  const [name, setName] = useState(initial?.name ?? '')
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [mainCategory, setMainCategory] = useState(initial?.mainCategory ?? '')
  const [subCategory, setSubCategory] = useState(initial?.subCategory ?? '')
  const [period, setPeriod] = useState<RecurringPeriod>(initial?.period ?? 'monthly')
  const [dayOfMonth, setDayOfMonth] = useState(String(initial?.dayOfMonth ?? 1))
  const [monthOfYear, setMonthOfYear] = useState(String(initial?.monthOfYear ?? 1))
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initial?.paymentMethod ?? 'cash')
  const [cardAccountId, setCardAccountId] = useState(initial?.cardAccountId ?? '')
  const [memo, setMemo] = useState(initial?.memo ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [confirmDelete, setConfirmDelete] = useState(false)

  const categoryTree = type === 'expense' ? expenseTree : incomeTree
  const mainCategoryMeta = type === 'expense' ? expenseMeta : incomeMeta
  const mainCategories = Object.keys(categoryTree)

  useEffect(() => {
    if (!initial) {
      const tree = type === 'expense' ? expenseTree : incomeTree
      const cats = Object.keys(tree)
      const first = cats[0] ?? ''
      setMainCategory(first)
      setSubCategory(tree[first]?.[0] ?? '')
    }
  }, [type, initial, expenseTree, incomeTree])

  useEffect(() => {
    if (!initial && !mainCategory && mainCategories[0]) {
      setMainCategory(mainCategories[0])
      setSubCategory(categoryTree[mainCategories[0]]?.[0] ?? '')
    }
  }, [mainCategories, categoryTree, mainCategory, initial])

  const handleMainCategoryChange = (main: string) => {
    setMainCategory(main)
    setSubCategory(categoryTree[main]?.[0] ?? '')
  }

  const handleTypeChange = (t: TransactionType) => {
    setType(t)
    if (t === 'income') {
      setPaymentMethod('cash')
      setCardAccountId(accounts.find((a) => !a.isLiability)?.id ?? '')
    } else {
      setCardAccountId('')
    }
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = '이름을 입력해주세요'
    if (!amount || parseInt(amount.replace(/[^0-9]/g, '')) <= 0) errs.amount = '금액을 입력해주세요'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      name,
      type,
      amount,
      mainCategory,
      subCategory,
      period,
      dayOfMonth,
      monthOfYear,
      paymentMethod,
      cardAccountId,
      memo,
    })
  }

  const currentSubCategories = categoryTree[mainCategory] ?? []

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 수입/지출 */}
      <div className="flex gap-2 p-1 bg-cream-100 dark:bg-gray-700 rounded-xl">
        {(['expense', 'income'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => handleTypeChange(t)}
            className={clsx(
              'flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-150',
              type === t
                ? t === 'income'
                  ? 'bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {t === 'income' ? '수입' : '지출'}
          </button>
        ))}
      </div>

      {/* 이름 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          이름 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 넷플릭스, 월세, 보험료"
          maxLength={50}
          className={clsx(
            'w-full px-4 py-3 rounded-xl border',
            'bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-primary-400 transition-shadow',
            errors.name ? 'border-red-300 dark:border-red-600' : 'border-cream-200 dark:border-gray-600'
          )}
        />
        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
      </div>

      {/* 금액 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          금액 <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₩</span>
          <input
            type="text"
            inputMode="numeric"
            value={formatAmountInput(amount)}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="0"
            className={clsx(
              'w-full pl-8 pr-4 py-3 rounded-xl border text-right text-lg font-semibold',
              'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
              'focus:outline-none focus:ring-2 focus:ring-primary-400 transition-shadow',
              errors.amount ? 'border-red-300 dark:border-red-600' : 'border-cream-200 dark:border-gray-600'
            )}
          />
        </div>
        {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount}</p>}
      </div>

      {/* 대분류 */}
      {mainCategories.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">대분류</label>
          <div className="grid grid-cols-4 gap-2">
            {mainCategories.map((cat) => {
              const m = mainCategoryMeta[cat]
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleMainCategoryChange(cat)}
                  className={clsx(
                    'flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-medium transition-all duration-150',
                    mainCategory === cat
                      ? 'ring-2 ring-primary-400 bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                      : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-cream-100 dark:hover:bg-gray-600'
                  )}
                >
                  <span className="text-xl">{m?.icon ?? '📦'}</span>
                  <span className="leading-tight text-center break-keep">{cat}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 소분류 */}
      {currentSubCategories.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">소분류</label>
          <div className="flex flex-wrap gap-2">
            {currentSubCategories.map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => setSubCategory(sub)}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border',
                  subCategory === sub
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-cream-200 dark:border-gray-600 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400'
                )}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 반복 주기 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">반복 주기</label>
        <div className="flex gap-2">
          {(['monthly', 'yearly'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={clsx(
                'flex-1 py-2 rounded-xl text-sm font-medium transition-all border',
                period === p
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-cream-200 dark:border-gray-600'
              )}
            >
              {p === 'monthly' ? '매월' : '매년'}
            </button>
          ))}
        </div>
      </div>

      {/* 결제일 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">결제일</label>
        <div className="flex items-center gap-2">
          {period === 'yearly' && (
            <select
              value={monthOfYear}
              onChange={(e) => setMonthOfYear(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-xl border border-cream-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              {MONTHS.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          )}
          <select
            value={dayOfMonth}
            onChange={(e) => setDayOfMonth(e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-xl border border-cream-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            {DAYS.map((d) => (
              <option key={d} value={d}>{d}일</option>
            ))}
          </select>
        </div>
      </div>

      {/* 결제수단 (지출) */}
      {type === 'expense' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">결제수단</label>
          <div className="flex gap-2 mb-2">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => { setPaymentMethod(m.value); setCardAccountId('') }}
                className={clsx(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium border transition-all',
                  paymentMethod === m.value
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-cream-200 dark:border-gray-600'
                )}
              >
                <span>{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
          {accounts.length > 0 && (paymentMethod === 'card' || paymentMethod === 'transfer') && (
            <select
              value={cardAccountId}
              onChange={(e) => setCardAccountId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-cream-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              <option value="">연동 안함</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.isLiability ? '💳 ' : '🏦 '}{a.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* 입금 계좌 (수입) */}
      {type === 'income' && accounts.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">입금 계좌</label>
          <select
            value={cardAccountId}
            onChange={(e) => setCardAccountId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-cream-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            <option value="">연동 안함</option>
            {accounts.filter((a) => !a.isLiability).map((a) => (
              <option key={a.id} value={a.id}>
                🏦 {a.name}
              </option>
            ))}
          </select>
          {cardAccountId && (
            <p className="mt-1 text-xs text-green-500 dark:text-green-400">
              💰 등록 시 수입 금액이 계좌 잔액에 추가됩니다
            </p>
          )}
        </div>
      )}

      {/* 메모 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">메모</label>
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="간단한 메모 (선택)"
          maxLength={100}
          className="w-full px-4 py-3 rounded-xl border border-cream-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-shadow"
        />
      </div>

      {/* 버튼 */}
      <div className="flex gap-3 pt-2">
        {onDelete && (
          confirmDelete ? (
            <Button type="button" variant="danger" onClick={onDelete}>
              정말 삭제
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={() => setConfirmDelete(true)}>
              삭제
            </Button>
          )
        )}
        <Button type="button" variant="secondary" fullWidth onClick={onCancel}>취소</Button>
        <Button type="submit" variant="primary" fullWidth>
          {initial ? '수정 완료' : '추가하기'}
        </Button>
      </div>
    </form>
  )
}
