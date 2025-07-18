-- Metaverse Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    avatar_data JSONB DEFAULT '{}',
    position_data JSONB DEFAULT '{"x": 0, "y": 0, "z": 0}',
    world_id VARCHAR(50) DEFAULT 'main-world',
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create avatars table
CREATE TABLE IF NOT EXISTS avatars (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    model_url VARCHAR(500),
    texture_url VARCHAR(500),
    animation_data JSONB DEFAULT '{}',
    customizations JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    world_id VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'public', -- 'public', 'private', 'proximity'
    recipient_id UUID REFERENCES users(id),
    position_data JSONB, -- For proximity chat
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create world_states table
CREATE TABLE IF NOT EXISTS world_states (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    world_id VARCHAR(50) UNIQUE NOT NULL,
    world_name VARCHAR(100) NOT NULL,
    world_data JSONB DEFAULT '{}',
    user_count INTEGER DEFAULT 0,
    max_users INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_world_id ON users(world_id);
CREATE INDEX IF NOT EXISTS idx_users_is_online ON users(is_online);
CREATE INDEX IF NOT EXISTS idx_avatars_user_id ON avatars(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_world_id ON chat_messages(world_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_world_states_world_id ON world_states(world_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can read all users (for multiplayer)
CREATE POLICY "Users can read all users" ON users
    FOR SELECT USING (true);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own data
CREATE POLICY "Users can insert own data" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Chat messages - anyone can read public messages
CREATE POLICY "Anyone can read public chat messages" ON chat_messages
    FOR SELECT USING (message_type = 'public');

-- Users can read their own private messages
CREATE POLICY "Users can read own private messages" ON chat_messages
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() = recipient_id
    );

-- Users can insert their own messages
CREATE POLICY "Users can insert own messages" ON chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- World states - anyone can read
CREATE POLICY "Anyone can read world states" ON world_states
    FOR SELECT USING (true);

-- Avatars - users can read all avatars
CREATE POLICY "Users can read all avatars" ON avatars
    FOR SELECT USING (true);

-- Users can manage their own avatars
CREATE POLICY "Users can manage own avatars" ON avatars
    FOR ALL USING (auth.uid() = user_id);

-- User sessions - users can manage their own sessions
CREATE POLICY "Users can manage own sessions" ON user_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Insert initial world data
INSERT INTO world_states (world_id, world_name, world_data, max_users) 
VALUES 
    ('main-world', 'Main World', '{"description": "The main metaverse world", "theme": "fantasy"}', 100),
    ('lobby', 'Lobby', '{"description": "Welcome lobby area", "theme": "modern"}', 50),
    ('test-world', 'Test World', '{"description": "Testing area", "theme": "minimal"}', 20)
ON CONFLICT (world_id) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_avatars_updated_at BEFORE UPDATE ON avatars
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_world_states_updated_at BEFORE UPDATE ON world_states
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle user online status
CREATE OR REPLACE FUNCTION update_user_online_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_online = true AND OLD.is_online = false THEN
        -- User came online
        UPDATE world_states 
        SET user_count = user_count + 1 
        WHERE world_id = NEW.world_id;
    ELSIF NEW.is_online = false AND OLD.is_online = true THEN
        -- User went offline
        UPDATE world_states 
        SET user_count = GREATEST(user_count - 1, 0)
        WHERE world_id = NEW.world_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user online status
CREATE TRIGGER update_world_user_count 
    AFTER UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_user_online_status();

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE avatars;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE world_states;
ALTER PUBLICATION supabase_realtime ADD TABLE user_sessions; 