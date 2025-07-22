import { FeedbackDemo } from '@/components/demo/FeedbackDemo'

export default function FeedbackDemoPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Feedback System Demo</h1>
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            This demo showcases our prioritized feedback engine with:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
            <li>Severity-based prioritization (max one high, one medium)</li>
            <li>Auto-dismissal after 4 seconds</li>
            <li>Color-coded feedback levels</li>
            <li>Smooth animations</li>
          </ul>
          <FeedbackDemo />
        </div>
      </div>
    </div>
  )
} 