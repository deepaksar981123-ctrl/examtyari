/* AUTOSPLIT: vocab-popup.js — generated heuristically from app.js */

import { saveWord, updateWord, deleteWord as deleteWordFromSheet } from '../services/sheetApi.js';

function showWordPopup(wordData) {
        if (!wordPopup) return;
        
        popupWord.textContent = wordData.word || '—';
        popupPos.textContent = wordData.pos || '—';
        popupPronunciation.textContent = wordData.pronunciation || '—';
        popupHindiMeaning.textContent = wordData.hindiMeaning || '—';
        popupEnglishMeaning.textContent = wordData.meaning || '—';
        popupSynonyms.textContent = (wordData.synonyms && wordData.synonyms.length > 0) ? wordData.synonyms.join(', ') : '—';
        popupExample.innerHTML = wordData.example ? formatExampleText(wordData.example) : '—';
        popupMnemonic.textContent = wordData.mnemonic || '—';

        wordPopup.classList.add('show');
        wordPopup.setAttribute('aria-hidden', 'false');

        // Store current word for edit/delete operations
        window._currentWordData = wordData;
    }

    function closeWordPopup() {
        if (!wordPopup) return;
        wordPopup.classList.remove('show');
        wordPopup.setAttribute('aria-hidden', 'true');
        window._currentWordData = null; // Clear stored word data
    }

    // Helper: fetch with timeout
    async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const res = await fetch(url, { ...options, signal: controller.signal });
            return res;
        } finally {
            clearTimeout(id);
        }
    }

    async function deleteWord(wordToDelete) {
        if (!confirm(`Are you sure you want to delete "${wordToDelete}"?`)) {
            return;
        }

        // Optimistic UI: remove locally first
        let cache = loadLocalCache();
        cache = cache.filter(w => (w.word || '').toLowerCase() !== wordToDelete.toLowerCase());
        saveLocalCache(cache);
        if (Array.isArray(sheetWords)) {
            sheetWords = sheetWords.filter(w => (w.word || '').toLowerCase() !== wordToDelete.toLowerCase());
        }
        setupSearch(sheetWords);
        toast(`Deleting "${wordToDelete}"…`, '');

        const payload = { action: 'delete', word: wordToDelete };
        try {
            const response = await fetchWithTimeout(SHEET_WRITE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(payload)
            }, 8000);
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


    // Add event listeners for closing the popup
    document.querySelectorAll('[data-close-popup]').forEach(btn => {
        btn.addEventListener('click', closeWordPopup);
    });

    // Add event listener for the popup delete button
    if (popupDelete) {
        popupDelete.addEventListener('click', () => {
            if (window._currentWordData && window._currentWordData.word) {
                deleteWord(window._currentWordData.word);
            }
        });
    }

    //