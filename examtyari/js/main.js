/* RESTORED: full original app.js restored into main.js for working site */


(function() {
    const views = document.querySelectorAll('.view');
    const navButtons = document.querySelectorAll('.nav-btn');
    const themeToggle = document.getElementById('theme-toggle');

    // ✅ Correct URLs
    const SHEET_WRITE_URL = 'https://script.google.com/macros/s/AKfycbwwA0PAmRZQxtM_mBS6t3E9pwBzOzOWiFsyTtFC9Hymz5oyw_lMXdn-h1Rth8Fszko/exec';
    const SHEET_CSV_URL = SHEET_WRITE_URL; // Now reading from the same Apps Script endpoint

    let sheetWords = null;

    // Queue for offline/failed operations
    const QUEUE_KEY = 'pendingOps';
    function loadQueue() {
        try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; }
    }
    function saveQueue(q) { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); }
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
    window.addEventListener('online', flushQueue);

    function showView(id) {
        views.forEach(v => v.classList.remove('active'));
        const el = document.getElementById(id);
        if (el) el.classList.add('active');
        navButtons.forEach(b => b.classList.toggle('active', b.dataset.target === id));
    }

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => showView(btn.dataset.target));
    });

    const homeCta = document.getElementById('home-cta');
    if (homeCta) {
        homeCta.addEventListener('click', () => showView('search'));
    }

    initTheme();
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const next = (document.documentElement.getAttribute('data-theme') === 'dark') ? 'light' : 'dark';
            setTheme(next);
        });
    }

    // Load order: render local cache immediately, then fetch from Google Sheet in background
    const localCache = loadLocalCache();
    sheetWords = mergeUniqueByWord(localCache);
    setupSearch(sheetWords);

    function scheduleDataRefresh() {
        const refresh = () => {
            loadFromSheetCsv()
                .then(words => {
                    sheetWords = mergeUniqueByWord(localCache.concat(words));
                    setupSearch(sheetWords);
                    toast('Updated words from Google Sheet', 'success');
                })
                .catch(() => {
                    // Silent fail to avoid blocking first paint
                    // toast('Offline — showing saved words', 'error');
                });
        };
        if (window.requestIdleCallback) {
            requestIdleCallback(refresh, { timeout: 1500 });
        } else {
            setTimeout(refresh, 500);
        }
    }
    scheduleDataRefresh();

    // PDF Categories with back button
    const pdfCategories = document.getElementById('pdf-categories');
    const pdfList = document.getElementById('pdf-list');
    let currentCategory = null;

    function showCategoryView() {
        if (pdfCategories) pdfCategories.style.display = 'flex';
        if (pdfList) pdfList.style.display = 'none';
        currentCategory = null;
    }

    function showPdfList(category) {
        if (pdfCategories) pdfCategories.style.display = 'none';
        if (pdfList) pdfList.style.display = 'block';
        currentCategory = category;
    }

    // Add back button to PDF list
    function addBackButton() {
        const backBtn = document.createElement('button');
        backBtn.className = 'pdf-category-btn';
        backBtn.innerHTML = '← Back';
        backBtn.style.marginBottom = '16px';
        backBtn.addEventListener('click', showCategoryView);
        if (pdfList) {
            pdfList.insertBefore(backBtn, pdfList.firstChild);
        }
    }

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
    }

    function loadFromSheetCsv() {
        return new Promise(async (resolve, reject) => {
            if (!SHEET_CSV_URL) return reject('Sheet URL not available');

            try {
                const response = await fetch(SHEET_CSV_URL);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const json = await response.json();
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
                    })).filter(x => x.word);
                    resolve(words);
                } else {
                    reject('Invalid data format from Google Sheet');
                }
            } catch (err) {
                console.error('Error loading words from Apps Script:', err);
                reject(err);
            }
        });
    }

    function showLoader(flag) {
        const el = document.getElementById('loader');
        if (!el) return;
        if (flag) { el.classList.remove('hidden'); el.setAttribute('aria-hidden','false'); }
        else { el.classList.add('hidden'); el.setAttribute('aria-hidden','true'); }
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

    // Exam PDFs Feature Start
    // Show Exam PDFs section when clicking navbar or home page button
    const examPdfsBtn = document.getElementById('exam-pdfs-btn');
    const homeExamPdfsBtn = document.getElementById('home-exam-pdfs');
    function showExamPdfsView() {
        views.forEach(v => v.classList.remove('active'));
        const examView = document.getElementById('exam-pdfs');
        if (examView) examView.classList.add('active');
        // Optionally reset PDF list/category selection here
    }
    if (examPdfsBtn) {
        examPdfsBtn.addEventListener('click', showExamPdfsView);
    }
    if (homeExamPdfsBtn) {
        homeExamPdfsBtn.addEventListener('click', showExamPdfsView);
    }

    // Subject to PDFs mapping
    const pdfData = {
        math: [
          { name: 'RS Aggarwal', file: 'pdfs/rs-aggarwal.pdf' },
          { name: 'Reasoning book by Vikramjeet', file: 'pdfs/Reasoning book by Vikramjeet sir.pdf' }
        ],
        gk: [
            { name: 'Lucent GK', file: 'pdfs/lucent-gk.pdf' },
            { name: 'Arihant GK', file: 'pdfs/arihant-gk.pdf' },
            { name: 'History by Khan Sir', file: 'https://drive.google.com/file/d/1NVXmcpXr1eXiuxbYOis7_T5SQLlp-qC5/view?usp=sharing' }
        ],
        english: [
          { name: 'Wren & Martin', file: 'pdfs/wren-martin.pdf' },
          { name: 'Plinth to Paramount', file: 'pdfs/plinth-to-paramount.pdf' }
        ],
        reasoning: [
          { name: 'Verbal & Non-Verbal Reasoning', file: 'pdfs/verbal-nonverbal.pdf' },
          { name: 'Analytical Reasoning', file: 'pdfs/analytical-reasoning.pdf' }
        ],
        vocabulary: [
          { name: 'Vocabulary by R.S. Aggarwal', file: 'https://drive.google.com/file/d/1hX8bejwFN-LZsSs5X2OWWNyu8miKSq-o/view?usp=sharing' }
        ]
      };
      
    // Show PDF list when subject is clicked
    const pdfCategoryBtns = document.querySelectorAll('.pdf-category-btn');
    const pdfListDiv = document.getElementById('pdf-list');
    pdfCategoryBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Skip back button clicks
            if (btn.innerHTML.includes('← Back')) return;
            
            // Remove active from all, add to clicked
            pdfCategoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const cat = btn.getAttribute('data-category');
            const pdfs = pdfData[cat] || [];
            if (pdfs.length === 0) {
                pdfListDiv.innerHTML = '<div style="padding:24px; text-align:center; color:#888;">No PDFs available for this subject.</div>';
                return;
            }
            pdfListDiv.innerHTML = pdfs.map(pdf => `
                <div class="pdf-item" data-pdf="${pdf.file}" data-title="${pdf.name}">
                    <div class="pdf-item-title">${pdf.name}</div>
                    <div class="pdf-item-subject">${btn.textContent}</div>
                </div>
            `).join('');
            addBackButton();
            showPdfList(cat);
        });
    });
    // Exam PDFs Feature End

    // Helpers: detect and convert Google Drive file link to preview
    function isDriveLink(url) {
        return typeof url === 'string' && url.includes('drive.google.com/file/');
    }
    function toDrivePreview(url) {
        if (!url) return url;
        try {
            const u = new URL(url);
            const parts = u.pathname.split('/');
            const dIdx = parts.indexOf('d');
            if (dIdx !== -1 && parts[dIdx + 1]) {
                const id = parts[dIdx + 1];
                return `https://drive.google.com/file/d/${id}/preview`;
            }
        } catch {}
        return url.replace('/view', '/preview');
    }

    // All PDF modal logic removed - PDFs now open inline via exam-modal.js

    function lockBodyScroll(lock) {
        if (lock) {
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
        } else {
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
        }
    }

    // PDF handling is now done in exam-modal.js for inline embedding

    // openPdfModal function removed - PDFs now open inline via exam-modal.js

    // closePdfModal function removed - PDFs now open inline via exam-modal.js

    // Modal close handlers removed - PDFs now open inline

    // PDF.js functions removed - not needed for inline embedding

    // All PDF modal functions removed - PDFs now open inline via exam-modal.js

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
        // store current for listen
        window.__WOTD_CURRENT = wordObj;
    }

    function pickWotd(words) {
        const list = Array.isArray(words) ? words.filter(x => x && x.word) : [];
        if (list.length === 0) return null;
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
        try { return JSON.parse(localStorage.getItem('wotdPick') || 'null'); } catch { return null; }
    }
    function saveStoredWotd(obj) {
        try { localStorage.setItem('wotdPick', JSON.stringify(obj)); } catch {}
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

    // Initial and subsequent updates (override prior logic)
    function getCurrentWords() { return Array.isArray(sheetWords) ? sheetWords : []; }
    refreshWotd(getCurrentWords());
    const _origSetupSearch2 = setupSearch;
    setupSearch = function(words) {
        _origSetupSearch2(words);
        refreshWotd(words);
    };
    // Schedule midnight change based on current words provider
    scheduleWotdMidnightRefresh(getCurrentWords);

    // Listen button: prefer pronunciation, fallback to word
    const wotdListen = document.getElementById('wotd-listen');
    if (wotdListen) {
        wotdListen.addEventListener('click', () => {
            const data = window.__WOTD_CURRENT || {};
            const text = (data.pronunciation && data.pronunciation.trim()) || data.word || '';
            if (!text) return;
            try {
                const utter = new SpeechSynthesisUtterance(text);
                utter.lang = 'en-US';
                utter.rate = 0.95;
                window.speechSynthesis.cancel();
                window.speechSynthesis.speak(utter);
            } catch {}
        });
    }
})();

function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') {
        setTheme(saved);
        return;
    }
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
}

function setTheme(mode) {
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem('theme', mode);
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = (mode === 'dark') ? '☀️' : '🌙';
}

// Helper function to format example text
function formatExampleText(text) {
    if (!text) return '—';

    let formattedText = text;

    // 1. Insert <br/> before an opening parenthesis that follows a sentence-ending punctuation.
    // This ensures "English. (Hindi)" becomes "English.<br/>(Hindi)"
    formattedText = formattedText.replace(/([.!?])(?=\s*\()/g, '$1<br/>');

    // 2. Insert <br/> after any closing parenthesis if it's followed by text or a bullet point.
    // This ensures "(Hindi)English" becomes "(Hindi)<br/>English" and "(Hindi)• Example" -> "(Hindi)<br/>• Example"
    formattedText = formattedText.replace(/\)\s*(?=[A-Za-z0-9•])/g, ')<br/>');

    // 3. Insert <br/> after sentence-ending punctuation that is not already handled
    // (i.e., not followed by a parenthesis or an existing <br/>)
    // This handles "English. English." -> "English.<br/>English."
    formattedText = formattedText.replace(/([.!?])\s*(?!(\(|<br\/>))/g, '$1<br/>');

    // 4. Ensure bullet points always start on a new line.
    // This handles "Text • Bullet point" -> "Text<br/>• Bullet point"
    formattedText = formattedText.replace(/([A-Za-z0-9])\s*•/g, '$1<br/>•');
    formattedText = formattedText.replace(/^•/g, '<br/>•'); // For bullet point at the very beginning

    // 5. Clean up any multiple consecutive line breaks.
    formattedText = formattedText.replace(/(<br\/>\s*){2,}/g, '<br/>');

    return formattedText.trim();
}

