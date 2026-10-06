import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyAl1pQAEED99_h8fAzvAtPZz-IRB0ka-Mc",
    authDomain: "cnc-monitoring-system-007.firebaseapp.com",
    databaseURL:
        "https://cnc-monitoring-system-007-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "cnc-monitoring-system-007",
    storageBucket:
        "cnc-monitoring-system-007.firebasestorage.app",
    messagingSenderId: "41143546775",
    appId: "1:41143546775:web:26b6ba11cfbb577769cad2"
};

const app = initializeApp(firebaseConfig);

export const database = getDatabase(app);