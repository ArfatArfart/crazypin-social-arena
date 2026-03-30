import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, ChevronRight, Zap, Trash2 } from 'lucide-react';
import { Poll } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface PollCardProps {
  poll: Poll;
  onClick: () => void;
  hasVoted?: boolean;
  isAdmin?: boolean;
  onDelete?: (e: React.MouseEvent) => void;
}

const PollCard: React.FC<PollCardProps> = ({ poll, onClick, hasVoted, isAdmin, onDelete }) => {
  const isEnded = new Date(poll.endDate) < new Date();
  const timeLeft = formatDistanceToNow(new Date(poll.endDate));

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative w-full mb-4 cursor-pointer group"
    >
      <div className="relative z-10 bg-[#0f0f0f] border border-white/5 rounded-2xl overflow-hidden shadow-sm transition-all duration-300 group-hover:border-white/10">
        <div className="relative z-10 py-5 px-5 flex flex-col min-h-[140px] w-full">
          <div className="flex justify-between items-start mb-3">
            <div className="flex gap-2">
              <span className={`text-[7px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-md border ${
                isEnded 
                  ? 'bg-red-500/5 text-red-500/60 border-red-500/10' 
                  : 'bg-emerald-500/5 text-emerald-500/60 border-emerald-500/10'
              }`}>
                {isEnded ? 'Arena Ended' : 'Arena Active'}
              </span>
              {hasVoted && (
                <span className="text-[7px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-md bg-blue-500/5 text-blue-500/60 border border-blue-500/10">
                  Voted
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 relative z-50">
              {isAdmin && onDelete && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("[PollCard] NEW DELETE SYSTEM: Delete button clicked for arena:", poll.id);
                    onDelete(e);
                  }}
                  className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200 shadow-lg active:scale-90"
                  title="Delete Arena"
                >
                  <Trash2 size={16} strokeWidth={2.5} />
                </button>
              )}
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-zinc-600">
                <Zap size={16} className={!isEnded ? "text-yellow-500/40" : ""} />
              </div>
            </div>
          </div>

          <h3 className="text-xl font-bold font-display mb-1 tracking-tight text-white/90 group-hover:text-white transition-colors uppercase break-words w-full">
            {poll.title}
          </h3>
          
          {poll.description && (
            <p className="text-zinc-500 text-[10px] mb-4 font-medium leading-relaxed break-words w-full">
              {poll.description}
            </p>
          )}

          <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-[8px] font-bold text-zinc-600 uppercase tracking-[0.2em]">
                <Clock size={10} />
                <span>{isEnded ? 'Closed' : `${timeLeft} left`}</span>
              </div>
              
              <div className="flex -space-x-1.5">
                {(poll.participantImages && poll.participantImages.length > 0 ? poll.participantImages : [1, 2, 3]).slice(0, 3).map((img, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full border-2 border-[#0f0f0f] bg-zinc-800 flex items-center justify-center overflow-hidden"
                  >
                    <img
                      src={typeof img === 'string' ? img : `https://api.dicebear.com/7.x/avataaars/svg?seed=poll_${poll.id}_${i}`}
                      alt="Participant"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  </div>
                ))}
                <div className="w-6 h-6 rounded-full border-2 border-[#0f0f0f] bg-zinc-900 flex items-center justify-center text-[6px] font-bold text-zinc-600">
                  +{poll.participantImages?.length ? Math.max(0, poll.participantImages.length - 3) : 12}
                </div>
              </div>
            </div>
            
            <motion.button 
              whileTap={{ scale: 0.95 }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-[9px] uppercase tracking-[0.2em] flex items-center gap-2 shadow-lg"
            >
              <span>{isEnded ? 'Results' : 'Enter'}</span>
              <ChevronRight size={12} />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PollCard;
