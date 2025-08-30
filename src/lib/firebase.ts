import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue } from 'firebase/database';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAWKmpLqiOApfLb9OGa2WEfs_AmPiItA2g",
  authDomain: "ssec-outing.firebaseapp.com",
  databaseURL: "https://ssec-outing-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ssec-outing",
  storageBucket: "ssec-outing.firebasestorage.app",
  messagingSenderId: "286869609907",
  appId: "1:286869609907:web:91bee1c3ddbdffdaa47fc6",
  measurementId: "G-3DPMH890P2"
};



// Initialize Firebase with error handling
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
const db = getDatabase(app);

// Enable disk persistence (enabled by default in web)
onValue(ref(db, '.info/connected'), (snap) => {
  if (snap.val() === true) {
    console.log('Connected to Firebase Realtime Database.');
  } else {
    console.log('Disconnected. Working offline.');
  }
});

// Initialize Analytics with error handling
let analytics = null;
if (typeof window !== 'undefined') {
  const initAnalytics = async () => {
    try {
      const analyticsSupported = await isSupported();
      if (analyticsSupported && firebaseConfig.measurementId !== 'G-XXXXXXXXXX') {
        analytics = getAnalytics(app);
        console.log('Firebase Analytics initialized successfully');
      } else {
        console.log('Firebase Analytics is not supported in this environment or measurement ID is not configured');
      }
    } catch (error) {
      console.warn('Failed to initialize Firebase Analytics:', error);
    }
  };
  initAnalytics();
}

// Initialize Firestore
const firestoreDb = getFirestore(app);

// Enable offline persistence for Firestore
enableIndexedDbPersistence(firestoreDb).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled
    // in one tab at a a time.
    console.log('Persistence failed: Multiple tabs open.');
  } else if (err.code === 'unimplemented') {
    // The current browser does not support all of the
    // features required to enable persistence
    console.log('Persistence is not available in this browser.');
  }
});

// Initialize Auth
const auth = getAuth(app);
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, show main UI
    console.log('User is signed in:', user);
  } else {
    // No user is signed in, show login screen
    console.log('No user is signed in.');
  }
});

export { db, analytics, firestoreDb };
export type { Analytics } from 'firebase/analytics';