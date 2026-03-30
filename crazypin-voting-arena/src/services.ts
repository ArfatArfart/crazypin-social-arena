import { auth, db } from './firebase';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  setDoc, 
  updateDoc, 
  increment,
  where,
  getDocs,
  runTransaction
} from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const postService = {
  async createPost(data: { title: string; description?: string; imageUrl?: string; category: string; crazyLevel?: number }) {
    if (!auth.currentUser) throw new Error("Must be logged in");
    const path = 'posts';
    try {
      // Ensure all required fields are present and valid
      const postData = {
        title: data.title,
        description: data.description || "",
        imageUrl: data.imageUrl || "",
        category: data.category,
        crazyLevel: typeof data.crazyLevel === 'number' ? data.crazyLevel : 5,
        userId: auth.currentUser.uid,
        username: auth.currentUser.displayName || 'Anonymous',
        votes: 0,
        createdAt: serverTimestamp(),
      };

      const postRef = await addDoc(collection(db, path), postData);

      // Increment totalPosts for the user
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        totalPosts: increment(1)
      });

      return postRef;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async vote(postId: string, authorId: string, value: 1 | -1) {
    if (!auth.currentUser) throw new Error("Must be logged in");
    const userId = auth.currentUser.uid;
    const voteId = `${userId}_${postId}`;
    const votePath = `votes/${voteId}`;

    try {
      await runTransaction(db, async (transaction) => {
        const voteRef = doc(db, 'votes', voteId);
        const postRef = doc(db, 'posts', postId);
        const authorRef = doc(db, 'users', authorId);

        // 1. Create/Update the vote record
        transaction.set(voteRef, {
          userId,
          postId,
          value
        });

        // 2. Update post vote count
        transaction.update(postRef, {
          votes: increment(value)
        });

        // 3. Update author's total votes received
        transaction.update(authorRef, {
          totalVotesReceived: increment(value)
        });
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, votePath);
    }
  }
};
