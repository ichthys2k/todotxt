import { initializeApp } from "firebase/app";
import { getAuth, OAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize Microsoft OAuth Provider
const msProvider = new OAuthProvider('microsoft.com');

// Request permissions for OneDrive AppFolder and offline_access for token refresh
msProvider.addScope('Files.ReadWrite.AppFolder');
msProvider.addScope('offline_access');

// Force account selection and allow personal accounts
msProvider.setCustomParameters({
  prompt: 'select_account',
  tenant: 'common'
});

export { app, auth, msProvider };
