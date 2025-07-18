#!/usr/bin/env node

/**
 * Supabase Setup Script
 * Helps configure your existing Supabase project for the metaverse app
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Supabase Configuration Setup\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('✅ .env file found');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  if (envContent.includes('your-actual-project') || envContent.includes('your-anon-key-here')) {
    console.log('⚠️  Please update your .env file with actual Supabase credentials');
    console.log('   - VITE_SUPABASE_URL=https://your-project.supabase.co');
    console.log('   - VITE_SUPABASE_ANON_KEY=your-anon-key');
  } else {
    console.log('✅ Supabase credentials appear to be configured');
  }
} else {
  console.log('📝 Creating .env file template...');
  const envTemplate = `# Supabase Configuration
# Replace these with your actual Supabase project credentials
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Enable debug mode for development
VITE_DEBUG_MODE=true
`;
  
  fs.writeFileSync(envPath, envTemplate);
  console.log('✅ .env file created');
  console.log('⚠️  Please update .env with your actual Supabase credentials');
}

// Check if schema file exists
const schemaPath = path.join(__dirname, 'supabase-schema.sql');
if (fs.existsSync(schemaPath)) {
  console.log('✅ Database schema file found');
} else {
  console.log('❌ Database schema file not found');
}

console.log('\n📋 Next Steps:');
console.log('1. Update .env with your Supabase project credentials');
console.log('2. Run the SQL commands from supabase-schema.sql in your Supabase dashboard');
console.log('3. Enable realtime for the tables in Supabase');
console.log('4. Test the connection with: npm run dev');
console.log('5. Open http://localhost:5173/supabase-test.html');

console.log('\n🔗 Useful Links:');
console.log('- Supabase Dashboard: https://supabase.com/dashboard');
console.log('- SQL Editor: https://supabase.com/dashboard/project/[YOUR-PROJECT]/sql');
console.log('- Realtime Settings: https://supabase.com/dashboard/project/[YOUR-PROJECT]/database/replication'); 