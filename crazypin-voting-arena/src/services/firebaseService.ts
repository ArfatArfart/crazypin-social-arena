import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Poll, Participant, Vote, User } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const firebaseService = {
  // Users
  async getUser(uid: string): Promise<User | null> {
    const path = `users/${uid}`;
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() as User : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  async createUser(user: User): Promise<void> {
    const path = `users/${user.uid}`;
    try {
      await setDoc(doc(db, 'users', user.uid), user);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async updateUser(uid: string, updates: Partial<User>): Promise<void> {
    const path = `users/${uid}`;
    try {
      await updateDoc(doc(db, 'users', uid), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  // Polls
  async createPoll(poll: Omit<Poll, 'id'>): Promise<string> {
    const path = 'arenas';
    try {
      const docRef = await addDoc(collection(db, 'arenas'), poll);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      return '';
    }
  },

  async updatePoll(pollId: string, updates: Partial<Poll>): Promise<void> {
    const path = `arenas/${pollId}`;
    try {
      await updateDoc(doc(db, 'arenas', pollId), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async getPolls(): Promise<Poll[]> {
    const path = 'arenas';
    try {
      const querySnapshot = await getDocs(collection(db, 'arenas'));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Poll));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async deletePoll(pollId: string): Promise<void> {
    const path = `arenas/${pollId}`;
    console.log(`[FirebaseService] NEW DELETE SYSTEM: Starting atomic deletion of arena: ${pollId}`);
    try {
      const batch = writeBatch(db);
      
      // 1. Delete participants subcollection
      const participantsRef = collection(db, `arenas/${pollId}/participants`);
      const participantsSnap = await getDocs(participantsRef);
      participantsSnap.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // 2. Delete related votes (top-level collection)
      const votesRef = collection(db, 'votes');
      const qVotes = query(votesRef, where('pollId', '==', pollId));
      const votesSnap = await getDocs(qVotes);
      votesSnap.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // 3. Delete the poll itself
      batch.delete(doc(db, 'arenas', pollId));

      await batch.commit();
      console.log(`[FirebaseService] NEW DELETE SYSTEM: Successfully deleted arena ${pollId}`);
    } catch (error) {
      console.error(`[FirebaseService] NEW DELETE SYSTEM: Error deleting arena ${pollId}:`, error);
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async getTrendingPolls(): Promise<Poll[]> {
    const path = 'arenas';
    try {
      const polls = await this.getPolls();
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      const trendingPolls = await Promise.all(polls.map(async (poll) => {
        const votes = await this.getAllVotesForPoll(poll.id);
        const totalVotes = votes.length;
        const recentVotes = votes.filter(v => v.timestamp >= twentyFourHoursAgo).length;
        const trendingScore = totalVotes + (recentVotes * 2);
        return { ...poll, trendingScore };
      }));

      return trendingPolls
        .sort((a, b) => (b as any).trendingScore - (a as any).trendingScore)
        .slice(0, 5);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async getTopRatedPolls(): Promise<Poll[]> {
    const path = 'arenas';
    try {
      const polls = await this.getPolls();
      
      const ratedPolls = await Promise.all(polls.map(async (poll) => {
        const votes = await this.getAllVotesForPoll(poll.id);
        if (votes.length < 5) return null; // Minimum votes required

        const participants = await this.getParticipants(poll.id);
        if (participants.length === 0) return null;

        const participantRatings = participants.map(p => {
          const pVotes = votes.filter(v => v.participantId === p.id).length;
          return pVotes / votes.length;
        });

        const maxRating = Math.max(...participantRatings);
        return { ...poll, maxRating };
      }));

      return ratedPolls
        .filter((p): p is Poll & { maxRating: number } => p !== null)
        .sort((a, b) => b.maxRating - a.maxRating)
        .slice(0, 5);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  // Participants
  async addParticipant(pollId: string, participant: Omit<Participant, 'id' | 'pollId'>): Promise<string> {
    const path = `arenas/${pollId}/participants`;
    try {
      const docRef = await addDoc(collection(db, `arenas/${pollId}/participants`), {
        ...participant,
        pollId
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      return '';
    }
  },

  async getParticipants(pollId: string): Promise<Participant[]> {
    const path = `arenas/${pollId}/participants`;
    try {
      const querySnapshot = await getDocs(collection(db, `arenas/${pollId}/participants`));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Participant));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  // Votes
  async castVote(vote: Omit<Vote, 'id' | 'timestamp'>): Promise<void> {
    const voteId = `${vote.userId}_${vote.pollId}_${vote.participantId}`;
    const path = `votes/${voteId}`;
    try {
      await setDoc(doc(db, 'votes', voteId), {
        ...vote,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async getUserVotesForPoll(userId: string, pollId: string): Promise<Vote[]> {
    const path = 'votes';
    try {
      const q = query(
        collection(db, 'votes'), 
        where('userId', '==', userId),
        where('pollId', '==', pollId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vote));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async getAllVotesForPoll(pollId: string): Promise<Vote[]> {
    const path = 'votes';
    try {
      const q = query(collection(db, 'votes'), where('pollId', '==', pollId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vote));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async getAllVotes(): Promise<Vote[]> {
    const path = 'votes';
    try {
      const querySnapshot = await getDocs(collection(db, 'votes'));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vote));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async getCommentsForPoll(pollId: string): Promise<{ username: string, comment: string, aboutName: string }[]> {
    const path = 'votes';
    try {
      const q = query(
        collection(db, 'votes'), 
        where('pollId', '==', pollId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map(doc => doc.data() as Vote)
        .filter(vote => !!vote.comment)
        .map(vote => ({ 
          username: vote.username, 
          comment: vote.comment!, 
          aboutName: vote.aboutName || 'Unknown' 
        }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async getCommentsForParticipant(pollId: string, participantId: string): Promise<{ username: string, comment: string, aboutName: string }[]> {
    const path = 'votes';
    try {
      const q = query(
        collection(db, 'votes'), 
        where('pollId', '==', pollId),
        where('participantId', '==', participantId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map(doc => doc.data() as Vote)
        .filter(vote => !!vote.comment)
        .map(vote => ({ 
          username: vote.username, 
          comment: vote.comment!,
          aboutName: vote.aboutName || 'Unknown'
        }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  }
};
