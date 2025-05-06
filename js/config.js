import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyDsHiCvpCg7KyvgtsYlnjUxM-CPokaay9s",
  authDomain: "eventticketreservation-eda8e.firebaseapp.com",
  projectId: "eventticketreservation-eda8e",
  storageBucket: "eventticketreservation-eda8e.firebasestorage.app",
  messagingSenderId: "701269523112",
  appId: "1:701269523112:web:143abe903cba904923a09d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
