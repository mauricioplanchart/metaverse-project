#!/usr/bin/env node

/**
 * Test Supabase Connection
 * Run this after you find your project URL and anon key
 */

import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔗 Supabase Connection Test\n');

// Function to get user input
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function testConnection() {
  try {
    // Get project URL
    const projectUrl = await askQuestion('Enter your Supabase project URL (e.g., https://abc123.supabase.co): ');
    
    if (!projectUrl.includes('supabase.co')) {
      console.log('❌ Invalid URL format. Should be like: https://abc123.supabase.co');
      rl.close();
      return;
    }

    // Get anon key
    const anonKey = await askQuestion('Enter your anon public key: ');
    
    if (!anonKey.startsWith('eyJ')) {
      console.log('❌ Invalid anon key format. Should start with "eyJ"');
      rl.close();
      return;
    }

    console.log('\n🔄 Testing connection...\n');

    // Create Supabase client
    const supabase = createClient(projectUrl, anonKey);

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
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('👤 User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('👋 User left:', leftPresences);
      })
      .subscribe();

    // Wait a moment for connection
    setTimeout(() => {
      console.log('\n📋 Your Supabase credentials:');
      console.log('VITE_SUPABASE_URL=' + projectUrl);
      console.log('VITE_SUPABASE_ANON_KEY=' + anonKey);
      
      console.log('\n💾 Copy these to your .env file!');
      
      channel.unsubscribe();
      rl.close();
    }, 2000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    rl.close();
  }
}

testConnection(); 