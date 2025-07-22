import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'feedback', 'support']),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  severity: z.enum(['low', 'medium', 'high']).optional(),
  email: z.string().email('Please enter a valid email').optional(),
  attachments: z.array(z.any()).optional(),
  userContext: z.object({
    url: z.string(),
    browser: z.string(),
    device: z.string(),
    timestamp: z.string(),
  }),
})

type FeedbackFormData = z.infer<typeof feedbackSchema>

interface FeedbackFormProps {
  onSubmit: (data: FeedbackFormData) => Promise<void>
  initialType?: 'bug' | 'feature' | 'feedback' | 'support'
  className?: string
}

export default function FeedbackForm({ onSubmit, initialType, className = '' }: FeedbackFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [files, setFiles] = useState<File[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      type: initialType || 'feedback',
      userContext: {
        url: window.location.href,
        browser: navigator.userAgent,
        device: `${window.innerWidth}x${window.innerHeight}`,
        timestamp: new Date().toISOString(),
      },
    },
  })

  const handleFormSubmit = async (data: FeedbackFormData) => {
    try {
      setIsSubmitting(true)
      await onSubmit(data)
      reset()
      setFiles([])
    } catch (error) {
      console.error('Error submitting feedback:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form 
      onSubmit={handleSubmit(handleFormSubmit)} 
      className={`space-y-6 ${className}`}
    >
      {/* Feedback Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Feedback Type *
        </label>
        <select
          {...register('type')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="feedback">General Feedback</option>
          <option value="bug">Report a Bug</option>
          <option value="feature">Feature Request</option>
          <option value="support">Support Request</option>
        </select>
        {errors.type && (
          <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
        )}
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title *
        </label>
        <input
          type="text"
          {...register('title')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Brief summary of your feedback"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description *
        </label>
        <textarea
          {...register('description')}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Please provide detailed information..."
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {/* Severity (for bugs) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Severity
        </label>
        <select
          {...register('severity')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="low">Low - Minor inconvenience</option>
          <option value="medium">Medium - Affects functionality</option>
          <option value="high">High - Critical issue</option>
        </select>
      </div>

      {/* Email (optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email (optional)
        </label>
        <input
          type="email"
          {...register('email')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter your email for follow-up"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* File Attachments */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Attachments (optional)
        </label>
        <input
          type="file"
          multiple
          onChange={(e) => {
            const fileList = e.target.files
            if (fileList) {
              setFiles(Array.from(fileList))
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
        {files.length > 0 && (
          <ul className="mt-2 text-sm text-gray-500">
            {files.map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </div>
    </form>
  )
} 