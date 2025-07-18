-- Complete Supabase Schema for Metaverse Migration
-- Run this in your Supabase SQL Editor

-- Drop existing tables if they exist (be careful with this in production!)
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS avatars CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS world_states CASCADE;

-- Create users table for user presence and authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  world_id TEXT,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  avatar_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create avatars table for position tracking
CREATE TABLE IF NOT EXISTS avatars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0, "z": 0}',
  rotation JSONB NOT NULL DEFAULT '{"x": 0, "y": 0, "z": 0}',
  world_id TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  is_online BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_messages table for real-time chat
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  message TEXT NOT NULL,
  world_id TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'system', 'whisper', 'proximity')),
  target_user_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create world_states table for world management
CREATE TABLE IF NOT EXISTS world_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  world_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  max_players INTEGER DEFAULT 100,
  current_players INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  last_updated BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_world_id ON users(world_id);
CREATE INDEX IF NOT EXISTS idx_users_is_online ON users(is_online);

CREATE INDEX IF NOT EXISTS idx_avatars_user_id ON avatars(user_id);
CREATE INDEX IF NOT EXISTS idx_avatars_world_id ON avatars(world_id);
CREATE INDEX IF NOT EXISTS idx_avatars_timestamp ON avatars(timestamp);
CREATE INDEX IF NOT EXISTS idx_avatars_is_online ON avatars(is_online);

CREATE INDEX IF NOT EXISTS idx_chat_messages_world_id ON chat_messages(world_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);

CREATE INDEX IF NOT EXISTS idx_world_states_world_id ON world_states(world_id);
CREATE INDEX IF NOT EXISTS idx_world_states_is_active ON world_states(is_active);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_states ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to users" ON users;
DROP POLICY IF EXISTS "Allow public read access to avatars" ON avatars;
DROP POLICY IF EXISTS "Allow public read access to chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Allow public read access to world states" ON world_states;
DROP POLICY IF EXISTS "Allow authenticated users to insert/update their own data" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to insert/update avatar data" ON avatars;
DROP POLICY IF EXISTS "Allow authenticated users to insert chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Allow authenticated users to update world states" ON world_states;

-- Create RLS policies for public read access (for real-time features)
CREATE POLICY "Allow public read access to users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to avatars" ON avatars
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to chat messages" ON chat_messages
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to world states" ON world_states
  FOR SELECT USING (true);

-- Create RLS policies for authenticated insert/update access (more flexible)
CREATE POLICY "Allow authenticated users to insert/update their own data" ON users
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert/update avatar data" ON avatars
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert chat messages" ON chat_messages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update world states" ON world_states
  FOR ALL USING (auth.role() = 'authenticated');

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_avatars_updated_at ON avatars;
DROP TRIGGER IF EXISTS update_world_states_updated_at ON world_states;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_avatars_updated_at BEFORE UPDATE ON avatars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_world_states_updated_at BEFORE UPDATE ON world_states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- Clean up old avatar positions (older than 1 hour)
  DELETE FROM avatars WHERE timestamp < EXTRACT(EPOCH FROM (NOW() - INTERVAL '1 hour')) * 1000;
  
  -- Clean up old chat messages (older than 24 hours)
  DELETE FROM chat_messages WHERE timestamp < EXTRACT(EPOCH FROM (NOW() - INTERVAL '24 hours')) * 1000;
  
  -- Mark users as offline if they haven't been seen in 5 minutes
  UPDATE users SET is_online = false 
  WHERE last_seen < NOW() - INTERVAL '5 minutes' AND is_online = true;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run cleanup (optional - requires pg_cron extension)
-- SELECT cron.schedule('cleanup-old-data', '*/5 * * * *', 'SELECT cleanup_old_data();');

-- Insert some default worlds
INSERT INTO world_states (world_id, name, description, max_players, current_players, is_active, last_updated)
VALUES 
  ('main-world', 'Main World', 'The primary metaverse world', 100, 0, true, EXTRACT(EPOCH FROM NOW()) * 1000),
  ('lobby', 'Lobby', 'Welcome area for new users', 50, 0, true, EXTRACT(EPOCH FROM NOW()) * 1000),
  ('creative-zone', 'Creative Zone', 'Build and create together', 75, 0, true, EXTRACT(EPOCH FROM NOW()) * 1000)
ON CONFLICT (world_id) DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Enable real-time for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE avatars;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE world_states; 