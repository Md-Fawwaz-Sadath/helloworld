// Brain regions data with their positions
const brainRegions = [
    {
        id: 'frontal-lobe',
        label: 'Frontal Lobe',
        position: { top: '25%', left: '50%' },
        size: { width: '200px', height: '150px' }
    },
    {
        id: 'parietal-lobe',
        label: 'Parietal Lobe',
        position: { top: '40%', left: '50%' },
        size: { width: '200px', height: '100px' }
    },
    {
        id: 'temporal-lobe',
        label: 'Temporal Lobe',
        position: { top: '50%', left: '25%' },
        size: { width: '150px', height: '150px' }
    },
    {
        id: 'occipital-lobe',
        label: 'Occipital Lobe',
        position: { top: '50%', left: '75%' },
        size: { width: '150px', height: '150px' }
    },
    {
        id: 'cerebellum',
        label: 'Cerebellum',
        position: { top: '75%', left: '50%' },
        size: { width: '150px', height: '100px' }
    }
];

// Game state
let correctMatches = 0;
let draggedLabel = null;
let matchedRegions = new Set();
let gameInitialized = false;
let rewardClaimed = false;

// Initialize the game
function initGame() {
    try {
        if (gameInitialized) return;
        
        // Verify required elements exist
        const brainSection = document.querySelector('.brain-section');
        const labelsContainer = document.getElementById('labels-container');
        const successMessage = document.getElementById('success-message');
        
        if (!brainSection || !labelsContainer || !successMessage) {
            throw new Error('Required DOM elements not found');
        }
        
        createDropZones();
        createDraggableLabels();
        setupEventListeners();
        
        gameInitialized = true;
        console.log('Neuro Match game initialized successfully');
    } catch (error) {
        console.error('Error initializing game:', error);
        showErrorMessage('Failed to initialize game. Please refresh the page.');
    }
}

// Create drop zones on the brain image
function createDropZones() {
    const brainSection = document.querySelector('.brain-section');
    
    brainRegions.forEach(region => {
        const dropZone = document.createElement('div');
        dropZone.className = 'drop-zone';
        dropZone.id = `drop-${region.id}`;
        dropZone.dataset.region = region.id;
        
        // Position the drop zone
        Object.assign(dropZone.style, {
            position: 'absolute',
            top: region.position.top,
            left: region.position.left,
            width: region.size.width,
            height: region.size.height,
            transform: 'translate(-50%, -50%)'
        });
        
        brainSection.appendChild(dropZone);
    });
}

// Create draggable labels
function createDraggableLabels() {
    const labelsContainer = document.getElementById('labels-container');
    labelsContainer.innerHTML = ''; // Clear any existing labels
    
    // Shuffle the regions for random order
    const shuffledRegions = [...brainRegions].sort(() => Math.random() - 0.5);
    
    shuffledRegions.forEach(region => {
        const label = document.createElement('div');
        label.className = 'draggable-label';
        label.id = `label-${region.id}`;
        label.draggable = true;
        label.dataset.region = region.id;
        label.textContent = region.label;
        
        labelsContainer.appendChild(label);
    });
}

// Setup event listeners for drag and drop
function setupEventListeners() {
    const labels = document.querySelectorAll('.draggable-label');
    const dropZones = document.querySelectorAll('.drop-zone');
    const continueButton = document.getElementById('continue-quiz-btn');
    
    if (!continueButton) {
        throw new Error('Continue button not found');
    }
    
    labels.forEach(label => {
        label.addEventListener('dragstart', handleDragStart);
        label.addEventListener('dragend', handleDragEnd);
    });
    
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', handleDragOver);
        zone.addEventListener('dragleave', handleDragLeave);
        zone.addEventListener('drop', handleDrop);
    });
    
    // Continue quiz button
    continueButton.addEventListener('click', () => {
        try {
            window.location.href = 'quiz.html?resumeFrom=7';
        } catch (error) {
            console.error('Error navigating to quiz:', error);
            showErrorMessage('Failed to return to quiz. Please try again.');
        }
    });
}

// Drag and drop event handlers
function handleDragStart(e) {
    if (this.classList.contains('matched')) return;
    
    draggedLabel = this;
    this.classList.add('dragging');
    e.dataTransfer.setData('text/plain', this.dataset.region);
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    draggedLabel = null;
}

function handleDragOver(e) {
    e.preventDefault();
    if (this.classList.contains('matched')) return;
    this.classList.add('highlight');
    e.dataTransfer.dropEffect = 'move';
}

function handleDragLeave(e) {
    this.classList.remove('highlight');
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('highlight');
    
    if (this.classList.contains('matched')) return;
    
    const regionId = e.dataTransfer.getData('text/plain');
    const dropZone = this;
    
    if (regionId === dropZone.dataset.region) {
        // Correct match
        dropZone.classList.add('correct', 'matched');
        draggedLabel.classList.add('matched');
        draggedLabel.style.display = 'none';
        matchedRegions.add(regionId);
        
        // Add success animation
        const successIndicator = document.createElement('div');
        successIndicator.className = 'success-indicator';
        successIndicator.innerHTML = '<i class="fas fa-check"></i>';
        dropZone.appendChild(successIndicator);
        
        // Check if all regions are matched
        if (matchedRegions.size === brainRegions.length) {
            setTimeout(showSuccessMessage, 500);
        }
    } else {
        // Incorrect match
        dropZone.classList.add('incorrect');
        setTimeout(() => {
            dropZone.classList.remove('incorrect');
        }, 1000);
    }
}

// Show success message and handle reward
function showSuccessMessage() {
    if (rewardClaimed) return;
    rewardClaimed = true;

    const successMessage = document.getElementById('success-message');
    const messageContent = successMessage.querySelector('.message-content');
    
    // Update success message with CryptCoins reward
    messageContent.innerHTML = `
        <i class="fas fa-brain"></i>
        <h2>Mission Complete!</h2>
        <p>All brain regions have been correctly identified.</p>
        <div class="reward-message">
            <i class="fas fa-coins"></i>
            <span>+300 CryptCoins</span>
        </div>
        <button id="continue-quiz-btn" class="glow-button">
            <i class="fas fa-arrow-right"></i>
            Continue Mission
        </button>
    `;

    // Show success message
    successMessage.classList.add('active');

    // Update score in session storage
    const currentScore = parseInt(sessionStorage.getItem('quizScore') || '0');
    const newScore = currentScore + 300;
    sessionStorage.setItem('quizScore', newScore.toString());
    sessionStorage.setItem('bonusRoundCompleted', 'true');

    // Add confetti effect
    createConfetti();

    // Reattach event listener to continue button
    const continueButton = document.getElementById('continue-quiz-btn');
    if (continueButton) {
        continueButton.addEventListener('click', () => {
            window.location.href = 'quiz.html?resumeFrom=7';
        });
    }

    // Auto-continue after delay
    setTimeout(() => {
        window.location.href = 'quiz.html?resumeFrom=7';
    }, 3000);
}

// Create confetti effect
function createConfetti() {
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';
    document.body.appendChild(confettiContainer);

    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.animationDelay = Math.random() * 3 + 's';
        confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
        confettiContainer.appendChild(confetti);
    }

    // Remove confetti after animation
    setTimeout(() => {
        confettiContainer.remove();
    }, 3000);
}

// Show error message
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', initGame); 