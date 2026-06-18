import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { trackResi, getStatusCategory, MASTER_COURIERS, normalizeExpedition } from '../services/api';
import moment from 'moment';
import Swal from 'sweetalert2';
import { Barcode, Search, Plus, QrCode, FileDown, Calendar, ChevronDown, Package, History, Trash2, PackageOpen, XCircle, Copy, RefreshCw } from 'lucide-react';
import TrackingModal from '../components/TrackingModal';
import { playSystemSound } from '../utils/audio';
import ScannerCamera from '../components/expedition/ScannerCamera';
import { motion, AnimatePresence } from 'framer-motion';

const validateResiPrefix = (resi, courier) => {
    if (!resi || !courier) return true;
    const upperResi = resi.toUpperCase();
    const c = courier.toUpperCase();
    
    if (c === 'SPX' && !upperResi.startsWith('SPXID')) return false;
    if (c === 'JNT' && !upperResi.startsWith('JX')) return false;
    if (c === 'JNE' && !upperResi.startsWith('CM')) return false;
    if (c === 'SICEPAT' && !upperResi.startsWith('004')) return false;
    if (c === 'POS' && !upperResi.startsWith('SHPE')) return false;
    if (c === 'IDE' && !upperResi.startsWith('IDS')) return false;
    if (c === 'ANTERAJA' && !(upperResi.startsWith('1000') || upperResi.startsWith('1100'))) return false;
    
    return true;
};

const Expedition = () => {
    const { courierId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const filterParam = searchParams.get('filter') || 'SEMUA';
    const searchParam = searchParams.get('search') || '';
    
    const { currentUser } = useAuth();
    const queryClient = useQueryClient();
    const [awb, setAwb] = useState('');
    const [filterDate, setFilterDate] = useState(moment().format('YYYY-MM-DD'));
    const [scannerActive, setScannerActive] = useState(false);
    const scannerRef = useRef(null);
    const [trackModal, setTrackModal] = useState({ isOpen: false, resi: null, courier: null });

    const courierName = MASTER_COURIERS[courierId]?.name || 'Ekspedisi';

    const { data: packages = [] } = useQuery({
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

    const packagesRef = useRef(packages);
    useEffect(() => { packagesRef.current = packages; }, [packages]);
    const lastScannedRef = useRef(null);

    const addResiMutation = useMutation({
        mutationFn: async (newAwb) => {
            let apiRes;
            let apiStatus = "PROSES";
            let hasApiError = false;
            let apiMessage = '';

            try {
                apiRes = await trackResi(courierId, newAwb);
                if (apiRes.status === 200) {
                    apiStatus = apiRes.data?.summary?.status?.toUpperCase() || "PROSES";
                    
                    const category = getStatusCategory(apiStatus);
                    let isCancelled = category === 'RETUR' || apiStatus.includes('CANCEL');
                    
                    if (!isCancelled && apiRes.data?.history) {
                        for (let h of apiRes.data.history) {
                            const desc = (h.desc || '').toUpperCase();
                            if (desc.includes('CANCEL') || desc.includes('BATAL') || desc.includes('RETUR')) {
                                isCancelled = true;
                                apiStatus = desc; // Gunakan deskripsi pembatalan
                                break;
                            }
                        }
                    }

                    if (isCancelled) {
                        const err = new Error(apiStatus); // Status pembatalan sebagai message
                        err.isCancelError = true;
                        err.resi = newAwb;
                        throw err;
                    }

                    // Cek apakah resi sudah jalan
                    let isAlreadyMoved = false;
                    let movedStatus = '';
                    
                    if (!isCancelled && apiRes.data?.history && apiRes.data.history.length > 0) {
                        const latestDesc = (apiRes.data.history[0].desc || '').toUpperCase();
                        
                        const movingKeywords = [
                            'DC_', 'DC ', 'DIBERANGKATKAN', 'TIBA DI', 'MENUJU', 'KELUAR DARI', 
                            'TRANSIT', 'SORTIR', 'SORTATION', 'HUB', 'GATEWAY', 'SEDANG DIKIRIM', 
                            'DIKIRIMKAN KE', 'PERJALANAN', 'TELAH DITERIMA OLEH DC'
                        ];
                        
                        if (movingKeywords.some(kw => latestDesc.includes(kw))) {
                            isAlreadyMoved = true;
                            movedStatus = latestDesc;
                        } else if (courierId.toUpperCase() === 'JNT') {
                            // Sesuai instruksi: hanya izinkan jika status terakhirnya "MANIFES" doang
                            if (!latestDesc.includes('MANIFES')) {
                                isAlreadyMoved = true;
                                movedStatus = latestDesc;
                            }
                        } else if (courierId.toUpperCase() === 'SPX' || courierId.toUpperCase().includes('SHOPEE')) {
                            // Sesuai instruksi: hanya izinkan SPX jika status terakhirnya "CREATED"
                            if (!latestDesc.includes('CREATED')) {
                                isAlreadyMoved = true;
                                movedStatus = latestDesc;
                            }
                        }
                    }

                    if (isAlreadyMoved) {
                        const err = new Error(movedStatus);
                        err.isMovedError = true;
                        err.resi = newAwb;
                        throw err;
                    }
                } else {
                    hasApiError = true;
                    apiMessage = apiRes.message || 'Gagal melacak resi';
                }
            } catch (err) {
                if (err.isCancelError || err.isMovedError) {
                    throw err; // Lempar ke onError agar tidak disimpan
                }
                hasApiError = true;
                apiMessage = err.message || 'Gagal melacak resi';
                console.warn('Disimpan offline:', apiMessage);
            }

            const newId = 'pkg_' + Math.random().toString(36).substr(2, 9);
            const newResi = {
                id: newId,
                user_id: currentUser.id,
                resi: newAwb,
                expedition: courierId,
                expeditionName: courierName,
                pickupstatus: apiStatus,
                timestamp: moment().toISOString(),
                scannedat: moment().toISOString()
            };

            const { data, error } = await supabase.from('packages').insert([newResi]).select();
            if (error) throw error;
            return { ...data[0], hasApiError, apiMessage };
        },
        onSuccess: (data) => {
            if (data.hasApiError) {
                playSystemSound('error');
                Swal.fire({icon: 'warning', title: 'Tersimpan Offline', text: data.apiMessage, toast: true, position: 'top-end', showConfirmButton: false, timer: 4000, background: '#18181b', color: '#f59e0b'});
            } else {
                playSystemSound('success');
                Swal.fire({icon: 'success', title: 'Tersimpan!', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, background: '#18181b', color: '#fff'});
            }
            queryClient.invalidateQueries({ queryKey: ['packages'] });
            setAwb('');
        },
        onError: (err) => {
            playSystemSound('error');
            
            if (err.isCancelError) {
                Swal.fire({ 
                    icon: 'warning', 
                    title: 'Resi Ditolak!', 
                    html: `<div class="text-sm mt-2 text-zinc-400 text-left space-y-2"><p>Nomor resi <strong class="text-rose-500 tracking-wider">${err.resi}</strong> langsung ditolak oleh sistem karena terdeteksi bermasalah.</p><div class="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl mt-3"><p class="text-[10px] uppercase text-rose-500 font-bold mb-1">Keterangan:</p><p class="text-rose-400 font-black tracking-wide">${err.message}</p></div></div>`,
                    background: '#18181b', 
                    color: '#fff',
                    confirmButtonColor: '#f59e0b' 
                });
            } else if (err.isMovedError) {
                Swal.fire({ 
                    icon: 'warning', 
                    title: 'Sudah Berjalan (Double)!', 
                    html: `<div class="text-sm mt-2 text-zinc-400 text-left space-y-2"><p>Nomor resi <strong class="text-amber-500 tracking-wider">${err.resi}</strong> ditolak karena terdeteksi sudah jalan atau discan di tempat lain.</p><div class="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl mt-3"><p class="text-[10px] uppercase text-amber-500 font-bold mb-1">Status Terkini:</p><p class="text-amber-400 font-black tracking-wide">${err.message}</p></div></div>`,
                    background: '#18181b', 
                    color: '#fff',
                    confirmButtonColor: '#f59e0b' 
                });
            } else {
                Swal.fire({ 
                    icon: 'error', 
                    title: 'Gagal Menyimpan', 
                    text: err.message, 
                    background: '#18181b', 
                    color: '#ef4444' 
                });
            }
        }
    });

    const addResiMutationRef = useRef(addResiMutation);
    useEffect(() => { addResiMutationRef.current = addResiMutation; }, [addResiMutation]);
    const refreshResiMutation = useMutation({
        mutationFn: async ({ id, resi, courier }) => {
            const apiRes = await trackResi(courier, resi, true);
            if (apiRes.status !== 200) {
                throw new Error(apiRes.message || 'Gagal melacak resi');
            }
            const apiStatus = apiRes.data?.summary?.status?.toUpperCase() || "PROSES";
            
            const { error } = await supabase.from('packages')
                .update({ pickupstatus: apiStatus, timestamp: moment().toISOString() })
                .eq('id', id);
            
            if (error) throw error;
            return { status: apiStatus };
        },
        onSuccess: (data) => {
            playSystemSound('success');
            queryClient.invalidateQueries({ queryKey: ['packages'] });
            Swal.fire({icon: 'success', title: 'Tersinkronisasi!', text: `Status terbaru: ${data.status}`, toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, background: '#18181b', color: '#10b981'});
        },
        onError: (err) => {
            playSystemSound('error');
            Swal.fire({ icon: 'error', title: 'Gagal Sinkronisasi', text: err.message, background: '#18181b', color: '#ef4444' });
        }
    });

    const deleteResiMutation = useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase.from('packages').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['packages'] });
            Swal.fire({icon: 'success', title: 'Terhapus!', toast: true, position: 'top-end', showConfirmButton: false, timer: 1000, background: '#18181b', color: '#fff'});
        }
    });

    const handleCopy = (e, resi) => {
        e.stopPropagation();
        navigator.clipboard.writeText(resi);
        Swal.fire({icon: 'success', title: 'Resi disalin!', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, background: '#18181b', color: '#10b981'});
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const upperAwb = awb.trim().toUpperCase();

        if (!validateResiPrefix(upperAwb, courierId)) {
            playSystemSound('error');
            Swal.fire({
                icon: 'error',
                title: 'Salah Ekspedisi!',
                text: `Resi ${upperAwb} bukan milik ${courierName}. Pastikan input di menu yang tepat!`,
                background: '#18181b', color: '#fff', confirmButtonColor: '#ef4444'
            });
            return;
        }

        const existing = packages.find(item => item.resi === upperAwb && item.expedition === courierId);
        if (existing) {
            playSystemSound('double');
            Swal.fire({ 
                icon: 'warning', 
                title: 'Resi Sudah Terdaftar!', 
                html: `<div class="text-sm mt-2 text-zinc-400 text-left space-y-2"><p>Nomor resi <strong class="text-amber-500 tracking-wider">${upperAwb}</strong> sudah ada dalam sistem.</p><p>Tanggal Input: <strong class="text-white">${moment(existing.scannedat || existing.timestamp).format('DD MMM YYYY, HH:mm')}</strong></p><p>Status Terakhir: <strong class="text-white">${existing.pickupstatus || 'PROSES'}</strong></p></div>`, 
                background: '#18181b', 
                color: '#fff',
                confirmButtonColor: '#f59e0b'
            });
            return;
        }
        Swal.fire({ title: 'Verifikasi...', background: '#18181b', color: '#fff', allowOutsideClick: false, didOpen: () => { Swal.showLoading() } });
        addResiMutation.mutate(upperAwb);
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Hapus Resi?', text: "Data tidak bisa dikembalikan!", icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#3f3f46', confirmButtonText: 'Ya, Hapus!', background: '#18181b', color: '#fff'
        }).then((result) => {
            if (result.isConfirmed) deleteResiMutation.mutate(id);
        });
    };

    const handleScanSuccess = (decodedText) => {
        if (decodedText === lastScannedRef.current) return;
        
        lastScannedRef.current = decodedText;
        setAwb(decodedText);
        
        const upperAwb = decodedText.trim().toUpperCase();

        if (!validateResiPrefix(upperAwb, courierId)) {
            playSystemSound('error');
            Swal.fire({
                icon: 'error',
                title: 'Salah Ekspedisi!',
                text: `Resi ${upperAwb} bukan milik ${courierName}.`,
                toast: true, position: 'top-end', showConfirmButton: false, timer: 4000,
                background: '#18181b', color: '#ef4444'
            });
            setTimeout(() => { lastScannedRef.current = null; }, 3000);
            return;
        }

        const existing = packagesRef.current.find(item => item.resi === upperAwb && item.expedition === courierId);
        
        if (existing) {
            playSystemSound('double');
            Swal.fire({ 
                icon: 'warning', 
                title: 'Resi Sudah Terdaftar!', 
                text: upperAwb,
                toast: true, position: 'top-end', showConfirmButton: false, timer: 3000,
                background: '#18181b', color: '#f59e0b'
            });
            setTimeout(() => { lastScannedRef.current = null; }, 3000);
            return;
        }

        playSystemSound('success');
        Swal.fire({title: `Memproses ${upperAwb}...`, toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, background: '#18181b', color: '#60a5fa'});
        
        if (addResiMutationRef.current) {
            addResiMutationRef.current.mutate(upperAwb);
        }
        
        // Allow scanning the same barcode again after 2 seconds
        setTimeout(() => { lastScannedRef.current = null; }, 2000);
    };

    const filteredData = packages.filter(item => {
        if (!item.expedition || item.expedition.toUpperCase() !== courierId.toUpperCase()) return false;
        if (filterParam !== 'SEMUA' && getStatusCategory(item.pickupstatus) !== filterParam) return false;
        if (filterDate && moment(item.scannedat || item.timestamp).format('YYYY-MM-DD') !== filterDate) return false;
        if (searchParam && !item.resi.toUpperCase().includes(searchParam.toUpperCase())) return false;
        return true;
    });

    const exportToCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,Resi,Ekspedisi,Status,Tanggal\n";
        filteredData.forEach(row => {
            csvContent += `${row.resi},${row.expeditionName},${row.pickupstatus},${moment(row.timestamp).format('YYYY-MM-DD HH:mm')}\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Data_Resi_${courierName}_${moment().format('YYYYMMDD')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const setFilter = (val) => {
        setSearchParams(prev => {
            prev.set('filter', val);
            return prev;
        });
    };

    const setSearch = (val) => {
        setSearchParams(prev => {
            if(val) prev.set('search', val);
            else prev.delete('search');
            return prev;
        });
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
        >
            <div className="bg-gradient-to-r from-amber-900/40 to-orange-900/20 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-amber-500/20 shadow-[0_10px_40px_rgba(245,158,11,0.1)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-amber-500/20 transition-all duration-700"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                            <Barcode className="text-white w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white tracking-tight">Input Resi Baru</h2>
                            <p className="text-[10px] text-amber-500/80 font-bold uppercase tracking-widest">{courierName}</p>
                        </div>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-zinc-500 w-5 h-5" />
                            <input type="text" value={awb} onChange={(e) => setAwb(e.target.value)} placeholder="Ketik / Scan nomor resi..." className="w-full pl-12 pr-4 py-4 bg-zinc-950/50 border border-amber-500/30 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none uppercase font-bold tracking-wider placeholder-zinc-600 text-white transition-all shadow-inner" required />
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" disabled={addResiMutation.isLoading} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-zinc-950 font-black px-8 py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] flex-1 sm:flex-none flex items-center justify-center gap-2 tracking-widest">
                                <Plus className="w-5 h-5" /> <span className="hidden sm:inline">SIMPAN</span>
                            </button>
                            <button type="button" onClick={() => setScannerActive(!scannerActive)} className={`px-6 py-4 rounded-2xl transition-all border flex items-center justify-center ${scannerActive ? 'bg-amber-500/20 text-amber-500 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'bg-zinc-800 text-white hover:bg-zinc-700 border-zinc-700'}`}>
                                <QrCode className={`w-5 h-5 ${scannerActive ? 'animate-pulse' : ''}`} />
                            </button>
                        </div>
                    </form>
                    
                    <AnimatePresence>
                        {scannerActive && (
                            <ScannerCamera 
                                onScanSuccess={handleScanSuccess} 
                                onClose={() => setScannerActive(false)} 
                            />
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="bg-white/[0.02] backdrop-blur-2xl rounded-3xl border border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden">
                <div className="p-5 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 bg-white/[0.01]">
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                        <div className="flex gap-1 bg-zinc-950/80 p-1.5 rounded-xl border border-white/5 overflow-x-auto max-w-full shadow-inner">
                            {['SEMUA', 'TERKIRIM', 'PROSES', 'RETUR'].map(f => (
                                <button key={f} onClick={() => setFilter(f)} className={filterParam === f ? "active bg-amber-500/20 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all"}>
                                    {f}
                                </button>
                            ))}
                        </div>
                        <button onClick={exportToCSV} className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-zinc-950 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all duration-300 text-xs font-bold tracking-wider flex items-center justify-center gap-2">
                            <FileDown className="w-4 h-4" /> EXPORT
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto flex-col sm:flex-row">
                        <div className="relative w-full sm:w-48">
                            <div className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-8 py-2 text-xs font-bold text-zinc-300 flex items-center shadow-inner relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 w-3 h-3 pointer-events-none" />
                                <span className="truncate pointer-events-none">{filterDate ? moment(filterDate).locale('id').format('DD MMM YYYY') : 'Pilih Tanggal...'}</span>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 w-3 h-3 pointer-events-none" />
                            </div>
                            <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                            {filterDate && (
                                <button onClick={() => setFilterDate('')} className="absolute right-8 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 hover:text-rose-500 transition-colors flex items-center justify-center z-10 bg-zinc-950">
                                    <XCircle className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                        
                        <div className="relative w-full sm:w-64">
                            <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                            <input type="text" value={searchParam} onChange={(e) => setSearch(e.target.value)} placeholder="CARI RESI..." className="w-full bg-zinc-950 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold tracking-[0.1em] text-zinc-200 focus:outline-none focus:border-amber-500/50 focus:shadow-[0_0_15px_rgba(245,158,11,0.1)] transition-all uppercase placeholder-zinc-600" />
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/5">
                                <th className="px-6 py-5 text-[10px] font-bold tracking-[0.15em] text-zinc-400 uppercase w-64">Informasi Resi</th>
                                <th className="px-6 py-5 text-[10px] font-bold tracking-[0.15em] text-zinc-400 uppercase">Status Perjalanan</th>
                                <th className="px-6 py-5 text-[10px] font-bold tracking-[0.15em] text-zinc-400 uppercase">Waktu & Durasi</th>
                                <th className="px-6 py-5 text-[10px] font-bold tracking-[0.15em] text-zinc-400 uppercase w-32 text-center">Indikator</th>
                                <th className="px-6 py-5 text-[10px] font-bold tracking-[0.15em] text-zinc-400 uppercase w-24 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredData.map(item => {
                                const cat = getStatusCategory(item.pickupstatus);
                                let badgeClass = 'border-amber-500/30 text-amber-500 bg-amber-500/10';
                                if(cat === 'TERKIRIM') badgeClass = 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'; 
                                else if(cat === 'RETUR') badgeClass = 'border-rose-500/30 text-rose-400 bg-rose-500/10';

                                const scannedTime = item.scannedat ? moment(item.scannedat) : moment(item.timestamp);
                                const updateTime = moment(item.timestamp);
                                const daysElapsed = Math.max(0, moment().diff(scannedTime, 'days'));
                                
                                const isError = cat === 'RETUR';
                                const rowClass = `transition-all duration-300 group ${isError ? 'bg-rose-950/10 hover:bg-rose-900/20 relative' : 'hover:bg-white/[0.04]'}`;
                                
                                return (
                                    <tr key={item.id} className={rowClass}>
                                        <td className="px-6 py-5 cursor-pointer" onClick={() => setTrackModal({ isOpen: true, resi: item.resi, courier: item.expedition })}>
                                            {isError && <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500 rounded-r shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>}
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 group-hover:border-amber-500/50 group-hover:bg-amber-500/10 transition-colors">
                                                    <Barcode className="w-5 h-5 text-zinc-500 group-hover:text-amber-500 transition-colors" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-black tracking-widest text-white text-sm group-hover:text-amber-400 transition-colors">{item.resi}</p>
                                                        <button onClick={(e) => handleCopy(e, item.resi)} className="text-zinc-500 hover:text-amber-500 transition-colors bg-white/[0.03] hover:bg-amber-500/10 p-1 rounded-md" title="Salin Resi">
                                                            <Copy className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                    <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mt-1 flex items-center gap-1.5">
                                                        <Package className="w-3 h-3 text-zinc-600" /> {courierName}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 cursor-pointer" onClick={() => setTrackModal({ isOpen: true, resi: item.resi, courier: item.expedition })}>
                                            <div className="flex flex-col gap-1.5">
                                                <p className={`text-xs font-bold uppercase truncate max-w-[200px] ${isError ? 'text-rose-400' : 'text-zinc-200'}`} title={item.pickupstatus || 'PROSES'}>{item.pickupstatus || 'PROSES'}</p>
                                                <p className={`text-[10px] font-medium flex items-center gap-1 ${isError ? 'text-rose-500/80' : 'text-amber-500/80'}`}>
                                                    Klik untuk lihat timeline lengkap
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                                                    <span>Input: <span className="text-zinc-200 font-medium">{scannedTime.format('DD MMM YYYY, HH:mm')}</span></span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                                                    <span>Update: <span className="text-zinc-200 font-medium">{updateTime.format('DD MMM YYYY, HH:mm')}</span></span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-1">
                                                    <History className="w-3 h-3 shrink-0" />
                                                    <span className="font-bold text-amber-500">{daysElapsed} Hari perjalanan</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest border shadow-sm ${badgeClass}`}>
                                                {cat}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); refreshResiMutation.mutate({ id: item.id, resi: item.resi, courier: item.expedition }); }} disabled={refreshResiMutation.isLoading} className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center disabled:opacity-50 hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:-translate-y-0.5" title="Lacak Ulang (Force Refresh)">
                                                    <RefreshCw className={`w-4 h-4 ${refreshResiMutation.isLoading && refreshResiMutation.variables?.id === item.id ? 'animate-spin' : ''}`} />
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center hover:shadow-[0_0_15px_rgba(244,63,94,0.4)] hover:-translate-y-0.5" title="Hapus">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {filteredData.length === 0 && (
                    <div className="p-16 text-center">
                        <PackageOpen className="w-12 h-12 text-zinc-800 mb-4 block mx-auto" />
                        <p className="text-zinc-500 font-medium">Belum ada data resi.</p>
                    </div>
                )}
            </div>

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

export default Expedition;
