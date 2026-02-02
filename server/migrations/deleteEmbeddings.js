// deleteCollection.js
import firebase from '../config/firebase.js'; // Adjust the path if necessary
import {
    getFirestore,
    collection,
    query,
    limit,
    getDocs,
    writeBatch
} from "firebase/firestore";

// Initialize Firestore using your server-side config
const db = getFirestore(firebase);

/**
 * Deletes all documents in a given Firestore collection in batches.
 *
 * @param {string} collectionName - The name of the collection to delete.
 * @param {number} batchSize - The maximum number of documents to delete per batch.
 */
async function deleteCollection(collectionName, batchSize = 500) {
    const collRef = collection(db, collectionName);
    let q = query(collRef, limit(batchSize));
    let snapshot = await getDocs(q);

    while (!snapshot.empty) {
        const batch = writeBatch(db);

        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        console.log(`Deleted batch of ${snapshot.size} documents.`);

        // Re-run the query for the next batch
        snapshot = await getDocs(query(collRef, limit(batchSize)));
    }

    console.log("Finished deleting collection.");
}

// Replace 'your-collection-name' with the actual collection name you want to delete.
deleteCollection("comment_embeddings", 10)
    .catch((error) => console.error("Error deleting collection:", error));
