// ============================================
// SUPABASE CONFIG
// Gunakan CDN UMD - tidak perlu import
// ============================================
const SUPABASE_URL = 'https://xohldcmeialjpbqyjkqh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_uuH2LT12UxSJQUPEdpEKSg_muIrzZ8a';

// Buat client global, siap dipakai oleh app.js
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
