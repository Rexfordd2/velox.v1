import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VideoCapture } from '../VideoCapture';
import React from 'react';

describe('VideoCapture', () => {
  const mockOnCapture = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock navigator.mediaDevices
    Object.defineProperty(global.navigator, 'mediaDevices', {
      writable: true,
      configurable: true,
      value: {
        getUserMedia: vi.fn(),
        enumerateDevices: vi.fn().mockResolvedValue([
          { kind: 'videoinput', deviceId: 'mock-camera-1' },
          { kind: 'videoinput', deviceId: 'mock-camera-2' }
        ])
      }
    });
  });

  it('renders camera view when getUserMedia is supported', async () => {
    // Mock successful camera access
    const mockStream = {
      getTracks: () => [{
        stop: vi.fn()
      }],
      getVideoTracks: () => [{
        stop: vi.fn()
      }],
      getAudioTracks: () => [],
      active: true,
      id: 'mock-stream-id',
      onaddtrack: null,
      onremovetrack: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    } as unknown as MediaStream;

    vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValue(mockStream);

    render(<VideoCapture onCapture={mockOnCapture} />);
    
    // Click the "Record Live" button
    const recordButton = screen.getByText('Record Live');
    fireEvent.click(recordButton);
    
    // Wait for camera initialization
    await vi.waitFor(() => {
      expect(screen.getByText('Start Recording')).toBeInTheDocument();
    });
    
    expect(screen.queryByText('Upload Video')).not.toBeInTheDocument();
  });

  it('falls back to file input when getUserMedia is not supported', () => {
    // Mock getUserMedia as undefined
    Object.defineProperty(global.navigator, 'mediaDevices', {
      writable: true,
      configurable: true,
      value: undefined
    });

    render(<VideoCapture onCapture={mockOnCapture} />);
    
    // Click the "Upload Video" button
    const uploadButton = screen.getByText('Upload Video');
    fireEvent.click(uploadButton);
    
    expect(screen.getByText('Choose Video File')).toBeInTheDocument();
    expect(screen.queryByText('Start Recording')).not.toBeInTheDocument();
  });

  it('handles file upload', () => {
    // Mock getUserMedia as undefined
    Object.defineProperty(global.navigator, 'mediaDevices', {
      writable: true,
      configurable: true,
      value: undefined
    });

    render(<VideoCapture onCapture={mockOnCapture} />);
    
    // Click the "Upload Video" button
    const uploadButton = screen.getByText('Upload Video');
    fireEvent.click(uploadButton);
    
    const file = new File(['test'], 'test.mp4', { type: 'video/mp4' });
    const input = screen.getByLabelText('Choose Video File');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    expect(mockOnCapture).toHaveBeenCalledWith(file);
  });
}); 