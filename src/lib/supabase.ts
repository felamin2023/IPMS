import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

let rememberMe = true;
const STORAGE_KEY = "ipms-auth";

const authStorage = {
  getItem: (key: string) =>
    (rememberMe ? localStorage : sessionStorage).getItem(key),
  setItem: (key: string, value: string) => {
    const primary = rememberMe ? localStorage : sessionStorage;
    const secondary = rememberMe ? sessionStorage : localStorage;
    primary.setItem(key, value);
    secondary.removeItem(key);
  },
  removeItem: (key: string) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};

export function setRememberMe(enabled: boolean) {
  rememberMe = enabled;
  if (!enabled) {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: STORAGE_KEY,
    storage: authStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
