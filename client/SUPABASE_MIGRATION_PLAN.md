# 🚀 Migration Plan: Socket.IO → Supabase Realtime

## Why Migrate?

Your current Socket.IO setup has persistent CORS issues between Netlify (frontend) and Render (backend). Supabase Realtime eliminates these issues entirely.

## 📋 Migration Benefits

✅ **No CORS issues** - Handled automatically by Supabase  
✅ **No backend management** - Supabase handles the real-time infrastructure  
✅ **Database included** - Store user data, chat messages, etc.  
✅ **Real-time subscriptions** - Similar API to Socket.IO  
✅ **Free tier** - 50,000 monthly active users  
✅ **Open source** - No vendor lock-in  

## 🛠️ Migration Steps

### Step 1: Set Up Supabase

1. **Create Supabase Account**
   ```bash
   # Go to https://supabase.com
   # Sign up and create a new project
   ```

2. **Install Supabase Client**
   ```bash
   npm install @supabase/supabase-js
   ```

3. **Get Project Credentials**
   - Project URL: `https://your-project.supabase.co`
   - Anon Key: `your-anon-key`

### Step 2: Database Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  avatar_data JSONB,
  position JSONB,
  world_id TEXT DEFAULT 'main-world',
  last_seen TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  world_id TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- World states table
CREATE TABLE world_states (
  id TEXT PRIMARY KEY,
  user_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
);
```

### Step 3: Replace Socket.IO Service

**Current Socket.IO Service:**
```typescript
// src/lib/socketService.ts (current)
import { io, Socket } from 'socket.io-client'

class SocketService {
  private socket: Socket | null = null
  
  connect() {
    this.socket = io(this.serverUrl, {
      transports: ['polling'],
      // ... CORS-prone configuration
    })
  }
}
```

**New Supabase Service:**
```typescript
// src/lib/supabaseService.ts (new)
import { createClient, SupabaseClient } from '@supabase/supabase-js'

interface User {
  id: string
  username: string
  avatar_data?: any
  position?: { x: number; y: number; z: number }
  world_id: string
}

interface ChatMessage {
  id: string
  user_id: string
  world_id: string
  message: string
  created_at: string
}

class SupabaseService {
  private supabase: SupabaseClient
  private currentUser: User | null = null
  private subscriptions: any[] = []

  constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  async connect(): Promise<boolean> {
    try {
      console.log('🔌 Connecting to Supabase...')
      
      // Test connection
      const { data, error } = await this.supabase
        .from('users')
        .select('count')
        .limit(1)
      
      if (error) throw error
      
      console.log('✅ Connected to Supabase successfully')
      return true
    } catch (error) {
      console.error('❌ Supabase connection failed:', error)
      return false
    }
  }

  async joinWorld(worldId: string, username: string): Promise<User> {
    // Create or update user
    const { data: user, error } = await this.supabase
      .from('users')
      .upsert({
        username,
        world_id: worldId,
        last_seen: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    
    this.currentUser = user
    console.log('🌍 Joined world:', worldId)
    
    return user
  }

  subscribeToUserMovements(worldId: string, callback: (user: User) => void) {
    const subscription = this.supabase
      .channel(`world-${worldId}-movements`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `world_id=eq.${worldId}`
      }, (payload) => {
        callback(payload.new as User)
      })
      .subscribe()

    this.subscriptions.push(subscription)
    return subscription
  }

  subscribeToChatMessages(worldId: string, callback: (message: ChatMessage) => void) {
    const subscription = this.supabase
      .channel(`world-${worldId}-chat`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `world_id=eq.${worldId}`
      }, (payload) => {
        callback(payload.new as ChatMessage)
      })
      .subscribe()

    this.subscriptions.push(subscription)
    return subscription
  }

  async sendChatMessage(worldId: string, message: string) {
    if (!this.currentUser) throw new Error('User not connected')

    const { error } = await this.supabase
      .from('chat_messages')
      .insert({
        user_id: this.currentUser.id,
        world_id: worldId,
        message
      })

    if (error) throw error
  }

  async updatePosition(worldId: string, position: { x: number; y: number; z: number }) {
    if (!this.currentUser) throw new Error('User not connected')

    const { error } = await this.supabase
      .from('users')
      .update({
        position,
        last_seen: new Date().toISOString()
      })
      .eq('id', this.currentUser.id)

    if (error) throw error
  }

  async leaveWorld() {
    if (!this.currentUser) return

    // Unsubscribe from all channels
    this.subscriptions.forEach(sub => sub.unsubscribe())
    this.subscriptions = []

    // Update user status
    await this.supabase
      .from('users')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', this.currentUser.id)

    this.currentUser = null
    console.log('👋 Left world')
  }

  disconnect() {
    this.subscriptions.forEach(sub => sub.unsubscribe())
    this.subscriptions = []
    this.currentUser = null
  }
}

export const supabaseService = new SupabaseService()
```

### Step 4: Update Environment Variables

```bash
# .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Remove old Socket.IO config
# VITE_SERVER_URL=https://metaverse-project-3.onrender.com
```

### Step 5: Update Components

**Replace Socket.IO usage in components:**

```typescript
// Before (Socket.IO)
import { socketService } from '../lib/socketService'

// After (Supabase)
import { supabaseService } from '../lib/supabaseService'

// In your component:
useEffect(() => {
  const connect = async () => {
    const connected = await supabaseService.connect()
    if (connected) {
      const user = await supabaseService.joinWorld('main-world', 'Player')
      
      // Subscribe to movements
      supabaseService.subscribeToUserMovements('main-world', (user) => {
        // Handle user movement
      })
      
      // Subscribe to chat
      supabaseService.subscribeToChatMessages('main-world', (message) => {
        // Handle chat message
      })
    }
  }
  
  connect()
  
  return () => {
    supabaseService.leaveWorld()
  }
}, [])
```

### Step 6: Remove Backend Dependencies

**Files to remove:**
- `server/` directory (no longer needed)
- `netlify/functions/socket-proxy.js`
- All Socket.IO related test files

**Dependencies to remove:**
```bash
npm uninstall socket.io-client
npm uninstall @types/socket.io-client
```

**Dependencies to add:**
```bash
npm install @supabase/supabase-js
```

## 🚀 Deployment Changes

### Netlify Configuration (Simplified)

```toml
# netlify.toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  VITE_SUPABASE_URL = "https://your-project.supabase.co"
  VITE_SUPABASE_ANON_KEY = "your-anon-key"
  NODE_ENV = "production"
```

### Remove Render Backend

- Delete Render service (no longer needed)
- Remove `render.yaml`
- Remove server deployment scripts

## 📊 Migration Timeline

**Phase 1 (1-2 hours):**
- Set up Supabase project
- Create database schema
- Install dependencies

**Phase 2 (2-3 hours):**
- Implement Supabase service
- Update core components
- Test basic functionality

**Phase 3 (1-2 hours):**
- Update all components
- Remove Socket.IO code
- Test thoroughly

**Phase 4 (30 minutes):**
- Update deployment config
- Deploy to Netlify
- Remove backend

## 🎯 Expected Results

After migration:
- ✅ No more CORS errors
- ✅ Faster connection times
- ✅ More reliable real-time updates
- ✅ Simpler deployment (frontend only)
- ✅ Better scalability
- ✅ Built-in user management

## 🔧 Rollback Plan

If issues arise:
1. Keep Socket.IO code in a backup branch
2. Supabase has generous free tier
3. Can run both systems in parallel during transition

---

**Ready to migrate?** This will solve your CORS issues permanently and simplify your architecture significantly! 