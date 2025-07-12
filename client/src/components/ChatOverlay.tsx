import React, { useState, useRef, useEffect } from 'react'
import { useMetaverseStore } from '../stores/useMetaverseStore'
import { socketService } from '../lib/socketService'
import { ChatMessage } from '../../../shared/types'

const ChatOverlay: React.FC = () => {
  const { chatMessages, currentUserId, addChatMessage, users } = useMetaverseStore()
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showUserList, setShowUserList] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [lastReadTime, setLastReadTime] = useState(Date.now())
  const [messageReactions, setMessageReactions] = useState<{ [messageId: string]: any }>({})
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const audioRef = useRef<HTMLAudioElement>()

  // Quick emoji reactions
  const quickEmojis = ['👍', '❤️', '😂', '🎉', '😮', '😢', '😡', '👋', '🔥', '💯', '👏', '🙏']

  // Sound notification
  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT')
  }, [])

  // Track unread messages
  useEffect(() => {
    if (!isOpen) {
      const newMessages = chatMessages.filter(msg => 
        msg.timestamp > lastReadTime && msg.userId !== currentUserId
      )
      setUnreadCount(newMessages.length)
      
      // Play sound for new messages
      if (newMessages.length > 0 && soundEnabled && audioRef.current) {
        audioRef.current.play().catch(() => {})
      }
    } else {
      setUnreadCount(0)
      setLastReadTime(Date.now())
    }
  }, [chatMessages, isOpen, lastReadTime, currentUserId, soundEnabled])

  // Socket event handlers
  useEffect(() => {
    const handleTypingUpdate = (data: { userId: string; isTyping: boolean; username: string }) => {
      if (data.userId === currentUserId) return
      
      setTypingUsers(prev => {
        if (data.isTyping) {
          return prev.includes(data.username) ? prev : [...prev, data.username]
        } else {
          return prev.filter(user => user !== data.username)
        }
      })
    }

    const handleReactionUpdate = (data: { messageId: string; reactions: any }) => {
      setMessageReactions(prev => ({
        ...prev,
        [data.messageId]: data.reactions
      }))
    }

    socketService.on('user-typing', handleTypingUpdate)
    socketService.on('message-reaction-updated', handleReactionUpdate)

    return () => {
      socketService.off('user-typing', handleTypingUpdate)
      socketService.off('message-reaction-updated', handleReactionUpdate)
    }
  }, [currentUserId])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !isOpen) {
        e.preventDefault()
        setIsOpen(true)
        setTimeout(() => inputRef.current?.focus(), 100)
      } else if (e.key === 't' && !isOpen && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        setIsOpen(true)
        setTimeout(() => inputRef.current?.focus(), 100)
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setMessage('')
        setShowEmojiPicker(false)
        setShowUserList(false)
      } else if (e.key === '@' && isOpen) {
        setShowUserList(true)
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [isOpen])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const sendMessage = () => {
    if (!message.trim()) return

    const chatMessage: ChatMessage = {
      id: Date.now().toString(),
      userId: currentUserId || 'unknown',
      username: 'You',
      message: message.trim(),
      timestamp: Date.now()
    }

    socketService.sendMessage(message.trim())
    addChatMessage(chatMessage)
    setMessage('')
    setIsTyping(false)
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage()
  }

  const handleTyping = (value: string) => {
    setMessage(value)
    
    if (!isTyping) {
      setIsTyping(true)
      socketService.startTyping()
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      socketService.stopTyping()
    }, 2000)
  }

  const insertEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
    inputRef.current?.focus()
  }

  const mentionUser = (username: string) => {
    setMessage(prev => prev + `@${username} `)
    setShowUserList(false)
    inputRef.current?.focus()
  }

  const reactToMessage = (messageId: string, reaction: string) => {
    socketService.reactToMessage(messageId, reaction)
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatMessage = (text: string) => {
    // Handle mentions
    const mentionRegex = /@(\w+)/g
    const parts = text.split(mentionRegex)
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is a username
        return (
          <span key={index} className="text-blue-400 font-semibold">
            @{part}
          </span>
        )
      }
      return part
    })
  }

  const getMessageTypeColor = (type?: string, isOwn?: boolean) => {
    if (isOwn) return 'bg-blue-500 text-white'
    switch (type) {
      case 'whisper': return 'bg-purple-500 text-white'
      case 'system': return 'bg-gray-500 text-white'
      case 'achievement': return 'bg-yellow-500 text-black'
      default: return 'bg-gray-700 text-white'
    }
  }

  // Keep only last 30 messages for performance
  const recentMessages = chatMessages.slice(-30)

  // Get online users for mentions
  const onlineUsers = Object.values(users).filter(user => user.id !== currentUserId)

  return (
    <div className="fixed bottom-4 left-4 z-50 pointer-events-none">
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg pointer-events-auto transition-all duration-200 hover:scale-110 relative"
          title="Open Chat (Enter or T)"
        >
          💬
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-black/90 backdrop-blur-sm rounded-lg shadow-xl border border-gray-600 w-96 max-h-[500px] flex flex-col pointer-events-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-lg">💬</span>
              <span className="font-semibold">Chat</span>
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                {onlineUsers.length + 1} online
              </span>
              {typingUsers.length > 0 && (
                <span className="text-xs text-blue-200 animate-pulse">
                  {typingUsers.join(', ')} typing...
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`text-white hover:text-gray-200 transition-colors ${soundEnabled ? 'opacity-100' : 'opacity-50'}`}
                title={soundEnabled ? 'Sound On' : 'Sound Off'}
              >
                {soundEnabled ? '🔊' : '🔇'}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-80">
            {recentMessages.length === 0 ? (
              <div className="text-center text-gray-400 text-sm py-4">
                <div className="text-2xl mb-2">💬</div>
                <p>No messages yet</p>
                <p className="text-xs">Start chatting!</p>
              </div>
            ) : (
              recentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col space-y-1 ${
                    msg.userId === currentUserId ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">
                      {msg.userId === currentUserId ? 'You' : msg.username}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <div
                    className={`px-3 py-2 rounded-lg max-w-xs break-words ${
                      getMessageTypeColor(msg.type, msg.userId === currentUserId)
                    }`}
                  >
                    <div className="text-sm">
                      {formatMessage(msg.message)}
                    </div>
                    {/* Message Reactions */}
                    {messageReactions[msg.id] && Object.keys(messageReactions[msg.id]).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(messageReactions[msg.id]).map(([emoji, reaction]: [string, any]) => (
                          <button
                            key={emoji}
                            onClick={() => reactToMessage(msg.id, emoji)}
                            className={`px-2 py-1 rounded-full text-xs transition-colors ${
                              reaction.users.includes('You') 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-600 hover:bg-gray-500 text-white'
                            }`}
                            title={`${reaction.count} reaction${reaction.count > 1 ? 's' : ''}`}
                          >
                            {emoji} {reaction.count}
                          </button>
                        ))}
                      </div>
                    )}
                    {/* Quick Reaction Buttons */}
                    <div className="flex gap-1 mt-2">
                      {quickEmojis.slice(0, 4).map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => reactToMessage(msg.id, emoji)}
                          className="text-xs hover:bg-gray-600 rounded px-1 py-1 transition-colors opacity-60 hover:opacity-100"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* User List for Mentions */}
          {showUserList && (
            <div className="p-2 bg-gray-800 border-t border-gray-600 max-h-32 overflow-y-auto">
              <div className="text-xs text-gray-400 mb-2">Mention a user:</div>
              <div className="space-y-1">
                {onlineUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => mentionUser(user.username || 'User')}
                    className="w-full text-left px-2 py-1 hover:bg-gray-700 rounded text-sm text-white transition-colors"
                  >
                    @{user.username || 'User'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="p-2 bg-gray-800 border-t border-gray-600">
              <div className="text-xs text-gray-400 mb-2">Quick reactions:</div>
              <div className="grid grid-cols-8 gap-1">
                {quickEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => insertEmoji(emoji)}
                    className="p-1 hover:bg-gray-600 rounded text-lg transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-gray-600">
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-gray-400 hover:text-white transition-colors"
                title="Emoji"
              >
                😊
              </button>
              <button
                type="button"
                onClick={() => setShowUserList(!showUserList)}
                className="text-gray-400 hover:text-white transition-colors"
                title="Mention User"
              >
                @
              </button>
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => handleTyping(e.target.value)}
                placeholder="Type a message... (use @ to mention)"
                className="flex-1 bg-gray-700 text-white px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={200}
              />
              <button
                type="submit"
                disabled={!message.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded text-sm transition-colors"
              >
                Send
              </button>
            </div>
            <div className="text-xs text-gray-400 mt-1 flex justify-between">
              <span>Press Enter to send • T to open chat • Esc to close</span>
              <span>{message.length}/200</span>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default ChatOverlay
