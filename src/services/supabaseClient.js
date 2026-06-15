import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xohldcmeialjpbqyjkqh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_uuH2LT12UxSJQUPEdpEKSg_muIrzZ8a';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
