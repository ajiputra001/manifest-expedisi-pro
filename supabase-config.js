const supabaseUrl = 'https://xohldcmeialjpbqyjkqh.supabase.co';
const supabaseKey = 'sb_publishable_uuH2LT12UxSJQUPEdpEKSg_muIrzZ8a';

// Use the global supabase object from UMD
window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
