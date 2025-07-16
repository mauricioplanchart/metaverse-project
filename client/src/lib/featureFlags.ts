// Feature Flags System - Like Facebook's
interface FeatureFlags {
    new3DObjects: boolean;
    enhancedChat: boolean;
    multiplayerMode: boolean;
    experimentalFeatures: boolean;
    betaMode: boolean;
}

class FeatureFlagManager {
    private flags: FeatureFlags = {
        new3DObjects: true,        // Safe to enable
        enhancedChat: false,       // Still testing
        multiplayerMode: true,     // Working well
        experimentalFeatures: false, // Risky features
        betaMode: false            // Beta testing mode
    };

    // Check if a feature is enabled
    isEnabled(feature: keyof FeatureFlags): boolean {
        return this.flags[feature] || false;
    }

    // Enable/disable features remotely
    setFlag(feature: keyof FeatureFlags, enabled: boolean) {
        this.flags[feature] = enabled;
        console.log(`🚩 Feature flag ${feature}: ${enabled ? 'ENABLED' : 'DISABLED'}`);
        
        // Notify components of flag changes
        this.notifyFlagChange(feature, enabled);
    }

    // Get all flags (for admin panel)
    getAllFlags(): FeatureFlags {
        return { ...this.flags };
    }

    // Load flags from server (like Facebook does)
    async loadFlagsFromServer() {
        try {
            // In real implementation, fetch from your backend
            const response = await fetch('/api/feature-flags');
            const serverFlags = await response.json();
            this.flags = { ...this.flags, ...serverFlags };
            console.log('🚩 Feature flags loaded from server');
        } catch (error) {
            console.log('🚩 Using local feature flags (server unavailable)');
        }
    }

    // Notify components when flags change
    private notifyFlagChange(feature: keyof FeatureFlags, enabled: boolean) {
        // Dispatch custom event for components to listen to
        window.dispatchEvent(new CustomEvent('featureFlagChanged', {
            detail: { feature, enabled }
        }));
    }

    // Emergency disable all experimental features
    emergencyDisable() {
        this.flags.experimentalFeatures = false;
        this.flags.betaMode = false;
        this.flags.enhancedChat = false;
        console.log('🚨 Emergency mode: All experimental features disabled');
    }
}

// Global feature flag instance
export const featureFlags = new FeatureFlagManager();

// Helper hook for React components
export const useFeatureFlag = (feature: keyof FeatureFlags) => {
    return featureFlags.isEnabled(feature);
};

// Example usage in components:
// if (useFeatureFlag('new3DObjects')) {
//     renderNewObjects();
// } else {
//     renderOldObjects();
// } 