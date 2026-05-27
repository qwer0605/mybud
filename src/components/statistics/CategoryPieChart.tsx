import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { CategoryStats } from '@/types'
import { formatCurrency } from '@/utils/formatters'
import { EXPENSE_MAIN_CATEGORY_META } from '@/utils/constants'

interface CategoryPieChartProps {
  data: CategoryStats[]
}

interface CustomLabelProps {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  percent: number
}

const RADIAN = Math.PI / 180

function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: CustomLabelProps) {
  if (percent < 0.05) return null
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
        지출 데이터가 없습니다
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel as never}
            outerRadius={100}
            dataKey="amount"
            nameKey="mainCategory"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), '지출']}
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* 범례 */}
      <div className="space-y-2">
        {data.map((item) => {
          const meta = EXPENSE_MAIN_CATEGORY_META[item.mainCategory as keyof typeof EXPENSE_MAIN_CATEGORY_META]
          return (
            <div key={item.mainCategory} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {meta?.icon} {item.mainCategory}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 dark:text-gray-400">{item.percentage}%</span>
                <span className="text-xs font-medium text-gray-800 dark:text-gray-200 w-24 text-right">
                  {formatCurrency(item.amount)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
