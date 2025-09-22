// Settings System
// ===============
// Manages user preferences and application settings

// Settings keys and default values
const SETTINGS_KEY = 'appSettings';
const DEFAULT_SETTINGS = {
    audioEnabled: true,
    darkMode: false,
    autoRefresh: true,
    notificationsEnabled: true,
    animationsEnabled: true,
    compactMode: false
};

// Core settings functions
function getSettings() {
    try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
        return DEFAULT_SETTINGS;
    }
}

function saveSettings(settings) {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
}

function getSettingValue(key, defaultValue = null) {
    const settings = getSettings();
    return settings.hasOwnProperty(key) ? settings[key] : defaultValue;
}

function updateSetting(key, value) {
    const settings = getSettings();
    settings[key] = value;
    saveSettings(settings);
    
    // Apply setting immediately
    applySetting(key, value);
    
    // Don't show toast for darkMode changes as they happen automatically
    if (key !== 'darkMode' && typeof window.toast === 'function') {
        window.toast(`Setting updated: ${key}`, 'success');
    }
}

function applySetting(key, value) {
    switch (key) {
        case 'darkMode':
            document.documentElement.setAttribute('data-theme', value ? 'dark' : 'light');
            break;
            
        case 'animationsEnabled':
            document.documentElement.style.setProperty('--animation-duration', value ? '0.3s' : '0s');
            break;
            
        case 'compactMode':
            document.body.classList.toggle('compact-mode', value);
            break;
            
        case 'audioEnabled':
            // Update WOTD audio button visibility
            const wotdListen = document.getElementById('wotd-listen');
            if (wotdListen) {
                wotdListen.style.display = value ? 'inline-block' : 'none';
            }
            break;
    }
}

function applyAllSettings() {
    const settings = getSettings();
    Object.entries(settings).forEach(([key, value]) => {
        applySetting(key, value);
    });
}

// Settings UI functions
function initializeSettings() {
    applyAllSettings();
    
    // Create settings modal if it doesn't exist
    if (!document.getElementById('settings-modal')) {
        createSettingsModal();
    }
    
    // Initialize settings button
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', showSettingsModal);
    }
}

function createSettingsModal() {
    const modal = document.createElement('div');
    modal.id = 'settings-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content settings-content">
            <div class="modal-header">
                <h2>⚙️ Settings</h2>
                <button class="close-btn" data-close-settings>&times;</button>
            </div>
            <div class="settings-grid">
                <div class="setting-item">
                    <label for="audio-setting">
                        <span class="setting-icon">🔊</span>
                        <span class="setting-label">Audio Pronunciation</span>
                    </label>
                    <input type="checkbox" id="audio-setting" class="setting-toggle">
                </div>
                
                <div class="setting-item">
                    <label for="dark-mode-setting">
                        <span class="setting-icon">🌙</span>
                        <span class="setting-label">Dark Mode</span>
                    </label>
                    <input type="checkbox" id="dark-mode-setting" class="setting-toggle">
                </div>
                
                <div class="setting-item">
                    <label for="auto-refresh-setting">
                        <span class="setting-icon">🔄</span>
                        <span class="setting-label">Auto Refresh</span>
                    </label>
                    <input type="checkbox" id="auto-refresh-setting" class="setting-toggle">
                </div>
                
                <div class="setting-item">
                    <label for="notifications-setting">
                        <span class="setting-icon">🔔</span>
                        <span class="setting-label">Notifications</span>
                    </label>
                    <input type="checkbox" id="notifications-setting" class="setting-toggle">
                </div>
                
                <div class="setting-item">
                    <label for="animations-setting">
                        <span class="setting-icon">✨</span>
                        <span class="setting-label">Animations</span>
                    </label>
                    <input type="checkbox" id="animations-setting" class="setting-toggle">
                </div>
                
                <div class="setting-item">
                    <label for="compact-mode-setting">
                        <span class="setting-icon">📱</span>
                        <span class="setting-label">Compact Mode</span>
                    </label>
                    <input type="checkbox" id="compact-mode-setting" class="setting-toggle">
                </div>
            </div>
            
            <div class="settings-actions">
                <button class="btn secondary" id="reset-settings">Reset to Default</button>
                <button class="btn primary" data-close-settings>Save Changes</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    initializeSettingsModal();
}

function initializeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;
    
    // Close button handlers
    modal.querySelectorAll('[data-close-settings]').forEach(btn => {
        btn.addEventListener('click', hideSettingsModal);
    });
    
    // Setting toggle handlers
    const settingMappings = {
        'audio-setting': 'audioEnabled',
        'dark-mode-setting': 'darkMode',
        'auto-refresh-setting': 'autoRefresh',
        'notifications-setting': 'notificationsEnabled',
        'animations-setting': 'animationsEnabled',
        'compact-mode-setting': 'compactMode'
    };
    
    Object.entries(settingMappings).forEach(([elementId, settingKey]) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener('change', (e) => {
                updateSetting(settingKey, e.target.checked);
            });
        }
    });
    
    // Reset button
    const resetBtn = document.getElementById('reset-settings');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetSettings);
    }
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideSettingsModal();
        }
    });
}

function showSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;
    
    // Update form with current settings
    const settings = getSettings();
    const settingMappings = {
        'audio-setting': 'audioEnabled',
        'dark-mode-setting': 'darkMode',
        'auto-refresh-setting': 'autoRefresh',
        'notifications-setting': 'notificationsEnabled',
        'animations-setting': 'animationsEnabled',
        'compact-mode-setting': 'compactMode'
    };
    
    Object.entries(settingMappings).forEach(([elementId, settingKey]) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.checked = settings[settingKey];
        }
    });
    
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
}

function hideSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;
    
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    
    // Add a small delay to allow modal close animation
    setTimeout(() => {
        // Navigate to home page as per user preference
        if (typeof window.showView === 'function') {
            window.showView('home');
        }
        
        // Update navigation state
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(b => b.classList.remove('active'));
        const homeBtn = document.querySelector('[data-target="home"]');
        if (homeBtn) homeBtn.classList.add('active');
        
        // Show a toast notification
        if (typeof window.toast === 'function') {
            window.toast('Settings saved & navigated to Home', 'success');
        }
    }, 150);
}

function resetSettings() {
    if (confirm('Are you sure you want to reset all settings to default?')) {
        saveSettings(DEFAULT_SETTINGS);
        applyAllSettings();
        showSettingsModal(); // Refresh the modal
        if (typeof window.toast === 'function') {
            window.toast('Settings reset to default', 'success');
        }
    }
}

// Export functions for global use
window.getSettings = getSettings;
window.saveSettings = saveSettings;
window.getSettingValue = getSettingValue;
window.updateSetting = updateSetting;
window.initializeSettings = initializeSettings;
window.showSettingsModal = showSettingsModal;
window.hideSettingsModal = hideSettingsModal;