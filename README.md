# IEEE EMBS Quiz Challenge

A team-based quiz website with a real-time leaderboard, built for IEEE EMBS club events.

## Features

- Interactive quiz interface with multiple-choice questions
- Real-time team score submission
- Live leaderboard with automatic updates
- Responsive design for all devices
- Firebase backend for reliable data storage

## Project Structure

```
.
├── index.html              # Landing page
├── quiz.html              # Quiz interface
├── leaderboard.html       # Leaderboard display
├── css/
│   └── style.css         # Shared styles
├── js/
│   ├── quiz.js           # Quiz logic
│   └── leaderboard.js    # Leaderboard logic
├── functions/
│   └── index.js          # Firebase Functions
├── firebase.json         # Firebase configuration
└── .firebaserc          # Firebase project settings
```

## Setup Instructions

### 1. Firebase Setup

1. Create a new Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Enable Firebase Functions
4. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
5. Login to Firebase:
   ```bash
   firebase login
   ```
6. Initialize your project:
   ```bash
   firebase init
   ```
   - Select Functions and Hosting
   - Choose your project
   - Use JavaScript for Functions
   - Say yes to ESLint
   - Install dependencies with npm

### 2. Project Configuration

1. Update `.firebaserc` with your project ID:
   ```json
   {
     "projects": {
       "default": "your-project-id"
     }
   }
   ```

2. Install function dependencies:
   ```bash
   cd functions
   npm install firebase-admin firebase-functions cors
   ```

3. Update the Firebase Function URLs in the frontend code:
   - In `js/quiz.js`, replace `YOUR_FIREBASE_FUNCTION_URL` with your actual function URL
   - In `js/leaderboard.js`, replace `YOUR_FIREBASE_FUNCTION_URL` with your actual function URL

### 3. Deploy

1. Deploy Firebase Functions:
   ```bash
   firebase deploy --only functions
   ```

2. Deploy the website:
   ```bash
   firebase deploy --only hosting
   ```

## Security Rules

For the MVP, the following Firestore rules are used:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /leaderboard/{document=**} {
      allow read: if true;  // Public read access
      allow write: if true; // Public write access (for MVP only)
    }
  }
}
```

Note: For production, you should implement proper authentication and security rules.

## Customization

### Quiz Questions

Edit the `quizQuestions` array in `js/quiz.js` to modify the quiz content:

```javascript
const quizQuestions = [
    {
        question: "Your question here",
        options: ["Option 1", "Option 2", "Option 3", "Option 4"],
        correctAnswer: 0 // Index of correct answer
    },
    // Add more questions...
];
```

### Styling

Modify `css/style.css` to customize the appearance of the website.

## Development

To run the project locally:

1. Start the Firebase emulator:
   ```bash
   firebase emulators:start
   ```

2. Serve the website locally:
   ```bash
   firebase serve
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please contact the IEEE EMBS club administrators. 