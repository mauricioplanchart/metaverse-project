import React, { useState, useEffect } from 'react';
import { socialService, FriendRequest } from '../lib/socialService';
import { User } from '../lib/types';

interface FriendsPanelProps {
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
}

export const FriendsPanel: React.FC<FriendsPanelProps> = ({ currentUser, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'add'>('friends');
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);

  const [addFriendId, setAddFriendId] = useState('');
  const [addFriendMessage, setAddFriendMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadFriends();
      loadFriendRequests();
      setupEventListeners();
    }

    return () => {
      socialService.removeAllListeners();
    };
  }, [isOpen, currentUser.id]);

  const setupEventListeners = () => {
    socialService.onFriendRequestReceived((request) => {
      setFriendRequests(prev => [...prev, request]);
      addNotification(`New friend request from ${request.fromUsername}!`);
    });

    socialService.onFriendRequestAccepted(({ request, friend }) => {
      setFriendRequests(prev => prev.filter(r => r.id !== request.id));
      setFriends(prev => [...prev, friend]);
      addNotification(`${friend.username} accepted your friend request!`);
    });

    socialService.onFriendRequestDeclined((request) => {
      setFriendRequests(prev => prev.filter(r => r.id !== request.id));
      addNotification(`${request.fromUsername} declined your friend request.`);
    });

    socialService.onFriendStatusChanged(({ userId, status, customStatus }) => {
      setFriends(prev => prev.map(friend => 
        friend.id === userId 
          ? { ...friend, status: status as 'online' | 'away' | 'busy' | 'offline', customStatus }
          : friend
      ));
    });
  };

  const loadFriends = async () => {
    try {
      const friendsList = await socialService.getFriends(currentUser.id);
      setFriends(friendsList);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const loadFriendRequests = async () => {
    try {
      const requests = await socialService.getFriendRequests(currentUser.id);
      setFriendRequests(requests);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  };

  const addNotification = (message: string) => {
    setNotifications(prev => [...prev, message]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n !== message));
    }, 5000);
  };

  const handleSendFriendRequest = async () => {
    if (!addFriendId.trim()) return;
    
    setLoading(true);
    try {
      const success = await socialService.sendFriendRequest(addFriendId, addFriendMessage);
      if (success) {
        addNotification('Friend request sent!');
        setAddFriendId('');
        setAddFriendMessage('');
      } else {
        addNotification('Failed to send friend request.');
      }
    } catch (error) {
      addNotification('Error sending friend request.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const success = await socialService.acceptFriendRequest(requestId);
      if (success) {
        addNotification('Friend request accepted!');
      }
    } catch (error) {
      addNotification('Error accepting friend request.');
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const success = await socialService.declineFriendRequest(requestId);
      if (success) {
        addNotification('Friend request declined.');
      }
    } catch (error) {
      addNotification('Error declining friend request.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'away': return 'text-yellow-500';
      case 'busy': return 'text-red-500';
      case 'offline': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return '🟢';
      case 'away': return '🟡';
      case 'busy': return '🔴';
      case 'offline': return '⚫';
      default: return '⚫';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-96 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">👥 Friends</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex mt-4 space-x-2">
            <button
              onClick={() => setActiveTab('friends')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'friends' 
                  ? 'bg-white text-blue-600' 
                  : 'text-white hover:bg-white hover:bg-opacity-20'
              }`}
            >
              Friends ({friends.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'requests' 
                  ? 'bg-white text-blue-600' 
                  : 'text-white hover:bg-white hover:bg-opacity-20'
              }`}
            >
              Requests ({friendRequests.filter(r => r.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'add' 
                  ? 'bg-white text-blue-600' 
                  : 'text-white hover:bg-white hover:bg-opacity-20'
              }`}
            >
              Add Friend
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {/* Notifications */}
          {notifications.length > 0 && (
            <div className="mb-4 space-y-2">
              {notifications.map((notification, index) => (
                <div
                  key={index}
                  className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-2 rounded text-sm"
                >
                  {notification}
                </div>
              ))}
            </div>
          )}

          {/* Friends Tab */}
          {activeTab === 'friends' && (
            <div className="space-y-3">
              {friends.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-2">👥</div>
                  <p>No friends yet</p>
                  <p className="text-sm">Add some friends to get started!</p>
                </div>
              ) : (
                friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {friend.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="font-medium">{friend.username}</div>
                        <div className="flex items-center space-x-1 text-sm">
                          <span className={getStatusColor(friend.status || 'offline')}>
                            {getStatusIcon(friend.status || 'offline')}
                          </span>
                          <span className="text-gray-500">
                            {friend.status || 'offline'}
                          </span>
                          {friend.customStatus && (
                            <span className="text-gray-400">• {friend.customStatus}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {/* TODO: Open private message */}}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Message
                      </button>
                      <button
                        onClick={() => {/* TODO: View profile */}}
                        className="text-gray-600 hover:text-gray-800 text-sm"
                      >
                        Profile
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <div className="space-y-3">
              {friendRequests.filter(r => r.status === 'pending').length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-2">📨</div>
                  <p>No pending requests</p>
                </div>
              ) : (
                friendRequests
                  .filter(r => r.status === 'pending')
                  .map((request) => (
                    <div
                      key={request.id}
                      className="p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {request.fromUsername.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{request.fromUsername}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(request.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      {request.message && (
                        <div className="text-sm text-gray-600 mb-3 italic">
                          "{request.message}"
                        </div>
                      )}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAcceptRequest(request.id)}
                          className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleDeclineRequest(request.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}

          {/* Add Friend Tab */}
          {activeTab === 'add' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User ID
                </label>
                <input
                  type="text"
                  value={addFriendId}
                  onChange={(e) => setAddFriendId(e.target.value)}
                  placeholder="Enter user ID to add as friend"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message (optional)
                </label>
                <textarea
                  value={addFriendMessage}
                  onChange={(e) => setAddFriendMessage(e.target.value)}
                  placeholder="Add a personal message..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <button
                onClick={handleSendFriendRequest}
                disabled={loading || !addFriendId.trim()}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Sending...' : 'Send Friend Request'}
              </button>
              
              <div className="text-sm text-gray-500 text-center">
                <p>💡 Tip: Ask other players for their User ID to add them as friends!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 