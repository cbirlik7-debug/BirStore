import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase yapılandırması eksik: VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY .env dosyasında tanımlanmalı.',
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
