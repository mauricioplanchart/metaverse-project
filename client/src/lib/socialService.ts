import { socketService } from './socketService';
import { User } from './types';

// Social feature types
export interface UserProfile {
  displayName: string;
  bio: string;
  avatar: string;
  joinDate: number;
  level: number;
  xp: number;
  achievements: string[];
  favoriteEmote: string;
  favoriteColor: string;
  socialLinks: {
    discord?: string;
    twitter?: string;
    website?: string;
  };
  privacy: {
    showOnlineStatus: boolean;
    allowFriendRequests: boolean;
    allowPrivateMessages: boolean;
    showLastSeen: boolean;
  };
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  message?: string;
  timestamp: number;
  status: 'pending' | 'accepted' | 'declined';
}

export interface PrivateMessage {
  id: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  toUsername: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  messageType: 'text' | 'emote' | 'invite' | 'system';
}

export interface SocialEvent {
  id: string;
  type: 'friend_request' | 'message' | 'status_update' | 'achievement' | 'invite';
  userId: string;
  username: string;
  data: any;
  timestamp: number;
  isRead: boolean;
}

export class SocialService {
  private static instance: SocialService;
  
  public static getInstance(): SocialService {
    if (!SocialService.instance) {
      SocialService.instance = new SocialService();
    }
    return SocialService.instance;
  }

  // Friend System
  sendFriendRequest(toUserId: string, message?: string): Promise<boolean> {
    return new Promise((resolve) => {
      socketService.emit('send_friend_request', { toUserId, message });
      
      const handleResponse = () => {
        socketService.off('friend_request_sent', handleResponse);
        resolve(true);
      };
      
      socketService.on('friend_request_sent', handleResponse);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        socketService.off('friend_request_sent', handleResponse);
        resolve(false);
      }, 5000);
    });
  }

  acceptFriendRequest(requestId: string): Promise<boolean> {
    return new Promise((resolve) => {
      socketService.emit('accept_friend_request', requestId);
      
      const handleResponse = (data: { requestId: string; action: string }) => {
        if (data.requestId === requestId && data.action === 'accepted') {
          socketService.off('friend_request_handled', handleResponse);
          resolve(true);
        }
      };
      
      socketService.on('friend_request_handled', handleResponse);
      
      setTimeout(() => {
        socketService.off('friend_request_handled', handleResponse);
        resolve(false);
      }, 5000);
    });
  }

  declineFriendRequest(requestId: string): Promise<boolean> {
    return new Promise((resolve) => {
      socketService.emit('decline_friend_request', requestId);
      
      const handleResponse = (data: { requestId: string; action: string }) => {
        if (data.requestId === requestId && data.action === 'declined') {
          socketService.off('friend_request_handled', handleResponse);
          resolve(true);
        }
      };
      
      socketService.on('friend_request_handled', handleResponse);
      
      setTimeout(() => {
        socketService.off('friend_request_handled', handleResponse);
        resolve(false);
      }, 5000);
    });
  }

  // Private Messaging
  sendPrivateMessage(toUserId: string, message: string, messageType: 'text' | 'emote' | 'invite' | 'system' = 'text'): Promise<PrivateMessage | null> {
    return new Promise((resolve) => {
      socketService.emit('send_private_message', { toUserId, message, messageType });
      
      const handleResponse = (sentMessage: PrivateMessage) => {
        socketService.off('private_message_sent', handleResponse);
        resolve(sentMessage);
      };
      
      socketService.on('private_message_sent', handleResponse);
      
      setTimeout(() => {
        socketService.off('private_message_sent', handleResponse);
        resolve(null);
      }, 5000);
    });
  }

  markMessageAsRead(messageId: string): void {
    socketService.emit('mark_message_read', messageId);
  }

  // Profile Management
  updateProfile(profileData: Partial<UserProfile>): Promise<UserProfile | null> {
    return new Promise((resolve) => {
      socketService.emit('update_profile', profileData);
      
      const handleResponse = (profile: UserProfile) => {
        socketService.off('profile_updated', handleResponse);
        resolve(profile);
      };
      
      socketService.on('profile_updated', handleResponse);
      
      setTimeout(() => {
        socketService.off('profile_updated', handleResponse);
        resolve(null);
      }, 5000);
    });
  }

  updateStatus(status: 'online' | 'away' | 'busy' | 'offline', customStatus?: string): void {
    socketService.emit('update_status', { status, customStatus });
  }

  // Event Listeners
  onFriendRequestReceived(callback: (request: FriendRequest) => void): void {
    socketService.on('friend_request_received', callback);
  }

  onFriendRequestAccepted(callback: (data: { request: FriendRequest; friend: User }) => void): void {
    socketService.on('friend_request_accepted', callback);
  }

  onFriendRequestDeclined(callback: (request: FriendRequest) => void): void {
    socketService.on('friend_request_declined', callback);
  }

  onPrivateMessageReceived(callback: (message: PrivateMessage) => void): void {
    socketService.on('private_message_received', callback);
  }

  onFriendStatusChanged(callback: (data: { userId: string; status: string; customStatus?: string }) => void): void {
    socketService.on('friend_status_changed', callback);
  }

  // API Calls
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const response = await fetch(`http://localhost:3001/api/users/${userId}/profile`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  async getFriends(userId: string): Promise<User[]> {
    try {
      const response = await fetch(`http://localhost:3001/api/users/${userId}/friends`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching friends:', error);
      return [];
    }
  }

  async getFriendRequests(userId: string): Promise<FriendRequest[]> {
    try {
      const response = await fetch(`http://localhost:3001/api/users/${userId}/friend-requests`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      return [];
    }
  }

  async getPrivateMessages(userId: string): Promise<PrivateMessage[]> {
    try {
      const response = await fetch(`http://localhost:3001/api/users/${userId}/messages`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching private messages:', error);
      return [];
    }
  }

  async getSocialEvents(userId: string): Promise<SocialEvent[]> {
    try {
      const response = await fetch(`http://localhost:3001/api/users/${userId}/social-events`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching social events:', error);
      return [];
    }
  }

  // Cleanup
  removeAllListeners(): void {
    socketService.off('friend_request_received');
    socketService.off('friend_request_accepted');
    socketService.off('friend_request_declined');
    socketService.off('private_message_received');
    socketService.off('friend_status_changed');
    socketService.off('profile_updated');
    socketService.off('private_message_sent');
    socketService.off('friend_request_handled');
  }
}

export const socialService = SocialService.getInstance(); 