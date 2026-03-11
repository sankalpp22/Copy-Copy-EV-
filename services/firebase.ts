
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserSessionPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDVD_kposh5H1KGDhKc8HOhzQeOqBz4ns8",
  authDomain: "web-app-ev-info.firebaseapp.com",
  projectId: "web-app-ev-info",
  storageBucket: "web-app-ev-info.firebasestorage.app",
  messagingSenderId: "804120242244",
  appId: "1:804120242244:web:277b5a686b2875637af411",
  measurementId: "G-42P9RTYDCX"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

// Do not save login info persistently across browser restarts
setPersistence(auth, browserSessionPersistence).catch((error) => {
  console.error("Error setting auth persistence:", error);
});

export default app;
