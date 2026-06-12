import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Header } from '@/components/layout/Header'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { WidgetContainer } from '@/components/widgets/WidgetContainer'
import { useAssetStore } from '@/store/assetStore'
import { useTransactionStore } from '@/store/transactionStore'
import { formatCurrency, getTodayString } from '@/utils/formatters'
import type { AssetAccount, AssetType, LiabilityType } from '@/types'
import clsx from 'clsx'

// ───── 자산/부채 유형 목록 ─────
const ASSET_TYPES: AssetType[] = ['현금/예금', '투자', '부동산', '연금/보험', '기타자산']
const LIABILITY_TYPES: LiabilityType[] = ['신용카드', '대출', '카드할부', '전세보증금', '기타부채']

const ASSET_TYPE_META: Record<AssetType, { icon: string; color: string; bgColor: string }> = {
  '현금/예금': { icon: '🏦', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  투자: { icon: '📈', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-900/20' },
  부동산: { icon: '🏠', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-900/20' },
  '연금/보험': { icon: '🛡️', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
  기타자산: { icon: '💼', color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-50 dark:bg-gray-700/30' },
}

const LIABILITY_TYPE_META: Record<LiabilityType, { icon: string; color: string; bgColor: string }> = {
  신용카드: { icon: '💳', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
  대출: { icon: '🏛️', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/20' },
  카드할부: { icon: '🔄', color: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-50 dark:bg-rose-900/20' },
  전세보증금: { icon: '🔑', color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-900/20' },
  기타부채: { icon: '📋', color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-50 dark:bg-gray-700/30' },
}

// ───── 금액 포맷 입력 ─────
function formatAmountInput(value: string): string {
  const num = value.replace(/[^0-9]/g, '')
  if (!num) return ''
  return Number(num).toLocaleString('ko-KR')
}

// ───── 자산/부채 추가·수정 모달 ─────
interface AccountFormData {
  name: string
  isLiability: boolean
  type: AssetType | LiabilityType
  amountStr: string        // 현재잔액
  initialAmountStr: string // 기초잔액 (수정 모드에서만 사용)
  memo: string
}

interface AccountModalProps {
  initial?: AssetAccount
  onClose: () => void
}

function AccountModal({ initial, onClose }: AccountModalProps) {
  const { addAccount, updateAccount } = useAssetStore()
  const [form, setForm] = useState<AccountFormData>({
    name: initial?.name ?? '',
    isLiability: initial?.isLiability ?? false,
    type: initial?.type ?? '현금/예금',
    amountStr: initial ? initial.amount.toLocaleString('ko-KR') : '',
    initialAmountStr: initial
      ? (initial.initialAmount ?? initial.amount).toLocaleString('ko-KR')
      : '',
    memo: initial?.memo ?? '',
  })
  const [error, setError] = useState('')

  const handleTabChange = (isLiability: boolean) => {
    setForm((f) => ({
      ...f,
      isLiability,
      type: isLiability ? '대출' : '현금/예금',
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('이름을 입력해주세요'); return }
    if (form.amountStr.trim() === '') { setError('금액을 입력해주세요'); return }
    const amount = parseInt(form.amountStr.replace(/[^0-9]/g, '')) || 0

    if (initial) {
      const initialAmount = form.initialAmountStr.trim() === ''
        ? amount
        : (parseInt(form.initialAmountStr.replace(/[^0-9]/g, '')) || 0)
      updateAccount(initial.id, {
        name: form.name.trim(),
        isLiability: form.isLiability,
        type: form.type,
        amount,
        initialAmount,
        memo: form.memo.trim(),
      })
    } else {
      addAccount({
        name: form.name.trim(),
        isLiability: form.isLiability,
        type: form.type,
        amount,
        initialAmount: amount, // 신규 등록 시 기초잔액 = 현재잔액
        memo: form.memo.trim(),
      })
    }
    onClose()
  }

  const types = form.isLiability ? LIABILITY_TYPES : ASSET_TYPES

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      {/* 자산 / 부채 탭 */}
      <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
        <button
          type="button"
          onClick={() => handleTabChange(false)}
          className={clsx(
            'flex-1 py-2.5 text-sm font-medium transition-colors',
            !form.isLiability
              ? 'bg-primary-500 text-white'
              : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
          )}
        >
          자산
        </button>
        <button
          type="button"
          onClick={() => handleTabChange(true)}
          className={clsx(
            'flex-1 py-2.5 text-sm font-medium transition-colors',
            form.isLiability
              ? 'bg-red-600 text-white'
              : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
          )}
        >
          부채
        </button>
      </div>

      {/* 유형 선택 */}
      <div>
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">유형</label>
        <div className="grid grid-cols-2 gap-2">
          {types.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setForm((f) => ({ ...f, type: t }))}
              className={clsx(
                'px-3 py-2 rounded-xl text-sm font-medium border transition-all',
                form.type === t
                  ? form.isLiability
                    ? 'bg-red-50 dark:bg-red-900/30 border-red-400 dark:border-red-500 text-red-700 dark:text-red-300'
                    : 'bg-primary-50 dark:bg-primary-900/30 border-primary-400 dark:border-primary-500 text-primary-700 dark:text-primary-300'
                  : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* 이름 */}
      <div>
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">이름</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setError('') }}
          placeholder={form.isLiability ? '예: 주택담보대출, 신용카드' : '예: 국민은행 통장, 삼성전자 주식'}
          maxLength={30}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
          autoFocus
        />
      </div>

      {/* 기초잔액 — 수정 모드에서만 표시 */}
      {initial && (
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
            기초잔액
            <span className="ml-1 font-normal text-gray-400 dark:text-gray-500">(처음 등록 금액 · 직접 수정 가능)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₩</span>
            <input
              type="text"
              inputMode="numeric"
              value={form.initialAmountStr}
              onChange={(e) => {
                setForm((f) => ({ ...f, initialAmountStr: formatAmountInput(e.target.value) }))
                setError('')
              }}
              placeholder="0"
              className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            거래 연동 이전 실제 잔액이 다르면 여기서 수정하세요
          </p>
        </div>
      )}

      {/* 현재잔액 / 현재 평가액 */}
      <div>
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
          {initial
            ? (form.isLiability ? '현재 부채 금액' : '현재잔액')
            : (form.isLiability ? '잔여 부채 금액' : '현재 평가액')}
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₩</span>
          <input
            type="text"
            inputMode="numeric"
            value={form.amountStr}
            onChange={(e) => { setForm((f) => ({ ...f, amountStr: formatAmountInput(e.target.value) })); setError('') }}
            placeholder="0"
            className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>
        {initial && (
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            거래 연동 시 자동으로 가감됩니다
          </p>
        )}
      </div>

      {/* 메모 */}
      <div>
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">메모 (선택)</label>
        <input
          type="text"
          value={form.memo}
          onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
          placeholder="메모를 입력하세요"
          maxLength={100}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          className={clsx(
            'flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-colors',
            form.isLiability ? 'bg-red-600 hover:bg-red-700' : 'bg-primary-500 hover:bg-primary-600'
          )}
        >
          {initial ? '수정' : '추가'}
        </button>
      </div>
    </form>
  )
}

// ───── 카드 납부 모달 ─────
interface CardPaymentModalProps {
  card: AssetAccount
  accounts: AssetAccount[]
  onClose: () => void
}

function CardPaymentModal({ card, accounts, onClose }: CardPaymentModalProps) {
  const { payCardBill } = useAssetStore()
  const { addTransaction } = useTransactionStore()
  const assetAccounts = accounts.filter((a) => !a.isLiability)
  const [fromId, setFromId] = useState(assetAccounts[0]?.id ?? '')
  const [amountStr, setAmountStr] = useState(
    card.amount > 0 ? card.amount.toLocaleString('ko-KR') : ''
  )
  const [error, setError] = useState('')

  const fromAccount = assetAccounts.find((a) => a.id === fromId)
  const amount = parseInt(amountStr.replace(/[^0-9]/g, '')) || 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fromId) { setError('출금 계좌를 선택해주세요'); return }
    if (amount <= 0) { setError('납부 금액을 입력해주세요'); return }
    if (fromAccount && amount > fromAccount.amount) {
      setError('출금 계좌 잔액이 부족합니다'); return
    }
    // 잔액 처리: 카드 부채 감소 + 출금 계좌 감소
    payCardBill(card.id, fromId, amount)
    // 거래 내역 기록 (계좌 연동 없이 — 잔액은 이미 위에서 처리)
    addTransaction({
      type: 'expense',
      amount: String(amount),
      mainCategory: '기타',
      subCategory: '기타',
      memo: `카드 납부 · ${card.name}`,
      date: getTodayString(),
      paymentMethod: 'transfer',
      cardAccountId: '',
      toAccountId: '',
    })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 카드 정보 */}
      <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
        <span className="text-xl">💳</span>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{card.name}</p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
            미결제 잔액 {formatCurrency(card.amount)}
          </p>
        </div>
      </div>

      {/* 출금 계좌 */}
      <div>
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
          출금 계좌
        </label>
        {assetAccounts.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">등록된 자산 계좌가 없습니다</p>
        ) : (
          <select
            value={fromId}
            onChange={(e) => { setFromId(e.target.value); setError('') }}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            {assetAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                🏦 {a.name} ({formatCurrency(a.amount)})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 납부 금액 */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">납부 금액</label>
          {card.amount > 0 && (
            <button
              type="button"
              onClick={() => { setAmountStr(card.amount.toLocaleString('ko-KR')); setError('') }}
              className="text-xs text-primary-500 dark:text-primary-400 hover:underline"
            >
              전액 ({formatCurrency(card.amount)})
            </button>
          )}
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₩</span>
          <input
            type="text"
            inputMode="numeric"
            value={amountStr}
            onChange={(e) => {
              const num = e.target.value.replace(/[^0-9]/g, '')
              setAmountStr(num ? Number(num).toLocaleString('ko-KR') : '')
              setError('')
            }}
            placeholder="0"
            autoFocus
            className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>
        {/* 납부 후 잔액 미리보기 */}
        {amount > 0 && fromAccount && (
          <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
            납부 후 →&nbsp;
            <span className="font-medium text-gray-600 dark:text-gray-300">{card.name}</span>
            &nbsp;{formatCurrency(Math.max(0, card.amount - amount))}&nbsp;/&nbsp;
            <span className="font-medium text-gray-600 dark:text-gray-300">{fromAccount.name}</span>
            &nbsp;{formatCurrency(fromAccount.amount - amount)}
          </p>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={assetAccounts.length === 0}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          납부하기
        </button>
      </div>
    </form>
  )
}

// ───── 계좌 항목 행 ─────
interface AccountRowProps {
  account: AssetAccount
  onEdit: () => void
  onDelete: () => void
  onPay?: () => void
}

function AccountRow({ account, onEdit, onDelete, onPay }: AccountRowProps) {
  const meta = account.isLiability
    ? LIABILITY_TYPE_META[account.type as LiabilityType]
    : ASSET_TYPE_META[account.type as AssetType]

  const showInitial =
    account.initialAmount !== undefined &&
    account.initialAmount !== account.amount

  return (
    <div className="flex items-center gap-3 py-3 px-1 group">
      <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0', meta.bgColor)}>
        {meta.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{account.name}</p>
        {account.memo && (
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{account.memo}</p>
        )}
        {showInitial && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            기초 {account.isLiability ? '-' : ''}
            {formatCurrency(account.initialAmount!)}
          </p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <span className={clsx(
          'text-sm font-semibold',
          account.isLiability ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
        )}>
          {account.isLiability ? '-' : ''}{formatCurrency(account.amount)}
        </span>
        {account.initialAmount !== undefined && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {showInitial ? '현재실금액' : '실금액'}
          </p>
        )}
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {/* 카드 납부 버튼 (부채 계좌만) */}
        {onPay && account.amount > 0 && (
          <button
            onClick={onPay}
            className="px-2 py-1 rounded-lg text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
            title="카드 납부"
          >
            납부
          </button>
        )}
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
          title="수정"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
          title="삭제"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ───── 유형별 섹션 ─────
interface TypeSectionProps {
  title: string
  icon: string
  bgColor: string
  accounts: AssetAccount[]
  onEdit: (a: AssetAccount) => void
  onDelete: (id: string) => void
  onPay?: (a: AssetAccount) => void
}

function TypeSection({ title, icon, bgColor, accounts, onEdit, onDelete, onPay }: TypeSectionProps) {
  if (accounts.length === 0) return null
  const total = accounts.reduce((s, a) => s + a.amount, 0)
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={clsx('w-6 h-6 rounded-lg flex items-center justify-center text-sm', bgColor)}>
            {icon}
          </span>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</span>
        </div>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{formatCurrency(total)}</span>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
        {accounts.map((a) => (
          <AccountRow
            key={a.id}
            account={a}
            onEdit={() => onEdit(a)}
            onPay={onPay ? () => onPay(a) : undefined}
            onDelete={() => {
              if (confirm(`'${a.name}'을 삭제할까요?`)) onDelete(a.id)
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ───── 메인 페이지 ─────
export function Assets() {
  const {
    accounts, snapshots,
    getTotalAssets, getTotalLiabilities, getNetWorth, deleteAccount,
    dashboardAssetTypes, toggleDashboardAssetType,
    transferBetweenAccounts,
  } = useAssetStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<AssetAccount | undefined>()
  const [transferOpen, setTransferOpen] = useState(false)
  const [payTarget, setPayTarget] = useState<AssetAccount | undefined>()

  const totalAssets = getTotalAssets()
  const totalLiabilities = getTotalLiabilities()
  const netWorth = getNetWorth()

  // 최근 6개월 스냅샷 (라인 차트용)
  const chartData = snapshots
    .slice(-6)
    .map((s) => ({
      month: s.yearMonth.slice(5) + '월',
      순자산: s.netWorth,
    }))

  // 자산 목록 (유형별 그룹)
  const assetAccounts = accounts.filter((a) => !a.isLiability)
  const liabilityAccounts = accounts.filter((a) => a.isLiability)

  const openAdd = (isLiability = false) => {
    setEditTarget(
      isLiability
        ? ({ isLiability: true } as AssetAccount)
        : undefined
    )
    setModalOpen(true)
  }

  const openEdit = (a: AssetAccount) => {
    setEditTarget(a)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditTarget(undefined)
  }

  return (
    <div className="space-y-5">
      <Header
        title="자산 관리"
        subtitle="나의 순자산 현황"
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setTransferOpen(true)}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              계좌 이체
            </Button>
            <Button size="sm" onClick={() => openAdd(false)}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              자산 추가
            </Button>
          </div>
        }
      />

      {/* 순자산 요약 (위젯 밖 — 항상 표시) */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label="총 자산" amount={totalAssets}      colorClass="text-primary-600 dark:text-primary-400"  bgClass="bg-primary-50 dark:bg-primary-900/20"  icon="🏦" />
        <SummaryCard label="총 부채" amount={totalLiabilities} colorClass="text-red-600 dark:text-red-400"    bgClass="bg-red-50 dark:bg-red-900/20"    icon="💳" />
        <SummaryCard
          label="순자산"
          amount={netWorth}
          colorClass={netWorth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
          bgClass={netWorth >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}
          icon="✨"
        />
      </div>

      <WidgetContainer
        pageId="assets"
        widgetMap={{
          /* 순자산 추이 차트 */
          'trend-chart': chartData.length > 1 ? (
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">순자산 추이</h3>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) =>
                    v >= 100000000 ? `${(v / 100000000).toFixed(1)}억`
                    : v >= 10000   ? `${(v / 10000).toFixed(0)}만`
                    : String(v)
                  } />
                  <Tooltip formatter={(v: number) => [formatCurrency(v), '순자산']}
                    contentStyle={{ backgroundColor: 'var(--tooltip-bg, #fff)', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="순자산" stroke="#f97316" strokeWidth={2.5}
                    dot={{ r: 4, fill: '#f97316' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : null,

          /* 자산 목록 */
          'assets-list': (
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">자산</h3>
                <button onClick={() => openAdd(false)} className="flex items-center gap-1.5 text-xs font-medium text-primary-500 dark:text-primary-400 hover:text-primary-600 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  자산 추가
                </button>
              </div>
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">💰 대시보드 가용자산 표시</p>
                <div className="flex flex-wrap gap-2">
                  {ASSET_TYPES.map((type) => {
                    const meta = ASSET_TYPE_META[type]
                    const isActive = dashboardAssetTypes.includes(type)
                    return (
                      <button key={type} onClick={() => toggleDashboardAssetType(type)}
                        className={clsx('flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all',
                          isActive ? 'bg-primary-500 text-white border-primary-500 shadow-sm' : 'bg-white dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-600'
                        )}
                      >
                        <span>{meta.icon}</span><span>{type}</span>
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">선택된 유형만 대시보드 가용자산에 합산됩니다</p>
              </div>
              {assetAccounts.length === 0 ? (
                <EmptyState message="등록된 자산이 없습니다" onAdd={() => openAdd(false)} />
              ) : (
                <div className="space-y-4">
                  {ASSET_TYPES.map((type) => {
                    const grouped = assetAccounts.filter((a) => a.type === type)
                    const meta = ASSET_TYPE_META[type]
                    return <TypeSection key={type} title={type} icon={meta.icon} bgColor={meta.bgColor} accounts={grouped} onEdit={openEdit} onDelete={deleteAccount} />
                  })}
                </div>
              )}
            </div>
          ),

          /* 부채 목록 */
          'liabilities-list': (
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">부채</h3>
                <button onClick={() => openAdd(true)} className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  부채 추가
                </button>
              </div>
              {liabilityAccounts.length === 0 ? (
                <EmptyState message="등록된 부채가 없습니다" onAdd={() => openAdd(true)} isLiability />
              ) : (
                <div className="space-y-4">
                  {LIABILITY_TYPES.map((type) => {
                    const grouped = liabilityAccounts.filter((a) => a.type === type)
                    const meta = LIABILITY_TYPE_META[type]
                    return (
                      <TypeSection
                        key={type}
                        title={type}
                        icon={meta.icon}
                        bgColor={meta.bgColor}
                        accounts={grouped}
                        onEdit={openEdit}
                        onDelete={deleteAccount}
                        onPay={(a) => setPayTarget(a)}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          ),
        }}
      />

      {/* 자산/부채 추가·수정 모달 */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={
          editTarget?.id
            ? editTarget.isLiability ? '부채 수정' : '자산 수정'
            : editTarget?.isLiability ? '부채 추가' : '자산 추가'
        }
      >
        <AccountModal
          initial={editTarget?.id ? editTarget : undefined}
          onClose={closeModal}
        />
      </Modal>

      {/* 계좌 이체 모달 */}
      <Modal isOpen={transferOpen} onClose={() => setTransferOpen(false)} title="계좌 이체">
        <TransferModal
          accounts={accounts}
          onTransfer={(fromId, toId, amount) => {
            transferBetweenAccounts(fromId, toId, amount)
            setTransferOpen(false)
          }}
          onClose={() => setTransferOpen(false)}
        />
      </Modal>

      {/* 카드 납부 모달 */}
      {payTarget && (
        <Modal isOpen onClose={() => setPayTarget(undefined)} title="카드 납부">
          <CardPaymentModal
            card={payTarget}
            accounts={accounts}
            onClose={() => setPayTarget(undefined)}
          />
        </Modal>
      )}
    </div>
  )
}

// ───── 계좌 이체 모달 ─────
interface TransferModalProps {
  accounts: AssetAccount[]
  onTransfer: (fromId: string, toId: string, amount: number) => void
  onClose: () => void
}

function TransferModal({ accounts, onTransfer, onClose }: TransferModalProps) {
  const [fromId, setFromId] = useState(accounts[0]?.id ?? '')
  const [toId, setToId] = useState(accounts[1]?.id ?? accounts[0]?.id ?? '')
  const [amountStr, setAmountStr] = useState('')
  const [error, setError] = useState('')

  const fromAccount = accounts.find((a) => a.id === fromId)
  const toAccount   = accounts.find((a) => a.id === toId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fromId || !toId) { setError('계좌를 선택해주세요'); return }
    if (fromId === toId)  { setError('출금 계좌와 입금 계좌가 같습니다'); return }
    const amount = parseInt(amountStr.replace(/[^0-9]/g, '')) || 0
    if (amount <= 0) { setError('이체 금액을 입력해주세요'); return }
    onTransfer(fromId, toId, amount)
  }

  const selectClass =
    'w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-400'

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      {/* 출금 계좌 */}
      <div>
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">출금 계좌</label>
        <select
          value={fromId}
          onChange={(e) => { setFromId(e.target.value); setError('') }}
          className={selectClass}
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.isLiability ? '-' : ''}{a.amount.toLocaleString('ko-KR')}원)
            </option>
          ))}
        </select>
        {fromAccount && (
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            현재 잔액 {fromAccount.isLiability ? '-' : ''}{formatCurrency(fromAccount.amount)}
          </p>
        )}
      </div>

      {/* 이체 방향 표시 */}
      <div className="flex items-center justify-center">
        <div className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          <span className="text-xs font-medium">이체</span>
        </div>
      </div>

      {/* 입금 계좌 */}
      <div>
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">입금 계좌</label>
        <select
          value={toId}
          onChange={(e) => { setToId(e.target.value); setError('') }}
          className={selectClass}
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.isLiability ? '-' : ''}{a.amount.toLocaleString('ko-KR')}원)
            </option>
          ))}
        </select>
        {toAccount && (
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            현재 잔액 {toAccount.isLiability ? '-' : ''}{formatCurrency(toAccount.amount)}
          </p>
        )}
      </div>

      {/* 이체 금액 */}
      <div>
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">이체 금액</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₩</span>
          <input
            type="text"
            inputMode="numeric"
            value={amountStr}
            onChange={(e) => { setAmountStr(formatAmountInput(e.target.value)); setError('') }}
            placeholder="0"
            autoFocus
            className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>
        {/* 이체 후 잔액 미리보기 */}
        {amountStr && fromAccount && toAccount && fromId !== toId && (() => {
          const amt = parseInt(amountStr.replace(/[^0-9]/g, '')) || 0
          if (amt <= 0) return null
          return (
            <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
              이체 후 →&nbsp;
              <span className="font-medium text-gray-600 dark:text-gray-300">{fromAccount.name}</span>
              &nbsp;{formatCurrency(fromAccount.amount - amt)}&nbsp;/&nbsp;
              <span className="font-medium text-gray-600 dark:text-gray-300">{toAccount.name}</span>
              &nbsp;{formatCurrency(toAccount.amount + amt)}
            </p>
          )
        })()}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors"
        >
          이체
        </button>
      </div>
    </form>
  )
}

// ───── 요약 카드 ─────
interface SummaryCardProps {
  label: string
  amount: number
  colorClass: string
  bgClass: string
  icon: string
}

function SummaryCard({ label, amount, colorClass, bgClass, icon }: SummaryCardProps) {
  return (
    <div className={clsx('rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-700', bgClass)}>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-base">{icon}</span>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
      </div>
      <p className={clsx('text-base font-bold leading-tight', colorClass)}>
        {formatCurrency(Math.abs(amount))}
      </p>
    </div>
  )
}

// ───── 빈 상태 ─────
function EmptyState({
  message,
  onAdd,
  isLiability = false,
}: {
  message: string
  onAdd: () => void
  isLiability?: boolean
}) {
  return (
    <div className="flex flex-col items-center py-8 gap-3">
      <p className="text-sm text-gray-400 dark:text-gray-500">{message}</p>
      <button
        onClick={onAdd}
        className={clsx(
          'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors',
          isLiability
            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40'
            : 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/40'
        )}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        {isLiability ? '부채 추가하기' : '자산 추가하기'}
      </button>
    </div>
  )
}
