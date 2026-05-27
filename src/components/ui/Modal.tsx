import { useEffect, type ReactNode } from 'react'
import clsx from 'clsx'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 모달 컨테이너 */}
      <div
        className={clsx(
          'relative w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl',
          'animate-in slide-in-from-bottom-4 duration-200',
          sizeClasses[size]
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {title && (
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
            <h2
              id="modal-title"
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="닫기"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
