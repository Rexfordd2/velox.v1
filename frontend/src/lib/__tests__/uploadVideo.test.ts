import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadVideo } from '../uploadVideo';
import { createClient } from '@supabase/supabase-js';

// Mock environment variables
vi.mock('process', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key'
  }
}));

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn()
      }))
    }
  }))
}));

describe('uploadVideo', () => {
  const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });
  const mockUserId = 'test-user';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully upload a video', async () => {
    const mockUploadResponse = { data: { path: 'videos/test-user/test.mp4' }, error: null };
    const mockPublicUrl = 'https://test.supabase.co/storage/v1/object/public/videos/test-user/test.mp4';
    
    const supabase = createClient('https://test.supabase.co', 'test-key');
    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: vi.fn().mockResolvedValue(mockUploadResponse),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: mockPublicUrl } })
    });

    const result = await uploadVideo(mockFile, mockUserId);

    expect(result).toBe(mockPublicUrl);
    expect(supabase.storage.from).toHaveBeenCalledWith('videos');
  });

  it('should handle upload errors', async () => {
    const mockError = new Error('Upload failed');
    const supabase = createClient('https://test.supabase.co', 'test-key');
    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: vi.fn().mockRejectedValue(mockError),
      getPublicUrl: vi.fn()
    });

    await expect(uploadVideo(mockFile, mockUserId)).rejects.toThrow('Upload failed');
  });

  it('should handle invalid file types', async () => {
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    await expect(uploadVideo(invalidFile, mockUserId)).rejects.toThrow('Invalid file type');
  });

  it('should handle empty file', async () => {
    const emptyFile = new File([], 'test.mp4', { type: 'video/mp4' });
    await expect(uploadVideo(emptyFile, mockUserId)).rejects.toThrow('File is empty');
  });
}); 