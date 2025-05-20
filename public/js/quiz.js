// Import Firebase modules directly from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-analytics.js";
import { triggerConfetti, showCongratulationsPopup } from './animations.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCYLVgyRlw-28Xe_0Kbn3ddZu-CwLuKa8c",
    authDomain: "embsquiz.firebaseapp.com",
    projectId: "embsquiz",
    storageBucket: "embsquiz.firebasestorage.app",
    messagingSenderId: "1038118235610",
    appId: "1:1038118235610:web:4a9e569cd92409af7264e3",
    measurementId: "G-44VVWH40EB"
};

// Quiz state management
const QUIZ_STATE_KEY = 'quizState';
const TEAM_NAME_KEY = 'currentTeamName';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// Quiz state class for better state management
class QuizState {
    constructor() {
        this.currentTeamName = null;
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.answeredQuestions = new Set();
        this.isQuizActive = false;
    }

    saveToSession() {
        const state = {
            currentTeamName: this.currentTeamName,
            currentQuestionIndex: this.currentQuestionIndex,
            score: this.score,
            answeredQuestions: Array.from(this.answeredQuestions),
            isQuizActive: this.isQuizActive
        };
        sessionStorage.setItem(QUIZ_STATE_KEY, JSON.stringify(state));
    }

    loadFromSession() {
        const savedState = sessionStorage.getItem(QUIZ_STATE_KEY);
        if (savedState) {
            const state = JSON.parse(savedState);
            this.currentTeamName = state.currentTeamName;
            this.currentQuestionIndex = state.currentQuestionIndex;
            this.score = state.score;
            this.answeredQuestions = new Set(state.answeredQuestions);
            this.isQuizActive = state.isQuizActive;
            return true;
        }
        return false;
    }

    reset() {
        this.currentTeamName = null;
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.answeredQuestions.clear();
        this.isQuizActive = false;
        sessionStorage.removeItem(QUIZ_STATE_KEY);
        sessionStorage.removeItem(TEAM_NAME_KEY);
    }
}

// Initialize quiz state
const quizState = new QuizState();

// Quiz data with question types and previews
const quizQuestions = [
    // Easy Questions (🟢)
    {
        id: 1,
        type: 'Text Input',
        difficulty: 'Easy',
        icon: 'fa-check-circle',
        preview: '🟢 Easy: Test your knowledge of microcontrollers in biomedical devices',
        question: "What is the primary function of a microcontroller in biomedical devices?",
        answer: "SIGNAL PROCESSING AND CONTROL"
    },
    {
        id: 2,
        type: 'Text Input',
        difficulty: 'Easy',
        icon: 'fa-check-circle',
        preview: '🟢 Easy: Identify which component is NOT typically used in biomedical sensors',
        question: "Which of the following is NOT a common biomedical sensor?",
        answer: "GPS MODULE"
    },
    {
        id: 3,
        type: 'Text Input',
        difficulty: 'Easy',
        icon: 'fa-check-circle',
        preview: '🟢 Easy: Test your knowledge of human EEG signal frequencies',
        question: "What is the typical frequency range of human EEG signals?",
        answer: "0.5-100 HZ"
    },
    {
        id: 4,
        type: 'Text Input',
        difficulty: 'Easy',
        icon: 'fa-check-circle',
        preview: '🟢 Easy: Identify the essential component for wireless medical device communication',
        question: "Which component is essential for wireless medical device communication?",
        answer: "TRANSCEIVER"
    },
    {
        id: 5,
        type: 'Text Input',
        difficulty: 'Easy',
        icon: 'fa-check-circle',
        preview: '🟢 Easy: Understand the purpose of signal conditioning in biomedical devices',
        question: "What is the main purpose of signal conditioning in biomedical devices?",
        answer: "AMPLIFY AND FILTER SIGNALS"
    },
    {
        id: 6,
        type: 'Text Input',
        difficulty: 'Easy',
        icon: 'fa-check-circle',
        preview: '🟢 Easy: Learn about common power sources for medical devices',
        question: "Which power source is most commonly used in portable medical devices?",
        answer: "LITHIUM-ION BATTERIES"
    },
    {
        id: 7,
        type: 'Text Input',
        difficulty: 'Easy',
        icon: 'fa-check-circle',
        preview: '🟢 Easy: Understand basic medical device safety standards',
        question: "What is the primary purpose of medical device safety standards?",
        answer: "ENSURE PATIENT AND OPERATOR SAFETY"
    },
    // Medium Questions (🟡)
    {
        id: 8,
        type: 'Text Input',
        difficulty: 'Medium',
        icon: 'fa-check-circle',
        preview: '🟡 Medium: Explore advanced sensor technologies',
        question: "Which sensor technology is best suited for continuous glucose monitoring?",
        answer: "ELECTROCHEMICAL SENSORS"
    },
    {
        id: 9,
        type: 'Text Input',
        difficulty: 'Medium',
        icon: 'fa-check-circle',
        preview: '🟡 Medium: Understand wireless protocols in medical devices',
        question: "Which wireless protocol is most commonly used for medical device data transmission?",
        answer: "BLUETOOTH LOW ENERGY"
    },
    {
        id: 10,
        type: 'Text Input',
        difficulty: 'Medium',
        icon: 'fa-check-circle',
        preview: '🟡 Medium: Learn about medical device data security',
        question: "What is the primary security concern in wireless medical devices?",
        answer: "DATA ENCRYPTION"
    },
    {
        id: 11,
        type: 'Text Input',
        difficulty: 'Medium',
        icon: 'fa-check-circle',
        preview: '🟡 Medium: Explore signal processing techniques',
        question: "Which signal processing technique is used to remove noise from ECG signals?",
        answer: "ALL OF THE ABOVE"
    },
    {
        id: 12,
        type: 'Text Input',
        difficulty: 'Medium',
        icon: 'fa-check-circle',
        preview: '🟡 Medium: Understand medical device power management',
        question: "What is the main challenge in power management for implantable devices?",
        answer: "ALL OF THE ABOVE"
    },
    {
        id: 13,
        type: 'Text Input',
        difficulty: 'Medium',
        icon: 'fa-check-circle',
        preview: '🟡 Medium: Learn about medical device calibration',
        question: "Why is calibration important in medical devices?",
        answer: "TO ENSURE ACCURACY"
    },
    {
        id: 14,
        type: 'Text Input',
        difficulty: 'Medium',
        icon: 'fa-check-circle',
        preview: '🟡 Medium: Explore medical device materials',
        question: "Which material property is most important for implantable devices?",
        answer: "BIOCOMPATIBILITY"
    },
    {
        id: 15,
        type: 'Text Input',
        difficulty: 'Medium',
        icon: 'fa-check-circle',
        preview: '🟡 Medium: Understand medical device testing',
        question: "What is the purpose of accelerated life testing in medical devices?",
        answer: "PREDICT DEVICE LIFETIME"
    },
    // Hard Questions (🔴)
    {
        id: 16,
        type: 'Text Input',
        difficulty: 'Hard',
        icon: 'fa-check-circle',
        preview: '🔴 Hard: Advanced signal processing concepts',
        question: "Which algorithm is most effective for real-time artifact removal in EEG signals?",
        answer: "INDEPENDENT COMPONENT ANALYSIS"
    },
    {
        id: 17,
        type: 'Text Input',
        difficulty: 'Hard',
        icon: 'fa-check-circle',
        preview: '🔴 Hard: Complex medical device integration',
        question: "What is the main challenge in integrating multiple medical sensors?",
        answer: "SIGNAL SYNCHRONIZATION"
    },
    {
        id: 18,
        type: 'Text Input',
        difficulty: 'Hard',
        icon: 'fa-check-circle',
        preview: '🔴 Hard: Advanced power management',
        question: "Which technology shows the most promise for self-powered medical devices?",
        answer: "PIEZOELECTRIC ENERGY HARVESTING"
    },
    {
        id: 19,
        type: 'Text Input',
        difficulty: 'Hard',
        icon: 'fa-check-circle',
        preview: '🔴 Hard: Complex medical device security',
        question: "What is the most secure method for medical device data transmission?",
        answer: "END-TO-END ENCRYPTION"
    },
    {
        id: 20,
        type: 'Text Input',
        difficulty: 'Hard',
        icon: 'fa-check-circle',
        preview: '🔴 Hard: Advanced medical device design',
        question: "Which factor is most critical in designing implantable medical devices?",
        answer: "BIOCOMPATIBILITY"
    }
];

// Enhanced DOM Elements
const elements = {
    welcomeScreen: document.getElementById('welcome-screen'),
    teamNameModal: document.getElementById('team-name-modal'),
    teamNameForm: document.getElementById('team-name-form'),
    teamNameInput: document.getElementById('team-name-input'),
    teamNameError: document.getElementById('team-name-error'),
    questionScreen: document.getElementById('question-screen'),
    questionText: document.getElementById('question-text'),
    optionsContainer: document.getElementById('options-container'),
    nextButton: document.getElementById('next-btn'),
    submitQuizButton: document.getElementById('submit-quiz-btn'),
    currentScoreSpan: document.getElementById('current-score'),
    submissionStatus: document.getElementById('submission-status'),
    statusMessage: document.getElementById('status-message'),
    questionTypeLabel: document.getElementById('question-type-label'),
    startQuizButton: document.getElementById('start-quiz-btn')
};

// Screen management with validation
function showScreen(screenId) {
    const screens = ['welcome-screen', 'question-screen', 'submission-status'];
    screens.forEach(screen => {
        const element = document.getElementById(screen);
        if (element) {
            element.classList.remove('active');
        }
    });
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
}

// Create question cards
function createQuestionCards() {
    const questionCards = document.getElementById('question-cards');
    questionCards.innerHTML = '';
    
    quizQuestions.forEach((question, index) => {
        const card = document.createElement('div');
        card.className = `question-card ${quizState.answeredQuestions.has(index) ? 'completed' : ''}`;
        const difficultyIcon = {
            'Easy': 'fa-check-circle',
            'Medium': 'fa-exclamation-circle',
            'Hard': 'fa-fire'
        }[question.difficulty];
        const badgeHTML = `<span class="difficulty-badge ${question.difficulty.toLowerCase()}"><i class="fas ${difficultyIcon}"></i> ${question.difficulty}</span>`;
        card.innerHTML = `
            <div class="question-card-content">
                <div class="question-type" style="flex-direction:column;align-items:flex-start;gap:0.3rem;">
                    ${badgeHTML}
                    <span class="mcq-label"><i class="fas fa-question-circle"></i> Text Input</span>
                </div>
                <div class="question-preview">${question.preview}</div>
                <button class="start-question-btn" ${quizState.answeredQuestions.has(index) ? 'disabled' : ''}>
                    ${quizState.answeredQuestions.has(index) ? 'Completed' : 'Start Question'}
                    <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        `;
        if (!quizState.answeredQuestions.has(index)) {
            card.addEventListener('click', () => {
                quizState.currentQuestionIndex = index;
                showScreen('question-screen');
                showQuestion();
            });
        }
        questionCards.appendChild(card);
    });
}

// Start a specific question
function startQuestion(index) {
    currentQuestionIndex = index;
    showScreen('question-screen');
    showQuestion();
    questionTypeLabel.textContent = quizQuestions[index].type;
}

// Add timeout warning
let questionTimeout;
function startQuestionTimer() {
    const TIMEOUT_DURATION = 30000; // 30 seconds
    clearTimeout(questionTimeout);
    
    questionTimeout = setTimeout(() => {
        const warning = document.createElement('div');
        warning.className = 'timeout-warning';
        warning.innerHTML = `
            <div class="warning-content">
                <i class="fas fa-clock"></i>
                <p>Time's running out! Please answer soon.</p>
            </div>
        `;
        document.body.appendChild(warning);
        setTimeout(() => warning.remove(), 3000);
    }, TIMEOUT_DURATION);
}

// Enhanced question display with difficulty indicator
function showQuestion() {
    const question = quizQuestions[quizState.currentQuestionIndex];
    elements.questionText.textContent = question.question;

    // Render difficulty badge above question
    const difficultyIcon = {
        'Easy': 'fa-check-circle',
        'Medium': 'fa-exclamation-circle',
        'Hard': 'fa-fire'
    }[question.difficulty];
    const badgeHTML = `
        <span class="difficulty-badge ${question.difficulty.toLowerCase()}">
            <i class="fas ${difficultyIcon}"></i>
            ${question.difficulty}
        </span>
    `;
    document.getElementById('difficulty-badge-placeholder').innerHTML = badgeHTML;

    // Replace options with text input
    elements.optionsContainer.innerHTML = `
        <div class="text-input-container">
            <input type="text" 
                   id="answer-input" 
                   class="answer-input" 
                   placeholder="Type your answer here..."
                   autocomplete="off"
                   style="text-transform: uppercase;">
            <div id="feedback-message" class="feedback-message"></div>
        </div>
    `;

    // Add event listener to check answer
    const answerInput = document.getElementById('answer-input');
    const feedbackMessage = document.getElementById('feedback-message');
    
    // Add input event listener for uppercase conversion
    answerInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
    });
    
    answerInput.addEventListener('input', () => {
        const userAnswer = answerInput.value.trim();
        if (userAnswer === question.answer) {
            elements.nextButton.style.display = 'inline-flex';
            
            // Add CryptCoins based on difficulty
            let points = 0;
            switch (question.difficulty.toLowerCase()) {
                case 'easy':
                    points = 100;
                    break;
                case 'medium':
                    points = 250;
                    break;
                case 'hard':
                    points = 500;
                    break;
            }
            
            // Update score and display
            quizState.score += points;
            updateScoreDisplay();
            updateFirestoreScore();
            
            // Show success feedback
            feedbackMessage.innerHTML = `
                <div class="feedback success">
                    <i class="fas fa-check-circle"></i>
                    <span>Correct!</span>
                </div>
            `;
            feedbackMessage.classList.add('show');
            
            // Disable input after correct answer
            answerInput.disabled = true;
            answerInput.classList.add('correct');
            
            // Mark question as answered
            quizState.answeredQuestions.add(quizState.currentQuestionIndex);
            quizState.saveToSession();
        } else {
            elements.nextButton.style.display = 'none';
            feedbackMessage.classList.remove('show');
            
            // Show typing feedback if input is not empty
            if (userAnswer.length > 0) {
                feedbackMessage.innerHTML = `
                    <div class="feedback typing">
                        <i class="fas fa-pencil-alt"></i>
                        <span>Keep typing...</span>
                    </div>
                `;
                feedbackMessage.classList.add('show');
            } else {
                feedbackMessage.classList.remove('show');
            }
        }
    });

    // Update UI state
    elements.nextButton.style.display = 'none';
    elements.submitQuizButton.style.display = quizState.answeredQuestions.size === quizQuestions.length ? 'inline-flex' : 'none';
    updateScoreDisplay();
    
    // Start question timer
    startQuestionTimer();
}

// Enhanced option selection
function selectOption(index) {
    const question = quizQuestions[quizState.currentQuestionIndex];
    const isCorrect = index === question.correctAnswer;
    
    const options = elements.optionsContainer.getElementsByClassName('option');
    Array.from(options).forEach((option, i) => {
        option.classList.toggle('selected', i === index);
        option.classList.toggle('correct', i === question.correctAnswer);
        option.classList.toggle('incorrect', i === index && !isCorrect);
        option.style.pointerEvents = 'none'; // Disable further clicks
    });

    if (isCorrect) {
        let points = 0;
        switch (question.difficulty) {
            case 'Easy':
                points = 100;
                break;
            case 'Medium':
                points = 250;
                break;
            case 'Hard':
                points = 500;
                break;
        }
        quizState.score += points;
        updateScoreDisplay();
        updateFirestoreScore();
    }

    // Show next/submit button after a short delay
    setTimeout(() => {
        if (quizState.currentQuestionIndex === quizQuestions.length - 1) {
            elements.submitQuizButton.style.display = 'inline-flex';
        } else {
            elements.nextButton.style.display = 'inline-flex';
        }
    }, 1000);
}

// Enhanced score update with retry logic
async function updateFirestoreScore(retryCount = 0) {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1 second

    try {
        if (!quizState.currentTeamName) return;
        
        const teamRef = doc(db, 'leaderboard', quizState.currentTeamName);
        await updateDoc(teamRef, {
            score: quizState.score,
            lastSubmitted: serverTimestamp(),
            currentQuestion: quizState.currentQuestionIndex,
            isQuizActive: true
        });
    } catch (error) {
        console.error('Error updating score:', error);
        
        // Retry logic for network issues
        if (retryCount < MAX_RETRIES) {
            console.log(`Retrying score update (${retryCount + 1}/${MAX_RETRIES})...`);
            setTimeout(() => updateFirestoreScore(retryCount + 1), RETRY_DELAY);
        } else {
            // Show error to user after all retries failed
            elements.statusMessage.textContent = 'Error updating score. Please check your connection.';
            elements.statusMessage.style.color = 'var(--error-color)';
        }
    }
}

// Next question function
function nextQuestion() {
    // Clear the current question timer
    clearTimeout(questionTimeout);
    
    // Move to next question
    quizState.currentQuestionIndex++;
    
    // Check if we've reached the end of the quiz
    if (quizState.currentQuestionIndex >= quizQuestions.length) {
        completeQuiz();
        return;
    }
    
    // Check if we've completed easy questions (index 7)
    if (quizState.currentQuestionIndex === 7) {
        // Save current state before redirecting
        quizState.saveToSession();
        sessionStorage.setItem('quizScore', quizState.score);
        sessionStorage.setItem('bonusRoundCompleted', 'false');
        // Redirect to mini-game
        window.location.href = 'neuro-match.html';
        return;
    }
    
    // Show the next question
    showQuestion();
}

// Complete quiz function
async function completeQuiz() {
    const submitButton = elements.submitQuizButton;
    const originalButtonText = submitButton.innerHTML;
    
    try {
        submitButton.disabled = true;
        submitButton.innerHTML = `
            <span class="loading-spinner"></span>
            Submitting...
        `;
        
        // Update Firestore with final score
        const teamRef = doc(db, 'leaderboard', quizState.currentTeamName);
        await updateDoc(teamRef, {
            score: quizState.score,
            lastSubmitted: serverTimestamp(),
            isQuizActive: false,
            completedQuestions: Array.from(quizState.answeredQuestions),
            totalQuestions: quizQuestions.length
        });
        
        // Update final state
        quizState.isQuizActive = false;
        quizState.saveToSession();
        
        // Show success animations
        triggerConfetti();
        showCongratulationsPopup(quizState.score);
        
        // Show completion screen
        showScreen('submission-status');
        elements.statusMessage.textContent = `Quiz completed! Your CryptCoins: ${quizState.score}`;
        
    } catch (error) {
        console.error('Error completing quiz:', error);
        elements.statusMessage.textContent = 'Error submitting quiz. Please try again.';
        elements.statusMessage.style.color = 'var(--error-color)';
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    }
}

// Enhanced page load handling
document.addEventListener('DOMContentLoaded', () => {
    // Check if returning from mini-game
    const urlParams = new URLSearchParams(window.location.search);
    const resumeFrom = urlParams.get('resumeFrom');
    
    if (resumeFrom === '7') {
        // Remove the URL parameter
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Load state and continue from question 7
        if (quizState.loadFromSession()) {
            quizState.currentQuestionIndex = 7;
            quizState.isQuizActive = true;
            
            // Check if bonus round was completed
            const bonusCompleted = sessionStorage.getItem('bonusRoundCompleted') === 'true';
            if (bonusCompleted) {
                // Restore score from session
                const savedScore = sessionStorage.getItem('quizScore');
                if (savedScore) {
                    quizState.score = parseInt(savedScore);
                    updateScoreDisplay();
                }
            }
            
            quizState.saveToSession();
            showScreen('question-screen');
            showQuestion();
            return;
        }
    }
    
    if (quizState.loadFromSession() && quizState.isQuizActive) {
        startQuiz();
    } else {
        showScreen('welcome-screen');
    }
});

// Event Listeners
elements.startQuizButton.addEventListener('click', () => {
    if (!quizState.currentTeamName) {
        showModal();
    } else {
        startQuiz();
    }
});

elements.teamNameForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const teamName = elements.teamNameInput.value.trim();
    
    if (await initializeTeam(teamName)) {
        startQuiz();
    }
});

elements.nextButton.addEventListener('click', nextQuestion);
elements.submitQuizButton.addEventListener('click', completeQuiz);

// Tab visibility handling
document.addEventListener('visibilitychange', () => {
    if (document.hidden && quizState.isQuizActive) {
        // Optional: Show warning about tab switching
        const warning = document.createElement('div');
        warning.className = 'tab-switch-warning';
        warning.innerHTML = `
            <div class="warning-content">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Switching tabs may affect your quiz progress!</p>
            </div>
        `;
        document.body.appendChild(warning);
        setTimeout(() => warning.remove(), 3000);
    }
});

// Show modal
function showModal() {
    elements.teamNameModal.classList.add('active');
    elements.teamNameInput.focus();
}

// Hide modal
function hideModal() {
    elements.teamNameModal.classList.remove('active');
    elements.teamNameInput.value = '';
    elements.teamNameError.textContent = '';
}

// Enhanced team name validation
async function validateTeamName(teamName) {
    const sanitized = sanitizeTeamName(teamName);
    
    // Basic validation
    if (!sanitized) {
        throw new Error('Team name cannot be empty');
    }
    
    if (sanitized.length < 3) {
        throw new Error('Team name must be at least 3 characters long');
    }

    if (sanitized.length > 50) {
        throw new Error('Team name must be less than 50 characters');
    }

    // Check for invalid characters
    if (!/^[a-zA-Z0-9\s-]+$/.test(sanitized)) {
        throw new Error('Team name can only contain letters, numbers, spaces, and hyphens');
    }

    // Check if team name already exists
    const teamRef = doc(db, 'leaderboard', sanitized);
    const teamDoc = await getDoc(teamRef);
    
    if (teamDoc.exists()) {
        const teamData = teamDoc.data();
        // Check if the team has an active quiz
        if (teamData.isQuizActive && teamData.lastSubmitted) {
            const lastSubmitted = teamData.lastSubmitted.toDate();
            const now = new Date();
            // If last submission was less than 24 hours ago, consider the team active
            if (now - lastSubmitted < 24 * 60 * 60 * 1000) {
                throw new Error('This team name is already in use. Please try again later or use a different name.');
            }
        }
    }

    return sanitized;
}

// Enhanced team initialization
async function initializeTeam(teamName) {
    const submitButton = elements.teamNameForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    
    try {
        submitButton.disabled = true;
        submitButton.innerHTML = `
            <span class="loading-spinner"></span>
            Initializing...
        `;
        
        const sanitizedTeamName = await validateTeamName(teamName);
        
        // Create team document with initial state
        await setDoc(doc(db, 'leaderboard', sanitizedTeamName), {
            teamName: sanitizedTeamName,
            score: 0,
            lastSubmitted: serverTimestamp(),
            quizStarted: serverTimestamp(),
            currentQuestion: 0,
            isQuizActive: true,
            attempts: 1
        });

        // Update quiz state
        quizState.currentTeamName = sanitizedTeamName;
        quizState.isQuizActive = true;
        quizState.currentQuestionIndex = 0;
        quizState.score = 0;
        quizState.answeredQuestions.clear();
        quizState.saveToSession();
        
        // Hide modal and start quiz
        hideModal();
        return true;
    } catch (error) {
        console.error('Error initializing team:', error);
        elements.teamNameError.textContent = error.message || 'Failed to initialize team. Please try again.';
        return false;
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    }
}

// Enhanced quiz start
function startQuiz() {
    hideModal();
    quizState.isQuizActive = true;
    quizState.saveToSession();
    showScreen('question-screen');
    showQuestion();
}

// Update score display
function updateScoreDisplay() {
    const scoreElem = elements.currentScoreSpan;
    const newScore = quizState.score;
    if (scoreElem.textContent != newScore) {
        scoreElem.classList.add('animated');
        setTimeout(() => scoreElem.classList.remove('animated'), 400);
    }
    scoreElem.textContent = newScore;
}

// Sanitize team name
function sanitizeTeamName(teamName) {
    return teamName
        .trim()
        .slice(0, 50)
        .replace(/[^a-zA-Z0-9\s-]/g, '');
}

// Add loading spinner styles
const style = document.createElement('style');
style.textContent = `
    .loading-spinner {
        display: inline-block;
        width: 1rem;
        height: 1rem;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: #fff;
        animation: spin 1s linear infinite;
        margin-right: 0.5rem;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Add fullscreen handler
document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement && quizState.isQuizActive) {
        // Optional: Show fullscreen message
        const message = document.createElement('div');
        message.className = 'fullscreen-message';
        message.innerHTML = `
            <div class="message-content">
                <i class="fas fa-expand"></i>
                <p>Fullscreen mode activated</p>
            </div>
        `;
        document.body.appendChild(message);
        setTimeout(() => message.remove(), 2000);
    }
}); 