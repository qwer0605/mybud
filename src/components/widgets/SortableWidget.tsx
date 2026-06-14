import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useWidgetStore, PAGE_WIDGET_DEFS } from '@/store/widgetStore'
import clsx from 'clsx'

interface SortableWidgetProps {
  id: string
  pageId: string
  visible: boolean
  isEditing: boolean
  children: React.ReactNode
}

export function SortableWidget({ id, pageId, visible, isEditing, children }: SortableWidgetProps) {
  const { toggleVisible } = useWidgetStore()
  const def = (PAGE_WIDGET_DEFS[pageId] ?? []).find((d) => d.id === id)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled: !isEditing })

  const style = { transform: CSS.Transform.toString(transform), transition }

  // 일반 모드 — 래퍼 없이 바로 렌더
  if (!isEditing) return <>{children}</>

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'rounded-2xl overflow-hidden',
        isDragging && 'opacity-50 shadow-2xl relative z-50',
        !visible && 'opacity-60'
      )}
    >
      {/* ─── 드래그 바 ─── */}
      <div className="flex items-center gap-2 bg-primary-500 dark:bg-primary-700 px-3 py-2.5">
        {/* 드래그 핸들 */}
        <button
          {...attributes}
          {...listeners}
          className="flex-shrink-0 p-1 cursor-grab active:cursor-grabbing touch-none text-white/80 hover:text-white"
          aria-label="드래그"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <circle cx="7" cy="4"  r="1.5" /><circle cx="13" cy="4"  r="1.5" />
            <circle cx="7" cy="10" r="1.5" /><circle cx="13" cy="10" r="1.5" />
            <circle cx="7" cy="16" r="1.5" /><circle cx="13" cy="16" r="1.5" />
          </svg>
        </button>

        <span className="flex-1 text-sm font-semibold text-white truncate">
          {def?.label ?? id}
        </span>

        {/* 표시/숨김 토글 */}
        {def?.canHide ? (
          <button
            onClick={() => toggleVisible(pageId, id)}
            className="flex-shrink-0 p-1 text-white/80 hover:text-white transition-colors"
            aria-label={visible ? '숨기기' : '표시하기'}
          >
            {visible ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            )}
          </button>
        ) : (
          <span className="flex-shrink-0 text-xs text-white/50 pr-1">필수</span>
        )}
      </div>

      {/* ─── 위젯 내용 ─── */}
      <div className="pointer-events-none select-none">
        {visible && children != null ? (
          children
        ) : (
          <div className="bg-white dark:bg-gray-900 p-5 text-center text-sm text-gray-400 dark:text-gray-500">
            {!visible ? '숨겨진 위젯 · 눈 아이콘을 눌러 다시 표시' : '현재 내용 없음'}
          </div>
        )}
      </div>
    </div>
  )
}
