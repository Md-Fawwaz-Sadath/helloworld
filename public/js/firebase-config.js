// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-analytics.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCYLVgyRlw-28Xe_0Kbn3ddZu-CwLuKa8c",
    authDomain: "embsquiz.firebaseapp.com",
    projectId: "embsquiz",
    storageBucket: "embsquiz.appspot.com",
    messagingSenderId: "1038118235610",
    appId: "1:1038118235610:web:4a9e569cd92409af7264e3",
    measurementId: "G-XXXXXXXXXX" // Analytics ID if needed
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// Export the Firestore instance
export { db, analytics }; 