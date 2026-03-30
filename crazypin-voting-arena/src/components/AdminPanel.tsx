import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Save, Image as ImageIcon, Calendar, X, Shield, UserPlus, Dices, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import BrandingFooter from './BrandingFooter';
import { auth } from '../firebase';

interface AdminPanelProps {
  onSuccess?: () => void;
}

interface Participant {
  id: string;
  name: string;
  imageUrl: string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([
    { id: Math.random().toString(36).substr(2, 9), name: '', imageUrl: '' },
    { id: Math.random().toString(36).substr(2, 9), name: '', imageUrl: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const updateParticipant = (id: string, updates: Partial<Participant>) => {
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const addParticipant = () => {
    if (participants.length < 10) {
      setParticipants([...participants, { id: Math.random().toString(36).substr(2, 9), name: '', imageUrl: '' }]);
    }
  };

  const removeParticipant = (id: string) => {
    if (participants.length > 2) {
      setParticipants(prev => prev.filter(p => p.id !== id));
    }
  };

  const useRandomImage = (id: string) => {
    const randomId = Math.floor(Math.random() * 1000);
    const randomUrl = `https://picsum.photos/seed/${randomId}/400/400`;
    updateParticipant(id, { imageUrl: randomUrl });
  };

  const randomizeAll = () => {
    setParticipants(prev => prev.map(p => {
      const randomId = Math.floor(Math.random() * 1000);
      const randomUrl = `https://picsum.photos/seed/${randomId}/400/400`;
      return {
        ...p,
        name: p.name || `Participant ${Math.floor(Math.random() * 100)}`,
        imageUrl: p.imageUrl || randomUrl,
      };
    }));
  };

  const validateForm = () => {
    if (!title.trim()) return "Arena title is required";
    if (!startDate) return "Start time is required";
    if (!endDate) return "End time is required";
    if (new Date(startDate) >= new Date(endDate)) return "End time must be after start time";
    if (participants.length < 2) return "At least 2 participants are required";
    
    for (const p of participants) {
      if (!p.name.trim()) return "All participants must have a name";
      if (!p.imageUrl.trim()) return `Image URL is missing for ${p.name || 'a participant'}`;
      try {
        new URL(p.imageUrl);
      } catch {
        return `Invalid image URL for ${p.name}`;
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      if (!auth.currentUser) throw new Error('You must be logged in to launch an arena.');

      const pollData: Omit<import('../types').Poll, 'id'> = {
        title,
        description,
        startDate,
        endDate,
        status: 'active',
        createdBy: auth.currentUser.uid,
        isPublished: false,
        participantImages: participants.slice(0, 3).map(p => p.imageUrl).filter(url => !!url),
      };

      const pollId = await firebaseService.createPoll(pollData);

      if (!pollId) {
        throw new Error('Failed to create poll - no ID returned');
      }

      for (const p of participants) {
        const { id, ...participantData } = p;
        await firebaseService.addParticipant(pollId, participantData as import('../types').Participant);
      }

      setSuccess(true);
      
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);

      // Reset form
      setTitle('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      setParticipants([
        { id: Math.random().toString(36).substr(2, 9), name: '', imageUrl: '' },
        { id: Math.random().toString(36).substr(2, 9), name: '', imageUrl: '' },
      ]);
    } catch (err) {
      console.error('Submission failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to create arena. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 py-6 pb-24 max-w-lg mx-auto space-y-6"
    >
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 border border-white/10">
            <Shield size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-black font-display tracking-tight uppercase leading-none">Create Arena</h1>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">
              Initialize new arenas and manage the madness.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Arena Configuration */}
        <div className="glass-card rounded-[24px] p-5 space-y-5 border border-white/5 shadow-2xl">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Arena Title</label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., The Ultimate Cxotalge"
              className="w-full bg-white/5 border border-white/10 rounded-xl h-12 px-4 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all font-bold text-sm placeholder:text-zinc-700"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What makes this arena special?"
              className="w-full bg-white/5 border border-white/10 rounded-xl h-20 p-4 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all font-medium text-zinc-300 text-[12px] resize-none placeholder:text-zinc-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Start Time</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input
                  required
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl h-12 pl-11 pr-4 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-xs font-bold"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">End Time</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input
                  required
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl h-12 pl-11 pr-4 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-xs font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Participants Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Participants ({participants.length}/10)</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={randomizeAll}
                className="flex items-center gap-2 text-zinc-400 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5"
              >
                <Dices size={14} />
                Randomize
              </button>
              {participants.length < 10 && (
                <button
                  type="button"
                  onClick={addParticipant}
                  className="flex items-center gap-2 text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5"
                >
                  <Plus size={14} />
                  Add
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {participants.map((p, index) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="glass-card rounded-[24px] p-4 relative border border-white/5 shadow-xl group"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Image Preview */}
                    <div className={`w-full sm:w-24 h-24 rounded-2xl bg-white/5 border ${error && !p.imageUrl ? 'border-red-500/50' : 'border-white/10'} flex items-center justify-center overflow-hidden shrink-0 relative group/img`}>
                      {p.imageUrl ? (
                        <ImageWithFallback 
                          src={p.imageUrl} 
                          alt={p.name || 'Participant'} 
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1 opacity-20">
                          <ImageIcon size={24} />
                          <span className="text-[8px] font-black uppercase tracking-widest">No Image</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Inputs */}
                    <div className="flex-1 space-y-3">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Participant Name</label>
                        <input
                          required
                          type="text"
                          value={p.name}
                          onChange={(e) => updateParticipant(p.id, { name: e.target.value })}
                          placeholder="e.g., John Doe"
                          className={`w-full bg-white/5 border ${error && !p.name.trim() ? 'border-red-500/50' : 'border-white/10'} rounded-xl h-10 px-4 text-sm font-bold focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all placeholder:text-zinc-700`}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Image URL (ImageKit)</label>
                        <div className="relative">
                          <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" size={12} />
                          <input
                            required
                            type="url"
                            value={p.imageUrl}
                            onChange={(e) => updateParticipant(p.id, { imageUrl: e.target.value })}
                            placeholder="Paste ImageKit URL here..."
                            className={`w-full bg-white/5 border ${error && !p.imageUrl.trim() ? 'border-red-500/50' : 'border-white/10'} rounded-xl h-10 pl-9 pr-4 text-[11px] font-medium focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all placeholder:text-zinc-700`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col gap-2">
                      {participants.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeParticipant(p.id)}
                          className="flex-1 sm:flex-none w-full sm:w-10 h-10 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-xl flex items-center justify-center text-red-500/50 hover:text-red-500 transition-all"
                          title="Remove Participant"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => useRandomImage(p.id)}
                        className="flex-1 sm:flex-none w-full sm:w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-all"
                        title="Random Image"
                      >
                        <Dices size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Submit Button */}
        <div className="space-y-4 mt-8">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500"
              >
                <AlertCircle size={18} />
                <p className="text-xs font-bold uppercase tracking-wider">{error}</p>
              </motion.div>
            )}
            
            {success && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-emerald-500"
              >
                <Plus size={18} className="rotate-45" />
                <p className="text-xs font-bold uppercase tracking-wider">Arena Launched Successfully!</p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            disabled={isSubmitting || success}
            type="submit"
            className={`w-full h-16 rounded-2xl font-black text-lg uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl transition-all duration-500 ${
              success 
                ? 'bg-emerald-500 text-white' 
                : 'bg-white text-black hover:bg-zinc-200 disabled:opacity-50'
            }`}
          >
            {isSubmitting ? (
              <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin" />
            ) : success ? (
              <>
                <Shield size={24} />
                Launched
              </>
            ) : (
              <>
                <Save size={24} strokeWidth={3} />
                Launch Arena
              </>
            )}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};

// Helper component for image with fallback
const ImageWithFallback: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  return (
    <div className="w-full h-full relative">
      {loading && (
        <div className="absolute inset-0 bg-white/5 animate-pulse flex items-center justify-center">
          <ImageIcon className="text-zinc-800 animate-bounce" size={20} />
        </div>
      )}
      <motion.img
        initial={{ opacity: 0 }}
        animate={{ opacity: loading ? 0 : 1 }}
        src={error ? `https://picsum.photos/seed/fallback/400/400` : src}
        alt={alt}
        className="w-full h-full object-contain"
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
        referrerPolicy="no-referrer"
      />
      {error && (
        <div className="absolute bottom-0 left-0 right-0 bg-red-500/80 backdrop-blur-sm py-1 flex items-center justify-center gap-1">
          <AlertCircle size={8} className="text-white" />
          <span className="text-[6px] font-black text-white uppercase tracking-tighter">Invalid URL</span>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
