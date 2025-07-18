-- Metaverse Database Schema for Supabase (Fixed for Testing)
-- Run this in your Supabase SQL Editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read all users" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Anyone can read public chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can read own private messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON chat_messages;
DROP POLICY IF EXISTS "Anyone can read world states" ON world_states;
DROP POLICY IF EXISTS "Users can read all avatars" ON avatars;
DROP POLICY IF EXISTS "Users can manage own avatars" ON avatars;
DROP POLICY IF EXISTS "Users can manage own sessions" ON user_sessions;

-- Create more permissive RLS policies for testing
-- Allow all operations on users table for testing
CREATE POLICY "Allow all operations on users" ON users
    FOR ALL USING (true);

-- Allow all operations on chat_messages table for testing
CREATE POLICY "Allow all operations on chat_messages" ON chat_messages
    FOR ALL USING (true);

-- Allow all operations on world_states table for testing
CREATE POLICY "Allow all operations on world_states" ON world_states
    FOR ALL USING (true);

-- Allow all operations on avatars table for testing
CREATE POLICY "Allow all operations on avatars" ON avatars
    FOR ALL USING (true);

-- Allow all operations on user_sessions table for testing
CREATE POLICY "Allow all operations on user_sessions" ON user_sessions
    FOR ALL USING (true); 