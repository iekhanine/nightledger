import { createClient } from "@supabase/supabase-js";

const DEFAULT_URL = "https://jghuhhpyqudzxccrxyvb.supabase.co";
const DEFAULT_PUBLISHABLE_KEY = "sb_publishable_ycbDixN1TFV5Vb_LAyvJbg_0Z6Vyvu4";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || DEFAULT_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
