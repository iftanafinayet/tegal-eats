import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || '').trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function keepAlive() {
  console.log('Pinging Supabase to keep it active...');
  try {
    // Perform a simple query to the 'places' table to register activity
    const { data, error } = await supabase
      .from('places')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Error pinging Supabase:', error.message);
      process.exit(1);
    }

    console.log('Supabase ping successful! Project is kept active.');
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

keepAlive();
