import React, { useState } from 'react';

export interface PerformanceSettings {
  quality: 'low' | 'medium' | 'high' | 'ultra';
  enableLOD: boolean;
  enableShadows: boolean;
  enableAntialiasing: boolean;
  maxDrawDistance: number;
  targetFPS: number;
}

interface PerformanceSettingsProps {
  settings: PerformanceSettings;
  onSettingsChange: (settings: PerformanceSettings) => void;
  isVisible: boolean;
  onToggle: () => void;
}

const PerformanceSettings: React.FC<PerformanceSettingsProps> = ({
  settings,
  onSettingsChange,
  isVisible,
  onToggle
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const qualityPresets = {
    low: {
      name: 'Low',
      description: 'Best performance, basic graphics',
      icon: '⚡'
    },
    medium: {
      name: 'Medium',
      description: 'Balanced performance and graphics',
      icon: '⚖️'
    },
    high: {
      name: 'High',
      description: 'Better graphics, moderate performance',
      icon: '🎨'
    },
    ultra: {
      name: 'Ultra',
      description: 'Best graphics, may impact performance',
      icon: '💎'
    }
  };

  const handleQualityChange = (quality: PerformanceSettings['quality']) => {
    const newSettings = { ...settings, quality };
    
    // Apply quality-specific settings
    switch (quality) {
      case 'low':
        newSettings.enableLOD = true;
        newSettings.enableShadows = false;
        newSettings.enableAntialiasing = false;
        newSettings.maxDrawDistance = 50;
        newSettings.targetFPS = 30;
        break;
      case 'medium':
        newSettings.enableLOD = true;
        newSettings.enableShadows = false;
        newSettings.enableAntialiasing = true;
        newSettings.maxDrawDistance = 100;
        newSettings.targetFPS = 45;
        break;
      case 'high':
        newSettings.enableLOD = true;
        newSettings.enableShadows = true;
        newSettings.enableAntialiasing = true;
        newSettings.maxDrawDistance = 150;
        newSettings.targetFPS = 60;
        break;
      case 'ultra':
        newSettings.enableLOD = false;
        newSettings.enableShadows = true;
        newSettings.enableAntialiasing = true;
        newSettings.maxDrawDistance = 200;
        newSettings.targetFPS = 60;
        break;
    }
    
    onSettingsChange(newSettings);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg font-mono text-sm z-50 max-w-sm">
      <div className="flex justify-between items-center mb-4">
        <span className="font-bold">Performance Settings</span>
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-white text-lg"
        >
          ×
        </button>
      </div>

      {/* Quality Presets */}
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-2">Quality Preset</label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(qualityPresets).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => handleQualityChange(key as PerformanceSettings['quality'])}
              className={`p-2 rounded text-xs text-left transition-colors ${
                settings.quality === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <div className="text-lg">{preset.icon}</div>
              <div className="font-semibold">{preset.name}</div>
              <div className="text-gray-300">{preset.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Settings Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left text-sm text-blue-300 hover:text-blue-200 mb-2"
      >
        {isExpanded ? '▼' : '▶'} Advanced Settings
      </button>

      {isExpanded && (
        <div className="space-y-3">
          {/* LOD Toggle */}
          <div className="flex justify-between items-center">
            <label className="text-sm">Level of Detail (LOD)</label>
            <input
              type="checkbox"
              checked={settings.enableLOD}
              onChange={(e) => onSettingsChange({
                ...settings,
                enableLOD: e.target.checked
              })}
              className="w-4 h-4"
            />
          </div>

          {/* Shadows Toggle */}
          <div className="flex justify-between items-center">
            <label className="text-sm">Shadows</label>
            <input
              type="checkbox"
              checked={settings.enableShadows}
              onChange={(e) => onSettingsChange({
                ...settings,
                enableShadows: e.target.checked
              })}
              className="w-4 h-4"
            />
          </div>

          {/* Antialiasing Toggle */}
          <div className="flex justify-between items-center">
            <label className="text-sm">Antialiasing</label>
            <input
              type="checkbox"
              checked={settings.enableAntialiasing}
              onChange={(e) => onSettingsChange({
                ...settings,
                enableAntialiasing: e.target.checked
              })}
              className="w-4 h-4"
            />
          </div>

          {/* Draw Distance */}
          <div>
            <label className="block text-sm mb-1">
              Draw Distance: {settings.maxDrawDistance}m
            </label>
            <input
              type="range"
              min="25"
              max="200"
              step="25"
              value={settings.maxDrawDistance}
              onChange={(e) => onSettingsChange({
                ...settings,
                maxDrawDistance: parseInt(e.target.value)
              })}
              className="w-full"
            />
          </div>

          {/* Target FPS */}
          <div>
            <label className="block text-sm mb-1">
              Target FPS: {settings.targetFPS}
            </label>
            <input
              type="range"
              min="30"
              max="60"
              step="15"
              value={settings.targetFPS}
              onChange={(e) => onSettingsChange({
                ...settings,
                targetFPS: parseInt(e.target.value)
              })}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Performance Tips */}
      <div className="mt-4 p-3 bg-blue-900 bg-opacity-30 rounded text-xs">
        <div className="font-semibold mb-1">💡 Performance Tips:</div>
        <ul className="space-y-1 text-blue-200">
          <li>• Lower quality = better performance</li>
          <li>• Disable shadows for faster rendering</li>
          <li>• Reduce draw distance for mobile devices</li>
          <li>• LOD reduces detail for distant objects</li>
        </ul>
      </div>

      {/* Reset Button */}
      <button
        onClick={() => handleQualityChange('medium')}
        className="w-full mt-3 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded text-sm transition-colors"
      >
        🔄 Reset to Default
      </button>
    </div>
  );
};

export default PerformanceSettings; 