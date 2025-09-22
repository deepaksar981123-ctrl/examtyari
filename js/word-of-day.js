// Word of the Day (WOTD) System
// =============================
// Manages daily word selection, display, and audio pronunciation

// Global variable to store current WOTD
window.__WOTD_CURRENT = null;

// Populate Word of the Day with richer info
function setWordOfTheDay(wordObj) {
    if (!wordObj) return;
    const w = document.getElementById('wotd-word');
    const m = document.getElementById('wotd-meaning');
    const h = document.getElementById('wotd-hindi');
    const s = document.getElementById('wotd-synonyms');
    const e = document.getElementById('wotd-example');
    
    if (w) w.textContent = wordObj.word || '—';
    if (m) m.textContent = wordObj.meaning ? `Meaning: ${wordObj.meaning}` : 'Meaning: —';
    if (h) h.textContent = wordObj.hindiMeaning ? `Hindi meaning: ${wordObj.hindiMeaning}` : '';
    if (s) s.textContent = (Array.isArray(wordObj.synonyms) && wordObj.synonyms.length)
        ? `Synonyms: ${wordObj.synonyms.join(', ')}`
        : '';
    if (e) e.textContent = wordObj.example ? `Example: ${wordObj.example.replace(/\n/g, ' ')}` : '';
    
    // Store current for listen functionality
    window.__WOTD_CURRENT = wordObj;
    
    // Update audio button visibility based on settings
    const audioEnabled = getSettingValue('audioEnabled', true);
    const wotdListen = document.getElementById('wotd-listen');
    if (wotdListen) {
        wotdListen.style.display = audioEnabled ? 'inline-block' : 'none';
    }
    
    console.log('Word of the Day set:', wordObj.word);
}

function pickWotd(words) {
    const list = Array.isArray(words) ? words.filter(x => x && x.word) : [];
    if (list.length === 0) {
        // Return a fallback word if no words are available
        return {
            word: 'Welcome',
            meaning: 'To greet someone in a friendly way',
            hindiMeaning: 'स्वागत',
            synonyms: ['greet', 'receive'],
            example: 'Welcome to our vocabulary learning app!'
        };
    }
    const dayIndex = Math.floor(Date.now() / (1000*60*60*24));
    const idx = dayIndex % list.length;
    return list[idx];
}

// WOTD: persist a daily random pick and refresh at local midnight
function getTodayKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`; // local date
}

function loadStoredWotd() {
    try { 
        return JSON.parse(localStorage.getItem('wotdPick') || 'null'); 
    } catch { 
        return null; 
    }
}

function saveStoredWotd(obj) {
    try { 
        localStorage.setItem('wotdPick', JSON.stringify(obj)); 
    } catch {}
}

function selectDailyWotd(words) {
    const list = Array.isArray(words) ? words.filter(x => x && x.word) : [];
    if (list.length === 0) return null;
    
    const key = getTodayKey();
    const stored = loadStoredWotd();
    
    if (stored && stored.date === key && stored.word && stored.word.word) {
        return stored.word;
    }
    
    // Pick a random word for today
    const picked = list[Math.floor(Math.random() * list.length)];
    saveStoredWotd({ date: key, word: picked });
    return picked;
}

function refreshWotd(words) {
    const w = selectDailyWotd(words);
    setWordOfTheDay(w);
}

function msUntilNextMidnight() {
    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 0, 0); // local midnight next day
    return next - now;
}

function scheduleWotdMidnightRefresh(wordsProvider) {
    const schedule = () => {
        setTimeout(() => {
            // New day: clear stored pick and set a new one, then schedule next 24h refresh
            saveStoredWotd(null);
            refreshWotd(wordsProvider());
            // Subsequent refreshes every 24h
            setInterval(() => {
                saveStoredWotd(null);
                refreshWotd(wordsProvider());
            }, 24 * 60 * 60 * 1000);
        }, msUntilNextMidnight());
    };
    schedule();
}

// Audio pronunciation functionality
function initializeWotdAudio() {
    const wotdListen = document.getElementById('wotd-listen');
    if (wotdListen) {
        wotdListen.addEventListener('click', () => {
            // Check if audio is enabled in settings
            const audioEnabled = getSettingValue('audioEnabled', true);
            if (!audioEnabled) {
                if (typeof window.toast === 'function') {
                    window.toast('Audio is disabled in settings', 'warning');
                }
                return;
            }
            
            const data = window.__WOTD_CURRENT || {};
            let text = '';
            
            // Try to get text for pronunciation
            if (data.word) {
                text = data.word; // Use the word itself for pronunciation
            }
            
            if (!text) {
                if (typeof window.toast === 'function') {
                    window.toast('No word available for pronunciation', 'warning');
                }
                return;
            }
            
            // Check if speech synthesis is supported
            if (!window.speechSynthesis) {
                if (typeof window.toast === 'function') {
                    window.toast('Speech synthesis not supported in your browser', 'error');
                }
                return;
            }
            
            // Show loading state
            const originalText = wotdListen.textContent;
            wotdListen.textContent = '🔊 Playing...';
            wotdListen.disabled = true;
            
            try {
                // Cancel any ongoing speech
                window.speechSynthesis.cancel();
                
                const utter = new SpeechSynthesisUtterance(text);
                utter.lang = 'en-US';
                utter.rate = 0.7; // Slower for better pronunciation
                utter.pitch = 1.0;
                utter.volume = 1.0;
                
                // Reset button when speech ends
                utter.onend = () => {
                    wotdListen.textContent = originalText;
                    wotdListen.disabled = false;
                };
                
                utter.onerror = (event) => {
                    console.error('Speech synthesis error:', event);
                    wotdListen.textContent = originalText;
                    wotdListen.disabled = false;
                    if (typeof window.toast === 'function') {
                        window.toast('Audio playback failed', 'error');
                    }
                };
                
                window.speechSynthesis.speak(utter);
                
            } catch (error) {
                console.error('Error playing pronunciation:', error);
                wotdListen.textContent = originalText;
                wotdListen.disabled = false;
                if (typeof window.toast === 'function') {
                    window.toast('Audio playback failed', 'error');
                }
            }
        });
    }
}

// Export functions for global use
window.setWordOfTheDay = setWordOfTheDay;
window.refreshWotd = refreshWotd;
window.scheduleWotdMidnightRefresh = scheduleWotdMidnightRefresh;
window.initializeWotdAudio = initializeWotdAudio;