import { motion, AnimatePresence } from 'framer-motion'
import { useFeedbackStore } from '@/lib/feedbackEngine'

const severityColors = {
  1: 'bg-green-500',  // success
  2: 'bg-green-600',  // success+
  3: 'bg-amber-500',  // warning
  4: 'bg-red-500',    // error
  5: 'bg-red-600'     // critical
}

export function FeedbackBanner() {
  const feedback = useFeedbackStore((state) => state.feedback)

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 space-y-2" data-testid="feedback-container">
      <AnimatePresence>
        {feedback.map((item) => (
          <motion.div
            key={item.id}
            data-testid="feedback-banner"
            data-severity={item.severity}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`
              ${severityColors[item.severity]}
              px-6 py-3 rounded-lg shadow-lg
              text-white font-medium
              flex items-center gap-2
            `}
          >
            {item.severity >= 4 ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" data-testid="feedback-icon-error">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : item.severity >= 2 ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" data-testid="feedback-icon-warning">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" data-testid="feedback-icon-success">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span data-testid="feedback-message">{item.msg}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
} 