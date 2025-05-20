const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Firebase Admin
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
    serviceAccount = require('./serviceAccountKey.json');
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Quiz questions with answers (stored securely on backend)
const quizQuestions = [
    // Easy Questions
    {
        id: 1,
        question: "What is the primary function of a microcontroller in biomedical devices?",
        answer: "SIGNAL PROCESSING AND CONTROL",
        difficulty: "Easy",
        points: 100
    },
    {
        id: 2,
        question: "Which of the following is NOT a common biomedical sensor?",
        answer: "GPS MODULE",
        difficulty: "Easy",
        points: 100
    },
    {
        id: 3,
        question: "What is the typical frequency range of human EEG signals?",
        answer: "0.5-100 HZ",
        difficulty: "Easy",
        points: 100
    },
    {
        id: 4,
        question: "Which component is essential for wireless medical device communication?",
        answer: "TRANSCEIVER",
        difficulty: "Easy",
        points: 100
    },
    {
        id: 5,
        question: "What is the main purpose of signal conditioning in biomedical devices?",
        answer: "AMPLIFY AND FILTER SIGNALS",
        difficulty: "Easy",
        points: 100
    },
    {
        id: 6,
        question: "Which power source is most commonly used in portable medical devices?",
        answer: "LITHIUM-ION BATTERIES",
        difficulty: "Easy",
        points: 100
    },
    {
        id: 7,
        question: "What is the primary purpose of medical device safety standards?",
        answer: "ENSURE PATIENT AND OPERATOR SAFETY",
        difficulty: "Easy",
        points: 100
    },
    // Medium Questions
    {
        id: 8,
        question: "Which sensor technology is best suited for continuous glucose monitoring?",
        answer: "ELECTROCHEMICAL SENSORS",
        difficulty: "Medium",
        points: 250
    },
    {
        id: 9,
        question: "Which wireless protocol is most commonly used for medical device data transmission?",
        answer: "BLUETOOTH LOW ENERGY",
        difficulty: "Medium",
        points: 250
    },
    {
        id: 10,
        question: "What is the primary security concern in wireless medical devices?",
        answer: "DATA ENCRYPTION",
        difficulty: "Medium",
        points: 250
    },
    {
        id: 11,
        question: "Which signal processing technique is used to remove noise from ECG signals?",
        answer: "ALL OF THE ABOVE",
        difficulty: "Medium",
        points: 250
    },
    {
        id: 12,
        question: "What is the main challenge in power management for implantable devices?",
        answer: "ALL OF THE ABOVE",
        difficulty: "Medium",
        points: 250
    },
    {
        id: 13,
        question: "Why is calibration important in medical devices?",
        answer: "TO ENSURE ACCURACY",
        difficulty: "Medium",
        points: 250
    },
    {
        id: 14,
        question: "Which material property is most important for implantable devices?",
        answer: "BIOCOMPATIBILITY",
        difficulty: "Medium",
        points: 250
    },
    {
        id: 15,
        question: "What is the purpose of accelerated life testing in medical devices?",
        answer: "PREDICT DEVICE LIFETIME",
        difficulty: "Medium",
        points: 250
    },
    // Hard Questions
    {
        id: 16,
        question: "Which algorithm is most effective for real-time artifact removal in EEG signals?",
        answer: "INDEPENDENT COMPONENT ANALYSIS",
        difficulty: "Hard",
        points: 500
    },
    {
        id: 17,
        question: "What is the main challenge in integrating multiple medical sensors?",
        answer: "SIGNAL SYNCHRONIZATION",
        difficulty: "Hard",
        points: 500
    },
    {
        id: 18,
        question: "Which technology shows the most promise for self-powered medical devices?",
        answer: "PIEZOELECTRIC ENERGY HARVESTING",
        difficulty: "Hard",
        points: 500
    },
    {
        id: 19,
        question: "What is the most secure method for medical device data transmission?",
        answer: "END-TO-END ENCRYPTION",
        difficulty: "Hard",
        points: 500
    },
    {
        id: 20,
        question: "Which factor is most critical in designing implantable medical devices?",
        answer: "BIOCOMPATIBILITY",
        difficulty: "Hard",
        points: 500
    }
];

// Validate answer endpoint
app.post('/validate-answer', async (req, res) => {
    try {
        const { teamName, questionId, answer } = req.body;

        // Validate input
        if (!teamName || !questionId || !answer) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Get team document
        const teamRef = db.collection('leaderboard').doc(teamName);
        const teamDoc = await teamRef.get();

        if (!teamDoc.exists) {
            return res.status(404).json({ error: 'Team not found' });
        }

        const teamData = teamDoc.data();

        // Check if team has an active quiz
        if (!teamData.isQuizActive) {
            return res.status(400).json({ error: 'No active quiz session' });
        }

        // Check if question was already answered
        const answeredQuestions = teamData.answeredQuestions || [];
        if (answeredQuestions.includes(questionId)) {
            return res.status(400).json({ error: 'Question already answered' });
        }

        // Find the question
        const question = quizQuestions.find(q => q.id === questionId);
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }

        // Validate answer
        const isCorrect = answer.trim().toUpperCase() === question.answer;
        
        if (isCorrect) {
            // Update team document with new score and answered question
            await teamRef.update({
                score: admin.firestore.FieldValue.increment(question.points),
                answeredQuestions: admin.firestore.FieldValue.arrayUnion(questionId),
                lastSubmitted: admin.firestore.FieldValue.serverTimestamp()
            });

            return res.status(200).json({
                success: true,
                isCorrect: true,
                points: question.points
            });
        } else {
            return res.status(200).json({
                success: true,
                isCorrect: false,
                points: 0
            });
        }

    } catch (error) {
        console.error('Error validating answer:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Get leaderboard endpoint
app.get('/leaderboard', async (req, res) => {
    try {
        // Query leaderboard collection
        const snapshot = await db.collection('leaderboard')
            .orderBy('score', 'desc')
            .orderBy('lastSubmitted', 'asc') // Secondary sort for tie-breaking
            .limit(100) // Limit to top 100 teams
            .get();

        // Format the data
        const leaderboardData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                teamName: data.teamName,
                score: data.score
            };
        });

        return res.status(200).json(leaderboardData);

    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Initialize team endpoint
app.post('/initialize-team', async (req, res) => {
    try {
        const { teamName } = req.body;

        // Validate team name
        if (!teamName || typeof teamName !== 'string') {
            return res.status(400).json({ error: 'Invalid team name' });
        }

        // Sanitize team name
        const sanitizedTeamName = teamName.trim().slice(0, 50).replace(/[^a-zA-Z0-9\s-]/g, '');

        if (sanitizedTeamName.length < 3) {
            return res.status(400).json({ error: 'Team name must be at least 3 characters long' });
        }

        // Check if team exists
        const teamRef = db.collection('leaderboard').doc(sanitizedTeamName);
        const teamDoc = await teamRef.get();

        if (teamDoc.exists) {
            const teamData = teamDoc.data();
            if (teamData.isQuizActive && teamData.lastSubmitted) {
                const lastSubmitted = teamData.lastSubmitted.toDate();
                const now = new Date();
                if (now - lastSubmitted < 24 * 60 * 60 * 1000) {
                    return res.status(400).json({ 
                        error: 'This team name is already in use. Please try again later or use a different name.' 
                    });
                }
            }
        }

        // Create or update team document
        await teamRef.set({
            teamName: sanitizedTeamName,
            score: 0,
            lastSubmitted: admin.firestore.FieldValue.serverTimestamp(),
            quizStarted: admin.firestore.FieldValue.serverTimestamp(),
            currentQuestion: 0,
            isQuizActive: true,
            answeredQuestions: [],
            attempts: 1
        }, { merge: true });

        return res.status(200).json({
            success: true,
            teamName: sanitizedTeamName
        });

    } catch (error) {
        console.error('Error initializing team:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Complete quiz endpoint
app.post('/complete-quiz', async (req, res) => {
    try {
        const { teamName } = req.body;

        if (!teamName) {
            return res.status(400).json({ error: 'Missing team name' });
        }

        const teamRef = db.collection('leaderboard').doc(teamName);
        const teamDoc = await teamRef.get();

        if (!teamDoc.exists) {
            return res.status(404).json({ error: 'Team not found' });
        }

        await teamRef.update({
            isQuizActive: false,
            lastSubmitted: admin.firestore.FieldValue.serverTimestamp()
        });

        return res.status(200).json({
            success: true,
            message: 'Quiz completed successfully'
        });

    } catch (error) {
        console.error('Error completing quiz:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 