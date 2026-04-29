// Modern Quiz Application - Enhanced Interactions

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const startScreen = document.getElementById('start-screen');
    const quizScreen = document.getElementById('quiz-screen');
    const resultScreen = document.getElementById('result-screen');
    
    const startBtn = document.getElementById('start-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const restartBtn = document.getElementById('restart-btn');
    
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const progressBar = document.getElementById('progress-bar');
    const questionCount = document.getElementById('question-count');
    const timerDisplay = document.getElementById('timer');
    const progressContainer = document.querySelector('[role="progressbar"]');
    
    const resultMessage = document.getElementById('result-message');
    const scorePercentage = document.getElementById('score-percentage');
    const scoreText = document.getElementById('score-text');
    const scoreCircle = document.querySelector('.score-circle');

    // State Management
    let questions = [];
    let currentQuestionIndex = 0;
    let userAnswers = {};
    let timerInterval;
    let secondsElapsed = 0;

    // Fetch Questions from API
    async function fetchQuestions() {
        try {
            startBtn.textContent = 'Loading...';
            startBtn.disabled = true;
            
            const response = await fetch('/get_questions');
            if (!response.ok) throw new Error('Failed to fetch questions');
            
            questions = await response.json();
            startQuiz();
        } catch (error) {
            console.error('Error fetching questions:', error);
            startBtn.textContent = 'Error. Try Again.';
            startBtn.disabled = false;
        }
    }

    // Submit Score to API
    async function submitScore() {
        try {
            const payload = [];
            questions.forEach(q => {
                if (userAnswers[q.question]) {
                    payload.push({
                        question: q.question,
                        answer: userAnswers[q.question]
                    });
                }
            });

            const response = await fetch('/submit_score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers: payload })
            });

            if (!response.ok) throw new Error('Failed to submit score');
            const result = await response.json();
            showResults(result);
        } catch (error) {
            console.error('Error submitting score:', error);
        }
    }

    // Start Quiz Flow
    function startQuiz() {
        transitionScreen(startScreen, quizScreen);
        
        currentQuestionIndex = 0;
        userAnswers = {};
        secondsElapsed = 0;
        
        startTimer();
        loadQuestion();
    }

    // Load Current Question
    function loadQuestion() {
        const q = questions[currentQuestionIndex];
        
        // Update question text with fade effect
        questionText.style.opacity = '0';
        setTimeout(() => {
            questionText.textContent = q.question;
            questionText.style.transition = 'opacity 0.3s ease';
            questionText.style.opacity = '1';
        }, 100);
        
        // Update Progress
        const progress = (currentQuestionIndex / questions.length) * 100;
        progressBar.style.width = `${progress}%`;
        progressContainer.setAttribute('aria-valuenow', Math.round(progress));
        questionCount.textContent = `Question: ${currentQuestionIndex + 1} / ${questions.length}`;

        // Update Button States
        prevBtn.disabled = currentQuestionIndex === 0;
        const isLastQuestion = currentQuestionIndex === questions.length - 1;
        nextBtn.textContent = isLastQuestion ? 'Submit' : 'Next →';
        
        const selectedOption = userAnswers[q.question];
        nextBtn.disabled = !selectedOption;

        // Render Options with Staggered Animation
        optionsContainer.innerHTML = '';
        q.options.forEach((option, index) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = option;
            btn.setAttribute('role', 'radio');
            btn.setAttribute('aria-checked', selectedOption === option);
            
            // Staggered slide-in animation
            btn.style.opacity = '0';
            btn.style.transform = 'translateX(-20px)';
            btn.style.transition = `all 0.3s cubic-bezier(0.4, 0, 0.2, 1) ${index * 50}ms`;
            
            if (selectedOption === option) {
                btn.classList.add('selected');
            }

            btn.addEventListener('click', () => selectOption(q.question, option, btn));
            optionsContainer.appendChild(btn);
            
            // Trigger animation
            setTimeout(() => {
                btn.style.opacity = '1';
                btn.style.transform = 'translateX(0)';
            }, 10);
        });
    }

    // Handle Option Selection
    function selectOption(questionText, optionValue, btnElement) {
        userAnswers[questionText] = optionValue;
        
        // Remove previous selection
        document.querySelectorAll('.option-btn').forEach(b => {
            b.classList.remove('selected');
            b.setAttribute('aria-checked', 'false');
        });
        
        // Add selection to current button
        btnElement.classList.add('selected');
        btnElement.setAttribute('aria-checked', 'true');
        
        // Enable next button with smooth transition
        nextBtn.disabled = false;
        nextBtn.style.opacity = '1';
    }

    // Show Results Screen
    function showResults(data) {
        clearInterval(timerInterval);
        transitionScreen(quizScreen, resultScreen);

        resultMessage.textContent = data.message;
        scoreText.textContent = `You scored ${data.score} out of ${data.total}.`;
        
        // Animate score percentage
        animatePercentage(data.percentage);
        
        // Animate score circle progress
        animateScoreCircle(data.percentage);
        saveProgress(data);
    }

    // Animate Percentage Counter
    function animatePercentage(targetPercent) {
        let currentPercent = 0;
        const increment = targetPercent / 50; // Smooth animation over ~50 frames
        
        const anim = setInterval(() => {
            currentPercent += increment;
            if (currentPercent >= targetPercent) {
                currentPercent = targetPercent;
                clearInterval(anim);
            }
            scorePercentage.textContent = `${Math.round(currentPercent)}%`;
        }, 20);
    }
function saveProgress(data) {
    let history = JSON.parse(localStorage.getItem("quizHistory")) || [];

    const attempt = {
        score: data.score,
        total: data.total,
        percentage: data.percentage,
        date: new Date().toLocaleString()
    };

    history.push(attempt);

    // keep only last 10 attempts
    if (history.length > 10) {
        history.shift();
    }

    localStorage.setItem("quizHistory", JSON.stringify(history));
}
function loadProgress() {
    let history = JSON.parse(localStorage.getItem("quizHistory")) || [];

    if (history.length === 0) return;

    let best = Math.max(...history.map(h => h.percentage));
    let last = history[history.length - 1].percentage;

    document.getElementById("best-score").textContent = best + "%";
    document.getElementById("last-score").textContent = last + "%";
    document.getElementById("attempt-count").textContent = history.length;

    // history list
    const list = document.getElementById("history-list");
    list.innerHTML = "";

    history.slice().reverse().forEach(h => {
        let li = document.createElement("li");
        li.innerHTML = `
            <span>${h.percentage}%</span>
            <span>${h.date}</span>
        `;
        list.appendChild(li);
    });
}
    // Animate Score Circle
    function animateScoreCircle(percentage) {
        const targetDeg = (percentage / 100) * 360;
        scoreCircle.style.transition = 'background 2s cubic-bezier(0.4, 0, 0.2, 1)';
        scoreCircle.style.background = `conic-gradient(var(--accent-primary) ${targetDeg}deg, rgba(255,255,255,0.05) 0deg)`;
    }

    // Start Timer
    function startTimer() {
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            secondsElapsed++;
            const mins = Math.floor(secondsElapsed / 60).toString().padStart(2, '0');
            const secs = (secondsElapsed % 60).toString().padStart(2, '0');
            timerDisplay.textContent = `Time: ${mins}:${secs}`;
        }, 1000);
    }

    // Screen Transition Helper
    function transitionScreen(fromScreen, toScreen) {
    // Hide current screen
    fromScreen.classList.remove('active');
    fromScreen.classList.add('hidden');

    // Show next screen
    toScreen.classList.remove('hidden');

    setTimeout(() => {
        toScreen.classList.add('active');
    }, 50);
}
    // Event Listeners
    startBtn.addEventListener('click', fetchQuestions);
    
    restartBtn.addEventListener('click', () => {
        transitionScreen(resultScreen, startScreen);
        startBtn.textContent = 'Start Quiz';
        startBtn.disabled = false;
    });

    nextBtn.addEventListener('click', () => {
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            loadQuestion();
        } else {
            submitScore();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            loadQuestion();
        }
    });

    // Keyboard Navigation
    document.addEventListener('keydown', (e) => {
        if (quizScreen.classList.contains('active')) {
            if (e.key === 'ArrowRight' && !nextBtn.disabled) nextBtn.click();
            if (e.key === 'ArrowLeft' && !prevBtn.disabled) prevBtn.click();
        }
    });
loadProgress();});