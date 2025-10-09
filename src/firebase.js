import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB2UxeR3wB2xehz4SiRHo6HmIdk6gAdK8s",
  authDomain: "bit-odyssey-3c.firebaseapp.com",
  projectId: "bit-odyssey-3c",
  storageBucket: "bit-odyssey-3c.firebasestorage.app",
  messagingSenderId: "1085140773233",
  appId: "1:1085140773233:web:0cae4a459a02730de66ed0",
  measurementId: "G-KCXJB8YWFS"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
