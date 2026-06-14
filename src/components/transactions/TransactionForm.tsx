import { useState, useEffect } from 'react'
import type { Transaction, TransactionFormData, TransactionType, PaymentMethod, AssetAccount } from '@/types'
import { useCategoryStore } from '@/store/categoryStore'
import { useAssetStore } from '@/store/assetStore'
import { getTodayString, formatAmountInput } from '@/utils/formatters'
import { Button } from '@/components/ui/Button'
import { DatePicker } from '@/components/ui/DatePicker'
import { CategoryCoin } from '@/components/ui/CategoryCoin'
import { CategoryMainEditor } from '@/components/categories/CategoryMainEditor'
import { SubCategoryChips } from '@/components/categories/SubCategoryChips'
import clsx from 'clsx'

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'cash',     label: '현금',    icon: '💵' },
  { value: 'card',     label: '카드',    icon: '💳' },
  { value: 'transfer', label: '계좌이체', icon: '🏦' },
]

// ─── 숫자패드 키 배열 (3×4) ───
const NUMPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'del'] as const

// ─── 유형·결제수단에 맞는 기본 계좌 ID 반환 ───
function getDefaultAccountId(
  txType: TransactionType,
  method: PaymentMethod,
  accounts: AssetAccount[]
): string {
  if (accounts.length === 0) return ''
  if (txType === 'income') {
    // 수입 → 첫 번째 자산 계좌(통장)
    return accounts.find((a) => !a.isLiability)?.id ?? ''
  }
  if (method === 'card') {
    // 카드 지출 → 첫 번째 부채 계좌(신용카드), 없으면 첫 계좌
    return accounts.find((a) => a.isLiability)?.id ?? accounts[0]?.id ?? ''
  }
  // 현금/이체 지출 → 첫 번째 자산 계좌
  return accounts.find((a) => !a.isLiability)?.id ?? ''
}

interface TransactionFormProps {
  initial?: Transaction
  onSubmit: (data: TransactionFormData) => void
  onCancel: () => void
}

export function TransactionForm({ initial, onSubmit, onCancel }: TransactionFormProps) {
  const { expenseTree, incomeTree, expenseMeta, incomeMeta } = useCategoryStore()
  const { accounts } = useAssetStore()

  const initType: TransactionType   = initial?.type ?? 'expense'
  const initMethod: PaymentMethod   = initial?.paymentMethod ?? 'cash'

  const [type, setType]                   = useState<TransactionType>(initType)
  const [amount, setAmount]               = useState(initial ? String(initial.amount) : '')
  const [mainCategory, setMainCategory]   = useState<string>(initial?.mainCategory ?? '')
  const [subCategory, setSubCategory]     = useState<string>(initial?.subCategory ?? '')
  const [memo, setMemo]                   = useState(initial?.memo ?? '')
  const [date, setDate]                   = useState(initial?.date ?? getTodayString())
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initMethod)
  // 수정 모드: 기존 값 복원 / 신규: 유형·결제수단에 맞는 기본 계좌 자동 선택
  const [cardAccountId, setCardAccountId] = useState<string>(
    initial?.cardAccountId ?? getDefaultAccountId(initType, initMethod, accounts)
  )
  const [toAccountId, setToAccountId] = useState<string>(initial?.toAccountId ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 대분류 추가/수정 인라인 패널
  const [mainEditorOpen, setMainEditorOpen] = useState(false)
  const [editingMainCat, setEditingMainCat] = useState<string | null>(null) // null = 추가 모드

  // 유형(수입/지출) 변경
  const handleTypeChange = (t: TransactionType) => {
    setType(t)
    setMainEditorOpen(false)
    setEditingMainCat(null)
    if (!initial) {
      const tree = t === 'expense' ? expenseTree : incomeTree
      const first = Object.keys(tree)[0] ?? ''
      setMainCategory(first)
      setSubCategory(tree[first]?.[0] ?? '')
    }
    if (t === 'income') {
      setPaymentMethod('cash')
      setCardAccountId(getDefaultAccountId('income', 'cash', accounts))
      setToAccountId('')
    } else {
      setCardAccountId(getDefaultAccountId('expense', paymentMethod, accounts))
    }
  }

  // 결제수단 변경 → 계좌 기본값 재계산
  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method)
    setCardAccountId(getDefaultAccountId('expense', method, accounts))
    if (method !== 'transfer') setToAccountId('')
  }

  const categoryTree       = type === 'expense' ? expenseTree : incomeTree
  const mainCategoryMeta   = type === 'expense' ? expenseMeta : incomeMeta
  const mainCategories     = Object.keys(categoryTree)
  const firstMain          = mainCategories[0] ?? ''
  const firstSub           = firstMain ? (categoryTree[firstMain]?.[0] ?? '') : ''

  // 초기 대분류가 없으면 첫 번째로 설정
  useEffect(() => {
    if (!initial && !mainCategory && firstMain) {
      setMainCategory(firstMain)
      setSubCategory(firstSub)
    }
  }, [firstMain, firstSub, mainCategory, initial])

  // 대분류의 소분류 목록이 바뀌어 현재 선택값이 더 이상 유효하지 않으면 첫 번째 소분류로 보정
  useEffect(() => {
    if (!mainCategory) return
    const subs = categoryTree[mainCategory] ?? []
    if (!subs.includes(subCategory)) {
      setSubCategory(subs[0] ?? '')
    }
  }, [mainCategory, categoryTree, subCategory])

  // 대분류 변경 시 소분류 첫 번째로 리셋
  const handleMainCategoryChange = (main: string) => {
    setMainCategory(main)
    setSubCategory(categoryTree[main]?.[0] ?? '')
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!amount || parseInt(amount.replace(/[^0-9]/g, '')) <= 0)
      errs.amount = '금액을 입력해주세요'
    if (!date)
      errs.date = '날짜를 선택해주세요'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit({ type, amount, mainCategory, subCategory, memo, date, paymentMethod, cardAccountId, toAccountId })
  }

  // 숫자패드 입력
  const handleNumpadPress = (key: string) => {
    if (key === 'del') {
      setAmount((prev) => prev.slice(0, -1))
      return
    }
    setAmount((prev) => {
      const next = (prev + key).replace(/^0+(?=\d)/, '')
      return next.length > 13 ? prev : next
    })
  }

  // 키보드 직접 입력
  const handleAmountInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '')
    setAmount(digits.slice(0, 13))
  }

  const currentSubCategories = categoryTree[mainCategory] ?? []

  // 현재 연결된 계좌 정보
  const linkedAccount = accounts.find((a) => a.id === cardAccountId)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 수입/지출 선택 */}
      <div className="flex gap-2 p-1 bg-[#F4F1E9] dark:bg-gray-700 rounded-xl">
        {(['expense', 'income'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => handleTypeChange(t)}
            className={clsx(
              'flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-150',
              type === t
                ? t === 'income'
                  ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-[#F0524B] shadow-sm'
                : 'text-ink-muted dark:text-gray-400'
            )}
          >
            {t === 'income' ? '수입' : '지출'}
          </button>
        ))}
      </div>

      {/* 금액 표시 + 숫자패드 */}
      <div>
        <div className="text-center py-3">
          <div className="flex items-end justify-center gap-1">
            <span className="text-2xl font-bold text-ink dark:text-white mb-1.5">₩</span>
            <input
              type="text"
              inputMode="numeric"
              value={amount ? formatAmountInput(amount) : ''}
              onChange={handleAmountInput}
              placeholder="0"
              className="font-num text-5xl font-bold text-ink dark:text-white tracking-tight bg-transparent text-center outline-none w-full max-w-[260px]"
            />
          </div>
          {errors.amount && <p className="mt-2 text-xs text-[#F0524B]">{errors.amount}</p>}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {NUMPAD_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleNumpadPress(key)}
              className="py-3.5 rounded-xl text-lg font-semibold font-num bg-[#F4F1E9] dark:bg-gray-700 text-ink dark:text-white hover:bg-[#EAE6DC] dark:hover:bg-gray-600 active:scale-[0.97] transition-all"
            >
              {key === 'del' ? '⌫' : key}
            </button>
          ))}
        </div>
      </div>

      {/* 날짜 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          날짜 <span className="text-red-500">*</span>
        </label>
        <DatePicker value={date} onChange={setDate} error={!!errors.date} />
        {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
      </div>

      {/* 메모 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">메모</label>
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="간단한 메모를 입력하세요"
          maxLength={100}
          className="w-full px-4 py-3 rounded-xl border border-cream-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-shadow"
        />
      </div>

      {/* 대분류 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">대분류</label>
        <div className="grid grid-cols-4 gap-x-2 gap-y-4 justify-items-center">
          {mainCategories.map((cat) => {
            const m = mainCategoryMeta[cat]
            const active = mainCategory === cat
            return (
              <div key={cat} className="relative w-16">
                <button
                  type="button"
                  onClick={() => handleMainCategoryChange(cat)}
                  className="w-full flex flex-col items-center gap-1.5"
                >
                  <CategoryCoin
                    color={m?.color ?? '#94908A'}
                    emoji={m?.icon ?? '📦'}
                    size={52}
                    className={clsx(
                      'transition-all duration-150',
                      active && 'ring-2 ring-primary-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-800'
                    )}
                  />
                  <span className={clsx(
                    'block w-full text-xs font-medium leading-tight text-center break-keep',
                    active ? 'text-primary-600 dark:text-primary-400' : 'text-ink-2 dark:text-gray-400'
                  )}>
                    {cat}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => { setEditingMainCat(cat); setMainEditorOpen(true) }}
                  title="수정"
                  className="absolute -top-1 right-0 w-5 h-5 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 border border-[#EAE6DC] dark:border-gray-600 text-gray-400 hover:text-primary-500 shadow-sm transition-colors"
                >
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            )
          })}

          {/* 대분류 추가 타일 */}
          <button
            type="button"
            onClick={() => { setEditingMainCat(null); setMainEditorOpen(true) }}
            className="flex flex-col items-center gap-1.5 w-16"
          >
            <div className="w-[52px] h-[52px] rounded-[18px] border-2 border-dashed border-primary-300 dark:border-primary-700 flex items-center justify-center text-primary-500 dark:text-primary-400 text-xl">
              +
            </div>
            <span className="block w-full text-xs font-medium text-primary-500 dark:text-primary-400 text-center break-keep">추가</span>
          </button>
        </div>

        {/* 대분류 추가/수정 인라인 패널 */}
        {mainEditorOpen && (
          <div className="mt-3 p-4 rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/10">
            <CategoryMainEditor
              key={editingMainCat ?? '__new__'}
              type={type}
              editingMain={editingMainCat}
              onCancel={() => { setMainEditorOpen(false); setEditingMainCat(null) }}
              onSaved={(finalName) => {
                if (editingMainCat === null || editingMainCat === mainCategory) {
                  setMainCategory(finalName)
                }
                setMainEditorOpen(false)
                setEditingMainCat(null)
              }}
              onDeleted={() => {
                if (editingMainCat === mainCategory) {
                  const remaining = mainCategories.filter((c) => c !== editingMainCat)
                  setMainCategory(remaining[0] ?? '')
                }
                setMainEditorOpen(false)
                setEditingMainCat(null)
              }}
            />
          </div>
        )}
      </div>

      {/* 소분류 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">소분류</label>
        {mainCategory ? (
          <SubCategoryChips
            type={type}
            mainCategory={mainCategory}
            subs={currentSubCategories}
            color={mainCategoryMeta[mainCategory]?.color}
            selectable
            selectedSub={subCategory}
            onSelect={setSubCategory}
            onSubRenamed={(oldName, newName) => {
              if (subCategory === oldName) setSubCategory(newName)
            }}
            onSubDeleted={(name) => {
              if (subCategory === name) {
                const remaining = currentSubCategories.filter((s) => s !== name)
                setSubCategory(remaining[0] ?? '')
              }
            }}
          />
        ) : (
          <p className="text-xs text-gray-400 dark:text-gray-500">대분류를 먼저 선택해주세요</p>
        )}
      </div>

      {/* ── 결제수단 + 계좌 연동 ── */}
      {type === 'expense' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">결제수단</label>
          <div className="flex gap-2 mb-2">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => handlePaymentMethodChange(m.value)}
                className={clsx(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium border transition-all',
                  paymentMethod === m.value
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-cream-200 dark:border-gray-600 hover:border-primary-400'
                )}
              >
                <span>{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
          {accounts.length > 0 && (
            <div className="space-y-2">
              <AccountSelector
                label={paymentMethod === 'card' ? '카드 선택' : '출금 계좌'}
                accounts={accounts}
                value={cardAccountId}
                onChange={setCardAccountId}
                hint={
                  linkedAccount
                    ? linkedAccount.isLiability
                      ? '💳 카드 미결제 잔액이 증가합니다'
                      : '🏦 계좌 잔액이 차감됩니다'
                    : undefined
                }
              />
              {paymentMethod === 'transfer' && (
                <AccountSelector
                  label="입금 계좌"
                  accounts={accounts.filter((a) => !a.isLiability && a.id !== cardAccountId)}
                  value={toAccountId}
                  onChange={setToAccountId}
                  hint={toAccountId ? '💰 이체 금액이 계좌 잔액에 추가됩니다' : undefined}
                  hintColor="green"
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* ── 입금 계좌 (수입) ── */}
      {type === 'income' && accounts.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">입금 계좌</label>
          <AccountSelector
            accounts={accounts.filter((a) => !a.isLiability)}
            value={cardAccountId}
            onChange={setCardAccountId}
            hint={linkedAccount ? '💰 수입 금액이 계좌 잔액에 추가됩니다' : undefined}
            hintColor="green"
          />
        </div>
      )}

      {/* 버튼 */}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" fullWidth onClick={onCancel}>취소</Button>
        <Button type="submit" variant="primary" fullWidth>
          {initial ? '수정 완료' : '추가하기'}
        </Button>
      </div>
    </form>
  )
}

// ─── 계좌 선택 공용 컴포넌트 ───
interface AccountSelectorProps {
  label?: string
  accounts: AssetAccount[]
  value: string
  onChange: (id: string) => void
  hint?: string
  hintColor?: 'blue' | 'green'
}

function AccountSelector({ accounts, value, onChange, hint, hintColor = 'blue' }: AccountSelectorProps) {
  return (
    <>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl border border-cream-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
      >
        <option value="">연동 안함</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.isLiability ? '💳 ' : '🏦 '}{a.name}
            {' '}({a.isLiability ? '-' : ''}{a.amount.toLocaleString('ko-KR')}원)
          </option>
        ))}
      </select>
      {hint && (
        <p className={clsx(
          'mt-1 text-xs',
          hintColor === 'green'
            ? 'text-green-500 dark:text-green-400'
            : 'text-blue-500 dark:text-blue-400'
        )}>
          {hint}
        </p>
      )}
    </>
  )
}
