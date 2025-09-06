import { createClient } from '@supabase/supabase-js';

interface Badge {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
}

interface UserBadge {
  badge: Badge;
}

export interface Profile {
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

export async function getUserProfile(username: string): Promise<Profile> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Profile not found');
  return data as Profile;
}

export default getUserProfile;