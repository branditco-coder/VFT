
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDjBxZ0nhTwQuMDXxfu2pnrwSzgajN_mAg",
    authDomain: "vhembe-financial-terminal.firebaseapp.com",
    projectId: "vhembe-financial-terminal",
    storageBucket: "vhembe-financial-terminal.firebasestorage.app",
    messagingSenderId: "908774950475",
    appId: "1:908774950475:web:54c857c1ea74924b10afce"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export authentication and database services for use in components
export const auth = getAuth(app);
export const db = getFirestore(app);
