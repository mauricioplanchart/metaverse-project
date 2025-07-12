import React, { useState } from 'react';
import { useMetaverseStore } from '../stores/useMetaverseStore';
import { FriendsPanel } from './FriendsPanel';
import { PrivateMessaging } from './PrivateMessaging';
import { UserProfileComponent } from './UserProfile';
import AvatarControlPanel from './AvatarControlPanel';

export const UI: React.FC = () => {
  const { 
    currentUser,
    onlineUsers,
    avatarCustomization
  } = useMetaverseStore()

  const [showControls, setShowControls] = useState(false);
  const [showPlayerList, setShowPlayerList] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedFriend] = useState<any>(null);

  const movementControls = [
    { key: 'W', action: 'Move Forward' },
    { key: 'S', action: 'Move Backward' },
    { key: 'A', action: 'Move Left' },
    { key: 'D', action: 'Move Right' },
    { key: 'Space', action: 'Jump' },
  ];

  const emoteControls = [
    { key: 'E', action: 'Wave' },
    { key: 'Q', action: 'Dance' },
    { key: 'R', action: 'Sit' },
    { key: 'F', action: 'Jump' },
    { key: 'G', action: 'Clap' },
    { key: 'H', action: 'Bow' },
    { key: 'J', action: 'Salute' },
    { key: 'K', action: 'Point' },
    { key: 'L', action: 'Thumbs Up' },
    { key: 'Z', action: 'Peace' },
    { key: 'X', action: 'Flex' },
    { key: 'C', action: 'Meditate' },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Top HUD */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
        {/* Player Info */}
        <div className="bg-black/50 text-white p-4 rounded-lg pointer-events-auto">
          <h3 className="text-lg font-bold mb-2">Player Info</h3>
          <div className="space-y-1">
            <p><span className="text-blue-400">Name:</span> {currentUser?.username || 'Player'}</p>
            <p><span className="text-blue-400">Room:</span> {currentUser?.currentRoom || 'main-world'}</p>
            <p><span className="text-blue-400">Online:</span> {onlineUsers.length} players</p>
            <p><span className="text-blue-400">Position:</span> {currentUser?.position ? 
              `X: ${currentUser.position.x.toFixed(1)}, Y: ${currentUser.position.y.toFixed(1)}, Z: ${currentUser.position.z.toFixed(1)}` : 
              'Unknown'
            }</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowControls(!showControls)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg pointer-events-auto transition-colors"
          >
            {showControls ? 'Hide' : 'Show'} Controls
          </button>
          <button
            onClick={() => setShowPlayerList(!showPlayerList)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg pointer-events-auto transition-colors"
          >
            Players ({onlineUsers.length})
          </button>
          <button
            onClick={() => setShowFriends(!showFriends)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg pointer-events-auto transition-colors"
          >
            👥 Friends
          </button>
          <button
            onClick={() => setShowMessages(!showMessages)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg pointer-events-auto transition-colors"
          >
            💬 Messages
          </button>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg pointer-events-auto transition-colors"
          >
            👤 Profile
          </button>
        </div>
      </div>

      {/* Controls Panel */}
      {showControls && (
        <div className="absolute top-20 left-4 bg-black/80 text-white p-6 rounded-lg max-w-md pointer-events-auto">
          <h3 className="text-xl font-bold mb-4">Controls</h3>
          
          {/* Movement Controls */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-3 text-blue-400">Movement</h4>
            <div className="grid grid-cols-2 gap-2">
              {movementControls.map((control) => (
                <div key={control.key} className="flex justify-between">
                  <kbd className="bg-gray-700 px-2 py-1 rounded text-sm">{control.key}</kbd>
                  <span className="text-sm">{control.action}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Emote Controls */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-3 text-green-400">Emotes</h4>
            <div className="grid grid-cols-2 gap-2">
              {emoteControls.map((control) => (
                <div key={control.key} className="flex justify-between">
                  <kbd className="bg-gray-700 px-2 py-1 rounded text-sm">{control.key}</kbd>
                  <span className="text-sm">{control.action}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Avatar Info */}
          <div>
            <h4 className="text-lg font-semibold mb-3 text-purple-400">Avatar</h4>
            <div className="space-y-1 text-sm">
              <p><span className="text-gray-400">Body Type:</span> {avatarCustomization.bodyType}</p>
              <p><span className="text-gray-400">Height:</span> {avatarCustomization.height}</p>
              <p><span className="text-gray-400">Hair:</span> {avatarCustomization.hairStyle}</p>
              <p><span className="text-gray-400">Accessories:</span> {avatarCustomization.accessories.length}</p>
              <p><span className="text-gray-400">Current Emote:</span> {avatarCustomization.currentEmote || 'None'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Player List */}
      {showPlayerList && (
        <div className="absolute top-20 right-4 bg-black/80 text-white p-6 rounded-lg max-w-sm pointer-events-auto">
          <h3 className="text-xl font-bold mb-4">Online Players</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {onlineUsers.map((user) => (
              <div key={user.id} className="flex justify-between items-center p-2 bg-gray-800 rounded">
                <div>
                  <p className="font-medium">{user.username}</p>
                  <p className="text-xs text-gray-400">
                    {user.currentRoom} • {user.position ? 
                      `${user.position.x.toFixed(0)}, ${user.position.z.toFixed(0)}` : 
                      'Unknown position'
                    }
                  </p>
                </div>
                <div className="text-xs text-green-400">●</div>
              </div>
            ))}
            {onlineUsers.length === 0 && (
              <p className="text-gray-400 text-center">No other players online</p>
            )}
          </div>
        </div>
      )}

      {/* Bottom HUD */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-black/50 text-white p-4 rounded-lg pointer-events-auto">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-300">Press <kbd className="bg-gray-700 px-2 py-1 rounded">?</kbd> for help</p>
              <p className="text-sm text-gray-300">Use <kbd className="bg-gray-700 px-2 py-1 rounded">WASD</kbd> to move, <kbd className="bg-gray-700 px-2 py-1 rounded">E</kbd> to wave</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-300">FPS: 60</p>
              <p className="text-sm text-gray-300">Ping: 20ms</p>
            </div>
          </div>
        </div>
      </div>

      {/* Help Overlay */}
      <div className="absolute inset-0 bg-black/90 text-white flex items-center justify-center pointer-events-auto" style={{ display: 'none' }}>
        <div className="bg-gray-800 p-8 rounded-lg max-w-2xl">
          <h2 className="text-3xl font-bold mb-6">Metaverse Controls</h2>
          
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4 text-blue-400">Movement</h3>
              <div className="space-y-2">
                {movementControls.map((control) => (
                  <div key={control.key} className="flex justify-between">
                    <kbd className="bg-gray-700 px-3 py-1 rounded">{control.key}</kbd>
                    <span>{control.action}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-4 text-green-400">Emotes</h3>
              <div className="space-y-2">
                {emoteControls.map((control) => (
                  <div key={control.key} className="flex justify-between">
                    <kbd className="bg-gray-700 px-3 py-1 rounded">{control.key}</kbd>
                    <span>{control.action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <button className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded">
              Close Help
            </button>
          </div>
        </div>
      </div>

      {/* Social Features */}
      {currentUser && (
        <>
          <FriendsPanel
            currentUser={currentUser}
            isOpen={showFriends}
            onClose={() => setShowFriends(false)}
          />

          <PrivateMessaging
            currentUser={currentUser}
            selectedFriend={selectedFriend}
            isOpen={showMessages}
            onClose={() => setShowMessages(false)}
          />

          <UserProfileComponent
            currentUser={currentUser}
            isOpen={showProfile}
            onClose={() => setShowProfile(false)}
          />
        </>
      )}

      {/* Avatar Control Panel */}
      <AvatarControlPanel />
    </div>
  )
}

export default UI
