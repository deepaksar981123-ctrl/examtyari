/* AUTOSPLIT: exam-list.js — generated heuristically from app.js */

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