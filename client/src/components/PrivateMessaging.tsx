import React, { useState, useEffect, useRef } from 'react';
import { socialService, PrivateMessage } from '../lib/socialService';
import { User } from '../lib/types';

interface PrivateMessagingProps {
  currentUser: User;
  selectedFriend: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PrivateMessaging: React.FC<PrivateMessagingProps> = ({ 
  currentUser, 
  selectedFriend, 
  isOpen, 
  onClose 
}) => {
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [conversations, setConversations] = useState<User[]>([]);
  const [activeConversation, setActiveConversation] = useState<User | null>(selectedFriend);

  useEffect(() => {
    if (isOpen) {
      loadConversations();
      setupEventListeners();
    }

    return () => {
      socialService.removeAllListeners();
    };
  }, [isOpen, currentUser.id]);

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.id);
    }
  }, [activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const setupEventListeners = () => {
    socialService.onPrivateMessageReceived((message) => {
      setMessages(prev => [...prev, message]);
      
      // Mark message as read if conversation is open
      if (activeConversation && 
          (message.fromUserId === activeConversation.id || message.toUserId === activeConversation.id)) {
        socialService.markMessageAsRead(message.id);
      }
    });
  };

  const loadConversations = async () => {
    try {
      const friends = await socialService.getFriends(currentUser.id);
      setConversations(friends);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (friendId: string) => {
    try {
      setLoading(true);
      const allMessages = await socialService.getPrivateMessages(currentUser.id);
      const conversationMessages = allMessages.filter(
        msg => (msg.fromUserId === friendId || msg.toUserId === friendId)
      );
      setMessages(conversationMessages);
      
      // Mark messages as read
      conversationMessages
        .filter(msg => msg.fromUserId === friendId && !msg.isRead)
        .forEach(msg => socialService.markMessageAsRead(msg.id));
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;

    try {
      const sentMessage = await socialService.sendPrivateMessage(
        activeConversation.id,
        newMessage.trim()
      );
      
      if (sentMessage) {
        setMessages(prev => [...prev, sentMessage]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageBubbleClass = (message: PrivateMessage) => {
    const isOwnMessage = message.fromUserId === currentUser.id;
    return isOwnMessage
      ? 'bg-blue-500 text-white ml-auto'
      : 'bg-gray-200 text-gray-800';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[800px] h-[600px] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">💬 Private Messages</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Conversations Sidebar */}
          <div className="w-1/3 border-r border-gray-200 bg-gray-50">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-2">Conversations</h3>
              <input
                type="text"
                placeholder="Search friends..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="overflow-y-auto h-full">
              {conversations.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-3xl mb-2">👥</div>
                  <p>No friends yet</p>
                  <p className="text-sm">Add friends to start messaging!</p>
                </div>
              ) : (
                conversations.map((friend) => (
                  <div
                    key={friend.id}
                    onClick={() => setActiveConversation(friend)}
                    className={`p-3 cursor-pointer hover:bg-gray-100 transition-colors ${
                      activeConversation?.id === friend.id ? 'bg-blue-100 border-r-2 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {friend.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {friend.username}
                        </div>
                        <div className="flex items-center space-x-1 text-sm">
                          <span className={`w-2 h-2 rounded-full ${
                            friend.status === 'online' ? 'bg-green-500' :
                            friend.status === 'away' ? 'bg-yellow-500' :
                            friend.status === 'busy' ? 'bg-red-500' : 'bg-gray-400'
                          }`}></span>
                          <span className="text-gray-500">
                            {friend.status || 'offline'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-white">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {activeConversation.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="font-semibold">{activeConversation.username}</div>
                      <div className="flex items-center space-x-1 text-sm">
                        <span className={`w-2 h-2 rounded-full ${
                          activeConversation.status === 'online' ? 'bg-green-500' :
                          activeConversation.status === 'away' ? 'bg-yellow-500' :
                          activeConversation.status === 'busy' ? 'bg-red-500' : 'bg-gray-400'
                        }`}></span>
                        <span className="text-gray-500">
                          {activeConversation.status || 'offline'}
                        </span>
                        {activeConversation.customStatus && (
                          <span className="text-gray-400">• {activeConversation.customStatus}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {loading ? (
                    <div className="text-center text-gray-500 py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="mt-2">Loading messages...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <div className="text-4xl mb-2">💬</div>
                      <p>No messages yet</p>
                      <p className="text-sm">Start a conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.fromUserId === currentUser.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${getMessageBubbleClass(message)}`}>
                          <div className="text-sm">{message.message}</div>
                          <div className={`text-xs mt-1 ${
                            message.fromUserId === currentUser.id ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {formatTime(message.timestamp)}
                            {message.fromUserId === currentUser.id && (
                              <span className="ml-2">
                                {message.isRead ? '✓✓' : '✓'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex space-x-2">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      rows={2}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      Send
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Press Enter to send, Shift+Enter for new line
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <p className="text-lg">Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 