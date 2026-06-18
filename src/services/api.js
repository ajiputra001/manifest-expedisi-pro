import axios from 'axios';
import { supabase } from './supabaseClient';

const BINDERBYTE_API_KEY = "3f4878c780923585911ca5155bbe44dfe6360fa47865ca535033b5d3e04295d4";

export const trackResi = async (courier, awb, forceRefresh = false) => {
  try {
    const isSPX = normalizeExpedition(courier) === 'SPX';
    const cacheKey = `manifest_cache_${courier}_${awb}`;
    
    // Jangan gunakan cache untuk SPX, biarkan selalu realtime
    if (!forceRefresh && !isSPX) {
        const cachedStr = localStorage.getItem(cacheKey);
        if (cachedStr) {
            try {
                const cachedData = JSON.parse(cachedStr);
                const status = cachedData.data?.summary?.status;
                const category = status ? getStatusCategory(status) : 'PROSES';
                
                if (category === 'TERKIRIM') {
                    return cachedData; // Permanently locked if delivered
                }
                
                const now = new Date().getTime();
                if (cachedData.timestamp && (now - cachedData.timestamp < 2 * 60 * 60 * 1000)) {
                    return cachedData; // Return cache if within 2 hours
                }
            } catch (e) {
                console.error('Cache parsing error:', e);
            }
        }
    }

    // --- INTERCEPTOR UNTUK API LOKAL SHOPEE EXPRESS ---
    if (normalizeExpedition(courier) === 'SPX') {
        const response = await axios.get(`https://shopee-express-tracking-api-ajiputra.onrender.com/api/track`, {
            params: { resi: awb }
        });
        
        if (response.data && response.data.retcode === 0 && response.data.data) {
            const spxData = response.data.data;
            
            // Map tracking_list ke format Binderbyte (history)
            const mappedHistory = (spxData.tracking_list || []).map(t => {
                // Ekstrak lokasi jika ada di dalam kurung siku, misal: "[Jakarta] Paket tiba"
                let locationStr = '';
                let cleanDesc = t.message;
                const match = t.message.match(/^\[(.*?)\]\s*(.*)/);
                if (match) {
                    locationStr = match[1];
                    cleanDesc = match[2] || t.message; // Deskripsi tanpa nama lokasi
                }
                
                return {
                    date: new Date(t.timestamp * 1000).toISOString(),
                    desc: cleanDesc,
                    location: locationStr
                };
            });
            
            // Buat struktur palsu yang meniru Binderbyte
            const simulatedData = {
                status: 200,
                message: "Successfully tracked package",
                data: {
                    summary: { 
                        awb: awb,
                        courier: "Shopee Express",
                        status: spxData.current_status || 'PROSES' 
                    },
                    history: mappedHistory
                }
            };
            
            const dataToCache = { ...simulatedData, timestamp: new Date().getTime() };
            localStorage.setItem(cacheKey, JSON.stringify(dataToCache));
            
            return simulatedData;
        } else {
            throw { message: response.data?.message || 'Resi SPX tidak ditemukan atau bermasalah' };
        }
    }
    // --- AKHIR INTERCEPTOR ---

    // Jika bukan SPX, tetap gunakan Binderbyte
    const response = await axios.get(`https://api.binderbyte.com/v1/track`, {
      params: {
        api_key: BINDERBYTE_API_KEY,
        courier: courier,
        awb: awb
      }
    });
    
    if (response.data && response.data.status === 200) {
        const dataToCache = { ...response.data, timestamp: new Date().getTime() };
        localStorage.setItem(cacheKey, JSON.stringify(dataToCache));
    }

    return response.data;
  } catch (error) {
    throw error.response?.data || error || { message: 'Gagal terhubung ke server pelacakan' };
  }
};

export const getStatusCategory = (status) => {
    if (!status) return 'PROSES';
    const s = status.toUpperCase();
    if (s.includes('DELIVERED') || s.includes('TERKIRIM') || s.includes('SUCCESS')) return 'TERKIRIM';
    if (s.includes('RETUR') || s.includes('GAGAL') || s.includes('CANCEL') || s.includes('INVALID')) return 'RETUR';
    
    const movingKeywords = [
        'DC_', 'DC ', 'DIBERANGKATKAN', 'TIBA DI', 'MENUJU', 'KELUAR DARI', 
        'TRANSIT', 'SORTIR', 'SORTATION', 'HUB', 'GATEWAY', 'SEDANG DIKIRIM', 
        'DIKIRIMKAN KE', 'PERJALANAN', 'TELAH DITERIMA OLEH DC', 'TRANSPORTING', 
        'PICKUP HUB', 'DROP OFF POINT', 'PICKED UP'
    ];
    
    if (s.includes('DIKIRIM') || s.includes('DELIVERING') || s.includes('OUT FOR DELIVERY') || s.includes('KURIR') || movingKeywords.some(kw => s.includes(kw))) return 'DIKIRIM';
    return 'PROSES';
};

export const MASTER_COURIERS = {
    SPX: { name: 'Shopee Express' },
    JNT: { name: 'J&T Express' }
};

export const normalizeExpedition = (exp) => {
    if (!exp) return '';
    const upper = exp.toUpperCase();
    if (upper === 'J&T' || upper === 'J&T EXPRESS') return 'JNT';
    if (upper === 'ID EXPRESS') return 'IDE';
    if (upper === 'NINJA XPRESS') return 'NINJA';
    if (upper === 'SHOPEE EXPRESS' || upper === 'SHOPEE') return 'SPX';
    return upper;
};

export const getCourierName = (exp) => {
    if(!exp) return 'Ekspedisi';
    const normalized = normalizeExpedition(exp);
    if(MASTER_COURIERS[normalized]) return MASTER_COURIERS[normalized].name;
    return exp;
};
