import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, User } from 'lucide-react';
import { MASTER_COURIERS } from '../services/api';

const Topbar = ({ onOpenSidebar }) => {
  const { currentUser } = useAuth();
  const location = useLocation();

  const getTitle = () => {
    if (location.pathname === '/') return 'Ringkasan Toko';
    if (location.pathname === '/admin') return 'Admin Panel';
    if (location.pathname.includes('/expedition/')) {
        const id = location.pathname.split('/expedition/')[1];
        return MASTER_COURIERS[id]?.name || 'Ekspedisi';
    }
    return 'Dashboard';
  };

  return (
    <header className="h-[72px] min-h-[72px] px-4 md:px-8 flex items-center justify-between border-b border-white/5 bg-white/[0.01] backdrop-blur-xl relative z-20">
      <div className="flex items-center gap-4">
        <button onClick={onOpenSidebar} className="md:hidden text-zinc-400 hover:text-white p-2">
            <Menu className="w-5 h-5" />
        </button>
        <div className="hidden md:flex flex-col">
          <h2 className="text-lg font-black text-white tracking-wide">{getTitle()}</h2>
          <div className="text-[10px] text-amber-500 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Live System
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 pl-4 border-l border-white/5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <User className="text-white w-5 h-5" />
          </div>
          <div className="hidden md:block text-right">
            <p className="text-sm font-bold text-white leading-tight">{currentUser?.name || currentUser?.username || 'Loading...'}</p>
            <p className="text-[10px] text-zinc-500 tracking-wider uppercase">{currentUser?.role === 'operator' ? 'Toko/Seller' : (currentUser?.role || 'Mitra Logistik')}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
