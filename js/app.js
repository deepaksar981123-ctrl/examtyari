// Main Application Controller
// ===========================
// Orchestrates all modules and handles core app functionality

(function() {
    // Core application variables
    const views = document.querySelectorAll('.view');
    const navButtons = document.querySelectorAll('.nav-btn');
    const themeToggle = document.getElementById('theme-toggle');

    // Google Sheets configuration
    const SHEET_WRITE_URL = 'https://script.google.com/macros/s/AKfycbwwA0PAmRZQxtM_mBS6t3E9pwBzOzOWiFsyTtFC9Hymz5oyw_lMXdn-h1Rth8Fszko/exec';
    const SHEET_CSV_URL = SHEET_WRITE_URL;

    let sheetWords = null;

    // Queue for offline/failed operations
    const QUEUE_KEY = 'pendingOps';
    
    // Utility functions
    function loadQueue() {
        try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; }
    }
    
    function saveQueue(q) { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); }
    
    // Function to clear all pending operations (for immediate fix)
    function clearPendingQueue() {
        saveQueue([]);
        console.log('Pending queue cleared');
        // Refresh UI to update sync status
        if (sheetWords) {
            setupSearch(sheetWords);
        }
    }
    
    async function flushQueue() {
        if (!SHEET_WRITE_URL) return;
        let q = loadQueue();
        if (!q.length) {
            console.log('flushQueue: Queue is empty, nothing to sync.');
            return;
        }
        console.log(`flushQueue: Attempting to sync ${q.length} pending operations.`);
        const remaining = [];
        for (const op of q) {
            try {
                console.log('flushQueue: Sending operation:', op);
                await fetch(SHEET_WRITE_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(op) });
                console.log('flushQueue: Operation sent successfully:', op);
            } catch (error) {
                console.error('flushQueue: Failed to send operation:', op, error);
                remaining.push(op);
            }
        }
        saveQueue(remaining);
        if (remaining.length === 0) toast('All pending changes synced', 'success');
        else toast(`${remaining.length} changes still pending sync`, 'warning');
        setupSearch(sheetWords || []);
    }

    // Navigation functions
    function showView(id) {
        views.forEach(v => v.classList.remove('active'));
        const el = document.getElementById(id);
        if (el) el.classList.add('active');
        navButtons.forEach(b => b.classList.toggle('active', b.dataset.target === id));
    }

    function toast(msg, type) {
        const host = document.getElementById('toasts');
        if (!host) return;
        const t = document.createElement('div');
        t.className = `toast ${type||''}`;
        t.textContent = msg;
        host.appendChild(t);
        setTimeout(() => { t.remove(); }, 3000);
    }

    function showLoader(flag) {
        const el = document.getElementById('loader');
        if (!el) return;
        if (flag) { el.classList.remove('hidden'); el.setAttribute('aria-hidden','false'); }
        else { el.classList.add('hidden'); el.setAttribute('aria-hidden','true'); }
    }

    // Theme functions
    function initTheme() {
        const saved = localStorage.getItem('theme');
        const theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        setTheme(theme);
    }

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        updateSetting('darkMode', theme === 'dark');
    }

    // Local storage functions
    function loadLocalCache() {
        try {
            const raw = localStorage.getItem('userWords');
            return raw ? JSON.parse(raw) : [];
        } catch (e) { return []; }
    }

    function saveLocalCache(words) {
        localStorage.setItem('userWords', JSON.stringify(words));
    }

    function mergeUniqueByWord(list) {
        const seen = new Set();
        const result = [];
        for (const w of list) {
            const key = (w.word || '').toLowerCase();
            if (!key || seen.has(key)) continue;
            seen.add(key);
            result.push(w);
        }
        return result;
    }

    function enqueueOp(op) {
        const q = loadQueue();
        q.push(op);
        saveQueue(q);
    }

    function getSyncStatus(word) {
        // Words from Google Sheet are always considered synced
        // Only locally added words that haven't been sent to Google Sheet show as pending
        const q = loadQueue();
        const pending = q.some(op => (op.word || '').toLowerCase() === (word || '').toLowerCase());
        return pending ? 'pending' : 'synced';
    }

    // Google Sheets integration
    function loadFromSheetCsv() {
        return new Promise(async (resolve, reject) => {
            if (!SHEET_CSV_URL) {
                console.error('Sheet URL not available');
                return reject('Sheet URL not available');
            }

            console.log('Fetching from URL:', SHEET_CSV_URL);
            try {
                const response = await fetch(SHEET_CSV_URL);
                console.log('Response status:', response.status, response.ok);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                
                const json = await response.json();
                console.log('Response JSON:', json);
                
                if (json.result === 'success' && Array.isArray(json.words)) {
                    const words = json.words.map(r => ({
                        word: r.word || '',
                        synonyms: Array.isArray(r.synonyms) ? r.synonyms : (r.synonyms || '').split(',').map(s => s.trim()).filter(Boolean),
                        pronunciation: r.pronunciation || '',
                        hindiMeaning: r.hindiMeaning || '',
                        meaning: r.meaning || '',
                        example: r.example || '',
                        mnemonic: r.mnemonic || '',
                        oneLiner: r.oneLiner || '',
                        uses: r.uses || '',
                        pos: r.pos || '',
                        category: r.category || 'general',
                        difficulty: r.difficulty || 'intermediate'
                    })).filter(x => x.word);
                    console.log('Processed words:', words.length);
                    resolve(words);
                } else {
                    console.error('Invalid data format from Google Sheet:', json);
                    reject('Invalid data format from Google Sheet');
                }
            } catch (err) {
                console.error('Error loading words from Apps Script:', err);
                reject(err);
            }
        });
    }

    // Search functionality
    function setupSearch(words) {
        const input = document.getElementById('search-input');
        const results = document.getElementById('search-results');
        const wordCountInfo = document.getElementById('word-count-info');
        
        // Update word count display
        if (wordCountInfo) {
            const totalCount = words.length;
            const localCache = loadLocalCache();
            const localCount = localCache.length;
            const googleCount = Math.max(0, totalCount - localCount);
            wordCountInfo.textContent = `Total words: ${totalCount} (${localCount} local, ${googleCount} from Google Sheet)`;
        }
        
        const render = items => {
            results.innerHTML = '';
            if (items.length === 0) {
                const query = input ? input.value.trim() : '';
                if (query) {
                    results.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary);">No words found matching "' + query + '". Try a different search term.</div>';
                } else {
                    results.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary);">Start typing to search words...</div>';
                }
                return;
            }
            items.slice(0, 50).forEach((w, i) => {
                const div = document.createElement('div');
                div.className = 'list-item';
                const status = getSyncStatus(w.word);
                div.innerHTML = `
                    <div class="word-header">
                        <div class="word">${w.word}</div>
                        <span class="badge">${w.pos || ''}</span>
                        <span class="sync ${status}">${status === 'synced' ? '✅' : '🔄'}</span>
                    </div>
                `;
                div.addEventListener('click', () => showWordPopup(w));
                results.appendChild(div);
            });
        };
        // Initially show search prompt instead of all words
        if (input) {
            results.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary);">Start typing to search words...</div>';
        }

        if (input) {
            // Add focus event to show all words when user focuses on search
            input.addEventListener('focus', () => {
                if (!input.value.trim()) {
                    render(words.slice(0, 50)); // Show first 50 words
                }
            });
            
            // Add blur event to hide results when unfocused and empty
            input.addEventListener('blur', () => {
                if (!input.value.trim()) {
                    setTimeout(() => {
                        if (!input.value.trim()) {
                            results.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary);">Start typing to search words...</div>';
                        }
                    }, 100);
                }
            });
            
            input.addEventListener('input', () => {
                const q = input.value.trim().toLowerCase();
                if (!q) {
                    results.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary);">Start typing to search words...</div>';
                    return;
                }
                const filtered = words.filter(w =>
                    (w.word && w.word.toLowerCase().includes(q)) ||
                    (w.meaning && w.meaning.toLowerCase().includes(q)) ||
                    (Array.isArray(w.synonyms) && w.synonyms.some(s => s.toLowerCase().includes(q)))
                );
                render(filtered);
            });
        }

        // Update quiz stats when words are available
        if (typeof window.updateQuizStats === 'function') {
            window.updateQuizStats();
        }
        
        // Also setup vocabulary section
        setupVocabulary(words);
    }
    
    // Vocabulary functionality (different from search)
    function setupVocabulary(words) {
        const results = document.getElementById('vocabulary-results');
        const wordCountInfo = document.getElementById('vocab-count-info');
        let currentFilter = 'all';
        
        // Update word count display
        if (wordCountInfo) {
            const totalCount = words.length;
            wordCountInfo.textContent = `${totalCount} words in your collection`;
        }
        
        const renderVocab = (items, filter = 'all') => {
            if (!results) return;
            
            results.innerHTML = '';
            
            if (items.length === 0) {
                results.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                        <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;">📚</div>
                        <h3 style="margin: 0 0 8px 0; color: var(--text-primary);">No vocabulary found</h3>
                        <p style="margin: 0; font-size: 14px;">Add some words or refresh from Google Sheet to build your collection.</p>
                    </div>
                `;
                return;
            }
            
            // Filter based on current filter
            let filteredItems = items;
            if (filter === 'recent') {
                // Show recently added (assuming newer items are at the beginning)
                filteredItems = items.slice(0, 20);
            } else if (filter !== 'all') {
                filteredItems = items.filter(w => (w.pos || '').toLowerCase() === filter.toLowerCase());
            }
            
            if (filteredItems.length === 0) {
                results.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                        <div style="font-size: 32px; margin-bottom: 12px; opacity: 0.6;">🔍</div>
                        <p style="margin: 0;">No ${filter === 'recent' ? 'recent words' : filter + 's'} found in your vocabulary.</p>
                    </div>
                `;
                return;
            }
            
            filteredItems.forEach((w, i) => {
                const div = document.createElement('div');
                div.className = 'vocab-card';
                const status = getSyncStatus(w.word);
                const isFavorited = typeof isWordFavorited === 'function' ? isWordFavorited(w.word) : false;
                
                div.innerHTML = `
                    <div class="vocab-word">
                        ${w.word}
                        ${w.pos ? `<span class="vocab-pos">${w.pos}</span>` : ''}
                    </div>
                    <div class="vocab-meaning">${(w.meaning || '').substring(0, 120)}${(w.meaning || '').length > 120 ? '...' : ''}</div>
                    <div class="vocab-meta">
                        <div class="vocab-sync ${status}">
                            ${status === 'synced' ? '✅ Synced' : '🔄 Pending'}
                        </div>
                        <button class="vocab-favorite ${isFavorited ? 'favorited' : ''}" data-word="${w.word}" title="${isFavorited ? 'Remove from favorites' : 'Add to favorites'}">
                            ⭐
                        </button>
                    </div>
                `;
                
                // Add click handler for word details
                div.addEventListener('click', (e) => {
                    if (!e.target.closest('.vocab-favorite')) {
                        showWordPopup(w);
                    }
                });
                
                results.appendChild(div);
            });
            
            // Add favorite button handlers
            const favoriteButtons = results.querySelectorAll('.vocab-favorite');
            favoriteButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const wordToToggle = btn.dataset.word;
                    const word = words.find(w => w.word === wordToToggle);
                    if (word) {
                        const isFavorited = typeof isWordFavorited === 'function' ? isWordFavorited(word.word) : false;
                        
                        if (isFavorited) {
                            if (typeof removeFromFavorites === 'function') removeFromFavorites(word.word);
                            btn.classList.remove('favorited');
                            btn.title = 'Add to favorites';
                        } else {
                            if (typeof addToFavorites === 'function') addToFavorites(word);
                            btn.classList.add('favorited');
                            btn.title = 'Remove from favorites';
                        }
                    }
                });
            });
        };
        
        // Setup vocabulary back button
        const vocabBackBtn = document.getElementById('vocab-back-btn');
        if (vocabBackBtn) {
            vocabBackBtn.addEventListener('click', () => {
                showView('home');
                // Update navigation state
                const navButtons = document.querySelectorAll('.nav-btn');
                navButtons.forEach(b => b.classList.remove('active'));
                const homeBtn = document.querySelector('[data-target="home"]');
                if (homeBtn) homeBtn.classList.add('active');
                if (typeof window.toast === 'function') {
                    window.toast('Back to Home', 'success');
                }
            });
        }
        
        // Initial render with all words
        renderVocab(words, currentFilter);
        
        // Setup category filtering
        const categoryButtons = document.querySelectorAll('.vocab-category-btn');
        categoryButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state
                categoryButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Get filter type
                const filter = btn.dataset.filter;
                currentFilter = filter;
                
                // Re-render with filter
                renderVocab(words, filter);
                
                // Update count info
                if (wordCountInfo) {
                    let count = words.length;
                    if (filter === 'recent') {
                        count = Math.min(20, words.length);
                    } else if (filter !== 'all') {
                        count = words.filter(w => (w.pos || '').toLowerCase() === filter.toLowerCase()).length;
                    }
                    
                    const filterText = filter === 'all' ? 'words' : 
                                     filter === 'recent' ? 'recent words' : filter + 's';
                    wordCountInfo.textContent = `${count} ${filterText} in your collection`;
                }
            });
        });
    }

    // Word popup functionality
    function showWordPopup(wordData) {
        const wordPopup = document.getElementById('word-popup');
        if (!wordPopup) return;
        
        const popupWord = document.getElementById('popup-word');
        const popupPos = document.getElementById('popup-pos');
        const popupPronunciation = document.getElementById('popup-pronunciation');
        const popupHindiMeaning = document.getElementById('popup-hindi-meaning');
        const popupEnglishMeaning = document.getElementById('popup-english-meaning');
        const popupSynonyms = document.getElementById('popup-synonyms');
        const popupExample = document.getElementById('popup-example');
        const popupMnemonic = document.getElementById('popup-mnemonic');
        const popupDelete = document.getElementById('popup-delete');
        const popupEdit = document.getElementById('popup-edit');
        const popupFavorite = document.getElementById('popup-favorite');
        
        if (popupWord) popupWord.textContent = wordData.word || '—';
        if (popupPos) popupPos.textContent = wordData.pos || '—';
        if (popupPronunciation) popupPronunciation.textContent = wordData.pronunciation || '—';
        if (popupHindiMeaning) popupHindiMeaning.textContent = wordData.hindiMeaning || '—';
        if (popupEnglishMeaning) popupEnglishMeaning.textContent = wordData.meaning || '—';
        if (popupSynonyms) popupSynonyms.textContent = (wordData.synonyms && wordData.synonyms.length > 0) ? wordData.synonyms.join(', ') : '—';
        if (popupExample) popupExample.innerHTML = wordData.example ? formatExampleText(wordData.example) : '—';
        if (popupMnemonic) popupMnemonic.textContent = wordData.mnemonic || '—';

        // Show/hide admin buttons based on admin mode
        if (popupDelete) {
            popupDelete.style.display = isAdminMode() ? 'flex' : 'none';
        }
        if (popupEdit) {
            popupEdit.style.display = isAdminMode() ? 'flex' : 'none';
        }
        
        // Update favorite button state
        if (popupFavorite && typeof isWordFavorited === 'function') {
            const isFavorited = isWordFavorited(wordData.word);
            popupFavorite.classList.toggle('favorited', isFavorited);
            popupFavorite.title = isFavorited ? 'Remove from favorites' : 'Add to favorites';
        }

        wordPopup.classList.add('show');
        wordPopup.setAttribute('aria-hidden', 'false');

        // Store current word for edit/delete operations
        window._currentWordData = wordData;
    }

    function closeWordPopup() {
        const wordPopup = document.getElementById('word-popup');
        if (!wordPopup) return;
        wordPopup.classList.remove('show');
        wordPopup.setAttribute('aria-hidden', 'true');
        window._currentWordData = null;
    }

    function formatExampleText(example) {
        // Simple formatting for examples
        return example.replace(/\n/g, '<br>');
    }

    // Helper: fetch with timeout (reduced to 4-5 seconds as per memory requirement)
    async function fetchWithTimeout(url, options = {}, timeoutMs = 4000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const res = await fetch(url, { ...options, signal: controller.signal });
            return res;
        } finally {
            clearTimeout(id);
        }
    }

    // Delete word functionality
    async function deleteWord(wordToDelete) {
        // Check admin mode before allowing delete
        if (!isAdminMode()) {
            toast('Delete function requires Admin Mode', 'error');
            return;
        }
        
        if (!confirm(`Are you sure you want to delete "${wordToDelete}"?`)) {
            return;
        }

        // Optimistic UI: remove locally first
        let cache = loadLocalCache();
        cache = cache.filter(w => (w.word || '').toLowerCase() !== wordToDelete.toLowerCase());
        saveLocalCache(cache);
        if (Array.isArray(sheetWords)) {
            sheetWords = sheetWords.filter(w => (w.word || '').toLowerCase() !== wordToDelete.toLowerCase());
            window.sheetWords = sheetWords;
        }
        setupSearch(sheetWords);
        toast(`Deleting "${wordToDelete}"…`, '');

        const payload = { action: 'delete', word: wordToDelete };
        try {
            const response = await fetchWithTimeout(SHEET_WRITE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(payload)
            }, 4000);
            const result = await response.json().catch(() => ({ result: 'success' }));
            if (result.result === 'success') {
                toast(`"${wordToDelete}" deleted from Google Sheet`, 'success');
            } else {
                enqueueOp(payload);
                toast(`Delete queued (offline)`, 'warning');
            }
        } catch (error) {
            enqueueOp(payload);
            toast(`Delete queued (network issue)`, 'warning');
        }
        closeWordPopup();
    }

    // Initialize application
    function initializeApp() {
        // Make core functions globally accessible
        window.showView = showView;
        window.toast = toast;
        window.sheetWords = sheetWords;
        window.showWordPopup = showWordPopup;
        window.closeWordPopup = closeWordPopup;
        window.getSyncStatus = getSyncStatus;
        window.clearPendingQueue = clearPendingQueue;
        
        // Clear any stuck pending items on app start
        clearPendingQueue();

        // Initialize theme
        initTheme();
        
        // Initialize all modules
        if (typeof updateUIForAdminMode === 'function') updateUIForAdminMode();
        if (typeof updateFavoritesDisplay === 'function') updateFavoritesDisplay();
        if (typeof initializeSettings === 'function') initializeSettings();
        if (typeof initializeExamPdfs === 'function') initializeExamPdfs();
        if (typeof initializeBackButton === 'function') initializeBackButton();
        if (typeof initializeWotdAudio === 'function') initializeWotdAudio();

        // Navigation event listeners
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Special handling for quiz navigation - reset quiz state
                if (btn.dataset.target === 'quiz') {
                    if (typeof window.resetQuizToHome === 'function') {
                        window.resetQuizToHome();
                    }
                }
                showView(btn.dataset.target);
            });
        });

        // Home CTA button
        const homeCta = document.getElementById('home-cta');
        if (homeCta) {
            homeCta.addEventListener('click', () => showView('vocabulary'));
        }

        // Theme toggle
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const next = (document.documentElement.getAttribute('data-theme') === 'dark') ? 'light' : 'dark';
                setTheme(next);
                showView('home');
            });
        }

        // Load words data
        loadWordsData();

        // Setup popup close handlers
        document.querySelectorAll('[data-close-popup]').forEach(btn => {
            btn.addEventListener('click', closeWordPopup);
        });

        // Setup popup action handlers
        const popupDelete = document.getElementById('popup-delete');
        if (popupDelete) {
            popupDelete.addEventListener('click', () => {
                if (window._currentWordData && window._currentWordData.word) {
                    deleteWord(window._currentWordData.word);
                }
            });
        }

        const popupFavorite = document.getElementById('popup-favorite');
        if (popupFavorite) {
            popupFavorite.addEventListener('click', () => {
                if (window._currentWordData && window._currentWordData.word) {
                    const wordData = window._currentWordData;
                    const isFavorited = isWordFavorited(wordData.word);
                    
                    if (isFavorited) {
                        removeFromFavorites(wordData.word);
                        popupFavorite.classList.remove('favorited');
                        popupFavorite.title = 'Add to favorites';
                    } else {
                        addToFavorites(wordData);
                        popupFavorite.classList.add('favorited');
                        popupFavorite.title = 'Remove from favorites';
                    }
                }
            });
        }

        // Setup word form
        setupWordForm();

        // Setup refresh button
        const refreshBtn = document.getElementById('refresh-words');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                console.log('Manual refresh requested');
                showLoader(true);
                loadFromSheetCsv()
                    .then(words => {
                        console.log('Manual refresh successful:', words.length, 'words');
                        const localCache = loadLocalCache();
                        const mergedWords = mergeUniqueByWord(words.concat(localCache));
                        saveLocalCache(mergedWords);
                        sheetWords = mergedWords;
                        window.sheetWords = sheetWords;
                        setupSearch(sheetWords);
                        showLoader(false);
                        // Navigate to vocabulary page as per memory requirement
                        showView('vocabulary');
                        toast(`Refreshed: ${words.length} words from Google Sheet`, 'success');
                    })
                    .catch((error) => {
                        console.error('Manual refresh failed:', error);
                        showLoader(false);
                        toast(`Refresh failed: ${error.message || error}`, 'error');
                    });
            });
        }

        // Online/offline handlers
        window.addEventListener('online', flushQueue);
    }

    function loadWordsData() {
        // Load local cache first for immediate display
        const localCache = loadLocalCache();
        console.log('Local cache has', localCache.length, 'words');
        
        // Start with local cache immediately to avoid loading delay
        sheetWords = mergeUniqueByWord(localCache);
        window.sheetWords = sheetWords;
        setupSearch(sheetWords);
        
        // Initialize WOTD with current words
        if (typeof refreshWotd === 'function') {
            refreshWotd(sheetWords);
        }

        // Load from Google Sheets in background (no loader for background sync)
        function loadGoogleSheetData() {
            console.log('Loading words from Google Sheet in background...');
            
            loadFromSheetCsv()
                .then(googleWords => {
                    console.log('Successfully loaded', googleWords.length, 'words from Google Sheet');
                    
                    // Merge Google Sheet data with local cache
                    const mergedWords = mergeUniqueByWord(googleWords.concat(localCache));
                    
                    // Only update if we have more words than before
                    if (mergedWords.length >= sheetWords.length) {
                        sheetWords = mergedWords;
                        window.sheetWords = sheetWords;
                        
                        // Update UI
                        setupSearch(sheetWords);
                        
                        // Update WOTD with new words
                        if (typeof refreshWotd === 'function') {
                            refreshWotd(sheetWords);
                        }
                        
                        console.log('Background sync complete:', sheetWords.length, 'total words');
                    }
                })
                .catch((error) => {
                    console.log('Background sync failed, continuing with local cache:', error);
                });
        }
        
        // Load Google Sheet data in background without blocking UI
        if (window.requestIdleCallback) {
            requestIdleCallback(loadGoogleSheetData, { timeout: 1000 });
        } else {
            setTimeout(loadGoogleSheetData, 500);
        }
        
        // Initialize WOTD scheduling
        if (typeof scheduleWotdMidnightRefresh === 'function') {
            scheduleWotdMidnightRefresh(() => window.sheetWords || []);
        }
    }

    function setupWordForm() {
        const wordForm = document.getElementById('word-form');
        if (!wordForm) return;

        wordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!isAdminMode()) {
                toast('Add Word function requires Admin Mode', 'error');
                return;
            }
            
            const newWord = {
                word: document.getElementById('new-word').value.trim(),
                pronunciation: document.getElementById('new-pronunciation').value.trim(),
                hindiMeaning: document.getElementById('new-hindi-meaning').value.trim(),
                meaning: document.getElementById('new-english-meaning').value.trim(),
                example: document.getElementById('new-example').value.trim(),
                pos: document.getElementById('new-pos').value,
                synonyms: document.getElementById('new-synonyms').value.split(',').map(s => s.trim()).filter(Boolean),
                mnemonic: document.getElementById('new-mnemonic').value.trim()
            };
            
            const isUpdate = !!window._editingWord;
            if (!newWord.word) { toast('Please enter a word', 'error'); return; }
            if (!isUpdate) {
                const exists = (sheetWords||[]).some(w => (w.word||'').toLowerCase() === newWord.word.toLowerCase());
                if (exists) { toast('This word already exists', 'error'); return; }
            }

            if (!Array.isArray(sheetWords)) sheetWords = [];
            if (isUpdate) {
                sheetWords = sheetWords.filter(w => (w.word || '').toLowerCase() !== (window._editingWord || '').toLowerCase());
            }
            sheetWords = mergeUniqueByWord([newWord].concat(sheetWords));
            window.sheetWords = sheetWords;
            setupSearch(sheetWords);
            
            toast(isUpdate ? 'Sending update to Google Sheet...' : 'Sending to Google Sheet...', '');
            showLoader(true);

            const payload = isUpdate ? { action: 'update', oldWord: window._editingWord, ...newWord } : { action: 'create', ...newWord };
            try {
                const response = await fetchWithTimeout(SHEET_WRITE_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify(payload)
                }, 5000);
                
                showLoader(false);
                
                // Clear from queue since it was successfully sent
                let queue = loadQueue();
                queue = queue.filter(op => (op.word || '').toLowerCase() !== newWord.word.toLowerCase());
                saveQueue(queue);
                
                let cache = loadLocalCache();
                if (isUpdate) {
                    cache = cache.filter(w => (w.word || '').toLowerCase() !== (window._editingWord || '').toLowerCase());
                }
                cache = [newWord].concat(cache.filter(w => (w.word || '').toLowerCase() !== newWord.word.toLowerCase()));
                saveLocalCache(cache);
                
                // Update the UI to show synced status
                setupSearch(sheetWords);
                
                toast(isUpdate ? 'Successfully saved to Google Sheet!' : 'Word added to Google Sheet!', 'success');
                
            } catch (error) {
                showLoader(false);
                console.error('Error saving to Google Sheet:', error);
                
                let cache = loadLocalCache();
                if (isUpdate) {
                    cache = cache.filter(w => (w.word || '').toLowerCase() !== (window._editingWord || '').toLowerCase());
                }
                cache = [newWord].concat(cache.filter(w => (w.word || '').toLowerCase() !== newWord.word.toLowerCase()));
                saveLocalCache(cache);
                
                enqueueOp(payload);
                toast('Saved locally - will sync to Google Sheet when online', 'warning');
            }

            window._editingWord = null;
            const successMsg = document.getElementById('add-word-success');
            if (successMsg) {
                successMsg.style.display = 'block';
                setTimeout(() => { 
                    successMsg.style.display = 'none';
                    showView('vocabulary');  // Navigate to vocabulary page instead of search
                }, 2000);  // 2-second delay as per memory requirement
            }
            wordForm.reset();
        });
    }

    // Initialize app when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
        initializeApp();
    }

})();