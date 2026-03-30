import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, CheckCircle2 } from 'lucide-react';
import { Participant } from '../types';

interface RatingModalProps {
  participant: Participant;
  participants: Participant[];
  onClose: () => void;
  onSubmit: (ratings: { craziness: number; madness: number; foolishness: number; comment?: string; aboutName?: string }) => void;
}

const RatingModal: React.FC<RatingModalProps> = ({ participant, participants, onClose, onSubmit }) => {
  const [craziness, setCraziness] = useState(5);
  const [madness, setMadness] = useState(5);
  const [foolishness, setFoolishness] = useState(5);
  const [comment, setComment] = useState('');
  const [aboutName, setAboutName] = useState(participant.name);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const wordCount = comment.trim() ? comment.trim().split(/\s+/).length : 0;
  const isCommentValid = comment.trim().length > 0 && wordCount <= 30;

  const getEmoji = (val: number) => {
    if (val <= 3) return '😎';
    if (val <= 7) return '🤪';
    return '🤯';
  };

  const handleSubmit = async () => {
    if (!isCommentValid) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ 
        craziness, 
        madness, 
        foolishness, 
        comment: comment.trim(),
        aboutName: aboutName
      });
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const RatingSlider = ({ label, value, onChange, emoji, color }: { label: string; value: number; onChange: (v: number) => void; emoji: string; color: string }) => (
    <div className="mb-4 group">
      <div className="flex justify-between items-end mb-2">
        <div>
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1 block">{label}</label>
          <div className="flex items-center gap-2">
            <span className="text-xl filter drop-shadow-lg transform group-hover:scale-125 transition-transform">{emoji}</span>
            <span className="text-2xl font-black font-display tracking-tighter">{value}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Intensity</span>
          <div className="flex gap-1 mt-1">
            {[...Array(10)].map((_, i) => (
              <div 
                key={i} 
                className={`w-1 h-2 rounded-full transition-all duration-300 ${i < value ? color : 'bg-white/5'}`}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="relative h-8 flex items-center">
        <input
          type="range"
          min="1"
          max="10"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-white relative z-10"
        />
        <div className="absolute inset-0 flex justify-between items-center pointer-events-none px-1">
          {[...Array(11)].map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-white/10" />
          ))}
        </div>
      </div>
      <div className="flex justify-between mt-1 px-1">
        <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">Chill</span>
        <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">Wild</span>
        <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">Insane</span>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/90 backdrop-blur-xl p-0 sm:p-4"
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full max-w-xl bg-[#0a0a0a] rounded-t-[32px] sm:rounded-[32px] p-5 pb-6 relative overflow-hidden border-t border-white/10 sm:border border-white/10 shadow-[0_-20px_80px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto no-scrollbar"
      >
        {/* Decorative Background Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-b from-purple-600/10 to-transparent pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all z-20 border border-white/5"
        >
          <X size={20} strokeWidth={3} />
        </button>

        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative z-10"
            >
              <div className="flex flex-col items-center mb-8">
                <motion.div 
                  initial={{ scale: 0.8, rotate: -5 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="w-28 aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 mb-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-[#111]"
                >
                  <img
                    src={participant.imageUrl || `/images/default-avatar.png`}
                    alt={participant.name}
                    className="w-full h-full object-cover object-center block"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
                <h2 className="text-3xl font-black font-display text-center tracking-tighter uppercase leading-none">{participant.name}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em]">Pgllazi Evaluation</p>
                </div>
              </div>

              <div className="px-1 space-y-6">
                <RatingSlider
                  label="Pgllazi"
                  value={craziness}
                  onChange={setCraziness}
                  emoji={getEmoji(craziness)}
                  color="bg-purple-500"
                />
                <RatingSlider
                  label="Zookige"
                  value={madness}
                  onChange={setMadness}
                  emoji={getEmoji(madness)}
                  color="bg-blue-500"
                />
                <RatingSlider
                  label="Cxotalge"
                  value={foolishness}
                  onChange={setFoolishness}
                  emoji={getEmoji(foolishness)}
                  color="bg-emerald-500"
                />
              </div>

              {/* Comment Section */}
              <div className="space-y-6 mb-8 mt-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] px-1">Who is this comment about?</label>
                  <div className="flex flex-wrap gap-2 px-1">
                    {participants.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setAboutName(p.name)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                          aboutName === p.name 
                            ? 'bg-white text-black border-white shadow-[0_10px_20px_rgba(255,255,255,0.1)] scale-105' 
                            : 'bg-white/5 text-zinc-500 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                    <div className="relative flex-1 min-w-[140px]">
                      <input
                        type="text"
                        value={aboutName}
                        onChange={(e) => setAboutName(e.target.value)}
                        placeholder="Or type name..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl h-10 px-4 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all placeholder:text-zinc-800"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Add a Comment</label>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isCommentValid ? 'text-emerald-500' : 'text-zinc-600'}`}>
                      {wordCount} / 30 words max
                    </span>
                  </div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={`Why is ${aboutName} crazy? (Max 30 words)`}
                    className="w-full bg-white/5 border border-white/10 rounded-[24px] p-5 h-28 text-sm font-bold focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all resize-none placeholder:text-zinc-800 leading-relaxed"
                  />
                  <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest px-1 leading-relaxed">
                    Your comment will only be visible if {aboutName} wins the arena.
                  </p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 20px 40px rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.98 }}
                disabled={isSubmitting || !isCommentValid}
                onClick={handleSubmit}
                className="w-full bg-white text-black h-16 rounded-2xl font-black text-base uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50 shadow-2xl mt-4"
              >
                {isSubmitting ? (
                  <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Star size={22} fill="currentColor" strokeWidth={3} />
                    Cast Vote
                  </>
                )}
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16 relative z-10"
            >
              <div className="relative mb-8">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                  className="w-24 h-24 rounded-[32px] bg-emerald-500 flex items-center justify-center text-white shadow-[0_0_50px_rgba(16,185,129,0.4)]"
                >
                  <CheckCircle2 size={48} strokeWidth={3} />
                </motion.div>
                <div className="absolute inset-0 bg-emerald-500 blur-[60px] opacity-20 -z-10" />
              </div>
              <h2 className="text-3xl font-black font-display text-center mb-3 tracking-tighter uppercase">Arena Updated!</h2>
              <p className="text-zinc-500 text-center font-bold uppercase tracking-widest max-w-xs leading-relaxed text-[10px]">
                Your madness evaluation has been recorded in the arena.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default RatingModal;
