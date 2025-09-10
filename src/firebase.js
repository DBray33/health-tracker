// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyD4fbU7CK_VPVPx_A1CyMUVgSyjcMppel8',
  authDomain: 'health-tracker-app-9f8bc.firebaseapp.com',
  projectId: 'health-tracker-app-9f8bc',
  storageBucket: 'health-tracker-app-9f8bc.firebasestorage.app',
  messagingSenderId: '423594704778',
  appId: '1:423594704778:web:861be405edb9bad9671273',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
