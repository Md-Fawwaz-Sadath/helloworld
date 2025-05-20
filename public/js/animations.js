// Import canvas-confetti
import confetti from 'https://cdn.skypack.dev/canvas-confetti';

// Confetti animation with error handling
export function triggerConfetti() {
    try {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            
            try {
                // Since particles fall down, start a bit higher than random
                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
                });
                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
                });
            } catch (error) {
                console.warn('Confetti animation error:', error);
                clearInterval(interval);
            }
        }, 250);
    } catch (error) {
        console.error('Failed to trigger confetti:', error);
    }
}

// Show congratulations popup with error handling
export function showCongratulationsPopup(score) {
    try {
        const popup = document.createElement('div');
        popup.className = 'congratulations-popup';
        popup.innerHTML = `
            <div class="popup-content">
                <div class="trophy-container">
                    <i class="fas fa-trophy trophy-icon"></i>
                </div>
                <h2>✨ Congratulations! ✨</h2>
                <p>You earned ${score} CryptCoins! 🪙</p>
                <div class="medals">
                    <i class="fas fa-medal gold"></i>
                    <i class="fas fa-medal silver"></i>
                    <i class="fas fa-medal bronze"></i>
                </div>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        // Trigger entrance animation
        requestAnimationFrame(() => {
            popup.classList.add('active');
        });
        
        // Remove popup after animation
        setTimeout(() => {
            popup.classList.remove('active');
            setTimeout(() => {
                if (popup.parentNode) {
                    popup.remove();
                }
            }, 500);
        }, 5000);
    } catch (error) {
        console.error('Error showing congratulations popup:', error);
    }
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    .congratulations-popup {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.8);
        background: rgba(30, 41, 59, 0.95);
        backdrop-filter: blur(10px);
        padding: 2rem;
        border-radius: 1rem;
        text-align: center;
        z-index: 1000;
        opacity: 0;
        transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .congratulations-popup.active {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
    }

    .trophy-container {
        margin-bottom: 1rem;
    }

    .trophy-icon {
        font-size: 4rem;
        color: #fbbf24;
        animation: trophyFloat 2s ease-in-out infinite;
    }

    .medals {
        display: flex;
        justify-content: center;
        gap: 1rem;
        margin-top: 1rem;
    }

    .medals i {
        font-size: 2rem;
        animation: medalSpin 1s ease-in-out infinite;
    }

    .medals i.gold { color: #fbbf24; }
    .medals i.silver { color: #cbd5e1; }
    .medals i.bronze { color: #b45309; }

    @keyframes trophyFloat {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-10px) rotate(5deg); }
    }

    @keyframes medalSpin {
        0%, 100% { transform: rotate(0deg); }
        50% { transform: rotate(15deg); }
    }
`;
document.head.appendChild(style); 