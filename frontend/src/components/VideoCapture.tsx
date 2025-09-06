'use client'

import { useState, useRef, useEffect } from 'react'

interface VideoCaptureProps {
  onCapture: (file: File) => void
  exerciseName?: string
  autoConfirm?: boolean
  initialMode?: CaptureMode
}

type CaptureMode = 'camera' | 'upload' | null
type CameraFacing = 'user' | 'environment'

export function VideoCapture({ onCapture, exerciseName, autoConfirm = false, initialMode = null }: VideoCaptureProps) {
  const [mode, setMode] = useState<CaptureMode>(initialMode)
  const [isRecording, setIsRecording] = useState(false)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [showPermissionHelp, setShowPermissionHelp] = useState(false)
  const [showGuidelines, setShowGuidelines] = useState(true)
  const [recordingTime, setRecordingTime] = useState(0)
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [cameraFacing, setCameraFacing] = useState<CameraFacing>('user')
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    // Check if device has multiple cameras
    if (navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        const videoDevices = devices.filter(device => device.kind === 'videoinput')
        setHasMultipleCameras(videoDevices.length > 1)
      })
    }
    
    return () => {
      // Cleanup
      stopCamera()
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [])

  useEffect(() => {
    if (previewFile) {
      const url = URL.createObjectURL(previewFile)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [previewFile])

  useEffect(() => {
    if (autoConfirm && previewFile) {
      onCapture(previewFile)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConfirm, previewFile])

  const startCamera = async (facing: CameraFacing = cameraFacing) => {
    try {
      setCameraError(null)
      setShowPermissionHelp(false)
      stopCamera() // Stop any existing stream
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: facing 
        },
        audio: false 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsCameraReady(true)
        setCameraFacing(facing)
      }
    } catch (err) {
      console.error('Camera error:', err)
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setCameraError('Camera permission denied. Please allow camera access.')
          setShowPermissionHelp(true)
        } else if (err.name === 'NotFoundError') {
          setCameraError('No camera found on this device.')
        } else {
          setCameraError('Unable to access camera. Please try again.')
        }
      }
      setMode(null)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraReady(false)
  }

  const switchCamera = async () => {
    const newFacing = cameraFacing === 'user' ? 'environment' : 'user'
    await startCamera(newFacing)
  }

  const startRecording = () => {
    if (!streamRef.current) return

    setShowGuidelines(false)
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm'
    })
    mediaRecorderRef.current = mediaRecorder
    chunksRef.current = []
    setRecordingTime(0)

    // Start timer
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1)
    }, 1000)

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data)
      }
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      const file = new File([blob], `exercise-${Date.now()}.webm`, { type: 'video/webm' })
      setPreviewFile(file)
      if (autoConfirm) {
        onCapture(file)
      }
      stopCamera()
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      setRecordingTime(0)
    }

    mediaRecorder.start()
    setIsRecording(true)
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        setCameraError('File too large. Please select a video under 100MB.')
        return
      }
      setPreviewFile(file)
    }
  }

  const handleModeSelect = async (selectedMode: CaptureMode) => {
    setMode(selectedMode)
    setCameraError(null)
    setShowPermissionHelp(false)
    if (selectedMode === 'camera') {
      await startCamera()
    }
  }

  const handleConfirm = () => {
    if (previewFile) {
      onCapture(previewFile)
    }
  }

  const handleRetry = () => {
    setPreviewFile(null)
    setPreviewUrl(null)
    setShowGuidelines(true)
    if (mode === 'camera') {
      startCamera()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Recording guidelines component
  const RecordingGuidelines = () => (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      <h4 className="font-medium text-purple-400 mb-3 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Recording Tips for Best AI Analysis
      </h4>
      <div className="space-y-2 text-sm text-gray-300">
        <div className="flex items-start gap-2">
          <span className="text-cyan-400">📍</span>
          <span><strong>Position:</strong> Place camera 6-10 feet away at a side angle (45-90°)</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-cyan-400">👤</span>
          <span><strong>Framing:</strong> Ensure your full body is visible in frame</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-cyan-400">💡</span>
          <span><strong>Lighting:</strong> Good lighting on your body, avoid backlight</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-cyan-400">👕</span>
          <span><strong>Clothing:</strong> Wear fitted clothes to help AI detect body position</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-cyan-400">🎯</span>
          <span><strong>Reps:</strong> Perform 3-5 complete repetitions at normal speed</span>
        </div>
      </div>
      {exerciseName && (
        <div className="mt-3 p-2 bg-purple-500/10 rounded text-purple-300 text-sm">
          Recording: <strong>{exerciseName}</strong>
        </div>
      )}
    </div>
  )

  // Mode selection screen
  if (!mode) {
    return (
      <div className="w-full max-w-lg mx-auto">
        <h3 className="text-lg font-semibold mb-4 text-center">Choose Recording Method</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Camera option */}
          <button
            onClick={() => handleModeSelect('camera')}
            className="p-6 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all hover:scale-105 text-center group"
          >
            <div className="text-purple-400 mb-3 group-hover:text-purple-300">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 className="font-medium text-white mb-1">Record Live</h4>
            <p className="text-sm text-gray-400">Use your camera to record</p>
          </button>

          {/* Upload option */}
          <button
            onClick={() => handleModeSelect('upload')}
            className="p-6 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all hover:scale-105 text-center group"
          >
            <div className="text-cyan-400 mb-3 group-hover:text-cyan-300">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h4 className="font-medium text-white mb-1">Upload Video</h4>
            <p className="text-sm text-gray-400">Select from your device</p>
          </button>
        </div>

        {cameraError && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500 rounded text-red-400 text-sm">
            {cameraError}
          </div>
        )}

        {showPermissionHelp && (
          <div className="mt-4 p-4 bg-gray-800 rounded-lg">
            <h4 className="font-medium text-white mb-2">How to enable camera access:</h4>
            <div className="space-y-3 text-sm text-gray-300">
              <div>
                <strong className="text-purple-400">Chrome/Edge:</strong>
                <ol className="ml-4 mt-1 list-decimal space-y-1">
                  <li>Click the camera icon in the address bar</li>
                  <li>Select "Allow" for camera access</li>
                  <li>Refresh the page and try again</li>
                </ol>
              </div>
              <div>
                <strong className="text-purple-400">Firefox:</strong>
                <ol className="ml-4 mt-1 list-decimal space-y-1">
                  <li>Click the lock icon in the address bar</li>
                  <li>Click the "×" next to "Blocked" for camera</li>
                  <li>Refresh the page and allow camera access</li>
                </ol>
              </div>
              <div>
                <strong className="text-purple-400">Safari:</strong>
                <ol className="ml-4 mt-1 list-decimal space-y-1">
                  <li>Go to Safari → Preferences → Websites → Camera</li>
                  <li>Find this website and select "Allow"</li>
                  <li>Refresh the page</li>
                </ol>
              </div>
            </div>
            <button
              onClick={() => handleModeSelect('camera')}
              className="btn-primary w-full mt-4"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    )
  }

  // Upload mode
  if (mode === 'upload' && !previewFile) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="mb-4">
          <button
            onClick={() => setMode(null)}
            className="text-gray-400 hover:text-white flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>

        <RecordingGuidelines />

        <label className="block w-full p-8 text-center border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-gray-800/50 transition-all">
          <div className="text-purple-400 mb-2">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <span className="text-lg font-medium text-white">Choose Video File</span>
          <p className="text-sm text-gray-400 mt-1">MP4, WebM, or MOV • Max 100MB</p>
          <input
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileUpload}
            aria-label="Upload Video"
          />
        </label>

        {cameraError && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500 rounded text-red-400 text-sm">
            {cameraError}
          </div>
        )}
      </div>
    )
  }

  // Camera mode - recording
  if (mode === 'camera' && !previewFile) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="mb-4 flex justify-between items-center">
          <button
            onClick={() => {
              stopCamera()
              setMode(null)
            }}
            className="text-gray-400 hover:text-white flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          {hasMultipleCameras && isCameraReady && !isRecording && (
            <button
              onClick={switchCamera}
              className="text-gray-400 hover:text-white p-2 hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Switch camera"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
        </div>

        {showGuidelines && isCameraReady && (
          <RecordingGuidelines />
        )}

        <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {isRecording && (
            <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
            </div>
          )}
          {!isCameraReady && !cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
                <p className="text-gray-400">Initializing camera...</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex justify-center">
          {isCameraReady && !isRecording && (
            <button
              onClick={startRecording}
              className="btn-primary flex items-center gap-2"
            >
              <div className="w-6 h-6 bg-red-500 rounded-full" />
              Start Recording
            </button>
          )}
          {isRecording && (
            <button
              onClick={stopRecording}
              className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
              Stop Recording
            </button>
          )}
        </div>
        
        {isRecording && (
          <div className="text-center mt-4 space-y-2">
            <p className="text-sm text-gray-400">Recording... Make sure you're in frame!</p>
            <p className="text-xs text-gray-500">Perform 3-5 complete reps for best analysis</p>
          </div>
        )}
      </div>
    )
  }

  // Preview mode
  if (previewFile && previewUrl) {
    return (
      <div className="w-full max-w-md mx-auto">
        <h3 className="text-lg font-semibold mb-4">Review Your Video</h3>
        
        <div className="rounded-lg overflow-hidden bg-black aspect-video mb-4">
          <video
            src={previewUrl}
            controls
            className="w-full h-full object-contain"
          />
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={handleRetry}
            className="btn-secondary flex-1"
          >
            {mode === 'camera' ? 'Re-record' : 'Choose Different'}
          </button>
          
          <button
            onClick={handleConfirm}
            className="btn-primary flex-1"
          >
            Use This Video
          </button>
        </div>
      </div>
    )
  }

  return null
} 