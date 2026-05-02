
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

console.log('Testing Connection...')
console.log('URL:', supabaseUrl)
console.log('Key Length:', supabaseKey ? supabaseKey.length : 0)

const supabase = createClient(supabaseUrl, supabaseKey)

async function testInsert() {
    const testSlot = '23:55' // A slot unlikely to be used
    const dateStr = new Date().toISOString().split('T')[0]

    console.log(`\nAttempting to insert test row for ${dateStr} at ${testSlot}...`)

    const { data, error } = await supabase
        .from('results')
        .insert({
            date: dateStr,
            time_slot: testSlot,
            display_time: 'Test Entry',
            xa: '00', xb: '00', xc: '00', xd: '00', xe: '00',
            xf: '00', xg: '00', xh: '00', xi: '00', xj: '00'
        })
        .select()
        .single()

    if (error) {
        console.error('❌ Insert Failed!')
        console.error('Code:', error.code)
        console.error('Message:', error.message)
        console.error('Details:', error.details)
    } else {
        console.log('✅ Insert Success!')
        console.log('Inserted Row:', data)

        // Clean up
        console.log('\nCleaning up test row...')
        const { error: delError } = await supabase
            .from('results')
            .delete()
            .eq('id', data.id)

        if (delError) console.error('Failed to cleanup:', delError.message)
        else console.log('✅ Cleanup Success')
    }
}

testInsert()
