import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MASTER_COURIERS, normalizeExpedition } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import moment from 'moment';
import { 
    LayoutDashboard, ShieldAlert, LogOut, Package, CheckCircle, Clock, XCircle, Menu, X, ChevronDown, Truck
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [openCourierMenu, setOpenCourierMenu] = useState(null);

    const { data: packages = [] } = useQuery({
        queryKey: ['packages'],
        queryFn: async () => {
            let query = supabase.from('packages').select('*').order('timestamp', { ascending: false }).limit(500);
            if (currentUser.role !== 'admin' && currentUser.role !== 'developer') {
                query = query.eq('user_id', currentUser.id);
            }
            const { data, error } = await query;
            if (error) throw error;
            return data;
        }
    });

    const getStatusCategory = (status) => {
        if (!status) return 'PROSES';
        const s = status.toUpperCase();
        if (s.includes('DELIVERED') || s.includes('TERKIRIM') || s.includes('SUCCESS')) return 'TERKIRIM';
        if (s.includes('RETUR') || s.includes('GAGAL') || s.includes('CANCEL') || s.includes('INVALID')) return 'RETUR';
        if (s.includes('DIKIRIM') || s.includes('DELIVERING') || s.includes('OUT FOR DELIVERY') || s.includes('KURIR') || s.includes('PERJALANAN')) return 'DIKIRIM';
        return 'PROSES';
    };

    const groupsData = {};
    const todayStr = moment().format('YYYY-MM-DD');

    packages.forEach(x => {
        const itemDate = moment(x.scannedat || x.timestamp).format('YYYY-MM-DD');
        if (itemDate !== todayStr) return; 

        let exp = normalizeExpedition(x.expedition || 'UNKNOWN');

        if(!groupsData[exp]) groupsData[exp] = { total: 0, delivered: 0, dikirim: 0, process: 0, retur: 0 };
        groupsData[exp].total++;
        const cat = getStatusCategory(x.pickupstatus);
        if(cat === 'TERKIRIM') groupsData[exp].delivered++;
        else if(cat === 'RETUR') groupsData[exp].retur++;
        else if(cat === 'DIKIRIM') groupsData[exp].dikirim++;
        else groupsData[exp].process++;
    });

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const closeOnMobile = () => {
        if (window.innerWidth < 768) {
            setIsOpen(false);
        }
    };

    const toggleCourier = (e, cId) => {
        e.preventDefault();
        e.stopPropagation();
        if (openCourierMenu === cId) {
            setOpenCourierMenu(null);
        } else {
            setOpenCourierMenu(cId);
        }
    };

    const isExpeditionActive = (cId) => location.pathname.includes(`/expedition/${cId}`);

    return (
        <aside className={`bg-white/[0.01] backdrop-blur-3xl border-r border-white/5 flex flex-col h-full absolute md:relative z-40 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-all duration-300 ease-out shadow-[4px_0_30px_rgba(0,0,0,0.3)] w-64 overflow-hidden`}>
            <div className="p-6 border-b border-white/5 flex justify-between items-center min-h-[72px] bg-white/[0.01]">
                <div className="flex items-center gap-4">
                    <div className="min-w-[32px] w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)] cursor-pointer hover:scale-105 transition-transform" onClick={() => setIsOpen(!isOpen)}>
                        <Menu className="text-white w-4 h-4" />
                    </div>
                    <h1 className="font-black text-xl tracking-tight text-white whitespace-nowrap overflow-hidden drop-shadow-md">LOGISTIK<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">PRO</span></h1>
                </div>
                <button onClick={() => setIsOpen(false)} className="md:hidden text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="overflow-y-auto flex-1 py-4 px-3 space-y-6 scrollbar-hide overflow-x-hidden">
                <div>
                    <p className="px-4 text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase mb-4 whitespace-nowrap">Dashboard</p>
                    <NavLink to="/" end onClick={closeOnMobile} className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative border border-transparent overflow-hidden ${isActive && !location.pathname.includes('expedition') ? 'bg-amber-500/10 text-amber-500 font-bold border-amber-500/20' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}>
                        <LayoutDashboard className="w-5 h-5 min-w-[20px]" />
                        <span className="text-sm whitespace-nowrap">Ringkasan Toko</span>
                    </NavLink>
                    
                    {(currentUser?.role === 'admin' || currentUser?.role === 'developer') && (
                        <NavLink to="/admin" onClick={closeOnMobile} className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 mt-2 group relative border border-transparent overflow-hidden ${isActive ? 'bg-amber-500/10 text-amber-500 font-bold border-amber-500/20' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}>
                            <ShieldAlert className="w-5 h-5 text-amber-500/70 group-hover:text-amber-500 min-w-[20px]" />
                            <span className="text-sm font-bold whitespace-nowrap">Admin Panel</span>
                        </NavLink>
                    )}
                </div>

                <div>
                    <p className="px-4 text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase mb-4 border-t border-white/5 pt-6 whitespace-nowrap">Order Menu</p>
                    <div className="space-y-1">
                        {Object.keys(MASTER_COURIERS).map(cId => {
                            const cName = MASTER_COURIERS[cId].name;
                            const data = groupsData[cId] || { total: 0, delivered: 0, process: 0, retur: 0 };
                            const isActive = isExpeditionActive(cId);
                            const isOpenMenu = openCourierMenu === cId || isActive;
                            
                            return (
                                <div key={cId} className="flex flex-col relative group">
                                    <button onClick={(e) => toggleCourier(e, cId)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 overflow-hidden ${isActive ? 'bg-zinc-800/80 text-white font-bold' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'}`}>
                                        <div className="flex items-center gap-3">
                                            <Truck className="w-4 h-4 min-w-[20px]" />
                                            <span className="text-sm whitespace-nowrap">{cName}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {data.total > 0 && <span className="bg-amber-500 text-zinc-900 text-[10px] font-black px-2 py-0.5 rounded-full">{data.total}</span>}
                                            <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isOpenMenu ? 'rotate-180' : ''}`} />
                                        </div>
                                    </button>
                                    <div className={`overflow-hidden transition-all duration-300 ${isOpenMenu ? 'max-h-48 mt-1 opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <div className="pl-11 pr-3 py-2 space-y-2 border-l border-zinc-800 ml-5">
                                            <div onClick={() => { navigate(`/expedition/${cId}`); closeOnMobile(); }} className="flex items-center justify-between text-xs text-zinc-500 cursor-pointer hover:text-white">
                                                <span>Semua</span>
                                                {data.total > 0 && <span className="bg-white/20 text-white px-1.5 rounded text-[9px]">{data.total}</span>}
                                            </div>
                                            <div onClick={() => { navigate(`/expedition/${cId}?filter=PROSES`); closeOnMobile(); }} className="flex items-center justify-between text-xs text-zinc-500 cursor-pointer hover:text-amber-400">
                                                <span>Proses</span>
                                                {data.process > 0 && <span className="bg-amber-500/20 text-amber-400 px-1.5 rounded text-[9px]">{data.process}</span>}
                                            </div>
                                            <div onClick={() => { navigate(`/expedition/${cId}?filter=DIKIRIM`); closeOnMobile(); }} className="flex items-center justify-between text-xs text-zinc-500 cursor-pointer hover:text-blue-400">
                                                <span>Dikirim</span>
                                                {data.dikirim > 0 && <span className="bg-blue-500/20 text-blue-400 px-1.5 rounded text-[9px]">{data.dikirim}</span>}
                                            </div>
                                            <div onClick={() => { navigate(`/expedition/${cId}?filter=TERKIRIM`); closeOnMobile(); }} className="flex items-center justify-between text-xs text-zinc-500 cursor-pointer hover:text-emerald-400">
                                                <span>Terkirim</span>
                                                {data.delivered > 0 && <span className="bg-emerald-500/20 text-emerald-400 px-1.5 rounded text-[9px]">{data.delivered}</span>}
                                            </div>
                                            <div onClick={() => { navigate(`/expedition/${cId}?filter=RETUR`); closeOnMobile(); }} className="flex items-center justify-between text-xs text-zinc-500 cursor-pointer hover:text-rose-400">
                                                <span>Retur</span>
                                                {data.retur > 0 && <span className="bg-rose-500/20 text-rose-400 px-1.5 rounded text-[9px]">{data.retur}</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            
            <div className="p-4 border-t border-white/5">
                <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all font-bold text-sm overflow-hidden" title="Keluar">
                    <LogOut className="w-5 h-5 min-w-[20px]" /> <span className="whitespace-nowrap">Keluar</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
