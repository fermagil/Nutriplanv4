// Firebase configuration
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
if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log('Firebase initialized successfully');
    } else {
        console.log('Firebase already initialized');
    }
} else {
    console.error('Firebase SDK not loaded. Make sure to include firebase-app.js before this script.');
}

// Export instances for use in other scripts if they use ES modules,
// otherwise they are available globally via firebase.auth(), firebase.firestore() etc.
// Since the project seems to use global scripts, we just ensure initialization here.
