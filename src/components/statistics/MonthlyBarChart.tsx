import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { MonthlyStats } from '@/types'
import { formatYearMonth } from '@/utils/formatters'

interface MonthlyBarChartProps {
  data: MonthlyStats[]
}

function formatAxisAmount(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(0)}백만`
  if (value >= 10000) return `${(value / 10000).toFixed(0)}만`
  return String(value)
}

function formatTooltipAmount(value: number): string {
  return `₩${value.toLocaleString('ko-KR')}`
}

export function MonthlyBarChart({ data }: MonthlyBarChartProps) {
  const chartData = data.map((d) => ({
    month: formatYearMonth(d.yearMonth).replace('년 ', '.').replace('월', ''),
    수입: d.totalIncome,
    지출: d.totalExpense,
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatAxisAmount}
          tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: "'Space Grotesk', sans-serif" }}
          axisLine={false}
          tickLine={false}
          width={45}
        />
        <Tooltip
          formatter={(value: number, name: string) => [
            formatTooltipAmount(value),
            name,
          ]}
          labelStyle={{ fontSize: 12, fontWeight: 600, color: '#374151' }}
          itemStyle={{ fontFamily: "'Space Grotesk', sans-serif" }}
          contentStyle={{
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: '8px' }}
          iconType="circle"
          iconSize={8}
        />
        <Bar dataKey="수입" fill="#10C57C" radius={[6, 6, 0, 0]} maxBarSize={40} />
        <Bar dataKey="지출" fill="#F0524B" radius={[6, 6, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  )
}
