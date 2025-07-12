import React, { useState } from 'react';
import { useMetaverseStore } from '../stores/useMetaverseStore';
import { socketService } from '../lib/socketService';

const AvatarControlPanel: React.FC = () => {
  const { avatarCustomization, setCurrentEmote, setAvatarCustomization } = useMetaverseStore();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('emotes');

  const quickEmotes = [
    { name: 'wave', icon: '👋' },
    { name: 'dance', icon: '💃' },
    { name: 'sit', icon: '🪑' },
    { name: 'jump', icon: '🦘' },
    { name: 'clap', icon: '👏' },
    { name: 'bow', icon: '🙇' },
    { name: 'salute', icon: '🫡' },
    { name: 'point', icon: '👆' },
    { name: 'thumbsup', icon: '👍' },
    { name: 'peace', icon: '✌️' },
    { name: 'flex', icon: '💪' },
    { name: 'meditate', icon: '🧘' },
    { name: 'sleep', icon: '😴' },
    { name: 'laugh', icon: '😂' },
    { name: 'cry', icon: '😢' },
    { name: 'angry', icon: '😠' },
    { name: 'surprised', icon: '😮' },
    { name: 'wink', icon: '😉' },
    { name: 'blowkiss', icon: '😘' },
    { name: 'facepalm', icon: '🤦' },
    { name: 'shrug', icon: '🤷' },
    { name: 'nod', icon: '🙂' },
    { name: 'shake', icon: '🙁' },
    { name: 'yawn', icon: '🥱' },
    { name: 'sneeze', icon: '🤧' }
  ];

  const performEmote = (emote: string) => {
    setCurrentEmote(emote);
    socketService.emit('emote', { emote });
  };

  const updatePose = (axis: string, value: number) => {
    const pose = avatarCustomization.pose || { rotation: 0, tilt: 0, lean: 0 };
    const newPose = { ...pose, [axis]: value };
    setAvatarCustomization({
      ...avatarCustomization,
      pose: newPose
    });
    socketService.emit('avatar-update', { pose: newPose });
  };

  const resetPose = () => {
    const resetPose = { rotation: 0, tilt: 0, lean: 0 };
    setAvatarCustomization({
      ...avatarCustomization,
      pose: resetPose
    });
    socketService.emit('avatar-update', { pose: resetPose });
  };

  const quickPoses = [
    { name: 'Neutral', pose: { rotation: 0, tilt: 0, lean: 0 } },
    { name: 'Confident', pose: { rotation: 0, tilt: 5, lean: 5 } },
    { name: 'Shy', pose: { rotation: -10, tilt: -5, lean: -5 } },
    { name: 'Proud', pose: { rotation: 0, tilt: 10, lean: 10 } },
    { name: 'Casual', pose: { rotation: 5, tilt: 0, lean: 0 } },
    { name: 'Alert', pose: { rotation: 0, tilt: 15, lean: 0 } }
  ];

  const applyQuickPose = (pose: any) => {
    setAvatarCustomization({
      ...avatarCustomization,
      pose
    });
    socketService.emit('avatar-update', { pose });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
          title="Avatar Controls"
        >
          🎭
        </button>
      )}

      {/* Control Panel */}
      {isOpen && (
        <div className="bg-black/90 backdrop-blur-sm rounded-lg shadow-xl border border-gray-600 w-80 max-h-96 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 rounded-t-lg flex justify-between items-center">
            <h3 className="font-semibold">Avatar Controls</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-600">
            {['emotes', 'pose', 'quick'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-3 py-2 text-sm font-medium capitalize ${
                  activeTab === tab 
                    ? 'border-b-2 border-purple-500 text-purple-400' 
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-3">
            {/* Emotes Tab */}
            {activeTab === 'emotes' && (
              <div className="space-y-3">
                <div className="grid grid-cols-6 gap-2">
                  {quickEmotes.map(emote => (
                    <button
                      key={emote.name}
                      onClick={() => performEmote(emote.name)}
                      className={`p-2 rounded text-lg transition-colors ${
                        avatarCustomization.currentEmote === emote.name
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-700 hover:bg-gray-600 text-white'
                      }`}
                      title={emote.name}
                    >
                      {emote.icon}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pose Tab */}
            {activeTab === 'pose' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">Body Rotation</label>
                  <input
                    type="range"
                    min="-45"
                    max="45"
                    value={avatarCustomization.pose?.rotation || 0}
                    onChange={(e) => updatePose('rotation', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    {avatarCustomization.pose?.rotation || 0}°
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">Head Tilt</label>
                  <input
                    type="range"
                    min="-30"
                    max="30"
                    value={avatarCustomization.pose?.tilt || 0}
                    onChange={(e) => updatePose('tilt', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    {avatarCustomization.pose?.tilt || 0}°
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">Body Lean</label>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    value={avatarCustomization.pose?.lean || 0}
                    onChange={(e) => updatePose('lean', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    {avatarCustomization.pose?.lean || 0}°
                  </div>
                </div>

                <button
                  onClick={resetPose}
                  className="w-full px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm transition-colors"
                >
                  Reset Pose
                </button>
              </div>
            )}

            {/* Quick Poses Tab */}
            {activeTab === 'quick' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {quickPoses.map(pose => (
                    <button
                      key={pose.name}
                      onClick={() => applyQuickPose(pose.pose)}
                      className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
                    >
                      {pose.name}
                    </button>
                  ))}
                </div>
                
                <div className="pt-2 border-t border-gray-600">
                  <h4 className="text-sm font-medium text-white mb-2">Current Pose</h4>
                  <div className="text-xs text-gray-400 space-y-1">
                    <div>Rotation: {avatarCustomization.pose?.rotation || 0}°</div>
                    <div>Tilt: {avatarCustomization.pose?.tilt || 0}°</div>
                    <div>Lean: {avatarCustomization.pose?.lean || 0}°</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AvatarControlPanel; 