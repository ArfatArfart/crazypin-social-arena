import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 shadow-xl", className)}
    >
      {children}
    </motion.div>
  );
}

export function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  className,
  icon: Icon,
  disabled
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  className?: string;
  icon?: LucideIcon;
  disabled?: boolean;
}) {
  const variants = {
    primary: "bg-violet-600 hover:bg-violet-500 text-white",
    secondary: "bg-white/10 hover:bg-white/20 text-white",
    ghost: "bg-transparent hover:bg-white/5 text-white/70 hover:text-white",
    danger: "bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/50"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
    >
      {Icon && <Icon size={18} />}
      {children}
    </motion.button>
  );
}

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-violet-500/20 text-violet-400 border border-violet-500/30", className)}>
      {children}
    </span>
  );
}
