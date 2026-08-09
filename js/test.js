import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://eyqqslojvhwbamkmbmee.supabase.co'
const supabaseKey = 'sb_publishable_48ld-B0dGveEDZD9NTXdLg_OyHzkrQa'

const supabase = createClient(supabaseUrl,supabaseKey)

console.log(supabase)