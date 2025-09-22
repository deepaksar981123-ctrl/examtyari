/* Quiz Feature JavaScript */

(function() {
    // Quiz System Variables
    let currentQuiz = {
        questions: [],
        currentIndex: 0,
        score: 0,
        totalQuestions: 0,
        answers: []
    };

    // Quiz Statistics and Progress Tracking
    const QUIZ_STATS_KEY = 'quizStats';
    const PROGRESS_KEY = 'quizProgress';
    
    function getQuizStats() {
        try {
            return JSON.parse(localStorage.getItem(QUIZ_STATS_KEY)) || {
                totalQuizzes: 0,
                bestScore: 0,
                totalCorrect: 0,
                totalQuestions: 0,
                averageScore: 0,
                streak: 0,
                lastQuizDate: null
            };
        } catch {
            return { 
                totalQuizzes: 0, 
                bestScore: 0, 
                totalCorrect: 0, 
                totalQuestions: 0,
                averageScore: 0,
                streak: 0,
                lastQuizDate: null
            };
        }
    }
    
    function getProgressData() {
        try {
            return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {
                wordsLearned: [],
                weakWords: [],
                strongWords: [],
                dailyProgress: []
            };
        } catch {
            return {
                wordsLearned: [],
                weakWords: [],
                strongWords: [],
                dailyProgress: []
            };
        }
    }
    
    function saveQuizStats(stats) {
        localStorage.setItem(QUIZ_STATS_KEY, JSON.stringify(stats));
    }
    
    function saveProgressData(progress) {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    }

    // Quiz Screen Management
    function showQuizScreen(screenId) {
        document.querySelectorAll('.quiz-screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    // Initialize Quiz System
    function initQuiz() {
        updateQuizStats();
        setupQuizEventListeners();
    }

    function updateQuizStats() {
        const stats = getQuizStats();
        const allWords = window.sheetWords || [];
        
        document.getElementById('total-words').textContent = allWords.length;
        document.getElementById('quiz-score').textContent = stats.bestScore + '%';
        document.getElementById('quizzes-taken').textContent = stats.totalQuizzes;
    }

    function setupQuizEventListeners() {
        // Quiz start buttons
        document.querySelectorAll('.quiz-start-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const questionCount = parseInt(e.target.dataset.questions);
                startQuiz(questionCount);
            });
        });

        // Quiz control buttons
        document.getElementById('quiz-quit').addEventListener('click', () => {
            if (confirm('Are you sure you want to quit the quiz?')) {
                showQuizScreen('quiz-home');
                resetQuiz();
            }
        });

        document.getElementById('quiz-next').addEventListener('click', nextQuestion);

        // Results screen buttons
        document.getElementById('retry-quiz').addEventListener('click', () => {
            startQuiz(currentQuiz.totalQuestions);
        });

        document.getElementById('new-quiz').addEventListener('click', () => {
            showQuizScreen('quiz-home');
            resetQuiz();
        });

        document.getElementById('back-to-home').addEventListener('click', () => {
            showView('home');
            resetQuiz();
        });
    }

    function startQuiz(questionCount) {
        const allWords = window.sheetWords || [];
        
        if (allWords.length < 4) {
            toast(`Need at least 4 words to start a quiz. Please add more words!`, 'error');
            return;
        }

        if (allWords.length < questionCount) {
            questionCount = Math.min(questionCount, allWords.length);
            toast(`Starting quiz with ${questionCount} questions (limited by available words)`, 'warning');
        }

        // Generate quiz questions
        currentQuiz.questions = generateQuizQuestions(allWords, questionCount);
        currentQuiz.currentIndex = 0;
        currentQuiz.score = 0;
        currentQuiz.totalQuestions = questionCount;
        currentQuiz.answers = [];

        showQuizScreen('quiz-game');
        displayQuestion();
    }

    function generateQuizQuestions(words, count) {
        // Shuffle and pick random words
        const shuffled = [...words].sort(() => Math.random() - 0.5);
        const selectedWords = shuffled.slice(0, count);

        return selectedWords.map(word => {
            // Create wrong options from other words
            const wrongOptions = shuffled
                .filter(w => w.word !== word.word && w.meaning !== word.meaning)
                .slice(0, 3)
                .map(w => w.meaning || w.hindiMeaning || 'No meaning available');

            // Add correct answer
            const correctAnswer = word.meaning || word.hindiMeaning || 'No meaning available';
            
            // Create options array and randomly place correct answer
            const options = [...wrongOptions];
            const correctIndex = Math.floor(Math.random() * 4); // Random position (0-3)
            options.splice(correctIndex, 0, correctAnswer); // Insert at random position
            
            // If we have less than 4 options, fill with more wrong answers
            while (options.length < 4) {
                const extraWrong = shuffled
                    .filter(w => w.word !== word.word && !options.includes(w.meaning))
                    .map(w => w.meaning || w.hindiMeaning || 'No meaning available')
                    .slice(0, 1);
                if (extraWrong.length > 0) {
                    options.push(extraWrong[0]);
                } else {
                    options.push('Alternative meaning ' + (options.length + 1));
                }
            }

            return {
                word: word.word,
                correctAnswer: correctAnswer,
                options: options.slice(0, 4), // Ensure exactly 4 options
                correctIndex: options.indexOf(correctAnswer),
                wordData: word
            };
        });
    }

    function displayQuestion() {
        const question = currentQuiz.questions[currentQuiz.currentIndex];
        
        // Update progress
        const progress = ((currentQuiz.currentIndex + 1) / currentQuiz.totalQuestions) * 100;
        document.getElementById('quiz-progress-fill').style.width = progress + '%';
        document.getElementById('quiz-progress-text').textContent = 
            `${currentQuiz.currentIndex + 1} / ${currentQuiz.totalQuestions}`;
        
        // Update score
        document.getElementById('current-score').textContent = currentQuiz.score;

        // Display question
        document.getElementById('question-word').textContent = question.word;
        
        // Vary the question type
        const questionTypes = [
            'What does this word mean?',
            'Choose the correct meaning:',
            'What is the definition of this word?',
            'Select the right meaning:'
        ];
        const randomType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
        document.getElementById('question-prompt').textContent = randomType;

        // Display options
        const optionsContainer = document.getElementById('quiz-options');
        optionsContainer.innerHTML = '';

        question.options.forEach((option, index) => {
            const optionBtn = document.createElement('button');
            optionBtn.className = 'quiz-option';
            optionBtn.textContent = option;
            optionBtn.addEventListener('click', () => selectAnswer(index));
            optionsContainer.appendChild(optionBtn);
        });

        // Hide next button
        document.getElementById('quiz-next').style.display = 'none';
    }

    function selectAnswer(selectedIndex) {
        const question = currentQuiz.questions[currentQuiz.currentIndex];
        const options = document.querySelectorAll('.quiz-option');
        
        // Disable all options
        options.forEach(option => option.classList.add('disabled'));
        
        // Mark correct and selected answers
        options.forEach((option, index) => {
            if (index === question.correctIndex) {
                option.classList.add('correct');
            } else if (index === selectedIndex && selectedIndex !== question.correctIndex) {
                option.classList.add('wrong');
            } else if (index === selectedIndex) {
                option.classList.add('selected');
            }
        });

        // Update score
        const isCorrect = selectedIndex === question.correctIndex;
        if (isCorrect) {
            currentQuiz.score++;
            toast('Correct! 🎉', 'success');
        } else {
            toast('Wrong answer 😔', 'error');
        }

        // Store answer
        currentQuiz.answers.push({
            questionIndex: currentQuiz.currentIndex,
            selectedIndex: selectedIndex,
            correctIndex: question.correctIndex,
            isCorrect: isCorrect,
            word: question.word,
            correctAnswer: question.correctAnswer
        });

        // Auto-advance to next question after 1.5 seconds
        setTimeout(() => {
            if (currentQuiz.currentIndex < currentQuiz.totalQuestions - 1) {
                nextQuestion();
            } else {
                finishQuiz();
            }
        }, 1500);
    }

    function nextQuestion() {
        currentQuiz.currentIndex++;
        if (currentQuiz.currentIndex < currentQuiz.totalQuestions) {
            displayQuestion();
        } else {
            finishQuiz();
        }
    }

    function finishQuiz() {
        // Calculate results
        const percentage = Math.round((currentQuiz.score / currentQuiz.totalQuestions) * 100);
        const correctCount = currentQuiz.score;
        const wrongCount = currentQuiz.totalQuestions - correctCount;

        // Update statistics
        const stats = getQuizStats();
        stats.totalQuizzes++;
        stats.bestScore = Math.max(stats.bestScore, percentage);
        stats.totalCorrect += correctCount;
        stats.totalQuestions += currentQuiz.totalQuestions;
        saveQuizStats(stats);

        // Display results
        displayResults(percentage, correctCount, wrongCount);
        showQuizScreen('quiz-results');
    }

    function displayResults(percentage, correctCount, wrongCount) {
        // Results icon and title based on performance
        let icon, title;
        if (percentage >= 90) {
            icon = '🏆';
            title = 'Outstanding!';
        } else if (percentage >= 80) {
            icon = '🎉';
            title = 'Excellent!';
        } else if (percentage >= 70) {
            icon = '👏';
            title = 'Well Done!';
        } else if (percentage >= 60) {
            icon = '👍';
            title = 'Good Job!';
        } else {
            icon = '💪';
            title = 'Keep Practicing!';
        }

        document.getElementById('results-icon').textContent = icon;
        document.getElementById('results-title').textContent = title;
        document.getElementById('final-score').textContent = correctCount;
        document.getElementById('total-questions').textContent = currentQuiz.totalQuestions;
        document.getElementById('results-percentage').textContent = percentage + '%';
        
        document.getElementById('correct-count').textContent = correctCount;
        document.getElementById('wrong-count').textContent = wrongCount;
        document.getElementById('accuracy-rate').textContent = percentage + '%';
    }

    function resetQuiz() {
        currentQuiz = {
            questions: [],
            currentIndex: 0,
            score: 0,
            totalQuestions: 0,
            answers: []
        };
        
        updateQuizStats();
    }
    
    // Function to reset quiz and show home screen - called from main navigation
    function resetQuizToHome() {
        resetQuiz();
        showQuizScreen('quiz-home');
    }

    // Public functions for external access
    window.initQuiz = initQuiz;
    window.updateQuizStats = updateQuizStats;
    window.resetQuizToHome = resetQuizToHome;

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initQuiz);
    } else {
        initQuiz();
    }
})();