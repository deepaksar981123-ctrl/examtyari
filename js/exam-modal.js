// Inline PDF Viewer for Exam PDFs
// This file handles inline PDF embedding without any modal popup

// Utility functions for Google Drive links
function isDriveLink(url) {
    return url.includes('drive.google.com') || url.includes('docs.google.com');
}

    function toDrivePreview(url) {
    if (url.includes('/view')) {
        return url.replace('/view', '/preview');
    }
    if (url.includes('/edit')) {
        return url.replace('/edit', '/preview');
    }
    return url + (url.includes('?') ? '&' : '?') + 'usp=sharing';
}

// Main inline PDF embedding logic
document.addEventListener('DOMContentLoaded', function() {
    const examPdfsSection = document.getElementById('exam-pdfs');
    
    if (!examPdfsSection) {
        console.warn('Exam PDFs section not found');
        return;
    }

    // Handle PDF item clicks for inline embedding
    document.addEventListener('click', function(e) {
        const pdfItem = e.target.closest('.pdf-item');
        
        if (pdfItem) {
            e.preventDefault();
            
            const file = pdfItem.getAttribute('data-pdf');
            const title = pdfItem.getAttribute('data-title');
            
            if (!file) {
                console.warn('No PDF file specified for item:', pdfItem);
            return;
            }

            // Remove any previous viewer
            let oldViewer = document.getElementById('inline-pdf-viewer');
            if (oldViewer) {
                oldViewer.remove();
            }

            // Create new viewer container
            const viewerDiv = document.createElement('div');
            viewerDiv.id = 'inline-pdf-viewer';
            viewerDiv.innerHTML = `
                <div class="inline-pdf-header">
                    <div class="pdf-title-section">
                        <h3>${title || 'PDF Viewer'}</h3>
                        <span class="pdf-type-badge">${isDriveLink(file) ? 'Google Drive' : 'Local PDF'}</span>
                    </div>
                    <div class="pdf-controls">
                        <button class="fullscreen-btn" title="Toggle Fullscreen">⛶</button>
                        <button class="close-inline-pdf" title="Close PDF">×</button>
                    </div>
                </div>
                <div class="inline-pdf-content">
                    <div class="pdf-loading">
                        <div class="loading-spinner"></div>
                        <p>Loading PDF...</p>
                    </div>
                </div>
            `;

            // Append to exam PDFs section
            examPdfsSection.appendChild(viewerDiv);

            // Get references to new elements
            const inlinePdfContent = viewerDiv.querySelector('.inline-pdf-content');
            const closeButton = viewerDiv.querySelector('.close-inline-pdf');
            const fullscreenBtn = viewerDiv.querySelector('.fullscreen-btn');
            const loadingDiv = viewerDiv.querySelector('.pdf-loading');

            // Handle close button
            closeButton.addEventListener('click', () => {
                viewerDiv.remove();
            });

            // Handle fullscreen toggle
            fullscreenBtn.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    viewerDiv.requestFullscreen().catch(err => {
                        console.log('Fullscreen not supported:', err);
                    });
                } else {
                    document.exitFullscreen();
                }
            });

            // Handle escape key
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    viewerDiv.remove();
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);

            // Embed PDF based on type
            if (isDriveLink(file)) {
                // Google Drive PDF
                const previewUrl = toDrivePreview(file);
                const iframe = document.createElement('iframe');
                iframe.src = previewUrl;
                iframe.style.width = '100%';
                iframe.style.height = '90vh';
                iframe.style.border = '0';
                iframe.setAttribute('allow', 'autoplay');
                iframe.setAttribute('allowfullscreen', 'true');
                
                // Hide loading when iframe loads
                iframe.onload = () => {
                    loadingDiv.style.display = 'none';
                };
                
                inlinePdfContent.appendChild(iframe);
            } else {
                // Local PDF file
                const embed = document.createElement('embed');
                embed.src = file;
                embed.type = 'application/pdf';
                embed.style.width = '100%';
                embed.style.height = '90vh';
                embed.setAttribute('toolbar', '0');
                embed.setAttribute('navpanes', '0');
                embed.setAttribute('scrollbar', '1');
                
                // Hide loading after a short delay for local PDFs
                setTimeout(() => {
                    loadingDiv.style.display = 'none';
                }, 1000);
                
                inlinePdfContent.appendChild(embed);
            }

            // Scroll to the viewer
            viewerDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});