const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

// Initialize Firebase Admin
admin.initializeApp();

// Get Firestore instance
const db = admin.firestore();

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
    // ... Add all questions here
];

// Submit score endpoint
exports.submitScore = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        // Only allow POST requests
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        try {
            const { teamName, score } = req.body;

            // Validate input
            if (!teamName || typeof score !== 'number') {
                return res.status(400).json({ error: 'Invalid input' });
            }

            // Sanitize team name (remove special characters, limit length)
            const sanitizedTeamName = teamName.trim().slice(0, 50).replace(/[^a-zA-Z0-9\s-]/g, '');

            // Get reference to the team's document
            const teamRef = db.collection('leaderboard').doc(sanitizedTeamName);

            // Get current team data
            const teamDoc = await teamRef.get();

            if (teamDoc.exists) {
                const currentData = teamDoc.data();
                // Only update if new score is higher
                if (score > currentData.score) {
                    await teamRef.update({
                        score: score,
                        lastSubmitted: admin.firestore.FieldValue.serverTimestamp()
                    });
                }
            } else {
                // Create new team entry
                await teamRef.set({
                    teamName: sanitizedTeamName,
                    score: score,
                    lastSubmitted: admin.firestore.FieldValue.serverTimestamp()
                });
            }

            return res.status(200).json({ 
                success: true, 
                message: 'Score submitted successfully' 
            });

        } catch (error) {
            console.error('Error submitting score:', error);
            return res.status(500).json({ 
                error: 'Internal server error' 
            });
        }
    });
});

// Get leaderboard endpoint
exports.getLeaderboard = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        // Only allow GET requests
        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

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
            return res.status(500).json({ 
                error: 'Internal server error' 
            });
        }
    });
});

// Validate answer endpoint
exports.validateAnswer = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        // Only allow POST requests
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

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
}); 