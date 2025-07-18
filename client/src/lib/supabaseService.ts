import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { User, Position, ChatMessage } from './types';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export class SupabaseService {
  private user: User | null = null;
  private positionChannel: RealtimeChannel | null = null;
  private chatChannel: RealtimeChannel | null = null;
  // private onUserUpdate: ((users: User[]) => void) | null = null;
  // private onPositionUpdate: ((positions: Position[]) => void) | null = null;
  // private onChatMessage: ((message: ChatMessage) => void) | null = null;

  // User Management
  async createUser(username: string, avatarData: any = {}): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        username,
        avatar_data: avatarData,
        position_data: { x: 0, y: 0, z: 0 },
        world_id: 'main-world',
        is_online: true
      })
      .select()
      .single();

    if (error) throw error;
    this.user = data;
    return data;
  }

  async updateUserPosition(userId: string, position: { x: number; y: number; z: number }) {
    const { error } = await supabase
      .from('user_positions')
      .upsert({
        user_id: userId,
        position_data: position,
        world_id: 'main-world',
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  async updateUserAvatar(userId: string, avatarData: any) {
    const { error } = await supabase
      .from('avatars')
      .upsert({
        user_id: userId,
        avatar_data: avatarData,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  async setUserOnline(userId: string, online: boolean) {
    const { error } = await supabase
      .from('users')
      .update({ 
        is_online: online,
        last_seen: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;
  }

  // Real-time Subscriptions
  subscribeToUsers(callback: (users: User[]) => void) {
    // this.onUserUpdate = callback;
    
    this.positionChannel = supabase
      .channel('user_positions')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'user_positions' },
        async () => {
          const users = await this.getOnlineUsers();
          callback(users);
        }
      )
      .subscribe();
  }

  subscribeToPositions(callback: (positions: Position[]) => void) {
    // this.onPositionUpdate = callback;
    
    this.positionChannel = supabase
      .channel('positions')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'user_positions' },
        async () => {
          const positions = await this.getUserPositions();
          callback(positions);
        }
      )
      .subscribe();
  }

  subscribeToChat(callback: (message: ChatMessage) => void) {
    // this.onChatMessage = callback;
    
    this.chatChannel = supabase
      .channel('chat_messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          callback(payload.new as ChatMessage);
        }
      )
      .subscribe();
  }

  // Data Retrieval
  async getOnlineUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        avatars(avatar_data),
        user_positions(position_data)
      `)
      .eq('is_online', true)
      .eq('world_id', 'main-world');

    if (error) throw error;
    return data || [];
  }

  async getUserPositions(): Promise<Position[]> {
    const { data, error } = await supabase
      .from('user_positions')
      .select(`
        *,
        users(username, avatar_data)
      `)
      .eq('world_id', 'main-world');

    if (error) throw error;
    return data || [];
  }

  async getChatMessages(limit: number = 50): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        users(username)
      `)
      .eq('world_id', 'main-world')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // Chat Functions
  async sendChatMessage(userId: string, message: string, messageType: 'global' | 'proximity' = 'global') {
    const { error } = await supabase
      .from('chat_messages')
      .insert({
        user_id: userId,
        message,
        message_type: messageType,
        world_id: 'main-world'
      });

    if (error) throw error;
  }

  // Cleanup
  unsubscribe() {
    if (this.positionChannel) {
      supabase.removeChannel(this.positionChannel);
    }
    if (this.chatChannel) {
      supabase.removeChannel(this.chatChannel);
    }
  }

  // Getters
  getCurrentUser(): User | null {
    return this.user;
  }

  getSupabaseClient() {
    return supabase;
  }
}

export const supabaseService = new SupabaseService(); 