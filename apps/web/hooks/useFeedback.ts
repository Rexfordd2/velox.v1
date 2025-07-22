import { useFeedbackStore } from '@/lib/feedbackEngine'
import { useCallback } from 'react'

export interface FeedbackOptions {
  severity: 1 | 2 | 3 | 4 | 5
  msg: string
}

export function useFeedback() {
  const pushFeedback = useFeedbackStore((state) => state.pushFeedback)
  const clearFeedback = useFeedbackStore((state) => state.clearFeedback)
  const feedback = useFeedbackStore((state) => state.feedback)

  const addFeedback = useCallback((options: FeedbackOptions | FeedbackOptions[]) => {
    const items = Array.isArray(options) ? options : [options]
    pushFeedback(items)
  }, [pushFeedback])

  const addError = useCallback((msg: string) => {
    addFeedback({ severity: 5, msg })
  }, [addFeedback])

  const addWarning = useCallback((msg: string) => {
    addFeedback({ severity: 3, msg })
  }, [addFeedback])

  const addSuccess = useCallback((msg: string) => {
    addFeedback({ severity: 1, msg })
  }, [addFeedback])

  return {
    feedback,
    addFeedback,
    addError,
    addWarning,
    addSuccess,
    clearFeedback
  }
} 