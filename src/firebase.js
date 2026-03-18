import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, setPersistence, browserSessionPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC8GHBrSZfPHuvwnuNxqQfC9fpqTIwFk9U",
  authDomain: "jess-gym.firebaseapp.com",
  projectId: "jess-gym",
  storageBucket: "jess-gym.firebasestorage.app",
  messagingSenderId: "1015345240086",
  appId: "1:1015345240086:web:d7ac56478ec03542667d37"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Esto es vital para que no se quede gris esperando el login
setPersistence(auth, browserSessionPersistence);