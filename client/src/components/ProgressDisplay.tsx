import React, { useState } from 'react';
import { useMetaverseStore } from '../stores/useMetaverseStore';

const ProgressDisplay: React.FC = () => {
  const { userProgress, unlockedAchievements } = useMetaverseStore();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!userProgress) return null;

  const xpPercentage = (userProgress.xp / userProgress.xpToNextLevel) * 100;

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      borderRadius: '15px',
      padding: '16px',
      minWidth: '280px',
      backdropFilter: 'blur(10px)',
      border: '2px solid rgba(255, 255, 255, 0.1)',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      zIndex: 1000
    }}
    onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            backgroundColor: '#4CAF50',
            color: 'white',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            {userProgress.level}
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
              Level {userProgress.level}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>
              {userProgress.xp} / {userProgress.xpToNextLevel} XP
            </div>
          </div>
        </div>
        <div style={{
          fontSize: '12px',
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease'
        }}>
          ▼
        </div>
      </div>

      {/* XP Progress Bar */}
      <div style={{
        width: '100%',
        height: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '4px',
        overflow: 'hidden',
        marginBottom: isExpanded ? '16px' : '0'
      }}>
        <div style={{
          width: `${xpPercentage}%`,
          height: '100%',
          backgroundColor: '#4CAF50',
          borderRadius: '4px',
          transition: 'width 0.5s ease',
          boxShadow: '0 0 10px rgba(76, 175, 80, 0.5)'
        }} />
      </div>

      {/* Expanded Stats */}
      {isExpanded && (
        <div style={{
          animation: 'slideDown 0.3s ease'
        }}>
          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              padding: '8px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2196F3' }}>
                {userProgress.stats.teleports}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.7 }}>
                🚀 Teleports
              </div>
            </div>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              padding: '8px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#FF9800' }}>
                {userProgress.stats.itemsCollected}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.7 }}>
                💎 Items
              </div>
            </div>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              padding: '8px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#9C27B0' }}>
                {userProgress.stats.roomsDiscovered}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.7 }}>
                🗺️ Rooms
              </div>
            </div>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              padding: '8px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4CAF50' }}>
                {userProgress.stats.achievementsUnlocked}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.7 }}>
                🏆 Achievements
              </div>
            </div>
          </div>

          {/* Recent Achievements */}
          {unlockedAchievements.length > 0 && (
            <div>
              <div style={{
                fontSize: '14px',
                fontWeight: 'bold',
                marginBottom: '8px',
                color: '#FFD700'
              }}>
                🏆 Recent Achievements
              </div>
              <div style={{
                maxHeight: '120px',
                overflowY: 'auto',
                scrollbarWidth: 'thin'
              }}>
                {unlockedAchievements.slice(-3).map((achievement) => (
                  <div key={achievement.id} style={{
                    backgroundColor: 'rgba(255, 215, 0, 0.1)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '8px',
                    padding: '8px',
                    marginBottom: '4px',
                    fontSize: '12px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span style={{ fontSize: '16px' }}>{achievement.icon}</span>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#FFD700' }}>
                          {achievement.name}
                        </div>
                        <div style={{ opacity: 0.8, fontSize: '11px' }}>
                          {achievement.description}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <style>
        {`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          /* Custom scrollbar */
          div::-webkit-scrollbar {
            width: 4px;
          }
          
          div::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
          }
          
          div::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 2px;
          }
          
          div::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
          }
        `}
      </style>
    </div>
  );
};

export default ProgressDisplay; 