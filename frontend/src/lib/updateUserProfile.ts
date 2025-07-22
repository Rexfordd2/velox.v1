import { createClient } from '@supabase/supabase-js';

interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
}

interface ProfileUpdate {
  username?: string;
  full_name?: string;
  avatar_url?: string;
}

export async function updateUserProfile(userId: string, updates: ProfileUpdate): Promise<Profile> {
  // Validate that there are fields to update
  if (Object.keys(updates).length === 0) {
    throw new Error('No fields to update');
  }

  // Validate username format if provided
  if (updates.username && !/^[a-zA-Z0-9_-]{3,20}$/.test(updates.username)) {
    throw new Error('Invalid username format');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Profile not found');
  }

  return data;
} 