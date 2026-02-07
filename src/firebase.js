// src/firebase.js

// Import Firebase v9+ modules
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDEFAULT_KEY_CHANGE_THIS",
  authDomain: "ravisabha-registration.firebaseapp.com",
  databaseURL: "https://ravisabha-registration-default-rtdb.firebaseio.com",
  projectId: "ravisabha-registration",
  storageBucket: "ravisabha-registration.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890",
  measurementId: "G-ABCDEF1234"
};

// Initialize Firebase
let app;
let database;
let auth;

try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  auth = getAuth(app);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  // Create mock database for development
  database = createMockDatabase();
}

// Mock database for development if Firebase fails
function createMockDatabase() {
  console.warn('⚠️ Using mock database - no real Firebase connection');
  
  return {
    ref: (path) => ({
      key: path.split('/').pop(),
      path: path,
      toString: () => path
    }),
    get: async (ref) => ({
      exists: () => false,
      val: () => null
    }),
    set: async (ref, data) => {
      console.log('Mock set:', ref.path, data);
      return Promise.resolve();
    },
    update: async (ref, data) => {
      console.log('Mock update:', ref.path, data);
      return Promise.resolve();
    },
    remove: async (ref) => {
      console.log('Mock remove:', ref.path);
      return Promise.resolve();
    },
    push: (ref) => ({
      key: `mock_${Date.now()}`,
      ref: ref
    }),
    onValue: (ref, callback) => {
      console.log('Mock onValue listener added:', ref.path);
      return () => console.log('Mock listener removed');
    }
  };
}

export { database, auth };
export default app;