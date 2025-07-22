import { create } from 'zustand'

export interface FeedbackItem {
  id: string
  severity: 1 | 2 | 3 | 4 | 5
  msg: string
  timestamp: number
}

interface FeedbackStore {
  feedback: FeedbackItem[]
  pushFeedback: (items: Omit<FeedbackItem, 'id' | 'timestamp'>[]) => void
  clearFeedback: () => void
}

export const useFeedbackStore = create<FeedbackStore>((set) => ({
  feedback: [],
  pushFeedback: (items) => {
    set((state) => {
      // Filter to max one high-severity (4-5) and one mid-severity (2-3) cue
      const highSeverity = items.find((item) => item.severity >= 4)
      const midSeverity = items.find((item) => item.severity >= 2 && item.severity <= 3)
      
      const newFeedback = [
        ...(highSeverity ? [{
          ...highSeverity,
          id: Math.random().toString(36).slice(2),
          timestamp: Date.now()
        }] : []),
        ...(midSeverity ? [{
          ...midSeverity,
          id: Math.random().toString(36).slice(2),
          timestamp: Date.now()
        }] : [])
      ]

      // Remove feedback items older than 4 seconds
      const currentTime = Date.now()
      const filteredFeedback = state.feedback.filter(
        (item) => currentTime - item.timestamp < 4000
      )

      return {
        feedback: [...filteredFeedback, ...newFeedback]
      }
    })
  },
  clearFeedback: () => set({ feedback: [] })
}))

// Helper function to convert severity strings to numbers
export function getSeverityLevel(type: 'error' | 'warning' | 'success'): 1 | 2 | 3 | 4 | 5 {
  switch (type) {
    case 'error':
      return 5
    case 'warning':
      return 3
    case 'success':
      return 1
    default:
      return 3
  }
} 