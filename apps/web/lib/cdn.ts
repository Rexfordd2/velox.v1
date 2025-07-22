import { env } from './env'

export const CDN_CONFIG = {
  videoProcessing: {
    baseUrl: env.VIDEO_PROCESSING_CDN_URL || '',
    endpoints: {
      upload: '/upload',
      process: '/process',
      status: '/status',
    },
    options: {
      maxFileSize: 100 * 1024 * 1024, // 100MB
      allowedTypes: ['video/mp4', 'video/quicktime'],
      maxDuration: 300, // 5 minutes
    },
  },
  assets: {
    baseUrl: env.ASSETS_CDN_URL || '',
    cacheControl: {
      images: 'public, max-age=31536000, immutable',
      videos: 'public, max-age=31536000, immutable',
      static: 'public, max-age=31536000, immutable',
    },
  },
}

export const getCdnUrl = (path: string, type: 'video' | 'image' | 'static' = 'static') => {
  const baseUrl = type === 'video' 
    ? CDN_CONFIG.videoProcessing.baseUrl 
    : CDN_CONFIG.assets.baseUrl

  return `${baseUrl}${path}`
}

export const getVideoProcessingUrl = (videoId: string, operation: keyof typeof CDN_CONFIG.videoProcessing.endpoints) => {
  const baseUrl = CDN_CONFIG.videoProcessing.baseUrl
  const endpoint = CDN_CONFIG.videoProcessing.endpoints[operation]
  return `${baseUrl}${endpoint}/${videoId}`
}

export const validateVideoUpload = (file: File) => {
  const { maxFileSize, allowedTypes, maxDuration } = CDN_CONFIG.videoProcessing.options
  
  if (file.size > maxFileSize) {
    throw new Error(`File size exceeds maximum limit of ${maxFileSize / (1024 * 1024)}MB`)
  }
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} is not supported. Supported types: ${allowedTypes.join(', ')}`)
  }
  
  return true
} 