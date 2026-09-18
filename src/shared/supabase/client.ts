import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Browser localStorage'dan kayıtlı bilgileri oku (re-build gerekmeden tarayıcıdan yapılandırma imkanı)
function getStoredItem(key: string): string {
  try {
    return localStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const supabaseUrl = envUrl || getStoredItem('birstore_supabase_url');
export const supabaseAnonKey = envKey || getStoredItem('birstore_supabase_anon_key');

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('xxxxxxxxxxxx') &&
  supabaseAnonKey !== 'your-anon-key-here' &&
  (supabaseUrl.startsWith('https://') || supabaseUrl.startsWith('http://'))
);

// Yapılandırma yoksa uygulamanın beyaz ekrana çökmesini önlemek için güvenli dummy client
const placeholderUrl = 'https://birstore-placeholder.supabase.co';
const placeholderKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.birstore-demo';

export const supabase = createClient<Database>(
  isSupabaseConfigured ? supabaseUrl : placeholderUrl,
  isSupabaseConfigured ? supabaseAnonKey : placeholderKey
);

export function saveSupabaseConfig(url: string, anonKey: string): void {
  try {
    localStorage.setItem('birstore_supabase_url', url.trim());
    localStorage.setItem('birstore_supabase_anon_key', anonKey.trim());
    localStorage.removeItem('birstore_demo_mode');
    window.location.reload();
  } catch (err) {
    console.error('Supabase bilgileri kaydedilemedi:', err);
  }
}

export function clearSupabaseConfig(): void {
  try {
    localStorage.removeItem('birstore_supabase_url');
    localStorage.removeItem('birstore_supabase_anon_key');
    localStorage.removeItem('birstore_demo_mode');
    window.location.reload();
  } catch (err) {
    console.error('Supabase bilgileri silinemedi:', err);
  }
}

export function isDemoMode(): boolean {
  try {
    // Supabase tanımlı değilse varsayılan olarak demo modunda çalıştır
    if (!isSupabaseConfigured) return true;
    return localStorage.getItem('birstore_demo_mode') === 'true';
  } catch {
    return !isSupabaseConfigured;
  }
}

export function enableDemoMode(): void {
  try {
    localStorage.setItem('birstore_demo_mode', 'true');
    window.location.reload();
  } catch (err) {
    console.error('Demo modu aktif edilemedi:', err);
  }
}

export function disableDemoMode(): void {
  try {
    localStorage.removeItem('birstore_demo_mode');
    window.location.reload();
  } catch (err) {
    console.error('Demo modu kapatılamadı:', err);
  }
}
