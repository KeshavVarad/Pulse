import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore"; // Import Firestore

import serviceAccountKey from "./serviceAccountKey.json" with { type: "json" };

// Initialize Firebase Admin SDK
const app = initializeApp({
    credential: cert(serviceAccountKey),
});

// Initialize Firestore
const firestore = getFirestore(app);

// Initialize Firebase Authentication
const auth = getAuth(app);



// Export Auth and Firestore instances for use in other files
export { auth, firestore };
