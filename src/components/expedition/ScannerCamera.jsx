import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { XCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';

const ScannerCamera = ({ onScanSuccess, onClose }) => {
    const scannerRef = useRef(null);

    useEffect(() => {
        const html5QrCode = new Html5Qrcode("colReader");
        scannerRef.current = html5QrCode;
        
        html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 150 } },
            onScanSuccess,
            () => {} // Ignore continuous errors
        ).catch(err => {
            console.error("Camera start error:", err);
            Swal.fire({
                icon: 'error',
                title: 'Akses Kamera Gagal',
                text: 'Kamera sedang digunakan atau tidak diizinkan.',
                background: '#18181b', color: '#fff'
            });
            onClose();
        });
        
        return () => {
            if (html5QrCode) {
                try {
                    html5QrCode.stop().then(() => html5QrCode.clear()).catch(() => {});
                } catch(e) {}
            }
        };
    }, [onScanSuccess, onClose]);

    return (
        <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full mt-4 bg-zinc-950 rounded-2xl overflow-hidden border border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.2)] group"
        >
            <div id="colReader" className="w-full relative z-10 [&>video]:rounded-2xl [&>video]:w-full [&>video]:object-cover"></div>
            
            <div className="absolute inset-0 z-20 pointer-events-none">
                <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-amber-500 rounded-tl-xl m-6"></div>
                <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-amber-500 rounded-tr-xl m-6"></div>
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-amber-500 rounded-bl-xl m-6"></div>
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-amber-500 rounded-br-xl m-6"></div>
                
                <div className="absolute top-1/2 left-4 right-4 h-[2px] bg-amber-500/80 shadow-[0_0_15px_#f59e0b] -translate-y-1/2 animate-pulse"></div>
                
                <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-amber-500 text-xs font-black tracking-widest px-4 py-2 rounded-full border border-amber-500/30 flex items-center gap-2 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    CONTINUOUS SCAN MODE
                </div>
            </div>

            <button onClick={onClose} className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-rose-500/90 backdrop-blur-sm text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-[0_5px_20px_rgba(244,63,94,0.4)] hover:bg-rose-600 transition-all z-30 flex items-center gap-2 border border-rose-400/50">
                <XCircle className="w-4 h-4" /> TUTUP SCANNER
            </button>
        </motion.div>
    );
};

export default ScannerCamera;
