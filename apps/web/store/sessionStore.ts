import { create } from 'zustand';
import { VideoMetadata, FormScore, Session } from '@velox/types';

interface SessionState {
  video: VideoMetadata | null;
  exerciseId: string | null;
  formScore: FormScore | null;
  sessions: Session[];
  setVideo: (video: VideoMetadata) => void;
  setExerciseId: (exerciseId: string) => void;
  setFormScore: (formScore: FormScore) => void;
  addSession: (session: Session) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  video: null,
  exerciseId: null,
  formScore: null,
  sessions: [],
  
  setVideo: (video) => set({ video }),
  setExerciseId: (exerciseId) => set({ exerciseId }),
  setFormScore: (formScore) => set({ formScore }),
  
  addSession: (session) => set((state) => ({
    sessions: [session, ...state.sessions].slice(0, 10) // Keep last 10 sessions
  })),
  
  clearSession: () => set({
    video: null,
    exerciseId: null,
    formScore: null
  })
})); 