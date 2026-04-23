import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.REACT_APP_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.REACT_APP_PUBLIC_SUPABASE_URL;

const supabaseAnonKey =
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.REACT_APP_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail fast: otherwise you'll get confusing runtime errors later.
  throw new Error(
    [
      'Missing Supabase env vars.',
      'Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in `.env`.',
    ].join(' ')
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export { supabaseUrl, supabaseAnonKey };
export default supabase;