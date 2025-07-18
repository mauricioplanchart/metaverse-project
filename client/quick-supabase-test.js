#!/usr/bin/env node

/**
 * Quick Supabase Connection Test
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jnvbqcaweufmfswpnacv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpudmJxY2F3ZXVmbWZzd3BuYWN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0ODk0MDMsImV4cCI6MjA2NzA2NTQwM30.8ayePMQr6ISfYWqkrjHDY7d1CKroVOQONCl6Ge2ApE4';

console.log('🔗 Testing Supabase Connection...\n');

async function testConnection() {
  try {
    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    console.log('✅ Supabase client created successfully');
    console.log('📡 Testing database connection...');

    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        console.log('✅ Connection successful!');
        console.log('ℹ️  Users table does not exist yet (this is normal for new projects)');
        console.log('📝 You can create the tables using the SQL schema provided');
      } else {
        console.log('❌ Connection error:', error.message);
        return;
      }
    } else {
      console.log('✅ Connection successful!');
      console.log('📊 Found', data.length, 'users in the database');
    }

    // Test realtime connection
    console.log('\n🔄 Testing realtime connection...');
    
    const channel = supabase
      .channel('test-connection')
      .on('presence', { event: 'sync' }, () => {
        console.log('✅ Realtime connection successful!');
      })
      .subscribe();

    // Wait a moment for connection
    setTimeout(() => {
      console.log('\n📋 Your Supabase credentials for .env file:');
      console.log('VITE_SUPABASE_URL=' + SUPABASE_URL);
      console.log('VITE_SUPABASE_ANON_KEY=' + SUPABASE_ANON_KEY);
      
      console.log('\n💾 Copy these to your .env file!');
      console.log('\n🚀 Ready to create database tables and start using Supabase!');
      
      channel.unsubscribe();
      process.exit(0);
    }, 2000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testConnection(); 