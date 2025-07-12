import React, { useState, useEffect } from 'react';
import { socialService, UserProfile } from '../lib/socialService';
import { User } from '../lib/types';

interface UserProfileProps {
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileComponent: React.FC<UserProfileProps> = ({ currentUser, isOpen, onClose }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'privacy' | 'social'>('profile');
  const [notifications, setNotifications] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    favoriteEmote: '',
    favoriteColor: '#3B82F6',
    socialLinks: {
      discord: '',
      twitter: '',
      website: ''
    },
    privacy: {
      showOnlineStatus: true,
      allowFriendRequests: true,
      allowPrivateMessages: true,
      showLastSeen: true
    }
  });

  useEffect(() => {
    if (isOpen) {
      loadProfile();
    }
  }, [isOpen, currentUser.id]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const userProfile = await socialService.getUserProfile(currentUser.id);
      if (userProfile) {
        setProfile(userProfile);
        setFormData({
          displayName: userProfile.displayName,
          bio: userProfile.bio,
          favoriteEmote: userProfile.favoriteEmote,
          favoriteColor: userProfile.favoriteColor,
          socialLinks: { 
            discord: userProfile.socialLinks.discord || '',
            twitter: userProfile.socialLinks.twitter || '',
            website: userProfile.socialLinks.website || ''
          },
          privacy: { ...userProfile.privacy }
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      addNotification('Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const addNotification = (message: string) => {
    setNotifications(prev => [...prev, message]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n !== message));
    }, 5000);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const updatedProfile = await socialService.updateProfile(formData);
      if (updatedProfile) {
        setProfile(updatedProfile);
        setIsEditing(false);
        addNotification('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      addNotification('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (status: 'online' | 'away' | 'busy' | 'offline') => {
    socialService.updateStatus(status);
    addNotification(`Status changed to ${status}`);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getLevelProgress = (xp: number) => {
    const level = Math.floor(xp / 100) + 1;
    const progress = (xp % 100) / 100;
    return { level, progress };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[600px] max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">👤 User Profile</h2>
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
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'profile' 
                  ? 'bg-white text-blue-600' 
                  : 'text-white hover:bg-white hover:bg-opacity-20'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'privacy' 
                  ? 'bg-white text-blue-600' 
                  : 'text-white hover:bg-white hover:bg-opacity-20'
              }`}
            >
              Privacy
            </button>
            <button
              onClick={() => setActiveTab('social')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'social' 
                  ? 'bg-white text-blue-600' 
                  : 'text-white hover:bg-white hover:bg-opacity-20'
              }`}
            >
              Social
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

          {loading ? (
            <div className="text-center text-gray-500 py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2">Loading profile...</p>
            </div>
          ) : (
            <>
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  {/* Avatar and Basic Info */}
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                      {profile?.displayName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {profile?.displayName || 'User'}
                    </h3>
                    <p className="text-gray-500">@{currentUser.username}</p>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    {isEditing ? (
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Tell us about yourself..."
                      />
                    ) : (
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                        {profile?.bio || 'No bio yet'}
                      </p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {profile ? getLevelProgress(profile.xp).level : 1}
                      </div>
                      <div className="text-sm text-gray-500">Level</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {profile?.xp || 0}
                      </div>
                      <div className="text-sm text-gray-500">XP</div>
                    </div>
                  </div>

                  {/* Level Progress */}
                  {profile && (
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Level {getLevelProgress(profile.xp).level}</span>
                        <span>{profile.xp % 100}/100 XP</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getLevelProgress(profile.xp).progress * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Join Date */}
                  <div className="text-center text-sm text-gray-500">
                    Member since {profile ? formatDate(profile.joinDate) : 'Unknown'}
                  </div>

                  {/* Edit Button */}
                  <div className="text-center">
                    {isEditing ? (
                      <div className="space-x-2">
                        <button
                          onClick={handleSave}
                          disabled={loading}
                          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
                        >
                          {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                      >
                        Edit Profile
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Privacy Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Show Online Status</div>
                        <div className="text-sm text-gray-500">Let others see when you're online</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.privacy.showOnlineStatus}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            privacy: { ...prev.privacy, showOnlineStatus: e.target.checked }
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Allow Friend Requests</div>
                        <div className="text-sm text-gray-500">Let others send you friend requests</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.privacy.allowFriendRequests}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            privacy: { ...prev.privacy, allowFriendRequests: e.target.checked }
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Allow Private Messages</div>
                        <div className="text-sm text-gray-500">Let others send you private messages</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.privacy.allowPrivateMessages}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            privacy: { ...prev.privacy, allowPrivateMessages: e.target.checked }
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Show Last Seen</div>
                        <div className="text-sm text-gray-500">Let others see when you were last online</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.privacy.showLastSeen}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            privacy: { ...prev.privacy, showLastSeen: e.target.checked }
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
                    >
                      {loading ? 'Saving...' : 'Save Privacy Settings'}
                    </button>
                  </div>
                </div>
              )}

              {/* Social Tab */}
              {activeTab === 'social' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Social Settings</h3>
                  
                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Status
                    </label>
                    <div className="flex space-x-2">
                      {(['online', 'away', 'busy', 'offline'] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(status)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            currentUser.status === status
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Social Links</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Discord
                      </label>
                      <input
                        type="text"
                        value={formData.socialLinks.discord}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          socialLinks: { ...prev.socialLinks, discord: e.target.value }
                        }))}
                        placeholder="Your Discord username"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Twitter
                      </label>
                      <input
                        type="text"
                        value={formData.socialLinks.twitter}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                        }))}
                        placeholder="@username"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Website
                      </label>
                      <input
                        type="url"
                        value={formData.socialLinks.website}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          socialLinks: { ...prev.socialLinks, website: e.target.value }
                        }))}
                        placeholder="https://yourwebsite.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
                    >
                      {loading ? 'Saving...' : 'Save Social Settings'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}; 