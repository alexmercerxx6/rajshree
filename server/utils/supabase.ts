import { createClient } from '@supabase/supabase-js'

const config = useRuntimeConfig()

if (!config.supabaseUrl || !config.supabaseKey) {
    console.warn('Supabase credentials missing. Database operations will fail.')
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(
    config.supabaseUrl as string,
    config.supabaseKey as string,
    {
        auth: {
            persistSession: false,
            detectSessionInUrl: false,
        },
    }
)
