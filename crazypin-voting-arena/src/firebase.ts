import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore,
  doc,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore
// We use the database ID from the config if provided
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Connection test function
export async function testFirestoreConnection() {
  try {
    // Create a promise that rejects after 10 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection test timed out')), 10000);
    });

    // Try to fetch a non-existent doc from server to test connection
    const fetchPromise = getDocFromServer(doc(db, '_connection_test_', 'test'));
    
    await Promise.race([fetchPromise, timeoutPromise]);
    
    console.log("Firestore connection successful");
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Firestore connection failed: The client is offline. This often means the database is not provisioned or the config is incorrect.");
    } else {
      console.error("Firestore connection test error:", error);
    }
    return false;
  }
}
