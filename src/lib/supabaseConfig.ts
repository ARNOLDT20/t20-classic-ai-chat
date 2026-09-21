const DEFAULT_SUPABASE_URL = "https://mqudqfsvnvlcptsgdceo.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Y0ifef3Ily_1hxuSHVf6mQ_7s_X2sd0";

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  DEFAULT_SUPABASE_URL;

export const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  DEFAULT_SUPABASE_PUBLISHABLE_KEY;

export const SUPABASE_PROJECT_ID =
  import.meta.env.VITE_SUPABASE_PROJECT_ID ||
  SUPABASE_URL.match(/^https:\/\/([a-z0-9]+)\.supabase\.co$/i)?.[1] ||
  "mqudqfsvnvlcptsgdceo";
