#!/usr/bin/env node

/**
 * Copy Supabase Schema to Clipboard
 * This script reads the SQL schema and copies it to your clipboard
 */

import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📋 Copying Supabase Schema to Clipboard...\n');

try {
  // Read the SQL schema file
  const schemaPath = path.join(__dirname, 'supabase-schema.sql');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  // Copy to clipboard based on OS
  if (process.platform === 'darwin') {
    // macOS
    execSync('pbcopy', { input: schemaContent });
    console.log('✅ SQL schema copied to clipboard!');
  } else if (process.platform === 'win32') {
    // Windows
    execSync('clip', { input: schemaContent });
    console.log('✅ SQL schema copied to clipboard!');
  } else {
    // Linux
    try {
      execSync('xclip -selection clipboard', { input: schemaContent });
      console.log('✅ SQL schema copied to clipboard!');
    } catch (error) {
      console.log('⚠️  Could not copy to clipboard automatically.');
      console.log('📋 Please copy the content manually from supabase-schema.sql');
    }
  }
  
  console.log('\n📝 Next steps:');
  console.log('1. Go to your Supabase dashboard');
  console.log('2. Open SQL Editor');
  console.log('3. Paste the content (Ctrl+V)');
  console.log('4. Click Run');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('\n📋 Please copy the content manually from supabase-schema.sql');
} 