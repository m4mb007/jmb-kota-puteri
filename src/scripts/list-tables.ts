import { Pool } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

const pool = new Pool({ connectionString })

async function listTables() {
  try {
    // List all tables
    const tables = await pool.query(`
      SELECT table_name, table_schema
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)
    
    console.log('Tables in public schema:')
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name} (schema: ${row.table_schema})`)
    })
    
    // Try to query SystemSetting directly
    console.log('\nTrying to query SystemSetting directly...')
    try {
      const result = await pool.query('SELECT * FROM "SystemSetting" LIMIT 1')
      console.log('✓ Can query SystemSetting table')
      console.log(`  Columns: ${result.fields.map(f => f.name).join(', ')}`)
    } catch (error: any) {
      console.log(`✗ Cannot query SystemSetting: ${error.message}`)
      console.log(`  Error code: ${error.code}`)
    }
    
    // Try different case variations
    const variations = ['SystemSetting', 'systemsetting', 'system_setting', 'System_Setting']
    for (const name of variations) {
      try {
        await pool.query(`SELECT 1 FROM "${name}" LIMIT 1`)
        console.log(`✓ Found table: "${name}"`)
      } catch (error: any) {
        // Ignore - table doesn't exist with this name
      }
    }
    
  } catch (error: any) {
    console.error('Error:', error.message)
  } finally {
    await pool.end()
  }
}

listTables()
  .then(() => {
    console.log('\nDone!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed:', error)
    process.exit(1)
  })

