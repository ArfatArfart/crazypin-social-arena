import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Crown, Star, AlertCircle, X, MessageSquare } from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import { Poll, Participant, Vote, PollResult } from '../types';
import Certificate from './Certificate';
import BrandingFooter from './BrandingFooter';

const HallOfFame: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [legends, setLegends] = useState<any[]>([]);
  const [selectedLegend, setSelectedLegend] = useState<any | null>(null);

  useEffect(() => {
    const fetchHallOfFame = async () => {
      try {
        setLoading(true);
        const polls = await firebaseService.getPolls();
        const allVotes = await firebaseService.getAllVotes();
        
        // Fetch all participants for all polls to map participantId to name/image
        const allParticipantsData = await Promise.all(
          polls.map(p => firebaseService.getParticipants(p.id))
        );
        
        const participantMap: Record<string, Participant> = {};
        allParticipantsData.flat().forEach(p => {
          participantMap[p.id] = p;
        });

        const legendsMap: Record<string, any> = {};

        // 1. Process all votes to get unique voters and scores per legend (by name)
        allVotes.forEach(vote => {
          const participant = participantMap[vote.participantId];
          if (!participant) return;

          const name = participant.name;
          if (!legendsMap[name]) {
            legendsMap[name] = {
              name,
              imageUrl: participant.imageUrl,
              voterIds: new Set<string>(),
              scores: [],
              wins: 0,
              arenasPlayed: 0,
              arenas: new Set<string>()
            };
          }

          legendsMap[name].voterIds.add(vote.userId);
          const score = (vote.craziness + vote.madness + vote.foolishness) / 3;
          legendsMap[name].scores.push(score);
        });

        // 2. Process each poll to calculate wins and arenas played
        polls.forEach((poll, idx) => {
          const pollParticipants = allParticipantsData[idx];
          const pollVotes = allVotes.filter(v => v.pollId === poll.id);
          
          if (pollVotes.length === 0) return;

          const pollResults = pollParticipants.map(p => {
            const pVotes = pollVotes.filter(v => v.participantId === p.id);
            const totalP = pVotes.length;
            const avg = totalP > 0 
              ? pVotes.reduce((acc, v) => acc + (v.craziness + v.madness + v.foolishness) / 3, 0) / totalP 
              : 0;
            
            // Track participation
            if (legendsMap[p.name]) {
              legendsMap[p.name].arenasPlayed++;
            }

            return { name: p.name, avg };
          });

          pollResults.sort((a, b) => b.avg - a.avg);
          if (pollResults.length > 0 && pollResults[0].avg > 0) {
            const winnerName = pollResults[0].name;
            if (legendsMap[winnerName]) {
              legendsMap[winnerName].wins++;
            }
          }
        });

        // 3. Finalize legend stats and sort
        const finalizedLegends = Object.values(legendsMap).map(legend => {
          const totalVotes = legend.voterIds.size;
          const avgScore = legend.scores.length > 0 
            ? legend.scores.reduce((acc: number, s: number) => acc + s, 0) / legend.scores.length 
            : 0;
          
          return {
            ...legend,
            totalVotes,
            avgScore,
          };
        });

        // Sort by totalVotes (primary) and avgScore (secondary)
        finalizedLegends.sort((a, b) => {
          if (b.totalVotes !== a.totalVotes) return b.totalVotes - a.totalVotes;
          return b.avgScore - a.avgScore;
        });

        setLegends(finalizedLegends);
      } catch (err) {
        console.error('Error fetching Hall of Fame:', err);
        setError('Failed to load Hall of Fame. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchHallOfFame();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-zinc-500 font-black uppercase tracking-widest text-xs">Fetching Legends...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <AlertCircle className="text-red-500 mb-4" size={48} />
        <p className="text-white font-black uppercase tracking-tight text-lg mb-2">Error Loading Hall of Fame</p>
        <p className="text-zinc-500 text-xs uppercase tracking-widest">{error}</p>
      </div>
    );
  }

  if (legends.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <Trophy className="text-zinc-800 mb-4" size={64} />
        <p className="text-white font-black uppercase tracking-tight text-lg mb-2">Hall of Fame is Empty</p>
        <p className="text-zinc-500 text-xs uppercase tracking-widest">Complete some arenas to see the legends here!</p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-32 pt-12 w-[92%] mx-auto max-w-lg">
      <div className="flex flex-col items-center text-center mb-10">
        <motion.div 
          initial={{ scale: 0.8, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 text-black flex items-center justify-center shadow-xl relative mb-4"
        >
          <Trophy size={24} strokeWidth={3} />
          <div className="absolute -inset-4 bg-yellow-500/20 blur-2xl rounded-full -z-10" />
        </motion.div>
        <div>
          <h2 className="text-2xl font-black font-display tracking-tighter uppercase leading-none mb-1">Hall of Fame</h2>
          <p className="text-[9px] font-black text-yellow-500 uppercase tracking-[0.3em]">Top Legends Ranked by Community</p>
        </div>
      </div>

      <div className="space-y-10">
        {legends.map((legend, index) => {
          const isTopWinner = index === 0;
          
          // Dynamic Label Logic
          let funLabel = "Public Favorite 🔥";
          if (index === 0) funLabel = "Vote Monster 👑";
          else if (legend.avgScore > 8) funLabel = "Certified Legend 😈";
          else if (index % 3 === 0) funLabel = "Ultimate GADHA 🐴";
          else if (index % 3 === 1) funLabel = "Danger Level: High ⚠️";

          return (
            <motion.div
              key={legend.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className={`relative group w-full`}
            >
              <div className={`flex flex-col gap-6 items-center py-8 px-4 rounded-[32px] border transition-all duration-500 ${
                isTopWinner 
                  ? 'bg-gradient-to-b from-yellow-500/10 to-transparent border-yellow-500/20 shadow-[0_0_40px_rgba(234,179,8,0.08)]' 
                  : 'bg-white/[0.02] border-white/5'
              }`}>
                
                {/* Image & Badges */}
                <div className="relative shrink-0">
                  <div className={`aspect-[3/4] rounded-2xl overflow-hidden border shadow-xl bg-[#111] transition-transform duration-700 group-hover:scale-105 ${
                    isTopWinner ? 'w-32 border-yellow-500/30' : 'w-24 border-white/10'
                  }`}>
                    <img
                      src={legend.imageUrl}
                      alt={legend.name}
                      className="w-full h-full object-cover object-center"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                    {isTopWinner && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/20 to-transparent" />
                        {/* Crown Overlay - Inside Image */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.6)] z-30">
                          <Crown size={24} strokeWidth={2.5} fill="currentColor" className="opacity-90" />
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Rank Badge */}
                  <div className={`absolute -top-3 -right-3 w-10 h-10 rounded-xl flex items-center justify-center font-black font-display text-base shadow-xl border-4 border-[#0a0a0a] z-20 ${
                    isTopWinner ? 'bg-yellow-500 text-black' : 'bg-zinc-800 text-white'
                  }`}>
                    {index + 1}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 text-center w-full">
                  <div className="mb-6">
                    <div className="flex flex-col items-center gap-1.5 mb-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        isTopWinner ? 'bg-yellow-500 text-black' : 'bg-white/5 text-zinc-400'
                      }`}>
                        {funLabel}
                      </span>
                    </div>
                    <h3 className={`font-black font-display tracking-tighter uppercase text-white leading-none mb-1 ${
                      isTopWinner ? 'text-2xl' : 'text-xl'
                    }`}>
                      {legend.name}
                    </h3>
                  </div>
                  
                  {/* Stats Grid - 2x2 on Mobile */}
                  <div className="grid grid-cols-2 gap-3 mb-8 bg-white/5 rounded-2xl p-4">
                    <div className="flex flex-col items-center py-1">
                      <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total Votes</span>
                      <span className="text-lg font-black font-display text-white">{legend.totalVotes}</span>
                    </div>
                    <div className="flex flex-col items-center py-1 border-l border-white/5">
                      <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest mb-1">Avg Rating</span>
                      <span className="text-lg font-black font-display text-purple-500">{legend.avgScore.toFixed(1)}</span>
                    </div>
                    <div className="flex flex-col items-center py-1 border-t border-white/5">
                      <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest mb-1">Wins</span>
                      <span className="text-lg font-black font-display text-emerald-500">{legend.wins}</span>
                    </div>
                    <div className="flex flex-col items-center py-1 border-t border-l border-white/5">
                      <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest mb-1">Arenas</span>
                      <span className="text-lg font-black font-display text-blue-500">{legend.arenasPlayed}</span>
                    </div>
                  </div>

                  <div className="flex justify-center w-full">
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedLegend(legend)}
                      className={`w-full py-4 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all ${
                        isTopWinner 
                          ? 'bg-yellow-600 text-black shadow-lg' 
                          : 'bg-white/5 text-zinc-400 border border-white/5'
                      }`}
                    >
                      <Trophy size={14} strokeWidth={3} />
                      View Legend Certificate
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <BrandingFooter />

      {/* Certificate Modal */}
      <AnimatePresence>
        {selectedLegend && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black"
          >
            <button 
              onClick={() => setSelectedLegend(null)}
              className="fixed top-6 right-6 z-[120] text-white p-3 bg-black/40 hover:bg-black/60 rounded-full transition-colors shadow-lg backdrop-blur-md border border-white/10 active:scale-90"
            >
              <X size={24} strokeWidth={3} />
            </button>

            <div className="h-screen flex items-center justify-center relative certificate-view">
              <Certificate winnerName={selectedLegend.name} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HallOfFame;
