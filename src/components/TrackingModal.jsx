import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, MapPin, Truck, CheckCircle, Package, AlertTriangle, AlertOctagon } from 'lucide-react';
import { trackResi, getCourierName, getStatusCategory } from '../services/api';
import moment from 'moment';

const TrackingModal = ({ resi, courier, onClose }) => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['tracking', courier, resi],
        queryFn: () => trackResi(courier, resi),
        enabled: !!resi && !!courier
    });

    if (!resi) return null;

    const history = data?.data?.history || [];
    const summary = data?.data?.summary || {};

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center transition-opacity duration-300" onClick={onClose}>
            <div className="bg-zinc-900 border border-zinc-800 w-full md:max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl p-8 relative max-h-[85vh] overflow-y-auto transform md:scale-95 transition-transform duration-300 scrollbar-hide fade-in" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-6 md:hidden"></div>
                <button onClick={onClose} className="absolute top-6 right-6 text-zinc-500 hover:text-white text-xl bg-zinc-800/50 w-8 h-8 rounded-full hidden md:flex items-center justify-center transition-all">
                    <X className="w-4 h-4" />
                </button>
                
                <h3 className="text-2xl font-black mb-1 text-white pr-8 tracking-tight">{resi}</h3>
                <p className="text-[10px] font-bold text-amber-500 mb-8 uppercase tracking-[0.2em]">{getCourierName(courier)}</p>

                {isLoading && (
                    <div className="animate-pulse space-y-6">
                        <div className="flex gap-4"><div className="w-6 h-6 bg-zinc-800 rounded-full shrink-0"></div><div className="h-4 bg-zinc-800 rounded-xl w-full mt-1"></div></div>
                        <div className="flex gap-4"><div className="w-6 h-6 bg-zinc-800 rounded-full shrink-0"></div><div className="h-4 bg-zinc-800 rounded-xl w-2/3 mt-1"></div></div>
                    </div>
                )}

                {error && (
                    <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center">
                        <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
                        <p className="text-rose-400 text-sm font-medium">{error.message || 'Gagal melacak resi'}</p>
                    </div>
                )}

                {!isLoading && !error && history.length === 0 && (
                    <div className="p-6 text-center">
                        <Package className="w-12 h-12 text-zinc-800 mx-auto mb-3" />
                        <p className="text-zinc-500 text-sm font-medium">Data pelacakan belum tersedia dari ekspedisi.</p>
                    </div>
                )}

                {!isLoading && !error && history.length > 0 && (
                    <>
                        {getStatusCategory(summary.status) === 'RETUR' && (
                            <div className="mb-6 p-4 bg-rose-500/10 border-l-4 border-rose-500 rounded-r-xl flex gap-3">
                                <AlertOctagon className="w-5 h-5 text-rose-500 shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-rose-400 mb-1">Paket Bermasalah / Retur / Dibatalkan</p>
                                    <p className="text-xs text-rose-500/80 leading-relaxed">Status terakhir menunjukkan bahwa pengiriman gagal, dikembalikan ke pengirim, atau dibatalkan oleh pihak ekspedisi.</p>
                                </div>
                            </div>
                        )}
                        <div className="relative pl-7 border-l-2 border-zinc-800 ml-3 space-y-8">
                        {history.map((item, idx) => {
                            const isFirst = idx === 0;
                            const isDelivered = summary.status?.toUpperCase().includes('DELIVERED') && isFirst;
                            let Icon = Truck;
                            let iconColor = 'text-amber-500';
                            let bgColor = 'bg-amber-500/20 border-amber-500/50';

                            if (isDelivered) {
                                Icon = CheckCircle;
                                iconColor = 'text-emerald-500';
                                bgColor = 'bg-emerald-500/20 border-emerald-500/50';
                            } else if (item.desc.toLowerCase().includes('tiba di') || item.desc.toLowerCase().includes('sampai di')) {
                                Icon = MapPin;
                            } else if (item.desc.toLowerCase().includes('diterima')) {
                                Icon = Package;
                            }

                            if (!isFirst) {
                                iconColor = 'text-zinc-500';
                                bgColor = 'bg-zinc-900 border-zinc-700';
                            }

                            return (
                                <div key={idx} className="relative">
                                    <div className={`absolute -left-[45px] w-8 h-8 rounded-full border-2 ${bgColor} flex items-center justify-center bg-zinc-950 z-10`}>
                                        <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                                    </div>
                                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 hover:bg-white/[0.04] transition-colors">
                                        <p className="text-[10px] font-bold tracking-widest text-zinc-500 mb-1">{moment(item.date).format('DD MMM YYYY, HH:mm')}</p>
                                        <p className={`text-sm font-medium leading-relaxed ${isFirst ? 'text-white' : 'text-zinc-400'}`}>{item.desc}</p>
                                        {item.location && (
                                            <p className="text-xs font-bold text-amber-500 mt-2 flex items-center gap-1.5 uppercase tracking-wide">
                                                <MapPin className="w-3 h-3" /> {item.location}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default TrackingModal;
