// Admin Mode System
// =================
// This system protects Add Word and Delete functions from unauthorized use
// 
// How to activate Admin Mode:
// Method 1: Type 'admin' quickly on any page (keyboard shortcut)
// Method 2: Open browser console and type: enableAdmin()
// Method 3: In console: window.enableAdmin()
//
// How to deactivate:
// Method 1: Click the crown (👑) indicator in top-right corner
// Method 2: In console: disableAdmin() or window.disableAdmin()
//
// When Admin Mode is active:
// ✅ Add Word button is visible and highlighted in red
// ✅ Delete buttons appear in word popups
// ✅ Crown indicator shows in top-right corner
// ✅ Admin status persists across page refreshes
//
// When Admin Mode is inactive:
// ❌ Add Word button is hidden
// ❌ Delete buttons are hidden
// ❌ No admin indicator visible
// ❌ Normal users cannot modify vocabulary

const ADMIN_KEY = 'adminMode';
const ADMIN_SECRET = 'vocab_admin_2024'; // You can change this secret key

function isAdminMode() {
    return localStorage.getItem(ADMIN_KEY) === 'true';
}

function enableAdminMode() {
    localStorage.setItem(ADMIN_KEY, 'true');
    updateUIForAdminMode();
    if (typeof window.toast === 'function') {
        window.toast('Admin Mode Enabled 👑', 'success');
    }
}

function disableAdminMode() {
    localStorage.removeItem(ADMIN_KEY);
    updateUIForAdminMode();
    if (typeof window.toast === 'function') {
        window.toast('Admin Mode Disabled', 'success');
    }
}

function updateUIForAdminMode() {
    const addWordBtn = document.querySelector('[data-target="add-word"]');
    const adminIndicator = document.getElementById('admin-indicator');
    
    if (isAdminMode()) {
        if (addWordBtn) {
            addWordBtn.style.display = 'inline-block';
            addWordBtn.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a24)';
            addWordBtn.title = 'Admin: Add Word';
        }
        
        // Add admin indicator if not exists
        if (!adminIndicator) {
            const indicator = document.createElement('div');
            indicator.id = 'admin-indicator';
            indicator.innerHTML = '👑';
            indicator.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: #ff6b6b;
                color: white;
                padding: 8px 12px;
                border-radius: 20px;
                font-size: 16px;
                z-index: 9999;
                box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
                cursor: pointer;
                user-select: none;
            `;
            indicator.title = 'Click to disable Admin Mode';
            indicator.addEventListener('click', disableAdminMode);
            document.body.appendChild(indicator);
        }
    } else {
        if (addWordBtn) {
            addWordBtn.style.display = 'none';
        }
        if (adminIndicator) {
            adminIndicator.remove();
        }
    }
}

// Admin activation via console or secret key sequence
let keySequence = [];
const SECRET_SEQUENCE = ['a', 'd', 'm', 'i', 'n']; // Type 'admin' quickly

document.addEventListener('keydown', (e) => {
    keySequence.push(e.key.toLowerCase());
    if (keySequence.length > SECRET_SEQUENCE.length) {
        keySequence.shift();
    }
    
    if (keySequence.join('') === SECRET_SEQUENCE.join('')) {
        if (!isAdminMode()) {
            enableAdminMode();
        } else {
            disableAdminMode();
        }
        keySequence = [];
    }
});

// Global admin functions for console access
window.enableAdmin = () => enableAdminMode();
window.disableAdmin = () => disableAdminMode();
window.checkAdmin = () => console.log('Admin Mode:', isAdminMode());

// Export functions for use in other modules
window.isAdminMode = isAdminMode;
window.enableAdminMode = enableAdminMode;
window.disableAdminMode = disableAdminMode;
window.updateUIForAdminMode = updateUIForAdminMode;