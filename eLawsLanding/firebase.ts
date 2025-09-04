import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyD3hWg3MicoJOCFeBtGkaM4qP95HFS48Xw",
    authDomain: "e-lawyer-a3055.firebaseapp.com",
    projectId: "e-lawyer-a3055",
    storageBucket: "e-lawyer-a3055.appspot.com",
    messagingSenderId: "612820512997",
    appId: "1:612820512997:web:ff8652b6568cc8ec34240c",
    measurementId: "G-0EQFR1NTPN",
};

const app = initializeApp(firebaseConfig);

// Web uses default persistence
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
