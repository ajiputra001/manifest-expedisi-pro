import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import Swal from 'sweetalert2';
import moment from 'moment';
import { Trophy, Users, UserCheck, Flame, CircleDashed, Check, X } from 'lucide-react';

const AdminPanel = () => {
    const queryClient = useQueryClient();

    const { data: usersData = [], isLoading: loadingUsers } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        }
    });

    const { data: leaderboardData = [], isLoading: loadingLeaderboard } = useQuery({
        queryKey: ['leaderboard'],
        queryFn: async () => {
            const startOfMonth = moment().startOf('month').toISOString();
            const { data: packages, error: pkgError } = await supabase.from('packages').select('user_id').gte('timestamp', startOfMonth);
            if (pkgError) throw pkgError;

            const counts = {};
            packages.forEach(p => {
                if (!p.user_id) return;
                counts[p.user_id] = (counts[p.user_id] || 0) + 1;
            });

            return usersData
                .filter(u => u.status === 'approved' && u.role === 'operator')
                .map(u => ({ ...u, count: counts[u.id] || 0 }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);
        },
        enabled: usersData.length > 0
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }) => {
            const { error } = await supabase.from('users').update({ status }).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            Swal.fire({icon: 'success', title: 'Berhasil', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, background: '#18181b', color: '#fff'});
        }
    });

    const pendingUsers = usersData.filter(u => u.status === 'pending');
    const activeUsers = usersData.filter(u => u.status === 'approved');

    const handleApprove = (id) => updateStatusMutation.mutate({ id, status: 'approved' });
    const handleReject = (id) => updateStatusMutation.mutate({ id, status: 'rejected' });

    return (
        <div className="space-y-6 fade-in">
            {/* Leaderboard */}
            <div className="bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/60 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 group-hover:bg-emerald-500/10 transition-colors pointer-events-none"></div>
                <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                        <Trophy className="text-emerald-500 w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white tracking-widest uppercase">Peringkat Toko/Seller Terbaik</h2>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Kinerja Bulan Ini</p>
                    </div>
                </div>
                <div className="overflow-x-auto relative z-10">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-900/50 border-b border-zinc-800/80">
                                <th className="px-6 py-4 text-[10px] font-black tracking-widest text-zinc-500 uppercase w-16 text-center">Rank</th>
                                <th className="px-6 py-4 text-[10px] font-black tracking-widest text-zinc-500 uppercase">Nama Toko/Seller</th>
                                <th className="px-6 py-4 text-[10px] font-black tracking-widest text-zinc-500 uppercase text-right">Total Resi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {loadingLeaderboard ? (
                                <tr><td colSpan="3" className="p-6 text-center text-zinc-500 text-xs italic"><CircleDashed className="animate-spin text-emerald-500 mb-2 w-5 h-5 mx-auto" />Memuat peringkat...</td></tr>
                            ) : leaderboardData.length === 0 ? (
                                <tr><td colSpan="3" className="p-6 text-center text-zinc-500 text-xs italic">Belum ada data resi bulan ini.</td></tr>
                            ) : leaderboardData.map((user, index) => {
                                const isTop1 = index === 0;
                                return (
                                    <tr key={user.id} className="hover:bg-zinc-800/30 transition-colors group/row">
                                        <td className="px-5 py-4 text-center align-middle">
                                            {isTop1 ? (
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 mx-auto"><Trophy className="w-4 h-4" /></div>
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400 font-bold border border-zinc-700/50 mx-auto">{index + 1}</div>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 align-middle">
                                            <div className="flex flex-col">
                                                <span className={`${isTop1 ? 'text-amber-500 font-black' : 'text-white font-bold'} text-sm flex items-center gap-2`}>
                                                    {user.name} {isTop1 && <Flame className="text-amber-500 w-4 h-4 drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]" />}
                                                </span>
                                                <span className="text-[10px] text-zinc-500 font-medium">@{user.username}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right align-middle">
                                            <div className="inline-flex items-center justify-center bg-zinc-800/80 border border-zinc-700/50 rounded-xl px-4 py-2 group-hover/row:border-emerald-500/30 transition-colors">
                                                <span className="font-black text-emerald-400 text-sm drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">{user.count}</span>
                                                <span className="text-[10px] text-zinc-500 ml-2 uppercase font-bold tracking-wider">Resi</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pending Users */}
            <div className="bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/60 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-orange-600/10 border border-orange-600/30 flex items-center justify-center">
                        <Users className="text-orange-500 w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white tracking-widest uppercase">Menunggu Persetujuan</h2>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Pengguna yang belum aktif ({pendingUsers.length})</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-900/50 border-b border-zinc-800/80">
                                <th className="px-6 py-4 text-[10px] font-black tracking-widest text-zinc-500 uppercase">Nama & Username</th>
                                <th className="px-6 py-4 text-[10px] font-black tracking-widest text-zinc-500 uppercase">Info</th>
                                <th className="px-6 py-4 text-[10px] font-black tracking-widest text-zinc-500 uppercase w-32 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {pendingUsers.length === 0 && <tr><td colSpan="3" className="p-6 text-center text-zinc-500 text-xs italic">Tidak ada antrean.</td></tr>}
                            {pendingUsers.map(u => (
                                <tr key={u.id}>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-white">{u.name}</p>
                                        <p className="text-xs text-zinc-500">@{u.username}</p>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-zinc-400">
                                        <p>{u.phone}</p>
                                        <p className="truncate w-48">{u.address}</p>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleApprove(u.id)} className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-colors"><Check className="w-4 h-4" /></button>
                                            <button onClick={() => handleReject(u.id)} className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-colors"><X className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Active Users */}
            <div className="bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/60 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                        <UserCheck className="text-emerald-500 w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white tracking-widest uppercase">Daftar Pengguna Aktif</h2>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Pengguna yang sudah diizinkan ({activeUsers.length})</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-900/50 border-b border-zinc-800/80">
                                <th className="px-6 py-4 text-[10px] font-black tracking-widest text-zinc-500 uppercase">Nama & Username</th>
                                <th className="px-6 py-4 text-[10px] font-black tracking-widest text-zinc-500 uppercase">Role</th>
                                <th className="px-6 py-4 text-[10px] font-black tracking-widest text-zinc-500 uppercase w-24 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {activeUsers.map(u => (
                                <tr key={u.id}>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-white">{u.name}</p>
                                        <p className="text-xs text-zinc-500">@{u.username}</p>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-bold uppercase text-zinc-300">{u.role}</td>
                                    <td className="px-6 py-4 text-right">
                                        {u.role !== 'developer' && <button onClick={() => handleReject(u.id)} className="text-rose-500 hover:text-rose-400 text-xs font-bold uppercase tracking-wider">Nonaktifkan</button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
