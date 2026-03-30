export interface User {
  uid: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  photoURL?: string;
  displayName?: string;
}

export interface Poll {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'ended' | 'closed';
  createdBy: string;
  isPublished: boolean;
  participantImages?: string[];
}

export interface Participant {
  id: string;
  pollId: string;
  name: string;
  imageUrl: string;
}

export interface Vote {
  id: string;
  userId: string;
  username: string; // Denormalized for display
  pollId: string;
  participantId: string;
  craziness: number;
  madness: number;
  foolishness: number;
  comment?: string; // New comment field
  aboutName?: string; // Who the comment is about
  timestamp: string;
}

export interface PollResult {
  participantId: string;
  name: string;
  imageUrl: string;
  avgCraziness: number;
  avgMadness: number;
  avgFoolishness: number;
  totalScore: number;
  rank: number;
}
