import axios from 'axios';
import { supabase } from './supabaseClient';

const BINDERBYTE_API_KEY = "3f4878c780923585911ca5155bbe44dfe6360fa47865ca535033b5d3e04295d4";

export const trackResi = async (courier, awb, forceRefresh = false) => {
  try {
    const cacheKey = `manifest_cache_${courier}_${awb}`;
    
    if (!forceRefresh) {
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
    throw error.response?.data || { message: 'Gagal terhubung ke server pelacakan' };
  }
};

export const getStatusCategory = (status) => {
    if (!status) return 'PROSES';
    const s = status.toUpperCase();
    if (s.includes('DELIVERED') || s.includes('TERKIRIM') || s.includes('SUCCESS')) return 'TERKIRIM';
    if (s.includes('RETUR') || s.includes('GAGAL') || s.includes('CANCEL') || s.includes('INVALID')) return 'RETUR';
    return 'PROSES';
};

export const MASTER_COURIERS = {
    SPX: { name: 'Shopee Express' },
    JNT: { name: 'J&T Express' },
    JNTCARGO: { name: 'J&T Cargo' },
    SICEPAT: { name: 'SiCepat' },
    JNE: { name: 'JNE Express' },
    TIKI: { name: 'TIKI' },
    POS: { name: 'Pos Indonesia' },
    ANTERAJA: { name: 'AnterAja' },
    NINJA: { name: 'Ninja Xpress' },
    IDE: { name: 'ID Express' }
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
