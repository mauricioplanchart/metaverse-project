# Supabase Configuration Setup

Since you already have a Supabase project, follow these steps to connect it to your metaverse application:

## 1. Get Your Supabase Project Credentials

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your existing project
3. Go to **Settings** → **API**
4. Copy your **Project URL** and **anon public** key

## 2. Set Up Environment Variables

Create a `.env` file in your project root with:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-actual-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here

# Optional: Enable debug mode for development
VITE_DEBUG_MODE=true
```

## 3. Create Database Tables

Run the SQL commands from `supabase-schema.sql` in your Supabase SQL Editor:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase-schema.sql`
4. Execute the SQL commands

## 4. Test the Connection

1. Start your development server: `npm run dev`
2. Open `http://localhost:5173/supabase-test.html` in your browser
3. Check the console for connection status

## 5. Enable Row Level Security (RLS)

In your Supabase Dashboard:
1. Go to **Authentication** → **Policies**
2. Enable RLS on all tables
3. Create policies for public read/write access (for development)

## 6. Enable Realtime

1. Go to **Database** → **Replication**
2. Enable realtime for the tables you want to sync:
   - `users`
   - `avatars` 
   - `chat_messages`
   - `world_states`

## Troubleshooting

- **Connection failed**: Check your URL and anon key
- **Tables not found**: Run the SQL schema commands
- **RLS errors**: Check your row level security policies
- **Realtime not working**: Enable realtime in the database settings

## Next Steps

Once configured, you can:
1. Replace Socket.IO with Supabase Realtime
2. Use Supabase Auth for user management
3. Store avatar positions and chat messages in the database
4. Scale without managing your own backend 