import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { MonthlyStats } from '@/types'
import { formatYearMonth } from '@/utils/formatters'

interface BalanceLineChartProps {
  data: MonthlyStats[]
}

function formatAxisAmount(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(0)}백만`
  if (value >= 10000) return `${(value / 10000).toFixed(0)}만`
  return String(value)
}

export function BalanceLineChart({ data }: BalanceLineChartProps) {
  const chartData = data.map((d) => ({
    month: formatYearMonth(d.yearMonth).replace('년 ', '.').replace('월', ''),
    잔액: d.balance,
  }))

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatAxisAmount}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          width={45}
        />
        <Tooltip
          formatter={(value: number) => [`₩${value.toLocaleString('ko-KR')}`, '잔액']}
          labelStyle={{ fontSize: 12, fontWeight: 600, color: '#374151' }}
          contentStyle={{
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          }}
        />
        <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.5} />
        <Line
          type="monotone"
          dataKey="잔액"
          stroke="#f97316"
          strokeWidth={2.5}
          dot={{ fill: '#f97316', r: 4, strokeWidth: 2, stroke: '#fff' }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
