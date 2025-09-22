// Exam List Management
// ====================
// This file is now integrated into exam-pdfs.js for better organization
// All PDF data and functionality has been moved to exam-pdfs.js

// Legacy support - redirect to exam-pdfs functionality
if (typeof window.initializeExamPdfs === 'function') {
    console.log('Exam list functionality loaded via exam-pdfs.js');
} else {
    console.warn('exam-pdfs.js not loaded - PDF functionality may not work');
}