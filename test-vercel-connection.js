// Test script to check Vercel connection
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testVercelConnection() {
  try {
    console.log('Testing Vercel connection...')
    
    const { data, error } = await supabase.functions.invoke('dns-domain-manager', {
      body: {
        action: 'test_vercel_connection',
        domain: 'test.example.com',
        storeId: 'test-store-id'
      }
    })

    if (error) {
      console.error('Error:', error)
    } else {
      console.log('Result:', data)
    }
  } catch (err) {
    console.error('Exception:', err)
  }
}

testVercelConnection()
