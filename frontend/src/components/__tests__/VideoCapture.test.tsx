import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VideoCapture } from '../VideoCapture';
import React from 'react';

describe('VideoCapture', () => {
  const mockOnCapture = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Ensure URL.createObjectURL exists in jsdom
    if (!(global as any).URL.createObjectURL) {
      // @ts-ignore
      (global as any).URL.createObjectURL = vi.fn(() => 'blob:mock');
    }
    
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
    const recordButton = await screen.findByText('Record Live');
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

  it('handles file upload', async () => {
    // Mock getUserMedia as undefined
    Object.defineProperty(global.navigator, 'mediaDevices', {
      writable: true,
      configurable: true,
      value: undefined
    });

    render(<VideoCapture onCapture={mockOnCapture} autoConfirm />);
    
    // Enter upload mode and upload file
    const uploadButton = screen.getByText('Upload Video');
    fireEvent.click(uploadButton);

    const file = new File(['test'], 'test.mp4', { type: 'video/mp4' });
    const input = await screen.findByLabelText('Upload Video');
    const user = userEvent.setup();
    await user.upload(input as HTMLInputElement, file);
    // autoConfirm will invoke onCapture without needing to click confirm
    await waitFor(() => {
      expect(mockOnCapture).toHaveBeenCalledWith(file);
    }, { timeout: 3000 });
  });
}); 