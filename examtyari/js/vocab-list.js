/* AUTOSPLIT: vocab-list.js — generated heuristically from app.js */

function setupSearch(words) {
        const input = document.getElementById('search-input');
        const results = document.getElementById('search-results');
        const render = items => {
            results.innerHTML = '';
            items.slice(0, 50).forEach((w, i) => {
                const div = document.createElement('div');
                div.className = 'list-item bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 w-full cursor-pointer transition-all duration-150 ease-in-out hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700';
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
        render(words);

        input.addEventListener('input', () => {
            const q = input.value.trim().toLowerCase();
            if (!q) return render(words);
            const filtered = words.filter(w =>
                (w.word && w.word.toLowerCase().includes(q)) ||
                (w.meaning && w.meaning.toLowerCase().includes(q)) ||
                (Array.isArray(w.synonyms) && w.synonyms.some(s => s.toLowerCase().includes(q)))
            );
            render(filtered);
        });

        // Event listener for delete buttons
        // Removed delete buttons from here as per user request
    }function loadLocalCache() {
        try {
            const raw = localStorage.getItem('userWords');
            return raw ? JSON.parse(raw) : [];
        } catch (e) { return []; }
    }function saveLocalCache(words) {
        localStorage.setItem('userWords', JSON.stringify(words));
    }function mergeUniqueByWord(list) {
        const seen = new Set();
        const result = [];
        for (const w of list) {
            const key = (w.word || '').toLowerCase();
            if (!key || seen.has(key)) continue;
            seen.add(key);
            result.push(w);
        }
        return result;
    }function enqueueOp(op) {
        const q = loadQueue();
        q.push(op);
        saveQueue(q);
    }function getSyncStatus(word) {
        const q = loadQueue();
        const pending = q.some(op => (op.word || '').toLowerCase() === (word || '').toLowerCase());
        return pending ? 'pending' : 'synced';
    }

    // New Beautiful Word Popup Logic
    const wordPopup = document.getElementById('word-popup');
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