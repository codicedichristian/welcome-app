import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Falls back to a placeholder so createClient doesn't throw before real
// credentials are configured — calls will fail and api.js handles that.
export const supabase = createClient(
  supabaseUrl?.startsWith('http') ? supabaseUrl : 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-anon-key',
)
