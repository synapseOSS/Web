
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAOqLOApaCEJNLvsutaVn72KSLJavPm9Vs",
  authDomain: "synapselandingweb.firebaseapp.com",
  databaseURL: "https://synapselandingweb-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "synapselandingweb",
  storageBucket: "synapselandingweb.firebasestorage.app",
  messagingSenderId: "98507874958",
  appId: "1:98507874958:web:f9d39331a571175c2fdfdf",
  measurementId: "G-TPDL85YWW6"
};

// Initialize App first
export const app = initializeApp(firebaseConfig);

// Initialize Auth with explicit app instance to ensure registration
export const auth = getAuth(app);

// Initialize Realtime Database
export const db = getDatabase(app);

// Initialize Analytics safely (can fail in some environments/browsers)
export let analytics = null;
isSupported().then(supported => {
  if (supported) {
    analytics = getAnalytics(app);
  }
}).catch(() => {
  console.warn('Firebase Analytics not supported in this environment.');
});
