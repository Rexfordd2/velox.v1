import { uploadVideo, deleteVideo } from '../videoStorage';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        createSignedUrl: jest.fn(),
        remove: jest.fn()
      }))
    }
  }))
}));

describe('Video Storage Service', () => {
  const mockUserId = 'test-user-123';
  const mockFile = new Blob(['test video content'], { type: 'video/mp4' });
  const mockPath = 'test-user-123/2024-03-20/test-video.mp4';
  const mockUrl = 'https://example.com/test-video.mp4';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('uploadVideo', () => {
    it('should successfully upload a video and return URL and path', async () => {
      // Mock successful upload
      const mockSupabase = createClient();
      mockSupabase.storage.from('user-videos').upload.mockResolvedValueOnce({ error: null });
      mockSupabase.storage.from('user-videos').createSignedUrl.mockResolvedValueOnce({
        data: { signedUrl: mockUrl },
        error: null
      });
      
      const result = await uploadVideo(mockUserId, mockFile);
      
      expect(result).toEqual({
        url: mockUrl,
        path: expect.stringContaining(mockUserId)
      });
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('user-videos');
      expect(mockSupabase.storage.from('user-videos').upload).toHaveBeenCalled();
      expect(mockSupabase.storage.from('user-videos').createSignedUrl).toHaveBeenCalled();
    });
    
    it('should throw error on upload failure', async () => {
      const mockError = new Error('Upload failed');
      const mockSupabase = createClient();
      mockSupabase.storage.from('user-videos').upload.mockResolvedValueOnce({ error: mockError });
      
      await expect(uploadVideo(mockUserId, mockFile)).rejects.toThrow('Failed to upload video');
    });
    
    it('should throw error on URL generation failure', async () => {
      const mockSupabase = createClient();
      mockSupabase.storage.from('user-videos').upload.mockResolvedValueOnce({ error: null });
      mockSupabase.storage.from('user-videos').createSignedUrl.mockResolvedValueOnce({
        data: { signedUrl: null },
        error: new Error('URL generation failed')
      });
      
      await expect(uploadVideo(mockUserId, mockFile)).rejects.toThrow('Failed to generate signed URL');
    });
  });
  
  describe('deleteVideo', () => {
    it('should successfully delete a video', async () => {
      const mockSupabase = createClient();
      mockSupabase.storage.from('user-videos').remove.mockResolvedValueOnce({ error: null });
      
      await expect(deleteVideo(mockPath)).resolves.not.toThrow();
      expect(mockSupabase.storage.from('user-videos').remove).toHaveBeenCalledWith([mockPath]);
    });
    
    it('should throw error on deletion failure', async () => {
      const mockError = new Error('Deletion failed');
      const mockSupabase = createClient();
      mockSupabase.storage.from('user-videos').remove.mockResolvedValueOnce({ error: mockError });
      
      await expect(deleteVideo(mockPath)).rejects.toThrow('Failed to delete video');
    });
  });
}); 