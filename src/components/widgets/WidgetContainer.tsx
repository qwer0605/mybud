import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useWidgetStore } from '@/store/widgetStore'
import { SortableWidget } from '@/components/widgets/SortableWidget'

interface WidgetContainerProps {
  pageId: string
  widgetMap: Record<string, React.ReactNode>
}

export function WidgetContainer({ pageId, widgetMap }: WidgetContainerProps) {
  const { getWidgets, moveWidget, editingPage, startEdit, stopEdit } = useWidgetStore()
  const isEditing = editingPage === pageId
  const widgets   = getWidgets(pageId)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      moveWidget(pageId, String(active.id), String(over.id))
    }
  }

  return (
    <div>
      {/* ─── 편집 토글 버튼 ─── */}
      <div className="flex justify-end mb-3">
        {isEditing ? (
          <button
            onClick={stopEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            편집 완료
          </button>
        ) : (
          <button
            onClick={() => startEdit(pageId)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-gray-400 dark:text-gray-500 text-xs font-medium rounded-xl hover:bg-cream-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            위젯 편집
          </button>
        )}
      </div>

      {/* ─── 정렬 가능한 위젯 목록 ─── */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={widgets.map((w) => w.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-5">
            {widgets.map((w) => {
              if (!w.visible && !isEditing) return null
              return (
                <SortableWidget
                  key={w.id}
                  id={w.id}
                  pageId={pageId}
                  visible={w.visible}
                  isEditing={isEditing}
                >
                  {widgetMap[w.id] ?? null}
                </SortableWidget>
              )
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
