import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Helper to load .env file manually (consistent with import-tegal-coffeeshops.mjs)
function loadEnvFile() {
  const envPath = path.join(projectRoot, '.env');
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) continue;
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    // Only set if not already set (e.g. by GitHub Actions)
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

const supabaseUrl = (process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || '').trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables.');
  console.log('If running locally, ensure they are set in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function keepAlive() {
  console.log('Pinging Supabase at:', supabaseUrl);
  try {
    // Perform a simple query to register activity. 
    // Querying 'places' table which is allowed by public RLS policy.
    const { data, error, count } = await supabase
      .from('places')
      .select('id', { count: 'exact', head: true });

    if (error) {
      console.error('Error pinging Supabase:', error.message);
      process.exit(1);
    }

    console.log(`Supabase ping successful! Found ${count || 0} places. Project is active.`);
  } catch (err) {
    console.error('Unexpected error during ping:', err.message || err);
    process.exit(1);
  }
}

keepAlive();
