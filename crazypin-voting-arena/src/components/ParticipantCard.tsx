import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Participant } from '../types';

interface ParticipantCardProps {
  participant: Participant;
  onClick: () => void;
  isVoted?: boolean;
  stats?: {
    avgCraziness: number;
    avgMadness: number;
    avgFoolishness: number;
  };
}

const ParticipantCard: React.FC<ParticipantCardProps> = ({ participant, onClick, isVoted, stats }) => {
  const fallbackUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${participant.name || participant.id}`;
  const imageUrl = participant.imageUrl || fallbackUrl;

  const StatMini = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className="flex flex-col">
      <span className="text-[6px] font-bold text-zinc-600 uppercase tracking-widest mb-0.5">{label}</span>
      <div className="flex items-center gap-1">
        <div className="h-1 w-8 bg-white/5 rounded-full overflow-hidden">
          <div className={`h-full ${color}`} style={{ width: `${value * 10}%` }} />
        </div>
        <span className="text-[8px] font-bold text-white/50">{value.toFixed(1)}</span>
      </div>
    </div>
  );

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative w-full mb-4 cursor-pointer group"
    >
      <div className="relative z-10 bg-[#0f0f0f] border border-white/5 rounded-2xl p-5 shadow-sm group-hover:border-white/10 transition-all duration-300 overflow-hidden">
        <div className="flex items-center justify-between gap-4 relative z-10">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-xl font-bold font-display tracking-tight text-white/90 group-hover:text-white transition-colors truncate leading-none uppercase">
                {participant.name}
              </h3>
              {isVoted && (
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shrink-0">
                  <Star size={10} fill="currentColor" />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <StatMini label="Pgllazi" value={stats?.avgCraziness || 0} color="bg-purple-500" />
              <StatMini label="Zookige" value={stats?.avgMadness || 0} color="bg-blue-500" />
              <StatMini label="Cxotalge" value={stats?.avgFoolishness || 0} color="bg-emerald-500" />
            </div>

            <div className="mt-6 flex items-center gap-2">
              <span className={`text-[8px] font-bold px-3 py-1 rounded-md uppercase tracking-[0.2em] border transition-all duration-300 ${
                isVoted 
                  ? 'bg-emerald-500/5 text-emerald-500/60 border-emerald-500/10' 
                  : 'bg-white/5 text-zinc-600 border-white/5 hover:bg-white/10 hover:text-zinc-400'
              }`}>
                {isVoted ? 'Voted' : 'Rate Now'}
              </span>
            </div>
          </div>
          
          <div className="relative flex-shrink-0">
            <div className="w-20 aspect-[3/4] rounded-xl overflow-hidden bg-zinc-900 border border-white/5">
              <img
                src={imageUrl}
                alt={participant.name}
                className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-500 block"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ParticipantCard;
