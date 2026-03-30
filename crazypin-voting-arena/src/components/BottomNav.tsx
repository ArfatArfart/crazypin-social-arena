import React from 'react';
import { Home, BarChart2, Trophy, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Arena' },
    { id: 'results', icon: Trophy, label: 'Hall of Fame' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-[260px] px-4">
      <div className="flex items-center justify-around bg-[#0f0f0f]/90 border border-white/5 px-2 py-2 rounded-full shadow-xl backdrop-blur-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative w-12 h-12 flex items-center justify-center transition-all duration-300 rounded-full group"
            >
              <div className={`relative z-10 transition-all duration-300 ${isActive ? 'text-white scale-110' : 'text-zinc-600 scale-100 group-hover:text-zinc-400'}`}>
                <Icon 
                  size={20} 
                  strokeWidth={isActive ? 2.5 : 2} 
                />
              </div>
              {isActive && (
                <motion.div 
                  layoutId="activeIndicator"
                  className="absolute -bottom-1 w-1 h-1 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
