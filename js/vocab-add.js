/* AUTOSPLIT: vocab-add.js — generated heuristically from app.js */

import { saveWord, updateWord, deleteWord as deleteWordFromSheet } from '../services/sheetApi.js';

// Add Word Form Handling
const wordForm = document.getElementById('word-form');
if (wordForm) {
    wordForm.addEventListener('submit', function(e) {
        e.preventDefault();
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

        // Optimistic cache update
        let cache = loadLocalCache();
        if (isUpdate) {
            cache = cache.filter(w => (w.word || '').toLowerCase() !== (window._editingWord || '').toLowerCase());
        }
        cache = [newWord].concat(cache.filter(w => (w.word || '').toLowerCase() !== newWord.word.toLowerCase()));
        saveLocalCache(cache);
        if (!Array.isArray(sheetWords)) sheetWords = [];
        if (isUpdate) {
            sheetWords = sheetWords.filter(w => (w.word || '').toLowerCase() !== (window._editingWord || '').toLowerCase());
        }
        sheetWords = mergeUniqueByWord([newWord].concat(sheetWords));
        setupSearch(sheetWords);

        // Fire-and-forget network call
        const payload = isUpdate ? { action: 'update', oldWord: window._editingWord, ...newWord } : { action: 'create', ...newWord };
        (async () => {
            try {
                await fetchWithTimeout(SHEET_WRITE_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify(payload)
                }, 8000);
                toast(isUpdate ? 'Updated in Google Sheet' : 'Saved to Google Sheet', 'success');
                flushQueue();
            } catch {
                enqueueOp(payload);
                toast(isUpdate ? 'Update queued (offline)' : 'Save queued (offline)', 'warning');
            }
        })();

        window._editingWord = null;
        const successMsg = document.getElementById('add-word-success');
        successMsg.style.display = 'block';
        wordForm.reset();
        setTimeout(() => { successMsg.style.display = 'none'; }, 2000);
        showView('search');
    });
}