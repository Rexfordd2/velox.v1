import { useFeedback } from '@/hooks/useFeedback'
import { Button } from '@/components/ui/button'

export function FeedbackDemo() {
  const { addError, addWarning, addSuccess, clearFeedback } = useFeedback()

  const demoFeedback = () => {
    // Clear any existing feedback
    clearFeedback()

    // Demo sequence of feedback
    addSuccess('Starting demo sequence...')
    
    setTimeout(() => {
      addWarning('Maintain proper form')
    }, 1000)

    setTimeout(() => {
      addError('Stop immediately - incorrect form detected')
    }, 2000)

    // Auto-clear after demo
    setTimeout(clearFeedback, 6000)
  }

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-lg font-semibold">Feedback System Demo</h2>
      <div className="space-x-4">
        <Button
          onClick={demoFeedback}
          data-testid="start-demo"
        >
          Start Demo
        </Button>
        <Button
          onClick={clearFeedback}
          variant="outline"
          data-testid="clear-feedback"
        >
          Clear Feedback
        </Button>
      </div>
    </div>
  )
} 