// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBvCeJi8qDUf9afoi1U8rGUkbGQTAGfRq8",
  authDomain: "jalsaathi-230d7.firebaseapp.com",
  projectId: "jalsaathi-230d7",
  storageBucket: "jalsaathi-230d7.appspot.com",
  messagingSenderId: "169542133744",
  appId: "1:169542133744:web:180508d9f030346fe79f35",
  measurementId: "G-KK1M1D875S"
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const firestore = getFirestore(app);

export { app, auth, firestore };
