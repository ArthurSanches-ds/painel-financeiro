import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://mwrcnndvuexmtinquamk.supabase.co'
const SUPABASE_KEY = 'sb_publishable_vUxZhPynwEEaeRQixFvsEg_3agj59pe'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)