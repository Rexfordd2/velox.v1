export interface PoseAnalysisResult {
  analysis_id: string
  timestamp: string
  exercise_type: string
  user_id: string
  metrics: {
    depth: number
    form_score: number
    rep_count: number
    tempo: number
    stability: number
  }
  feedback: string[]
  confidence_score: number
}

export async function analyzeVideo(
  videoFile: File,
  exerciseType: string,
  userId: string
): Promise<PoseAnalysisResult> {
  const formData = new FormData()
  formData.append('file', videoFile)
  formData.append('exercise_type', exerciseType.toLowerCase())
  formData.append('user_id', userId)

  // Get AI backend URL from environment or use default
  const aiBackendUrl = process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'http://localhost:8000'

  try {
    const response = await fetch(`${aiBackendUrl}/analyze-pose`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      if (response.status === 0 || response.status === 404) {
        throw new Error('AI analysis service is not available. Please ensure the AI backend is running on port 8000.')
      }
      
      let errorMessage = 'Failed to analyze video'
      try {
        const error = await response.json()
        errorMessage = error.detail || errorMessage
      } catch {
        // If we can't parse the error response, use the default message
      }
      
      throw new Error(errorMessage)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Cannot connect to AI analysis service. Please check that the AI backend is running on http://localhost:8000')
    }
    console.error('Error analyzing video:', error)
    throw error
  }
} 