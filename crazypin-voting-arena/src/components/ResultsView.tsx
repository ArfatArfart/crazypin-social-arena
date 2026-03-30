import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Star, TrendingUp, MessageSquare, Zap, X, ChevronRight } from 'lucide-react';
import { PollResult } from '../types';
import { firebaseService } from '../services/firebaseService';

interface ResultsViewProps {
  results: PollResult[];
  pollTitle: string;
  pollId: string;
}

const ResultsView: React.FC<ResultsViewProps> = ({ results, pollTitle, pollId }) => {
  const [comments, setComments] = useState<{ username: string; comment: string; aboutName: string }[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<PollResult | null>(null);
  const [showComments, setShowComments] = useState(false);

  const sortedResults = [...results].sort((a, b) => b.totalScore - a.totalScore);
  const topTwo = sortedResults.slice(0, 2);

  useEffect(() => {
    const fetchComments = async () => {
      if (pollId) {
        setLoadingComments(true);
        try {
          const fetchedComments = await firebaseService.getCommentsForPoll(pollId);
          setComments(fetchedComments);
        } catch (error) {
          console.error("Error fetching comments:", error);
        } finally {
          setLoadingComments(false);
        }
      }
    };
    fetchComments();
  }, [pollId]);

  const StatBar = ({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: any }) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1.5">
        <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
          <Icon size={14} className="text-zinc-400" />
          {label}
        </div>
        <span className="text-xs font-black font-display text-white tracking-tight">{value.toFixed(1)}<span className="text-zinc-600 ml-1">/ 10</span></span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden p-[1px]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value * 10}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className={`h-full rounded-full ${color} shadow-[0_0_15px_rgba(255,255,255,0.1)]`}
        />
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-6 pb-32 pt-4 w-full mx-auto relative"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-left">
          <h1 className="text-xl font-black font-display tracking-tighter uppercase leading-none text-white/90">Arena Results</h1>
          <p className="text-zinc-600 text-[8px] font-black uppercase tracking-[0.4em] mt-1 truncate max-w-[200px]">{pollTitle}</p>
        </div>
        <button 
          onClick={() => setShowComments(true)}
          className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 border border-white/5 shadow-xl active:scale-90 transition-transform"
        >
          <MessageSquare size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* VS Comparison Layout */}
      <div className="relative flex items-center justify-between gap-4 mb-8">
        {/* VS Indicator */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="w-14 h-14 rounded-full bg-[#0a0a0a] border border-white/10 flex items-center justify-center shadow-2xl overflow-visible">
            <span className="text-base font-black font-display text-white italic tracking-tighter leading-none">VS</span>
          </div>
        </div>

        {topTwo.map((result, index) => {
          const isWinner = index === 0;
          return (
            <motion.div
              key={result.participantId}
              initial={{ x: index === 0 ? -20 : 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => setSelectedParticipant(result)}
              className={`relative flex-1 cursor-pointer group ${!isWinner ? 'opacity-50' : 'z-10'}`}
            >
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <div className={`aspect-[3/4] w-full max-w-[120px] rounded-2xl overflow-hidden border shadow-2xl bg-[#111] transition-all duration-500 group-hover:scale-105 ${
                    isWinner ? 'border-yellow-500/40 shadow-[0_0_40px_rgba(234,179,8,0.2)]' : 'border-white/5'
                  }`}>
                    <img
                      src={result.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.name}`}
                      alt={result.name}
                      className="w-full h-full object-cover object-center"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                    {isWinner && (
                      <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/20 to-transparent pointer-events-none" />
                    )}
                  </div>

                  {/* Rank Badge */}
                  <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-xl flex items-center justify-center font-black font-display text-sm shadow-2xl border-2 border-[#0a0a0a] z-20 ${
                    isWinner ? 'bg-yellow-500 text-black' : 'bg-zinc-800 text-white'
                  }`}>
                    {index + 1}
                  </div>
                </div>

                {isWinner && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mb-3 px-3 py-1 bg-yellow-500 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                  >
                    <span className="text-[8px] font-black text-black uppercase tracking-widest whitespace-nowrap">ULTIMATE GADHA</span>
                  </motion.div>
                )}

                <div className="text-center">
                  <h3 className="text-xs font-black font-display tracking-tight uppercase text-white mb-1 truncate w-full px-2">
                    {result.name}
                  </h3>
                  <div className={`text-xl font-black font-display tracking-tighter ${isWinner ? 'text-yellow-500' : 'text-zinc-500'}`}>
                    {result.totalScore.toFixed(1)}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Remaining Participants Flow */}
      {sortedResults.length > 2 && (
        <div className="flex flex-col items-center gap-8 mt-4">
          {sortedResults.slice(2).map((result, idx) => (
            <React.Fragment key={result.participantId}>
              {/* VS Divider */}
              <div className="flex items-center justify-center w-full gap-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="w-12 h-12 rounded-full bg-[#0a0a0a] border border-white/10 flex items-center justify-center shadow-2xl overflow-visible">
                  <span className="text-sm font-black font-display text-white italic tracking-tighter leading-none">VS</span>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>

              {/* Contestant Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                onClick={() => setSelectedParticipant(result)}
                className="relative w-full max-w-[160px] cursor-pointer group"
              >
                <div className="flex flex-col items-center">
                  <div className="relative mb-4 w-full">
                    <div className="aspect-[3/4] w-full rounded-2xl overflow-hidden border border-white/5 shadow-2xl bg-[#111] transition-all duration-500 group-hover:scale-105">
                      <img
                        src={result.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.name}`}
                        alt={result.name}
                        className="w-full h-full object-cover object-center"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                    </div>

                    {/* Rank Badge */}
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-xl flex items-center justify-center font-black font-display text-sm shadow-2xl border-2 border-[#0a0a0a] z-20 bg-zinc-800 text-white">
                      {idx + 3}
                    </div>
                  </div>

                  <div className="text-center">
                    <h3 className="text-xs font-black font-display tracking-tight uppercase text-white mb-1 truncate w-full px-2">
                      {result.name}
                    </h3>
                    <div className="text-xl font-black font-display tracking-tighter text-zinc-500">
                      {result.totalScore.toFixed(1)}
                    </div>
                  </div>
                </div>
              </motion.div>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Detailed Stats Modal */}
      <AnimatePresence>
        {selectedParticipant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-end justify-center px-4 pb-12 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedParticipant(null)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="w-full max-w-sm bg-[#121212] rounded-[32px] p-8 border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10">
                    <img src={selectedParticipant.imageUrl} alt={selectedParticipant.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black font-display uppercase tracking-tighter text-white leading-none mb-1">{selectedParticipant.name}</h2>
                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em]">Arena Performance</p>
                  </div>
                </div>
                <button onClick={() => setSelectedParticipant(null)} className="p-2 text-zinc-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <StatBar label="Pgllazi" value={selectedParticipant.avgCraziness} color="bg-purple-500" icon={Zap} />
                <StatBar label="Zookige" value={selectedParticipant.avgMadness} color="bg-blue-500" icon={TrendingUp} />
                <StatBar label="Cxotalge" value={selectedParticipant.avgFoolishness} color="bg-emerald-500" icon={Star} />
              </div>

              <div className="mt-10 pt-6 border-t border-white/5 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Final Arena Score</span>
                  <span className="text-3xl font-black font-display text-white tracking-tighter">{selectedParticipant.totalScore.toFixed(1)}</span>
                </div>
                
                <button 
                  onClick={() => {
                    setShowComments(true);
                    // We could filter comments here, but for now we show all poll comments
                    // or we could fetch specific ones. The global modal shows all.
                  }}
                  className="w-full py-4 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <MessageSquare size={14} />
                  View Public Feedback
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comments Modal */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black"
          >
            <div className="h-full flex flex-col">
              <div className="px-6 pt-12 pb-6 flex items-center justify-between border-b border-white/5">
                <div>
                  <h2 className="text-2xl font-black font-display uppercase tracking-tighter text-white">Voices of the Arena</h2>
                  <p className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.4em] mt-1">Public Feedback</p>
                </div>
                <button 
                  onClick={() => setShowComments(false)}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 border border-white/5"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8">
                {loadingComments ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="w-8 h-8 border-2 border-white/5 border-t-purple-500 rounded-full animate-spin" />
                    <p className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.4em]">Gathering voices...</p>
                  </div>
                ) : comments.length > 0 ? (
                  comments.map((c, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="py-6 border-b border-white/5 last:border-0"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black text-zinc-500 border border-white/5 uppercase">
                          {c.username.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-white uppercase tracking-wider">{c.username}</span>
                          <span className="text-[7px] font-black text-yellow-500/60 uppercase tracking-widest mt-0.5">About: {c.aboutName}</span>
                        </div>
                      </div>
                      <p className="text-zinc-400 text-sm font-medium leading-relaxed italic">"{c.comment}"</p>
                    </motion.div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-20">
                    <MessageSquare size={48} className="mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No voices recorded</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ResultsView;
