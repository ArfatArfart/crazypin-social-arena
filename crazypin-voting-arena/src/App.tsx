import React, { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  where,
  doc
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, LogOut, Shield, Zap, TrendingUp, Star, Trophy, ChevronRight, ArrowLeft, Lock, Settings, Trash2, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { auth, db, testFirestoreConnection } from './firebase';
import { firebaseService } from './services/firebaseService';
import { User, Poll, Participant, Vote, PollResult } from './types';
import BottomNav from './components/BottomNav';
import PollCard from './components/PollCard';
import ParticipantCard from './components/ParticipantCard';
import RatingModal from './components/RatingModal';
import AdminPanel from './components/AdminPanel';
import ResultsView from './components/ResultsView';
import HallOfFame from './components/HallOfFame';
import BrandingFooter from './components/BrandingFooter';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'results' | 'profile' | 'admin' | 'polls'>('home');
  const [arenas, setArenas] = useState<Poll[]>([]);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [userVotes, setUserVotes] = useState<Vote[]>([]);
  const [allUserVotes, setAllUserVotes] = useState<Vote[]>([]);
  const [pollResults, setPollResults] = useState<PollResult[]>([]);
  const [connectionError, setConnectionError] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [trendingPolls, setTrendingPolls] = useState<Poll[]>([]);
  const [topRatedPolls, setTopRatedPolls] = useState<Poll[]>([]);
  const [showTrendingModal, setShowTrendingModal] = useState(false);
  const [showTopRatedModal, setShowTopRatedModal] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const isAdmin = user?.role === 'admin';

  const activeArenas = arenas.filter(p => p.status === 'active');
  const endedArenas = arenas.filter(p => p.status === 'ended' || p.status === 'closed');

  // Connection Test
  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await testFirestoreConnection();
      if (!isConnected) {
        setConnectionError(true);
      }
    };
    checkConnection();
  }, []);

  // Auth Listener
  useEffect(() => {
    // Safety timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          let userData = await firebaseService.getUser(firebaseUser.uid);
          if (!userData) {
            userData = {
              uid: firebaseUser.uid,
              username: `User_${Math.floor(Math.random() * 10000)}`,
              email: firebaseUser.email || '',
              role: firebaseUser.email === 'f18nati9622@gmail.com' ? 'admin' : 'user',
              photoURL: firebaseUser.photoURL || undefined,
              displayName: firebaseUser.displayName || undefined,
            };
            await firebaseService.createUser(userData);
            setShowUsernameModal(true);
          } else if (userData.username.startsWith('User_')) {
            setShowUsernameModal(true);
          }
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    });
    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  // Votes Listener
  useEffect(() => {
    if (!user) {
      setAllUserVotes([]);
      return;
    }
    const qVotes = query(collection(db, 'votes'), where('userId', '==', user.uid));
    const unsubscribeVotes = onSnapshot(qVotes, (snapshot) => {
      setAllUserVotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vote)));
    }, (error) => {
      console.error("Votes listener error:", error);
    });
    return () => unsubscribeVotes();
  }, [user]);

  // Polls Listener
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'arenas'), orderBy('startDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pollsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Poll));
      setArenas(pollsData);
    }, (error) => {
      console.error("Arenas listener error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  // Selected Poll Participants & Votes
  useEffect(() => {
    if (!selectedPoll || !user) return;
    
    // Get participants
    const unsubscribeParticipants = onSnapshot(
      collection(db, `arenas/${selectedPoll.id}/participants`),
      (snapshot) => {
        setParticipants(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Participant)));
      },
      (error) => {
        console.error("Participants listener error:", error);
      }
    );

    // Get user votes for this poll
    const qUserVotes = query(
      collection(db, 'votes'), 
      where('userId', '==', user.uid),
      where('pollId', '==', selectedPoll.id)
    );
    const unsubscribeVotes = onSnapshot(
      qUserVotes,
      (snapshot) => {
        setUserVotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vote)));
      },
      (error) => {
        console.error("Votes listener error:", error);
      }
    );

    // Calculate results if poll is ended or published
    if (new Date(selectedPoll.endDate) < new Date() || selectedPoll.isPublished) {
      calculateResults(selectedPoll.id);
    }

    return () => {
      unsubscribeParticipants();
      unsubscribeVotes();
    };
  }, [selectedPoll, user]);

  const calculateResults = async (pollId: string) => {
    const votes = await firebaseService.getAllVotesForPoll(pollId);
    const parts = await firebaseService.getParticipants(pollId);
    
    const results: PollResult[] = parts.map(p => {
      const pVotes = votes.filter(v => v.participantId === p.id);
      const count = pVotes.length;
      
      const avgCraziness = count > 0 ? pVotes.reduce((acc, v) => acc + v.craziness, 0) / count : 0;
      const avgMadness = count > 0 ? pVotes.reduce((acc, v) => acc + v.madness, 0) / count : 0;
      const avgFoolishness = count > 0 ? pVotes.reduce((acc, v) => acc + v.foolishness, 0) / count : 0;
      
      // Final score is the average of all ratings
      const totalScore = (avgCraziness + avgMadness + avgFoolishness) / 3;
      
      return {
        participantId: p.id,
        name: p.name,
        imageUrl: p.imageUrl,
        avgCraziness,
        avgMadness,
        avgFoolishness,
        totalScore,
        rank: 0
      };
    });

    // Sort by totalScore descending
    const sortedResults = results.sort((a, b) => b.totalScore - a.totalScore);
    
    // Assign ranks
    const rankedResults = sortedResults.map((r, i) => ({ ...r, rank: i + 1 }));
    
    setPollResults(rankedResults);
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Login error:", error);
      alert(`Login failed: ${error.message || 'Unknown error'}. Please ensure popups are allowed.`);
    }
  };

  const handleFetchTrending = async () => {
    setIsLoadingStats(true);
    setShowTrendingModal(true);
    try {
      const trending = await firebaseService.getTrendingPolls();
      setTrendingPolls(trending);
    } catch (error) {
      console.error("Error fetching trending:", error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleFetchTopRated = async () => {
    setIsLoadingStats(true);
    setShowTopRatedModal(true);
    try {
      const topRated = await firebaseService.getTopRatedPolls();
      setTopRatedPolls(topRated);
    } catch (error) {
      console.error("Error fetching top rated:", error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setActiveTab('home');
    setSelectedPoll(null);
  };

  const handleVote = async (ratings: { craziness: number; madness: number; foolishness: number; comment?: string; aboutName?: string }) => {
    if (!user || !selectedPoll || !selectedParticipant) return;
    
    await firebaseService.castVote({
      userId: user.uid,
      username: user.username,
      pollId: selectedPoll.id,
      participantId: selectedParticipant.id,
      ...ratings
    });
    
    setSelectedParticipant(null);
  };

  const handleUpdateUsername = async () => {
    if (!user || !newUsername.trim() || newUsername.length < 3) return;
    setIsUpdatingUsername(true);
    try {
      await firebaseService.updateUser(user.uid, { username: newUsername });
      setUser({ ...user, username: newUsername });
      setShowUsernameModal(false);
    } catch (error) {
      console.error("Error updating username:", error);
      alert("Failed to update username. It must be between 3 and 30 characters.");
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  const handleDelete = async (arenaId: string) => {
    console.log("DELETE STARTED", arenaId);
    try {
      if (!arenaId) {
        console.warn("[App] NEW DELETE SYSTEM: No arenaId provided");
        return;
      }

      // 1. Admin Check
      if (user?.role !== 'admin') {
        console.error("[App] NEW DELETE SYSTEM: Unauthorized delete attempt by user:", user?.uid);
        alert("Only administrators can delete arenas.");
        return;
      }

      console.log("[App] NEW DELETE SYSTEM: Proceeding with deletion for arena:", arenaId);

      // 2. Delete from Firestore (Atomic delete)
      await firebaseService.deletePoll(arenaId);
      
      // 3. Remove from UI instantly
      setArenas(prev => prev.filter(a => a.id !== arenaId));
      
      // 4. Reset selection if needed
      if (selectedPoll?.id === arenaId) {
        setSelectedPoll(null);
      }
      
      console.log("DELETE SUCCESS");
      alert("Arena deleted successfully.");
    } catch (error) {
      console.error("DELETE FAILED", error);
      alert("Failed to delete arena. Check console for details.");
    }
  };

  if (connectionError) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-8 bg-[#050505] text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mb-6">
          <Zap size={32} />
        </div>
        <h2 className="text-2xl font-bold font-display mb-4">Connection Failed</h2>
        <p className="text-zinc-400 mb-8 max-w-xs">
          We couldn't reach the CrazyPin Arena. This might be due to a configuration issue or network restrictions.
        </p>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button
            onClick={() => window.location.reload()}
            className="bg-white text-black px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-sm"
          >
            Retry Connection
          </button>
          <button
            onClick={() => setConnectionError(false)}
            className="text-zinc-500 hover:text-white px-8 py-2 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors"
          >
            Skip & Try Anyway
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#050505]">
        <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 bg-[#0a0a0a] relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        
        <motion.div
          initial={{ scale: 0.8, opacity: 0, rotate: -12 }}
          animate={{ scale: 1, opacity: 1, rotate: 12 }}
          className="w-24 h-24 rounded-[32px] bg-white flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(255,255,255,0.2)]"
        >
          <Zap size={48} className="text-black" fill="currentColor" />
        </motion.div>

        <h1 className="text-5xl font-black font-display text-center mb-4 tracking-tighter leading-[0.9] uppercase">
          CrazyPin<br />
          <span className="gradient-text">Arena</span>
        </h1>
        
        <p className="text-zinc-400 text-center mb-8 max-w-xs font-medium leading-relaxed">
          The ultimate social voting platform for Pgllazi, Zookige, and Cxotalge.
        </p>

        <motion.button
          whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(255,255,255,0.2)' }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLogin}
          className="w-full max-w-xs bg-white text-black h-14 rounded-2xl font-black text-lg uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl"
        >
          <LogIn size={20} strokeWidth={3} />
          Join Arena
        </motion.button>

        <div className="mt-auto pt-12">
          <BrandingFooter />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#0a0a0a] text-zinc-100 overflow-y-auto overflow-x-hidden">
      <AnimatePresence mode="wait">
        {activeTab === 'home' && !selectedPoll && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            <header className="w-full py-3 px-6 sticky top-0 z-[100] bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
              <div className="flex justify-between items-center max-w-md mx-auto w-full">
                <div className="flex flex-col">
                  <h1 className="text-lg font-black font-display tracking-tighter uppercase flex items-center leading-none">
                    <span className="text-white">Crazy</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 ml-0.5">Pin</span>
                  </h1>
                  <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-zinc-500 mt-1">Social Arena</span>
                </div>
                
                <div className="flex items-center gap-4">
                  {user.role === 'admin' && (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setActiveTab('admin')}
                      className="text-zinc-500 hover:text-zinc-300 transition-all duration-300"
                    >
                      <Shield size={18} strokeWidth={2} />
                    </motion.button>
                  )}
                  <motion.div 
                    whileTap={{ scale: 0.9 }}
                    className="w-8 h-8 rounded-full overflow-hidden border border-white/10 cursor-pointer bg-zinc-900"
                    onClick={() => setActiveTab('profile')}
                  >
                    <img 
                      src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                      alt="Avatar" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  </motion.div>
                </div>
              </div>
            </header>

            <div className="w-full px-6 space-y-10 mt-8 pb-32">
              {/* Active Arenas */}
              <div className="w-full space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-600">Active Arenas</h2>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-emerald-500" />
                    <span className="text-[7px] font-bold text-emerald-500/60 uppercase tracking-widest">Live</span>
                  </div>
                </div>
              
                {activeArenas.length > 0 ? (
                  <div className="space-y-4">
                    {activeArenas.map(poll => (
                      <div key={poll.id} className="relative w-full">
                        <PollCard 
                          poll={poll} 
                          hasVoted={allUserVotes.some(v => v.pollId === poll.id)}
                          isAdmin={user?.role === 'admin'}
                          onDelete={() => handleDelete(poll.id)}
                          onClick={() => setSelectedPoll(poll)} 
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="w-full py-12 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                    <p className="text-zinc-800 font-bold uppercase tracking-widest text-[8px]">No active arenas.</p>
                  </div>
                )}
              </div>

              {/* Stats / Quick Links */}
              <div className="grid grid-cols-2 gap-4">
                <motion.div 
                  whileTap={{ scale: 0.98 }}
                  onClick={handleFetchTrending}
                  className="flex flex-col items-start p-5 rounded-2xl bg-zinc-900/40 border border-white/5 group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 border border-purple-500/10">
                    <TrendingUp size={16} strokeWidth={2} />
                  </div>
                  <span className="text-[7px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-1">Trending</span>
                  <span className="text-base font-bold font-display uppercase tracking-tight text-white/80">Insane</span>
                </motion.div>
                
                <motion.div 
                  whileTap={{ scale: 0.98 }}
                  onClick={handleFetchTopRated}
                  className="flex flex-col items-start p-5 rounded-2xl bg-zinc-900/40 border border-white/5 group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/10">
                    <Star size={16} strokeWidth={2} />
                  </div>
                  <span className="text-[7px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-1">Top Rated</span>
                  <span className="text-base font-bold font-display uppercase tracking-tight text-white/80">Wild</span>
                </motion.div>
              </div>

              {/* Ended Arenas */}
              {endedArenas.length > 0 && (
                <div className="w-full space-y-4 opacity-50">
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-600">Ended Arenas</h2>
                    <span className="text-[7px] font-bold text-zinc-700 uppercase tracking-widest">History</span>
                  </div>
                  <div className="space-y-3">
                    {endedArenas.map(poll => (
                      <div key={poll.id} className="relative group">
                        <PollCard 
                          poll={poll} 
                          hasVoted={allUserVotes.some(v => v.pollId === poll.id)}
                          isAdmin={user?.role === 'admin'}
                          onDelete={() => handleDelete(poll.id)}
                          onClick={() => setSelectedPoll(poll)} 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <BrandingFooter />
            </div>
          </motion.div>
        )}

        {selectedPoll && (
          <motion.div
            key="poll-details"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="min-h-screen max-w-md mx-auto pb-32 pt-10"
          >
            <div className="px-4 py-2 space-y-4">
              <motion.button
                whileTap={{ x: -2 }}
                onClick={() => setSelectedPoll(null)}
                className="text-zinc-500 hover:text-white flex items-center gap-1.5 transition-colors text-[9px] font-black uppercase tracking-[0.2em] mb-4"
              >
                <ArrowLeft size={14} strokeWidth={3} />
                Back to Arena
              </motion.button>

              <div className="pt-1">
                <h1 className="text-2xl font-black font-display mb-1 tracking-tighter uppercase leading-tight">{selectedPoll.title}</h1>
                <p className="text-zinc-500 text-[10px] font-medium leading-relaxed">{selectedPoll.description}</p>
              </div>

              {new Date(selectedPoll.endDate) < new Date() || selectedPoll.isPublished ? (
                <ResultsView results={pollResults} pollTitle={selectedPoll.title} pollId={selectedPoll.id} />
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <h3 className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em]">Arena Battle</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">
                        {userVotes.length} / {participants.length} Voted
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {participants.map((p, index) => {
                      const stats = pollResults.find(r => r.participantId === p.id);
                      const hasVotedThis = userVotes.some(v => v.participantId === p.id);
                      return (
                        <React.Fragment key={p.id}>
                          <ParticipantCard
                            participant={p}
                            isVoted={hasVotedThis}
                            stats={stats ? {
                              avgCraziness: stats.avgCraziness,
                              avgMadness: stats.avgMadness,
                              avgFoolishness: stats.avgFoolishness
                            } : undefined}
                            onClick={() => {
                              if (!hasVotedThis) {
                                setSelectedParticipant(p);
                              }
                            }}
                          />
                          
                          {/* VS Positioned BETWEEN contestants */}
                          {index < participants.length - 1 && (
                            <div className="relative py-2 flex items-center justify-center gap-4">
                              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center shadow-2xl relative z-10 overflow-visible">
                                <span className="text-2xl font-black font-display italic text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-blue-400 leading-normal select-none px-2">VS</span>
                                <div className="absolute -inset-4 bg-blue-500/5 blur-xl rounded-full -z-10 animate-pulse" />
                              </div>
                              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                  
                  {userVotes.length === participants.length && participants.length > 0 && (
                    <div className="glass-card rounded-xl p-6 text-center mt-4 border border-emerald-500/10 bg-emerald-500/[0.02]">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto mb-2">
                        <CheckCircle2 size={14} strokeWidth={3} />
                      </div>
                      <p className="text-emerald-500/80 font-bold uppercase tracking-widest text-[8px]">All votes recorded for this arena.</p>
                    </div>
                  )}
                </div>
              )}
              <BrandingFooter />
            </div>
          </motion.div>
        )}

        {activeTab === 'polls' && (
          <motion.div
            key="polls"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-4 max-w-md mx-auto space-y-8 pb-32"
          >
            <div className="pt-1">
              <h1 className="text-xl font-black font-display tracking-tight uppercase mb-0.5">All Arenas</h1>
              <p className="text-zinc-500 text-[8px] font-bold uppercase tracking-[0.2em]">Browse all active and upcoming madness.</p>
            </div>
            
            <div className="space-y-10">
              {/* Active Section */}
              {activeArenas.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 px-1">Active</h2>
                  <div className="space-y-3">
                    {activeArenas.map(poll => (
                      <PollCard 
                        key={poll.id} 
                        poll={poll} 
                        hasVoted={allUserVotes.some(v => v.pollId === poll.id)}
                        onClick={() => setSelectedPoll(poll)}
                        isAdmin={user?.role === 'admin'}
                        onDelete={() => handleDelete(poll.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Ended Section */}
              {endedArenas.length > 0 && (
                <div className="space-y-4 opacity-60">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 px-1">Ended</h2>
                  <div className="space-y-3">
                    {endedArenas.map(poll => (
                      <PollCard 
                        key={poll.id} 
                        poll={poll} 
                        hasVoted={allUserVotes.some(v => v.pollId === poll.id)}
                        onClick={() => setSelectedPoll(poll)}
                        isAdmin={user?.role === 'admin'}
                        onDelete={() => handleDelete(poll.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <BrandingFooter />
          </motion.div>
        )}

        {activeTab === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            <HallOfFame />
          </motion.div>
        )}

        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full min-h-screen bg-[#0a0a0a]"
          >
            <div className="w-full pt-12 px-6 pb-32">
              <div className="flex items-center gap-5 mb-8">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full p-0.5 bg-gradient-to-br from-purple-500/40 via-blue-500/40 to-emerald-500/40">
                    <div className="w-full h-full rounded-full overflow-hidden bg-[#0a0a0a] border-2 border-[#0a0a0a]">
                      <img src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#0a0a0a] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <h2 className="text-xl font-bold font-display tracking-tight uppercase leading-none mb-1 text-white/90">{user?.username}</h2>
                  <p className="text-zinc-500 text-[9px] font-medium uppercase tracking-widest opacity-60">{user?.email}</p>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setNewUsername(user?.username || '');
                      setShowUsernameModal(true);
                    }}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[7px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Edit Profile
                  </motion.button>
                </div>
              </div>

              <div className="flex items-center gap-10 mb-10 py-4 border-y border-white/5">
                <div className="flex items-center gap-3">
                  <span className="text-xl font-black font-display leading-none text-white/90">{allUserVotes.length}</span>
                  <span className="text-[7px] font-black text-zinc-600 uppercase tracking-[0.2em]">Votes Cast</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-black font-display leading-none text-white/90">{new Set(allUserVotes.map(v => v.pollId)).size}</span>
                  <span className="text-[7px] font-black text-zinc-600 uppercase tracking-[0.2em]">Arenas Joined</span>
                </div>
              </div>

              <div className="space-y-0.5">
                <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-800 mb-4 px-2">Account Settings</h3>
                
                <motion.div 
                  whileTap={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                  onClick={() => setActiveTab('results')}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-zinc-600 group-hover:text-zinc-300 transition-colors">
                      <Trophy size={16} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-zinc-300 transition-colors">Hall of Fame</span>
                  </div>
                  <ChevronRight size={14} className="text-zinc-800 group-hover:text-zinc-500 transition-colors" />
                </motion.div>

                <motion.div 
                  whileTap={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                  onClick={() => auth.signOut()}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-red-500/5 flex items-center justify-center text-red-500/60 group-hover:text-red-500 transition-colors">
                      <LogOut size={16} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-red-500/60 group-hover:text-red-500 transition-colors">Sign Out</span>
                  </div>
                  <ChevronRight size={14} className="text-zinc-800" />
                </motion.div>
              </div>
              <BrandingFooter />
            </div>
          </motion.div>
        )}

        {activeTab === 'admin' && isAdmin && (
          <motion.div
            key="admin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pb-20"
          >
            <button
              onClick={() => setActiveTab('home')}
              className="mx-4 my-4 text-zinc-500 hover:text-white flex items-center gap-1.5 transition-colors text-[8px] font-black uppercase tracking-[0.2em]"
            >
              <ArrowLeft size={12} strokeWidth={3} />
              Exit Admin
            </button>
            <AdminPanel onSuccess={() => setActiveTab('home')} />
            <BrandingFooter />
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      <AnimatePresence>
        {selectedParticipant && (
          <RatingModal
            participant={selectedParticipant}
            participants={participants}
            onClose={() => setSelectedParticipant(null)}
            onSubmit={handleVote}
          />
        )}
        
        {showUsernameModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="w-full max-w-sm glass-card rounded-[32px] p-8 border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)]"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 text-white flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Settings size={32} strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-black font-display uppercase tracking-tight text-center mb-2">Choose Identity</h3>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest text-center mb-8 leading-relaxed">
                Set a custom username for the arena. This will be visible with your comments.
              </p>
              
              <div className="space-y-1.5 mb-8">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Username</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Enter username..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl h-14 px-4 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all font-bold text-lg placeholder:text-zinc-800"
                />
                <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest ml-1">3-30 characters</p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  disabled={isUpdatingUsername || newUsername.length < 3}
                  onClick={handleUpdateUsername}
                  className="w-full h-14 bg-white text-black rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl"
                >
                  {isUpdatingUsername ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 size={18} strokeWidth={3} />
                      Save Identity
                    </>
                  )}
                </button>
                {user?.username && !user.username.startsWith('User_') && (
                  <button
                    onClick={() => setShowUsernameModal(false)}
                    className="w-full h-14 bg-white/5 text-zinc-400 rounded-2xl font-black uppercase tracking-widest hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {(showTrendingModal || showTopRatedModal) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="w-full max-w-md glass-card rounded-[32px] p-8 border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${showTrendingModal ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {showTrendingModal ? <TrendingUp size={20} /> : <Star size={20} />}
                  </div>
                  <h3 className="text-xl font-black font-display uppercase tracking-tight">
                    {showTrendingModal ? 'Trending Arenas' : 'Top Rated Arenas'}
                  </h3>
                </div>
                <button 
                  onClick={() => {
                    setShowTrendingModal(false);
                    setShowTopRatedModal(false);
                  }}
                  className="text-zinc-500 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {isLoadingStats ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin mb-4" />
                  <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Calculating Stats...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(showTrendingModal ? trendingPolls : topRatedPolls).length > 0 ? (
                    (showTrendingModal ? trendingPolls : topRatedPolls).map((poll, i) => (
                      <div key={poll.id} className="relative">
                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black text-zinc-600 border border-white/5 z-10">
                          #{i + 1}
                        </div>
                        <PollCard 
                          poll={poll} 
                          hasVoted={allUserVotes.some(v => v.pollId === poll.id)}
                          isAdmin={user?.role === 'admin'}
                          onDelete={() => handleDelete(poll.id)}
                          onClick={() => {
                            setSelectedPoll(poll);
                            setShowTrendingModal(false);
                            setShowTopRatedModal(false);
                          }} 
                        />
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center">
                      <p className="text-zinc-600 font-bold uppercase tracking-widest text-[8px]">No data available yet.</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
