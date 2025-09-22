// Exam PDFs Management System
// ============================
// Handles PDF categories, navigation, and display functionality

// PDF data for each category
const pdfData = {
    math: [
        { name: 'RS Aggarwal Quantitative Aptitude', size: '2.5 MB', icon: '📊', file: 'pdfs/rs-aggarwal.pdf' },
        { name: 'Reasoning book by Vikramjeet', size: '3.2 MB', icon: '🔢', file: 'pdfs/Reasoning book by Vikramjeet sir.pdf' },
        { name: 'Advanced Mathematics', size: '2.8 MB', icon: '📐', file: 'pdfs/advanced-math.pdf' },
        { name: 'Statistics & Probability', size: '2.1 MB', icon: '📈', file: 'pdfs/statistics.pdf' },
        { name: 'Number System', size: '1.9 MB', icon: '🔢', file: 'pdfs/number-system.pdf' }
    ],
    gk: [
        { name: 'Lucent General Knowledge', size: '4.2 MB', icon: '🌍', file: 'pdfs/lucent-gk.pdf' },
        { name: 'Arihant General Knowledge', size: '3.8 MB', icon: '📰', file: 'pdfs/arihant-gk.pdf' },
        { name: 'History by Khan Sir', size: '5.1 MB', icon: '🏛️', file: 'https://drive.google.com/file/d/1NVXmcpXr1eXiuxbYOis7_T5SQLlp-qC5/view?usp=sharing' },
        { name: 'Indian Geography', size: '3.6 MB', icon: '🗺️', file: 'pdfs/geography.pdf' },
        { name: 'Science & Technology', size: '4.0 MB', icon: '🔬', file: 'pdfs/science-tech.pdf' }
    ],
    english: [
        { name: 'Wren & Martin Grammar', size: '2.9 MB', icon: '📝', file: 'pdfs/wren-martin.pdf' },
        { name: 'Plinth to Paramount', size: '2.2 MB', icon: '📖', file: 'pdfs/plinth-to-paramount.pdf' },
        { name: 'Reading Comprehension', size: '3.1 MB', icon: '📚', file: 'pdfs/reading-comp.pdf' },
        { name: 'Essay Writing Guide', size: '1.8 MB', icon: '✍️', file: 'pdfs/essay-writing.pdf' },
        { name: 'Error Detection', size: '2.0 MB', icon: '🔍', file: 'pdfs/error-detection.pdf' }
    ],
    reasoning: [
        { name: 'Verbal & Non-Verbal Reasoning', size: '3.4 MB', icon: '🧠', file: 'pdfs/verbal-nonverbal.pdf' },
        { name: 'Analytical Reasoning', size: '2.7 MB', icon: '🔍', file: 'pdfs/analytical-reasoning.pdf' },
        { name: 'Logical Reasoning', size: '2.9 MB', icon: '💭', file: 'pdfs/logical-reasoning.pdf' },
        { name: 'Pattern Recognition', size: '3.2 MB', icon: '🎯', file: 'pdfs/pattern-recognition.pdf' },
        { name: 'Puzzles & Games', size: '2.5 MB', icon: '🧩', file: 'pdfs/puzzles-games.pdf' }
    ],
    vocabulary: [
        { name: 'Vocabulary by R.S. Aggarwal', size: '1.8 MB', icon: '📚', file: 'https://drive.google.com/file/d/1hX8bejwFN-LZsSs5X2OWWNyu8miKSq-o/view?usp=sharing' },
        { name: 'Advanced Word Lists', size: '2.3 MB', icon: '📖', file: 'pdfs/advanced-words.pdf' },
        { name: 'Synonyms & Antonyms', size: '1.9 MB', icon: '🔄', file: 'pdfs/synonyms-antonyms.pdf' },
        { name: 'Idioms & Phrases', size: '2.1 MB', icon: '💬', file: 'pdfs/idioms-phrases.pdf' },
        { name: 'Etymology Guide', size: '2.0 MB', icon: '🌱', file: 'pdfs/etymology.pdf' }
    ]
};

// Navigation state
let currentCategory = null;

// Navigation functions
function showCategoryView() {
    const pdfCategories = document.getElementById('pdf-categories');
    const pdfList = document.getElementById('pdf-list');
    
    if (pdfCategories) pdfCategories.style.display = 'grid';
    if (pdfList) pdfList.style.display = 'none';
    currentCategory = null;
    
    // Update back button text
    const backText = document.querySelector('.back-text');
    if (backText) backText.textContent = 'Back to Home';
    
    console.log('Showing category view');
}

function showPdfList(category) {
    const pdfCategories = document.getElementById('pdf-categories');
    const pdfList = document.getElementById('pdf-list');
    
    if (pdfCategories) pdfCategories.style.display = 'none';
    if (pdfList) pdfList.style.display = 'block';
    currentCategory = category;
    
    // Update back button text
    const backText = document.querySelector('.back-text');
    if (backText) backText.textContent = 'Back to Categories';
    
    console.log('Showing PDF list for category:', category);
}

// Function to display PDFs for a category
function displayPDFs(category) {
    const pdfs = pdfData[category] || [];
    const pdfListContainer = document.getElementById('pdf-list');
    
    if (!pdfListContainer) return;
    
    pdfListContainer.innerHTML = `
        <div class="pdf-header">
            <h3>📄 ${category.charAt(0).toUpperCase() + category.slice(1)} PDFs</h3>
            <p>Download study materials for ${category}</p>
        </div>
        <div class="pdf-grid">
            ${pdfs.map(pdf => `
                <div class="pdf-item" data-pdf="${pdf.file || ''}" data-title="${pdf.name}">
                    <div class="pdf-item-icon">${pdf.icon}</div>
                    <div class="pdf-item-title">${pdf.name}</div>
                    <div class="pdf-item-size">${pdf.size}</div>
                    <div class="pdf-item-subject">${category.charAt(0).toUpperCase() + category.slice(1)}</div>
                </div>
            `).join('')}
        </div>
    `;
    
    // Add click handlers for PDF items
    const pdfItems = pdfListContainer.querySelectorAll('.pdf-item');
    pdfItems.forEach(item => {
        item.addEventListener('click', () => {
            const pdfFile = item.dataset.pdf;
            const pdfTitle = item.dataset.title;
            if (pdfFile) {
                // Use the existing PDF opening system
                if (typeof window.openPdfModal === 'function') {
                    window.openPdfModal(pdfFile, pdfTitle);
                } else {
                    // Fallback to download
                    downloadPDF(pdfTitle);
                }
            } else {
                if (typeof window.toast === 'function') {
                    window.toast('PDF file not available', 'error');
                }
            }
        });
    });
}

// Function to simulate PDF download
function downloadPDF(pdfName) {
    if (typeof window.toast === 'function') {
        window.toast(`Downloading ${pdfName}...`, 'success');
        // Simulate download delay
        setTimeout(() => {
            window.toast(`${pdfName} downloaded successfully!`, 'success');
        }, 1500);
    }
}

// Initialize exam PDFs functionality
function initializeExamPdfs() {
    // Show Exam PDFs section when clicking navbar or home page button
    const examPdfsBtn = document.getElementById('exam-pdfs-btn');
    const homeExamPdfsBtn = document.getElementById('home-exam-pdfs');
    
    function showExamPdfsView() {
        const views = document.querySelectorAll('.view');
        views.forEach(v => v.classList.remove('active'));
        const examView = document.getElementById('exam-pdfs');
        if (examView) examView.classList.add('active');
        // Reset to category view
        showCategoryView();
    }
    
    if (examPdfsBtn) {
        examPdfsBtn.addEventListener('click', showExamPdfsView);
    }
    if (homeExamPdfsBtn) {
        homeExamPdfsBtn.addEventListener('click', showExamPdfsView);
    }

    // Enhanced category card click handlers
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            if (category) {
                showPdfList(category);
                displayPDFs(category); // Display PDFs for the category
                // Add visual feedback
                card.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    card.style.transform = '';
                }, 150);
                if (typeof window.toast === 'function') {
                    window.toast(`Loading ${category} PDFs...`, 'success');
                }
            }
        });
        
        // Add hover sound effect (optional)
        card.addEventListener('mouseenter', () => {
            card.style.boxShadow = '0 25px 50px rgba(102, 126, 234, 0.3)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.boxShadow = '';
        });
        
        // Add keyboard navigation
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.click();
            }
        });
        
        // Make cards focusable
        card.setAttribute('tabindex', '0');
    });

    // Show PDF list when subject is clicked (legacy support)
    const pdfCategoryBtns = document.querySelectorAll('.pdf-category-btn');
    pdfCategoryBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Skip back button clicks
            if (btn.innerHTML.includes('← Back')) return;
            
            // Remove active from all, add to clicked
            pdfCategoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const cat = btn.getAttribute('data-category');
            
            if (cat && pdfData[cat]) {
                displayPDFs(cat);
                showPdfList(cat);
            } else {
                const pdfListDiv = document.getElementById('pdf-list');
                if (pdfListDiv) {
                    pdfListDiv.innerHTML = '<div style="padding:24px; text-align:center; color:#888;">No PDFs available for this subject.</div>';
                }
            }
        });
    });
}

// Smart back button functionality
function initializeBackButton() {
    console.log('Initializing back button...');
    
    // Use timeout to ensure DOM is ready
    setTimeout(() => {
        const backToHomeBtn = document.getElementById('back-to-home');
        if (backToHomeBtn) {
            console.log('Back button found, adding event listener');
            
            // Remove any existing listeners first
            const newButton = backToHomeBtn.cloneNode(true);
            backToHomeBtn.parentNode.replaceChild(newButton, backToHomeBtn);
            
            newButton.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Back button clicked');
                console.log('Current category:', currentCategory);
                
                // Check if we're in PDF list view or category view
                const pdfList = document.getElementById('pdf-list');
                const pdfCategories = document.getElementById('pdf-categories');
                
                console.log('PDF list display:', pdfList ? pdfList.style.display : 'not found');
                console.log('PDF categories display:', pdfCategories ? pdfCategories.style.display : 'not found');
                
                // If PDF list is visible and we have a current category, go back to categories
                if (pdfList && pdfList.style.display === 'block' && currentCategory) {
                    console.log('Going back to categories from PDF list');
                    showCategoryView();
                    if (typeof window.toast === 'function') {
                        window.toast('Back to Exam Categories', 'success');
                    }
                } else {
                    // We're in categories view, go back to home
                    console.log('Going back to home from categories');
                    if (typeof window.showView === 'function') {
                        window.showView('home');
                    }
                    // Update navigation state
                    const navButtons = document.querySelectorAll('.nav-btn');
                    navButtons.forEach(b => b.classList.remove('active'));
                    const homeBtn = document.querySelector('[data-target="home"]');
                    if (homeBtn) homeBtn.classList.add('active');
                    if (typeof window.toast === 'function') {
                        window.toast('Back to Home', 'success');
                    }
                }
            });
        } else {
            console.error('Back button not found! Looking for element with ID: back-to-home');
            // Let's check what elements exist
            const allButtons = document.querySelectorAll('button');
            console.log('Available buttons:', Array.from(allButtons).map(btn => ({id: btn.id, className: btn.className, text: btn.textContent})));
        }
    }, 100);
}

// Export functions for global use
window.pdfData = pdfData;
window.currentCategory = currentCategory;
window.showCategoryView = showCategoryView;
window.showPdfList = showPdfList;
window.displayPDFs = displayPDFs;
window.downloadPDF = downloadPDF;
window.initializeExamPdfs = initializeExamPdfs;
window.initializeBackButton = initializeBackButton;