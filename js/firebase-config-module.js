import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyChC7s5NN-z-dSjqeXDaks7gaNaVCJAu7Q",
    authDomain: "nutriplanv2.firebaseapp.com",
    projectId: "nutriplanv2",
    storageBucket: "nutriplanv2.firebasestorage.app",
    messagingSenderId: "653707489758",
    appId: "1:653707489758:web:9133d1d1620825c385ed4f",
    measurementId: "G-NWER69E8B6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

console.log('Firebase initialized via module config');

export { app, db, auth, provider };
