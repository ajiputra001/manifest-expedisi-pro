import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { getStatusCategory, getCourierName, normalizeExpedition } from '../services/api';
import moment from 'moment';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Sparkles, PackageOpen, CheckCircle, Truck, AlertTriangle, Clock, BarChart3, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import TrackingModal from '../components/TrackingModal';
import { motion } from 'framer-motion';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const Dashboard = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [trackModal, setTrackModal] = useState({ isOpen: false, resi: null, courier: null });

    const handleCopy = (e, resi) => {
        e.stopPropagation();
        navigator.clipboard.writeText(resi);
        Swal.fire({icon: 'success', title: 'Resi disalin!', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, background: '#18181b', color: '#10b981'});
    };

    const { data: packages = [], isLoading } = useQuery({
        queryKey: ['packages'],
        queryFn: async () => {
            let query = supabase.from('packages').select('*').order('timestamp', { ascending: false }).limit(500);
            if (currentUser.role !== 'admin' && currentUser.role !== 'developer') {
                query = query.eq('user_id', currentUser.id);
            }
            const { data, error } = await query;
            if (error) throw error;
            return data.map(item => ({ ...item, expedition: normalizeExpedition(item.expedition) }));
        }
    });

    const todayStr = moment().format('YYYY-MM-DD');
    const todayPackages = packages.filter(item => moment(item.timestamp).format('YYYY-MM-DD') === todayStr);

    const total = todayPackages.length;
    const delivered = todayPackages.filter(d => getStatusCategory(d.pickupstatus) === 'TERKIRIM').length;
    const problem = todayPackages.filter(d => getStatusCategory(d.pickupstatus) === 'RETUR').length;
    const process = total - delivered - problem;

    const recentData = todayPackages.slice(0, 8);

    const doughnutData = {
        labels: ['Terkirim', 'Diproses', 'Bermasalah'],
        datasets: [{
            data: [delivered, process, problem],
            backgroundColor: ['#10b981', '#f59e0b', '#f43f5e'],
            borderWidth: 0, 
            hoverOffset: 5
        }]
    };

    const last7Days = Array.from({length: 7}, (_, i) => moment().subtract(6 - i, 'days').format('YYYY-MM-DD'));
    const displayLabels = last7Days.map(date => moment(date).format('DD MMM'));
    const dailyData = last7Days.map(date => packages.filter(item => moment(item.timestamp).format('YYYY-MM-DD') === date).length);

    const barData = {
        labels: displayLabels,
        datasets: [{
            label: 'Resi Diinput',
            data: dailyData,
            backgroundColor: 'rgba(245, 158, 11, 0.8)',
            borderRadius: 8,
            barPercentage: 0.6
        }]
    };

    if (isLoading) return <div className="animate-pulse flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            {/* Welcome Banner */}
            <motion.div variants={itemVariants} className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-900/40 via-zinc-900/80 to-zinc-950 border border-amber-500/20 p-8 shadow-2xl group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-amber-500/20 transition-all duration-700"></div>
                <Truck className="absolute -right-6 -bottom-10 w-48 h-48 text-amber-500/5 -rotate-12 group-hover:rotate-0 transition-all duration-700" />
                <div className="relative z-10">
                    <h2 className="text-2xl font-black text-white tracking-tight mb-2 flex items-center gap-2">
                        Selamat Datang, <span className="text-amber-500">{currentUser?.name || currentUser?.username}</span>! 
                        <Sparkles className="text-amber-400 w-5 h-5" />
                    </h2>
                    <p className="text-zinc-400 text-sm max-w-xl leading-relaxed">Pantau terus pergerakan paket dan kinerja toko Anda hari ini. Semua data tersinkronisasi secara langsung (real-time) dengan server.</p>
                </div>
            </motion.div>

            {/* Stat Cards */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                    { label: 'Semua Resi', value: total, icon: PackageOpen, color: 'zinc', shadow: 'from-zinc-800 to-zinc-900', badge: 'Hari Ini' },
                    { label: 'Terkirim', value: delivered, icon: CheckCircle, color: 'emerald', shadow: 'from-zinc-800 to-zinc-900' },
                    { label: 'Diproses', value: process, icon: Truck, color: 'amber', shadow: 'from-zinc-800 to-zinc-900' },
                    { label: 'Bermasalah', value: problem, icon: AlertTriangle, color: 'rose', shadow: 'from-zinc-800 to-zinc-900' },
                ].map((stat, i) => (
                    <motion.div whileHover={{ scale: 1.02 }} key={i} className={`bg-zinc-900/60 backdrop-blur-md rounded-3xl border border-zinc-800/50 p-6 shadow-xl relative overflow-hidden group hover:border-${stat.color}-500/30 transition-all duration-500`}>
                        <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${stat.color}-500/10 rounded-full blur-2xl group-hover:bg-${stat.color}-500/20 transition-all duration-500`}></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.shadow} flex items-center justify-center border border-zinc-700/50 shadow-inner group-hover:border-${stat.color}-500/30 transition-colors`}>
                                <stat.icon className={`text-zinc-400 group-hover:text-${stat.color}-500 w-6 h-6 transition-colors`} />
                            </div>
                            {stat.badge && <span className="bg-zinc-800/80 text-zinc-300 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest border border-zinc-700">{stat.badge}</span>}
                        </div>
                        <h3 className="text-4xl font-black text-white mb-1 tracking-tight relative z-10">{stat.value}</h3>
                        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest relative z-10">{stat.label}</p>
                    </motion.div>
                ))}
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2 bg-zinc-900/40 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-zinc-800/50 shadow-xl flex flex-col">
                    <h3 className="font-black text-lg text-white mb-6 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center"><Clock className="w-4 h-4 text-blue-400" /></div>
                        Resi Terbaru Hari Ini
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-[10px] text-zinc-500 uppercase bg-zinc-900/50 tracking-wider">
                                <tr><th className="px-5 py-3 rounded-l-xl">Ekspedisi & Resi</th><th className="px-5 py-3 rounded-r-xl text-right">Status Terkini</th></tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {recentData.length === 0 ? (
                                    <tr><td colSpan="2" className="p-6 text-center text-zinc-500 text-xs italic">Belum ada data hari ini.</td></tr>
                                ) : recentData.map((item, i) => {
                                    const cat = getStatusCategory(item.pickupstatus);
                                    let badgeClass = 'bg-amber-500/20 text-amber-400'; 
                                    if(cat === 'TERKIRIM') badgeClass = 'bg-emerald-500/20 text-emerald-400';
                                    else if(cat === 'RETUR') badgeClass = 'bg-rose-500/20 text-rose-400';
                                    
                                    return (
                                        <tr key={i} className="hover:bg-zinc-800/40 cursor-pointer transition-colors group" onClick={() => setTrackModal({ isOpen: true, resi: item.resi, courier: item.expedition })}>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-black tracking-widest text-white text-xs group-hover:text-amber-400 transition-colors">{item.resi}</p>
                                                    <button onClick={(e) => handleCopy(e, item.resi)} className="text-zinc-500 hover:text-amber-500 transition-colors bg-white/[0.03] hover:bg-amber-500/10 p-1 rounded-md" title="Salin Resi">
                                                        <Copy className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <p className="text-[9px] text-zinc-500 uppercase mt-0.5">{getCourierName(item.expedition)}</p>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`px-2 py-1 rounded text-[9px] font-black tracking-wider ${badgeClass}`}>{cat}</span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="bg-zinc-900/40 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-zinc-800/50 shadow-xl flex flex-col items-center">
                    <h3 className="font-black text-lg text-white mb-6 w-full text-center">Rasio Pengiriman</h3>
                    <div className="w-full h-48 relative flex justify-center items-center">
                        <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, cutout: '78%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, color: '#a1a1aa', font: { weight: 'bold', size: 10 } } } } }} />
                    </div>
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-zinc-900/40 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-zinc-800/50 shadow-xl flex flex-col relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-amber-500/10 transition-colors"></div>
                <h3 className="font-black text-lg text-white mb-6 flex items-center gap-3 relative z-10">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center"><BarChart3 className="w-4 h-4 text-amber-500" /></div>
                    Kinerja Input Resi (7 Hari Terakhir)
                </h3>
                <div className="w-full h-64 relative flex justify-center items-center z-10">
                    <Bar data={barData} options={{ maintainAspectRatio: false, scales: { y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#a1a1aa', stepSize: 1 } }, x: { grid: { display: false }, ticks: { color: '#a1a1aa', font: { size: 10 } } } }, plugins: { legend: { display: false } } }} />
                </div>
            </motion.div>

            {trackModal.isOpen && (
                <TrackingModal 
                    resi={trackModal.resi} 
                    courier={trackModal.courier} 
                    onClose={() => setTrackModal({ isOpen: false, resi: null, courier: null })} 
                />
            )}
        </motion.div>
    );
};

export default Dashboard;
