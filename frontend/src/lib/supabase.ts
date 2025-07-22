import { createClient } from '@supabase/supabase-js';
import { mockAuth } from './mock-auth';

// Check if we have valid Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Create Supabase client only if we have valid credentials
export const supabase = supabaseUrl && supabaseAnonKey && isValidUrl(supabaseUrl)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Export auth interface that falls back to mock auth when Supabase is not configured
export const auth = supabase || mockAuth; 