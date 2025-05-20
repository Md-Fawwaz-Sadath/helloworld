// Import Firebase modules
import { collection, query, orderBy, onSnapshot, limit } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

// DOM Elements
const leaderboardBody = document.getElementById('leaderboardBody');
const leaderboardCards = document.getElementById('leaderboardCards');
const refreshButton = document.getElementById('refreshButton');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');

// State
let unsubscribe = null;

// Format timestamp
function formatTime(timestamp) {
    if (!timestamp) return 'N/A';
    // Firestore Timestamp object
    if (typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleString();
    }
    // JS Date object
    if (timestamp instanceof Date) {
        return timestamp.toLocaleString();
    }
    // ISO string or other string
    if (typeof timestamp === 'string') {
        const date = new Date(timestamp);
        if (!isNaN(date)) return date.toLocaleString();
    }
    return 'N/A';
}

// Create rank icon
function createRankIcon(rank) {
    if (!rank || rank < 1) return '';
    
    const icons = {
        1: 'fa-trophy',
        2: 'fa-medal',
        3: 'fa-award'
    };
    return icons[rank] ? `<i class="fas ${icons[rank]} rank-icon"></i>` : '';
}

// Create table row
function createTableRow(team, rank) {
    const row = document.createElement('tr');
    row.className = `rank-${rank || 'unknown'}`;
    
    const rankCell = document.createElement('td');
    rankCell.className = 'rank-cell';
    rankCell.innerHTML = `
        ${createRankIcon(rank)}
        <span class="rank-number" data-rank="${rank || ''}">${rank || '—'}</span>
    `;
    
    const teamCell = document.createElement('td');
    teamCell.textContent = team.teamName || 'Unknown Team';
    
    const scoreCell = document.createElement('td');
    scoreCell.textContent = team.score || 0;
    
    const timeCell = document.createElement('td');
    timeCell.textContent = formatTime(team.lastSubmitted) || 'N/A';
    
    row.appendChild(rankCell);
    row.appendChild(teamCell);
    row.appendChild(scoreCell);
    row.appendChild(timeCell);
    
    return row;
}

// Create mobile card
function createMobileCard(team, rank) {
    const card = document.createElement('div');
    card.className = `leaderboard-card rank-${rank || 'unknown'}`;
    
    card.innerHTML = `
        <div class="card-rank">
            ${createRankIcon(rank)}
            <span class="rank-number" data-rank="${rank || ''}">${rank || '—'}</span>
        </div>
        <div class="card-content">
            <div class="card-team">${team.teamName || 'Unknown Team'}</div>
            <div class="card-score">
                <span class="score-value">${team.score || 0}</span> CryptCoins
                <div class="card-time">Last updated: ${formatTime(team.lastSubmitted) || 'N/A'}</div>
            </div>
        </div>
    `;
    
    return card;
}

// Update leaderboard display
function updateLeaderboard(teams) {
    // Clear existing content
    leaderboardBody.innerHTML = '';
    leaderboardCards.innerHTML = '';
    
    if (!teams || teams.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="4" class="empty-state">
                <i class="fas fa-info-circle"></i>
                <p>No teams have earned CryptCoins yet.</p>
            </td>
        `;
        leaderboardBody.appendChild(emptyRow);
        
        const emptyCard = document.createElement('div');
        emptyCard.className = 'empty-state-card';
        emptyCard.innerHTML = `
            <i class="fas fa-info-circle"></i>
            <p>No teams have earned CryptCoins yet.</p>
        `;
        leaderboardCards.appendChild(emptyCard);
        return;
    }
    
    // Add teams to both views with proper rank assignment
    teams.forEach((team, index) => {
        const rank = index + 1;
        
        // Validate team data
        if (!team || typeof team !== 'object') {
            console.warn(`⚠️ Invalid team data at index ${index}:`, team);
            return;
        }
        
        // Create and append rows
        const tableRow = createTableRow(team, rank);
        const mobileCard = createMobileCard(team, rank);
        
        leaderboardBody.appendChild(tableRow);
        leaderboardCards.appendChild(mobileCard);
    });
    
    console.log('✅ Leaderboard updated:', {
        totalTeams: teams.length,
        tableRows: leaderboardBody.children.length,
        mobileCards: leaderboardCards.children.length
    });
}

// Load leaderboard data
async function loadLeaderboard() {
    try {
        loadingState.style.display = 'flex';
        errorState.style.display = 'none';
        
        console.log('🔍 Fetching leaderboard data...');
        
        // Create query
        const leaderboardRef = collection(db, 'leaderboard');
        const q = query(
            leaderboardRef,
            orderBy('score', 'desc'),
            orderBy('lastSubmitted', 'asc'),
            limit(50)
        );
        
        // Set up real-time listener
        unsubscribe = onSnapshot(q, (snapshot) => {
            console.log('📥 Received snapshot update:', {
                empty: snapshot.empty,
                size: snapshot.size,
                docs: snapshot.docs.length
            });
            
            try {
                if (snapshot.empty) {
                    console.log('ℹ️ No leaderboard data available');
                    updateLeaderboard([]);
                    loadingState.style.display = 'none';
                    return;
                }
                
                // Process documents
                const teams = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        teamName: doc.id,
                        score: typeof data.score === 'number' ? data.score : 0,
                        lastSubmitted: data.lastSubmitted || null
                    };
                });
                
                console.log('✅ Processed teams:', teams.map((team, index) => ({
                    rank: index + 1,
                    teamName: team.teamName,
                    score: team.score,
                    lastSubmitted: formatTime(team.lastSubmitted)
                })));
                
                updateLeaderboard(teams);
                loadingState.style.display = 'none';
            } catch (error) {
                console.error('❌ Error processing leaderboard data:', error);
                errorState.style.display = 'flex';
                errorState.querySelector('p').textContent = 'Error processing leaderboard data. Please try again.';
            }
        }, (error) => {
            console.error('❌ Error in leaderboard listener:', error);
            loadingState.style.display = 'none';
            errorState.style.display = 'flex';
        });
        
    } catch (error) {
        console.error('❌ Error setting up leaderboard:', error);
        loadingState.style.display = 'none';
        errorState.style.display = 'flex';
    }
}

// Event Listeners
refreshButton.addEventListener('click', () => {
    refreshButton.classList.add('refreshing');
    refreshButton.querySelector('i').style.transform = 'rotate(360deg)';
    
    // Reload leaderboard
    if (unsubscribe) {
        unsubscribe();
    }
    loadLeaderboard();
    
    // Reset button state
    setTimeout(() => {
        refreshButton.classList.remove('refreshing');
        refreshButton.querySelector('i').style.transform = '';
    }, 1000);
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadLeaderboard();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (unsubscribe) {
        unsubscribe();
    }
}); 