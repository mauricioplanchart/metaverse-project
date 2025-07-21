import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// You'll need to get these from your Supabase dashboard
const supabaseUrl = 'https://jnvbqcaweufmfswpnacv.supabase.co';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'; // You need to get this from Supabase

export const supabase = createClient(supabaseUrl, supabaseKey);

// Test database connection
export async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase
      .from('test')
      .select('*')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 means table doesn't exist, which is fine
      throw error;
    }
    
    console.log('✅ Supabase connected successfully!');
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Supabase connection failed:', errorMessage);
    return false;
  }
}
