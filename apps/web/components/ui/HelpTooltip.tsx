import { useState } from 'react'
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline'

interface HelpTooltipProps {
  title: string
  content: string | React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  width?: 'narrow' | 'normal' | 'wide'
  icon?: React.ReactNode
}

const positionClasses = {
  top: 'bottom-full mb-2',
  bottom: 'top-full mt-2',
  left: 'right-full mr-2',
  right: 'left-full ml-2',
}

const widthClasses = {
  narrow: 'w-48',
  normal: 'w-64',
  wide: 'w-80',
}

export default function HelpTooltip({
  title,
  content,
  position = 'top',
  width = 'normal',
  icon,
}: HelpTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        type="button"
        className="text-gray-500 hover:text-gray-700 focus:outline-none"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        aria-label={`Help: ${title}`}
      >
        {icon || <QuestionMarkCircleIcon className="w-5 h-5" />}
      </button>

      {isVisible && (
        <div
          className={`
            absolute z-50 px-4 py-3 
            bg-white rounded-lg shadow-lg border border-gray-200
            ${positionClasses[position]} ${widthClasses[width]}
          `}
          role="tooltip"
        >
          <div className="flex flex-col gap-2">
            <h3 className="font-medium text-gray-900">{title}</h3>
            <div className="text-sm text-gray-600">{content}</div>
          </div>

          {/* Tooltip Arrow */}
          <div
            className={`
              absolute w-3 h-3 bg-white border-t border-l border-gray-200
              transform rotate-45
              ${position === 'top' ? 'bottom-[-6px]' : ''}
              ${position === 'bottom' ? 'top-[-6px]' : ''}
              ${position === 'left' ? 'right-[-6px]' : ''}
              ${position === 'right' ? 'left-[-6px]' : ''}
            `}
          />
        </div>
      )}
    </div>
  )
} 