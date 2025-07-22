import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { auth } from './supabase';
import { mockAuth } from './mock-auth';

interface Badge {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
}

interface UserBadge {
  badge: Badge;
}

interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  music_service?: string;
  goals?: Record<string, any>;
  badges?: Badge[];
  created_at: string;
}

// Mock profile data for development
const mockProfile: Profile = {
  id: 'mock-user-123',
  username: 'demo_user',
  full_name: 'Demo User',
  avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
  bio: 'This is a mock profile for development',
  music_service: 'spotify',
  goals: {
    strength: 'Improve overall strength',
    form: 'Perfect squat form',
    consistency: 'Work out 3 times per week'
  },
  badges: [
    {
      id: 'badge-1',
      name: 'Early Adopter',
      description: 'One of the first to join Velox',
      icon_url: '🌟'
    },
    {
      id: 'badge-2',
      name: 'Form Master',
      description: 'Achieved perfect form score',
      icon_url: '🎯'
    }
  ],
  created_at: new Date().toISOString()
};

export default async function getUserProfile(): Promise<Profile> {
  // Use mock profile if Supabase is not configured
  const mockUser = mockAuth.getUser();
  if (!mockUser) throw new Error('Not authenticated');
  
  // Return mock profile for development
  return mockProfile;
} 