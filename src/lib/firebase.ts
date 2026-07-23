import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase web config. The apiKey is a public client identifier (safe to expose);
// real security is enforced via Firestore/Storage rules in the Firebase console.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: "jacque-pegue-monte.firebaseapp.com",
  projectId: "jacque-pegue-monte",
  storageBucket: "jacque-pegue-monte.firebasestorage.app",
  messagingSenderId: "22281992685",
  appId: "1:22281992685:web:b48d8d4b00abe48e930fe4",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);