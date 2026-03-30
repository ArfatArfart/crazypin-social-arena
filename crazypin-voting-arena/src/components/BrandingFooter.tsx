import React from 'react';
import { motion } from 'framer-motion';

const BrandingFooter: React.FC = () => {
  return (
    <motion.footer 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 0.4 }}
      viewport={{ once: true }}
      className="w-full py-12 flex flex-col items-center justify-center text-center gap-1.5"
    >
      <div className="flex flex-col items-center gap-1">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">
          Developed by <span className="text-white/80 font-display">ARFAT</span>
        </p>
        <div className="w-8 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
        <p className="text-[7px] font-bold uppercase tracking-[0.2em] text-zinc-600 max-w-[200px] leading-relaxed">
          Location: Hardu Suresh, Khag, Budgam, Kashmir
        </p>
      </div>
    </motion.footer>
  );
};

export default BrandingFooter;
