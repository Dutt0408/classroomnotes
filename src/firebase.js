// src/firebase.js in your SECOND app
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

// Load from environment variables - MUST BE SAME AS FIRST APP!
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL, // This is the critical one!
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Log for debugging
console.log('Registration App Firebase Config:', {
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  apiKeyLoaded: !!process.env.REACT_APP_FIREBASE_API_KEY
});

// Initialize Firebase
let app;
let database;
let auth;

try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  auth = getAuth(app);
  console.log('✅ Registration App Firebase initialized with database:', process.env.REACT_APP_FIREBASE_DATABASE_URL);
} catch (error) {
  console.error('❌ Registration App Firebase initialization error:', error);
  console.error('Please check your .env file and make sure it matches the first app');
  throw error;
}

export { database, auth };
export default app;