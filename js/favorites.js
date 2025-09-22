// Favorites System
// ================
// Manages user's favorite words with local storage persistence

const FAVORITES_KEY = 'favoriteWords';

// Core favorites functions
function getFavorites() {
    try {
        return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
    } catch {
        return [];
    }
}

function saveFavorites(favorites) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

function addToFavorites(word) {
    const favorites = getFavorites();
    if (!favorites.some(fav => fav.word.toLowerCase() === word.word.toLowerCase())) {
        favorites.push(word);
        saveFavorites(favorites);
        if (typeof window.toast === 'function') {
            window.toast(`"${word.word}" added to favorites! ⭐`, 'success');
        }
        updateFavoritesDisplay();
        return true;
    }
    return false;
}

function removeFromFavorites(wordText) {
    const favorites = getFavorites();
    const filtered = favorites.filter(fav => fav.word.toLowerCase() !== wordText.toLowerCase());
    saveFavorites(filtered);
    if (typeof window.toast === 'function') {
        window.toast(`"${wordText}" removed from favorites`, 'warning');
    }
    updateFavoritesDisplay();
}

function isWordFavorited(wordText) {
    const favorites = getFavorites();
    return favorites.some(fav => fav.word.toLowerCase() === wordText.toLowerCase());
}

function updateFavoritesDisplay() {
    const favorites = getFavorites();
    const favoritesResults = document.getElementById('favorites-results');
    const favoritesCount = document.getElementById('favorites-count');
    
    if (favoritesCount) {
        favoritesCount.textContent = `${favorites.length} favorite word${favorites.length !== 1 ? 's' : ''}`;
    }
    
    if (favoritesResults) {
        if (favorites.length === 0) {
            favoritesResults.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <p>No favorite words yet!</p>
                    <p>Click the ⭐ icon on any word to add it to favorites.</p>
                </div>
            `;
        } else {
            favoritesResults.innerHTML = favorites.map(word => {
                const status = getSyncStatus ? getSyncStatus(word.word) : 'synced';
                return `
                    <div class="list-item" data-word='${JSON.stringify(word)}'>
                        <div class="word-header">
                            <div class="word">${word.word}</div>
                            <span class="badge">${word.pos || ''}</span>
                            <span class="sync ${status}">${status === 'synced' ? '✅' : '🔄'}</span>
                        </div>
                    </div>
                `;
            }).join('');
            
            // Add click events to favorite words
            favoritesResults.querySelectorAll('.list-item').forEach(item => {
                item.addEventListener('click', () => {
                    const wordData = JSON.parse(item.dataset.word);
                    if (typeof window.showWordPopup === 'function') {
                        window.showWordPopup(wordData);
                    }
                });
            });
        }
    }
}

// Export functions for global use
window.getFavorites = getFavorites;
window.saveFavorites = saveFavorites;
window.addToFavorites = addToFavorites;
window.removeFromFavorites = removeFromFavorites;
window.isWordFavorited = isWordFavorited;
window.updateFavoritesDisplay = updateFavoritesDisplay;